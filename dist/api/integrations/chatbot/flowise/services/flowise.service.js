"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowiseService = void 0;
const wa_types_1 = require("@api/types/wa.types");
const axios_1 = __importDefault(require("axios"));
const base_chatbot_service_1 = require("../../base-chatbot.service");
class FlowiseService extends base_chatbot_service_1.BaseChatbotService {
    constructor(waMonitor, prismaRepository, configService, openaiService) {
        super(waMonitor, prismaRepository, 'FlowiseService', configService);
        this.openaiService = openaiService;
    }
    getBotType() {
        return 'flowise';
    }
    async processBot(instance, remoteJid, bot, session, settings, content, pushName, msg) {
        await this.process(instance, remoteJid, bot, session, settings, content, pushName, msg);
    }
    async sendMessageToBot(instance, session, settings, bot, remoteJid, pushName, content, msg) {
        const payload = {
            question: content,
            overrideConfig: {
                sessionId: remoteJid,
                vars: {
                    remoteJid: remoteJid,
                    pushName: pushName,
                    instanceName: instance.instanceName,
                    serverUrl: this.configService.get('SERVER').URL,
                    apiKey: instance.token,
                },
            },
        };
        if (this.isAudioMessage(content) && msg) {
            try {
                this.logger.debug(`[Flowise] Downloading audio for Whisper transcription`);
                const transcription = await this.openaiService.speechToText(msg, instance);
                if (transcription) {
                    payload.question = `[audio] ${transcription}`;
                }
            }
            catch (err) {
                this.logger.error(`[Flowise] Failed to transcribe audio: ${err}`);
            }
        }
        if (this.isImageMessage(content)) {
            const contentSplit = content.split('|');
            payload.uploads = [
                {
                    data: contentSplit[1].split('?')[0],
                    type: 'url',
                    name: 'Flowise.png',
                    mime: 'image/png',
                },
            ];
            payload.question = contentSplit[2] || content;
        }
        if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
            await instance.client.presenceSubscribe(remoteJid);
            await instance.client.sendPresenceUpdate('composing', remoteJid);
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
        const endpoint = bot.apiUrl;
        if (!endpoint) {
            this.logger.error('No Flowise endpoint defined');
            return;
        }
        const response = await axios_1.default.post(endpoint, payload, {
            headers,
        });
        if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
            await instance.client.sendPresenceUpdate('paused', remoteJid);
        }
        const message = response?.data?.text;
        if (message) {
            await this.sendMessageWhatsApp(instance, remoteJid, message, settings);
        }
    }
}
exports.FlowiseService = FlowiseService;
