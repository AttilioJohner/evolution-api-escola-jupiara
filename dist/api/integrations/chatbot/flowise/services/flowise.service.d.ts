import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ConfigService } from '@config/env.config';
import { Flowise as FlowiseModel, IntegrationSession } from '@prisma/client';
import { BaseChatbotService } from '../../base-chatbot.service';
import { OpenaiService } from '../../openai/services/openai.service';
export declare class FlowiseService extends BaseChatbotService<FlowiseModel> {
    private openaiService;
    constructor(waMonitor: WAMonitoringService, prismaRepository: PrismaRepository, configService: ConfigService, openaiService: OpenaiService);
    protected getBotType(): string;
    processBot(instance: any, remoteJid: string, bot: FlowiseModel, session: IntegrationSession, settings: any, content: string, pushName?: string, msg?: any): Promise<void>;
    protected sendMessageToBot(instance: any, session: IntegrationSession, settings: any, bot: FlowiseModel, remoteJid: string, pushName: string, content: string, msg?: any): Promise<void>;
}
