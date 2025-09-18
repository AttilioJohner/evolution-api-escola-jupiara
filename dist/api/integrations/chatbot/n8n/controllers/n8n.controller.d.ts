import { InstanceDto } from '@api/dto/instance.dto';
import { N8nDto } from '@api/integrations/chatbot/n8n/dto/n8n.dto';
import { N8nService } from '@api/integrations/chatbot/n8n/services/n8n.service';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import { IntegrationSession, N8n as N8nModel } from '@prisma/client';
import { BaseChatbotController } from '../../base-chatbot.controller';
export declare class N8nController extends BaseChatbotController<N8nModel, N8nDto> {
    private readonly n8nService;
    constructor(n8nService: N8nService, prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    readonly logger: Logger;
    protected readonly integrationName = "N8n";
    integrationEnabled: any;
    botRepository: any;
    settingsRepository: any;
    sessionRepository: any;
    userMessageDebounce: {
        [key: string]: {
            message: string;
            timeoutId: NodeJS.Timeout;
        };
    };
    protected getFallbackBotId(settings: any): string | undefined;
    protected getFallbackFieldName(): string;
    protected getIntegrationType(): string;
    protected getAdditionalBotData(data: N8nDto): Record<string, any>;
    protected getAdditionalUpdateFields(data: N8nDto): Record<string, any>;
    protected validateNoDuplicatesOnUpdate(botId: string, instanceId: string, data: N8nDto): Promise<void>;
    createBot(instance: InstanceDto, data: N8nDto): Promise<any>;
    protected processBot(instance: any, remoteJid: string, bot: N8nModel, session: IntegrationSession, settings: any, content: string, pushName?: string, msg?: any): Promise<void>;
}
