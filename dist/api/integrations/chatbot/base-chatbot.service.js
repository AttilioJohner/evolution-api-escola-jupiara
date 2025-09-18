"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseChatbotService = void 0;
const wa_types_1 = require("@api/types/wa.types");
const logger_config_1 = require("@config/logger.config");
class BaseChatbotService {
    constructor(waMonitor, prismaRepository, loggerName, configService) {
        this.waMonitor = waMonitor;
        this.prismaRepository = prismaRepository;
        this.logger = new logger_config_1.Logger(loggerName);
        this.configService = configService;
    }
    isImageMessage(content) {
        return content.includes('imageMessage');
    }
    isAudioMessage(content) {
        return content.includes('audioMessage');
    }
    isJSON(str) {
        try {
            JSON.parse(str);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    getMediaType(url) {
        const extension = url.split('.').pop()?.toLowerCase();
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
        const audioExtensions = ['mp3', 'wav', 'aac', 'ogg'];
        const videoExtensions = ['mp4', 'avi', 'mkv', 'mov'];
        const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
        if (imageExtensions.includes(extension || ''))
            return 'image';
        if (audioExtensions.includes(extension || ''))
            return 'audio';
        if (videoExtensions.includes(extension || ''))
            return 'video';
        if (documentExtensions.includes(extension || ''))
            return 'document';
        return null;
    }
    async createNewSession(instance, data, type) {
        try {
            const pushNameValue = typeof data.pushName === 'object' && data.pushName?.pushName
                ? data.pushName.pushName
                : typeof data.pushName === 'string'
                    ? data.pushName
                    : null;
            const remoteJidValue = typeof data.remoteJid === 'object' && data.remoteJid?.remoteJid ? data.remoteJid.remoteJid : data.remoteJid;
            const session = await this.prismaRepository.integrationSession.create({
                data: {
                    remoteJid: remoteJidValue,
                    pushName: pushNameValue,
                    sessionId: remoteJidValue,
                    status: 'opened',
                    awaitUser: false,
                    botId: data.botId,
                    instanceId: instance.instanceId,
                    type: type,
                },
            });
            return { session };
        }
        catch (error) {
            this.logger.error(error);
            return;
        }
    }
    async process(instance, remoteJid, bot, session, settings, content, pushName, msg) {
        try {
            if (!session) {
                await this.initNewSession(instance, remoteJid, bot, settings, session, content, pushName, msg);
                return;
            }
            if (session.status === 'paused') {
                return;
            }
            const keywordFinish = settings?.keywordFinish || '';
            const normalizedContent = content.toLowerCase().trim();
            if (keywordFinish.length > 0 && normalizedContent === keywordFinish.toLowerCase()) {
                await this.prismaRepository.integrationSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        status: 'closed',
                    },
                });
                return;
            }
            await this.sendMessageToBot(instance, session, settings, bot, remoteJid, pushName || '', content, msg);
            await this.prismaRepository.integrationSession.update({
                where: {
                    id: session.id,
                },
                data: {
                    status: 'opened',
                    awaitUser: true,
                },
            });
        }
        catch (error) {
            this.logger.error(`Error in process: ${error}`);
            return;
        }
    }
    async sendMessageWhatsApp(instance, remoteJid, message, settings) {
        if (!message)
            return;
        const linkRegex = /!?\[(.*?)\]\((.*?)\)/g;
        let textBuffer = '';
        let lastIndex = 0;
        let match;
        const splitMessages = settings?.splitMessages ?? false;
        while ((match = linkRegex.exec(message)) !== null) {
            const [fullMatch, altText, url] = match;
            const mediaType = this.getMediaType(url);
            const beforeText = message.slice(lastIndex, match.index);
            if (beforeText) {
                textBuffer += beforeText;
            }
            if (mediaType) {
                if (textBuffer.trim()) {
                    await this.sendFormattedText(instance, remoteJid, textBuffer.trim(), settings, splitMessages);
                    textBuffer = '';
                }
                try {
                    if (mediaType === 'audio') {
                        await instance.audioWhatsapp({
                            number: remoteJid.split('@')[0],
                            delay: settings?.delayMessage || 1000,
                            audio: url,
                            caption: altText,
                        });
                    }
                    else {
                        await instance.mediaMessage({
                            number: remoteJid.split('@')[0],
                            delay: settings?.delayMessage || 1000,
                            mediatype: mediaType,
                            media: url,
                            caption: altText,
                            fileName: mediaType === 'document' ? altText || 'document' : undefined,
                        }, null, false);
                    }
                }
                catch (error) {
                    this.logger.error(`Error sending media: ${error}`);
                    textBuffer += `${altText}: ${url}`;
                }
            }
            else {
                textBuffer += fullMatch;
            }
            lastIndex = linkRegex.lastIndex;
        }
        if (lastIndex < message.length) {
            const remainingText = message.slice(lastIndex);
            if (remainingText.trim()) {
                textBuffer += remainingText;
            }
        }
        if (textBuffer.trim()) {
            await this.sendFormattedText(instance, remoteJid, textBuffer.trim(), settings, splitMessages);
        }
    }
    async sendFormattedText(instance, remoteJid, text, settings, splitMessages) {
        const timePerChar = settings?.timePerChar ?? 0;
        const minDelay = 1000;
        const maxDelay = 20000;
        if (splitMessages) {
            const multipleMessages = text.split('\n\n');
            for (let index = 0; index < multipleMessages.length; index++) {
                const message = multipleMessages[index];
                if (!message.trim())
                    continue;
                const delay = Math.min(Math.max(message.length * timePerChar, minDelay), maxDelay);
                if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                    await instance.client.presenceSubscribe(remoteJid);
                    await instance.client.sendPresenceUpdate('composing', remoteJid);
                }
                await new Promise((resolve) => {
                    setTimeout(async () => {
                        await instance.textMessage({
                            number: remoteJid.split('@')[0],
                            delay: settings?.delayMessage || 1000,
                            text: message,
                        }, false);
                        resolve();
                    }, delay);
                });
                if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                    await instance.client.sendPresenceUpdate('paused', remoteJid);
                }
            }
        }
        else {
            const delay = Math.min(Math.max(text.length * timePerChar, minDelay), maxDelay);
            if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                await instance.client.presenceSubscribe(remoteJid);
                await instance.client.sendPresenceUpdate('composing', remoteJid);
            }
            await new Promise((resolve) => {
                setTimeout(async () => {
                    await instance.textMessage({
                        number: remoteJid.split('@')[0],
                        delay: settings?.delayMessage || 1000,
                        text: text,
                    }, false);
                    resolve();
                }, delay);
            });
            if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                await instance.client.sendPresenceUpdate('paused', remoteJid);
            }
        }
    }
    async initNewSession(instance, remoteJid, bot, settings, session, content, pushName, msg) {
        if (!session) {
            const pushNameValue = typeof pushName === 'object' && pushName?.pushName
                ? pushName.pushName
                : typeof pushName === 'string'
                    ? pushName
                    : null;
            const sessionResult = await this.createNewSession({
                instanceName: instance.instanceName,
                instanceId: instance.instanceId,
            }, {
                remoteJid,
                pushName: pushNameValue,
                botId: bot.id,
            }, this.getBotType());
            if (!sessionResult || !sessionResult.session) {
                this.logger.error('Failed to create new session');
                return;
            }
            session = sessionResult.session;
        }
        await this.prismaRepository.integrationSession.update({
            where: {
                id: session.id,
            },
            data: {
                status: 'opened',
                awaitUser: false,
            },
        });
        await this.sendMessageToBot(instance, session, settings, bot, remoteJid, pushName || '', content, msg);
    }
}
exports.BaseChatbotService = BaseChatbotService;
