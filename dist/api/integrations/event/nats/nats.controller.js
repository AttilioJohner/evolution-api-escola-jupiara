"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsController = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const nats_1 = require("nats");
const event_controller_1 = require("../event.controller");
class NatsController extends event_controller_1.EventController {
    constructor(prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor, env_config_1.configService.get('NATS')?.ENABLED, 'nats');
        this.natsClient = null;
        this.logger = new logger_config_1.Logger('NatsController');
        this.sc = (0, nats_1.StringCodec)();
    }
    async init() {
        if (!this.status) {
            return;
        }
        try {
            const uri = env_config_1.configService.get('NATS').URI;
            this.natsClient = await (0, nats_1.connect)({ servers: uri });
            this.logger.info('NATS initialized');
            if (env_config_1.configService.get('NATS')?.GLOBAL_ENABLED) {
                await this.initGlobalSubscriptions();
            }
        }
        catch (error) {
            this.logger.error('Failed to connect to NATS:');
            this.logger.error(error);
            throw error;
        }
    }
    async emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, integration, }) {
        if (integration && !integration.includes('nats')) {
            return;
        }
        if (!this.status || !this.natsClient) {
            return;
        }
        const instanceNats = await this.get(instanceName);
        const natsLocal = instanceNats?.events;
        const natsGlobal = env_config_1.configService.get('NATS').GLOBAL_ENABLED;
        const natsEvents = env_config_1.configService.get('NATS').EVENTS;
        const prefixKey = env_config_1.configService.get('NATS').PREFIX_KEY;
        const we = event.replace(/[.-]/gm, '_').toUpperCase();
        const logEnabled = env_config_1.configService.get('LOG').LEVEL.includes('WEBHOOKS');
        const message = {
            event,
            instance: instanceName,
            data,
            server_url: serverUrl,
            date_time: dateTime,
            sender,
            apikey: apiKey,
        };
        if (instanceNats?.enabled) {
            if (Array.isArray(natsLocal) && natsLocal.includes(we)) {
                const subject = `${instanceName}.${event.toLowerCase()}`;
                try {
                    this.natsClient.publish(subject, this.sc.encode(JSON.stringify(message)));
                    if (logEnabled) {
                        const logData = {
                            local: `${origin}.sendData-NATS`,
                            ...message,
                        };
                        this.logger.log(logData);
                    }
                }
                catch (error) {
                    this.logger.error(`Failed to publish to NATS (instance): ${error}`);
                }
            }
        }
        if (natsGlobal && natsEvents[we]) {
            try {
                const subject = prefixKey ? `${prefixKey}.${event.toLowerCase()}` : event.toLowerCase();
                this.natsClient.publish(subject, this.sc.encode(JSON.stringify(message)));
                if (logEnabled) {
                    const logData = {
                        local: `${origin}.sendData-NATS-Global`,
                        ...message,
                    };
                    this.logger.log(logData);
                }
            }
            catch (error) {
                this.logger.error(`Failed to publish to NATS (global): ${error}`);
            }
        }
    }
    async initGlobalSubscriptions() {
        this.logger.info('Initializing global subscriptions');
        const events = env_config_1.configService.get('NATS').EVENTS;
        const prefixKey = env_config_1.configService.get('NATS').PREFIX_KEY;
        if (!events) {
            this.logger.warn('No events to initialize on NATS');
            return;
        }
        const eventKeys = Object.keys(events);
        for (const event of eventKeys) {
            if (events[event] === false)
                continue;
            const subject = prefixKey ? `${prefixKey}.${event.toLowerCase()}` : event.toLowerCase();
            try {
                const subscription = this.natsClient.subscribe(subject);
                this.logger.info(`Subscribed to: ${subject}`);
                (async () => {
                    for await (const msg of subscription) {
                        try {
                            const data = JSON.parse(this.sc.decode(msg.data));
                            this.logger.debug(`Received message on ${subject}:`);
                            this.logger.debug(data);
                        }
                        catch (error) {
                            this.logger.error(`Error processing message on ${subject}:`);
                            this.logger.error(error);
                        }
                    }
                })();
            }
            catch (error) {
                this.logger.error(`Failed to subscribe to ${subject}:`);
                this.logger.error(error);
            }
        }
    }
}
exports.NatsController = NatsController;
