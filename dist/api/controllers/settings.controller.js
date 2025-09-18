"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async createSettings(instance, data) {
        return this.settingsService.create(instance, data);
    }
    async findSettings(instance) {
        const settings = this.settingsService.find(instance);
        return settings;
    }
}
exports.SettingsController = SettingsController;
