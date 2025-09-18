"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelController = void 0;
class LabelController {
    constructor(waMonitor) {
        this.waMonitor = waMonitor;
    }
    async fetchLabels({ instanceName }) {
        return await this.waMonitor.waInstances[instanceName].fetchLabels();
    }
    async handleLabel({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].handleLabel(data);
    }
}
exports.LabelController = LabelController;
