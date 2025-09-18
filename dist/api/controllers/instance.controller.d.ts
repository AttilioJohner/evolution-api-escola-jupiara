import { InstanceDto, SetPresenceDto } from '@api/dto/instance.dto';
import { ChatwootService } from '@api/integrations/chatbot/chatwoot/services/chatwoot.service';
import { ProviderFiles } from '@api/provider/sessions';
import { PrismaRepository } from '@api/repository/repository.service';
import { CacheService } from '@api/services/cache.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { SettingsService } from '@api/services/settings.service';
import { wa } from '@api/types/wa.types';
import { ConfigService } from '@config/env.config';
import EventEmitter2 from 'eventemitter2';
import { ProxyController } from './proxy.controller';
export declare class InstanceController {
    private readonly waMonitor;
    private readonly configService;
    private readonly prismaRepository;
    private readonly eventEmitter;
    private readonly chatwootService;
    private readonly settingsService;
    private readonly proxyService;
    private readonly cache;
    private readonly chatwootCache;
    private readonly baileysCache;
    private readonly providerFiles;
    constructor(waMonitor: WAMonitoringService, configService: ConfigService, prismaRepository: PrismaRepository, eventEmitter: EventEmitter2, chatwootService: ChatwootService, settingsService: SettingsService, proxyService: ProxyController, cache: CacheService, chatwootCache: CacheService, baileysCache: CacheService, providerFiles: ProviderFiles);
    private readonly logger;
    createInstance(instanceData: InstanceDto): Promise<{
        instance: {
            instanceName: string;
            instanceId: string;
            integration: string;
            webhookWaBusiness: any;
            accessTokenWaBusiness: string;
            status: import("baileys").WAConnectionState | "refused";
        };
        hash: string;
        webhook: {
            webhookUrl: string;
            webhookHeaders: import("@prisma/client/runtime/library").JsonValue;
            webhookByEvents: boolean;
            webhookBase64: boolean;
        };
        websocket: {
            enabled: boolean;
        };
        rabbitmq: {
            enabled: boolean;
        };
        nats: {
            enabled: boolean;
        };
        sqs: {
            enabled: boolean;
        };
        settings: wa.LocalSettings;
        qrcode: wa.QrCode;
    } | {
        instance: {
            instanceName: string;
            instanceId: string;
            integration: string;
            webhookWaBusiness: any;
            accessTokenWaBusiness: string;
            status: import("baileys").WAConnectionState | "refused";
        };
        hash: string;
        webhook: {
            webhookUrl: string;
            webhookHeaders: import("@prisma/client/runtime/library").JsonValue;
            webhookByEvents: boolean;
            webhookBase64: boolean;
        };
        websocket: {
            enabled: boolean;
        };
        rabbitmq: {
            enabled: boolean;
        };
        nats: {
            enabled: boolean;
        };
        sqs: {
            enabled: boolean;
        };
        settings: wa.LocalSettings;
        chatwoot: {
            enabled: boolean;
            accountId: string;
            token: string;
            url: string;
            signMsg: boolean;
            reopenConversation: boolean;
            conversationPending: boolean;
            mergeBrazilContacts: boolean;
            importContacts: boolean;
            importMessages: boolean;
            daysLimitImportMessages: number;
            number: string;
            nameInbox: string;
            webhookUrl: string;
        };
    }>;
    connectToWhatsapp({ instanceName, number }: InstanceDto): Promise<any>;
    restartInstance({ instanceName }: InstanceDto): Promise<any>;
    connectionState({ instanceName }: InstanceDto): Promise<{
        instance: {
            instanceName: string;
            state: any;
        };
    }>;
    fetchInstances({ instanceName, instanceId, number }: InstanceDto, key: string): Promise<any>;
    setPresence({ instanceName }: InstanceDto, data: SetPresenceDto): Promise<any>;
    logout({ instanceName }: InstanceDto): Promise<{
        status: string;
        error: boolean;
        response: {
            message: string;
        };
    }>;
    deleteInstance({ instanceName }: InstanceDto): Promise<{
        status: string;
        error: boolean;
        response: {
            message: string;
        };
    }>;
}
