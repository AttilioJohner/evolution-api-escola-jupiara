import { IgnoreJidDto } from '@api/dto/chatbot.dto';
import { InstanceDto } from '@api/dto/instance.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import { TriggerOperator, TriggerType } from '@prisma/client';
import { BaseChatbotDto } from './base-chatbot.dto';
import { ChatbotController, ChatbotControllerInterface, EmitData } from './chatbot.controller';
export interface ChatbotSettings {
    expire: number;
    keywordFinish: string;
    delayMessage: number;
    unknownMessage: string;
    listeningFromMe: boolean;
    stopBotFromMe: boolean;
    keepOpen: boolean;
    debounceTime: number;
    ignoreJids: string[];
    splitMessages: boolean;
    timePerChar: number;
    [key: string]: any;
}
export interface BaseBotData {
    enabled?: boolean;
    description: string;
    expire?: number;
    keywordFinish?: string;
    delayMessage?: number;
    unknownMessage?: string;
    listeningFromMe?: boolean;
    stopBotFromMe?: boolean;
    keepOpen?: boolean;
    debounceTime?: number;
    triggerType: string | TriggerType;
    triggerOperator?: string | TriggerOperator;
    triggerValue?: string;
    ignoreJids?: string[];
    splitMessages?: boolean;
    timePerChar?: number;
    [key: string]: any;
}
export declare abstract class BaseChatbotController<BotType = any, BotData extends BaseChatbotDto = BaseChatbotDto> extends ChatbotController implements ChatbotControllerInterface {
    readonly logger: Logger;
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
    protected abstract readonly integrationName: string;
    protected abstract processBot(waInstance: any, remoteJid: string, bot: BotType, session: any, settings: ChatbotSettings, content: string, pushName?: string, msg?: any): Promise<void>;
    protected abstract getFallbackBotId(settings: any): string | undefined;
    constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    createBot(instance: InstanceDto, data: BotData): Promise<any>;
    protected abstract getAdditionalBotData(data: BotData): Record<string, any>;
    findBot(instance: InstanceDto): Promise<any>;
    fetchBot(instance: InstanceDto, botId: string): Promise<any>;
    settings(instance: InstanceDto, data: any): Promise<any>;
    protected abstract getFallbackFieldName(): string;
    protected abstract getIntegrationType(): string;
    fetchSettings(instance: InstanceDto): Promise<any>;
    changeStatus(instance: InstanceDto, data: any): Promise<{
        bot: {
            remoteJid: any;
            status: any;
        };
    } | {
        bot: {
            bot: {
                remoteJid: any;
                status: any;
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
            remoteJid?: undefined;
        };
    } | {
        bot: {
            bot: {
                remoteJid: any;
                status: any;
                session: any;
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
            remoteJid?: undefined;
        };
    }>;
    fetchSessions(instance: InstanceDto, botId: string, remoteJid?: string): Promise<any>;
    ignoreJid(instance: InstanceDto, data: IgnoreJidDto): Promise<{
        ignoreJids: any;
    }>;
    updateBot(instance: InstanceDto, botId: string, data: BotData): Promise<any>;
    protected abstract validateNoDuplicatesOnUpdate(botId: string, instanceId: string, data: BotData): Promise<void>;
    protected abstract getAdditionalUpdateFields(data: BotData): Record<string, any>;
    deleteBot(instance: InstanceDto, botId: string): Promise<{
        bot: {
            id: string;
        };
    }>;
    emit({ instance, remoteJid, msg }: EmitData): Promise<void>;
}
