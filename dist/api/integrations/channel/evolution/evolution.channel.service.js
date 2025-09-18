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
exports.EvolutionStartupService = void 0;
const s3Service = __importStar(require("@api/integrations/storage/s3/libs/minio.server"));
const server_module_1 = require("@api/server.module");
const channel_service_1 = require("@api/services/channel.service");
const wa_types_1 = require("@api/types/wa.types");
const _exceptions_1 = require("@exceptions");
const createJid_1 = require("@utils/createJid");
const axios_1 = __importDefault(require("axios"));
const class_validator_1 = require("class-validator");
const form_data_1 = __importDefault(require("form-data"));
const mime_types_1 = __importDefault(require("mime-types"));
const path_1 = require("path");
const uuid_1 = require("uuid");
class EvolutionStartupService extends channel_service_1.ChannelStartupService {
    constructor(configService, eventEmitter, prismaRepository, cache, chatwootCache) {
        super(configService, eventEmitter, prismaRepository, chatwootCache);
        this.configService = configService;
        this.eventEmitter = eventEmitter;
        this.prismaRepository = prismaRepository;
        this.cache = cache;
        this.chatwootCache = chatwootCache;
        this.stateConnection = { state: 'open' };
        this.client = null;
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
    setInstance(instance) {
        this.logger.setInstance(instance.instanceId);
        this.instance.name = instance.instanceName;
        this.instance.id = instance.instanceId;
        this.instance.integration = instance.integration;
        this.instance.number = instance.number;
        this.instance.token = instance.token;
        this.instance.businessId = instance.businessId;
        if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
            this.chatwootService.eventWhatsapp(wa_types_1.Events.STATUS_INSTANCE, {
                instanceName: this.instance.name,
                instanceId: this.instance.id,
                integration: instance.integration,
            }, {
                instance: this.instance.name,
                status: 'created',
            });
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
    async connectToWhatsapp(data) {
        if (!data) {
            this.loadChatwoot();
            return;
        }
        try {
            this.eventHandler(data);
        }
        catch (error) {
            this.logger.error(error);
            throw new _exceptions_1.InternalServerErrorException(error?.toString());
        }
    }
    async eventHandler(received) {
        try {
            let messageRaw;
            if (received.message) {
                const key = {
                    id: received.key.id || (0, uuid_1.v4)(),
                    remoteJid: received.key.remoteJid,
                    fromMe: received.key.fromMe,
                    profilePicUrl: received.profilePicUrl,
                };
                messageRaw = {
                    key,
                    pushName: received.pushName,
                    message: received.message,
                    messageType: received.messageType,
                    messageTimestamp: Math.round(new Date().getTime() / 1000),
                    source: 'unknown',
                    instanceId: this.instanceId,
                };
                const isAudio = received?.message?.audioMessage;
                if (this.configService.get('OPENAI').ENABLED && isAudio) {
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
                        openAiDefaultSettings.speechToText &&
                        received?.message?.audioMessage) {
                        messageRaw.message.speechToText = `[audio] ${await this.openaiService.speechToText(received, this)}`;
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
                if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
                    const chatwootSentMessage = await this.chatwootService.eventWhatsapp(wa_types_1.Events.MESSAGES_UPSERT, { instanceName: this.instance.name, instanceId: this.instanceId }, messageRaw);
                    if (chatwootSentMessage?.id) {
                        messageRaw.chatwootMessageId = chatwootSentMessage.id;
                        messageRaw.chatwootInboxId = chatwootSentMessage.id;
                        messageRaw.chatwootConversationId = chatwootSentMessage.id;
                    }
                }
                await this.prismaRepository.message.create({
                    data: messageRaw,
                });
                await this.updateContact({
                    remoteJid: messageRaw.key.remoteJid,
                    pushName: messageRaw.pushName,
                    profilePicUrl: received.profilePicUrl,
                });
            }
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async updateContact(data) {
        const contactRaw = {
            remoteJid: data.remoteJid,
            pushName: data?.pushName,
            instanceId: this.instanceId,
            profilePicUrl: data?.profilePicUrl,
        };
        const existingContact = await this.prismaRepository.contact.findFirst({
            where: {
                remoteJid: data.remoteJid,
                instanceId: this.instanceId,
            },
        });
        if (existingContact) {
            await this.prismaRepository.contact.updateMany({
                where: {
                    remoteJid: data.remoteJid,
                    instanceId: this.instanceId,
                },
                data: contactRaw,
            });
        }
        else {
            await this.prismaRepository.contact.create({
                data: contactRaw,
            });
        }
        this.sendDataWebhook(wa_types_1.Events.CONTACTS_UPSERT, contactRaw);
        if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
            await this.chatwootService.eventWhatsapp(wa_types_1.Events.CONTACTS_UPDATE, {
                instanceName: this.instance.name,
                instanceId: this.instanceId,
                integration: this.instance.integration,
            }, contactRaw);
        }
        const chat = await this.prismaRepository.chat.findFirst({
            where: { instanceId: this.instanceId, remoteJid: data.remoteJid },
        });
        if (chat) {
            const chatRaw = {
                remoteJid: data.remoteJid,
                instanceId: this.instanceId,
            };
            this.sendDataWebhook(wa_types_1.Events.CHATS_UPDATE, chatRaw);
            await this.prismaRepository.chat.updateMany({
                where: { remoteJid: chat.remoteJid },
                data: chatRaw,
            });
        }
        const chatRaw = {
            remoteJid: data.remoteJid,
            instanceId: this.instanceId,
        };
        this.sendDataWebhook(wa_types_1.Events.CHATS_UPSERT, chatRaw);
        await this.prismaRepository.chat.create({
            data: chatRaw,
        });
    }
    async sendMessageWithTyping(number, message, options, file, isIntegration = false) {
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
            if (options.delay) {
                await new Promise((resolve) => setTimeout(resolve, options.delay));
            }
            if (options?.webhookUrl) {
                webhookUrl = options.webhookUrl;
            }
            let audioFile;
            const messageId = (0, uuid_1.v4)();
            let messageRaw;
            if (message?.mediaType === 'image') {
                messageRaw = {
                    key: { fromMe: true, id: messageId, remoteJid: number },
                    message: {
                        base64: (0, class_validator_1.isBase64)(message.media) ? message.media : undefined,
                        mediaUrl: (0, class_validator_1.isURL)(message.media) ? message.media : undefined,
                        quoted,
                    },
                    messageType: 'imageMessage',
                    messageTimestamp: Math.round(new Date().getTime() / 1000),
                    webhookUrl,
                    source: 'unknown',
                    instanceId: this.instanceId,
                };
            }
            else if (message?.mediaType === 'video') {
                messageRaw = {
                    key: { fromMe: true, id: messageId, remoteJid: number },
                    message: {
                        base64: (0, class_validator_1.isBase64)(message.media) ? message.media : undefined,
                        mediaUrl: (0, class_validator_1.isURL)(message.media) ? message.media : undefined,
                        quoted,
                    },
                    messageType: 'videoMessage',
                    messageTimestamp: Math.round(new Date().getTime() / 1000),
                    webhookUrl,
                    source: 'unknown',
                    instanceId: this.instanceId,
                };
            }
            else if (message?.mediaType === 'audio') {
                messageRaw = {
                    key: { fromMe: true, id: messageId, remoteJid: number },
                    message: {
                        base64: (0, class_validator_1.isBase64)(message.media) ? message.media : undefined,
                        mediaUrl: (0, class_validator_1.isURL)(message.media) ? message.media : undefined,
                        quoted,
                    },
                    messageType: 'audioMessage',
                    messageTimestamp: Math.round(new Date().getTime() / 1000),
                    webhookUrl,
                    source: 'unknown',
                    instanceId: this.instanceId,
                };
                const buffer = Buffer.from(message.media, 'base64');
                audioFile = {
                    buffer,
                    mimetype: 'audio/mp4',
                    originalname: `${messageId}.mp4`,
                };
            }
            else if (message?.mediaType === 'document') {
                messageRaw = {
                    key: { fromMe: true, id: messageId, remoteJid: number },
                    message: {
                        base64: (0, class_validator_1.isBase64)(message.media) ? message.media : undefined,
                        mediaUrl: (0, class_validator_1.isURL)(message.media) ? message.media : undefined,
                        quoted,
                    },
                    messageType: 'documentMessage',
                    messageTimestamp: Math.round(new Date().getTime() / 1000),
                    webhookUrl,
                    source: 'unknown',
                    instanceId: this.instanceId,
                };
            }
            else if (message.buttonMessage) {
                messageRaw = {
                    key: { fromMe: true, id: messageId, remoteJid: number },
                    message: {
                        ...message.buttonMessage,
                        buttons: message.buttonMessage.buttons,
                        footer: message.buttonMessage.footer,
                        body: message.buttonMessage.body,
                        quoted,
                    },
                    messageType: 'buttonMessage',
                    messageTimestamp: Math.round(new Date().getTime() / 1000),
                    webhookUrl,
                    source: 'unknown',
                    instanceId: this.instanceId,
                };
            }
            else if (message.listMessage) {
                messageRaw = {
                    key: { fromMe: true, id: messageId, remoteJid: number },
                    message: {
                        ...message.listMessage,
                        quoted,
                    },
                    messageType: 'listMessage',
                    messageTimestamp: Math.round(new Date().getTime() / 1000),
                    webhookUrl,
                    source: 'unknown',
                    instanceId: this.instanceId,
                };
            }
            else {
                messageRaw = {
                    key: { fromMe: true, id: messageId, remoteJid: number },
                    message: {
                        ...message,
                        quoted,
                    },
                    messageType: 'conversation',
                    messageTimestamp: Math.round(new Date().getTime() / 1000),
                    webhookUrl,
                    source: 'unknown',
                    instanceId: this.instanceId,
                };
            }
            if (messageRaw.message.contextInfo) {
                messageRaw.contextInfo = {
                    ...messageRaw.message.contextInfo,
                };
            }
            if (messageRaw.contextInfo?.stanzaId) {
                const key = {
                    id: messageRaw.contextInfo.stanzaId,
                };
                const findMessage = await this.prismaRepository.message.findFirst({
                    where: {
                        instanceId: this.instanceId,
                        key,
                    },
                });
                if (findMessage) {
                    messageRaw.contextInfo.quotedMessage = findMessage.message;
                }
            }
            const base64 = messageRaw.message.base64;
            delete messageRaw.message.base64;
            if (base64 || file || audioFile) {
                if (this.configService.get('S3').ENABLE) {
                    try {
                        const hasRealMedia = this.hasValidMediaContent(messageRaw);
                        if (!hasRealMedia) {
                            this.logger.warn('Message detected as media but contains no valid media content');
                        }
                        else {
                            const fileBuffer = audioFile?.buffer || file?.buffer;
                            const buffer = base64 ? Buffer.from(base64, 'base64') : fileBuffer;
                            let mediaType;
                            let mimetype = audioFile?.mimetype || file.mimetype;
                            if (messageRaw.messageType === 'documentMessage') {
                                mediaType = 'document';
                                mimetype = !mimetype ? 'application/pdf' : mimetype;
                            }
                            else if (messageRaw.messageType === 'imageMessage') {
                                mediaType = 'image';
                                mimetype = !mimetype ? 'image/png' : mimetype;
                            }
                            else if (messageRaw.messageType === 'audioMessage') {
                                mediaType = 'audio';
                                mimetype = !mimetype ? 'audio/mp4' : mimetype;
                            }
                            else if (messageRaw.messageType === 'videoMessage') {
                                mediaType = 'video';
                                mimetype = !mimetype ? 'video/mp4' : mimetype;
                            }
                            const fileName = `${messageRaw.key.id}.${mimetype.split('/')[1]}`;
                            const size = buffer.byteLength;
                            const fullName = (0, path_1.join)(`${this.instance.id}`, messageRaw.key.remoteJid, mediaType, fileName);
                            await s3Service.uploadFile(fullName, buffer, size, {
                                'Content-Type': mimetype,
                            });
                            const mediaUrl = await s3Service.getObjectUrl(fullName);
                            messageRaw.message.mediaUrl = mediaUrl;
                        }
                    }
                    catch (error) {
                        this.logger.error(['Error on upload file to minio', error?.message, error?.stack]);
                    }
                }
            }
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
        }, null, isIntegration);
        return res;
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
            }
            else {
                mimetype = mime_types_1.default.lookup(mediaMessage.fileName);
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
        }, file, isIntegration);
        return mediaSent;
    }
    async processAudio(audio, number, file) {
        number = number.replace(/\D/g, '');
        const hash = `${number}-${new Date().getTime()}`;
        if (process.env.API_AUDIO_CONVERTER) {
            try {
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
                formData.append('format', 'mp4');
                const response = await axios_1.default.post(process.env.API_AUDIO_CONVERTER, formData, {
                    headers: {
                        ...formData.getHeaders(),
                        apikey: process.env.API_AUDIO_CONVERTER_KEY,
                    },
                });
                if (!response?.data?.audio) {
                    throw new _exceptions_1.InternalServerErrorException('Failed to convert audio');
                }
                const prepareMedia = {
                    fileName: `${hash}.mp4`,
                    mediaType: 'audio',
                    media: response?.data?.audio,
                    mimetype: 'audio/mpeg',
                };
                return prepareMedia;
            }
            catch (error) {
                this.logger.error(error?.response?.data || error);
                throw new _exceptions_1.InternalServerErrorException(error?.response?.data?.message || error?.toString() || error);
            }
        }
        else {
            let mimetype;
            const prepareMedia = {
                fileName: `${hash}.mp3`,
                mediaType: 'audio',
                media: audio,
                mimetype: 'audio/mpeg',
            };
            if ((0, class_validator_1.isURL)(audio)) {
                mimetype = mime_types_1.default.lookup(audio).toString();
            }
            else {
                mimetype = mime_types_1.default.lookup(prepareMedia.fileName).toString();
            }
            prepareMedia.mimetype = mimetype;
            return prepareMedia;
        }
    }
    async audioWhatsapp(data, file, isIntegration = false) {
        const mediaData = { ...data };
        if (file?.buffer) {
            mediaData.audio = file.buffer.toString('base64');
        }
        else {
            console.error('El archivo o buffer no est� definido correctamente.');
            throw new Error('File or buffer is undefined.');
        }
        const message = await this.processAudio(mediaData.audio, data.number, file);
        const audioSent = await this.sendMessageWithTyping(data.number, { ...message }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            linkPreview: data?.linkPreview,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        }, file, isIntegration);
        return audioSent;
    }
    async buttonMessage(data, isIntegration = false) {
        return await this.sendMessageWithTyping(data.number, {
            buttonMessage: {
                title: data.title,
                description: data.description,
                footer: data.footer,
                buttons: data.buttons,
            },
        }, {
            delay: data?.delay,
            presence: 'composing',
            quoted: data?.quoted,
            mentionsEveryOne: data?.mentionsEveryOne,
            mentioned: data?.mentioned,
        }, null, isIntegration);
    }
    async locationMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async listMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async templateMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async contactMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async reactionMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async getBase64FromMediaMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async deleteMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async mediaSticker() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async pollMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async statusMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async reloadConnection() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async whatsappNumber() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async markMessageAsRead() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async archiveChat() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async markChatUnread() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async fetchProfile() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async offerCall() {
        throw new _exceptions_1.BadRequestException('Method not available on WhatsApp Business API');
    }
    async sendPresence() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async setPresence() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async fetchPrivacySettings() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async updatePrivacySettings() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async fetchBusinessProfile() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async updateProfileName() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async updateProfileStatus() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async updateProfilePicture() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async removeProfilePicture() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async blockUser() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async updateMessage() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async createGroup() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async updateGroupPicture() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async updateGroupSubject() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async updateGroupDescription() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async findGroup() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async fetchAllGroups() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async inviteCode() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async inviteInfo() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async sendInvite() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async acceptInviteCode() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async revokeInviteCode() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async findParticipants() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async updateGParticipant() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async updateGSetting() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async toggleEphemeral() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async leaveGroup() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async fetchLabels() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async handleLabel() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async receiveMobileCode() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
    async fakeCall() {
        throw new _exceptions_1.BadRequestException('Method not available on Evolution Channel');
    }
}
exports.EvolutionStartupService = EvolutionStartupService;
