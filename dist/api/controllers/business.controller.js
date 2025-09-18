"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessController = void 0;
class BusinessController {
    constructor(waMonitor) {
        this.waMonitor = waMonitor;
    }
    async fetchCatalog({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].fetchCatalog(instanceName, data);
    }
    async fetchCollections({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].fetchCollections(instanceName, data);
    }
}
exports.BusinessController = BusinessController;
