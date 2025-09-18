"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysController = void 0;
class BaileysController {
    constructor(waMonitor) {
        this.waMonitor = waMonitor;
    }
    async onWhatsapp({ instanceName }, body) {
        const instance = this.waMonitor.waInstances[instanceName];
        return instance.baileysOnWhatsapp(body?.jid);
    }
    async profilePictureUrl({ instanceName }, body) {
        const instance = this.waMonitor.waInstances[instanceName];
        return instance.baileysProfilePictureUrl(body?.jid, body?.type, body?.timeoutMs);
    }
    async assertSessions({ instanceName }, body) {
        const instance = this.waMonitor.waInstances[instanceName];
        return instance.baileysAssertSessions(body?.jids, body?.force);
    }
    async createParticipantNodes({ instanceName }, body) {
        const instance = this.waMonitor.waInstances[instanceName];
        return instance.baileysCreateParticipantNodes(body?.jids, body?.message, body?.extraAttrs);
    }
    async getUSyncDevices({ instanceName }, body) {
        const instance = this.waMonitor.waInstances[instanceName];
        return instance.baileysGetUSyncDevices(body?.jids, body?.useCache, body?.ignoreZeroDevices);
    }
    async generateMessageTag({ instanceName }) {
        const instance = this.waMonitor.waInstances[instanceName];
        return instance.baileysGenerateMessageTag();
    }
    async sendNode({ instanceName }, body) {
        const instance = this.waMonitor.waInstances[instanceName];
        return instance.baileysSendNode(body?.stanza);
    }
    async signalRepositoryDecryptMessage({ instanceName }, body) {
        const instance = this.waMonitor.waInstances[instanceName];
        return instance.baileysSignalRepositoryDecryptMessage(body?.jid, body?.type, body?.ciphertext);
    }
    async getAuthState({ instanceName }) {
        const instance = this.waMonitor.waInstances[instanceName];
        return instance.baileysGetAuthState();
    }
}
exports.BaileysController = BaileysController;
