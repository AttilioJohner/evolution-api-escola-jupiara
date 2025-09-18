"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const logger_config_1 = require("@config/logger.config");
class SettingsService {
    constructor(waMonitor) {
        this.waMonitor = waMonitor;
        this.logger = new logger_config_1.Logger('SettingsService');
    }
    async create(instance, data) {
        await this.waMonitor.waInstances[instance.instanceName].setSettings(data);
        return { settings: { ...instance, settings: data } };
    }
    async find(instance) {
        try {
            const result = await this.waMonitor.waInstances[instance.instanceName].findSettings();
            if (Object.keys(result).length === 0) {
                throw new Error('Settings not found');
            }
            return result;
        }
        catch (error) {
            return null;
        }
    }
}
exports.SettingsService = SettingsService;
