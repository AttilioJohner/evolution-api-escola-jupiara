import { InstanceDto } from '@api/dto/instance.dto';
import { TypebotDto } from '@api/integrations/chatbot/typebot/dto/typebot.dto';
import { TypebotService } from '@api/integrations/chatbot/typebot/services/typebot.service';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import { IntegrationSession, Typebot as TypebotModel } from '@prisma/client';
import { BaseChatbotController } from '../../base-chatbot.controller';
export declare class TypebotController extends BaseChatbotController<TypebotModel, TypebotDto> {
    private readonly typebotService;
    constructor(typebotService: TypebotService, prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    readonly logger: Logger;
    protected readonly integrationName = "Typebot";
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
    protected getAdditionalBotData(data: TypebotDto): Record<string, any>;
    protected getAdditionalUpdateFields(data: TypebotDto): Record<string, any>;
    protected validateNoDuplicatesOnUpdate(botId: string, instanceId: string, data: TypebotDto): Promise<void>;
    protected processBot(instance: any, remoteJid: string, bot: TypebotModel, session: IntegrationSession, settings: any, content: string, pushName?: string, msg?: any): Promise<void>;
    startBot(instance: InstanceDto, data: any): Promise<{
        typebot: {
            typebot: {
                url: any;
                remoteJid: any;
                typebot: any;
                prefilledVariables: any;
            };
            instanceName: string;
            instanceId?: string;
            qrcode?: boolean;
            businessId?: string;
            number?: string;
            integration?: string;
            token?: string;
            status?: string;
            ownerJid?: string;
            profileName?: string;
            profilePicUrl?: string;
            rejectCall?: boolean;
            msgCall?: string;
            groupsIgnore?: boolean;
            alwaysOnline?: boolean;
            readMessages?: boolean;
            readStatus?: boolean;
            syncFullHistory?: boolean;
            wavoipToken?: string;
            proxyHost?: string;
            proxyPort?: string;
            proxyProtocol?: string;
            proxyUsername?: string;
            proxyPassword?: string;
            webhook?: {
                enabled?: boolean;
                events?: string[];
                headers?: import("@prisma/client/runtime/library").JsonValue;
                url?: string;
                byEvents?: boolean;
                base64?: boolean;
            };
            chatwootAccountId?: string;
            chatwootConversationPending?: boolean;
            chatwootAutoCreate?: boolean;
            chatwootDaysLimitImportMessages?: number;
            chatwootImportContacts?: boolean;
            chatwootImportMessages?: boolean;
            chatwootLogo?: string;
            chatwootMergeBrazilContacts?: boolean;
            chatwootNameInbox?: string;
            chatwootOrganization?: string;
            chatwootReopenConversation?: boolean;
            chatwootSignMsg?: boolean;
            chatwootToken?: string;
            chatwootUrl?: string;
            websocket?: {
                enabled?: boolean;
                events?: string[];
            };
            sqs?: {
                enabled?: boolean;
                events?: string[];
            };
            rabbitmq?: {
                enabled?: boolean;
                events?: string[];
            };
            nats?: {
                enabled?: boolean;
                events?: string[];
            };
            pusher?: {
                enabled?: boolean;
                appId?: string;
                key?: string;
                secret?: string;
                cluster?: string;
                useTLS?: boolean;
                events?: string[];
            };
        };
    }>;
}
