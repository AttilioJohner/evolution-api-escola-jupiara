"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instanceExistsGuard = instanceExistsGuard;
exports.instanceLoggedGuard = instanceLoggedGuard;
const server_module_1 = require("@api/server.module");
const env_config_1 = require("@config/env.config");
const _exceptions_1 = require("@exceptions");
async function getInstance(instanceName) {
    try {
        const cacheConf = env_config_1.configService.get('CACHE');
        const exists = !!server_module_1.waMonitor.waInstances[instanceName];
        if (cacheConf.REDIS.ENABLED && cacheConf.REDIS.SAVE_INSTANCES) {
            const keyExists = await server_module_1.cache.has(instanceName);
            return exists || keyExists;
        }
        if (env_config_1.configService.get('DATABASE_ENABLED') === 'true') {
            return exists || (await server_module_1.prismaRepository.instance.findMany({ where: { name: instanceName } })).length > 0;
        }
        else {
            return exists;
        }
    }
    catch (error) {
        throw new _exceptions_1.InternalServerErrorException(error?.toString());
    }
}
async function instanceExistsGuard(req, _, next) {
    if (req.originalUrl.includes('/instance/create') || req.originalUrl.includes('/instance/fetchInstances')) {
        return next();
    }
    const param = req.params;
    if (!param?.instanceName) {
        throw new _exceptions_1.BadRequestException('"instanceName" not provided.');
    }
    if (!(await getInstance(param.instanceName))) {
        throw new _exceptions_1.NotFoundException(`The "${param.instanceName}" instance does not exist`);
    }
    next();
}
async function instanceLoggedGuard(req, _, next) {
    if (req.originalUrl.includes('/instance/create')) {
        const instance = req.body;
        if (await getInstance(instance.instanceName)) {
            throw new _exceptions_1.ForbiddenException(`This name "${instance.instanceName}" is already in use.`);
        }
        if (server_module_1.waMonitor.waInstances[instance.instanceName]) {
            delete server_module_1.waMonitor.waInstances[instance.instanceName];
        }
    }
    next();
}
