"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
class ChatController {
    constructor(waMonitor) {
        this.waMonitor = waMonitor;
    }
    async whatsappNumber({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].whatsappNumber(data);
    }
    async readMessage({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].markMessageAsRead(data);
    }
    async archiveChat({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].archiveChat(data);
    }
    async markChatUnread({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].markChatUnread(data);
    }
    async deleteMessage({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].deleteMessage(data);
    }
    async fetchProfilePicture({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].profilePicture(data.number);
    }
    async fetchProfile({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].fetchProfile(instanceName, data.number);
    }
    async fetchContacts({ instanceName }, query) {
        return await this.waMonitor.waInstances[instanceName].fetchContacts(query);
    }
    async getBase64FromMediaMessage({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].getBase64FromMediaMessage(data);
    }
    async fetchMessages({ instanceName }, query) {
        return await this.waMonitor.waInstances[instanceName].fetchMessages(query);
    }
    async fetchStatusMessage({ instanceName }, query) {
        return await this.waMonitor.waInstances[instanceName].fetchStatusMessage(query);
    }
    async fetchChats({ instanceName }, query) {
        return await this.waMonitor.waInstances[instanceName].fetchChats(query);
    }
    async findChatByRemoteJid({ instanceName }, remoteJid) {
        return await this.waMonitor.waInstances[instanceName].findChatByRemoteJid(remoteJid);
    }
    async sendPresence({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].sendPresence(data);
    }
    async fetchPrivacySettings({ instanceName }) {
        return await this.waMonitor.waInstances[instanceName].fetchPrivacySettings();
    }
    async updatePrivacySettings({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].updatePrivacySettings(data);
    }
    async fetchBusinessProfile({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].fetchBusinessProfile(data.number);
    }
    async updateProfileName({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].updateProfileName(data.name);
    }
    async updateProfileStatus({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].updateProfileStatus(data.status);
    }
    async updateProfilePicture({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].updateProfilePicture(data.picture);
    }
    async removeProfilePicture({ instanceName }) {
        return await this.waMonitor.waInstances[instanceName].removeProfilePicture();
    }
    async updateMessage({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].updateMessage(data);
    }
    async blockUser({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].blockUser(data);
    }
}
exports.ChatController = ChatController;
