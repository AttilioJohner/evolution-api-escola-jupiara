"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallController = void 0;
class CallController {
    constructor(waMonitor) {
        this.waMonitor = waMonitor;
    }
    async offerCall({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].offerCall(data);
    }
}
exports.CallController = CallController;
