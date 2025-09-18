import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ConfigService } from '@config/env.config';
import { Instance, IntegrationSession, Message, Typebot as TypebotModel } from '@prisma/client';
import { BaseChatbotService } from '../../base-chatbot.service';
import { OpenaiService } from '../../openai/services/openai.service';
export declare class TypebotService extends BaseChatbotService<TypebotModel, any> {
    private openaiService;
    constructor(waMonitor: WAMonitoringService, configService: ConfigService, prismaRepository: PrismaRepository, openaiService: OpenaiService);
    protected getBotType(): string;
    protected sendMessageToBot(instance: any, session: IntegrationSession, settings: any, bot: TypebotModel, remoteJid: string, pushName: string, content: string, msg?: any): Promise<void>;
    processTypebotSimple(instance: any, remoteJid: string, bot: TypebotModel, session: IntegrationSession, settings: any, content: string, pushName?: string, msg?: any): Promise<void>;
    createNewSession(instance: Instance, data: any): Promise<any>;
    sendWAMessage(instanceDb: Instance, session: IntegrationSession, settings: {
        expire: number;
        keywordFinish: string;
        delayMessage: number;
        unknownMessage: string;
        listeningFromMe: boolean;
        stopBotFromMe: boolean;
        keepOpen: boolean;
    }, remoteJid: string, messages: any, input: any, clientSideActions: any): Promise<void>;
    private applyFormatting;
    private processMessages;
    private processListMessage;
    private processButtonMessage;
    processTypebot(waInstance: any, remoteJid: string, msg: Message, session: IntegrationSession, findTypebot: TypebotModel, url: string, expire: number, typebot: string, keywordFinish: string, delayMessage: number, unknownMessage: string, listeningFromMe: boolean, stopBotFromMe: boolean, keepOpen: boolean, content: string, prefilledVariables?: any): Promise<void>;
}
