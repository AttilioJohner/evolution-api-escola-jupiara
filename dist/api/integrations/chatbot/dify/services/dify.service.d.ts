import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ConfigService } from '@config/env.config';
import { Dify, DifySetting, IntegrationSession } from '@prisma/client';
import { BaseChatbotService } from '../../base-chatbot.service';
import { OpenaiService } from '../../openai/services/openai.service';
export declare class DifyService extends BaseChatbotService<Dify, DifySetting> {
    private openaiService;
    constructor(waMonitor: WAMonitoringService, prismaRepository: PrismaRepository, configService: ConfigService, openaiService: OpenaiService);
    protected getBotType(): string;
    protected sendMessageToBot(instance: any, session: IntegrationSession, settings: DifySetting, dify: Dify, remoteJid: string, pushName: string, content: string, msg?: any): Promise<void>;
}
