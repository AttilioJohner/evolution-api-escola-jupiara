export type Constructor<T = {}> = new (...args: any[]) => T;
declare const IntegrationDto_base: {
    new (...args: any[]): {
        webhook?: {
            enabled?: boolean;
            events?: string[];
            headers?: import("@prisma/client/runtime/library").JsonValue;
            url?: string;
            byEvents?: boolean;
            base64?: boolean;
        };
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
} & {
    new (...args: any[]): {
        chatwootAccountId?: string;
        chatwootToken?: string;
        chatwootUrl?: string;
        chatwootSignMsg?: boolean;
        chatwootReopenConversation?: boolean;
        chatwootConversationPending?: boolean;
        chatwootMergeBrazilContacts?: boolean;
        chatwootImportContacts?: boolean;
        chatwootImportMessages?: boolean;
        chatwootDaysLimitImportMessages?: number;
        chatwootNameInbox?: string;
        chatwootOrganization?: string;
        chatwootLogo?: string;
        chatwootAutoCreate?: boolean;
    };
} & {
    new (): {};
};
export declare class IntegrationDto extends IntegrationDto_base {
}
export {};
