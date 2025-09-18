"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const redis_1 = require("redis");
class Redis {
    constructor() {
        this.logger = new logger_config_1.Logger('Redis');
        this.client = null;
        this.connected = false;
        this.conf = env_config_1.configService.get('CACHE')?.REDIS;
    }
    getConnection() {
        if (this.connected) {
            return this.client;
        }
        else {
            this.client = (0, redis_1.createClient)({
                url: this.conf.URI,
            });
            this.client.on('connect', () => {
                this.logger.verbose('redis connecting');
            });
            this.client.on('ready', () => {
                this.logger.verbose('redis ready');
                this.connected = true;
            });
            this.client.on('error', () => {
                this.logger.error('redis disconnected');
                this.connected = false;
            });
            this.client.on('end', () => {
                this.logger.verbose('redis connection ended');
                this.connected = false;
            });
            try {
                this.client.connect();
                this.connected = true;
            }
            catch (e) {
                this.connected = false;
                this.logger.error('redis connect exception caught: ' + e);
                return null;
            }
            return this.client;
        }
    }
}
exports.redisClient = new Redis();
