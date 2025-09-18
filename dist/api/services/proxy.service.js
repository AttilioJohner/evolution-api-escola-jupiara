"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyService = void 0;
const logger_config_1 = require("@config/logger.config");
class ProxyService {
    constructor(waMonitor) {
        this.waMonitor = waMonitor;
        this.logger = new logger_config_1.Logger('ProxyService');
    }
    create(instance, data) {
        this.waMonitor.waInstances[instance.instanceName].setProxy(data);
        return { proxy: { ...instance, proxy: data } };
    }
    async find(instance) {
        try {
            const result = await this.waMonitor.waInstances[instance.instanceName].findProxy();
            if (Object.keys(result).length === 0) {
                throw new Error('Proxy not found');
            }
            return result;
        }
        catch (error) {
            return null;
        }
    }
}
exports.ProxyService = ProxyService;
