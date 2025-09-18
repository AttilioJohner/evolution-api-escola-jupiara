"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nService = void 0;
const axios_1 = __importDefault(require("axios"));
const base_chatbot_service_1 = require("../../base-chatbot.service");
class N8nService extends base_chatbot_service_1.BaseChatbotService {
    constructor(waMonitor, prismaRepository, configService, openaiService) {
        super(waMonitor, prismaRepository, 'N8nService', configService);
        this.openaiService = openaiService;
    }
    getBotType() {
        return 'n8n';
    }
    async sendMessageToBot(instance, session, settings, n8n, remoteJid, pushName, content, msg) {
        try {
            if (!session) {
                this.logger.error('Session is null in sendMessageToBot');
                return;
            }
            const endpoint = n8n.webhookUrl;
            const payload = {
                chatInput: content,
                sessionId: session.sessionId,
                remoteJid: remoteJid,
                pushName: pushName,
                keyId: msg?.key?.id,
                fromMe: msg?.key?.fromMe,
                instanceName: instance.instanceName,
                serverUrl: this.configService.get('SERVER').URL,
                apiKey: instance.token,
            };
            if (this.isAudioMessage(content) && msg) {
                try {
                    this.logger.debug(`[N8n] Downloading audio for Whisper transcription`);
                    const transcription = await this.openaiService.speechToText(msg, instance);
                    if (transcription) {
                        payload.chatInput = `[audio] ${transcription}`;
                    }
                }
                catch (err) {
                    this.logger.error(`[N8n] Failed to transcribe audio: ${err}`);
                }
            }
            const headers = {};
            if (n8n.basicAuthUser && n8n.basicAuthPass) {
                const auth = Buffer.from(`${n8n.basicAuthUser}:${n8n.basicAuthPass}`).toString('base64');
                headers['Authorization'] = `Basic ${auth}`;
            }
            const response = await axios_1.default.post(endpoint, payload, { headers });
            const message = response?.data?.output || response?.data?.answer;
            await this.sendMessageWhatsApp(instance, remoteJid, message, settings);
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
            this.logger.error(error.response?.data || error);
            return;
        }
    }
}
exports.N8nService = N8nService;
