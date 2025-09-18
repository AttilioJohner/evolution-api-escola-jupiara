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
exports.BusinessStartupService = void 0;
const s3Service = __importStar(require("@api/integrations/storage/s3/libs/minio.server"));
const server_module_1 = require("@api/server.module");
const channel_service_1 = require("@api/services/channel.service");
const wa_types_1 = require("@api/types/wa.types");
const _exceptions_1 = require("@exceptions");
const createJid_1 = require("@utils/createJid");
const renderStatus_1 = require("@utils/renderStatus");
const axios_1 = __importDefault(require("axios"));
const class_validator_1 = require("class-validator");
const form_data_1 = __importDefault(require("form-data"));
const mime_types_1 = __importDefault(require("mime-types"));
const path_1 = require("path");
class BusinessStartupService extends channel_service_1.ChannelStartupService {
    constructor(configService, eventEmitter, prismaRepository, cache, chatwootCache, baileysCache, providerFiles) {
        super(configService, eventEmitter, prismaRepository, chatwootCache);
        this.configService = configService;
        this.eventEmitter = eventEmitter;
        this.prismaRepository = prismaRepository;
        this.cache = cache;
        this.chatwootCache = chatwootCache;
        this.baileysCache = baileysCache;
        this.providerFiles = providerFiles;
        this.stateConnection = { state: 'open' };
    }
    get connectionStatus() {
        return this.stateConnection;
    }
    async closeClient() {
        this.stateConnection = { state: 'close' };
    }
    get qrCode() {
        return {
            pairingCode: this.instance.qrcode?.pairingCode,
            code: this.instance.qrcode?.code,
            base64: this.instance.qrcode?.base64,
            count: this.instance.qrcode?.count,
        };
    }
    async logoutInstance() {
        await this.closeClient();
    }
    isMediaMessage(message) {
        return message.document || message.image || message.audio || message.video;
    }
    async post(message, params) {
        try {
            let urlServer = this.configService.get('WA_BUSINESS').URL;
            const version = this.configService.get('WA_BUSINESS').VERSION;
            urlServer = `${urlServer}/${version}/${this.number}/${params}`;
            const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };
            const result = await axios_1.default.post(urlServer, message, { headers });
            return result.data;
        }
        catch (e) {
            return e.response?.data?.error;
        }
    }
    async profilePicture(number) {
        const jid = (0, createJid_1.createJid)(number);
        return {
            wuid: jid,
            profilePictureUrl: null,
        };
    }
    async getProfileName() {
        return null;
    }
    async profilePictureUrl() {
        return null;
    }
    async getProfileStatus() {
        return null;
    }
    async setWhatsappBusinessProfile(data) {
        const content = {
            messaging_product: 'whatsapp',
            about: data.about,
            address: data.address,
            description: data.description,
            vertical: data.vertical,
            email: data.email,
            websites: data.websites,
            profile_picture_handle: data.profilehandle,
        };
        return await this.post(content, 'whatsapp_business_profile');
    }
    async connectToWhatsapp(data) {
        if (!data)
            return;
        const content = data.entry[0].changes[0].value;
        try {
            this.loadChatwoot();
            this.eventHandler(content);
            this.phoneNumber = (0, createJid_1.createJid)(content.messages ? content.messages[0].from : content.statuses[0]?.recipient_id);
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.InternalServerErrorException(error?.toString());
        }
    }
    async downloadMediaMessage(message) {
        try {
            const id = message[message.type].id;
            let urlServer = this.configService.get('WA_BUSINESS').URL;
            const version = this.configService.get('WA_BUSINESS').VERSION;
            urlServer = `${urlServer}/${version}/${id}`;
            const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };
            let result = await axios_1.default.get(urlServer, { headers });
            result = await axios_1.default.get(result.data.url, {
                headers: { Authorization: `Bearer ${this.token}` },
                responseType: 'arraybuffer',
            });
            return result.data;
        }
        catch (e) {
            this.logger.error(`Error downloading media: ${e}`);
            throw e;
        }
    }
    messageMediaJson(received) {
        const message = received.messages[0];
        let content = message.type + 'Message';
        content = { [content]: message[message.type] };
        if (message.context) {
            content = { ...content, contextInfo: { stanzaId: message.context.id } };
        }
        return content;
    }
    messageAudioJson(received) {
        const message = received.messages[0];
        let content = {
            audioMessage: {
                ...message.audio,
                ptt: message.audio.voice || false,
            },
        };
        if (message.context) {
            content = { ...content, contextInfo: { stanzaId: message.context.id } };
        }
        return content;
    }
    messageInteractiveJson(received) {
        const message = received.messages[0];
        let content = { conversation: message.interactive[message.interactive.type].title };
        message.context ? (content = { ...content, contextInfo: { stanzaId: message.context.id } }) : content;
        return content;
    }
    messageButtonJson(received) {
        const message = received.messages[0];
        let content = { conversation: received.messages[0].button?.text };
        message.context ? (content = { ...content, contextInfo: { stanzaId: message.context.id } }) : content;
        return content;
    }
    messageReactionJson(received) {
        const message = received.messages[0];
        let content = {
            reactionMessage: {
                key: {
                    id: message.reaction.message_id,
                },
                text: message.reaction.emoji,
            },
        };
        message.context ? (content = { ...content, contextInfo: { stanzaId: message.context.id } }) : content;
        return content;
    }
    messageTextJson(received) {
        if (!received || !received.messages || received.messages.length === 0) {
            this.logger.error('Error: received object or messages array is undefined or empty');
            return null;
        }
        const message = received.messages[0];
        let content;
        if (!message.text) {
            if (message.type === 'sticker') {
                content = { stickerMessage: {} };
            }
            else if (message.type === 'location') {
                content = {
                    locationMessage: {
                        degreesLatitude: message.location?.latitude,
                        degreesLongitude: message.location?.longitude,
                        name: message.location?.name,
                        address: message.location?.address,
                    },
                };
            }
            else {
                this.logger.log(`Mensaje de tipo ${message.type} sin campo text`);
                content = { [message.type + 'Message']: message[message.type] || {} };
            }
            if (message.context) {
                content = { ...content, contextInfo: { stanzaId: message.context.id } };
            }
            return content;
        }
        if (!received.metadata || !received.metadata.phone_number_id) {
            this.logger.error('Error: metadata or phone_number_id is undefined');
            return null;
        }
        if (message.from === received.metadata.phone_number_id) {
            content = {
                extendedTextMessage: { text: message.text.body },
            };
            if (message.context) {
                content = { ...content, contextInfo: { stanzaId: message.context.id } };
            }
        }
        else {
            content = { conversation: message.text.body };
            if (message.context) {
                content = { ...content, contextInfo: { stanzaId: message.context.id } };
            }
        }
        return content;
    }
    messageLocationJson(received) {
        const message = received.messages[0];
        let content = {
            locationMessage: {
                degreesLatitude: message.location.latitude,
                degreesLongitude: message.location.longitude,
                name: message.location?.name,
                address: message.location?.address,
            },
        };
        message.context ? (content = { ...content, contextInfo: { stanzaId: message.context.id } }) : content;
        return content;
    }
    messageContactsJson(received) {
        const message = received.messages[0];
        let content = {};
        const vcard = (contact) => {
            let result = 'BEGIN:VCARD\n' +
                'VERSION:3.0\n' +
                `N:${contact.name.formatted_name}\n` +
                `FN:${contact.name.formatted_name}\n`;
            if (contact.org) {
                result += `ORG:${contact.org.company};\n`;
            }
            if (contact.emails) {
                result += `EMAIL:${contact.emails[0].email}\n`;
            }
            if (contact.urls) {
                result += `URL:${contact.urls[0].url}\n`;
            }
            if (!contact.phones[0]?.wa_id) {
                contact.phones[0].wa_id = (0, createJid_1.createJid)(contact.phones[0].phone);
            }
            result +=
                `item1.TEL;waid=${contact.phones[0]?.wa_id}:${contact.phones[0].phone}\n` +
                    'item1.X-ABLabel:Celular\n' +
                    'END:VCARD';
            return result;
        };
        if (message.contacts.length === 1) {
            content.contactMessage = {
                displayName: message.contacts[0].name.formatted_name,
                vcard: vcard(message.contacts[0]),
            };
        }
        else {
            content.contactsArrayMessage = {
                displayName: `${message.length} contacts`,
                contacts: message.map((contact) => {
                    return {
                        displayName: contact.name.formatted_name,
                        vcard: vcard(contact),
                    };
                }),
            };
        }
        message.context ? (content = { ...content, contextInfo: { stanzaId: message.context.id } }) : content;
        return content;
    }
    renderMessageType(type) {
        let messageType;
        switch (type) {
            case 'text':
                messageType = 'conversation';
                break;
            case 'image':
                messageType = 'imageMessage';
                break;
            case 'video':
                messageType = 'videoMessage';
                break;
            case 'audio':
                messageType = 'audioMessage';
                break;
            case 'document':
                messageType = 'documentMessage';
                break;
            case 'template':
                messageType = 'conversation';
                break;
            case 'location':
                messageType = 'locationMessage';
                break;
            case 'sticker':
                messageType = 'stickerMessage';
                break;
            default:
                messageType = 'conversation';
                break;
        }
        return messageType;
    }
    async messageHandle(received, database, settings) {
        try {
            let messageRaw;
            let pushName;
            if (received.contacts)
                pushName = received.contacts[0].profile.name;
            if (received.messages) {
                const message = received.messages[0];
                const key = {
                    id: message.id,
                    remoteJid: this.phoneNumber,
                    fromMe: message.from === received.metadata.phone_number_id,
                };
                if (message.type === 'sticker') {
                    this.logger.log('Procesando mensaje de tipo sticker');
                    messageRaw = {
                        key,
                        pushName,
                        message: {
                            stickerMessage: message.sticker || {},
                        },
                        messageType: 'stickerMessage',
                        messageTimestamp: parseInt(message.timestamp),
                        source: 'unknown',
                        instanceId: this.instanceId,
                    };
                }
                else if (this.isMediaMessage(message)) {
                    const messageContent = message.type === 'audio' ? this.messageAudioJson(received) : this.messageMediaJson(received);
                    messageRaw = {
                        key,
                        pushName,
                        message: messageContent,
                        contextInfo: messageContent?.contextInfo,
                        messageType: this.renderMessageType(received.messages[0].type),
                        messageTimestamp: parseInt(received.messages[0].timestamp),
                        source: 'unknown',
                        instanceId: this.instanceId,
                    };
                    if (this.configService.get('S3').ENABLE) {
                        try {
                            const message = received;
                            const hasRealMedia = this.hasValidMediaContent(messageRaw);
                            if (!hasRealMedia) {
                                this.logger.warn('Message detected as media but contains no valid media content');
                            }
                            else {
                                const id = message.messages[0][message.messages[0].type].id;
                                let urlServer = this.configService.get('WA_BUSINESS').URL;
                                const version = this.configService.get('WA_BUSINESS').VERSION;
                                urlServer = `${urlServer}/${version}/${id}`;
                                const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };
                                const result = await axios_1.default.get(urlServer, { headers });
                                const buffer = await axios_1.default.get(result.data.url, {
                                    headers: { Authorization: `Bearer ${this.token}` },
                                    responseType: 'arraybuffer',
                                });
                                let mediaType;
                                if (message.messages[0].document) {
                                    mediaType = 'document';
                                }
                                else if (message.messages[0].image) {
                                    mediaType = 'image';
                                }
                                else if (message.messages[0].audio) {
                                    mediaType = 'audio';
                                }
                                else {
                                    mediaType = 'video';
                                }
                                const mimetype = result.data?.mime_type || result.headers['content-type'];
                                const contentDisposition = result.headers['content-disposition'];
                                let fileName = `${message.messages[0].id}.${mimetype.split('/')[1]}`;
                                if (contentDisposition) {
                                    const match = contentDisposition.match(/filename="(.+?)"/);
                                    if (match) {
                                        fileName = match[1];
                                    }
                                }
                                if (mediaType === 'audio') {
                                    if (mimetype.includes('ogg')) {
                                        fileName = `${message.messages[0].id}.ogg`;
                                    }
                                    else if (mimetype.includes('mp3')) {
                                        fileName = `${message.messages[0].id}.mp3`;
                                    }
                                    else if (mimetype.includes('m4a')) {
                                        fileName = `${message.messages[0].id}.m4a`;
                                    }
                                }
                                const size = result.headers['content-length'] || buffer.data.byteLength;
                                const fullName = (0, path_1.join)(`${this.instance.id}`, key.remoteJid, mediaType, fileName);
                                await s3Service.uploadFile(fullName, buffer.data, size, {
                                    'Content-Type': mimetype,
                                });
                                const createdMessage = await this.prismaRepository.message.create({
                                    data: messageRaw,
                                });
                                await this.prismaRepository.media.create({
                                    data: {
                                        messageId: createdMessage.id,
                                        instanceId: this.instanceId,
                                        type: mediaType,
                                        fileName: fullName,
                                        mimetype,
                                    },
                                });
                                const mediaUrl = await s3Service.getObjectUrl(fullName);
                                messageRaw.message.mediaUrl = mediaUrl;
                                messageRaw.message.base64 = buffer.data.toString('base64');
                                if (this.configService.get('OPENAI').ENABLED && mediaType === 'audio') {
                                    const openAiDefaultSettings = await this.prismaRepository.openaiSetting.findFirst({
                                        where: {
                                            instanceId: this.instanceId,
                                        },
                                        include: {
                                            OpenaiCreds: true,
                                        },
                                    });
                                    if (openAiDefaultSettings &&
                                        openAiDefaultSettings.openaiCredsId &&
                                        openAiDefaultSettings.speechToText) {
                                        try {
                                            messageRaw.message.speechToText = `[audio] ${await this.openaiService.speechToText(openAiDefaultSettings.OpenaiCreds, {
                                                message: {
                                                    mediaUrl: messageRaw.message.mediaUrl,
                                                    ...messageRaw,
                                                },
                                            })}`;
                                        }
                                        catch (speechError) {
                                            this.logger.error(`Error processing speech-to-text: ${speechError}`);
                                        }
                                    }
                                }
                            }
                        }
                        catch (error) {
                            this.logger.error(['Error on upload file to minio', error?.message, error?.stack]);
                        }
                    }
                    else {
                        const buffer = await this.downloadMediaMessage(received?.messages[0]);
                        messageRaw.message.base64 = buffer.toString('base64');
                        if (this.configService.get('OPENAI').ENABLED && message.type === 'audio') {
                            const openAiDefaultSettings = await this.prismaRepository.openaiSetting.findFirst({
                                where: {
                                    instanceId: this.instanceId,
                                },
                                include: {
                                    OpenaiCreds: true,
                                },
                            });
                            if (openAiDefaultSettings && openAiDefaultSettings.openaiCredsId && openAiDefaultSettings.speechToText) {
                                try {
                                    messageRaw.message.speechToText = `[audio] ${await this.openaiService.speechToText(openAiDefaultSettings.OpenaiCreds, {
                                        message: {
                                            base64: messageRaw.message.base64,
                                            ...messageRaw,
                                        },
                                    })}`;
                                }
                                catch (speechError) {
                                    this.logger.error(`Error processing speech-to-text: ${speechError}`);
                                }
                            }
                        }
                    }
                }
                else if (received?.messages[0].interactive) {
                    messageRaw = {
                        key,
                        pushName,
                        message: {
                            ...this.messageInteractiveJson(received),
                        },
                        contextInfo: this.messageInteractiveJson(received)?.contextInfo,
                        messageType: 'interactiveMessage',
                        messageTimestamp: parseInt(received.messages[0].timestamp),
                        source: 'unknown',
                        instanceId: this.instanceId,
                    };
                }
                else if (received?.messages[0].button) {
                    messageRaw = {
                        key,
                        pushName,
                        message: {
                            ...this.messageButtonJson(received),
                        },
                        contextInfo: this.messageButtonJson(received)?.contextInfo,
                        messageType: 'buttonMessage',
                        messageTimestamp: parseInt(received.messages[0].timestamp),
                        source: 'unknown',
                        instanceId: this.instanceId,
                    };
                }
                else if (received?.messages[0].reaction) {
                    messageRaw = {
                        key,
                        pushName,
                        message: {
                            ...this.messageReactionJson(received),
                        },
                        contextInfo: this.messageReactionJson(received)?.contextInfo,
                        messageType: 'reactionMessage',
                        messageTimestamp: parseInt(received.messages[0].timestamp),
                        source: 'unknown',
                        instanceId: this.instanceId,
                    };
                }
                else if (received?.messages[0].contacts) {
                    messageRaw = {
                        key,
                        pushName,
                        message: {
                            ...this.messageContactsJson(received),
                        },
                        contextInfo: this.messageContactsJson(received)?.contextInfo,
                        messageType: 'contactMessage',
                        messageTimestamp: parseInt(received.messages[0].timestamp),
                        source: 'unknown',
                        instanceId: this.instanceId,
                    };
                }
                else {
                    messageRaw = {
                        key,
                        pushName,
                        message: this.messageTextJson(received),
                        contextInfo: this.messageTextJson(received)?.contextInfo,
                        messageType: this.renderMessageType(received.messages[0].type),
                        messageTimestamp: parseInt(received.messages[0].timestamp),
                        source: 'unknown',
                        instanceId: this.instanceId,
                    };
                }
                if (this.localSettings.readMessages) {
                }
                this.logger.log(messageRaw);
                this.sendDataWebhook(wa_types_1.Events.MESSAGES_UPSERT, messageRaw);
                await server_module_1.chatbotController.emit({
                    instance: { instanceName: this.instance.name, instanceId: this.instanceId },
                    remoteJid: messageRaw.key.remoteJid,
                    msg: messageRaw,
                    pushName: messageRaw.pushName,
                });
                if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                    const chatwootSentMessage = await this.chatwootService.eventWhatsapp(wa_types_1.Events.MESSAGES_UPSERT, { instanceName: this.instance.name, instanceId: this.instanceId }, messageRaw);
                    if (chatwootSentMessage?.id) {
                        messageRaw.chatwootMessageId = chatwootSentMessage.id;
                        messageRaw.chatwootInboxId = chatwootSentMessage.id;
                        messageRaw.chatwootConversationId = chatwootSentMessage.id;
                    }
                }
                if (!this.isMediaMessage(message) && message.type !== 'sticker') {
                    await this.prismaRepository.message.create({
                        data: messageRaw,
                    });
                }
                const contact = await this.prismaRepository.contact.findFirst({
                    where: { instanceId: this.instanceId, remoteJid: key.remoteJid },
                });
                const contactRaw = {
                    remoteJid: received.contacts[0].profile.phone,
                    pushName,
                    instanceId: this.instanceId,
                };
                if (contactRaw.remoteJid === 'status@broadcast') {
                    return;
                }
                if (contact) {
                    const contactRaw = {
                        remoteJid: received.contacts[0].profile.phone,
                        pushName,
                        instanceId: this.instanceId,
                    };
                    this.sendDataWebhook(wa_types_1.Events.CONTACTS_UPDATE, contactRaw);
                    if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                        await this.chatwootService.eventWhatsapp(wa_types_1.Events.CONTACTS_UPDATE, { instanceName: this.instance.name, instanceId: this.instanceId }, contactRaw);
                    }
                    await this.prismaRepository.contact.updateMany({
                        where: { remoteJid: contact.remoteJid },
                        data: contactRaw,
                    });
                    return;
                }
                this.sendDataWebhook(wa_types_1.Events.CONTACTS_UPSERT, contactRaw);
                this.prismaRepository.contact.create({
                    data: contactRaw,
                });
            }
            if (received.statuses) {
                for await (const item of received.statuses) {
                    const key = {
                        id: item.id,
                        remoteJid: this.phoneNumber,
                        fromMe: this.phoneNumber === received.metadata.phone_number_id,
                    };
                    if (settings?.groups_ignore && key.remoteJid.includes('@g.us')) {
                        return;
                    }
                    if (key.remoteJid !== 'status@broadcast' && !key?.remoteJid?.match(/(:\d+)/)) {
                        const findMessage = await this.prismaRepository.message.findFirst({
                            where: {
                                instanceId: this.instanceId,
                                key: {
                                    path: ['id'],
                                    equals: key.id,
                                },
                            },
                        });
                        if (!findMessage) {
                            return;
                        }
                        if (item.message === null && item.status === undefined) {
                            this.sendDataWebhook(wa_types_1.Events.MESSAGES_DELETE, key);
                            const message = {
                                messageId: findMessage.id,
                                keyId: key.id,
                                remoteJid: key.remoteJid,
                                fromMe: key.fromMe,
                                participant: key?.remoteJid,
                                status: 'DELETED',
                                instanceId: this.instanceId,
                            };
                            await this.prismaRepository.messageUpdate.create({
                                data: message,
                            });
                            if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                                this.chatwootService.eventWhatsapp(wa_types_1.Events.MESSAGES_DELETE, { instanceName: this.instance.name, instanceId: this.instanceId }, { key: key });
                            }
                            return;
                        }
                        const message = {
                            messageId: findMessage.id,
                            keyId: key.id,
                            remoteJid: key.remoteJid,
                            fromMe: key.fromMe,
                            participant: key?.remoteJid,
                            status: item.status.toUpperCase(),
                            instanceId: this.instanceId,
                        };
                        this.sendDataWebhook(wa_types_1.Events.MESSAGES_UPDATE, message);
                        await this.prismaRepository.messageUpdate.create({
                            data: message,
                        });
                        if (findMessage.webhookUrl) {
                            await axios_1.default.post(findMessage.webhookUrl, message);
                        }
                    }
                }
            }
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    convertMessageToRaw(message, content) {
        let convertMessage;
        if (message?.conversation) {
            if (content?.context?.message_id) {
                convertMessage = {
                    ...message,
                    contextInfo: { stanzaId: content.context.message_id },
                };
                return convertMessage;
            }
            convertMessage = message;
            return convertMessage;
        }
        if (message?.mediaType === 'image') {
            if (content?.context?.message_id) {
                convertMessage = {
                    imageMessage: message,
                    contextInfo: { stanzaId: content.context.message_id },
                };
                return convertMessage;
            }
            return {
                imageMessage: message,
            };
        }
        if (message?.mediaType === 'video') {
            if (content?.context?.message_id) {
                convertMessage = {
                    videoMessage: message,
                    contextInfo: { stanzaId: content.context.message_id },
                };
                return convertMessage;
            }
            return {
                videoMessage: message,
            };
        }
        if (message?.mediaType === 'audio') {
            if (content?.context?.message_id) {
                convertMessage = {
                    audioMessage: message,
                    contextInfo: { stanzaId: content.context.message_id },
                };
                return convertMessage;
            }
            return {
                audioMessage: message,
            };
        }
        if (message?.mediaType === 'document') {
            if (content?.context?.message_id) {
                convertMessage = {
                    documentMessage: message,
                    contextInfo: { stanzaId: content.context.message_id },
                };
                return convertMessage;
            }
            return {
                documentMessage: message,
            };
        }
        return message;
    }
    async eventHandler(content) {
        try {
            this.logger.log('Contenido recibido en eventHandler:');
            this.logger.log(JSON.stringify(content, null, 2));
            const database = this.configService.get('DATABASE');
            const settings = await this.findSettings();
            if (content.messages && content.messages.length > 0) {
                const message = content.messages[0];
                this.logger.log(`Tipo de mensaje recibido: ${message.type}`);
                if (message.type === 'text' ||
                    message.type === 'image' ||
                    message.type === 'video' ||
                    message.type === 'audio' ||
                    message.type === 'document' ||
                    message.type === 'sticker' ||
                    message.type === 'location' ||
                    message.type === 'contacts' ||
                    message.type === 'interactive' ||
                    message.type === 'button' ||
                    message.type === 'reaction') {
                    this.messageHandle(content, database, settings);
                }
                else {
                    this.logger.warn(`Tipo de mensaje no reconocido: ${message.type}`);
                }
            }
            else if (content.statuses) {
                this.messageHandle(content, database, settings);
            }
            else {
                this.logger.warn('No se encontraron mensajes ni estados en el contenido recibido');
            }
        }
        catch (error) {
            this.logger.error('Error en eventHandler:');
            this.logger.error(error);
        }
    }
    async sendMessageWithTyping(number, message, options, isIntegration = false) {
        try {
            let quoted;
            let webhookUrl;
            if (options?.quoted) {
                const m = options?.quoted;
                const msg = m?.key;
                if (!msg) {
                    throw 'Message not found';
                }
                quoted = msg;
            }
            if (options?.webhookUrl) {
                webhookUrl = options.webhookUrl;
            }
            let content;
            const messageSent = await (async () => {
                if (message['reactionMessage']) {
                    content = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        type: 'reaction',
                        to: number.replace(/\D/g, ''),
                        reaction: {
                            message_id: message['reactionMessage']['key']['id'],
                            emoji: message['reactionMessage']['text'],
                        },
                    };
                    quoted ? (content.context = { message_id: quoted.id }) : content;
                    return await this.post(content, 'messages');
                }
                if (message['locationMessage']) {
                    content = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        type: 'location',
                        to: number.replace(/\D/g, ''),
                        location: {
                            longitude: message['locationMessage']['degreesLongitude'],
                            latitude: message['locationMessage']['degreesLatitude'],
                            name: message['locationMessage']['name'],
                            address: message['locationMessage']['address'],
                        },
                    };
                    quoted ? (content.context = { message_id: quoted.id }) : content;
                    return await this.post(content, 'messages');
                }
                if (message['contacts']) {
                    content = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        type: 'contacts',
                        to: number.replace(/\D/g, ''),
                        contacts: message['contacts'],
                    };
                    quoted ? (content.context = { message_id: quoted.id }) : content;
                    message = message['message'];
                    return await this.post(content, 'messages');
                }
                if (message['conversation']) {
                    content = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        type: 'text',
                        to: number.replace(/\D/g, ''),
                        text: {
                            body: message['conversation'],
                            preview_url: Boolean(options?.linkPreview),
                        },
                    };
                    quoted ? (content.context = { message_id: quoted.id }) : content;
                    return await this.post(content, 'messages');
                }
                if (message['media']) {
                    const isImage = message['mimetype']?.startsWith('image/');
                    content = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        type: message['mediaType'],
                        to: number.replace(/\D/g, ''),
                        [message['mediaType']]: {
                            [message['type']]: message['id'],
                            ...(message['mediaType'] !== 'audio' &&
                                message['fileName'] &&
                                !isImage && { filename: message['fileName'] }),
                            ...(message['mediaType'] !== 'audio' && message['caption'] && { caption: message['caption'] }),
                        },
                    };
                    quoted ? (content.context = { message_id: quoted.id }) : content;
                    return await this.post(content, 'messages');
                }
                if (message['audio']) {
                    content = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        type: 'audio',
                        to: number.replace(/\D/g, ''),
                        audio: {
                            [message['type']]: message['id'],
                        },
                    };
                    quoted ? (content.context = { message_id: quoted.id }) : content;
                    return await this.post(content, 'messages');
                }
                if (message['buttons']) {
                    content = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: number.replace(/\D/g, ''),
                        type: 'interactive',
                        interactive: {
                            type: 'button',
                            body: {
                                text: message['text'] || 'Select',
                            },
                            action: {
                                buttons: message['buttons'],
                            },
                        },
                    };
                    quoted ? (content.context = { message_id: quoted.id }) : content;
                    let formattedText = '';
                    for (const item of message['buttons']) {
                        formattedText += `▶️ ${item.reply?.title}\n`;
                    }
                    message = { conversation: `${message['text'] || 'Select'}\n` + formattedText };
                    return await this.post(content, 'messages');
                }
                if (message['listMessage']) {
                    content = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: number.replace(/\D/g, ''),
                        type: 'interactive',
                        interactive: {
                            type: 'list',
                            header: {
                                type: 'text',
                                text: message['listMessage']['title'],
                            },
                            body: {
                                text: message['listMessage']['description'],
                            },
                            footer: {
                                text: message['listMessage']['footerText'],
                            },
                            action: {
                                button: message['listMessage']['buttonText'],
                                sections: message['listMessage']['sections'],
                            },
                        },
                    };
                    quoted ? (content.context = { message_id: quoted.id }) : content;
                    let formattedText = '';
                    for (const section of message['listMessage']['sections']) {
                        formattedText += `${section?.title}\n`;
                        for (const row of section.rows) {
                            formattedText += `${row?.title}\n`;
                        }
                    }
                    message = { conversation: `${message['listMessage']['title']}\n` + formattedText };
                    return await this.post(content, 'messages');
                }
                if (message['template']) {
                    content = {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: number.replace(/\D/g, ''),
                        type: 'template',
                        template: {
                            name: message['template']['name'],
                            language: {
                                code: message['template']['language'] || 'en_US',
                            },
                            components: message['template']['components'],
                        },
                    };
                    quoted ? (content.context = { message_id: quoted.id }) : content;
                    message = { conversation: `▶️${message['template']['name']}◀️` };
                    return await this.post(content, 'messages');
                }
            })();
            if (messageSent?.error_data || messageSent.message) {
                this.logger.error(messageSent);
                return messageSent;
            }
            const messageRaw = {
                key: { fromMe: true, id: messageSent?.messages[0]?.id, remoteJid: (0, createJid_1.createJid)(number) },
                message: this.convertMessageToRaw(message, content),
                messageType: this.renderMessageType(content.type),
                messageTimestamp: messageSent?.messages[0]?.timestamp || Math.round(new Date().getTime() / 1000),
                instanceId: this.instanceId,
                webhookUrl,
                status: renderStatus_1.status[1],
                source: 'unknown',
            };
            this.logger.log(messageRaw);
            this.sendDataWebhook(wa_types_1.Events.SEND_MESSAGE, messageRaw);
            if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled && !isIntegration) {
                this.chatwootService.eventWhatsapp(wa_types_1.Events.SEND_MESSAGE, { instanceName: this.instance.name, instanceId: this.instanceId }, messageRaw);
            }
            if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled && isIntegration)
                await server_module_1.chatbotController.emit({
                    instance: { instanceName: this.instance.name, instanceId: this.instanceId },
                    remoteJid: messageRaw.key.remoteJid,
                    msg: messageRaw,
                    pushName: messageRaw.pushName,
                });
            await this.prismaRepository.message.create({
                data: messageRaw,
            });
            return messageRaw;
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async textMessage(data, isIntegration = false) {
        const res = await this.sendMessageWithTyping(data.number, {
            conversation: data.text,
        }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            linkPreview: data?.linkPreview,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        }, isIntegration);
        return res;
    }
    async getIdMedia(mediaMessage, isFile = false) {
        try {
            const formData = new form_data_1.default();
            if (isFile === false) {
                if ((0, class_validator_1.isURL)(mediaMessage.media)) {
                    const response = await axios_1.default.get(mediaMessage.media, { responseType: 'arraybuffer' });
                    const buffer = Buffer.from(response.data, 'base64');
                    formData.append('file', buffer, {
                        filename: mediaMessage.fileName || 'media',
                        contentType: mediaMessage.mimetype,
                    });
                }
                else {
                    const buffer = Buffer.from(mediaMessage.media, 'base64');
                    formData.append('file', buffer, {
                        filename: mediaMessage.fileName || 'media',
                        contentType: mediaMessage.mimetype,
                    });
                }
            }
            else {
                formData.append('file', mediaMessage.media.buffer, {
                    filename: mediaMessage.media.originalname,
                    contentType: mediaMessage.media.mimetype,
                });
            }
            const mimetype = mediaMessage.mimetype || mediaMessage.media.mimetype;
            formData.append('typeFile', mimetype);
            formData.append('messaging_product', 'whatsapp');
            const token = this.token;
            const headers = { Authorization: `Bearer ${token}` };
            const url = `${this.configService.get('WA_BUSINESS').URL}/${this.configService.get('WA_BUSINESS').VERSION}/${this.number}/media`;
            const res = await axios_1.default.post(url, formData, { headers });
            return res.data.id;
        }
        catch (error) {
            this.logger.error(error.response.data);
            throw new _exceptions_1.InternalServerErrorException(error?.toString() || error);
        }
    }
    async prepareMediaMessage(mediaMessage) {
        try {
            if (mediaMessage.mediatype === 'document' && !mediaMessage.fileName) {
                const regex = new RegExp(/.*\/(.+?)\./);
                const arrayMatch = regex.exec(mediaMessage.media);
                mediaMessage.fileName = arrayMatch[1];
            }
            if (mediaMessage.mediatype === 'image' && !mediaMessage.fileName) {
                mediaMessage.fileName = 'image.png';
            }
            if (mediaMessage.mediatype === 'video' && !mediaMessage.fileName) {
                mediaMessage.fileName = 'video.mp4';
            }
            let mimetype;
            const prepareMedia = {
                caption: mediaMessage?.caption,
                fileName: mediaMessage.fileName,
                mediaType: mediaMessage.mediatype,
                media: mediaMessage.media,
                gifPlayback: false,
            };
            if ((0, class_validator_1.isURL)(mediaMessage.media)) {
                mimetype = mime_types_1.default.lookup(mediaMessage.media);
                prepareMedia.id = mediaMessage.media;
                prepareMedia.type = 'link';
            }
            else {
                mimetype = mime_types_1.default.lookup(mediaMessage.fileName);
                const id = await this.getIdMedia(prepareMedia);
                prepareMedia.id = id;
                prepareMedia.type = 'id';
            }
            prepareMedia.mimetype = mimetype;
            return prepareMedia;
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.InternalServerErrorException(error?.toString() || error);
        }
    }
    async mediaMessage(data, file, isIntegration = false) {
        const mediaData = { ...data };
        if (file)
            mediaData.media = file.buffer.toString('base64');
        const message = await this.prepareMediaMessage(mediaData);
        const mediaSent = await this.sendMessageWithTyping(data.number, { ...message }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            linkPreview: data?.linkPreview,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        }, isIntegration);
        return mediaSent;
    }
    async processAudio(audio, number, file) {
        number = number.replace(/\D/g, '');
        const hash = `${number}-${new Date().getTime()}`;
        if (process.env.API_AUDIO_CONVERTER) {
            this.logger.verbose('Using audio converter API');
            const formData = new form_data_1.default();
            if (file) {
                formData.append('file', file.buffer, {
                    filename: file.originalname,
                    contentType: file.mimetype,
                });
            }
            else if ((0, class_validator_1.isURL)(audio)) {
                formData.append('url', audio);
            }
            else {
                formData.append('base64', audio);
            }
            formData.append('format', 'mp3');
            const response = await axios_1.default.post(process.env.API_AUDIO_CONVERTER, formData, {
                headers: {
                    ...formData.getHeaders(),
                    apikey: process.env.API_AUDIO_CONVERTER_KEY,
                },
            });
            const audioConverter = response?.data?.audio || response?.data?.url;
            if (!audioConverter) {
                throw new _exceptions_1.InternalServerErrorException('Failed to convert audio');
            }
            const prepareMedia = {
                fileName: `${hash}.mp3`,
                mediaType: 'audio',
                media: audioConverter,
                mimetype: 'audio/mpeg',
            };
            const id = await this.getIdMedia(prepareMedia);
            prepareMedia.id = id;
            prepareMedia.type = 'id';
            this.logger.verbose('Audio converted');
            return prepareMedia;
        }
        else {
            let mimetype;
            const prepareMedia = {
                fileName: `${hash}.mp3`,
                mediaType: 'audio',
                media: audio,
            };
            if ((0, class_validator_1.isURL)(audio)) {
                mimetype = mime_types_1.default.lookup(audio);
                prepareMedia.id = audio;
                prepareMedia.type = 'link';
            }
            else if (audio && !file) {
                mimetype = mime_types_1.default.lookup(prepareMedia.fileName);
                const id = await this.getIdMedia(prepareMedia);
                prepareMedia.id = id;
                prepareMedia.type = 'id';
            }
            else if (file) {
                prepareMedia.media = file;
                const id = await this.getIdMedia(prepareMedia, true);
                prepareMedia.id = id;
                prepareMedia.type = 'id';
                mimetype = file.mimetype;
            }
            prepareMedia.mimetype = mimetype;
            return prepareMedia;
        }
    }
    async audioWhatsapp(data, file, isIntegration = false) {
        const message = await this.processAudio(data.audio, data.number, file);
        const audioSent = await this.sendMessageWithTyping(data.number, { ...message }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            linkPreview: data?.linkPreview,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        }, isIntegration);
        return audioSent;
    }
    async buttonMessage(data) {
        const embeddedMedia = {};
        const btnItems = {
            text: data.buttons.map((btn) => btn.displayText),
            ids: data.buttons.map((btn) => btn.id),
        };
        if (!(0, class_validator_1.arrayUnique)(btnItems.text) || !(0, class_validator_1.arrayUnique)(btnItems.ids)) {
            throw new _exceptions_1.BadRequestException('Button texts cannot be repeated', 'Button IDs cannot be repeated.');
        }
        return await this.sendMessageWithTyping(data.number, {
            text: !embeddedMedia?.mediaKey ? data.title : undefined,
            buttons: data.buttons.map((button) => {
                return {
                    type: 'reply',
                    reply: {
                        title: button.displayText,
                        id: button.id,
                    },
                };
            }),
            [embeddedMedia?.mediaKey]: embeddedMedia?.message,
        }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            linkPreview: data?.linkPreview,
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
            linkPreview: data?.linkPreview,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        });
    }
    async listMessage(data) {
        const sectionsItems = {
            title: data.sections.map((list) => list.title),
        };
        if (!(0, class_validator_1.arrayUnique)(sectionsItems.title)) {
            throw new _exceptions_1.BadRequestException('Section tiles cannot be repeated');
        }
        const sendData = {
            listMessage: {
                title: data.title,
                description: data.description,
                footerText: data?.footerText,
                buttonText: data?.buttonText,
                sections: data.sections.map((section) => {
                    return {
                        title: section.title,
                        rows: section.rows.map((row) => {
                            return {
                                title: row.title,
                                description: row.description.substring(0, 72),
                                id: row.rowId,
                            };
                        }),
                    };
                }),
            },
        };
        return await this.sendMessageWithTyping(data.number, sendData, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            linkPreview: data?.linkPreview,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        });
    }
    async templateMessage(data, isIntegration = false) {
        const res = await this.sendMessageWithTyping(data.number, {
            template: {
                name: data.name,
                language: data.language,
                components: data.components,
            },
        }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            linkPreview: data?.linkPreview,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
            webhookUrl: data?.webhookUrl,
        }, isIntegration);
        return res;
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
            message.contact = {
                displayName: data.contact[0].fullName,
                vcard: vcard(data.contact[0]),
            };
        }
        else {
            message.contactsArrayMessage = {
                displayName: `${data.contact.length} contacts`,
                contacts: data.contact.map((contact) => {
                    return {
                        displayName: contact.fullName,
                        vcard: vcard(contact),
                    };
                }),
            };
        }
        return await this.sendMessageWithTyping(data.number, {
            contacts: data.contact.map((contact) => {
                return {
                    name: { formatted_name: contact.fullName, first_name: contact.fullName },
                    phones: [{ phone: contact.phoneNumber }],
                    urls: [{ url: contact.url }],
                    emails: [{ email: contact.email }],
                    org: { company: contact.organization },
                };
            }),
            message,
        }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            linkPreview: data?.linkPreview,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        });
    }
    async reactionMessage(data) {
        return await this.sendMessageWithTyping(data.key.remoteJid, {
            reactionMessage: {
                key: data.key,
                text: data.reaction,
            },
        });
    }
    async getBase64FromMediaMessage(data) {
        try {
            const msg = data.message;
            const messageType = msg.messageType.includes('Message') ? msg.messageType : msg.messageType + 'Message';
            const mediaMessage = msg.message[messageType];
            return {
                mediaType: msg.messageType,
                fileName: mediaMessage?.fileName,
                caption: mediaMessage?.caption,
                size: {
                    fileLength: mediaMessage?.fileLength,
                    height: mediaMessage?.fileLength,
                    width: mediaMessage?.width,
                },
                mimetype: mediaMessage?.mime_type,
                base64: msg.message.base64,
            };
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.BadRequestException(error instanceof Error ? error.message : String(error));
        }
    }
    async deleteMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async mediaSticker() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async pollMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async statusMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async reloadConnection() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async whatsappNumber() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async markMessageAsRead() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async archiveChat() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async markChatUnread() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async fetchProfile() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async offerCall() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async sendPresence() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async setPresence() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async fetchPrivacySettings() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async updatePrivacySettings() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async fetchBusinessProfile() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async updateProfileName() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async updateProfileStatus() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async updateProfilePicture() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async removeProfilePicture() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async blockUser() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async updateMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async createGroup() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async updateGroupPicture() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async updateGroupSubject() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async updateGroupDescription() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async findGroup() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async fetchAllGroups() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async inviteCode() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async inviteInfo() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async sendInvite() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async acceptInviteCode() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async revokeInviteCode() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async findParticipants() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async updateGParticipant() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async updateGSetting() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async toggleEphemeral() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async leaveGroup() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async fetchLabels() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async handleLabel() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async receiveMobileCode() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async fakeCall() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
}
exports.BusinessStartupService = BusinessStartupService;
