"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PusherController = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const pusher_1 = __importDefault(require("pusher"));
const event_controller_1 = require("../event.controller");
class PusherController extends event_controller_1.EventController {
    constructor(prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor, env_config_1.configService.get('PUSHER')?.ENABLED, 'pusher');
        this.logger = new logger_config_1.Logger('PusherController');
        this.pusherClients = {};
        this.globalPusherClient = null;
        this.pusherConfig = env_config_1.configService.get('PUSHER');
        this.init();
    }
    async init() {
        if (!this.status) {
            return;
        }
        if (this.pusherConfig.GLOBAL?.ENABLED) {
            const { APP_ID, KEY, SECRET, CLUSTER, USE_TLS } = this.pusherConfig.GLOBAL;
            if (APP_ID && KEY && SECRET && CLUSTER) {
                this.globalPusherClient = new pusher_1.default({
                    appId: APP_ID,
                    key: KEY,
                    secret: SECRET,
                    cluster: CLUSTER,
                    useTLS: USE_TLS,
                });
                this.logger.info('Pusher global client initialized');
            }
        }
        const instances = await this.prismaRepository.instance.findMany({
            where: {
                Pusher: {
                    isNot: null,
                },
            },
            include: {
                Pusher: true,
            },
        });
        instances.forEach((instance) => {
            if (instance.Pusher.enabled &&
                instance.Pusher.appId &&
                instance.Pusher.key &&
                instance.Pusher.secret &&
                instance.Pusher.cluster) {
                this.pusherClients[instance.name] = new pusher_1.default({
                    appId: instance.Pusher.appId,
                    key: instance.Pusher.key,
                    secret: instance.Pusher.secret,
                    cluster: instance.Pusher.cluster,
                    useTLS: instance.Pusher.useTLS,
                });
                this.logger.info(`Pusher client initialized for instance ${instance.name}`);
            }
            else {
                delete this.pusherClients[instance.name];
                this.logger.warn(`Pusher client disabled or misconfigured for instance ${instance.name}`);
            }
        });
    }
    async set(instanceName, data) {
        if (!data.pusher?.enabled) {
            data.pusher.events = [];
        }
        else if (data.pusher.events.length === 0) {
            data.pusher.events = event_controller_1.EventController.events;
        }
        const instance = await this.prisma.pusher.upsert({
            where: {
                instanceId: this.monitor.waInstances[instanceName].instanceId,
            },
            update: {
                enabled: data.pusher.enabled,
                events: data.pusher.events,
                appId: data.pusher.appId,
                key: data.pusher.key,
                secret: data.pusher.secret,
                cluster: data.pusher.cluster,
                useTLS: data.pusher.useTLS,
            },
            create: {
                enabled: data.pusher.enabled,
                events: data.pusher.events,
                instanceId: this.monitor.waInstances[instanceName].instanceId,
                appId: data.pusher.appId,
                key: data.pusher.key,
                secret: data.pusher.secret,
                cluster: data.pusher.cluster,
                useTLS: data.pusher.useTLS,
            },
        });
        if (instance.enabled && instance.appId && instance.key && instance.secret && instance.cluster) {
            this.pusherClients[instanceName] = new pusher_1.default({
                appId: instance.appId,
                key: instance.key,
                secret: instance.secret,
                cluster: instance.cluster,
                useTLS: instance.useTLS,
            });
            this.logger.info(`Pusher client initialized for instance ${instanceName}`);
        }
        else {
            delete this.pusherClients[instanceName];
            this.logger.warn(`Pusher client disabled or misconfigured for instance ${instanceName}`);
        }
        return instance;
    }
    async emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, local, integration, }) {
        if (integration && !integration.includes('pusher')) {
            return;
        }
        if (!this.status) {
            return;
        }
        const instance = (await this.get(instanceName));
        const we = event.replace(/[.-]/gm, '_').toUpperCase();
        const enabledLog = env_config_1.configService.get('LOG').LEVEL.includes('WEBHOOKS');
        const eventName = event.replace(/_/g, '.').toLowerCase();
        const pusherData = {
            event,
            instance: instanceName,
            data,
            destination: instance?.appId || this.pusherConfig.GLOBAL?.APP_ID,
            date_time: dateTime,
            sender,
            server_url: serverUrl,
            apikey: apiKey,
        };
        if (event == 'qrcode.updated') {
            delete pusherData.data.qrcode.base64;
        }
        const payload = JSON.stringify(pusherData);
        const payloadSize = Buffer.byteLength(payload, 'utf8');
        const MAX_SIZE = 10240;
        if (payloadSize > MAX_SIZE) {
            this.logger.error({
                local: `${origin}.sendData-Pusher`,
                message: 'Payload size exceeds Pusher limit',
                event,
                instanceName,
                payloadSize,
            });
            return;
        }
        if (local && instance && instance.enabled) {
            const pusherLocalEvents = instance.events;
            if (Array.isArray(pusherLocalEvents) && pusherLocalEvents.includes(we)) {
                if (enabledLog) {
                    this.logger.log({
                        local: `${origin}.sendData-Pusher`,
                        appId: instance.appId,
                        ...pusherData,
                    });
                }
                try {
                    const pusher = this.pusherClients[instanceName];
                    if (pusher) {
                        pusher.trigger(instanceName, eventName, pusherData);
                    }
                    else {
                        this.logger.error(`Pusher client not found for instance ${instanceName}`);
                    }
                }
                catch (error) {
                    this.logger.error({
                        local: `${origin}.sendData-Pusher`,
                        message: error?.message,
                        error,
                    });
                }
            }
        }
        if (this.pusherConfig.GLOBAL?.ENABLED) {
            const globalEvents = this.pusherConfig.EVENTS;
            if (globalEvents[we]) {
                if (enabledLog) {
                    this.logger.log({
                        local: `${origin}.sendData-Pusher-Global`,
                        appId: this.pusherConfig.GLOBAL?.APP_ID,
                        ...pusherData,
                    });
                }
                try {
                    if (this.globalPusherClient) {
                        this.globalPusherClient.trigger(instanceName, eventName, pusherData);
                    }
                    else {
                        this.logger.error('Global Pusher client not initialized');
                    }
                }
                catch (error) {
                    this.logger.error({
                        local: `${origin}.sendData-Pusher-Global`,
                        message: error?.message,
                        error,
                    });
                }
            }
        }
    }
}
exports.PusherController = PusherController;
