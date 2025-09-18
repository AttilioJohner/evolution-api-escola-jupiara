"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvoaiService = void 0;
const wa_types_1 = require("@api/types/wa.types");
const axios_1 = __importDefault(require("axios"));
const baileys_1 = require("baileys");
const uuid_1 = require("uuid");
const base_chatbot_service_1 = require("../../base-chatbot.service");
class EvoaiService extends base_chatbot_service_1.BaseChatbotService {
    constructor(waMonitor, prismaRepository, configService, openaiService) {
        super(waMonitor, prismaRepository, 'EvoaiService', configService);
        this.openaiService = openaiService;
    }
    getBotType() {
        return 'evoai';
    }
    async sendMessageToBot(instance, session, settings, evoai, remoteJid, pushName, content, msg) {
        try {
            this.logger.debug(`[EvoAI] Sending message to bot with content: ${content}`);
            let processedContent = content;
            if (this.isAudioMessage(content) && msg) {
                try {
                    this.logger.debug(`[EvoAI] Downloading audio for Whisper transcription`);
                    const transcription = await this.openaiService.speechToText(msg, instance);
                    if (transcription) {
                        processedContent = `[audio] ${transcription}`;
                    }
                }
                catch (err) {
                    this.logger.error(`[EvoAI] Failed to transcribe audio: ${err}`);
                }
            }
            const endpoint = evoai.agentUrl;
            if (!endpoint) {
                this.logger.error('No EvoAI endpoint defined');
                return;
            }
            const callId = `req-${(0, uuid_1.v4)().substring(0, 8)}`;
            const messageId = remoteJid.split('@')[0] || (0, uuid_1.v4)();
            const parts = [
                {
                    type: 'text',
                    text: processedContent,
                },
            ];
            if (this.isImageMessage(content) && msg) {
                const contentSplit = content.split('|');
                parts[0].text = contentSplit[2] || content;
                try {
                    const mediaResult = await (0, baileys_1.downloadMediaMessage)(msg, 'buffer', {});
                    let mediaBuffer;
                    if (Buffer.isBuffer(mediaResult)) {
                        mediaBuffer = mediaResult;
                    }
                    else {
                        const chunks = [];
                        for await (const chunk of mediaResult) {
                            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                        }
                        mediaBuffer = Buffer.concat(chunks);
                    }
                    const fileContent = mediaBuffer.toString('base64');
                    const fileName = contentSplit[2] || `${msg.key?.id || 'image'}.jpg`;
                    parts.push({
                        type: 'file',
                        file: {
                            name: fileName,
                            mimeType: 'image/jpeg',
                            bytes: fileContent,
                        },
                    });
                }
                catch (fileErr) {
                    this.logger.error(`[EvoAI] Failed to process image: ${fileErr}`);
                }
            }
            const payload = {
                jsonrpc: '2.0',
                id: callId,
                method: 'message/send',
                params: {
                    contextId: session.sessionId,
                    message: {
                        role: 'user',
                        parts,
                        messageId: messageId,
                        metadata: {
                            messageKey: msg?.key,
                        },
                    },
                    metadata: {
                        remoteJid: remoteJid,
                        pushName: pushName,
                        fromMe: msg?.key?.fromMe,
                        instanceName: instance.instanceName,
                        serverUrl: this.configService.get('SERVER').URL,
                        apiKey: instance.token,
                    },
                },
            };
            this.logger.debug(`[EvoAI] Sending request to: ${endpoint}`);
            const redactedPayload = JSON.parse(JSON.stringify(payload));
            if (redactedPayload?.params?.message?.parts) {
                redactedPayload.params.message.parts = redactedPayload.params.message.parts.map((part) => {
                    if (part.type === 'file' && part.file && part.file.bytes) {
                        return { ...part, file: { ...part.file, bytes: '[base64 omitted]' } };
                    }
                    return part;
                });
            }
            this.logger.debug(`[EvoAI] Payload: ${JSON.stringify(redactedPayload)}`);
            if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                await instance.client.presenceSubscribe(remoteJid);
                await instance.client.sendPresenceUpdate('composing', remoteJid);
            }
            const response = await axios_1.default.post(endpoint, payload, {
                headers: {
                    'x-api-key': evoai.apiKey,
                    'Content-Type': 'application/json',
                },
            });
            this.logger.debug(`[EvoAI] Response: ${JSON.stringify(response.data)}`);
            if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS)
                await instance.client.sendPresenceUpdate('paused', remoteJid);
            let message = undefined;
            const result = response?.data?.result;
            if (result?.artifacts && Array.isArray(result.artifacts) && result.artifacts.length > 0) {
                const artifact = result.artifacts[0];
                if (artifact?.parts && Array.isArray(artifact.parts)) {
                    const textPart = artifact.parts.find((p) => p.type === 'text' && p.text);
                    if (textPart)
                        message = textPart.text;
                }
            }
            this.logger.debug(`[EvoAI] Extracted message to send: ${message}`);
            if (message) {
                await this.sendMessageWhatsApp(instance, remoteJid, message, settings);
            }
        }
        catch (error) {
            this.logger.error(`[EvoAI] Error sending message: ${error?.response?.data ? JSON.stringify(error.response.data) : error}`);
            return;
        }
    }
}
exports.EvoaiService = EvoaiService;
