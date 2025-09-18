"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenaiService = void 0;
const wa_types_1 = require("@api/types/wa.types");
const sendTelemetry_1 = require("@utils/sendTelemetry");
const axios_1 = __importDefault(require("axios"));
const baileys_1 = require("baileys");
const form_data_1 = __importDefault(require("form-data"));
const openai_1 = __importDefault(require("openai"));
const pino_1 = __importDefault(require("pino"));
const base_chatbot_service_1 = require("../../base-chatbot.service");
class OpenaiService extends base_chatbot_service_1.BaseChatbotService {
    constructor(waMonitor, prismaRepository, configService) {
        super(waMonitor, prismaRepository, 'OpenaiService', configService);
    }
    getBotType() {
        return 'openai';
    }
    initClient(apiKey) {
        this.client = new openai_1.default({ apiKey });
        return this.client;
    }
    async process(instance, remoteJid, openaiBot, session, settings, content, pushName, msg) {
        try {
            this.logger.log(`Starting process for remoteJid: ${remoteJid}, bot type: ${openaiBot.botType}`);
            if (content.startsWith('audioMessage|') && msg) {
                this.logger.log('Detected audio message, attempting to transcribe');
                const creds = await this.prismaRepository.openaiCreds.findUnique({
                    where: { id: openaiBot.openaiCredsId },
                });
                if (!creds) {
                    this.logger.error(`OpenAI credentials not found. CredsId: ${openaiBot.openaiCredsId}`);
                    return;
                }
                this.initClient(creds.apiKey);
                const transcription = await this.speechToText(msg, instance);
                if (transcription) {
                    this.logger.log(`Audio transcribed: ${transcription}`);
                    content = transcription;
                }
                else {
                    this.logger.error('Failed to transcribe audio');
                    await this.sendMessageWhatsApp(instance, remoteJid, "Sorry, I couldn't transcribe your audio message. Could you please type your message instead?", settings);
                    return;
                }
            }
            else {
                const creds = await this.prismaRepository.openaiCreds.findUnique({
                    where: { id: openaiBot.openaiCredsId },
                });
                if (!creds) {
                    this.logger.error(`OpenAI credentials not found. CredsId: ${openaiBot.openaiCredsId}`);
                    return;
                }
                this.initClient(creds.apiKey);
            }
            const keywordFinish = settings?.keywordFinish || '';
            const normalizedContent = content.toLowerCase().trim();
            if (keywordFinish.length > 0 && normalizedContent === keywordFinish.toLowerCase()) {
                if (settings?.keepOpen) {
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
                    await this.prismaRepository.integrationSession.delete({
                        where: {
                            id: session.id,
                        },
                    });
                }
                await (0, sendTelemetry_1.sendTelemetry)('/openai/session/finish');
                return;
            }
            if (!session) {
                const data = {
                    remoteJid,
                    pushName,
                    botId: openaiBot.id,
                };
                const createSession = await this.createNewSession({ instanceName: instance.instanceName, instanceId: instance.instanceId }, data, this.getBotType());
                await this.initNewSession(instance, remoteJid, openaiBot, settings, createSession.session, content, pushName, msg);
                await (0, sendTelemetry_1.sendTelemetry)('/openai/session/start');
                return;
            }
            if (session.status === 'paused') {
                await this.prismaRepository.integrationSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        status: 'opened',
                        awaitUser: true,
                    },
                });
                return;
            }
            await this.sendMessageToBot(instance, session, settings, openaiBot, remoteJid, pushName || '', content);
        }
        catch (error) {
            this.logger.error(`Error in process: ${error.message || JSON.stringify(error)}`);
            return;
        }
    }
    async sendMessageToBot(instance, session, settings, openaiBot, remoteJid, pushName, content) {
        this.logger.log(`Sending message to bot for remoteJid: ${remoteJid}, bot type: ${openaiBot.botType}`);
        if (!this.client) {
            this.logger.log('Client not initialized, initializing now');
            const creds = await this.prismaRepository.openaiCreds.findUnique({
                where: { id: openaiBot.openaiCredsId },
            });
            if (!creds) {
                this.logger.error(`OpenAI credentials not found in sendMessageToBot. CredsId: ${openaiBot.openaiCredsId}`);
                return;
            }
            this.initClient(creds.apiKey);
        }
        try {
            let message;
            if (openaiBot.botType === 'assistant') {
                this.logger.log('Processing with Assistant API');
                message = await this.processAssistantMessage(instance, session, openaiBot, remoteJid, pushName, false, content);
            }
            else {
                this.logger.log('Processing with ChatCompletion API');
                message = await this.processChatCompletionMessage(instance, openaiBot, remoteJid, content);
            }
            this.logger.log(`Got response from OpenAI: ${message?.substring(0, 50)}${message?.length > 50 ? '...' : ''}`);
            if (message) {
                this.logger.log('Sending message to WhatsApp');
                await this.sendMessageWhatsApp(instance, remoteJid, message, settings);
            }
            else {
                this.logger.error('No message to send to WhatsApp');
            }
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
            this.logger.error(`Error in sendMessageToBot: ${error.message || JSON.stringify(error)}`);
            if (error.response) {
                this.logger.error(`API Response data: ${JSON.stringify(error.response.data || {})}`);
            }
            return;
        }
    }
    async processAssistantMessage(instance, session, openaiBot, remoteJid, pushName, fromMe, content) {
        const messageData = {
            role: fromMe ? 'assistant' : 'user',
            content: [{ type: 'text', text: content }],
        };
        if (this.isImageMessage(content)) {
            const contentSplit = content.split('|');
            const url = contentSplit[1].split('?')[0];
            messageData.content = [
                { type: 'text', text: contentSplit[2] || content },
                {
                    type: 'image_url',
                    image_url: {
                        url: url,
                    },
                },
            ];
        }
        let threadId = session.sessionId;
        if (!threadId || threadId === remoteJid) {
            const newThread = await this.client.beta.threads.create();
            threadId = newThread.id;
            await this.prismaRepository.integrationSession.update({
                where: {
                    id: session.id,
                },
                data: {
                    sessionId: threadId,
                },
            });
            this.logger.log(`Created new thread ID: ${threadId} for session: ${session.id}`);
        }
        await this.client.beta.threads.messages.create(threadId, messageData);
        if (fromMe) {
            (0, sendTelemetry_1.sendTelemetry)('/message/sendText');
            return '';
        }
        const runAssistant = await this.client.beta.threads.runs.create(threadId, {
            assistant_id: openaiBot.assistantId,
        });
        if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
            await instance.client.presenceSubscribe(remoteJid);
            await instance.client.sendPresenceUpdate('composing', remoteJid);
        }
        const response = await this.getAIResponse(threadId, runAssistant.id, openaiBot.functionUrl, remoteJid, pushName);
        if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
            await instance.client.sendPresenceUpdate('paused', remoteJid);
        }
        let responseText = "I couldn't generate a proper response. Please try again.";
        try {
            const messages = response?.data || [];
            if (messages.length > 0) {
                const messageContent = messages[0]?.content || [];
                if (messageContent.length > 0) {
                    const textContent = messageContent[0];
                    if (textContent && 'text' in textContent && textContent.text && 'value' in textContent.text) {
                        responseText = textContent.text.value;
                    }
                }
            }
        }
        catch (error) {
            this.logger.error(`Error extracting response text: ${error}`);
        }
        await this.prismaRepository.integrationSession.update({
            where: {
                id: session.id,
            },
            data: {
                status: 'opened',
                awaitUser: true,
                sessionId: threadId,
            },
        });
        return responseText;
    }
    async processChatCompletionMessage(instance, openaiBot, remoteJid, content) {
        this.logger.log('Starting processChatCompletionMessage');
        if (!this.client) {
            this.logger.log('Client not initialized in processChatCompletionMessage, initializing now');
            const creds = await this.prismaRepository.openaiCreds.findUnique({
                where: { id: openaiBot.openaiCredsId },
            });
            if (!creds) {
                this.logger.error(`OpenAI credentials not found. CredsId: ${openaiBot.openaiCredsId}`);
                return 'Error: OpenAI credentials not found';
            }
            this.initClient(creds.apiKey);
        }
        if (!openaiBot.model) {
            this.logger.error('OpenAI model not defined');
            return 'Error: OpenAI model not configured';
        }
        this.logger.log(`Using model: ${openaiBot.model}, max tokens: ${openaiBot.maxTokens || 500}`);
        const session = await this.prismaRepository.integrationSession.findFirst({
            where: {
                remoteJid,
                botId: openaiBot.id,
                status: 'opened',
            },
        });
        let conversationHistory = [];
        if (session && session.context) {
            try {
                const sessionData = typeof session.context === 'string' ? JSON.parse(session.context) : session.context;
                conversationHistory = sessionData.history || [];
                this.logger.log(`Retrieved conversation history from session, ${conversationHistory.length} messages`);
            }
            catch (error) {
                this.logger.error(`Error parsing session context: ${error.message}`);
                conversationHistory = [];
            }
        }
        this.logger.log(`Bot data - systemMessages: ${JSON.stringify(openaiBot.systemMessages || [])}`);
        this.logger.log(`Bot data - assistantMessages: ${JSON.stringify(openaiBot.assistantMessages || [])}`);
        this.logger.log(`Bot data - userMessages: ${JSON.stringify(openaiBot.userMessages || [])}`);
        const systemMessages = openaiBot.systemMessages || [];
        const messagesSystem = systemMessages.map((message) => {
            return {
                role: 'system',
                content: message,
            };
        });
        const assistantMessages = openaiBot.assistantMessages || [];
        const messagesAssistant = assistantMessages.map((message) => {
            return {
                role: 'assistant',
                content: message,
            };
        });
        const userMessages = openaiBot.userMessages || [];
        const messagesUser = userMessages.map((message) => {
            return {
                role: 'user',
                content: message,
            };
        });
        const messageData = {
            role: 'user',
            content: [{ type: 'text', text: content }],
        };
        if (this.isImageMessage(content)) {
            this.logger.log('Found image message');
            const contentSplit = content.split('|');
            const url = contentSplit[1].split('?')[0];
            messageData.content = [
                { type: 'text', text: contentSplit[2] || content },
                {
                    type: 'image_url',
                    image_url: {
                        url: url,
                    },
                },
            ];
        }
        const messages = [
            ...messagesSystem,
            ...messagesAssistant,
            ...messagesUser,
            ...conversationHistory,
            messageData,
        ];
        this.logger.log(`Final messages payload: ${JSON.stringify(messages)}`);
        if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
            this.logger.log('Setting typing indicator');
            await instance.client.presenceSubscribe(remoteJid);
            await instance.client.sendPresenceUpdate('composing', remoteJid);
        }
        try {
            this.logger.log('Sending request to OpenAI API');
            const completions = await this.client.chat.completions.create({
                model: openaiBot.model,
                messages: messages,
                max_tokens: openaiBot.maxTokens || 500,
            });
            if (instance.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                await instance.client.sendPresenceUpdate('paused', remoteJid);
            }
            const responseContent = completions.choices[0].message.content;
            this.logger.log(`Received response from OpenAI: ${JSON.stringify(completions.choices[0])}`);
            conversationHistory.push(messageData);
            conversationHistory.push({
                role: 'assistant',
                content: responseContent,
            });
            if (conversationHistory.length > 10) {
                conversationHistory = conversationHistory.slice(conversationHistory.length - 10);
            }
            if (session) {
                await this.prismaRepository.integrationSession.update({
                    where: { id: session.id },
                    data: {
                        context: JSON.stringify({
                            history: conversationHistory,
                        }),
                    },
                });
                this.logger.log(`Updated session with conversation history, now ${conversationHistory.length} messages`);
            }
            return responseContent;
        }
        catch (error) {
            this.logger.error(`Error calling OpenAI: ${error.message || JSON.stringify(error)}`);
            if (error.response) {
                this.logger.error(`API Response status: ${error.response.status}`);
                this.logger.error(`API Response data: ${JSON.stringify(error.response.data || {})}`);
            }
            return `Sorry, there was an error: ${error.message || 'Unknown error'}`;
        }
    }
    async getAIResponse(threadId, runId, functionUrl, remoteJid, pushName) {
        let status = await this.client.beta.threads.runs.retrieve(threadId, runId);
        let maxRetries = 60;
        const checkInterval = 1000;
        while (status.status !== 'completed' &&
            status.status !== 'failed' &&
            status.status !== 'cancelled' &&
            status.status !== 'expired' &&
            maxRetries > 0) {
            await new Promise((resolve) => setTimeout(resolve, checkInterval));
            status = await this.client.beta.threads.runs.retrieve(threadId, runId);
            if (status.status === 'requires_action' && status.required_action?.type === 'submit_tool_outputs') {
                const toolCalls = status.required_action.submit_tool_outputs.tool_calls;
                const toolOutputs = [];
                for (const toolCall of toolCalls) {
                    if (functionUrl) {
                        try {
                            const payloadData = JSON.parse(toolCall.function.arguments);
                            payloadData.remoteJid = remoteJid;
                            payloadData.pushName = pushName;
                            const response = await axios_1.default.post(functionUrl, {
                                functionName: toolCall.function.name,
                                functionArguments: payloadData,
                            });
                            toolOutputs.push({
                                tool_call_id: toolCall.id,
                                output: JSON.stringify(response.data),
                            });
                        }
                        catch (error) {
                            this.logger.error(`Error calling function: ${error}`);
                            toolOutputs.push({
                                tool_call_id: toolCall.id,
                                output: JSON.stringify({ error: 'Function call failed' }),
                            });
                        }
                    }
                    else {
                        toolOutputs.push({
                            tool_call_id: toolCall.id,
                            output: JSON.stringify({ error: 'No function URL configured' }),
                        });
                    }
                }
                await this.client.beta.threads.runs.submitToolOutputs(threadId, runId, {
                    tool_outputs: toolOutputs,
                });
            }
            maxRetries--;
        }
        if (status.status === 'completed') {
            const messages = await this.client.beta.threads.messages.list(threadId);
            return messages;
        }
        else {
            this.logger.error(`Assistant run failed with status: ${status.status}`);
            return { data: [{ content: [{ text: { value: 'Failed to get a response from the assistant.' } }] }] };
        }
    }
    isImageMessage(content) {
        return content.includes('imageMessage');
    }
    async speechToText(msg, instance) {
        const settings = await this.prismaRepository.openaiSetting.findFirst({
            where: {
                instanceId: instance.instanceId,
            },
        });
        if (!settings) {
            this.logger.error(`OpenAI settings not found. InstanceId: ${instance.instanceId}`);
            return null;
        }
        const creds = await this.prismaRepository.openaiCreds.findUnique({
            where: { id: settings.openaiCredsId },
        });
        if (!creds) {
            this.logger.error(`OpenAI credentials not found. CredsId: ${settings.openaiCredsId}`);
            return null;
        }
        let audio;
        if (msg.message.mediaUrl) {
            audio = await axios_1.default.get(msg.message.mediaUrl, { responseType: 'arraybuffer' }).then((response) => {
                return Buffer.from(response.data, 'binary');
            });
        }
        else if (msg.message.base64) {
            audio = Buffer.from(msg.message.base64, 'base64');
        }
        else {
            const mediaResult = await (0, baileys_1.downloadMediaMessage)({ key: msg.key, message: msg?.message }, 'buffer', {}, {
                logger: (0, pino_1.default)({ level: 'error' }),
                reuploadRequest: instance,
            });
            if (Buffer.isBuffer(mediaResult)) {
                audio = mediaResult;
            }
            else {
                const chunks = [];
                for await (const chunk of mediaResult) {
                    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                }
                audio = Buffer.concat(chunks);
            }
        }
        const lang = this.configService.get('LANGUAGE').includes('pt')
            ? 'pt'
            : this.configService.get('LANGUAGE');
        const formData = new form_data_1.default();
        formData.append('file', audio, 'audio.ogg');
        formData.append('model', 'whisper-1');
        formData.append('language', lang);
        const apiKey = creds?.apiKey || this.configService.get('OPENAI').API_KEY_GLOBAL;
        const response = await axios_1.default.post('https://api.openai.com/v1/audio/transcriptions', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${apiKey}`,
            },
        });
        return response?.data?.text;
    }
}
exports.OpenaiService = OpenaiService;
