import { InstanceDto } from '@api/dto/instance.dto';
import { ProxyDto } from '@api/dto/proxy.dto';
import { Proxy } from '@prisma/client';
import { WAMonitoringService } from './monitor.service';
export declare class ProxyService {
    private readonly waMonitor;
    constructor(waMonitor: WAMonitoringService);
    private readonly logger;
    create(instance: InstanceDto, data: ProxyDto): {
        proxy: {
            proxy: ProxyDto;
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
    };
    find(instance: InstanceDto): Promise<Proxy>;
}
