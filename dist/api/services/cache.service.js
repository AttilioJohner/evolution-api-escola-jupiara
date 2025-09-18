"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const logger_config_1 = require("@config/logger.config");
const baileys_1 = require("baileys");
class CacheService {
    constructor(cache) {
        this.cache = cache;
        this.logger = new logger_config_1.Logger('CacheService');
        if (cache) {
            this.logger.verbose(`cacheservice created using cache engine: ${cache.constructor?.name}`);
        }
        else {
            this.logger.verbose(`cacheservice disabled`);
        }
    }
    async get(key) {
        if (!this.cache) {
            return;
        }
        return this.cache.get(key);
    }
    async hGet(key, field) {
        if (!this.cache) {
            return null;
        }
        try {
            const data = await this.cache.hGet(key, field);
            if (data) {
                return JSON.parse(data, baileys_1.BufferJSON.reviver);
            }
            return null;
        }
        catch (error) {
            this.logger.error(error);
            return null;
        }
    }
    async set(key, value, ttl) {
        if (!this.cache) {
            return;
        }
        this.cache.set(key, value, ttl);
    }
    async hSet(key, field, value) {
        if (!this.cache) {
            return;
        }
        try {
            const json = JSON.stringify(value, baileys_1.BufferJSON.replacer);
            await this.cache.hSet(key, field, json);
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async has(key) {
        if (!this.cache) {
            return;
        }
        return this.cache.has(key);
    }
    async delete(key) {
        if (!this.cache) {
            return;
        }
        return this.cache.delete(key);
    }
    async hDelete(key, field) {
        if (!this.cache) {
            return false;
        }
        try {
            await this.cache.hDelete(key, field);
            return true;
        }
        catch (error) {
            this.logger.error(error);
            return false;
        }
    }
    async deleteAll(appendCriteria) {
        if (!this.cache) {
            return;
        }
        return this.cache.deleteAll(appendCriteria);
    }
    async keys(appendCriteria) {
        if (!this.cache) {
            return;
        }
        return this.cache.keys(appendCriteria);
    }
}
exports.CacheService = CacheService;
