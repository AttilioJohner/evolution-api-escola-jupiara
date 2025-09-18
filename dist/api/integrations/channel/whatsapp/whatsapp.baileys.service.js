"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysStartupService = void 0;
const chat_dto_1 = require("@api/dto/chat.dto");
const chatwoot_import_helper_1 = require("@api/integrations/chatbot/chatwoot/utils/chatwoot-import-helper");
const s3Service = __importStar(require("@api/integrations/storage/s3/libs/minio.server"));
const server_module_1 = require("@api/server.module");
const cache_service_1 = require("@api/services/cache.service");
const channel_service_1 = require("@api/services/channel.service");
const wa_types_1 = require("@api/types/wa.types");
const cacheengine_1 = require("@cache/cacheengine");
const env_config_1 = require("@config/env.config");
const _exceptions_1 = require("@exceptions");
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const cuid2_1 = require("@paralleldrive/cuid2");
const createJid_1 = require("@utils/createJid");
const fetchLatestWaWebVersion_1 = require("@utils/fetchLatestWaWebVersion");
const makeProxyAgent_1 = require("@utils/makeProxyAgent");
const onWhatsappCache_1 = require("@utils/onWhatsappCache");
const renderStatus_1 = require("@utils/renderStatus");
const use_multi_file_auth_state_prisma_1 = __importDefault(require("@utils/use-multi-file-auth-state-prisma"));
const use_multi_file_auth_state_provider_files_1 = require("@utils/use-multi-file-auth-state-provider-files");
const use_multi_file_auth_state_redis_db_1 = require("@utils/use-multi-file-auth-state-redis-db");
const axios_1 = __importDefault(require("axios"));
const baileys_1 = __importStar(require("baileys"));
const child_process_1 = require("child_process");
const class_validator_1 = require("class-validator");
const crypto_1 = require("crypto");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const form_data_1 = __importDefault(require("form-data"));
const long_1 = __importDefault(require("long"));
const mime_types_1 = __importDefault(require("mime-types"));
const node_cache_1 = __importDefault(require("node-cache"));
const node_cron_1 = __importDefault(require("node-cron"));
const os_1 = require("os");
const path_1 = require("path");
const pino_1 = __importDefault(require("pino"));
const qrcode_1 = __importDefault(require("qrcode"));
const qrcode_terminal_1 = __importDefault(require("qrcode-terminal"));
const sharp_1 = __importDefault(require("sharp"));
const stream_1 = require("stream");
const uuid_1 = require("uuid");
const baileysMessage_processor_1 = require("./baileysMessage.processor");
const useVoiceCallsBaileys_1 = require("./voiceCalls/useVoiceCallsBaileys");
const groupMetadataCache = new cache_service_1.CacheService(new cacheengine_1.CacheEngine(env_config_1.configService, 'groups').getEngine());
async function getVideoDuration(input) {
    const MediaInfoFactory = (await Promise.resolve().then(() => __importStar(require('mediainfo.js')))).default;
    const mediainfo = await MediaInfoFactory({ format: 'JSON' });
    let fileSize;
    let readChunk;
    if (Buffer.isBuffer(input)) {
        fileSize = input.length;
        readChunk = async (size, offset) => {
            return input.slice(offset, offset + size);
        };
    }
    else if (typeof input === 'string') {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const stat = await fs.promises.stat(input);
        fileSize = stat.size;
        const fd = await fs.promises.open(input, 'r');
        readChunk = async (size, offset) => {
            const buffer = Buffer.alloc(size);
            await fd.read(buffer, 0, size, offset);
            return buffer;
        };
        try {
            const result = await mediainfo.analyzeData(() => fileSize, readChunk);
            const jsonResult = JSON.parse(result);
            const generalTrack = jsonResult.media.track.find((t) => t['@type'] === 'General');
            const duration = generalTrack.Duration;
            return Math.round(parseFloat(duration));
        }
        finally {
            await fd.close();
        }
    }
    else if (input instanceof stream_1.Readable) {
        const chunks = [];
        for await (const chunk of input) {
            chunks.push(chunk);
        }
        const data = Buffer.concat(chunks);
        fileSize = data.length;
        readChunk = async (size, offset) => {
            return data.slice(offset, offset + size);
        };
    }
    else {
        throw new Error('Tipo de entrada não suportado');
    }
    const result = await mediainfo.analyzeData(() => fileSize, readChunk);
    const jsonResult = JSON.parse(result);
    const generalTrack = jsonResult.media.track.find((t) => t['@type'] === 'General');
    const duration = generalTrack.Duration;
    return Math.round(parseFloat(duration));
}
class BaileysStartupService extends channel_service_1.ChannelStartupService {
    constructor(configService, eventEmitter, prismaRepository, cache, chatwootCache, baileysCache, providerFiles) {
        super(configService, eventEmitter, prismaRepository, chatwootCache);
        this.configService = configService;
        this.eventEmitter = eventEmitter;
        this.prismaRepository = prismaRepository;
        this.cache = cache;
        this.chatwootCache = chatwootCache;
        this.baileysCache = baileysCache;
        this.providerFiles = providerFiles;
        this.messageProcessor = new baileysMessage_processor_1.BaileysMessageProcessor();
        this.msgRetryCounterCache = new node_cache_1.default();
        this.userDevicesCache = new node_cache_1.default({ stdTTL: 300000, useClones: false });
        this.endSession = false;
        this.logBaileys = this.configService.get('LOG').BAILEYS;
        this.stateConnection = { state: 'close' };
        this.chatHandle = {
            'chats.upsert': async (chats) => {
                const existingChatIds = await this.prismaRepository.chat.findMany({
                    where: { instanceId: this.instanceId },
                    select: { remoteJid: true },
                });
                const existingChatIdSet = new Set(existingChatIds.map((chat) => chat.remoteJid));
                const chatsToInsert = chats
                    .filter((chat) => !existingChatIdSet?.has(chat.id))
                    .map((chat) => ({
                    remoteJid: chat.id,
                    instanceId: this.instanceId,
                    name: chat.name,
                    unreadMessages: chat.unreadCount !== undefined ? chat.unreadCount : 0,
                }));
                this.sendDataWebhook(wa_types_1.Events.CHATS_UPSERT, chatsToInsert);
                if (chatsToInsert.length > 0) {
                    if (this.configService.get('DATABASE').SAVE_DATA.CHATS)
                        await this.prismaRepository.chat.createMany({ data: chatsToInsert, skipDuplicates: true });
                }
            },
            'chats.update': async (chats) => {
                const chatsRaw = chats.map((chat) => {
                    return { remoteJid: chat.id, instanceId: this.instanceId };
                });
                this.sendDataWebhook(wa_types_1.Events.CHATS_UPDATE, chatsRaw);
                for (const chat of chats) {
                    await this.prismaRepository.chat.updateMany({
                        where: { instanceId: this.instanceId, remoteJid: chat.id, name: chat.name },
                        data: { remoteJid: chat.id },
                    });
                }
            },
            'chats.delete': async (chats) => {
                chats.forEach(async (chat) => await this.prismaRepository.chat.deleteMany({ where: { instanceId: this.instanceId, remoteJid: chat } }));
                this.sendDataWebhook(wa_types_1.Events.CHATS_DELETE, [...chats]);
            },
        };
        this.contactHandle = {
            'contacts.upsert': async (contacts) => {
                try {
                    const contactsRaw = contacts.map((contact) => ({
                        remoteJid: contact.id,
                        pushName: contact?.name || contact?.verifiedName || contact.id.split('@')[0],
                        profilePicUrl: null,
                        instanceId: this.instanceId,
                    }));
                    if (contactsRaw.length > 0) {
                        this.sendDataWebhook(wa_types_1.Events.CONTACTS_UPSERT, contactsRaw);
                        if (this.configService.get('DATABASE').SAVE_DATA.CONTACTS)
                            await this.prismaRepository.contact.createMany({ data: contactsRaw, skipDuplicates: true });
                        const usersContacts = contactsRaw.filter((c) => c.remoteJid.includes('@s.whatsapp'));
                        if (usersContacts) {
                            await (0, onWhatsappCache_1.saveOnWhatsappCache)(usersContacts.map((c) => ({ remoteJid: c.remoteJid })));
                        }
                    }
                    if (this.configService.get('CHATWOOT').ENABLED &&
                        this.localChatwoot?.enabled &&
                        this.localChatwoot.importContacts &&
                        contactsRaw.length) {
                        this.chatwootService.addHistoryContacts({ instanceName: this.instance.name, instanceId: this.instance.id }, contactsRaw);
                        chatwoot_import_helper_1.chatwootImport.importHistoryContacts({ instanceName: this.instance.name, instanceId: this.instance.id }, this.localChatwoot);
                    }
                    const updatedContacts = await Promise.all(contacts.map(async (contact) => ({
                        remoteJid: contact.id,
                        pushName: contact?.name || contact?.verifiedName || contact.id.split('@')[0],
                        profilePicUrl: (await this.profilePicture(contact.id)).profilePictureUrl,
                        instanceId: this.instanceId,
                    })));
                    if (updatedContacts.length > 0) {
                        const usersContacts = updatedContacts.filter((c) => c.remoteJid.includes('@s.whatsapp'));
                        if (usersContacts) {
                            await (0, onWhatsappCache_1.saveOnWhatsappCache)(usersContacts.map((c) => ({ remoteJid: c.remoteJid })));
                        }
                        this.sendDataWebhook(wa_types_1.Events.CONTACTS_UPDATE, updatedContacts);
                        await Promise.all(updatedContacts.map(async (contact) => {
                            const update = this.prismaRepository.contact.updateMany({
                                where: { remoteJid: contact.remoteJid, instanceId: this.instanceId },
                                data: { profilePicUrl: contact.profilePicUrl },
                            });
                            if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                                const instance = { instanceName: this.instance.name, instanceId: this.instance.id };
                                const findParticipant = await this.chatwootService.findContact(instance, contact.remoteJid.split('@')[0]);
                                if (!findParticipant) {
                                    return;
                                }
                                this.chatwootService.updateContact(instance, findParticipant.id, {
                                    name: contact.pushName,
                                    avatar_url: contact.profilePicUrl,
                                });
                            }
                            return update;
                        }));
                    }
                }
                catch (error) {
                    console.error(error);
                    this.logger.error(`Error: ${error.message}`);
                }
            },
            'contacts.update': async (contacts) => {
                const contactsRaw = [];
                for await (const contact of contacts) {
                    contactsRaw.push({
                        remoteJid: contact.id,
                        pushName: contact?.name ?? contact?.verifiedName,
                        profilePicUrl: (await this.profilePicture(contact.id)).profilePictureUrl,
                        instanceId: this.instanceId,
                    });
                }
                this.sendDataWebhook(wa_types_1.Events.CONTACTS_UPDATE, contactsRaw);
                const updateTransactions = contactsRaw.map((contact) => this.prismaRepository.contact.upsert({
                    where: { remoteJid_instanceId: { remoteJid: contact.remoteJid, instanceId: contact.instanceId } },
                    create: contact,
                    update: contact,
                }));
                await this.prismaRepository.$transaction(updateTransactions);
                const usersContacts = contactsRaw.filter((c) => c.remoteJid.includes('@s.whatsapp'));
                if (usersContacts) {
                    await (0, onWhatsappCache_1.saveOnWhatsappCache)(usersContacts.map((c) => ({ remoteJid: c.remoteJid })));
                }
            },
        };
        this.messageHandle = {
            'messaging-history.set': async ({ messages, chats, contacts, isLatest, progress, syncType, }) => {
                try {
                    if (syncType === baileys_1.proto.HistorySync.HistorySyncType.ON_DEMAND) {
                        console.log('received on-demand history sync, messages=', messages);
                    }
                    console.log(`recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest}, progress: ${progress}%), type: ${syncType}`);
                    const instance = { instanceName: this.instance.name };
                    let timestampLimitToImport = null;
                    if (this.configService.get('CHATWOOT').ENABLED) {
                        const daysLimitToImport = this.localChatwoot?.enabled ? this.localChatwoot.daysLimitImportMessages : 1000;
                        const date = new Date();
                        timestampLimitToImport = new Date(date.setDate(date.getDate() - daysLimitToImport)).getTime() / 1000;
                        const maxBatchTimestamp = Math.max(...messages.map((message) => message.messageTimestamp));
                        const processBatch = maxBatchTimestamp >= timestampLimitToImport;
                        if (!processBatch) {
                            return;
                        }
                    }
                    const contactsMap = new Map();
                    for (const contact of contacts) {
                        if (contact.id && (contact.notify || contact.name)) {
                            contactsMap.set(contact.id, { name: contact.name ?? contact.notify, jid: contact.id });
                        }
                    }
                    const chatsRaw = [];
                    const chatsRepository = new Set((await this.prismaRepository.chat.findMany({ where: { instanceId: this.instanceId } })).map((chat) => chat.remoteJid));
                    for (const chat of chats) {
                        if (chatsRepository?.has(chat.id)) {
                            continue;
                        }
                        chatsRaw.push({ remoteJid: chat.id, instanceId: this.instanceId, name: chat.name });
                    }
                    this.sendDataWebhook(wa_types_1.Events.CHATS_SET, chatsRaw);
                    if (this.configService.get('DATABASE').SAVE_DATA.HISTORIC) {
                        await this.prismaRepository.chat.createMany({ data: chatsRaw, skipDuplicates: true });
                    }
                    const messagesRaw = [];
                    const messagesRepository = new Set(chatwoot_import_helper_1.chatwootImport.getRepositoryMessagesCache(instance) ??
                        (await this.prismaRepository.message.findMany({
                            select: { key: true },
                            where: { instanceId: this.instanceId },
                        })).map((message) => {
                            const key = message.key;
                            return key.id;
                        }));
                    if (chatwoot_import_helper_1.chatwootImport.getRepositoryMessagesCache(instance) === null) {
                        chatwoot_import_helper_1.chatwootImport.setRepositoryMessagesCache(instance, messagesRepository);
                    }
                    for (const m of messages) {
                        if (!m.message || !m.key || !m.messageTimestamp) {
                            continue;
                        }
                        if (m.key.remoteJid?.includes('@lid') && m.key.participant) {
                            m.key.remoteJid = m.key.participant;
                        }
                        if (long_1.default.isLong(m?.messageTimestamp)) {
                            m.messageTimestamp = m.messageTimestamp?.toNumber();
                        }
                        if (this.configService.get('CHATWOOT').ENABLED) {
                            if (m.messageTimestamp <= timestampLimitToImport) {
                                continue;
                            }
                        }
                        if (messagesRepository?.has(m.key.id)) {
                            continue;
                        }
                        if (!m.pushName && !m.key.fromMe) {
                            const participantJid = m.participant || m.key.participant || m.key.remoteJid;
                            if (participantJid && contactsMap.has(participantJid)) {
                                m.pushName = contactsMap.get(participantJid).name;
                            }
                            else if (participantJid) {
                                m.pushName = participantJid.split('@')[0];
                            }
                        }
                        messagesRaw.push(this.prepareMessage(m));
                    }
                    this.sendDataWebhook(wa_types_1.Events.MESSAGES_SET, [...messagesRaw]);
                    if (this.configService.get('DATABASE').SAVE_DATA.HISTORIC) {
                        await this.prismaRepository.message.createMany({ data: messagesRaw, skipDuplicates: true });
                    }
                    if (this.configService.get('CHATWOOT').ENABLED &&
                        this.localChatwoot?.enabled &&
                        this.localChatwoot.importMessages &&
                        messagesRaw.length > 0) {
                        this.chatwootService.addHistoryMessages(instance, messagesRaw.filter((msg) => !chatwoot_import_helper_1.chatwootImport.isIgnorePhoneNumber(msg.key?.remoteJid)));
                    }
                    await this.contactHandle['contacts.upsert'](contacts.filter((c) => !!c.notify || !!c.name).map((c) => ({ id: c.id, name: c.name ?? c.notify })));
                    contacts = undefined;
                    messages = undefined;
                    chats = undefined;
                }
                catch (error) {
                    this.logger.error(error);
                }
            },
            'messages.upsert': async ({ messages, type, requestId }, settings) => {
                try {
                    for (const received of messages) {
                        if (received.key.remoteJid?.includes('@lid') && received.key.participant) {
                            received.key.previousRemoteJid = received.key.remoteJid;
                            received.key.remoteJid = received.key.participant;
                        }
                        if (received?.messageStubParameters?.some?.((param) => [
                            'No matching sessions found for message',
                            'Bad MAC',
                            'failed to decrypt message',
                            'SessionError',
                            'Invalid PreKey ID',
                            'No session record',
                            'No session found to decrypt message',
                        ].some((err) => param?.includes?.(err)))) {
                            this.logger.warn(`Message ignored with messageStubParameters: ${JSON.stringify(received, null, 2)}`);
                            continue;
                        }
                        if (received.message?.conversation || received.message?.extendedTextMessage?.text) {
                            const text = received.message?.conversation || received.message?.extendedTextMessage?.text;
                            if (text == 'requestPlaceholder' && !requestId) {
                                const messageId = null;
                                console.log('requested placeholder resync, id=', messageId);
                            }
                            else if (requestId) {
                                console.log('Message received from phone, id=', requestId, received);
                            }
                            if (text == 'onDemandHistSync') {
                                const messageId = null;
                                console.log('requested on-demand sync, id=', messageId);
                            }
                        }
                        const editedMessage = received?.message?.protocolMessage || received?.message?.editedMessage?.message?.protocolMessage;
                        if (editedMessage) {
                            if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled)
                                this.chatwootService.eventWhatsapp('messages.edit', { instanceName: this.instance.name, instanceId: this.instance.id }, editedMessage);
                            await this.sendDataWebhook(wa_types_1.Events.MESSAGES_EDITED, editedMessage);
                            const oldMessage = await this.getMessage(editedMessage.key, true);
                            if (oldMessage?.id) {
                                const editedMessageTimestamp = long_1.default.isLong(editedMessage?.timestampMs)
                                    ? Math.floor(editedMessage.timestampMs.toNumber() / 1000)
                                    : Math.floor(editedMessage.timestampMs / 1000);
                                await this.prismaRepository.message.update({
                                    where: { id: oldMessage.id },
                                    data: {
                                        message: editedMessage.editedMessage,
                                        messageTimestamp: editedMessageTimestamp,
                                        status: 'EDITED',
                                    },
                                });
                                await this.prismaRepository.messageUpdate.create({
                                    data: {
                                        fromMe: editedMessage.key.fromMe,
                                        keyId: editedMessage.key.id,
                                        remoteJid: editedMessage.key.remoteJid,
                                        status: 'EDITED',
                                        instanceId: this.instanceId,
                                        messageId: oldMessage.id,
                                    },
                                });
                            }
                        }
                        const messageKey = `${this.instance.id}_${received.key.id}`;
                        const cached = await this.baileysCache.get(messageKey);
                        if (cached && !editedMessage) {
                            this.logger.info(`Message duplicated ignored: ${received.key.id}`);
                            continue;
                        }
                        await this.baileysCache.set(messageKey, true, 5 * 60);
                        if ((type !== 'notify' && type !== 'append') ||
                            editedMessage ||
                            received.message?.pollUpdateMessage ||
                            !received?.message) {
                            continue;
                        }
                        if (long_1.default.isLong(received.messageTimestamp)) {
                            received.messageTimestamp = received.messageTimestamp?.toNumber();
                        }
                        if (settings?.groupsIgnore && received.key.remoteJid.includes('@g.us')) {
                            continue;
                        }
                        const existingChat = await this.prismaRepository.chat.findFirst({
                            where: { instanceId: this.instanceId, remoteJid: received.key.remoteJid },
                            select: { id: true, name: true },
                        });
                        if (existingChat &&
                            received.pushName &&
                            existingChat.name !== received.pushName &&
                            received.pushName.trim().length > 0 &&
                            !received.key.fromMe &&
                            !received.key.remoteJid.includes('@g.us')) {
                            this.sendDataWebhook(wa_types_1.Events.CHATS_UPSERT, [{ ...existingChat, name: received.pushName }]);
                            if (this.configService.get('DATABASE').SAVE_DATA.CHATS) {
                                try {
                                    await this.prismaRepository.chat.update({
                                        where: { id: existingChat.id },
                                        data: { name: received.pushName },
                                    });
                                }
                                catch (error) {
                                    console.log(`Chat insert record ignored: ${received.key.remoteJid} - ${this.instanceId}`);
                                }
                            }
                        }
                        const messageRaw = this.prepareMessage(received);
                        const isMedia = received?.message?.imageMessage ||
                            received?.message?.videoMessage ||
                            received?.message?.stickerMessage ||
                            received?.message?.documentMessage ||
                            received?.message?.documentWithCaptionMessage ||
                            received?.message?.ptvMessage ||
                            received?.message?.audioMessage;
                        if (this.localSettings.readMessages && received.key.id !== 'status@broadcast') {
                            await this.client.readMessages([received.key]);
                        }
                        if (this.localSettings.readStatus && received.key.id === 'status@broadcast') {
                            await this.client.readMessages([received.key]);
                        }
                        if (this.configService.get('CHATWOOT').ENABLED &&
                            this.localChatwoot?.enabled &&
                            !received.key.id.includes('@broadcast')) {
                            const chatwootSentMessage = await this.chatwootService.eventWhatsapp(wa_types_1.Events.MESSAGES_UPSERT, { instanceName: this.instance.name, instanceId: this.instanceId }, messageRaw);
                            if (chatwootSentMessage?.id) {
                                messageRaw.chatwootMessageId = chatwootSentMessage.id;
                                messageRaw.chatwootInboxId = chatwootSentMessage.inbox_id;
                                messageRaw.chatwootConversationId = chatwootSentMessage.conversation_id;
                            }
                        }
                        if (this.configService.get('OPENAI').ENABLED && received?.message?.audioMessage) {
                            const openAiDefaultSettings = await this.prismaRepository.openaiSetting.findFirst({
                                where: { instanceId: this.instanceId },
                                include: { OpenaiCreds: true },
                            });
                            if (openAiDefaultSettings && openAiDefaultSettings.openaiCredsId && openAiDefaultSettings.speechToText) {
                                messageRaw.message.speechToText = `[audio] ${await this.openaiService.speechToText(received, this)}`;
                            }
                        }
                        if (this.configService.get('DATABASE').SAVE_DATA.NEW_MESSAGE) {
                            const msg = await this.prismaRepository.message.create({ data: messageRaw });
                            const { remoteJid } = received.key;
                            const timestamp = msg.messageTimestamp;
                            const fromMe = received.key.fromMe.toString();
                            const messageKey = `${remoteJid}_${timestamp}_${fromMe}`;
                            const cachedTimestamp = await this.baileysCache.get(messageKey);
                            if (!cachedTimestamp) {
                                if (!received.key.fromMe) {
                                    if (msg.status === renderStatus_1.status[3]) {
                                        this.logger.log(`Update not read messages ${remoteJid}`);
                                        await this.updateChatUnreadMessages(remoteJid);
                                    }
                                    else if (msg.status === renderStatus_1.status[4]) {
                                        this.logger.log(`Update readed messages ${remoteJid} - ${timestamp}`);
                                        await this.updateMessagesReadedByTimestamp(remoteJid, timestamp);
                                    }
                                }
                                else {
                                    this.logger.log(`Update readed messages ${remoteJid} - ${timestamp}`);
                                    await this.updateMessagesReadedByTimestamp(remoteJid, timestamp);
                                }
                                await this.baileysCache.set(messageKey, true, 5 * 60);
                            }
                            else {
                                this.logger.info(`Update readed messages duplicated ignored [avoid deadlock]: ${messageKey}`);
                            }
                            if (isMedia) {
                                if (this.configService.get('S3').ENABLE) {
                                    try {
                                        const message = received;
                                        const hasRealMedia = this.hasValidMediaContent(message);
                                        if (!hasRealMedia) {
                                            this.logger.warn('Message detected as media but contains no valid media content');
                                        }
                                        else {
                                            const media = await this.getBase64FromMediaMessage({ message }, true);
                                            const { buffer, mediaType, fileName, size } = media;
                                            const mimetype = mime_types_1.default.lookup(fileName).toString();
                                            const fullName = (0, path_1.join)(`${this.instance.id}`, received.key.remoteJid, mediaType, `${Date.now()}_${fileName}`);
                                            await s3Service.uploadFile(fullName, buffer, size.fileLength?.low, { 'Content-Type': mimetype });
                                            await this.prismaRepository.media.create({
                                                data: {
                                                    messageId: msg.id,
                                                    instanceId: this.instanceId,
                                                    type: mediaType,
                                                    fileName: fullName,
                                                    mimetype,
                                                },
                                            });
                                            const mediaUrl = await s3Service.getObjectUrl(fullName);
                                            messageRaw.message.mediaUrl = mediaUrl;
                                            await this.prismaRepository.message.update({ where: { id: msg.id }, data: messageRaw });
                                        }
                                    }
                                    catch (error) {
                                        this.logger.error(['Error on upload file to minio', error?.message, error?.stack]);
                                    }
                                }
                            }
                        }
                        if (this.localWebhook.enabled) {
                            if (isMedia && this.localWebhook.webhookBase64) {
                                try {
                                    const buffer = await (0, baileys_1.downloadMediaMessage)({ key: received.key, message: received?.message }, 'buffer', {}, { logger: (0, pino_1.default)({ level: 'error' }), reuploadRequest: this.client.updateMediaMessage });
                                    if (buffer) {
                                        messageRaw.message.base64 = buffer.toString('base64');
                                    }
                                    else {
                                        const buffer = await (0, baileys_1.downloadMediaMessage)({ key: received.key, message: received?.message }, 'buffer', {}, { logger: (0, pino_1.default)({ level: 'error' }), reuploadRequest: this.client.updateMediaMessage });
                                        if (buffer) {
                                            messageRaw.message.base64 = buffer.toString('base64');
                                        }
                                    }
                                }
                                catch (error) {
                                    this.logger.error(['Error converting media to base64', error?.message]);
                                }
                            }
                        }
                        this.logger.log(messageRaw);
                        this.sendDataWebhook(wa_types_1.Events.MESSAGES_UPSERT, messageRaw);
                        await server_module_1.chatbotController.emit({
                            instance: { instanceName: this.instance.name, instanceId: this.instanceId },
                            remoteJid: messageRaw.key.remoteJid,
                            msg: messageRaw,
                            pushName: messageRaw.pushName,
                        });
                        const contact = await this.prismaRepository.contact.findFirst({
                            where: { remoteJid: received.key.remoteJid, instanceId: this.instanceId },
                        });
                        const contactRaw = {
                            remoteJid: received.key.remoteJid,
                            pushName: received.key.fromMe ? '' : received.key.fromMe == null ? '' : received.pushName,
                            profilePicUrl: (await this.profilePicture(received.key.remoteJid)).profilePictureUrl,
                            instanceId: this.instanceId,
                        };
                        if (contactRaw.remoteJid === 'status@broadcast') {
                            continue;
                        }
                        if (contact) {
                            this.sendDataWebhook(wa_types_1.Events.CONTACTS_UPDATE, contactRaw);
                            if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                                await this.chatwootService.eventWhatsapp(wa_types_1.Events.CONTACTS_UPDATE, { instanceName: this.instance.name, instanceId: this.instanceId }, contactRaw);
                            }
                            if (this.configService.get('DATABASE').SAVE_DATA.CONTACTS)
                                await this.prismaRepository.contact.upsert({
                                    where: { remoteJid_instanceId: { remoteJid: contactRaw.remoteJid, instanceId: contactRaw.instanceId } },
                                    create: contactRaw,
                                    update: contactRaw,
                                });
                            continue;
                        }
                        this.sendDataWebhook(wa_types_1.Events.CONTACTS_UPSERT, contactRaw);
                        if (this.configService.get('DATABASE').SAVE_DATA.CONTACTS)
                            await this.prismaRepository.contact.upsert({
                                where: { remoteJid_instanceId: { remoteJid: contactRaw.remoteJid, instanceId: contactRaw.instanceId } },
                                update: contactRaw,
                                create: contactRaw,
                            });
                        if (contactRaw.remoteJid.includes('@s.whatsapp')) {
                            await (0, onWhatsappCache_1.saveOnWhatsappCache)([{ remoteJid: contactRaw.remoteJid }]);
                        }
                    }
                }
                catch (error) {
                    this.logger.error(error);
                }
            },
            'messages.update': async (args, settings) => {
                this.logger.log(`Update messages ${JSON.stringify(args, undefined, 2)}`);
                const readChatToUpdate = {};
                for await (const { key, update } of args) {
                    if (settings?.groupsIgnore && key.remoteJid?.includes('@g.us')) {
                        continue;
                    }
                    if (key.remoteJid?.includes('@lid') && key.participant) {
                        key.remoteJid = key.participant;
                    }
                    const updateKey = `${this.instance.id}_${key.id}_${update.status}`;
                    const cached = await this.baileysCache.get(updateKey);
                    if (cached) {
                        this.logger.info(`Message duplicated ignored [avoid deadlock]: ${updateKey}`);
                        continue;
                    }
                    await this.baileysCache.set(updateKey, true, 30 * 60);
                    if (renderStatus_1.status[update.status] === 'READ' && key.fromMe) {
                        if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                            this.chatwootService.eventWhatsapp('messages.read', { instanceName: this.instance.name, instanceId: this.instanceId }, { key: key });
                        }
                    }
                    if (key.remoteJid !== 'status@broadcast' && key.id !== undefined) {
                        let pollUpdates;
                        if (update.pollUpdates) {
                            const pollCreation = await this.getMessage(key);
                            if (pollCreation) {
                                pollUpdates = (0, baileys_1.getAggregateVotesInPollMessage)({
                                    message: pollCreation,
                                    pollUpdates: update.pollUpdates,
                                });
                            }
                        }
                        const message = {
                            keyId: key.id,
                            remoteJid: key?.remoteJid,
                            fromMe: key.fromMe,
                            participant: key?.remoteJid,
                            status: renderStatus_1.status[update.status] ?? 'DELETED',
                            pollUpdates,
                            instanceId: this.instanceId,
                        };
                        let findMessage;
                        const configDatabaseData = this.configService.get('DATABASE').SAVE_DATA;
                        if (configDatabaseData.HISTORIC || configDatabaseData.NEW_MESSAGE) {
                            findMessage = await this.prismaRepository.message.findFirst({
                                where: { instanceId: this.instanceId, key: { path: ['id'], equals: key.id } },
                            });
                            if (findMessage)
                                message.messageId = findMessage.id;
                        }
                        if (update.message === null && update.status === undefined) {
                            this.sendDataWebhook(wa_types_1.Events.MESSAGES_DELETE, key);
                            if (this.configService.get('DATABASE').SAVE_DATA.MESSAGE_UPDATE)
                                await this.prismaRepository.messageUpdate.create({ data: message });
                            if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                                this.chatwootService.eventWhatsapp(wa_types_1.Events.MESSAGES_DELETE, { instanceName: this.instance.name, instanceId: this.instanceId }, { key: key });
                            }
                            continue;
                        }
                        if (findMessage && update.status !== undefined && renderStatus_1.status[update.status] !== findMessage.status) {
                            if (!key.fromMe && key.remoteJid) {
                                readChatToUpdate[key.remoteJid] = true;
                                const { remoteJid } = key;
                                const timestamp = findMessage.messageTimestamp;
                                const fromMe = key.fromMe.toString();
                                const messageKey = `${remoteJid}_${timestamp}_${fromMe}`;
                                const cachedTimestamp = await this.baileysCache.get(messageKey);
                                if (!cachedTimestamp) {
                                    if (renderStatus_1.status[update.status] === renderStatus_1.status[4]) {
                                        this.logger.log(`Update as read in message.update ${remoteJid} - ${timestamp}`);
                                        await this.updateMessagesReadedByTimestamp(remoteJid, timestamp);
                                        await this.baileysCache.set(messageKey, true, 5 * 60);
                                    }
                                    await this.prismaRepository.message.update({
                                        where: { id: findMessage.id },
                                        data: { status: renderStatus_1.status[update.status] },
                                    });
                                }
                                else {
                                    this.logger.info(`Update readed messages duplicated ignored in message.update [avoid deadlock]: ${messageKey}`);
                                }
                            }
                        }
                        this.sendDataWebhook(wa_types_1.Events.MESSAGES_UPDATE, message);
                        if (this.configService.get('DATABASE').SAVE_DATA.MESSAGE_UPDATE)
                            await this.prismaRepository.messageUpdate.create({ data: message });
                        const existingChat = await this.prismaRepository.chat.findFirst({
                            where: { instanceId: this.instanceId, remoteJid: message.remoteJid },
                        });
                        if (existingChat) {
                            const chatToInsert = { remoteJid: message.remoteJid, instanceId: this.instanceId, unreadMessages: 0 };
                            this.sendDataWebhook(wa_types_1.Events.CHATS_UPSERT, [chatToInsert]);
                            if (this.configService.get('DATABASE').SAVE_DATA.CHATS) {
                                try {
                                    await this.prismaRepository.chat.update({ where: { id: existingChat.id }, data: chatToInsert });
                                }
                                catch (error) {
                                    console.log(`Chat insert record ignored: ${chatToInsert.remoteJid} - ${chatToInsert.instanceId}`);
                                }
                            }
                        }
                    }
                }
                await Promise.all(Object.keys(readChatToUpdate).map((remoteJid) => this.updateChatUnreadMessages(remoteJid)));
            },
        };
        this.groupHandler = {
            'groups.upsert': (groupMetadata) => {
                this.sendDataWebhook(wa_types_1.Events.GROUPS_UPSERT, groupMetadata);
            },
            'groups.update': (groupMetadataUpdate) => {
                this.sendDataWebhook(wa_types_1.Events.GROUPS_UPDATE, groupMetadataUpdate);
                groupMetadataUpdate.forEach((group) => {
                    if ((0, baileys_1.isJidGroup)(group.id)) {
                        this.updateGroupMetadataCache(group.id);
                    }
                });
            },
            'group-participants.update': (participantsUpdate) => {
                this.sendDataWebhook(wa_types_1.Events.GROUP_PARTICIPANTS_UPDATE, participantsUpdate);
                this.updateGroupMetadataCache(participantsUpdate.id);
            },
        };
        this.labelHandle = {
            [wa_types_1.Events.LABELS_EDIT]: async (label) => {
                this.sendDataWebhook(wa_types_1.Events.LABELS_EDIT, { ...label, instance: this.instance.name });
                const labelsRepository = await this.prismaRepository.label.findMany({ where: { instanceId: this.instanceId } });
                const savedLabel = labelsRepository.find((l) => l.labelId === label.id);
                if (label.deleted && savedLabel) {
                    await this.prismaRepository.label.delete({
                        where: { labelId_instanceId: { instanceId: this.instanceId, labelId: label.id } },
                    });
                    this.sendDataWebhook(wa_types_1.Events.LABELS_EDIT, { ...label, instance: this.instance.name });
                    return;
                }
                const labelName = label.name.replace(/[^\x20-\x7E]/g, '');
                if (!savedLabel || savedLabel.color !== `${label.color}` || savedLabel.name !== labelName) {
                    if (this.configService.get('DATABASE').SAVE_DATA.LABELS) {
                        const labelData = {
                            color: `${label.color}`,
                            name: labelName,
                            labelId: label.id,
                            predefinedId: label.predefinedId,
                            instanceId: this.instanceId,
                        };
                        await this.prismaRepository.label.upsert({
                            where: { labelId_instanceId: { instanceId: labelData.instanceId, labelId: labelData.labelId } },
                            update: labelData,
                            create: labelData,
                        });
                    }
                }
            },
            [wa_types_1.Events.LABELS_ASSOCIATION]: async (data, database) => {
                this.logger.info(`labels association - ${data?.association?.chatId} (${data.type}-${data?.association?.type}): ${data?.association?.labelId}`);
                if (database.SAVE_DATA.CHATS) {
                    const instanceId = this.instanceId;
                    const chatId = data.association.chatId;
                    const labelId = data.association.labelId;
                    if (data.type === 'add') {
                        await this.addLabel(labelId, instanceId, chatId);
                    }
                    else if (data.type === 'remove') {
                        await this.removeLabel(labelId, instanceId, chatId);
                    }
                }
                this.sendDataWebhook(wa_types_1.Events.LABELS_ASSOCIATION, {
                    instance: this.instance.name,
                    type: data.type,
                    chatId: data.association.chatId,
                    labelId: data.association.labelId,
                });
            },
        };
        this.mapType = new Map([
            ['reply', 'quick_reply'],
            ['copy', 'cta_copy'],
            ['url', 'cta_url'],
            ['call', 'cta_call'],
            ['pix', 'payment_info'],
        ]);
        this.mapKeyType = new Map([
            ['phone', 'PHONE'],
            ['email', 'EMAIL'],
            ['cpf', 'CPF'],
            ['cnpj', 'CNPJ'],
            ['random', 'EVP'],
        ]);
        this.getGroupMetadataCache = async (groupJid) => {
            if (!(0, baileys_1.isJidGroup)(groupJid))
                return null;
            const cacheConf = this.configService.get('CACHE');
            if ((cacheConf?.REDIS?.ENABLED && cacheConf?.REDIS?.URI !== '') || cacheConf?.LOCAL?.ENABLED) {
                if (await groupMetadataCache?.has(groupJid)) {
                    console.log(`Cache request for group: ${groupJid}`);
                    const meta = await groupMetadataCache.get(groupJid);
                    if (Date.now() - meta.timestamp > 3600000) {
                        await this.updateGroupMetadataCache(groupJid);
                    }
                    return meta.data;
                }
                console.log(`Cache request for group: ${groupJid} - not found`);
                return await this.updateGroupMetadataCache(groupJid);
            }
            return await this.findGroup({ groupJid }, 'inner');
        };
        this.instance.qrcode = { count: 0 };
        this.messageProcessor.mount({
            onMessageReceive: this.messageHandle['messages.upsert'].bind(this),
        });
        this.authStateProvider = new use_multi_file_auth_state_provider_files_1.AuthStateProvider(this.providerFiles);
    }
    get connectionStatus() {
        return this.stateConnection;
    }
    async logoutInstance() {
        this.messageProcessor.onDestroy();
        await this.client?.logout('Log out instance: ' + this.instanceName);
        this.client?.ws?.close();
        const sessionExists = await this.prismaRepository.session.findFirst({ where: { sessionId: this.instanceId } });
        if (sessionExists) {
            await this.prismaRepository.session.delete({ where: { sessionId: this.instanceId } });
        }
    }
    async getProfileName() {
        let profileName = this.client.user?.name ?? this.client.user?.verifiedName;
        if (!profileName) {
            const data = await this.prismaRepository.session.findUnique({ where: { sessionId: this.instanceId } });
            if (data) {
                const creds = JSON.parse(JSON.stringify(data.creds), baileys_1.BufferJSON.reviver);
                profileName = creds.me?.name || creds.me?.verifiedName;
            }
        }
        return profileName;
    }
    async getProfileStatus() {
        const status = await this.client.fetchStatus(this.instance.wuid);
        return status[0]?.status;
    }
    get profilePictureUrl() {
        return this.instance.profilePictureUrl;
    }
    get qrCode() {
        return {
            pairingCode: this.instance.qrcode?.pairingCode,
            code: this.instance.qrcode?.code,
            base64: this.instance.qrcode?.base64,
            count: this.instance.qrcode?.count,
        };
    }
    async connectionUpdate({ qr, connection, lastDisconnect }) {
        if (qr) {
            if (this.instance.qrcode.count === this.configService.get('QRCODE').LIMIT) {
                this.sendDataWebhook(wa_types_1.Events.QRCODE_UPDATED, {
                    message: 'QR code limit reached, please login again',
                    statusCode: baileys_1.DisconnectReason.badSession,
                });
                if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                    this.chatwootService.eventWhatsapp(wa_types_1.Events.QRCODE_UPDATED, { instanceName: this.instance.name, instanceId: this.instanceId }, { message: 'QR code limit reached, please login again', statusCode: baileys_1.DisconnectReason.badSession });
                }
                this.sendDataWebhook(wa_types_1.Events.CONNECTION_UPDATE, {
                    instance: this.instance.name,
                    state: 'refused',
                    statusReason: baileys_1.DisconnectReason.connectionClosed,
                    wuid: this.instance.wuid,
                    profileName: await this.getProfileName(),
                    profilePictureUrl: this.instance.profilePictureUrl,
                });
                this.endSession = true;
                return this.eventEmitter.emit('no.connection', this.instance.name);
            }
            this.instance.qrcode.count++;
            const color = this.configService.get('QRCODE').COLOR;
            const optsQrcode = {
                margin: 3,
                scale: 4,
                errorCorrectionLevel: 'H',
                color: { light: '#ffffff', dark: color },
            };
            if (this.phoneNumber) {
                await (0, baileys_1.delay)(1000);
                this.instance.qrcode.pairingCode = await this.client.requestPairingCode(this.phoneNumber);
            }
            else {
                this.instance.qrcode.pairingCode = null;
            }
            qrcode_1.default.toDataURL(qr, optsQrcode, (error, base64) => {
                if (error) {
                    this.logger.error('Qrcode generate failed:' + (error instanceof Error ? error.message : String(error)));
                    return;
                }
                this.instance.qrcode.base64 = base64;
                this.instance.qrcode.code = qr;
                this.sendDataWebhook(wa_types_1.Events.QRCODE_UPDATED, {
                    qrcode: { instance: this.instance.name, pairingCode: this.instance.qrcode.pairingCode, code: qr, base64 },
                });
                if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                    this.chatwootService.eventWhatsapp(wa_types_1.Events.QRCODE_UPDATED, { instanceName: this.instance.name, instanceId: this.instanceId }, {
                        qrcode: { instance: this.instance.name, pairingCode: this.instance.qrcode.pairingCode, code: qr, base64 },
                    });
                }
            });
            qrcode_terminal_1.default.generate(qr, { small: true }, (qrcode) => this.logger.log(`\n{ instance: ${this.instance.name} pairingCode: ${this.instance.qrcode.pairingCode}, qrcodeCount: ${this.instance.qrcode.count} }\n` +
                qrcode));
            await this.prismaRepository.instance.update({
                where: { id: this.instanceId },
                data: { connectionStatus: 'connecting' },
            });
        }
        if (connection) {
            this.stateConnection = {
                state: connection,
                statusReason: lastDisconnect?.error?.output?.statusCode ?? 200,
            };
        }
        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const codesToNotReconnect = [baileys_1.DisconnectReason.loggedOut, baileys_1.DisconnectReason.forbidden, 402, 406];
            const shouldReconnect = !codesToNotReconnect.includes(statusCode);
            if (shouldReconnect) {
                await this.connectToWhatsapp(this.phoneNumber);
            }
            else {
                this.sendDataWebhook(wa_types_1.Events.STATUS_INSTANCE, {
                    instance: this.instance.name,
                    status: 'closed',
                    disconnectionAt: new Date(),
                    disconnectionReasonCode: statusCode,
                    disconnectionObject: JSON.stringify(lastDisconnect),
                });
                await this.prismaRepository.instance.update({
                    where: { id: this.instanceId },
                    data: {
                        connectionStatus: 'close',
                        disconnectionAt: new Date(),
                        disconnectionReasonCode: statusCode,
                        disconnectionObject: JSON.stringify(lastDisconnect),
                    },
                });
                if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                    this.chatwootService.eventWhatsapp(wa_types_1.Events.STATUS_INSTANCE, { instanceName: this.instance.name, instanceId: this.instanceId }, { instance: this.instance.name, status: 'closed' });
                }
                this.eventEmitter.emit('logout.instance', this.instance.name, 'inner');
                this.client?.ws?.close();
                this.client.end(new Error('Close connection'));
                this.sendDataWebhook(wa_types_1.Events.CONNECTION_UPDATE, { instance: this.instance.name, ...this.stateConnection });
            }
        }
        if (connection === 'open') {
            this.instance.wuid = this.client.user.id.replace(/:\d+/, '');
            try {
                const profilePic = await this.profilePicture(this.instance.wuid);
                this.instance.profilePictureUrl = profilePic.profilePictureUrl;
            }
            catch (error) {
                this.instance.profilePictureUrl = null;
            }
            const formattedWuid = this.instance.wuid.split('@')[0].padEnd(30, ' ');
            const formattedName = this.instance.name;
            this.logger.info(`
        ┌──────────────────────────────┐
        │    CONNECTED TO WHATSAPP     │
        └──────────────────────────────┘`.replace(/^ +/gm, '  '));
            this.logger.info(`
        wuid: ${formattedWuid}
        name: ${formattedName}
      `);
            await this.prismaRepository.instance.update({
                where: { id: this.instanceId },
                data: {
                    ownerJid: this.instance.wuid,
                    profileName: (await this.getProfileName()),
                    profilePicUrl: this.instance.profilePictureUrl,
                    connectionStatus: 'open',
                },
            });
            if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                this.chatwootService.eventWhatsapp(wa_types_1.Events.CONNECTION_UPDATE, { instanceName: this.instance.name, instanceId: this.instanceId }, { instance: this.instance.name, status: 'open' });
                this.syncChatwootLostMessages();
            }
            this.sendDataWebhook(wa_types_1.Events.CONNECTION_UPDATE, {
                instance: this.instance.name,
                wuid: this.instance.wuid,
                profileName: await this.getProfileName(),
                profilePictureUrl: this.instance.profilePictureUrl,
                ...this.stateConnection,
            });
        }
        if (connection === 'connecting') {
            this.sendDataWebhook(wa_types_1.Events.CONNECTION_UPDATE, { instance: this.instance.name, ...this.stateConnection });
        }
    }
    async getMessage(key, full = false) {
        try {
            const webMessageInfo = (await this.prismaRepository.message.findMany({
                where: { instanceId: this.instanceId, key: { path: ['id'], equals: key.id } },
            }));
            if (full) {
                return webMessageInfo[0];
            }
            if (webMessageInfo[0].message?.pollCreationMessage) {
                const messageSecretBase64 = webMessageInfo[0].message?.messageContextInfo?.messageSecret;
                if (typeof messageSecretBase64 === 'string') {
                    const messageSecret = Buffer.from(messageSecretBase64, 'base64');
                    const msg = {
                        messageContextInfo: { messageSecret },
                        pollCreationMessage: webMessageInfo[0].message?.pollCreationMessage,
                    };
                    return msg;
                }
            }
            return webMessageInfo[0].message;
        }
        catch (error) {
            return { conversation: '' };
        }
    }
    async defineAuthState() {
        const db = this.configService.get('DATABASE');
        const cache = this.configService.get('CACHE');
        const provider = this.configService.get('PROVIDER');
        if (provider?.ENABLED) {
            return await this.authStateProvider.authStateProvider(this.instance.id);
        }
        if (cache?.REDIS.ENABLED && cache?.REDIS.SAVE_INSTANCES) {
            this.logger.info('Redis enabled');
            return await (0, use_multi_file_auth_state_redis_db_1.useMultiFileAuthStateRedisDb)(this.instance.id, this.cache);
        }
        if (db.SAVE_DATA.INSTANCE) {
            return await (0, use_multi_file_auth_state_prisma_1.default)(this.instance.id, this.cache);
        }
    }
    async createClient(number) {
        this.instance.authState = await this.defineAuthState();
        const session = this.configService.get('CONFIG_SESSION_PHONE');
        let browserOptions = {};
        if (number || this.phoneNumber) {
            this.phoneNumber = number;
            this.logger.info(`Phone number: ${number}`);
        }
        else {
            const browser = [session.CLIENT, session.NAME, (0, os_1.release)()];
            browserOptions = { browser };
            this.logger.info(`Browser: ${browser}`);
        }
        const baileysVersion = await (0, fetchLatestWaWebVersion_1.fetchLatestWaWebVersion)({});
        const version = baileysVersion.version;
        const log = `Baileys version: ${version.join('.')}`;
        this.logger.info(log);
        this.logger.info(`Group Ignore: ${this.localSettings.groupsIgnore}`);
        let options;
        if (this.localProxy?.enabled) {
            this.logger.info('Proxy enabled: ' + this.localProxy?.host);
            if (this.localProxy?.host?.includes('proxyscrape')) {
                try {
                    const response = await axios_1.default.get(this.localProxy?.host);
                    const text = response.data;
                    const proxyUrls = text.split('\r\n');
                    const rand = Math.floor(Math.random() * Math.floor(proxyUrls.length));
                    const proxyUrl = 'http://' + proxyUrls[rand];
                    options = { agent: (0, makeProxyAgent_1.makeProxyAgent)(proxyUrl), fetchAgent: (0, makeProxyAgent_1.makeProxyAgent)(proxyUrl) };
                }
                catch (error) {
                    this.localProxy.enabled = false;
                }
            }
            else {
                options = {
                    agent: (0, makeProxyAgent_1.makeProxyAgent)({
                        host: this.localProxy.host,
                        port: this.localProxy.port,
                        protocol: this.localProxy.protocol,
                        username: this.localProxy.username,
                        password: this.localProxy.password,
                    }),
                    fetchAgent: (0, makeProxyAgent_1.makeProxyAgent)({
                        host: this.localProxy.host,
                        port: this.localProxy.port,
                        protocol: this.localProxy.protocol,
                        username: this.localProxy.username,
                        password: this.localProxy.password,
                    }),
                };
            }
        }
        const socketConfig = {
            ...options,
            version,
            logger: (0, pino_1.default)({ level: this.logBaileys }),
            printQRInTerminal: false,
            auth: {
                creds: this.instance.authState.state.creds,
                keys: (0, baileys_1.makeCacheableSignalKeyStore)(this.instance.authState.state.keys, (0, pino_1.default)({ level: 'error' })),
            },
            msgRetryCounterCache: this.msgRetryCounterCache,
            generateHighQualityLinkPreview: true,
            getMessage: async (key) => (await this.getMessage(key)),
            ...browserOptions,
            markOnlineOnConnect: this.localSettings.alwaysOnline,
            retryRequestDelayMs: 350,
            maxMsgRetryCount: 4,
            fireInitQueries: true,
            connectTimeoutMs: 30000,
            keepAliveIntervalMs: 30000,
            qrTimeout: 45000,
            emitOwnEvents: false,
            shouldIgnoreJid: (jid) => {
                if (this.localSettings.syncFullHistory && (0, baileys_1.isJidGroup)(jid)) {
                    return false;
                }
                const isGroupJid = this.localSettings.groupsIgnore && (0, baileys_1.isJidGroup)(jid);
                const isBroadcast = !this.localSettings.readStatus && (0, baileys_1.isJidBroadcast)(jid);
                const isNewsletter = jid?.includes('@newsletter');
                return isGroupJid || isBroadcast || isNewsletter;
            },
            syncFullHistory: this.localSettings.syncFullHistory,
            shouldSyncHistoryMessage: (msg) => {
                return this.historySyncNotification(msg);
            },
            cachedGroupMetadata: this.getGroupMetadataCache,
            userDevicesCache: this.userDevicesCache,
            transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
            patchMessageBeforeSending(message) {
                if (message.deviceSentMessage?.message?.listMessage?.listType === baileys_1.proto.Message.ListMessage.ListType.PRODUCT_LIST) {
                    message = JSON.parse(JSON.stringify(message));
                    message.deviceSentMessage.message.listMessage.listType = baileys_1.proto.Message.ListMessage.ListType.SINGLE_SELECT;
                }
                if (message.listMessage?.listType == baileys_1.proto.Message.ListMessage.ListType.PRODUCT_LIST) {
                    message = JSON.parse(JSON.stringify(message));
                    message.listMessage.listType = baileys_1.proto.Message.ListMessage.ListType.SINGLE_SELECT;
                }
                return message;
            },
        };
        this.endSession = false;
        this.client = (0, baileys_1.default)(socketConfig);
        if (this.localSettings.wavoipToken && this.localSettings.wavoipToken.length > 0) {
            (0, useVoiceCallsBaileys_1.useVoiceCallsBaileys)(this.localSettings.wavoipToken, this.client, this.connectionStatus.state, true);
        }
        this.eventHandler();
        this.client.ws.on('CB:call', (packet) => {
            console.log('CB:call', packet);
            const payload = { event: 'CB:call', packet: packet };
            this.sendDataWebhook(wa_types_1.Events.CALL, payload, true, ['websocket']);
        });
        this.client.ws.on('CB:ack,class:call', (packet) => {
            console.log('CB:ack,class:call', packet);
            const payload = { event: 'CB:ack,class:call', packet: packet };
            this.sendDataWebhook(wa_types_1.Events.CALL, payload, true, ['websocket']);
        });
        this.phoneNumber = number;
        return this.client;
    }
    async connectToWhatsapp(number) {
        const TAG = "connect-flow:whatsapp.baileys";
        function logStep(step, data) {
            const { toMessage } = require('../../../../lib/toMessage');
            console.error(TAG, step, data ? { message: toMessage(data) } : undefined);
        }
        try {
            logStep("iniciando connectToWhatsapp Baileys");
            this.loadChatwoot();
            this.loadSettings();
            this.loadWebhook();
            this.loadProxy();
            logStep("antes do createClient");
            const client = await this.createClient(number);
            logStep("createClient concluído");
            return client;
        }
        catch (error) {
            logStep("erro no connectToWhatsapp Baileys", error);
            this.logger.error(error);
            const { toMessage } = require('../../../../lib/toMessage');
            throw new _exceptions_1.InternalServerErrorException(toMessage(error));
        }
    }
    async reloadConnection() {
        try {
            return await this.createClient(this.phoneNumber);
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.InternalServerErrorException(error instanceof Error ? error.message : String(error));
        }
    }
    eventHandler() {
        this.client.ev.process(async (events) => {
            if (!this.endSession) {
                const database = this.configService.get('DATABASE');
                const settings = await this.findSettings();
                if (events.call) {
                    const call = events.call[0];
                    if (settings?.rejectCall && call.status == 'offer') {
                        this.client.rejectCall(call.id, call.from);
                    }
                    if (settings?.msgCall?.trim().length > 0 && call.status == 'offer') {
                        const msg = await this.client.sendMessage(call.from, { text: settings.msgCall });
                        this.client.ev.emit('messages.upsert', { messages: [msg], type: 'notify' });
                    }
                    this.sendDataWebhook(wa_types_1.Events.CALL, call);
                }
                if (events['connection.update']) {
                    this.connectionUpdate(events['connection.update']);
                }
                if (events['creds.update']) {
                    this.instance.authState.saveCreds();
                }
                if (events['messaging-history.set']) {
                    const payload = events['messaging-history.set'];
                    this.messageHandle['messaging-history.set'](payload);
                }
                if (events['messages.upsert']) {
                    const payload = events['messages.upsert'];
                    this.messageProcessor.processMessage(payload, settings);
                }
                if (events['messages.update']) {
                    const payload = events['messages.update'];
                    this.messageHandle['messages.update'](payload, settings);
                }
                if (events['message-receipt.update']) {
                    const payload = events['message-receipt.update'];
                    const remotesJidMap = {};
                    for (const event of payload) {
                        if (typeof event.key.remoteJid === 'string' && typeof event.receipt.readTimestamp === 'number') {
                            remotesJidMap[event.key.remoteJid] = event.receipt.readTimestamp;
                        }
                    }
                    await Promise.all(Object.keys(remotesJidMap).map(async (remoteJid) => this.updateMessagesReadedByTimestamp(remoteJid, remotesJidMap[remoteJid])));
                }
                if (events['presence.update']) {
                    const payload = events['presence.update'];
                    if (settings?.groupsIgnore && payload.id.includes('@g.us')) {
                        return;
                    }
                    this.sendDataWebhook(wa_types_1.Events.PRESENCE_UPDATE, payload);
                }
                if (!settings?.groupsIgnore) {
                    if (events['groups.upsert']) {
                        const payload = events['groups.upsert'];
                        this.groupHandler['groups.upsert'](payload);
                    }
                    if (events['groups.update']) {
                        const payload = events['groups.update'];
                        this.groupHandler['groups.update'](payload);
                    }
                    if (events['group-participants.update']) {
                        const payload = events['group-participants.update'];
                        this.groupHandler['group-participants.update'](payload);
                    }
                }
                if (events['chats.upsert']) {
                    const payload = events['chats.upsert'];
                    this.chatHandle['chats.upsert'](payload);
                }
                if (events['chats.update']) {
                    const payload = events['chats.update'];
                    this.chatHandle['chats.update'](payload);
                }
                if (events['chats.delete']) {
                    const payload = events['chats.delete'];
                    this.chatHandle['chats.delete'](payload);
                }
                if (events['contacts.upsert']) {
                    const payload = events['contacts.upsert'];
                    this.contactHandle['contacts.upsert'](payload);
                }
                if (events['contacts.update']) {
                    const payload = events['contacts.update'];
                    this.contactHandle['contacts.update'](payload);
                }
                if (events[wa_types_1.Events.LABELS_ASSOCIATION]) {
                    const payload = events[wa_types_1.Events.LABELS_ASSOCIATION];
                    this.labelHandle[wa_types_1.Events.LABELS_ASSOCIATION](payload, database);
                    return;
                }
                if (events[wa_types_1.Events.LABELS_EDIT]) {
                    const payload = events[wa_types_1.Events.LABELS_EDIT];
                    this.labelHandle[wa_types_1.Events.LABELS_EDIT](payload);
                    return;
                }
            }
        });
    }
    historySyncNotification(msg) {
        const instance = { instanceName: this.instance.name };
        if (this.configService.get('CHATWOOT').ENABLED &&
            this.localChatwoot?.enabled &&
            this.localChatwoot.importMessages &&
            this.isSyncNotificationFromUsedSyncType(msg)) {
            if (msg.chunkOrder === 1) {
                this.chatwootService.startImportHistoryMessages(instance);
            }
            if (msg.progress === 100) {
                setTimeout(() => {
                    this.chatwootService.importHistoryMessages(instance);
                }, 10000);
            }
        }
        return true;
    }
    isSyncNotificationFromUsedSyncType(msg) {
        return ((this.localSettings.syncFullHistory && msg?.syncType === 2) ||
            (!this.localSettings.syncFullHistory && msg?.syncType === 3));
    }
    async profilePicture(number) {
        const jid = (0, createJid_1.createJid)(number);
        try {
            const profilePictureUrl = await this.client.profilePictureUrl(jid, 'image');
            return { wuid: jid, profilePictureUrl };
        }
        catch (error) {
            return { wuid: jid, profilePictureUrl: null };
        }
    }
    async getStatus(number) {
        const jid = (0, createJid_1.createJid)(number);
        try {
            return { wuid: jid, status: (await this.client.fetchStatus(jid))[0]?.status };
        }
        catch (error) {
            return { wuid: jid, status: null };
        }
    }
    async fetchProfile(instanceName, number) {
        const jid = number ? (0, createJid_1.createJid)(number) : this.client?.user?.id;
        const onWhatsapp = (await this.whatsappNumber({ numbers: [jid] }))?.shift();
        if (!onWhatsapp.exists) {
            throw new _exceptions_1.BadRequestException(onWhatsapp);
        }
        try {
            if (number) {
                const info = (await this.whatsappNumber({ numbers: [jid] }))?.shift();
                const picture = await this.profilePicture(info?.jid);
                const status = await this.getStatus(info?.jid);
                const business = await this.fetchBusinessProfile(info?.jid);
                return {
                    wuid: info?.jid || jid,
                    name: info?.name,
                    numberExists: info?.exists,
                    picture: picture?.profilePictureUrl,
                    status: status?.status,
                    isBusiness: business.isBusiness,
                    email: business?.email,
                    description: business?.description,
                    website: business?.website?.shift(),
                };
            }
            else {
                const instanceNames = instanceName ? [instanceName] : null;
                const info = await server_module_1.waMonitor.instanceInfo(instanceNames);
                const business = await this.fetchBusinessProfile(jid);
                return {
                    wuid: jid,
                    name: info?.profileName,
                    numberExists: true,
                    picture: info?.profilePicUrl,
                    status: info?.connectionStatus,
                    isBusiness: business.isBusiness,
                    email: business?.email,
                    description: business?.description,
                    website: business?.website?.shift(),
                };
            }
        }
        catch (error) {
            return { wuid: jid, name: null, picture: null, status: null, os: null, isBusiness: false };
        }
    }
    async offerCall({ number, isVideo, callDuration }) {
        const jid = (0, createJid_1.createJid)(number);
        try {
            return { id: '123', jid, isVideo, callDuration };
        }
        catch (error) {
            return error;
        }
    }
    async sendMessage(sender, message, mentions, linkPreview, quoted, messageId, ephemeralExpiration) {
        sender = sender.toLowerCase();
        const option = { quoted };
        if ((0, baileys_1.isJidGroup)(sender)) {
            option.useCachedGroupMetadata = true;
        }
        if (ephemeralExpiration)
            option.ephemeralExpiration = ephemeralExpiration;
        if (messageId)
            option.messageId = messageId;
        else
            option.messageId = '3EB0' + (0, crypto_1.randomBytes)(18).toString('hex').toUpperCase();
        if (message['viewOnceMessage']) {
            const m = (0, baileys_1.generateWAMessageFromContent)(sender, message, {
                timestamp: new Date(),
                userJid: this.instance.wuid,
                messageId,
                quoted,
            });
            const id = await this.client.relayMessage(sender, message, { messageId });
            m.key = { id: id, remoteJid: sender, participant: (0, baileys_1.isJidUser)(sender) ? sender : undefined, fromMe: true };
            for (const [key, value] of Object.entries(m)) {
                if (!value || ((0, class_validator_1.isArray)(value) && value.length) === 0) {
                    delete m[key];
                }
            }
            return m;
        }
        if (!message['audio'] &&
            !message['poll'] &&
            !message['sticker'] &&
            !message['conversation'] &&
            sender !== 'status@broadcast') {
            if (message['reactionMessage']) {
                return await this.client.sendMessage(sender, {
                    react: { text: message['reactionMessage']['text'], key: message['reactionMessage']['key'] },
                }, option);
            }
        }
        if (message['conversation']) {
            return await this.client.sendMessage(sender, { text: message['conversation'], mentions, linkPreview: linkPreview }, option);
        }
        if (!message['audio'] && !message['poll'] && !message['sticker'] && sender != 'status@broadcast') {
            return await this.client.sendMessage(sender, { forward: { key: { remoteJid: this.instance.wuid, fromMe: true }, message }, mentions }, option);
        }
        if (sender === 'status@broadcast') {
            let jidList;
            if (message['status'].option.allContacts) {
                const contacts = await this.prismaRepository.contact.findMany({
                    where: { instanceId: this.instanceId, remoteJid: { not: { endsWith: '@g.us' } } },
                });
                jidList = contacts.map((contact) => contact.remoteJid);
            }
            else {
                jidList = message['status'].option.statusJidList;
            }
            const batchSize = 10;
            const batches = Array.from({ length: Math.ceil(jidList.length / batchSize) }, (_, i) => jidList.slice(i * batchSize, i * batchSize + batchSize));
            let msgId = null;
            let firstMessage;
            const firstBatch = batches.shift();
            if (firstBatch) {
                firstMessage = await this.client.sendMessage(sender, message['status'].content, {
                    backgroundColor: message['status'].option.backgroundColor,
                    font: message['status'].option.font,
                    statusJidList: firstBatch,
                });
                msgId = firstMessage.key.id;
            }
            if (batches.length === 0)
                return firstMessage;
            await Promise.allSettled(batches.map(async (batch) => {
                const messageSent = await this.client.sendMessage(sender, message['status'].content, {
                    backgroundColor: message['status'].option.backgroundColor,
                    font: message['status'].option.font,
                    statusJidList: batch,
                    messageId: msgId,
                });
                return messageSent;
            }));
            return firstMessage;
        }
        return await this.client.sendMessage(sender, message, option);
    }
    async sendMessageWithTyping(number, message, options, isIntegration = false) {
        const isWA = (await this.whatsappNumber({ numbers: [number] }))?.shift();
        if (!isWA.exists && !(0, baileys_1.isJidGroup)(isWA.jid) && !isWA.jid.includes('@broadcast')) {
            throw new _exceptions_1.BadRequestException(isWA);
        }
        const sender = isWA.jid.toLowerCase();
        this.logger.verbose(`Sending message to ${sender}`);
        try {
            if (options?.delay) {
                this.logger.verbose(`Typing for ${options.delay}ms to ${sender}`);
                if (options.delay > 20000) {
                    let remainingDelay = options.delay;
                    while (remainingDelay > 20000) {
                        await this.client.presenceSubscribe(sender);
                        await this.client.sendPresenceUpdate(options.presence ?? 'composing', sender);
                        await (0, baileys_1.delay)(20000);
                        await this.client.sendPresenceUpdate('paused', sender);
                        remainingDelay -= 20000;
                    }
                    if (remainingDelay > 0) {
                        await this.client.presenceSubscribe(sender);
                        await this.client.sendPresenceUpdate(options.presence ?? 'composing', sender);
                        await (0, baileys_1.delay)(remainingDelay);
                        await this.client.sendPresenceUpdate('paused', sender);
                    }
                }
                else {
                    await this.client.presenceSubscribe(sender);
                    await this.client.sendPresenceUpdate(options.presence ?? 'composing', sender);
                    await (0, baileys_1.delay)(options.delay);
                    await this.client.sendPresenceUpdate('paused', sender);
                }
            }
            const linkPreview = options?.linkPreview != false ? undefined : false;
            let quoted;
            if (options?.quoted) {
                const m = options?.quoted;
                const msg = m?.message ? m : (await this.getMessage(m.key, true));
                if (msg) {
                    quoted = msg;
                }
            }
            let messageSent;
            let mentions;
            if ((0, baileys_1.isJidGroup)(sender)) {
                let group;
                try {
                    const cache = this.configService.get('CACHE');
                    if (!cache.REDIS.ENABLED && !cache.LOCAL.ENABLED)
                        group = await this.findGroup({ groupJid: sender }, 'inner');
                    else
                        group = await this.getGroupMetadataCache(sender);
                }
                catch (error) {
                    throw new _exceptions_1.NotFoundException('Group not found');
                }
                if (!group) {
                    throw new _exceptions_1.NotFoundException('Group not found');
                }
                if (options?.mentionsEveryOne) {
                    mentions = group.participants.map((participant) => participant.id);
                }
                else if (options?.mentioned?.length) {
                    mentions = options.mentioned.map((mention) => {
                        const jid = (0, createJid_1.createJid)(mention);
                        if ((0, baileys_1.isJidGroup)(jid)) {
                            return null;
                        }
                        return jid;
                    });
                }
                messageSent = await this.sendMessage(sender, message, mentions, linkPreview, quoted, null, group?.ephemeralDuration);
            }
            else {
                messageSent = await this.sendMessage(sender, message, mentions, linkPreview, quoted);
            }
            if (long_1.default.isLong(messageSent?.messageTimestamp)) {
                messageSent.messageTimestamp = messageSent.messageTimestamp?.toNumber();
            }
            const messageRaw = this.prepareMessage(messageSent);
            const isMedia = messageSent?.message?.imageMessage ||
                messageSent?.message?.videoMessage ||
                messageSent?.message?.stickerMessage ||
                messageSent?.message?.ptvMessage ||
                messageSent?.message?.documentMessage ||
                messageSent?.message?.documentWithCaptionMessage ||
                messageSent?.message?.ptvMessage ||
                messageSent?.message?.audioMessage;
            if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled && !isIntegration) {
                this.chatwootService.eventWhatsapp(wa_types_1.Events.SEND_MESSAGE, { instanceName: this.instance.name, instanceId: this.instanceId }, messageRaw);
            }
            if (this.configService.get('OPENAI').ENABLED && messageRaw?.message?.audioMessage) {
                const openAiDefaultSettings = await this.prismaRepository.openaiSetting.findFirst({
                    where: { instanceId: this.instanceId },
                    include: { OpenaiCreds: true },
                });
                if (openAiDefaultSettings && openAiDefaultSettings.openaiCredsId && openAiDefaultSettings.speechToText) {
                    messageRaw.message.speechToText = `[audio] ${await this.openaiService.speechToText(messageRaw, this)}`;
                }
            }
            if (this.configService.get('DATABASE').SAVE_DATA.NEW_MESSAGE) {
                const msg = await this.prismaRepository.message.create({ data: messageRaw });
                if (isMedia && this.configService.get('S3').ENABLE) {
                    try {
                        const message = messageRaw;
                        const hasRealMedia = this.hasValidMediaContent(message);
                        if (!hasRealMedia) {
                            this.logger.warn('Message detected as media but contains no valid media content');
                        }
                        else {
                            const media = await this.getBase64FromMediaMessage({ message }, true);
                            const { buffer, mediaType, fileName, size } = media;
                            const mimetype = mime_types_1.default.lookup(fileName).toString();
                            const fullName = (0, path_1.join)(`${this.instance.id}`, messageRaw.key.remoteJid, `${messageRaw.key.id}`, mediaType, fileName);
                            await s3Service.uploadFile(fullName, buffer, size.fileLength?.low, { 'Content-Type': mimetype });
                            await this.prismaRepository.media.create({
                                data: { messageId: msg.id, instanceId: this.instanceId, type: mediaType, fileName: fullName, mimetype },
                            });
                            const mediaUrl = await s3Service.getObjectUrl(fullName);
                            messageRaw.message.mediaUrl = mediaUrl;
                            await this.prismaRepository.message.update({ where: { id: msg.id }, data: messageRaw });
                        }
                    }
                    catch (error) {
                        this.logger.error(['Error on upload file to minio', error?.message, error?.stack]);
                    }
                }
            }
            if (this.localWebhook.enabled) {
                if (isMedia && this.localWebhook.webhookBase64) {
                    try {
                        const buffer = await (0, baileys_1.downloadMediaMessage)({ key: messageRaw.key, message: messageRaw?.message }, 'buffer', {}, { logger: (0, pino_1.default)({ level: 'error' }), reuploadRequest: this.client.updateMediaMessage });
                        if (buffer) {
                            messageRaw.message.base64 = buffer.toString('base64');
                        }
                        else {
                            const buffer = await (0, baileys_1.downloadMediaMessage)({ key: messageRaw.key, message: messageRaw?.message }, 'buffer', {}, { logger: (0, pino_1.default)({ level: 'error' }), reuploadRequest: this.client.updateMediaMessage });
                            if (buffer) {
                                messageRaw.message.base64 = buffer.toString('base64');
                            }
                        }
                    }
                    catch (error) {
                        this.logger.error(['Error converting media to base64', error?.message]);
                    }
                }
            }
            this.logger.log(messageRaw);
            this.sendDataWebhook(wa_types_1.Events.SEND_MESSAGE, messageRaw);
            if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled && isIntegration) {
                await server_module_1.chatbotController.emit({
                    instance: { instanceName: this.instance.name, instanceId: this.instanceId },
                    remoteJid: messageRaw.key.remoteJid,
                    msg: messageRaw,
                    pushName: messageRaw.pushName,
                    isIntegration,
                });
            }
            return messageRaw;
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async sendPresence(data) {
        try {
            const { number } = data;
            const isWA = (await this.whatsappNumber({ numbers: [number] }))?.shift();
            if (!isWA.exists && !(0, baileys_1.isJidGroup)(isWA.jid) && !isWA.jid.includes('@broadcast')) {
                throw new _exceptions_1.BadRequestException(isWA);
            }
            const sender = isWA.jid;
            if (data?.delay && data?.delay > 20000) {
                let remainingDelay = data?.delay;
                while (remainingDelay > 20000) {
                    await this.client.presenceSubscribe(sender);
                    await this.client.sendPresenceUpdate(data?.presence ?? 'composing', sender);
                    await (0, baileys_1.delay)(20000);
                    await this.client.sendPresenceUpdate('paused', sender);
                    remainingDelay -= 20000;
                }
                if (remainingDelay > 0) {
                    await this.client.presenceSubscribe(sender);
                    await this.client.sendPresenceUpdate(data?.presence ?? 'composing', sender);
                    await (0, baileys_1.delay)(remainingDelay);
                    await this.client.sendPresenceUpdate('paused', sender);
                }
            }
            else {
                await this.client.presenceSubscribe(sender);
                await this.client.sendPresenceUpdate(data?.presence ?? 'composing', sender);
                await (0, baileys_1.delay)(data?.delay);
                await this.client.sendPresenceUpdate('paused', sender);
            }
            return { presence: data.presence };
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async setPresence(data) {
        try {
            await this.client.sendPresenceUpdate(data.presence);
            return { presence: data.presence };
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async textMessage(data, isIntegration = false) {
        const text = data.text;
        if (!text || text.trim().length === 0) {
            throw new _exceptions_1.BadRequestException('Text is required');
        }
        return await this.sendMessageWithTyping(data.number, { conversation: data.text }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            linkPreview: data?.linkPreview,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        }, isIntegration);
    }
    async pollMessage(data) {
        return await this.sendMessageWithTyping(data.number, { poll: { name: data.name, selectableCount: data.selectableCount, values: data.values } }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            linkPreview: data?.linkPreview,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        });
    }
    async formatStatusMessage(status) {
        if (!status.type) {
            throw new _exceptions_1.BadRequestException('Type is required');
        }
        if (!status.content) {
            throw new _exceptions_1.BadRequestException('Content is required');
        }
        if (status.allContacts) {
            const contacts = await this.prismaRepository.contact.findMany({ where: { instanceId: this.instanceId } });
            if (!contacts.length) {
                throw new _exceptions_1.BadRequestException('Contacts not found');
            }
            status.statusJidList = contacts.filter((contact) => contact.pushName).map((contact) => contact.remoteJid);
        }
        if (!status.statusJidList?.length && !status.allContacts) {
            throw new _exceptions_1.BadRequestException('StatusJidList is required');
        }
        if (status.type === 'text') {
            if (!status.backgroundColor) {
                throw new _exceptions_1.BadRequestException('Background color is required');
            }
            if (!status.font) {
                throw new _exceptions_1.BadRequestException('Font is required');
            }
            return {
                content: { text: status.content },
                option: { backgroundColor: status.backgroundColor, font: status.font, statusJidList: status.statusJidList },
            };
        }
        if (status.type === 'image') {
            return {
                content: { image: { url: status.content }, caption: status.caption },
                option: { statusJidList: status.statusJidList },
            };
        }
        if (status.type === 'video') {
            return {
                content: { video: { url: status.content }, caption: status.caption },
                option: { statusJidList: status.statusJidList },
            };
        }
        if (status.type === 'audio') {
            const convert = await this.processAudioMp4(status.content);
            if (Buffer.isBuffer(convert)) {
                const result = {
                    content: { audio: convert, ptt: true, mimetype: 'audio/ogg; codecs=opus' },
                    option: { statusJidList: status.statusJidList },
                };
                return result;
            }
            else {
                throw new _exceptions_1.InternalServerErrorException(convert);
            }
        }
        throw new _exceptions_1.BadRequestException('Type not found');
    }
    async statusMessage(data, file) {
        const mediaData = { ...data };
        if (file)
            mediaData.content = file.buffer.toString('base64');
        const status = await this.formatStatusMessage(mediaData);
        const statusSent = await this.sendMessageWithTyping('status@broadcast', { status });
        return statusSent;
    }
    async prepareMediaMessage(mediaMessage) {
        try {
            const type = mediaMessage.mediatype === 'ptv' ? 'video' : mediaMessage.mediatype;
            let mediaInput;
            if (mediaMessage.mediatype === 'image') {
                let imageBuffer;
                if ((0, class_validator_1.isURL)(mediaMessage.media)) {
                    let config = { responseType: 'arraybuffer' };
                    if (this.localProxy?.enabled) {
                        config = {
                            ...config,
                            httpsAgent: (0, makeProxyAgent_1.makeProxyAgent)({
                                host: this.localProxy.host,
                                port: this.localProxy.port,
                                protocol: this.localProxy.protocol,
                                username: this.localProxy.username,
                                password: this.localProxy.password,
                            }),
                        };
                    }
                    const response = await axios_1.default.get(mediaMessage.media, config);
                    imageBuffer = Buffer.from(response.data, 'binary');
                }
                else {
                    imageBuffer = Buffer.from(mediaMessage.media, 'base64');
                }
                mediaInput = await (0, sharp_1.default)(imageBuffer).jpeg().toBuffer();
                mediaMessage.fileName ?? (mediaMessage.fileName = 'image.jpg');
                mediaMessage.mimetype = 'image/jpeg';
            }
            else {
                mediaInput = (0, class_validator_1.isURL)(mediaMessage.media)
                    ? { url: mediaMessage.media }
                    : Buffer.from(mediaMessage.media, 'base64');
            }
            const prepareMedia = await (0, baileys_1.prepareWAMessageMedia)({
                [type]: mediaInput,
            }, { upload: this.client.waUploadToServer });
            const mediaType = mediaMessage.mediatype + 'Message';
            if (mediaMessage.mediatype === 'document' && !mediaMessage.fileName) {
                const regex = new RegExp(/.*\/(.+?)\./);
                const arrayMatch = regex.exec(mediaMessage.media);
                mediaMessage.fileName = arrayMatch[1];
            }
            if (mediaMessage.mediatype === 'image' && !mediaMessage.fileName) {
                mediaMessage.fileName = 'image.jpg';
            }
            if (mediaMessage.mediatype === 'video' && !mediaMessage.fileName) {
                mediaMessage.fileName = 'video.mp4';
            }
            let mimetype;
            if (mediaMessage.mimetype) {
                mimetype = mediaMessage.mimetype;
            }
            else {
                mimetype = mime_types_1.default.lookup(mediaMessage.fileName);
                if (!mimetype && (0, class_validator_1.isURL)(mediaMessage.media)) {
                    let config = { responseType: 'arraybuffer' };
                    if (this.localProxy?.enabled) {
                        config = {
                            ...config,
                            httpsAgent: (0, makeProxyAgent_1.makeProxyAgent)({
                                host: this.localProxy.host,
                                port: this.localProxy.port,
                                protocol: this.localProxy.protocol,
                                username: this.localProxy.username,
                                password: this.localProxy.password,
                            }),
                        };
                    }
                    const response = await axios_1.default.get(mediaMessage.media, config);
                    mimetype = response.headers['content-type'];
                }
            }
            if (mediaMessage.mediatype === 'ptv') {
                prepareMedia[mediaType] = prepareMedia[type + 'Message'];
                mimetype = 'video/mp4';
                if (!prepareMedia[mediaType]) {
                    throw new Error('Failed to prepare video message');
                }
                try {
                    let mediaInput;
                    if ((0, class_validator_1.isURL)(mediaMessage.media)) {
                        mediaInput = mediaMessage.media;
                    }
                    else {
                        const mediaBuffer = Buffer.from(mediaMessage.media, 'base64');
                        if (!mediaBuffer || mediaBuffer.length === 0) {
                            throw new Error('Invalid media buffer');
                        }
                        mediaInput = mediaBuffer;
                    }
                    const duration = await getVideoDuration(mediaInput);
                    if (!duration || duration <= 0) {
                        throw new Error('Invalid media duration');
                    }
                    this.logger.verbose(`Video duration: ${duration} seconds`);
                    prepareMedia[mediaType].seconds = duration;
                }
                catch (error) {
                    this.logger.error('Error getting video duration:');
                    this.logger.error(error);
                    throw new Error(`Failed to get video duration: ${error.message}`);
                }
            }
            prepareMedia[mediaType].caption = mediaMessage?.caption;
            prepareMedia[mediaType].mimetype = mimetype;
            prepareMedia[mediaType].fileName = mediaMessage.fileName;
            if (mediaMessage.mediatype === 'video') {
                prepareMedia[mediaType].gifPlayback = false;
            }
            return (0, baileys_1.generateWAMessageFromContent)('', { [mediaType]: { ...prepareMedia[mediaType] } }, { userJid: this.instance.wuid });
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.InternalServerErrorException(error instanceof Error ? error.message : String(error) || error);
        }
    }
    async convertToWebP(image) {
        try {
            let imageBuffer;
            if ((0, class_validator_1.isBase64)(image)) {
                const base64Data = image.replace(/^data:image\/(jpeg|png|gif);base64,/, '');
                imageBuffer = Buffer.from(base64Data, 'base64');
            }
            else {
                const timestamp = new Date().getTime();
                const parsedURL = new URL(image);
                parsedURL.searchParams.set('timestamp', timestamp.toString());
                const url = parsedURL.toString();
                let config = { responseType: 'arraybuffer' };
                if (this.localProxy?.enabled) {
                    config = {
                        ...config,
                        httpsAgent: (0, makeProxyAgent_1.makeProxyAgent)({
                            host: this.localProxy.host,
                            port: this.localProxy.port,
                            protocol: this.localProxy.protocol,
                            username: this.localProxy.username,
                            password: this.localProxy.password,
                        }),
                    };
                }
                const response = await axios_1.default.get(url, config);
                imageBuffer = Buffer.from(response.data, 'binary');
            }
            const isAnimated = this.isAnimated(image, imageBuffer);
            if (isAnimated) {
                return await (0, sharp_1.default)(imageBuffer, { animated: true }).webp({ quality: 80 }).toBuffer();
            }
            else {
                return await (0, sharp_1.default)(imageBuffer).webp().toBuffer();
            }
        }
        catch (error) {
            console.error('Erro ao converter a imagem para WebP:', error);
            throw error;
        }
    }
    isAnimatedWebp(buffer) {
        if (buffer.length < 12)
            return false;
        return buffer.indexOf(Buffer.from('ANIM')) !== -1;
    }
    isAnimated(image, buffer) {
        const lowerCaseImage = image.toLowerCase();
        if (lowerCaseImage.includes('.gif'))
            return true;
        if (lowerCaseImage.includes('.webp'))
            return this.isAnimatedWebp(buffer);
        return false;
    }
    async mediaSticker(data, file) {
        const mediaData = { ...data };
        if (file)
            mediaData.sticker = file.buffer.toString('base64');
        const convert = data?.notConvertSticker
            ? Buffer.from(data.sticker, 'base64')
            : await this.convertToWebP(data.sticker);
        const gifPlayback = data.sticker.includes('.gif');
        const result = await this.sendMessageWithTyping(data.number, { sticker: convert, gifPlayback }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        });
        return result;
    }
    async mediaMessage(data, file, isIntegration = false) {
        const mediaData = { ...data };
        if (file)
            mediaData.media = file.buffer.toString('base64');
        const generate = await this.prepareMediaMessage(mediaData);
        const mediaSent = await this.sendMessageWithTyping(data.number, { ...generate.message }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        }, isIntegration);
        return mediaSent;
    }
    async ptvMessage(data, file, isIntegration = false) {
        const mediaData = {
            number: data.number,
            media: data.video,
            mediatype: 'ptv',
            delay: data?.delay,
            quoted: data?.quoted,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        };
        if (file)
            mediaData.media = file.buffer.toString('base64');
        const generate = await this.prepareMediaMessage(mediaData);
        const mediaSent = await this.sendMessageWithTyping(data.number, { ...generate.message }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        }, isIntegration);
        return mediaSent;
    }
    async processAudioMp4(audio) {
        let inputStream;
        if ((0, class_validator_1.isURL)(audio)) {
            const response = await axios_1.default.get(audio, { responseType: 'stream' });
            inputStream = response.data;
        }
        else {
            const audioBuffer = Buffer.from(audio, 'base64');
            inputStream = new stream_1.PassThrough();
            inputStream.end(audioBuffer);
        }
        return new Promise((resolve, reject) => {
            const ffmpegProcess = (0, child_process_1.spawn)(ffmpeg_1.default.path, [
                '-i',
                'pipe:0',
                '-vn',
                '-ab',
                '128k',
                '-ar',
                '44100',
                '-f',
                'mp4',
                '-movflags',
                'frag_keyframe+empty_moov',
                'pipe:1',
            ]);
            const outputChunks = [];
            let stderrData = '';
            ffmpegProcess.stdout.on('data', (chunk) => {
                outputChunks.push(chunk);
            });
            ffmpegProcess.stderr.on('data', (data) => {
                stderrData += data.toString();
                this.logger.verbose(`ffmpeg stderr: ${data}`);
            });
            ffmpegProcess.on('error', (error) => {
                console.error('Error in ffmpeg process', error);
                reject(error);
            });
            ffmpegProcess.on('close', (code) => {
                if (code === 0) {
                    this.logger.verbose('Audio converted to mp4');
                    const outputBuffer = Buffer.concat(outputChunks);
                    resolve(outputBuffer);
                }
                else {
                    this.logger.error(`ffmpeg exited with code ${code}`);
                    this.logger.error(`ffmpeg stderr: ${stderrData}`);
                    reject(new Error(`ffmpeg exited with code ${code}: ${stderrData}`));
                }
            });
            inputStream.pipe(ffmpegProcess.stdin);
            inputStream.on('error', (err) => {
                console.error('Error in inputStream', err);
                ffmpegProcess.stdin.end();
                reject(err);
            });
        });
    }
    async processAudio(audio) {
        if (process.env.API_AUDIO_CONVERTER) {
            this.logger.verbose('Using audio converter API');
            const formData = new form_data_1.default();
            if ((0, class_validator_1.isURL)(audio)) {
                formData.append('url', audio);
            }
            else {
                formData.append('base64', audio);
            }
            const { data } = await axios_1.default.post(process.env.API_AUDIO_CONVERTER, formData, {
                headers: { ...formData.getHeaders(), apikey: process.env.API_AUDIO_CONVERTER_KEY },
            });
            if (!data.audio) {
                throw new _exceptions_1.InternalServerErrorException('Failed to convert audio');
            }
            this.logger.verbose('Audio converted');
            return Buffer.from(data.audio, 'base64');
        }
        else {
            let inputAudioStream;
            if ((0, class_validator_1.isURL)(audio)) {
                const timestamp = new Date().getTime();
                const parsedURL = new URL(audio);
                parsedURL.searchParams.set('timestamp', timestamp.toString());
                const url = parsedURL.toString();
                const config = { responseType: 'stream' };
                const response = await axios_1.default.get(url, config);
                inputAudioStream = response.data.pipe(new stream_1.PassThrough());
            }
            else {
                const audioBuffer = Buffer.from(audio, 'base64');
                inputAudioStream = new stream_1.PassThrough();
                inputAudioStream.end(audioBuffer);
            }
            const isLpcm = (0, class_validator_1.isURL)(audio) && /\.lpcm($|\?)/i.test(audio);
            return new Promise((resolve, reject) => {
                const outputAudioStream = new stream_1.PassThrough();
                const chunks = [];
                outputAudioStream.on('data', (chunk) => chunks.push(chunk));
                outputAudioStream.on('end', () => {
                    const outputBuffer = Buffer.concat(chunks);
                    resolve(outputBuffer);
                });
                outputAudioStream.on('error', (error) => {
                    console.log('error', error);
                    reject(error);
                });
                fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
                let command = (0, fluent_ffmpeg_1.default)(inputAudioStream);
                if (isLpcm) {
                    this.logger.verbose('Detected LPCM input – applying raw PCM settings');
                    command = command.inputFormat('s16le').inputOptions(['-ar', '24000', '-ac', '1']);
                }
                command
                    .outputFormat('ogg')
                    .noVideo()
                    .audioCodec('libopus')
                    .addOutputOptions('-avoid_negative_ts make_zero')
                    .audioBitrate('128k')
                    .audioFrequency(48000)
                    .audioChannels(1)
                    .outputOptions([
                    '-write_xing',
                    '0',
                    '-compression_level',
                    '10',
                    '-application',
                    'voip',
                    '-fflags',
                    '+bitexact',
                    '-flags',
                    '+bitexact',
                    '-id3v2_version',
                    '0',
                    '-map_metadata',
                    '-1',
                    '-map_chapters',
                    '-1',
                    '-write_bext',
                    '0',
                ])
                    .pipe(outputAudioStream, { end: true })
                    .on('error', function (error) {
                    console.log('error', error);
                    reject(error);
                });
            });
        }
    }
    async audioWhatsapp(data, file, isIntegration = false) {
        const mediaData = { ...data };
        if (file?.buffer) {
            mediaData.audio = file.buffer.toString('base64');
        }
        else if (!(0, class_validator_1.isURL)(data.audio) && !(0, class_validator_1.isBase64)(data.audio)) {
            console.error('Invalid file or audio source');
            throw new _exceptions_1.BadRequestException('File buffer, URL, or base64 audio is required');
        }
        if (!data?.encoding && data?.encoding !== false) {
            data.encoding = true;
        }
        if (data?.encoding) {
            const convert = await this.processAudio(mediaData.audio);
            if (Buffer.isBuffer(convert)) {
                const result = this.sendMessageWithTyping(data.number, { audio: convert, ptt: true, mimetype: 'audio/ogg; codecs=opus' }, { presence: 'recording', delay: data?.delay }, isIntegration);
                return result;
            }
            else {
                throw new _exceptions_1.InternalServerErrorException('Failed to convert audio');
            }
        }
        return await this.sendMessageWithTyping(data.number, {
            audio: (0, class_validator_1.isURL)(data.audio) ? { url: data.audio } : Buffer.from(data.audio, 'base64'),
            ptt: true,
            mimetype: 'audio/ogg; codecs=opus',
        }, { presence: 'recording', delay: data?.delay }, isIntegration);
    }
    generateRandomId(length = 11) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
    toJSONString(button) {
        const toString = (obj) => JSON.stringify(obj);
        const json = {
            call: () => toString({ display_text: button.displayText, phone_number: button.phoneNumber }),
            reply: () => toString({ display_text: button.displayText, id: button.id }),
            copy: () => toString({ display_text: button.displayText, copy_code: button.copyCode }),
            url: () => toString({ display_text: button.displayText, url: button.url, merchant_url: button.url }),
            pix: () => toString({
                currency: button.currency,
                total_amount: { value: 0, offset: 100 },
                reference_id: this.generateRandomId(),
                type: 'physical-goods',
                order: {
                    status: 'pending',
                    subtotal: { value: 0, offset: 100 },
                    order_type: 'ORDER',
                    items: [
                        { name: '', amount: { value: 0, offset: 100 }, quantity: 0, sale_amount: { value: 0, offset: 100 } },
                    ],
                },
                payment_settings: [
                    {
                        type: 'pix_static_code',
                        pix_static_code: {
                            merchant_name: button.name,
                            key: button.key,
                            key_type: this.mapKeyType.get(button.keyType),
                        },
                    },
                ],
                share_payment_status: false,
            }),
        };
        return json[button.type]?.() || '';
    }
    async buttonMessage(data) {
        if (data.buttons.length === 0) {
            throw new _exceptions_1.BadRequestException('At least one button is required');
        }
        const hasReplyButtons = data.buttons.some((btn) => btn.type === 'reply');
        const hasPixButton = data.buttons.some((btn) => btn.type === 'pix');
        const hasOtherButtons = data.buttons.some((btn) => btn.type !== 'reply' && btn.type !== 'pix');
        if (hasReplyButtons) {
            if (data.buttons.length > 3) {
                throw new _exceptions_1.BadRequestException('Maximum of 3 reply buttons allowed');
            }
            if (hasOtherButtons) {
                throw new _exceptions_1.BadRequestException('Reply buttons cannot be mixed with other button types');
            }
        }
        if (hasPixButton) {
            if (data.buttons.length > 1) {
                throw new _exceptions_1.BadRequestException('Only one PIX button is allowed');
            }
            if (hasOtherButtons) {
                throw new _exceptions_1.BadRequestException('PIX button cannot be mixed with other button types');
            }
            const message = {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            nativeFlowMessage: {
                                buttons: [{ name: this.mapType.get('pix'), buttonParamsJson: this.toJSONString(data.buttons[0]) }],
                                messageParamsJson: JSON.stringify({ from: 'api', templateId: (0, uuid_1.v4)() }),
                            },
                        },
                    },
                },
            };
            return await this.sendMessageWithTyping(data.number, message, {
                delay: data?.delay,
                presence: 'composing',
                quoted: data?.quoted,
                mentionsEveryOne: data?.mentionsEveryOne,
                mentioned: data?.mentioned,
            });
        }
        const generate = await (async () => {
            if (data?.thumbnailUrl) {
                return await this.prepareMediaMessage({ mediatype: 'image', media: data.thumbnailUrl });
            }
        })();
        const buttons = data.buttons.map((value) => {
            return { name: this.mapType.get(value.type), buttonParamsJson: this.toJSONString(value) };
        });
        const message = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: {
                            text: (() => {
                                let t = '*' + data.title + '*';
                                if (data?.description) {
                                    t += '\n\n';
                                    t += data.description;
                                    t += '\n';
                                }
                                return t;
                            })(),
                        },
                        footer: { text: data?.footer },
                        header: (() => {
                            if (generate?.message?.imageMessage) {
                                return {
                                    hasMediaAttachment: !!generate.message.imageMessage,
                                    imageMessage: generate.message.imageMessage,
                                };
                            }
                        })(),
                        nativeFlowMessage: {
                            buttons: buttons,
                            messageParamsJson: JSON.stringify({ from: 'api', templateId: (0, uuid_1.v4)() }),
                        },
                    },
                },
            },
        };
        return await this.sendMessageWithTyping(data.number, message, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        });
    }
    async locationMessage(data) {
        return await this.sendMessageWithTyping(data.number, {
            locationMessage: {
                degreesLatitude: data.latitude,
                degreesLongitude: data.longitude,
                name: data?.name,
                address: data?.address,
            },
        }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        });
    }
    async listMessage(data) {
        return await this.sendMessageWithTyping(data.number, {
            listMessage: {
                title: data.title,
                description: data.description,
                buttonText: data?.buttonText,
                footerText: data?.footerText,
                sections: data.sections,
                listType: 2,
            },
        }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        });
    }
    async contactMessage(data) {
        const message = {};
        const vcard = (contact) => {
            let result = 'BEGIN:VCARD\n' + 'VERSION:3.0\n' + `N:${contact.fullName}\n` + `FN:${contact.fullName}\n`;
            if (contact.organization) {
                result += `ORG:${contact.organization};\n`;
            }
            if (contact.email) {
                result += `EMAIL:${contact.email}\n`;
            }
            if (contact.url) {
                result += `URL:${contact.url}\n`;
            }
            if (!contact.wuid) {
                contact.wuid = (0, createJid_1.createJid)(contact.phoneNumber);
            }
            result += `item1.TEL;waid=${contact.wuid}:${contact.phoneNumber}\n` + 'item1.X-ABLabel:Celular\n' + 'END:VCARD';
            return result;
        };
        if (data.contact.length === 1) {
            message.contactMessage = { displayName: data.contact[0].fullName, vcard: vcard(data.contact[0]) };
        }
        else {
            message.contactsArrayMessage = {
                displayName: `${data.contact.length} contacts`,
                contacts: data.contact.map((contact) => {
                    return { displayName: contact.fullName, vcard: vcard(contact) };
                }),
            };
        }
        return await this.sendMessageWithTyping(data.number, { ...message }, {});
    }
    async reactionMessage(data) {
        return await this.sendMessageWithTyping(data.key.remoteJid, {
            reactionMessage: { key: data.key, text: data.reaction },
        });
    }
    async whatsappNumber(data) {
        const jids = { groups: [], broadcast: [], users: [] };
        data.numbers.forEach((number) => {
            const jid = (0, createJid_1.createJid)(number);
            if ((0, baileys_1.isJidGroup)(jid)) {
                jids.groups.push({ number, jid });
            }
            else if (jid === 'status@broadcast') {
                jids.broadcast.push({ number, jid });
            }
            else {
                jids.users.push({ number, jid });
            }
        });
        const onWhatsapp = [];
        onWhatsapp.push(...jids.broadcast.map(({ jid, number }) => new chat_dto_1.OnWhatsAppDto(jid, false, number)));
        const groups = await Promise.all(jids.groups.map(async ({ jid, number }) => {
            const group = await this.findGroup({ groupJid: jid }, 'inner');
            if (!group) {
                return new chat_dto_1.OnWhatsAppDto(jid, false, number);
            }
            return new chat_dto_1.OnWhatsAppDto(group.id, true, number, group?.subject);
        }));
        onWhatsapp.push(...groups);
        const contacts = await this.prismaRepository.contact.findMany({
            where: { instanceId: this.instanceId, remoteJid: { in: jids.users.map(({ jid }) => jid) } },
        });
        const lidUsers = jids.users.filter(({ jid }) => jid.includes('@lid'));
        const normalUsers = jids.users.filter(({ jid }) => !jid.includes('@lid'));
        let normalVerifiedUsers = [];
        if (normalUsers.length > 0) {
            console.log('normalUsers', normalUsers);
            const numbersToVerify = normalUsers.map(({ jid }) => jid.replace('+', ''));
            console.log('numbersToVerify', numbersToVerify);
            const cachedNumbers = await (0, onWhatsappCache_1.getOnWhatsappCache)(numbersToVerify);
            console.log('cachedNumbers', cachedNumbers);
            const filteredNumbers = numbersToVerify.filter((jid) => !cachedNumbers.some((cached) => cached.jidOptions.includes(jid)));
            console.log('filteredNumbers', filteredNumbers);
            const verify = await this.client.onWhatsApp(...filteredNumbers);
            console.log('verify', verify);
            normalVerifiedUsers = await Promise.all(normalUsers.map(async (user) => {
                let numberVerified = null;
                const cached = cachedNumbers.find((cached) => cached.jidOptions.includes(user.jid.replace('+', '')));
                if (cached) {
                    return new chat_dto_1.OnWhatsAppDto(cached.remoteJid, true, user.number, contacts.find((c) => c.remoteJid === cached.remoteJid)?.pushName, cached.lid || (cached.remoteJid.includes('@lid') ? cached.remoteJid.split('@')[1] : undefined));
                }
                if (user.number.startsWith('55')) {
                    const numberWithDigit = user.number.slice(4, 5) === '9' && user.number.length === 13
                        ? user.number
                        : `${user.number.slice(0, 4)}9${user.number.slice(4)}`;
                    const numberWithoutDigit = user.number.length === 12 ? user.number : user.number.slice(0, 4) + user.number.slice(5);
                    numberVerified = verify.find((v) => v.jid === `${numberWithDigit}@s.whatsapp.net` || v.jid === `${numberWithoutDigit}@s.whatsapp.net`);
                }
                if (!numberVerified && (user.number.startsWith('52') || user.number.startsWith('54'))) {
                    let prefix = '';
                    if (user.number.startsWith('52')) {
                        prefix = '1';
                    }
                    if (user.number.startsWith('54')) {
                        prefix = '9';
                    }
                    const numberWithDigit = user.number.slice(2, 3) === prefix && user.number.length === 13
                        ? user.number
                        : `${user.number.slice(0, 2)}${prefix}${user.number.slice(2)}`;
                    const numberWithoutDigit = user.number.length === 12 ? user.number : user.number.slice(0, 2) + user.number.slice(3);
                    numberVerified = verify.find((v) => v.jid === `${numberWithDigit}@s.whatsapp.net` || v.jid === `${numberWithoutDigit}@s.whatsapp.net`);
                }
                if (!numberVerified) {
                    numberVerified = verify.find((v) => v.jid === user.jid);
                }
                const numberJid = numberVerified?.jid || user.jid;
                const lid = typeof numberVerified?.lid === 'string'
                    ? numberVerified.lid
                    : numberJid.includes('@lid')
                        ? numberJid.split('@')[1]
                        : undefined;
                return new chat_dto_1.OnWhatsAppDto(numberJid, !!numberVerified?.exists, user.number, contacts.find((c) => c.remoteJid === numberJid)?.pushName, lid);
            }));
        }
        const lidVerifiedUsers = lidUsers.map((user) => {
            return new chat_dto_1.OnWhatsAppDto(user.jid, true, user.number, contacts.find((c) => c.remoteJid === user.jid)?.pushName, user.jid.split('@')[1]);
        });
        onWhatsapp.push(...normalVerifiedUsers, ...lidVerifiedUsers);
        await (0, onWhatsappCache_1.saveOnWhatsappCache)(onWhatsapp
            .filter((user) => user.exists)
            .map((user) => ({
            remoteJid: user.jid,
            jidOptions: user.jid.replace('+', ''),
            lid: user.lid,
        })));
        return onWhatsapp;
    }
    async markMessageAsRead(data) {
        try {
            const keys = [];
            data.readMessages.forEach((read) => {
                if ((0, baileys_1.isJidGroup)(read.remoteJid) || (0, baileys_1.isJidUser)(read.remoteJid)) {
                    keys.push({ remoteJid: read.remoteJid, fromMe: read.fromMe, id: read.id });
                }
            });
            await this.client.readMessages(keys);
            return { message: 'Read messages', read: 'success' };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Read messages fail', error instanceof Error ? error.message : String(error));
        }
    }
    async getLastMessage(number) {
        const where = { key: { remoteJid: number }, instanceId: this.instance.id };
        const messages = await this.prismaRepository.message.findMany({
            where,
            orderBy: { messageTimestamp: 'desc' },
            take: 1,
        });
        if (messages.length === 0) {
            throw new _exceptions_1.NotFoundException('Messages not found');
        }
        let lastMessage = messages.pop();
        for (const message of messages) {
            if (message.messageTimestamp >= lastMessage.messageTimestamp) {
                lastMessage = message;
            }
        }
        return lastMessage;
    }
    async archiveChat(data) {
        try {
            let last_message = data.lastMessage;
            let number = data.chat;
            if (!last_message && number) {
                last_message = await this.getLastMessage(number);
            }
            else {
                last_message = data.lastMessage;
                last_message.messageTimestamp = last_message?.messageTimestamp ?? Date.now();
                number = last_message?.key?.remoteJid;
            }
            if (!last_message || Object.keys(last_message).length === 0) {
                throw new _exceptions_1.NotFoundException('Last message not found');
            }
            await this.client.chatModify({ archive: data.archive, lastMessages: [last_message] }, (0, createJid_1.createJid)(number));
            return { chatId: number, archived: true };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException({
                archived: false,
                message: ['An error occurred while archiving the chat. Open a calling.', error instanceof Error ? error.message : String(error)],
            });
        }
    }
    async markChatUnread(data) {
        try {
            let last_message = data.lastMessage;
            let number = data.chat;
            if (!last_message && number) {
                last_message = await this.getLastMessage(number);
            }
            else {
                last_message = data.lastMessage;
                last_message.messageTimestamp = last_message?.messageTimestamp ?? Date.now();
                number = last_message?.key?.remoteJid;
            }
            if (!last_message || Object.keys(last_message).length === 0) {
                throw new _exceptions_1.NotFoundException('Last message not found');
            }
            await this.client.chatModify({ markRead: false, lastMessages: [last_message] }, (0, createJid_1.createJid)(number));
            return { chatId: number, markedChatUnread: true };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException({
                markedChatUnread: false,
                message: ['An error occurred while marked unread the chat. Open a calling.', error instanceof Error ? error.message : String(error)],
            });
        }
    }
    async deleteMessage(del) {
        try {
            const response = await this.client.sendMessage(del.remoteJid, { delete: del });
            if (response) {
                const messageId = response.message?.protocolMessage?.key?.id;
                if (messageId) {
                    const isLogicalDeleted = env_config_1.configService.get('DATABASE').DELETE_DATA.LOGICAL_MESSAGE_DELETE;
                    let message = await this.prismaRepository.message.findFirst({
                        where: { key: { path: ['id'], equals: messageId } },
                    });
                    if (isLogicalDeleted) {
                        if (!message)
                            return response;
                        const existingKey = typeof message?.key === 'object' && message.key !== null ? message.key : {};
                        message = await this.prismaRepository.message.update({
                            where: { id: message.id },
                            data: { key: { ...existingKey, deleted: true }, status: 'DELETED' },
                        });
                        if (this.configService.get('DATABASE').SAVE_DATA.MESSAGE_UPDATE) {
                            const messageUpdate = {
                                messageId: message.id,
                                keyId: messageId,
                                remoteJid: response.key.remoteJid,
                                fromMe: response.key.fromMe,
                                participant: response.key?.remoteJid,
                                status: 'DELETED',
                                instanceId: this.instanceId,
                            };
                            await this.prismaRepository.messageUpdate.create({ data: messageUpdate });
                        }
                    }
                    else {
                        if (!message)
                            return response;
                        await this.prismaRepository.message.deleteMany({ where: { id: message.id } });
                    }
                    this.sendDataWebhook(wa_types_1.Events.MESSAGES_DELETE, {
                        id: message.id,
                        instanceId: message.instanceId,
                        key: message.key,
                        messageType: message.messageType,
                        status: 'DELETED',
                        source: message.source,
                        messageTimestamp: message.messageTimestamp,
                        pushName: message.pushName,
                        participant: message.participant,
                        message: message.message,
                    });
                }
            }
            return response;
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error while deleting message for everyone', error instanceof Error ? error.message : String(error));
        }
    }
    async mapMediaType(mediaType) {
        const map = {
            imageMessage: 'image',
            videoMessage: 'video',
            documentMessage: 'document',
            stickerMessage: 'sticker',
            audioMessage: 'audio',
            ptvMessage: 'video',
        };
        return map[mediaType] || null;
    }
    async getBase64FromMediaMessage(data, getBuffer = false) {
        try {
            const m = data?.message;
            const convertToMp4 = data?.convertToMp4 ?? false;
            const msg = m?.message ? m : (await this.getMessage(m.key, true));
            if (!msg) {
                throw 'Message not found';
            }
            for (const subtype of wa_types_1.MessageSubtype) {
                if (msg.message[subtype]) {
                    msg.message = msg.message[subtype].message;
                }
            }
            if ('messageContextInfo' in msg.message && Object.keys(msg.message).length === 1) {
                throw 'The message is messageContextInfo';
            }
            let mediaMessage;
            let mediaType;
            if (msg.message?.templateMessage) {
                const template = msg.message.templateMessage.hydratedTemplate || msg.message.templateMessage.hydratedFourRowTemplate;
                for (const type of wa_types_1.TypeMediaMessage) {
                    if (template[type]) {
                        mediaMessage = template[type];
                        mediaType = type;
                        msg.message = { [type]: { ...template[type], url: template[type].staticUrl } };
                        break;
                    }
                }
                if (!mediaMessage) {
                    throw 'Template message does not contain a supported media type';
                }
            }
            else {
                for (const type of wa_types_1.TypeMediaMessage) {
                    mediaMessage = msg.message[type];
                    if (mediaMessage) {
                        mediaType = type;
                        break;
                    }
                }
                if (!mediaMessage) {
                    throw 'The message is not of the media type';
                }
            }
            if (typeof mediaMessage['mediaKey'] === 'object') {
                msg.message = JSON.parse(JSON.stringify(msg.message));
            }
            let buffer;
            try {
                const mediaResult = await (0, baileys_1.downloadMediaMessage)({ key: msg?.key, message: msg?.message }, 'buffer', {}, { logger: (0, pino_1.default)({ level: 'error' }), reuploadRequest: this.client.updateMediaMessage });
                if (Buffer.isBuffer(mediaResult)) {
                    buffer = mediaResult;
                }
                else {
                    const chunks = [];
                    for await (const chunk of mediaResult) {
                        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                    }
                    buffer = Buffer.concat(chunks);
                }
            }
            catch (err) {
                this.logger.error('Download Media failed, trying to retry in 5 seconds...');
                await new Promise((resolve) => setTimeout(resolve, 5000));
                const mediaType = Object.keys(msg.message).find((key) => key.endsWith('Message'));
                if (!mediaType)
                    throw new Error('Could not determine mediaType for fallback');
                try {
                    const media = await (0, baileys_1.downloadContentFromMessage)({
                        mediaKey: msg.message?.[mediaType]?.mediaKey,
                        directPath: msg.message?.[mediaType]?.directPath,
                        url: `https://mmg.whatsapp.net${msg?.message?.[mediaType]?.directPath}`,
                    }, await this.mapMediaType(mediaType), {});
                    const chunks = [];
                    for await (const chunk of media) {
                        chunks.push(chunk);
                    }
                    buffer = Buffer.concat(chunks);
                    this.logger.info('Download Media with downloadContentFromMessage was successful!');
                }
                catch (fallbackErr) {
                    this.logger.error('Download Media with downloadContentFromMessage also failed!');
                    throw fallbackErr;
                }
            }
            const typeMessage = (0, baileys_1.getContentType)(msg.message);
            const ext = mime_types_1.default.extension(mediaMessage?.['mimetype']);
            const fileName = mediaMessage?.['fileName'] || `${msg.key.id}.${ext}` || `${(0, uuid_1.v4)()}.${ext}`;
            if (convertToMp4 && typeMessage === 'audioMessage') {
                try {
                    const convert = await this.processAudioMp4(buffer.toString('base64'));
                    if (Buffer.isBuffer(convert)) {
                        const result = {
                            mediaType,
                            fileName,
                            caption: mediaMessage['caption'],
                            size: {
                                fileLength: mediaMessage['fileLength'],
                                height: mediaMessage['height'],
                                width: mediaMessage['width'],
                            },
                            mimetype: 'audio/mp4',
                            base64: convert.toString('base64'),
                            buffer: getBuffer ? convert : null,
                        };
                        return result;
                    }
                }
                catch (error) {
                    this.logger.error('Error converting audio to mp4:');
                    this.logger.error(error);
                    throw new _exceptions_1.BadRequestException('Failed to convert audio to MP4');
                }
            }
            return {
                mediaType,
                fileName,
                caption: mediaMessage['caption'],
                size: { fileLength: mediaMessage['fileLength'], height: mediaMessage['height'], width: mediaMessage['width'] },
                mimetype: mediaMessage['mimetype'],
                base64: buffer.toString('base64'),
                buffer: getBuffer ? buffer : null,
            };
        }
        catch (error) {
            this.logger.error('Error processing media message:');
            this.logger.error(error);
            throw new _exceptions_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async fetchPrivacySettings() {
        const privacy = await this.client.fetchPrivacySettings();
        return {
            readreceipts: privacy.readreceipts,
            profile: privacy.profile,
            status: privacy.status,
            online: privacy.online,
            last: privacy.last,
            groupadd: privacy.groupadd,
        };
    }
    async updatePrivacySettings(settings) {
        try {
            await this.client.updateReadReceiptsPrivacy(settings.readreceipts);
            await this.client.updateProfilePicturePrivacy(settings.profile);
            await this.client.updateStatusPrivacy(settings.status);
            await this.client.updateOnlinePrivacy(settings.online);
            await this.client.updateLastSeenPrivacy(settings.last);
            await this.client.updateGroupsAddPrivacy(settings.groupadd);
            this.reloadConnection();
            return {
                update: 'success',
                data: {
                    readreceipts: settings.readreceipts,
                    profile: settings.profile,
                    status: settings.status,
                    online: settings.online,
                    last: settings.last,
                    groupadd: settings.groupadd,
                },
            };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error updating privacy settings', error instanceof Error ? error.message : String(error));
        }
    }
    async fetchBusinessProfile(number) {
        try {
            const jid = number ? (0, createJid_1.createJid)(number) : this.instance.wuid;
            const profile = await this.client.getBusinessProfile(jid);
            if (!profile) {
                const info = await this.whatsappNumber({ numbers: [jid] });
                return { isBusiness: false, message: 'Not is business profile', ...info?.shift() };
            }
            return { isBusiness: true, ...profile };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error updating profile name', error instanceof Error ? error.message : String(error));
        }
    }
    async updateProfileName(name) {
        try {
            await this.client.updateProfileName(name);
            return { update: 'success' };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error updating profile name', error instanceof Error ? error.message : String(error));
        }
    }
    async updateProfileStatus(status) {
        try {
            await this.client.updateProfileStatus(status);
            return { update: 'success' };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error updating profile status', error instanceof Error ? error.message : String(error));
        }
    }
    async updateProfilePicture(picture) {
        try {
            let pic;
            if ((0, class_validator_1.isURL)(picture)) {
                const timestamp = new Date().getTime();
                const parsedURL = new URL(picture);
                parsedURL.searchParams.set('timestamp', timestamp.toString());
                const url = parsedURL.toString();
                let config = { responseType: 'arraybuffer' };
                if (this.localProxy?.enabled) {
                    config = {
                        ...config,
                        httpsAgent: (0, makeProxyAgent_1.makeProxyAgent)({
                            host: this.localProxy.host,
                            port: this.localProxy.port,
                            protocol: this.localProxy.protocol,
                            username: this.localProxy.username,
                            password: this.localProxy.password,
                        }),
                    };
                }
                pic = (await axios_1.default.get(url, config)).data;
            }
            else if ((0, class_validator_1.isBase64)(picture)) {
                pic = Buffer.from(picture, 'base64');
            }
            else {
                throw new _exceptions_1.BadRequestException('"profilePicture" must be a url or a base64');
            }
            await this.client.updateProfilePicture(this.instance.wuid, pic);
            this.reloadConnection();
            return { update: 'success' };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error updating profile picture', error instanceof Error ? error.message : String(error));
        }
    }
    async removeProfilePicture() {
        try {
            await this.client.removeProfilePicture(this.instance.wuid);
            this.reloadConnection();
            return { update: 'success' };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error removing profile picture', error instanceof Error ? error.message : String(error));
        }
    }
    async blockUser(data) {
        try {
            const { number } = data;
            const isWA = (await this.whatsappNumber({ numbers: [number] }))?.shift();
            if (!isWA.exists && !(0, baileys_1.isJidGroup)(isWA.jid) && !isWA.jid.includes('@broadcast')) {
                throw new _exceptions_1.BadRequestException(isWA);
            }
            const sender = isWA.jid;
            await this.client.updateBlockStatus(sender, data.status);
            return { block: 'success' };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error blocking user', error instanceof Error ? error.message : String(error));
        }
    }
    async formatUpdateMessage(data) {
        try {
            if (!this.configService.get('DATABASE').SAVE_DATA.NEW_MESSAGE) {
                return data;
            }
            const msg = await this.getMessage(data.key, true);
            if (msg?.messageType === 'conversation' || msg?.messageType === 'extendedTextMessage') {
                return { text: data.text };
            }
            if (msg?.messageType === 'imageMessage') {
                return { image: msg?.message?.imageMessage, caption: data.text };
            }
            if (msg?.messageType === 'videoMessage') {
                return { video: msg?.message?.videoMessage, caption: data.text };
            }
            return null;
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async updateMessage(data) {
        const jid = (0, createJid_1.createJid)(data.number);
        const options = await this.formatUpdateMessage(data);
        if (!options) {
            this.logger.error('Message not compatible');
            throw new _exceptions_1.BadRequestException('Message not compatible');
        }
        try {
            const oldMessage = await this.getMessage(data.key, true);
            if (this.configService.get('DATABASE').SAVE_DATA.NEW_MESSAGE) {
                if (!oldMessage)
                    throw new _exceptions_1.NotFoundException('Message not found');
                if (oldMessage?.key?.remoteJid !== jid) {
                    throw new _exceptions_1.BadRequestException('RemoteJid does not match');
                }
                if (oldMessage?.messageTimestamp > Date.now() + 900000) {
                    throw new _exceptions_1.BadRequestException('Message is older than 15 minutes');
                }
            }
            const messageSent = await this.client.sendMessage(jid, { ...options, edit: data.key });
            if (messageSent) {
                const editedMessage = messageSent?.message?.protocolMessage || messageSent?.message?.editedMessage?.message?.protocolMessage;
                if (editedMessage) {
                    this.sendDataWebhook(wa_types_1.Events.SEND_MESSAGE_UPDATE, editedMessage);
                    if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled)
                        this.chatwootService.eventWhatsapp('send.message.update', { instanceName: this.instance.name, instanceId: this.instance.id }, editedMessage);
                    const messageId = messageSent.message?.protocolMessage?.key?.id;
                    if (messageId && this.configService.get('DATABASE').SAVE_DATA.NEW_MESSAGE) {
                        let message = await this.prismaRepository.message.findFirst({
                            where: { key: { path: ['id'], equals: messageId } },
                        });
                        if (!message)
                            throw new _exceptions_1.NotFoundException('Message not found');
                        if (!message.key.valueOf().fromMe) {
                            new _exceptions_1.BadRequestException('You cannot edit others messages');
                        }
                        if (message.key.valueOf()?.deleted) {
                            new _exceptions_1.BadRequestException('You cannot edit deleted messages');
                        }
                        if (oldMessage.messageType === 'conversation' || oldMessage.messageType === 'extendedTextMessage') {
                            oldMessage.message.conversation = data.text;
                        }
                        else {
                            oldMessage.message[oldMessage.messageType].caption = data.text;
                        }
                        message = await this.prismaRepository.message.update({
                            where: { id: message.id },
                            data: {
                                message: oldMessage.message,
                                status: 'EDITED',
                                messageTimestamp: Math.floor(Date.now() / 1000),
                            },
                        });
                        if (this.configService.get('DATABASE').SAVE_DATA.MESSAGE_UPDATE) {
                            const messageUpdate = {
                                messageId: message.id,
                                keyId: messageId,
                                remoteJid: messageSent.key.remoteJid,
                                fromMe: messageSent.key.fromMe,
                                participant: messageSent.key?.remoteJid,
                                status: 'EDITED',
                                instanceId: this.instanceId,
                            };
                            await this.prismaRepository.messageUpdate.create({ data: messageUpdate });
                        }
                    }
                }
            }
            return messageSent;
        }
        catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
    async fetchLabels() {
        const labels = await this.prismaRepository.label.findMany({ where: { instanceId: this.instanceId } });
        return labels.map((label) => ({
            color: label.color,
            name: label.name,
            id: label.labelId,
            predefinedId: label.predefinedId,
        }));
    }
    async handleLabel(data) {
        const whatsappContact = await this.whatsappNumber({ numbers: [data.number] });
        if (whatsappContact.length === 0) {
            throw new _exceptions_1.NotFoundException('Number not found');
        }
        const contact = whatsappContact[0];
        if (!contact.exists) {
            throw new _exceptions_1.NotFoundException('Number is not on WhatsApp');
        }
        try {
            if (data.action === 'add') {
                await this.client.addChatLabel(contact.jid, data.labelId);
                await this.addLabel(data.labelId, this.instanceId, contact.jid);
                return { numberJid: contact.jid, labelId: data.labelId, add: true };
            }
            if (data.action === 'remove') {
                await this.client.removeChatLabel(contact.jid, data.labelId);
                await this.removeLabel(data.labelId, this.instanceId, contact.jid);
                return { numberJid: contact.jid, labelId: data.labelId, remove: true };
            }
        }
        catch (error) {
            throw new _exceptions_1.BadRequestException(`Unable to ${data.action} label to chat`, error instanceof Error ? error.message : String(error));
        }
    }
    async updateGroupMetadataCache(groupJid) {
        try {
            const meta = await this.client.groupMetadata(groupJid);
            const cacheConf = this.configService.get('CACHE');
            if ((cacheConf?.REDIS?.ENABLED && cacheConf?.REDIS?.URI !== '') || cacheConf?.LOCAL?.ENABLED) {
                this.logger.verbose(`Updating cache for group: ${groupJid}`);
                await groupMetadataCache.set(groupJid, { timestamp: Date.now(), data: meta });
            }
            return meta;
        }
        catch (error) {
            this.logger.error(error);
            return null;
        }
    }
    async createGroup(create) {
        try {
            const participants = (await this.whatsappNumber({ numbers: create.participants }))
                .filter((participant) => participant.exists)
                .map((participant) => participant.jid);
            const { id } = await this.client.groupCreate(create.subject, participants);
            if (create?.description) {
                await this.client.groupUpdateDescription(id, create.description);
            }
            if (create?.promoteParticipants) {
                await this.updateGParticipant({ groupJid: id, action: 'promote', participants: participants });
            }
            const group = await this.client.groupMetadata(id);
            return group;
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.InternalServerErrorException('Error creating group', error instanceof Error ? error.message : String(error));
        }
    }
    async updateGroupPicture(picture) {
        try {
            let pic;
            if ((0, class_validator_1.isURL)(picture.image)) {
                const timestamp = new Date().getTime();
                const parsedURL = new URL(picture.image);
                parsedURL.searchParams.set('timestamp', timestamp.toString());
                const url = parsedURL.toString();
                let config = { responseType: 'arraybuffer' };
                if (this.localProxy?.enabled) {
                    config = {
                        ...config,
                        httpsAgent: (0, makeProxyAgent_1.makeProxyAgent)({
                            host: this.localProxy.host,
                            port: this.localProxy.port,
                            protocol: this.localProxy.protocol,
                            username: this.localProxy.username,
                            password: this.localProxy.password,
                        }),
                    };
                }
                pic = (await axios_1.default.get(url, config)).data;
            }
            else if ((0, class_validator_1.isBase64)(picture.image)) {
                pic = Buffer.from(picture.image, 'base64');
            }
            else {
                throw new _exceptions_1.BadRequestException('"profilePicture" must be a url or a base64');
            }
            await this.client.updateProfilePicture(picture.groupJid, pic);
            return { update: 'success' };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error update group picture', error instanceof Error ? error.message : String(error));
        }
    }
    async updateGroupSubject(data) {
        try {
            await this.client.groupUpdateSubject(data.groupJid, data.subject);
            return { update: 'success' };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error updating group subject', error instanceof Error ? error.message : String(error));
        }
    }
    async updateGroupDescription(data) {
        try {
            await this.client.groupUpdateDescription(data.groupJid, data.description);
            return { update: 'success' };
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error updating group description', error instanceof Error ? error.message : String(error));
        }
    }
    async findGroup(id, reply = 'out') {
        try {
            const group = await this.client.groupMetadata(id.groupJid);
            if (!group) {
                this.logger.error('Group not found');
                return null;
            }
            const picture = await this.profilePicture(group.id);
            return {
                id: group.id,
                subject: group.subject,
                subjectOwner: group.subjectOwner,
                subjectTime: group.subjectTime,
                pictureUrl: picture.profilePictureUrl,
                size: group.participants.length,
                creation: group.creation,
                owner: group.owner,
                desc: group.desc,
                descId: group.descId,
                restrict: group.restrict,
                announce: group.announce,
                participants: group.participants,
                isCommunity: group.isCommunity,
                isCommunityAnnounce: group.isCommunityAnnounce,
                linkedParent: group.linkedParent,
            };
        }
        catch (error) {
            if (reply === 'inner') {
                return;
            }
            throw new _exceptions_1.NotFoundException('Error fetching group', error instanceof Error ? error.message : String(error));
        }
    }
    async fetchAllGroups(getParticipants) {
        const fetch = Object.values(await this?.client?.groupFetchAllParticipating());
        let groups = [];
        for (const group of fetch) {
            const picture = await this.profilePicture(group.id);
            const result = {
                id: group.id,
                subject: group.subject,
                subjectOwner: group.subjectOwner,
                subjectTime: group.subjectTime,
                pictureUrl: picture?.profilePictureUrl,
                size: group.participants.length,
                creation: group.creation,
                owner: group.owner,
                desc: group.desc,
                descId: group.descId,
                restrict: group.restrict,
                announce: group.announce,
                isCommunity: group.isCommunity,
                isCommunityAnnounce: group.isCommunityAnnounce,
                linkedParent: group.linkedParent,
            };
            if (getParticipants.getParticipants == 'true') {
                result['participants'] = group.participants;
            }
            groups = [...groups, result];
        }
        return groups;
    }
    async inviteCode(id) {
        try {
            const code = await this.client.groupInviteCode(id.groupJid);
            return { inviteUrl: `https://chat.whatsapp.com/${code}`, inviteCode: code };
        }
        catch (error) {
            throw new _exceptions_1.NotFoundException('No invite code', error instanceof Error ? error.message : String(error));
        }
    }
    async inviteInfo(id) {
        try {
            return await this.client.groupGetInviteInfo(id.inviteCode);
        }
        catch (error) {
            throw new _exceptions_1.NotFoundException('No invite info', id.inviteCode);
        }
    }
    async sendInvite(id) {
        try {
            const inviteCode = await this.inviteCode({ groupJid: id.groupJid });
            const inviteUrl = inviteCode.inviteUrl;
            const numbers = id.numbers.map((number) => (0, createJid_1.createJid)(number));
            const description = id.description ?? '';
            const msg = `${description}\n\n${inviteUrl}`;
            const message = { conversation: msg };
            for await (const number of numbers) {
                await this.sendMessageWithTyping(number, message);
            }
            return { send: true, inviteUrl };
        }
        catch (error) {
            throw new _exceptions_1.NotFoundException('No send invite');
        }
    }
    async acceptInviteCode(id) {
        try {
            const groupJid = await this.client.groupAcceptInvite(id.inviteCode);
            return { accepted: true, groupJid: groupJid };
        }
        catch (error) {
            throw new _exceptions_1.NotFoundException('Accept invite error', error instanceof Error ? error.message : String(error));
        }
    }
    async revokeInviteCode(id) {
        try {
            const inviteCode = await this.client.groupRevokeInvite(id.groupJid);
            return { revoked: true, inviteCode };
        }
        catch (error) {
            throw new _exceptions_1.NotFoundException('Revoke error', error instanceof Error ? error.message : String(error));
        }
    }
    async findParticipants(id) {
        try {
            const participants = (await this.client.groupMetadata(id.groupJid)).participants;
            const contacts = await this.prismaRepository.contact.findMany({
                where: { instanceId: this.instanceId, remoteJid: { in: participants.map((p) => p.id) } },
            });
            const parsedParticipants = participants.map((participant) => {
                const contact = contacts.find((c) => c.remoteJid === participant.id);
                return {
                    ...participant,
                    name: participant.name ?? contact?.pushName,
                    imgUrl: participant.imgUrl ?? contact?.profilePicUrl,
                };
            });
            const usersContacts = parsedParticipants.filter((c) => c.id.includes('@s.whatsapp'));
            if (usersContacts) {
                await (0, onWhatsappCache_1.saveOnWhatsappCache)(usersContacts.map((c) => ({ remoteJid: c.id })));
            }
            return { participants: parsedParticipants };
        }
        catch (error) {
            console.error(error);
            throw new _exceptions_1.NotFoundException('No participants', error instanceof Error ? error.message : String(error));
        }
    }
    async updateGParticipant(update) {
        try {
            const participants = update.participants.map((p) => (0, createJid_1.createJid)(p));
            const updateParticipants = await this.client.groupParticipantsUpdate(update.groupJid, participants, update.action);
            return { updateParticipants: updateParticipants };
        }
        catch (error) {
            throw new _exceptions_1.BadRequestException('Error updating participants', error instanceof Error ? error.message : String(error));
        }
    }
    async updateGSetting(update) {
        try {
            const updateSetting = await this.client.groupSettingUpdate(update.groupJid, update.action);
            return { updateSetting: updateSetting };
        }
        catch (error) {
            throw new _exceptions_1.BadRequestException('Error updating setting', error instanceof Error ? error.message : String(error));
        }
    }
    async toggleEphemeral(update) {
        try {
            await this.client.groupToggleEphemeral(update.groupJid, update.expiration);
            return { success: true };
        }
        catch (error) {
            throw new _exceptions_1.BadRequestException('Error updating setting', error instanceof Error ? error.message : String(error));
        }
    }
    async leaveGroup(id) {
        try {
            await this.client.groupLeave(id.groupJid);
            return { groupJid: id.groupJid, leave: true };
        }
        catch (error) {
            throw new _exceptions_1.BadRequestException('Unable to leave the group', error instanceof Error ? error.message : String(error));
        }
    }
    async templateMessage() {
        throw new Error('Method not available in the Baileys service');
    }
    prepareMessage(message) {
        const contentType = (0, baileys_1.getContentType)(message.message);
        const contentMsg = message?.message[contentType];
        const messageRaw = {
            key: message.key,
            pushName: message.pushName ||
                (message.key.fromMe
                    ? 'Você'
                    : message?.participant || (message.key?.participant ? message.key.participant.split('@')[0] : null)),
            status: renderStatus_1.status[message.status],
            message: { ...message.message },
            contextInfo: contentMsg?.contextInfo,
            messageType: contentType || 'unknown',
            messageTimestamp: message.messageTimestamp,
            instanceId: this.instanceId,
            source: (0, baileys_1.getDevice)(message.key.id),
        };
        if (!messageRaw.status && message.key.fromMe === false) {
            messageRaw.status = renderStatus_1.status[3];
        }
        if (messageRaw.message.extendedTextMessage) {
            messageRaw.messageType = 'conversation';
            messageRaw.message.conversation = messageRaw.message.extendedTextMessage.text;
            delete messageRaw.message.extendedTextMessage;
        }
        if (messageRaw.message.documentWithCaptionMessage) {
            messageRaw.messageType = 'documentMessage';
            messageRaw.message.documentMessage = messageRaw.message.documentWithCaptionMessage.message.documentMessage;
            delete messageRaw.message.documentWithCaptionMessage;
        }
        const quotedMessage = messageRaw?.contextInfo?.quotedMessage;
        if (quotedMessage) {
            if (quotedMessage.extendedTextMessage) {
                quotedMessage.conversation = quotedMessage.extendedTextMessage.text;
                delete quotedMessage.extendedTextMessage;
            }
            if (quotedMessage.documentWithCaptionMessage) {
                quotedMessage.documentMessage = quotedMessage.documentWithCaptionMessage.message.documentMessage;
                delete quotedMessage.documentWithCaptionMessage;
            }
        }
        return messageRaw;
    }
    async syncChatwootLostMessages() {
        if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
            const chatwootConfig = await this.findChatwoot();
            const prepare = (message) => this.prepareMessage(message);
            this.chatwootService.syncLostMessages({ instanceName: this.instance.name }, chatwootConfig, prepare);
            const task = node_cron_1.default.schedule('0,30 * * * *', async () => {
                this.chatwootService.syncLostMessages({ instanceName: this.instance.name }, chatwootConfig, prepare);
            });
            task.start();
        }
    }
    async updateMessagesReadedByTimestamp(remoteJid, timestamp) {
        if (timestamp === undefined || timestamp === null)
            return 0;
        const result = await this.prismaRepository.message.updateMany({
            where: {
                AND: [
                    { key: { path: ['remoteJid'], equals: remoteJid } },
                    { key: { path: ['fromMe'], equals: false } },
                    { messageTimestamp: { lte: timestamp } },
                    { OR: [{ status: null }, { status: renderStatus_1.status[3] }] },
                ],
            },
            data: { status: renderStatus_1.status[4] },
        });
        if (result) {
            if (result.count > 0) {
                this.updateChatUnreadMessages(remoteJid);
            }
            return result.count;
        }
        return 0;
    }
    async updateChatUnreadMessages(remoteJid) {
        const [chat, unreadMessages] = await Promise.all([
            this.prismaRepository.chat.findFirst({ where: { remoteJid } }),
            this.prismaRepository.message.count({
                where: {
                    AND: [
                        { key: { path: ['remoteJid'], equals: remoteJid } },
                        { key: { path: ['fromMe'], equals: false } },
                        { status: { equals: renderStatus_1.status[3] } },
                    ],
                },
            }),
        ]);
        if (chat && chat.unreadMessages !== unreadMessages) {
            await this.prismaRepository.chat.update({ where: { id: chat.id }, data: { unreadMessages } });
        }
        return unreadMessages;
    }
    async addLabel(labelId, instanceId, chatId) {
        const id = (0, cuid2_1.createId)();
        await this.prismaRepository.$executeRawUnsafe(`INSERT INTO "Chat" ("id", "instanceId", "remoteJid", "labels", "createdAt", "updatedAt")
       VALUES ($4, $2, $3, to_jsonb(ARRAY[$1]::text[]), NOW(), NOW()) ON CONFLICT ("instanceId", "remoteJid")
     DO
      UPDATE
          SET "labels" = (
          SELECT to_jsonb(array_agg(DISTINCT elem))
          FROM (
          SELECT jsonb_array_elements_text("Chat"."labels") AS elem
          UNION
          SELECT $1::text AS elem
          ) sub
          ),
          "updatedAt" = NOW();`, labelId, instanceId, chatId, id);
    }
    async removeLabel(labelId, instanceId, chatId) {
        const id = (0, cuid2_1.createId)();
        await this.prismaRepository.$executeRawUnsafe(`INSERT INTO "Chat" ("id", "instanceId", "remoteJid", "labels", "createdAt", "updatedAt")
       VALUES ($4, $2, $3, '[]'::jsonb, NOW(), NOW()) ON CONFLICT ("instanceId", "remoteJid")
     DO
      UPDATE
          SET "labels" = COALESCE (
          (
          SELECT jsonb_agg(elem)
          FROM jsonb_array_elements_text("Chat"."labels") AS elem
          WHERE elem <> $1
          ),
          '[]'::jsonb
          ),
          "updatedAt" = NOW();`, labelId, instanceId, chatId, id);
    }
    async baileysOnWhatsapp(jid) {
        const response = await this.client.onWhatsApp(jid);
        return response;
    }
    async baileysProfilePictureUrl(jid, type, timeoutMs) {
        const response = await this.client.profilePictureUrl(jid, type, timeoutMs);
        return response;
    }
    async baileysAssertSessions(jids, force) {
        const response = await this.client.assertSessions(jids, force);
        return response;
    }
    async baileysCreateParticipantNodes(jids, message, extraAttrs) {
        const response = null;
        const convertedResponse = {
            ...response,
            nodes: response?.nodes?.map((node) => ({
                ...node,
                content: node.content?.map((c) => ({
                    ...c,
                    content: c.content instanceof Uint8Array ? Buffer.from(c.content).toString('base64') : c.content,
                })),
            })),
        };
        return convertedResponse;
    }
    async baileysSendNode(stanza) {
        console.log('stanza', JSON.stringify(stanza));
        const response = await this.client.sendNode(stanza);
        return response;
    }
    async baileysGetUSyncDevices(jids, useCache, ignoreZeroDevices) {
        const response = {};
        return response;
    }
    async baileysGenerateMessageTag() {
        const response = await this.client.generateMessageTag();
        return response;
    }
    async baileysSignalRepositoryDecryptMessage(jid, type, ciphertext) {
        try {
            const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
            const response = await this.client.signalRepository.decryptMessage({ jid, type, ciphertext: ciphertextBuffer });
            return response instanceof Uint8Array ? Buffer.from(response).toString('base64') : response;
        }
        catch (error) {
            this.logger.error('Error decrypting message:');
            this.logger.error(error);
            throw error;
        }
    }
    async baileysGetAuthState() {
        const response = { me: this.client.authState.creds.me, account: this.client.authState.creds.account };
        return response;
    }
    async fetchCatalog(instanceName, data) {
        const jid = data.number ? (0, createJid_1.createJid)(data.number) : this.client?.user?.id;
        const limit = data.limit || 10;
        const cursor = null;
        const onWhatsapp = (await this.whatsappNumber({ numbers: [jid] }))?.shift();
        if (!onWhatsapp.exists) {
            throw new _exceptions_1.BadRequestException(onWhatsapp);
        }
        try {
            const info = (await this.whatsappNumber({ numbers: [jid] }))?.shift();
            const business = await this.fetchBusinessProfile(info?.jid);
            let catalog = await this.getCatalog({ jid: info?.jid, limit, cursor });
            let nextPageCursor = catalog.nextPageCursor;
            let nextPageCursorJson = nextPageCursor ? JSON.parse(atob(nextPageCursor)) : null;
            let pagination = nextPageCursorJson?.pagination_cursor
                ? JSON.parse(atob(nextPageCursorJson.pagination_cursor))
                : null;
            let fetcherHasMore = pagination?.fetcher_has_more === true ? true : false;
            let productsCatalog = catalog.products || [];
            let countLoops = 0;
            while (fetcherHasMore && countLoops < 4) {
                catalog = await this.getCatalog({ jid: info?.jid, limit, cursor: nextPageCursor });
                nextPageCursor = catalog.nextPageCursor;
                nextPageCursorJson = nextPageCursor ? JSON.parse(atob(nextPageCursor)) : null;
                pagination = nextPageCursorJson?.pagination_cursor
                    ? JSON.parse(atob(nextPageCursorJson.pagination_cursor))
                    : null;
                fetcherHasMore = pagination?.fetcher_has_more === true ? true : false;
                productsCatalog = [...productsCatalog, ...catalog.products];
                countLoops++;
            }
            return {
                wuid: info?.jid || jid,
                numberExists: info?.exists,
                isBusiness: business.isBusiness,
                catalogLength: productsCatalog.length,
                catalog: productsCatalog,
            };
        }
        catch (error) {
            console.log(error);
            return { wuid: jid, name: null, isBusiness: false };
        }
    }
    async getCatalog({ jid, limit, cursor, }) {
        try {
            jid = jid ? (0, createJid_1.createJid)(jid) : this.instance.wuid;
            const catalog = await this.client.getCatalog({ jid, limit: limit, cursor: cursor });
            if (!catalog) {
                return { products: undefined, nextPageCursor: undefined };
            }
            return catalog;
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error getCatalog', error instanceof Error ? error.message : String(error));
        }
    }
    async fetchCollections(instanceName, data) {
        const jid = data.number ? (0, createJid_1.createJid)(data.number) : this.client?.user?.id;
        const limit = data.limit <= 20 ? data.limit : 20;
        const onWhatsapp = (await this.whatsappNumber({ numbers: [jid] }))?.shift();
        if (!onWhatsapp.exists) {
            throw new _exceptions_1.BadRequestException(onWhatsapp);
        }
        try {
            const info = (await this.whatsappNumber({ numbers: [jid] }))?.shift();
            const business = await this.fetchBusinessProfile(info?.jid);
            const collections = await this.getCollections(info?.jid, limit);
            return {
                wuid: info?.jid || jid,
                name: info?.name,
                numberExists: info?.exists,
                isBusiness: business.isBusiness,
                collectionsLength: collections?.length,
                collections: collections,
            };
        }
        catch (error) {
            return { wuid: jid, name: null, isBusiness: false };
        }
    }
    async getCollections(jid, limit) {
        try {
            jid = jid ? (0, createJid_1.createJid)(jid) : this.instance.wuid;
            const result = await this.client.getCollections(jid, limit);
            if (!result) {
                return [{ id: undefined, name: undefined, products: [], status: undefined }];
            }
            return result.collections;
        }
        catch (error) {
            throw new _exceptions_1.InternalServerErrorException('Error getCatalog', error instanceof Error ? error.message : String(error));
        }
    }
    async fetchMessages(query) {
        const keyFilters = query?.where?.key;
        const timestampFilter = {};
        if (query?.where?.messageTimestamp) {
            if (query.where.messageTimestamp['gte'] && query.where.messageTimestamp['lte']) {
                timestampFilter['messageTimestamp'] = {
                    gte: Math.floor(new Date(query.where.messageTimestamp['gte']).getTime() / 1000),
                    lte: Math.floor(new Date(query.where.messageTimestamp['lte']).getTime() / 1000),
                };
            }
        }
        const count = await this.prismaRepository.message.count({
            where: {
                instanceId: this.instanceId,
                id: query?.where?.id,
                source: query?.where?.source,
                messageType: query?.where?.messageType,
                ...timestampFilter,
                AND: [
                    keyFilters?.id ? { key: { path: ['id'], equals: keyFilters?.id } } : {},
                    keyFilters?.fromMe ? { key: { path: ['fromMe'], equals: keyFilters?.fromMe } } : {},
                    keyFilters?.remoteJid ? { key: { path: ['remoteJid'], equals: keyFilters?.remoteJid } } : {},
                    keyFilters?.participants ? { key: { path: ['participants'], equals: keyFilters?.participants } } : {},
                ],
            },
        });
        if (!query?.offset) {
            query.offset = 50;
        }
        if (!query?.page) {
            query.page = 1;
        }
        const messages = await this.prismaRepository.message.findMany({
            where: {
                instanceId: this.instanceId,
                id: query?.where?.id,
                source: query?.where?.source,
                messageType: query?.where?.messageType,
                ...timestampFilter,
                AND: [
                    keyFilters?.id ? { key: { path: ['id'], equals: keyFilters?.id } } : {},
                    keyFilters?.fromMe ? { key: { path: ['fromMe'], equals: keyFilters?.fromMe } } : {},
                    keyFilters?.remoteJid ? { key: { path: ['remoteJid'], equals: keyFilters?.remoteJid } } : {},
                    keyFilters?.participants ? { key: { path: ['participants'], equals: keyFilters?.participants } } : {},
                ],
            },
            orderBy: { messageTimestamp: 'desc' },
            skip: query.offset * (query?.page === 1 ? 0 : query?.page - 1),
            take: query.offset,
            select: {
                id: true,
                key: true,
                pushName: true,
                messageType: true,
                message: true,
                messageTimestamp: true,
                instanceId: true,
                source: true,
                contextInfo: true,
                MessageUpdate: { select: { status: true } },
            },
        });
        const formattedMessages = messages.map((message) => {
            const messageKey = message.key;
            if (!message.pushName) {
                if (messageKey.fromMe) {
                    message.pushName = 'Você';
                }
                else if (message.contextInfo) {
                    const contextInfo = message.contextInfo;
                    if (contextInfo.participant) {
                        message.pushName = contextInfo.participant.split('@')[0];
                    }
                    else if (messageKey.participant) {
                        message.pushName = messageKey.participant.split('@')[0];
                    }
                }
            }
            return message;
        });
        return {
            messages: {
                total: count,
                pages: Math.ceil(count / query.offset),
                currentPage: query.page,
                records: formattedMessages,
            },
        };
    }
}
exports.BaileysStartupService = BaileysStartupService;
