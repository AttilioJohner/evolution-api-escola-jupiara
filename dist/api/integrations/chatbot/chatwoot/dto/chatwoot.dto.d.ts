import { Constructor } from '@api/integrations/integration.dto';
export declare class ChatwootDto {
    enabled?: boolean;
    accountId?: string;
    token?: string;
    url?: string;
    nameInbox?: string;
    signMsg?: boolean;
    signDelimiter?: string;
    number?: string;
    reopenConversation?: boolean;
    conversationPending?: boolean;
    mergeBrazilContacts?: boolean;
    importContacts?: boolean;
    importMessages?: boolean;
    daysLimitImportMessages?: number;
    autoCreate?: boolean;
    organization?: string;
    logo?: string;
    ignoreJids?: string[];
}
export declare function ChatwootInstanceMixin<TBase extends Constructor>(Base: TBase): {
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
} & TBase;
