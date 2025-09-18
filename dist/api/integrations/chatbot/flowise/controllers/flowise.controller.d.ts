import { InstanceDto } from '@api/dto/instance.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import { Flowise as FlowiseModel, IntegrationSession } from '@prisma/client';
import { BaseChatbotController } from '../../base-chatbot.controller';
import { FlowiseDto } from '../dto/flowise.dto';
import { FlowiseService } from '../services/flowise.service';
export declare class FlowiseController extends BaseChatbotController<FlowiseModel, FlowiseDto> {
    private readonly flowiseService;
    constructor(flowiseService: FlowiseService, prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    readonly logger: Logger;
    protected readonly integrationName = "Flowise";
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
    protected getAdditionalBotData(data: FlowiseDto): Record<string, any>;
    protected getAdditionalUpdateFields(data: FlowiseDto): Record<string, any>;
    protected validateNoDuplicatesOnUpdate(botId: string, instanceId: string, data: FlowiseDto): Promise<void>;
    protected processBot(instance: any, remoteJid: string, bot: FlowiseModel, session: IntegrationSession, settings: any, content: string, pushName?: string, msg?: any): Promise<void>;
    createBot(instance: InstanceDto, data: FlowiseDto): Promise<any>;
}
