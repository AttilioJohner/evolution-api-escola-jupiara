"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventController = void 0;
class EventController {
    constructor(prismaRepository, waMonitor, integrationStatus, integrationName) {
        this.prisma = prismaRepository;
        this.monitor = waMonitor;
        this.status = integrationStatus;
        this.name = integrationName;
    }
    set prisma(prisma) {
        this.prismaRepository = prisma;
    }
    get prisma() {
        return this.prismaRepository;
    }
    set monitor(waMonitor) {
        this.waMonitor = waMonitor;
    }
    get monitor() {
        return this.waMonitor;
    }
    set name(name) {
        this.integrationName = name;
    }
    get name() {
        return this.integrationName;
    }
    set status(status) {
        this.integrationStatus = status;
    }
    get status() {
        return this.integrationStatus;
    }
    async set(instanceName, data) {
        if (!this.status) {
            return;
        }
        if (!data[this.name]?.enabled) {
            data[this.name].events = [];
        }
        else {
            if (0 === data[this.name].events.length) {
                data[this.name].events = EventController.events;
            }
        }
        return this.prisma[this.name].upsert({
            where: {
                instanceId: this.monitor.waInstances[instanceName].instanceId,
            },
            update: {
                enabled: data[this.name]?.enabled,
                events: data[this.name].events,
            },
            create: {
                enabled: data[this.name]?.enabled,
                events: data[this.name].events,
                instanceId: this.monitor.waInstances[instanceName].instanceId,
            },
        });
    }
    async get(instanceName) {
        if (!this.status) {
            return;
        }
        if (undefined === this.monitor.waInstances[instanceName]) {
            return null;
        }
        const data = await this.prisma[this.name].findUnique({
            where: {
                instanceId: this.monitor.waInstances[instanceName].instanceId,
            },
        });
        if (!data) {
            return null;
        }
        return data;
    }
}
exports.EventController = EventController;
EventController.events = [
    'APPLICATION_STARTUP',
    'QRCODE_UPDATED',
    'MESSAGES_SET',
    'MESSAGES_UPSERT',
    'MESSAGES_EDITED',
    'MESSAGES_UPDATE',
    'MESSAGES_DELETE',
    'SEND_MESSAGE',
    'SEND_MESSAGE_UPDATE',
    'CONTACTS_SET',
    'CONTACTS_UPSERT',
    'CONTACTS_UPDATE',
    'PRESENCE_UPDATE',
    'CHATS_SET',
    'CHATS_UPSERT',
    'CHATS_UPDATE',
    'CHATS_DELETE',
    'GROUPS_UPSERT',
    'GROUP_UPDATE',
    'GROUP_PARTICIPANTS_UPDATE',
    'CONNECTION_UPDATE',
    'LABELS_EDIT',
    'LABELS_ASSOCIATION',
    'CALL',
    'TYPEBOT_START',
    'TYPEBOT_CHANGE_STATUS',
    'REMOVE_INSTANCE',
    'LOGOUT_INSTANCE',
    'INSTANCE_CREATE',
    'INSTANCE_DELETE',
    'STATUS_INSTANCE',
];
