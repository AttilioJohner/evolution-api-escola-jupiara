import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import { EvolutionBot, IntegrationSession } from '@prisma/client';
import { BaseChatbotController } from '../../base-chatbot.controller';
import { EvolutionBotDto } from '../dto/evolutionBot.dto';
import { EvolutionBotService } from '../services/evolutionBot.service';
export declare class EvolutionBotController extends BaseChatbotController<EvolutionBot, EvolutionBotDto> {
    private readonly evolutionBotService;
    constructor(evolutionBotService: EvolutionBotService, prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    readonly logger: Logger;
    protected readonly integrationName = "EvolutionBot";
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
    protected getAdditionalBotData(data: EvolutionBotDto): Record<string, any>;
    protected getAdditionalUpdateFields(data: EvolutionBotDto): Record<string, any>;
    protected validateNoDuplicatesOnUpdate(botId: string, instanceId: string, data: EvolutionBotDto): Promise<void>;
    protected processBot(instance: any, remoteJid: string, bot: EvolutionBot, session: IntegrationSession, settings: any, content: string, pushName?: string, msg?: any): Promise<void>;
}
