import { InstanceDto } from '@api/dto/instance.dto';
import { EvoaiDto } from '@api/integrations/chatbot/evoai/dto/evoai.dto';
import { EvoaiService } from '@api/integrations/chatbot/evoai/services/evoai.service';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import { Evoai as EvoaiModel, IntegrationSession } from '@prisma/client';
import { BaseChatbotController } from '../../base-chatbot.controller';
export declare class EvoaiController extends BaseChatbotController<EvoaiModel, EvoaiDto> {
    private readonly evoaiService;
    constructor(evoaiService: EvoaiService, prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    readonly logger: Logger;
    protected readonly integrationName = "Evoai";
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
    protected getAdditionalBotData(data: EvoaiDto): Record<string, any>;
    protected getAdditionalUpdateFields(data: EvoaiDto): Record<string, any>;
    protected validateNoDuplicatesOnUpdate(botId: string, instanceId: string, data: EvoaiDto): Promise<void>;
    createBot(instance: InstanceDto, data: EvoaiDto): Promise<any>;
    protected processBot(instance: any, remoteJid: string, bot: EvoaiModel, session: IntegrationSession, settings: any, content: string, pushName?: string, msg?: any): Promise<void>;
}
