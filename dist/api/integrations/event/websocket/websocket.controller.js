"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsocketController = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const socket_io_1 = require("socket.io");
const event_controller_1 = require("../event.controller");
class WebsocketController extends event_controller_1.EventController {
    constructor(prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor, env_config_1.configService.get('WEBSOCKET')?.ENABLED, 'websocket');
        this.logger = new logger_config_1.Logger('WebsocketController');
        this.cors = env_config_1.configService.get('CORS').ORIGIN;
    }
    init(httpServer) {
        if (!this.status) {
            return;
        }
        this.socket = new socket_io_1.Server(httpServer, {
            cors: { origin: this.cors },
            allowRequest: async (req, callback) => {
                try {
                    const url = new URL(req.url || '', 'http://localhost');
                    const params = new URLSearchParams(url.search);
                    const { remoteAddress } = req.socket;
                    const isLocalhost = remoteAddress === '127.0.0.1' || remoteAddress === '::1' || remoteAddress === '::ffff:127.0.0.1';
                    if (params.has('EIO') && isLocalhost) {
                        return callback(null, true);
                    }
                    const apiKey = params.get('apikey') || req.headers.apikey;
                    if (!apiKey) {
                        this.logger.error('Connection rejected: apiKey not provided');
                        return callback('apiKey is required', false);
                    }
                    const instance = await this.prismaRepository.instance.findFirst({ where: { token: apiKey } });
                    if (!instance) {
                        const globalToken = env_config_1.configService.get('AUTHENTICATION').API_KEY.KEY;
                        if (apiKey !== globalToken) {
                            this.logger.error('Connection rejected: invalid global token');
                            return callback('Invalid global token', false);
                        }
                    }
                    callback(null, true);
                }
                catch (error) {
                    this.logger.error('Authentication error:');
                    this.logger.error(error);
                    callback('Authentication error', false);
                }
            },
        });
        this.socket.on('connection', (socket) => {
            this.logger.info('User connected');
            socket.on('disconnect', () => {
                this.logger.info('User disconnected');
            });
            socket.on('sendNode', async (data) => {
                try {
                    await this.waMonitor.waInstances[data.instanceId].baileysSendNode(data.stanza);
                    this.logger.info('Node sent successfully');
                }
                catch (error) {
                    this.logger.error('Error sending node:');
                    this.logger.error(error);
                }
            });
        });
        this.logger.info('Socket.io initialized');
    }
    set cors(cors) {
        this.corsConfig = cors;
    }
    get cors() {
        return this.corsConfig?.includes('*') ? '*' : this.corsConfig;
    }
    set socket(socket) {
        this.io = socket;
    }
    get socket() {
        return this.io;
    }
    async emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, integration, }) {
        if (integration && !integration.includes('websocket')) {
            return;
        }
        if (!this.status) {
            return;
        }
        const configEv = event.replace(/[.-]/gm, '_').toUpperCase();
        const logEnabled = env_config_1.configService.get('LOG').LEVEL.includes('WEBSOCKET');
        const message = {
            event,
            instance: instanceName,
            data,
            server_url: serverUrl,
            date_time: dateTime,
            sender,
            apikey: apiKey,
        };
        if (env_config_1.configService.get('WEBSOCKET')?.GLOBAL_EVENTS) {
            this.socket.emit(event, message);
            if (logEnabled) {
                this.logger.log({ local: `${origin}.sendData-WebsocketGlobal`, ...message });
            }
        }
        try {
            const instance = await this.get(instanceName);
            if (!instance?.enabled) {
                return;
            }
            if (Array.isArray(instance?.events) && instance?.events.includes(configEv)) {
                this.socket.of(`/${instanceName}`).emit(event, message);
                if (logEnabled) {
                    this.logger.log({ local: `${origin}.sendData-Websocket`, ...message });
                }
            }
        }
        catch (err) {
            if (logEnabled) {
                this.logger.log(err);
            }
        }
    }
}
exports.WebsocketController = WebsocketController;
