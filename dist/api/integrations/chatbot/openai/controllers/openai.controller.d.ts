import { InstanceDto } from '@api/dto/instance.dto';
import { OpenaiCredsDto, OpenaiDto } from '@api/integrations/chatbot/openai/dto/openai.dto';
import { OpenaiService } from '@api/integrations/chatbot/openai/services/openai.service';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import { IntegrationSession, OpenaiBot } from '@prisma/client';
import { BaseChatbotController } from '../../base-chatbot.controller';
export declare class OpenaiController extends BaseChatbotController<OpenaiBot, OpenaiDto> {
    private readonly openaiService;
    constructor(openaiService: OpenaiService, prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    readonly logger: Logger;
    protected readonly integrationName = "Openai";
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
    private client;
    private credsRepository;
    protected getFallbackBotId(settings: any): string | undefined;
    protected getFallbackFieldName(): string;
    protected getIntegrationType(): string;
    protected getAdditionalBotData(data: OpenaiDto): Record<string, any>;
    protected getAdditionalUpdateFields(data: OpenaiDto): Record<string, any>;
    protected validateNoDuplicatesOnUpdate(botId: string, instanceId: string, data: OpenaiDto): Promise<void>;
    createBot(instance: InstanceDto, data: OpenaiDto): Promise<any>;
    protected processBot(instance: any, remoteJid: string, bot: OpenaiBot, session: IntegrationSession, settings: any, content: string, pushName?: string, msg?: any): Promise<void>;
    createOpenaiCreds(instance: InstanceDto, data: OpenaiCredsDto): Promise<any>;
    findOpenaiCreds(instance: InstanceDto): Promise<any>;
    deleteCreds(instance: InstanceDto, openaiCredsId: string): Promise<{
        openaiCreds: {
            id: string;
        };
    }>;
    settings(instance: InstanceDto, data: any): Promise<any>;
    getModels(instance: InstanceDto, openaiCredsId?: string): Promise<any>;
}
