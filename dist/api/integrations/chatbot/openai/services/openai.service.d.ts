import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ConfigService } from '@config/env.config';
import { IntegrationSession, OpenaiBot, OpenaiSetting } from '@prisma/client';
import OpenAI from 'openai';
import { BaseChatbotService } from '../../base-chatbot.service';
export declare class OpenaiService extends BaseChatbotService<OpenaiBot, OpenaiSetting> {
    protected client: OpenAI;
    constructor(waMonitor: WAMonitoringService, prismaRepository: PrismaRepository, configService: ConfigService);
    protected getBotType(): string;
    protected initClient(apiKey: string): OpenAI;
    process(instance: any, remoteJid: string, openaiBot: OpenaiBot, session: IntegrationSession, settings: OpenaiSetting, content: string, pushName?: string, msg?: any): Promise<void>;
    protected sendMessageToBot(instance: any, session: IntegrationSession, settings: OpenaiSetting, openaiBot: OpenaiBot, remoteJid: string, pushName: string, content: string): Promise<void>;
    private processAssistantMessage;
    private processChatCompletionMessage;
    private getAIResponse;
    protected isImageMessage(content: string): boolean;
    speechToText(msg: any, instance: any): Promise<string | null>;
}
