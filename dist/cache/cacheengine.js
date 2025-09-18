"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheEngine = void 0;
const logger_config_1 = require("@config/logger.config");
const localcache_1 = require("./localcache");
const rediscache_1 = require("./rediscache");
const logger = new logger_config_1.Logger('CacheEngine');
class CacheEngine {
    constructor(configService, module) {
        this.configService = configService;
        const cacheConf = configService.get('CACHE');
        if (cacheConf?.REDIS?.ENABLED && cacheConf?.REDIS?.URI !== '') {
            logger.verbose(`RedisCache initialized for ${module}`);
            this.engine = new rediscache_1.RedisCache(configService, module);
        }
        else if (cacheConf?.LOCAL?.ENABLED) {
            logger.verbose(`LocalCache initialized for ${module}`);
            this.engine = new localcache_1.LocalCache(configService, module);
        }
    }
    getEngine() {
        return this.engine;
    }
}
exports.CacheEngine = CacheEngine;
