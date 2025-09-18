import { InstanceDto } from '@api/dto/instance.dto';
import { DifyDto } from '@api/integrations/chatbot/dify/dto/dify.dto';
import { DifyService } from '@api/integrations/chatbot/dify/services/dify.service';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import { Dify as DifyModel, IntegrationSession } from '@prisma/client';
import { BaseChatbotController } from '../../base-chatbot.controller';
export declare class DifyController extends BaseChatbotController<DifyModel, DifyDto> {
    private readonly difyService;
    constructor(difyService: DifyService, prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    readonly logger: Logger;
    protected readonly integrationName = "Dify";
    integrationEnabled: boolean;
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
    protected getAdditionalBotData(data: DifyDto): Record<string, any>;
    protected getAdditionalUpdateFields(data: DifyDto): Record<string, any>;
    protected validateNoDuplicatesOnUpdate(botId: string, instanceId: string, data: DifyDto): Promise<void>;
    createBot(instance: InstanceDto, data: DifyDto): Promise<any>;
    protected processBot(instance: any, remoteJid: string, bot: DifyModel, session: IntegrationSession, settings: any, content: string, pushName?: string, msg?: any): Promise<void>;
}
