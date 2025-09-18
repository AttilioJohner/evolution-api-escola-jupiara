"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DifyService = void 0;
const wa_types_1 = require("@api/types/wa.types");
const axios_1 = __importDefault(require("axios"));
const base_chatbot_service_1 = require("../../base-chatbot.service");
class DifyService extends base_chatbot_service_1.BaseChatbotService {
    constructor(waMonitor, prismaRepository, configService, openaiService) {
        super(waMonitor, prismaRepository, 'DifyService', configService);
        this.openaiService = openaiService;
    }
    getBotType() {
        return 'dify';
    }
    async sendMessageToBot(instance, session, settings, dify, remoteJid, pushName, content, msg) {
        try {
            let endpoint = dify.apiUrl;
            if (!endpoint) {
                this.logger.error('No Dify endpoint defined');
                return;
            }
            let processedContent = content;
            if (this.isAudioMessage(content) && msg) {
                try {
                    this.logger.debug(`[Dify] Downloading audio for Whisper transcription`);
                    const transcription = await this.openaiService.speechToText(msg, instance);
                    if (transcription) {
                        processedContent = `[audio] ${transcription}`;
                    }
                }
                catch (err) {
                    this.logger.error(`[Dify] Failed to transcribe audio: ${err}`);
                }
            }
            if (dify.botType === 'chatBot') {
                endpoint += '/chat-messages';
                const payload = {
                    inputs: {
                        remoteJid: remoteJid,
                        pushName: pushName,
                        instanceName: instance.instanceName,
                        serverUrl: this.configService.get('SERVER').URL,
                        apiKey: instance.token,
                    },
                    query: processedContent,
                    response_mode: 'blocking',
                    conversation_id: session.sessionId === remoteJid ? undefined : session.sessionId,
                    user: remoteJid,
                };
                if (this.isImageMessage(content)) {
                    const contentSplit = content.split('|');
                    payload.files = [
                        {
                            type: 'image',
                            transfer_method: 'remote_url',
                            url: contentSplit[1].split('?')[0],
                        },
                    ];
                    payload.query = contentSplit[2] || content;
                }
                if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                    await instance.client.presenceSubscribe(remoteJid);
                    await instance.client.sendPresenceUpdate('composing', remoteJid);
                }
                const response = await axios_1.default.post(endpoint, payload, {
                    headers: {
                        Authorization: `Bearer ${dify.apiKey}`,
                    },
                });
                if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS)
                    await instance.client.sendPresenceUpdate('paused', remoteJid);
                const message = response?.data?.answer;
                const conversationId = response?.data?.conversation_id;
                if (message) {
                    await this.sendMessageWhatsApp(instance, remoteJid, message, settings);
                }
                await this.prismaRepository.integrationSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        status: 'opened',
                        awaitUser: true,
                        sessionId: session.sessionId === remoteJid ? conversationId : session.sessionId,
                    },
                });
            }
            if (dify.botType === 'textGenerator') {
                endpoint += '/completion-messages';
                const payload = {
                    inputs: {
                        query: processedContent,
                        pushName: pushName,
                        remoteJid: remoteJid,
                        instanceName: instance.instanceName,
                        serverUrl: this.configService.get('SERVER').URL,
                        apiKey: instance.token,
                    },
                    response_mode: 'blocking',
                    conversation_id: session.sessionId === remoteJid ? undefined : session.sessionId,
                    user: remoteJid,
                };
                if (this.isImageMessage(content)) {
                    const contentSplit = content.split('|');
                    payload.files = [
                        {
                            type: 'image',
                            transfer_method: 'remote_url',
                            url: contentSplit[1].split('?')[0],
                        },
                    ];
                    payload.inputs.query = contentSplit[2] || content;
                }
                if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                    await instance.client.presenceSubscribe(remoteJid);
                    await instance.client.sendPresenceUpdate('composing', remoteJid);
                }
                const response = await axios_1.default.post(endpoint, payload, {
                    headers: {
                        Authorization: `Bearer ${dify.apiKey}`,
                    },
                });
                if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS)
                    await instance.client.sendPresenceUpdate('paused', remoteJid);
                const message = response?.data?.answer;
                const conversationId = response?.data?.conversation_id;
                if (message) {
                    await this.sendMessageWhatsApp(instance, remoteJid, message, settings);
                }
                await this.prismaRepository.integrationSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        status: 'opened',
                        awaitUser: true,
                        sessionId: session.sessionId === remoteJid ? conversationId : session.sessionId,
                    },
                });
            }
            if (dify.botType === 'agent') {
                endpoint += '/chat-messages';
                const payload = {
                    inputs: {
                        remoteJid: remoteJid,
                        pushName: pushName,
                        instanceName: instance.instanceName,
                        serverUrl: this.configService.get('SERVER').URL,
                        apiKey: instance.token,
                    },
                    query: processedContent,
                    response_mode: 'streaming',
                    conversation_id: session.sessionId === remoteJid ? undefined : session.sessionId,
                    user: remoteJid,
                };
                if (this.isImageMessage(content)) {
                    const contentSplit = content.split('|');
                    payload.files = [
                        {
                            type: 'image',
                            transfer_method: 'remote_url',
                            url: contentSplit[1].split('?')[0],
                        },
                    ];
                    payload.query = contentSplit[2] || content;
                }
                if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                    await instance.client.presenceSubscribe(remoteJid);
                    await instance.client.sendPresenceUpdate('composing', remoteJid);
                }
                const response = await axios_1.default.post(endpoint, payload, {
                    headers: {
                        Authorization: `Bearer ${dify.apiKey}`,
                    },
                });
                let conversationId;
                let answer = '';
                const data = response.data.replaceAll('data: ', '');
                const events = data.split('\n').filter((line) => line.trim() !== '');
                for (const eventString of events) {
                    if (eventString.trim().startsWith('{')) {
                        const event = JSON.parse(eventString);
                        if (event?.event === 'agent_message') {
                            console.log('event:', event);
                            conversationId = conversationId ?? event?.conversation_id;
                            answer += event?.answer;
                        }
                    }
                }
                if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS)
                    await instance.client.sendPresenceUpdate('paused', remoteJid);
                if (answer) {
                    await this.sendMessageWhatsApp(instance, remoteJid, answer, settings);
                }
                await this.prismaRepository.integrationSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        status: 'opened',
                        awaitUser: true,
                        sessionId: session.sessionId === remoteJid ? conversationId : session.sessionId,
                    },
                });
            }
        }
        catch (error) {
            this.logger.error(error.response?.data || error);
            return;
        }
    }
}
exports.DifyService = DifyService;
