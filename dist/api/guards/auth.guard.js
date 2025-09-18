"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authGuard = void 0;
const server_module_1 = require("@api/server.module");
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const logger = new logger_config_1.Logger('GUARD');
async function apikey(req, _, next) {
    const env = env_config_1.configService.get('AUTHENTICATION').API_KEY;
    const key = req.get('apikey');
    const db = env_config_1.configService.get('DATABASE');
    if (!key) {
        throw new _exceptions_1.UnauthorizedException();
    }
    if (env.KEY === key) {
        return next();
    }
    if ((req.originalUrl.includes('/instance/create') || req.originalUrl.includes('/instance/fetchInstances')) && !key) {
        throw new _exceptions_1.ForbiddenException('Missing global api key', 'The global api key must be set');
    }
    const param = req.params;
    try {
        if (env_config_1.configService.get('DATABASE_ENABLED') === 'true') {
            if (param?.instanceName) {
                const instance = await server_module_1.prismaRepository.instance.findUnique({
                    where: { name: param.instanceName },
                });
                if (instance.token === key) {
                    return next();
                }
            }
            else {
                if (req.originalUrl.includes('/instance/fetchInstances') && db.SAVE_DATA.INSTANCE) {
                    const instanceByKey = await server_module_1.prismaRepository.instance.findFirst({
                        where: { token: key },
                    });
                    if (instanceByKey) {
                        return next();
                    }
                }
            }
        }
    }
    catch (error) {
        logger.error(error);
    }
    throw new _exceptions_1.UnauthorizedException();
}
exports.authGuard = { apikey };
