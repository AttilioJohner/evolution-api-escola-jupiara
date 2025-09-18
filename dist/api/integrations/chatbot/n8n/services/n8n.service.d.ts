import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ConfigService } from '@config/env.config';
import { IntegrationSession, N8n, N8nSetting } from '@prisma/client';
import { BaseChatbotService } from '../../base-chatbot.service';
import { OpenaiService } from '../../openai/services/openai.service';
export declare class N8nService extends BaseChatbotService<N8n, N8nSetting> {
    private openaiService;
    constructor(waMonitor: WAMonitoringService, prismaRepository: PrismaRepository, configService: ConfigService, openaiService: OpenaiService);
    protected getBotType(): string;
    protected sendMessageToBot(instance: any, session: IntegrationSession, settings: N8nSetting, n8n: N8n, remoteJid: string, pushName: string, content: string, msg?: any): Promise<void>;
}
