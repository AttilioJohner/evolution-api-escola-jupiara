"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionBotService = void 0;
const wa_types_1 = require("@api/types/wa.types");
const sendTelemetry_1 = require("@utils/sendTelemetry");
const axios_1 = __importDefault(require("axios"));
const base_chatbot_service_1 = require("../../base-chatbot.service");
class EvolutionBotService extends base_chatbot_service_1.BaseChatbotService {
    constructor(waMonitor, prismaRepository, configService, openaiService) {
        super(waMonitor, prismaRepository, 'EvolutionBotService', configService);
        this.openaiService = openaiService;
    }
    getBotType() {
        return 'evolution';
    }
    async sendMessageToBot(instance, session, settings, bot, remoteJid, pushName, content, msg) {
        try {
            const payload = {
                inputs: {
                    sessionId: session.id,
                    remoteJid: remoteJid,
                    pushName: pushName,
                    fromMe: msg?.key?.fromMe,
                    instanceName: instance.instanceName,
                    serverUrl: this.configService.get('SERVER').URL,
                    apiKey: instance.token,
                },
                query: content,
                conversation_id: session.sessionId === remoteJid ? undefined : session.sessionId,
                user: remoteJid,
            };
            if (this.isAudioMessage(content) && msg) {
                try {
                    this.logger.debug(`[EvolutionBot] Downloading audio for Whisper transcription`);
                    const transcription = await this.openaiService.speechToText(msg, instance);
                    if (transcription) {
                        payload.query = `[audio] ${transcription}`;
                    }
                }
                catch (err) {
                    this.logger.error(`[EvolutionBot] Failed to transcribe audio: ${err}`);
                }
            }
            if (this.isImageMessage(content)) {
                const contentSplit = content.split('|');
                payload.files = [
                    {
                        type: 'image',
                        url: contentSplit[1].split('?')[0],
                    },
                ];
                payload.query = contentSplit[2] || content;
            }
            if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                await instance.client.presenceSubscribe(remoteJid);
                await instance.client.sendPresenceUpdate('composing', remoteJid);
            }
            const endpoint = bot.apiUrl;
            if (!endpoint) {
                this.logger.error('No Evolution Bot endpoint defined');
                return;
            }
            let headers = {
                'Content-Type': 'application/json',
            };
            if (bot.apiKey) {
                headers = {
                    ...headers,
                    Authorization: `Bearer ${bot.apiKey}`,
                };
            }
            const response = await axios_1.default.post(endpoint, payload, {
                headers,
            });
            if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                await instance.client.sendPresenceUpdate('paused', remoteJid);
            }
            let message = response?.data?.message;
            if (message && typeof message === 'string' && message.startsWith("'") && message.endsWith("'")) {
                const innerContent = message.slice(1, -1);
                if (!innerContent.includes("'")) {
                    message = innerContent;
                }
            }
            if (message) {
                await this.sendMessageWhatsApp(instance, remoteJid, message, settings);
            }
            (0, sendTelemetry_1.sendTelemetry)('/message/sendText');
        }
        catch (error) {
            this.logger.error(`Error in sendMessageToBot: ${error.message || JSON.stringify(error)}`);
            return;
        }
    }
}
exports.EvolutionBotService = EvolutionBotService;
