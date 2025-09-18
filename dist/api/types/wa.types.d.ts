import { JsonValue } from '@prisma/client/runtime/library';
import { AuthenticationState, WAConnectionState } from 'baileys';
export declare enum Events {
    APPLICATION_STARTUP = "application.startup",
    INSTANCE_CREATE = "instance.create",
    INSTANCE_DELETE = "instance.delete",
    QRCODE_UPDATED = "qrcode.updated",
    CONNECTION_UPDATE = "connection.update",
    STATUS_INSTANCE = "status.instance",
    MESSAGES_SET = "messages.set",
    MESSAGES_UPSERT = "messages.upsert",
    MESSAGES_EDITED = "messages.edited",
    MESSAGES_UPDATE = "messages.update",
    MESSAGES_DELETE = "messages.delete",
    SEND_MESSAGE = "send.message",
    SEND_MESSAGE_UPDATE = "send.message.update",
    CONTACTS_SET = "contacts.set",
    CONTACTS_UPSERT = "contacts.upsert",
    CONTACTS_UPDATE = "contacts.update",
    PRESENCE_UPDATE = "presence.update",
    CHATS_SET = "chats.set",
    CHATS_UPDATE = "chats.update",
    CHATS_UPSERT = "chats.upsert",
    CHATS_DELETE = "chats.delete",
    GROUPS_UPSERT = "groups.upsert",
    GROUPS_UPDATE = "groups.update",
    GROUP_PARTICIPANTS_UPDATE = "group-participants.update",
    CALL = "call",
    TYPEBOT_START = "typebot.start",
    TYPEBOT_CHANGE_STATUS = "typebot.change-status",
    LABELS_EDIT = "labels.edit",
    LABELS_ASSOCIATION = "labels.association",
    CREDS_UPDATE = "creds.update",
    MESSAGING_HISTORY_SET = "messaging-history.set",
    REMOVE_INSTANCE = "remove.instance",
    LOGOUT_INSTANCE = "logout.instance"
}
export declare namespace wa {
    type QrCode = {
        count?: number;
        pairingCode?: string;
        base64?: string;
        code?: string;
    };
    type Instance = {
        id?: string;
        qrcode?: QrCode;
        pairingCode?: string;
        authState?: {
            state: AuthenticationState;
            saveCreds: () => void;
        };
        name?: string;
        wuid?: string;
        profileName?: string;
        profilePictureUrl?: string;
        token?: string;
        number?: string;
        integration?: string;
        businessId?: string;
    };
    type LocalChatwoot = {
        enabled?: boolean;
        accountId?: string;
        token?: string;
        url?: string;
        nameInbox?: string;
        signMsg?: boolean;
        signDelimiter?: string;
        number?: string;
        reopenConversation?: boolean;
        conversationPending?: boolean;
        mergeBrazilContacts?: boolean;
        importContacts?: boolean;
        importMessages?: boolean;
        daysLimitImportMessages?: number;
    };
    type LocalSettings = {
        rejectCall?: boolean;
        msgCall?: string;
        groupsIgnore?: boolean;
        alwaysOnline?: boolean;
        readMessages?: boolean;
        readStatus?: boolean;
        syncFullHistory?: boolean;
        wavoipToken?: string;
    };
    type LocalEvent = {
        enabled?: boolean;
        events?: JsonValue;
    };
    type LocalWebHook = LocalEvent & {
        url?: string;
        headers?: JsonValue;
        webhookByEvents?: boolean;
        webhookBase64?: boolean;
    };
    type LocalPusher = LocalEvent & {
        appId?: string;
        key?: string;
        secret?: string;
        cluster?: string;
        useTLS?: boolean;
    };
    type Session = {
        remoteJid?: string;
        sessionId?: string;
        createdAt?: number;
    };
    type LocalProxy = {
        enabled?: boolean;
        host?: string;
        port?: string;
        protocol?: string;
        username?: string;
        password?: string;
    };
    type StateConnection = {
        instance?: string;
        state?: WAConnectionState | 'refused';
        statusReason?: number;
    };
    type StatusMessage = 'ERROR' | 'PENDING' | 'SERVER_ACK' | 'DELIVERY_ACK' | 'READ' | 'DELETED' | 'PLAYED';
}
export declare const TypeMediaMessage: string[];
export declare const MessageSubtype: string[];
export declare const Integration: {
    WHATSAPP_BUSINESS: string;
    WHATSAPP_BAILEYS: string;
    EVOLUTION: string;
};
