import { InstanceDto } from '@api/dto/instance.dto';
import { ChatwootDto } from '@api/integrations/chatbot/chatwoot/dto/chatwoot.dto';
import { ChatwootService } from '@api/integrations/chatbot/chatwoot/services/chatwoot.service';
import { inbox } from '@figuro/chatwoot-sdk';
import { Chatwoot as ChatwootModel, Contact, Message } from '@prisma/client';
import { proto } from 'baileys';
type ChatwootUser = {
    user_type: string;
    user_id: number;
};
type FksChatwoot = {
    phone_number: string;
    contact_id: string;
    conversation_id: string;
};
type firstLastTimestamp = {
    first: number;
    last: number;
};
type IWebMessageInfo = Omit<proto.IWebMessageInfo, 'key'> & Partial<Pick<proto.IWebMessageInfo, 'key'>>;
declare class ChatwootImport {
    private logger;
    private repositoryMessagesCache;
    private historyMessages;
    private historyContacts;
    getRepositoryMessagesCache(instance: InstanceDto): Set<string>;
    setRepositoryMessagesCache(instance: InstanceDto, repositoryMessagesCache: Set<string>): void;
    deleteRepositoryMessagesCache(instance: InstanceDto): void;
    addHistoryMessages(instance: InstanceDto, messagesRaw: Message[]): void;
    addHistoryContacts(instance: InstanceDto, contactsRaw: Contact[]): void;
    deleteHistoryMessages(instance: InstanceDto): void;
    deleteHistoryContacts(instance: InstanceDto): void;
    clearAll(instance: InstanceDto): void;
    getHistoryMessagesLenght(instance: InstanceDto): number;
    importHistoryContacts(instance: InstanceDto, provider: ChatwootDto): Promise<number>;
    getExistingSourceIds(sourceIds: string[], conversationId?: number): Promise<Set<string>>;
    importHistoryMessages(instance: InstanceDto, chatwootService: ChatwootService, inbox: inbox, provider: ChatwootModel): Promise<number>;
    selectOrCreateFksFromChatwoot(provider: ChatwootModel, inbox: inbox, phoneNumbersWithTimestamp: Map<string, firstLastTimestamp>, messagesByPhoneNumber: Map<string, Message[]>): Promise<Map<string, FksChatwoot>>;
    getChatwootUser(provider: ChatwootModel): Promise<ChatwootUser>;
    createMessagesMapByPhoneNumber(messages: Message[]): Map<string, Message[]>;
    getContactsOrderByRecentConversations(inbox: inbox, provider: ChatwootModel, limit?: number): Promise<{
        id: number;
        phone_number: string;
        identifier: string;
    }[]>;
    getContentMessage(chatwootService: ChatwootService, msg: IWebMessageInfo): any;
    sliceIntoChunks(arr: any[], chunkSize: number): any[];
    isGroup(remoteJid: string): boolean;
    isIgnorePhoneNumber(remoteJid: string): boolean;
    updateMessageSourceID(messageId: string | number, sourceId: string): any;
}
export declare const chatwootImport: ChatwootImport;
export {};
