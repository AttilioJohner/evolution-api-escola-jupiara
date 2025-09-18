"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
const logger_config_1 = require("@config/logger.config");
const baileys_1 = require("baileys");
const rediscache_client_1 = require("./rediscache.client");
class RedisCache {
    constructor(configService, module) {
        this.configService = configService;
        this.module = module;
        this.logger = new logger_config_1.Logger('RedisCache');
        this.conf = this.configService.get('CACHE')?.REDIS;
        this.client = rediscache_client_1.redisClient.getConnection();
    }
    async get(key) {
        try {
            return JSON.parse(await this.client.get(this.buildKey(key)));
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async hGet(key, field) {
        try {
            const data = await this.client.hGet(this.buildKey(key), field);
            if (data) {
                return JSON.parse(data, baileys_1.BufferJSON.reviver);
            }
            return null;
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async set(key, value, ttl) {
        try {
            await this.client.setEx(this.buildKey(key), ttl || this.conf?.TTL, JSON.stringify(value));
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async hSet(key, field, value) {
        try {
            const json = JSON.stringify(value, baileys_1.BufferJSON.replacer);
            await this.client.hSet(this.buildKey(key), field, json);
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async has(key) {
        try {
            return (await this.client.exists(this.buildKey(key))) > 0;
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async delete(key) {
        try {
            return await this.client.del(this.buildKey(key));
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async hDelete(key, field) {
        try {
            return await this.client.hDel(this.buildKey(key), field);
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async deleteAll(appendCriteria) {
        try {
            const keys = await this.keys(appendCriteria);
            if (!keys?.length) {
                return 0;
            }
            return await this.client.del(keys);
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async keys(appendCriteria) {
        try {
            const match = `${this.buildKey('')}${appendCriteria ? `${appendCriteria}:` : ''}*`;
            const keys = [];
            for await (const key of this.client.scanIterator({
                MATCH: match,
                COUNT: 100,
            })) {
                keys.push(key);
            }
            return [...new Set(keys)];
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    buildKey(key) {
        return `${this.conf?.PREFIX_KEY}:${this.module}:${key}`;
    }
}
exports.RedisCache = RedisCache;
