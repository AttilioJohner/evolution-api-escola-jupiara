"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitmqController = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const amqp = __importStar(require("amqplib/callback_api"));
const event_controller_1 = require("../event.controller");
class RabbitmqController extends event_controller_1.EventController {
    constructor(prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor, env_config_1.configService.get('RABBITMQ')?.ENABLED, 'rabbitmq');
        this.amqpChannel = null;
        this.amqpConnection = null;
        this.logger = new logger_config_1.Logger('RabbitmqController');
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        this.isReconnecting = false;
    }
    async init() {
        if (!this.status) {
            return;
        }
        await this.connect();
    }
    async connect() {
        return new Promise((resolve, reject) => {
            const uri = env_config_1.configService.get('RABBITMQ').URI;
            const frameMax = env_config_1.configService.get('RABBITMQ').FRAME_MAX;
            const rabbitmqExchangeName = env_config_1.configService.get('RABBITMQ').EXCHANGE_NAME;
            const url = new URL(uri);
            const connectionOptions = {
                protocol: url.protocol.slice(0, -1),
                hostname: url.hostname,
                port: url.port || 5672,
                username: url.username || 'guest',
                password: url.password || 'guest',
                vhost: url.pathname.slice(1) || '/',
                frameMax: frameMax,
                heartbeat: 30,
            };
            amqp.connect(connectionOptions, (error, connection) => {
                if (error) {
                    this.logger.error({
                        local: 'RabbitmqController.connect',
                        message: 'Failed to connect to RabbitMQ',
                        error: error.message || error,
                    });
                    reject(error);
                    return;
                }
                connection.on('error', (err) => {
                    this.logger.error({
                        local: 'RabbitmqController.connectionError',
                        message: 'RabbitMQ connection error',
                        error: err.message || err,
                    });
                    this.handleConnectionLoss();
                });
                connection.on('close', () => {
                    this.logger.warn('RabbitMQ connection closed');
                    this.handleConnectionLoss();
                });
                connection.createChannel((channelError, channel) => {
                    if (channelError) {
                        this.logger.error({
                            local: 'RabbitmqController.createChannel',
                            message: 'Failed to create RabbitMQ channel',
                            error: channelError.message || channelError,
                        });
                        reject(channelError);
                        return;
                    }
                    channel.on('error', (err) => {
                        this.logger.error({
                            local: 'RabbitmqController.channelError',
                            message: 'RabbitMQ channel error',
                            error: err.message || err,
                        });
                        this.handleConnectionLoss();
                    });
                    channel.on('close', () => {
                        this.logger.warn('RabbitMQ channel closed');
                        this.handleConnectionLoss();
                    });
                    const exchangeName = rabbitmqExchangeName;
                    channel.assertExchange(exchangeName, 'topic', {
                        durable: true,
                        autoDelete: false,
                    });
                    this.amqpConnection = connection;
                    this.amqpChannel = channel;
                    this.reconnectAttempts = 0;
                    this.isReconnecting = false;
                    this.logger.info('AMQP initialized successfully');
                    resolve();
                });
            });
        })
            .then(() => {
            if (env_config_1.configService.get('RABBITMQ')?.GLOBAL_ENABLED) {
                this.initGlobalQueues();
            }
        })
            .catch((error) => {
            this.logger.error({
                local: 'RabbitmqController.init',
                message: 'Failed to initialize AMQP',
                error: error.message || error,
            });
            this.scheduleReconnect();
            throw error;
        });
    }
    handleConnectionLoss() {
        if (this.isReconnecting) {
            return;
        }
        this.cleanup();
        this.scheduleReconnect();
    }
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached. Stopping reconnection attempts.`);
            return;
        }
        if (this.isReconnecting) {
            return;
        }
        this.isReconnecting = true;
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, Math.min(this.reconnectAttempts - 1, 5));
        this.logger.info(`Scheduling RabbitMQ reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
        setTimeout(async () => {
            try {
                this.logger.info(`Attempting to reconnect to RabbitMQ (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                await this.connect();
                this.logger.info('Successfully reconnected to RabbitMQ');
            }
            catch (error) {
                this.logger.error({
                    local: 'RabbitmqController.scheduleReconnect',
                    message: `Reconnection attempt ${this.reconnectAttempts} failed`,
                    error: error.message || error,
                });
                this.isReconnecting = false;
                this.scheduleReconnect();
            }
        }, delay);
    }
    set channel(channel) {
        this.amqpChannel = channel;
    }
    get channel() {
        return this.amqpChannel;
    }
    async ensureConnection() {
        if (!this.amqpChannel) {
            this.logger.warn('AMQP channel is not available, attempting to reconnect...');
            if (!this.isReconnecting) {
                this.scheduleReconnect();
            }
            return false;
        }
        return true;
    }
    async emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, integration, }) {
        if (integration && !integration.includes('rabbitmq')) {
            return;
        }
        if (!this.status) {
            return;
        }
        if (!(await this.ensureConnection())) {
            this.logger.warn(`Failed to emit event ${event} for instance ${instanceName}: No AMQP connection`);
            return;
        }
        const instanceRabbitmq = await this.get(instanceName);
        const rabbitmqLocal = instanceRabbitmq?.events;
        const rabbitmqGlobal = env_config_1.configService.get('RABBITMQ').GLOBAL_ENABLED;
        const rabbitmqEvents = env_config_1.configService.get('RABBITMQ').EVENTS;
        const prefixKey = env_config_1.configService.get('RABBITMQ').PREFIX_KEY;
        const rabbitmqExchangeName = env_config_1.configService.get('RABBITMQ').EXCHANGE_NAME;
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
        if (instanceRabbitmq?.enabled && this.amqpChannel) {
            if (Array.isArray(rabbitmqLocal) && rabbitmqLocal.includes(we)) {
                const exchangeName = instanceName ?? rabbitmqExchangeName;
                let retry = 0;
                while (retry < 3) {
                    try {
                        await this.amqpChannel.assertExchange(exchangeName, 'topic', {
                            durable: true,
                            autoDelete: false,
                        });
                        const eventName = event.replace(/_/g, '.').toLowerCase();
                        const queueName = `${instanceName}.${eventName}`;
                        await this.amqpChannel.assertQueue(queueName, {
                            durable: true,
                            autoDelete: false,
                            arguments: {
                                'x-queue-type': 'quorum',
                            },
                        });
                        await this.amqpChannel.bindQueue(queueName, exchangeName, eventName);
                        await this.amqpChannel.publish(exchangeName, event, Buffer.from(JSON.stringify(message)));
                        if (logEnabled) {
                            const logData = {
                                local: `${origin}.sendData-RabbitMQ`,
                                ...message,
                            };
                            this.logger.log(logData);
                        }
                        break;
                    }
                    catch (error) {
                        this.logger.error({
                            local: 'RabbitmqController.emit',
                            message: `Error publishing local RabbitMQ message (attempt ${retry + 1}/3)`,
                            error: error.message || error,
                        });
                        retry++;
                        if (retry >= 3) {
                            this.handleConnectionLoss();
                        }
                    }
                }
            }
        }
        if (rabbitmqGlobal && rabbitmqEvents[we] && this.amqpChannel) {
            const exchangeName = rabbitmqExchangeName;
            let retry = 0;
            while (retry < 3) {
                try {
                    await this.amqpChannel.assertExchange(exchangeName, 'topic', {
                        durable: true,
                        autoDelete: false,
                    });
                    const queueName = prefixKey
                        ? `${prefixKey}.${event.replace(/_/g, '.').toLowerCase()}`
                        : event.replace(/_/g, '.').toLowerCase();
                    await this.amqpChannel.assertQueue(queueName, {
                        durable: true,
                        autoDelete: false,
                        arguments: {
                            'x-queue-type': 'quorum',
                        },
                    });
                    await this.amqpChannel.bindQueue(queueName, exchangeName, event);
                    await this.amqpChannel.publish(exchangeName, event, Buffer.from(JSON.stringify(message)));
                    if (logEnabled) {
                        const logData = {
                            local: `${origin}.sendData-RabbitMQ-Global`,
                            ...message,
                        };
                        this.logger.log(logData);
                    }
                    break;
                }
                catch (error) {
                    this.logger.error({
                        local: 'RabbitmqController.emit',
                        message: `Error publishing global RabbitMQ message (attempt ${retry + 1}/3)`,
                        error: error.message || error,
                    });
                    retry++;
                    if (retry >= 3) {
                        this.handleConnectionLoss();
                    }
                }
            }
        }
    }
    async initGlobalQueues() {
        this.logger.info('Initializing global queues');
        if (!(await this.ensureConnection())) {
            this.logger.error('Cannot initialize global queues: No AMQP connection');
            return;
        }
        const rabbitmqExchangeName = env_config_1.configService.get('RABBITMQ').EXCHANGE_NAME;
        const events = env_config_1.configService.get('RABBITMQ').EVENTS;
        const prefixKey = env_config_1.configService.get('RABBITMQ').PREFIX_KEY;
        if (!events) {
            this.logger.warn('No events to initialize on AMQP');
            return;
        }
        const eventKeys = Object.keys(events);
        for (const event of eventKeys) {
            if (events[event] === false)
                continue;
            try {
                const queueName = prefixKey !== ''
                    ? `${prefixKey}.${event.replace(/_/g, '.').toLowerCase()}`
                    : `${event.replace(/_/g, '.').toLowerCase()}`;
                const exchangeName = rabbitmqExchangeName;
                await this.amqpChannel.assertExchange(exchangeName, 'topic', {
                    durable: true,
                    autoDelete: false,
                });
                await this.amqpChannel.assertQueue(queueName, {
                    durable: true,
                    autoDelete: false,
                    arguments: {
                        'x-queue-type': 'quorum',
                    },
                });
                await this.amqpChannel.bindQueue(queueName, exchangeName, event);
                this.logger.info(`Global queue initialized: ${queueName}`);
            }
            catch (error) {
                this.logger.error({
                    local: 'RabbitmqController.initGlobalQueues',
                    message: `Failed to initialize global queue for event ${event}`,
                    error: error.message || error,
                });
                this.handleConnectionLoss();
                break;
            }
        }
    }
    async cleanup() {
        try {
            if (this.amqpChannel) {
                await this.amqpChannel.close();
                this.amqpChannel = null;
            }
            if (this.amqpConnection) {
                await this.amqpConnection.close();
                this.amqpConnection = null;
            }
        }
        catch (error) {
            this.logger.warn({
                local: 'RabbitmqController.cleanup',
                message: 'Error during cleanup',
                error: error.message || error,
            });
            this.amqpChannel = null;
            this.amqpConnection = null;
        }
    }
}
exports.RabbitmqController = RabbitmqController;
