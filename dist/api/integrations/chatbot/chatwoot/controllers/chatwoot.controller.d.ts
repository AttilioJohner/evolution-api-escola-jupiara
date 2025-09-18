import { InstanceDto } from '@api/dto/instance.dto';
import { ChatwootDto } from '@api/integrations/chatbot/chatwoot/dto/chatwoot.dto';
import { ChatwootService } from '@api/integrations/chatbot/chatwoot/services/chatwoot.service';
import { PrismaRepository } from '@api/repository/repository.service';
import { ConfigService } from '@config/env.config';
export declare class ChatwootController {
    private readonly chatwootService;
    private readonly configService;
    private readonly prismaRepository;
    constructor(chatwootService: ChatwootService, configService: ConfigService, prismaRepository: PrismaRepository);
    createChatwoot(instance: InstanceDto, data: ChatwootDto): Promise<{
        webhook_url: string;
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
    }>;
    findChatwoot(instance: InstanceDto): Promise<ChatwootDto & {
        webhook_url: string;
    }>;
    receiveWebhook(instance: InstanceDto, data: any): Promise<{
        message: string;
    }>;
}
