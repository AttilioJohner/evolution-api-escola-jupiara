"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Integration = exports.MessageSubtype = exports.TypeMediaMessage = exports.Events = void 0;
var Events;
(function (Events) {
    Events["APPLICATION_STARTUP"] = "application.startup";
    Events["INSTANCE_CREATE"] = "instance.create";
    Events["INSTANCE_DELETE"] = "instance.delete";
    Events["QRCODE_UPDATED"] = "qrcode.updated";
    Events["CONNECTION_UPDATE"] = "connection.update";
    Events["STATUS_INSTANCE"] = "status.instance";
    Events["MESSAGES_SET"] = "messages.set";
    Events["MESSAGES_UPSERT"] = "messages.upsert";
    Events["MESSAGES_EDITED"] = "messages.edited";
    Events["MESSAGES_UPDATE"] = "messages.update";
    Events["MESSAGES_DELETE"] = "messages.delete";
    Events["SEND_MESSAGE"] = "send.message";
    Events["SEND_MESSAGE_UPDATE"] = "send.message.update";
    Events["CONTACTS_SET"] = "contacts.set";
    Events["CONTACTS_UPSERT"] = "contacts.upsert";
    Events["CONTACTS_UPDATE"] = "contacts.update";
    Events["PRESENCE_UPDATE"] = "presence.update";
    Events["CHATS_SET"] = "chats.set";
    Events["CHATS_UPDATE"] = "chats.update";
    Events["CHATS_UPSERT"] = "chats.upsert";
    Events["CHATS_DELETE"] = "chats.delete";
    Events["GROUPS_UPSERT"] = "groups.upsert";
    Events["GROUPS_UPDATE"] = "groups.update";
    Events["GROUP_PARTICIPANTS_UPDATE"] = "group-participants.update";
    Events["CALL"] = "call";
    Events["TYPEBOT_START"] = "typebot.start";
    Events["TYPEBOT_CHANGE_STATUS"] = "typebot.change-status";
    Events["LABELS_EDIT"] = "labels.edit";
    Events["LABELS_ASSOCIATION"] = "labels.association";
    Events["CREDS_UPDATE"] = "creds.update";
    Events["MESSAGING_HISTORY_SET"] = "messaging-history.set";
    Events["REMOVE_INSTANCE"] = "remove.instance";
    Events["LOGOUT_INSTANCE"] = "logout.instance";
})(Events || (exports.Events = Events = {}));
exports.TypeMediaMessage = [
    'imageMessage',
    'documentMessage',
    'audioMessage',
    'videoMessage',
    'stickerMessage',
    'ptvMessage',
];
exports.MessageSubtype = [
    'ephemeralMessage',
    'documentWithCaptionMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
];
exports.Integration = {
    WHATSAPP_BUSINESS: 'WHATSAPP-BUSINESS',
    WHATSAPP_BAILEYS: 'WHATSAPP-BAILEYS',
    EVOLUTION: 'EVOLUTION',
};
