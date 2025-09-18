"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupController = void 0;
class GroupController {
    constructor(waMonitor) {
        this.waMonitor = waMonitor;
    }
    async createGroup(instance, create) {
        return await this.waMonitor.waInstances[instance.instanceName].createGroup(create);
    }
    async updateGroupPicture(instance, update) {
        return await this.waMonitor.waInstances[instance.instanceName].updateGroupPicture(update);
    }
    async updateGroupSubject(instance, update) {
        return await this.waMonitor.waInstances[instance.instanceName].updateGroupSubject(update);
    }
    async updateGroupDescription(instance, update) {
        return await this.waMonitor.waInstances[instance.instanceName].updateGroupDescription(update);
    }
    async findGroupInfo(instance, groupJid) {
        return await this.waMonitor.waInstances[instance.instanceName].findGroup(groupJid);
    }
    async fetchAllGroups(instance, getPaticipants) {
        return await this.waMonitor.waInstances[instance.instanceName].fetchAllGroups(getPaticipants);
    }
    async inviteCode(instance, groupJid) {
        return await this.waMonitor.waInstances[instance.instanceName].inviteCode(groupJid);
    }
    async inviteInfo(instance, inviteCode) {
        return await this.waMonitor.waInstances[instance.instanceName].inviteInfo(inviteCode);
    }
    async sendInvite(instance, data) {
        return await this.waMonitor.waInstances[instance.instanceName].sendInvite(data);
    }
    async acceptInviteCode(instance, inviteCode) {
        return await this.waMonitor.waInstances[instance.instanceName].acceptInviteCode(inviteCode);
    }
    async revokeInviteCode(instance, groupJid) {
        return await this.waMonitor.waInstances[instance.instanceName].revokeInviteCode(groupJid);
    }
    async findParticipants(instance, groupJid) {
        return await this.waMonitor.waInstances[instance.instanceName].findParticipants(groupJid);
    }
    async updateGParticipate(instance, update) {
        return await this.waMonitor.waInstances[instance.instanceName].updateGParticipant(update);
    }
    async updateGSetting(instance, update) {
        return await this.waMonitor.waInstances[instance.instanceName].updateGSetting(update);
    }
    async toggleEphemeral(instance, update) {
        return await this.waMonitor.waInstances[instance.instanceName].toggleEphemeral(update);
    }
    async leaveGroup(instance, groupJid) {
        return await this.waMonitor.waInstances[instance.instanceName].leaveGroup(groupJid);
    }
}
exports.GroupController = GroupController;
