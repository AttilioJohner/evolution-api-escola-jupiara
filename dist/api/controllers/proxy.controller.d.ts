import { InstanceDto } from '@api/dto/instance.dto';
import { ProxyDto } from '@api/dto/proxy.dto';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ProxyService } from '@api/services/proxy.service';
export declare class ProxyController {
    private readonly proxyService;
    private readonly waMonitor;
    constructor(proxyService: ProxyService, waMonitor: WAMonitoringService);
    createProxy(instance: InstanceDto, data: ProxyDto): Promise<{
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
    }>;
    findProxy(instance: InstanceDto): Promise<{
        id: string;
        createdAt: Date | null;
        instanceId: string;
        enabled: boolean;
        updatedAt: Date;
        host: string;
        port: string;
        protocol: string;
        username: string;
        password: string;
    }>;
    testProxy(proxy: ProxyDto): Promise<boolean>;
}
