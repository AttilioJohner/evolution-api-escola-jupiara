import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ConfigService } from '@config/env.config';
import { Evoai, EvoaiSetting, IntegrationSession } from '@prisma/client';
import { BaseChatbotService } from '../../base-chatbot.service';
import { OpenaiService } from '../../openai/services/openai.service';
export declare class EvoaiService extends BaseChatbotService<Evoai, EvoaiSetting> {
    private openaiService;
    constructor(waMonitor: WAMonitoringService, prismaRepository: PrismaRepository, configService: ConfigService, openaiService: OpenaiService);
    protected getBotType(): string;
    protected sendMessageToBot(instance: any, session: IntegrationSession, settings: EvoaiSetting, evoai: Evoai, remoteJid: string, pushName: string, content: string, msg?: any): Promise<void>;
}
