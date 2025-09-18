"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypebotService = void 0;
const getConversationMessage_1 = require("@utils/getConversationMessage");
const sendTelemetry_1 = require("@utils/sendTelemetry");
const axios_1 = __importDefault(require("axios"));
const base_chatbot_service_1 = require("../../base-chatbot.service");
class TypebotService extends base_chatbot_service_1.BaseChatbotService {
    constructor(waMonitor, configService, prismaRepository, openaiService) {
        super(waMonitor, prismaRepository, 'TypebotService', configService);
        this.openaiService = openaiService;
    }
    getBotType() {
        return 'typebot';
    }
    async sendMessageToBot(instance, session, settings, bot, remoteJid, pushName, content, msg) {
        await this.processTypebot(instance, remoteJid, msg, session, bot, bot.url, settings.expire, bot.typebot, settings.keywordFinish, settings.delayMessage, settings.unknownMessage, settings.listeningFromMe, settings.stopBotFromMe, settings.keepOpen, content);
    }
    async processTypebotSimple(instance, remoteJid, bot, session, settings, content, pushName, msg) {
        return this.process(instance, remoteJid, bot, session, settings, content, pushName, msg);
    }
    async createNewSession(instance, data) {
        if (data.remoteJid === 'status@broadcast')
            return;
        const id = Math.floor(Math.random() * 10000000000).toString();
        try {
            const version = this.configService.get('TYPEBOT').API_VERSION;
            let url;
            let reqData;
            if (version === 'latest') {
                url = `${data.url}/api/v1/typebots/${data.typebot}/startChat`;
                reqData = {
                    prefilledVariables: {
                        ...data.prefilledVariables,
                        remoteJid: data.remoteJid,
                        pushName: data.pushName || data.prefilledVariables?.pushName || '',
                        instanceName: instance.name,
                        serverUrl: this.configService.get('SERVER').URL,
                        apiKey: this.configService.get('AUTHENTICATION').API_KEY.KEY,
                        ownerJid: instance.number,
                    },
                };
            }
            else {
                url = `${data.url}/api/v1/sendMessage`;
                reqData = {
                    startParams: {
                        publicId: data.typebot,
                        prefilledVariables: {
                            ...data.prefilledVariables,
                            remoteJid: data.remoteJid,
                            pushName: data.pushName || data.prefilledVariables?.pushName || '',
                            instanceName: instance.name,
                            serverUrl: this.configService.get('SERVER').URL,
                            apiKey: this.configService.get('AUTHENTICATION').API_KEY.KEY,
                            ownerJid: instance.number,
                        },
                    },
                };
            }
            const request = await axios_1.default.post(url, reqData);
            let session = null;
            if (request?.data?.sessionId) {
                session = await this.prismaRepository.integrationSession.create({
                    data: {
                        remoteJid: data.remoteJid,
                        pushName: data.pushName || '',
                        sessionId: `${id}-${request.data.sessionId}`,
                        status: 'opened',
                        parameters: {
                            ...data.prefilledVariables,
                            remoteJid: data.remoteJid,
                            pushName: data.pushName || '',
                            instanceName: instance.name,
                            serverUrl: this.configService.get('SERVER').URL,
                            apiKey: this.configService.get('AUTHENTICATION').API_KEY.KEY,
                            ownerJid: instance.number,
                        },
                        awaitUser: false,
                        botId: data.botId,
                        type: 'typebot',
                        Instance: {
                            connect: {
                                id: instance.id,
                            },
                        },
                    },
                });
            }
            return { ...request.data, session };
        }
        catch (error) {
            this.logger.error(error);
            return;
        }
    }
    async sendWAMessage(instanceDb, session, settings, remoteJid, messages, input, clientSideActions) {
        const waInstance = this.waMonitor.waInstances[instanceDb.name];
        await this.processMessages(waInstance, session, settings, messages, input, clientSideActions, this.applyFormatting.bind(this), this.prismaRepository).catch((err) => {
            console.error('Erro ao processar mensagens:', err);
        });
    }
    applyFormatting(element) {
        let text = '';
        if (element.text) {
            text += element.text;
        }
        if (element.children && element.type !== 'a') {
            for (const child of element.children) {
                text += this.applyFormatting(child);
            }
        }
        if (element.type === 'p' && element.type !== 'inline-variable') {
            text = text.trim() + '\n';
        }
        if (element.type === 'inline-variable') {
            text = text.trim();
        }
        if (element.type === 'ol') {
            text =
                '\n' +
                    text
                        .split('\n')
                        .map((line, index) => (line ? `${index + 1}. ${line}` : ''))
                        .join('\n');
        }
        if (element.type === 'li') {
            text = text
                .split('\n')
                .map((line) => (line ? `  ${line}` : ''))
                .join('\n');
        }
        let formats = '';
        if (element.bold) {
            formats += '*';
        }
        if (element.italic) {
            formats += '_';
        }
        if (element.underline) {
            formats += '~';
        }
        let formattedText = `${formats}${text}${formats.split('').reverse().join('')}`;
        if (element.url) {
            formattedText = element.children[0]?.text ? `[${formattedText}]\n(${element.url})` : `${element.url}`;
        }
        return formattedText;
    }
    async processMessages(instance, session, settings, messages, input, clientSideActions, applyFormatting, prismaRepository) {
        const findItemAndGetSecondsToWait = (array, targetId) => {
            if (!array)
                return null;
            for (const item of array) {
                if (item.lastBubbleBlockId === targetId) {
                    return item.wait?.secondsToWaitFor;
                }
            }
            return null;
        };
        for (const message of messages) {
            if (message.type === 'text') {
                let formattedText = '';
                for (const richText of message.content.richText) {
                    for (const element of richText.children) {
                        formattedText += applyFormatting(element);
                    }
                    formattedText += '\n';
                }
                formattedText = formattedText.replace(/\*\*/g, '').replace(/__/, '').replace(/~~/, '').replace(/\n$/, '');
                formattedText = formattedText.replace(/\n$/, '');
                if (formattedText.includes('[list]')) {
                    await this.processListMessage(instance, formattedText, session.remoteJid);
                }
                else if (formattedText.includes('[buttons]')) {
                    await this.processButtonMessage(instance, formattedText, session.remoteJid);
                }
                else {
                    await this.sendMessageWhatsApp(instance, session.remoteJid, formattedText, settings);
                }
                (0, sendTelemetry_1.sendTelemetry)('/message/sendText');
            }
            if (message.type === 'image') {
                await instance.mediaMessage({
                    number: session.remoteJid.split('@')[0],
                    delay: settings?.delayMessage || 1000,
                    mediatype: 'image',
                    media: message.content.url,
                }, null, false);
                (0, sendTelemetry_1.sendTelemetry)('/message/sendMedia');
            }
            if (message.type === 'video') {
                await instance.mediaMessage({
                    number: session.remoteJid.split('@')[0],
                    delay: settings?.delayMessage || 1000,
                    mediatype: 'video',
                    media: message.content.url,
                }, null, false);
                (0, sendTelemetry_1.sendTelemetry)('/message/sendMedia');
            }
            if (message.type === 'audio') {
                await instance.audioWhatsapp({
                    number: session.remoteJid.split('@')[0],
                    delay: settings?.delayMessage || 1000,
                    encoding: true,
                    audio: message.content.url,
                }, false);
                (0, sendTelemetry_1.sendTelemetry)('/message/sendWhatsAppAudio');
            }
            const wait = findItemAndGetSecondsToWait(clientSideActions, message.id);
            if (wait) {
                await new Promise((resolve) => setTimeout(resolve, wait * 1000));
            }
        }
        if (input) {
            if (input.type === 'choice input') {
                let formattedText = '';
                const items = input.items;
                for (const item of items) {
                    formattedText += `▶️ ${item.content}\n`;
                }
                formattedText = formattedText.replace(/\n$/, '');
                if (formattedText.includes('[list]')) {
                    await this.processListMessage(instance, formattedText, session.remoteJid);
                }
                else if (formattedText.includes('[buttons]')) {
                    await this.processButtonMessage(instance, formattedText, session.remoteJid);
                }
                else {
                    await this.sendMessageWhatsApp(instance, session.remoteJid, formattedText, settings);
                }
                (0, sendTelemetry_1.sendTelemetry)('/message/sendText');
            }
            await prismaRepository.integrationSession.update({
                where: {
                    id: session.id,
                },
                data: {
                    awaitUser: true,
                },
            });
        }
        else {
            if (!settings?.keepOpen) {
                await prismaRepository.integrationSession.deleteMany({
                    where: {
                        id: session.id,
                    },
                });
            }
            else {
                await prismaRepository.integrationSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        status: 'closed',
                    },
                });
            }
        }
    }
    async processListMessage(instance, formattedText, remoteJid) {
        const listJson = {
            number: remoteJid.split('@')[0],
            title: '',
            description: '',
            buttonText: '',
            footerText: '',
            sections: [],
        };
        const titleMatch = formattedText.match(/\[title\]([\s\S]*?)(?=\[description\])/);
        const descriptionMatch = formattedText.match(/\[description\]([\s\S]*?)(?=\[buttonText\])/);
        const buttonTextMatch = formattedText.match(/\[buttonText\]([\s\S]*?)(?=\[footerText\])/);
        const footerTextMatch = formattedText.match(/\[footerText\]([\s\S]*?)(?=\[menu\])/);
        if (titleMatch)
            listJson.title = titleMatch[1].trim();
        if (descriptionMatch)
            listJson.description = descriptionMatch[1].trim();
        if (buttonTextMatch)
            listJson.buttonText = buttonTextMatch[1].trim();
        if (footerTextMatch)
            listJson.footerText = footerTextMatch[1].trim();
        const menuContent = formattedText.match(/\[menu\]([\s\S]*?)\[\/menu\]/)?.[1];
        if (menuContent) {
            const sections = menuContent.match(/\[section\]([\s\S]*?)(?=\[section\]|\[\/section\]|\[\/menu\])/g);
            if (sections) {
                sections.forEach((section) => {
                    const sectionTitle = section.match(/title: (.*?)(?:\n|$)/)?.[1]?.trim();
                    const rows = section.match(/\[row\]([\s\S]*?)(?=\[row\]|\[\/row\]|\[\/section\]|\[\/menu\])/g);
                    const sectionData = {
                        title: sectionTitle,
                        rows: rows?.map((row) => ({
                            title: row.match(/title: (.*?)(?:\n|$)/)?.[1]?.trim(),
                            description: row.match(/description: (.*?)(?:\n|$)/)?.[1]?.trim(),
                            rowId: row.match(/rowId: (.*?)(?:\n|$)/)?.[1]?.trim(),
                        })) || [],
                    };
                    listJson.sections.push(sectionData);
                });
            }
        }
        await instance.listMessage(listJson);
    }
    async processButtonMessage(instance, formattedText, remoteJid) {
        const buttonJson = {
            number: remoteJid.split('@')[0],
            thumbnailUrl: undefined,
            title: '',
            description: '',
            footer: '',
            buttons: [],
        };
        const thumbnailUrlMatch = formattedText.match(/\[thumbnailUrl\]([\s\S]*?)(?=\[title\])/);
        const titleMatch = formattedText.match(/\[title\]([\s\S]*?)(?=\[description\])/);
        const descriptionMatch = formattedText.match(/\[description\]([\s\S]*?)(?=\[footer\])/);
        const footerMatch = formattedText.match(/\[footer\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url))/);
        if (titleMatch)
            buttonJson.title = titleMatch[1].trim();
        if (thumbnailUrlMatch)
            buttonJson.thumbnailUrl = thumbnailUrlMatch[1].trim();
        if (descriptionMatch)
            buttonJson.description = descriptionMatch[1].trim();
        if (footerMatch)
            buttonJson.footer = footerMatch[1].trim();
        const buttonTypes = {
            reply: /\[reply\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url)|$)/g,
            pix: /\[pix\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url)|$)/g,
            copy: /\[copy\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url)|$)/g,
            call: /\[call\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url)|$)/g,
            url: /\[url\]([\s\S]*?)(?=\[(?:reply|pix|copy|call|url)|$)/g,
        };
        for (const [type, pattern] of Object.entries(buttonTypes)) {
            let match;
            while ((match = pattern.exec(formattedText)) !== null) {
                const content = match[1].trim();
                const button = { type };
                switch (type) {
                    case 'pix':
                        button.currency = content.match(/currency: (.*?)(?:\n|$)/)?.[1]?.trim();
                        button.name = content.match(/name: (.*?)(?:\n|$)/)?.[1]?.trim();
                        button.keyType = content.match(/keyType: (.*?)(?:\n|$)/)?.[1]?.trim();
                        button.key = content.match(/key: (.*?)(?:\n|$)/)?.[1]?.trim();
                        break;
                    case 'reply':
                        button.displayText = content.match(/displayText: (.*?)(?:\n|$)/)?.[1]?.trim();
                        button.id = content.match(/id: (.*?)(?:\n|$)/)?.[1]?.trim();
                        break;
                    case 'copy':
                        button.displayText = content.match(/displayText: (.*?)(?:\n|$)/)?.[1]?.trim();
                        button.copyCode = content.match(/copyCode: (.*?)(?:\n|$)/)?.[1]?.trim();
                        break;
                    case 'call':
                        button.displayText = content.match(/displayText: (.*?)(?:\n|$)/)?.[1]?.trim();
                        button.phoneNumber = content.match(/phone: (.*?)(?:\n|$)/)?.[1]?.trim();
                        break;
                    case 'url':
                        button.displayText = content.match(/displayText: (.*?)(?:\n|$)/)?.[1]?.trim();
                        button.url = content.match(/url: (.*?)(?:\n|$)/)?.[1]?.trim();
                        break;
                }
                if (Object.keys(button).length > 1) {
                    buttonJson.buttons.push(button);
                }
            }
        }
        await instance.buttonMessage(buttonJson);
    }
    async processTypebot(waInstance, remoteJid, msg, session, findTypebot, url, expire, typebot, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, content, prefilledVariables) {
        const instance = await this.prismaRepository.instance.findFirst({
            where: {
                name: waInstance.instanceName,
            },
        });
        if (!instance) {
            this.logger.error('Instance not found in database');
            return;
        }
        if (session && expire && expire > 0) {
            const now = Date.now();
            const sessionUpdatedAt = new Date(session.updatedAt).getTime();
            const diff = now - sessionUpdatedAt;
            const diffInMinutes = Math.floor(diff / 1000 / 60);
            if (diffInMinutes > expire) {
                if (keepOpen) {
                    await this.prismaRepository.integrationSession.update({
                        where: {
                            id: session.id,
                        },
                        data: {
                            status: 'closed',
                        },
                    });
                }
                else {
                    await this.prismaRepository.integrationSession.deleteMany({
                        where: {
                            botId: findTypebot.id,
                            remoteJid: remoteJid,
                        },
                    });
                }
                const data = await this.createNewSession(instance, {
                    enabled: findTypebot?.enabled,
                    url: url,
                    typebot: typebot,
                    expire: expire,
                    keywordFinish: keywordFinish,
                    delayMessage: delayMessage,
                    unknownMessage: unknownMessage,
                    listeningFromMe: listeningFromMe,
                    remoteJid: remoteJid,
                    pushName: msg.pushName,
                    botId: findTypebot.id,
                    prefilledVariables: prefilledVariables,
                });
                if (data?.session) {
                    session = data.session;
                }
                if (!data?.messages || data.messages.length === 0) {
                    const content = (0, getConversationMessage_1.getConversationMessage)(msg.message);
                    if (!content) {
                        if (unknownMessage) {
                            await this.sendMessageWhatsApp(waInstance, remoteJid, unknownMessage, {
                                delayMessage,
                                expire,
                                keywordFinish,
                                listeningFromMe,
                                stopBotFromMe,
                                keepOpen,
                                unknownMessage,
                            });
                            (0, sendTelemetry_1.sendTelemetry)('/message/sendText');
                        }
                        return;
                    }
                    if (keywordFinish && content.toLowerCase() === keywordFinish.toLowerCase()) {
                        if (keepOpen) {
                            await this.prismaRepository.integrationSession.update({
                                where: {
                                    id: session.id,
                                },
                                data: {
                                    status: 'closed',
                                },
                            });
                        }
                        else {
                            await this.prismaRepository.integrationSession.deleteMany({
                                where: {
                                    botId: findTypebot.id,
                                    remoteJid: remoteJid,
                                },
                            });
                        }
                        return;
                    }
                    try {
                        const version = this.configService.get('TYPEBOT').API_VERSION;
                        let urlTypebot;
                        let reqData;
                        if (version === 'latest') {
                            urlTypebot = `${url}/api/v1/sessions/${data?.sessionId}/continueChat`;
                            reqData = {
                                message: content,
                            };
                        }
                        else {
                            urlTypebot = `${url}/api/v1/sendMessage`;
                            reqData = {
                                message: content,
                                sessionId: data?.sessionId,
                            };
                        }
                        const request = await axios_1.default.post(urlTypebot, reqData);
                        await this.sendWAMessage(instance, session, {
                            expire: expire,
                            keywordFinish: keywordFinish,
                            delayMessage: delayMessage,
                            unknownMessage: unknownMessage,
                            listeningFromMe: listeningFromMe,
                            stopBotFromMe: stopBotFromMe,
                            keepOpen: keepOpen,
                        }, remoteJid, request?.data?.messages, request?.data?.input, request?.data?.clientSideActions);
                    }
                    catch (error) {
                        this.logger.error(error);
                        return;
                    }
                }
                if (data?.messages && data.messages.length > 0) {
                    await this.sendWAMessage(instance, session, {
                        expire: expire,
                        keywordFinish: keywordFinish,
                        delayMessage: delayMessage,
                        unknownMessage: unknownMessage,
                        listeningFromMe: listeningFromMe,
                        stopBotFromMe: stopBotFromMe,
                        keepOpen: keepOpen,
                    }, remoteJid, data.messages, data.input, data.clientSideActions);
                }
                return;
            }
        }
        if (session && session.status !== 'opened') {
            return;
        }
        if (!session) {
            const data = await this.createNewSession(instance, {
                enabled: findTypebot?.enabled,
                url: url,
                typebot: typebot,
                expire: expire,
                keywordFinish: keywordFinish,
                delayMessage: delayMessage,
                unknownMessage: unknownMessage,
                listeningFromMe: listeningFromMe,
                remoteJid: remoteJid,
                pushName: msg?.pushName,
                botId: findTypebot.id,
                prefilledVariables: prefilledVariables,
            });
            if (data?.session) {
                session = data.session;
            }
            if (data?.messages && data.messages.length > 0) {
                await this.sendWAMessage(instance, session, {
                    expire: expire,
                    keywordFinish: keywordFinish,
                    delayMessage: delayMessage,
                    unknownMessage: unknownMessage,
                    listeningFromMe: listeningFromMe,
                    stopBotFromMe: stopBotFromMe,
                    keepOpen: keepOpen,
                }, remoteJid, data.messages, data.input, data.clientSideActions);
            }
            if (!data?.messages || data.messages.length === 0) {
                if (!content) {
                    if (unknownMessage) {
                        await this.sendMessageWhatsApp(waInstance, remoteJid, unknownMessage, {
                            delayMessage,
                            expire,
                            keywordFinish,
                            listeningFromMe,
                            stopBotFromMe,
                            keepOpen,
                            unknownMessage,
                        });
                        (0, sendTelemetry_1.sendTelemetry)('/message/sendText');
                    }
                    return;
                }
                if (keywordFinish && content.toLowerCase() === keywordFinish.toLowerCase()) {
                    if (keepOpen) {
                        await this.prismaRepository.integrationSession.update({
                            where: {
                                id: session.id,
                            },
                            data: {
                                status: 'closed',
                            },
                        });
                    }
                    else {
                        await this.prismaRepository.integrationSession.deleteMany({
                            where: {
                                botId: findTypebot.id,
                                remoteJid: remoteJid,
                            },
                        });
                    }
                    return;
                }
                let request;
                try {
                    const version = this.configService.get('TYPEBOT').API_VERSION;
                    let urlTypebot;
                    let reqData;
                    if (version === 'latest') {
                        urlTypebot = `${url}/api/v1/sessions/${data?.sessionId}/continueChat`;
                        reqData = {
                            message: content,
                        };
                    }
                    else {
                        urlTypebot = `${url}/api/v1/sendMessage`;
                        reqData = {
                            message: content,
                            sessionId: data?.sessionId,
                        };
                    }
                    request = await axios_1.default.post(urlTypebot, reqData);
                    await this.sendWAMessage(instance, session, {
                        expire: expire,
                        keywordFinish: keywordFinish,
                        delayMessage: delayMessage,
                        unknownMessage: unknownMessage,
                        listeningFromMe: listeningFromMe,
                        stopBotFromMe: stopBotFromMe,
                        keepOpen: keepOpen,
                    }, remoteJid, request?.data?.messages, request?.data?.input, request?.data?.clientSideActions);
                }
                catch (error) {
                    this.logger.error(error);
                    return;
                }
            }
            return;
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
        if (!content) {
            if (unknownMessage) {
                await this.sendMessageWhatsApp(waInstance, remoteJid, unknownMessage, {
                    delayMessage,
                    expire,
                    keywordFinish,
                    listeningFromMe,
                    stopBotFromMe,
                    keepOpen,
                    unknownMessage,
                });
                (0, sendTelemetry_1.sendTelemetry)('/message/sendText');
            }
            return;
        }
        if (keywordFinish && content.toLowerCase() === keywordFinish.toLowerCase()) {
            if (keepOpen) {
                await this.prismaRepository.integrationSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        status: 'closed',
                    },
                });
            }
            else {
                await this.prismaRepository.integrationSession.deleteMany({
                    where: {
                        botId: findTypebot.id,
                        remoteJid: remoteJid,
                    },
                });
            }
            return;
        }
        const version = this.configService.get('TYPEBOT').API_VERSION;
        let urlTypebot;
        let reqData;
        if (version === 'latest') {
            urlTypebot = `${url}/api/v1/sessions/${session.sessionId.split('-')[1]}/continueChat`;
            reqData = {
                message: content,
            };
        }
        else {
            urlTypebot = `${url}/api/v1/sendMessage`;
            reqData = {
                message: content,
                sessionId: session.sessionId.split('-')[1],
            };
        }
        if (this.isAudioMessage(content) && msg) {
            try {
                this.logger.debug(`[TypeBot] Downloading audio for Whisper transcription`);
                const transcription = await this.openaiService.speechToText(msg, instance);
                if (transcription) {
                    reqData.message = `[audio] ${transcription}`;
                }
            }
            catch (err) {
                this.logger.error(`[TypeBot] Failed to transcribe audio: ${err}`);
            }
        }
        const request = await axios_1.default.post(urlTypebot, reqData);
        await this.sendWAMessage(instance, session, {
            expire: expire,
            keywordFinish: keywordFinish,
            delayMessage: delayMessage,
            unknownMessage: unknownMessage,
            listeningFromMe: listeningFromMe,
            stopBotFromMe: stopBotFromMe,
            keepOpen: keepOpen,
        }, remoteJid, request?.data?.messages, request?.data?.input, request?.data?.clientSideActions);
        return;
    }
}
exports.TypebotService = TypebotService;
