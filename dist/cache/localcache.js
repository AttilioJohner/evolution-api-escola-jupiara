"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalCache = void 0;
const logger_config_1 = require("@config/logger.config");
const baileys_1 = require("baileys");
const node_cache_1 = __importDefault(require("node-cache"));
class LocalCache {
    constructor(configService, module) {
        this.configService = configService;
        this.module = module;
        this.logger = new logger_config_1.Logger('LocalCache');
        this.conf = this.configService.get('CACHE')?.LOCAL;
    }
    async get(key) {
        return LocalCache.localCache.get(this.buildKey(key));
    }
    async set(key, value, ttl) {
        return LocalCache.localCache.set(this.buildKey(key), value, ttl || this.conf.TTL);
    }
    async has(key) {
        return LocalCache.localCache.has(this.buildKey(key));
    }
    async delete(key) {
        return LocalCache.localCache.del(this.buildKey(key));
    }
    async deleteAll(appendCriteria) {
        const keys = await this.keys(appendCriteria);
        if (!keys?.length) {
            return 0;
        }
        return LocalCache.localCache.del(keys);
    }
    async keys(appendCriteria) {
        const filter = `${this.buildKey('')}${appendCriteria ? `${appendCriteria}:` : ''}`;
        return LocalCache.localCache.keys().filter((key) => key.substring(0, filter.length) === filter);
    }
    buildKey(key) {
        return `${this.module}:${key}`;
    }
    async hGet(key, field) {
        try {
            const data = LocalCache.localCache.get(this.buildKey(key));
            if (data && field in data) {
                return JSON.parse(data[field], baileys_1.BufferJSON.reviver);
            }
            return null;
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async hSet(key, field, value) {
        try {
            const json = JSON.stringify(value, baileys_1.BufferJSON.replacer);
            let hash = LocalCache.localCache.get(this.buildKey(key));
            if (!hash) {
                hash = {};
            }
            hash[field] = json;
            LocalCache.localCache.set(this.buildKey(key), hash);
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async hDelete(key, field) {
        try {
            const data = LocalCache.localCache.get(this.buildKey(key));
            if (data && field in data) {
                delete data[field];
                LocalCache.localCache.set(this.buildKey(key), data);
                return 1;
            }
            return 0;
        }
        catch (error) {
            this.logger.error(error);
        }
    }
}
exports.LocalCache = LocalCache;
LocalCache.localCache = new node_cache_1.default();
