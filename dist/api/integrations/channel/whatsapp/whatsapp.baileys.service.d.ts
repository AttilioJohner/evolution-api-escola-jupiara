import { getCollectionsDto } from '@api/dto/business.dto';
import { OfferCallDto } from '@api/dto/call.dto';
import { ArchiveChatDto, BlockUserDto, DeleteMessage, getBase64FromMediaMessageDto, LastMessage, MarkChatUnreadDto, NumberBusiness, OnWhatsAppDto, PrivacySettingDto, ReadMessageDto, SendPresenceDto, UpdateMessageDto, WhatsAppNumberDto } from '@api/dto/chat.dto';
import { AcceptGroupInvite, CreateGroupDto, GetParticipant, GroupDescriptionDto, GroupInvite, GroupJid, GroupPictureDto, GroupSendInvite, GroupSubjectDto, GroupToggleEphemeralDto, GroupUpdateParticipantDto, GroupUpdateSettingDto } from '@api/dto/group.dto';
import { SetPresenceDto } from '@api/dto/instance.dto';
import { HandleLabelDto, LabelDto } from '@api/dto/label.dto';
import { SendAudioDto, SendButtonsDto, SendContactDto, SendListDto, SendLocationDto, SendMediaDto, SendPollDto, SendPtvDto, SendReactionDto, SendStatusDto, SendStickerDto, SendTextDto } from '@api/dto/sendMessage.dto';
import { ProviderFiles } from '@api/provider/sessions';
import { PrismaRepository, Query } from '@api/repository/repository.service';
import { CacheService } from '@api/services/cache.service';
import { ChannelStartupService } from '@api/services/channel.service';
import { wa } from '@api/types/wa.types';
import { ConfigService } from '@config/env.config';
import { Message } from '@prisma/client';
import { CatalogCollection, Contact, GetCatalogOptions, GroupMetadata, Product, proto, WAPresence, WASocket } from 'baileys';
import EventEmitter2 from 'eventemitter2';
export declare class BaileysStartupService extends ChannelStartupService {
    readonly configService: ConfigService;
    readonly eventEmitter: EventEmitter2;
    readonly prismaRepository: PrismaRepository;
    readonly cache: CacheService;
    readonly chatwootCache: CacheService;
    readonly baileysCache: CacheService;
    private readonly providerFiles;
    private messageProcessor;
    constructor(configService: ConfigService, eventEmitter: EventEmitter2, prismaRepository: PrismaRepository, cache: CacheService, chatwootCache: CacheService, baileysCache: CacheService, providerFiles: ProviderFiles);
    private authStateProvider;
    private readonly msgRetryCounterCache;
    private readonly userDevicesCache;
    private endSession;
    private logBaileys;
    stateConnection: wa.StateConnection;
    phoneNumber: string;
    get connectionStatus(): wa.StateConnection;
    logoutInstance(): Promise<void>;
    getProfileName(): Promise<string>;
    getProfileStatus(): Promise<any>;
    get profilePictureUrl(): string;
    get qrCode(): wa.QrCode;
    private connectionUpdate;
    private getMessage;
    private defineAuthState;
    private createClient;
    connectToWhatsapp(number?: string): Promise<WASocket>;
    reloadConnection(): Promise<WASocket>;
    private readonly chatHandle;
    private readonly contactHandle;
    private readonly messageHandle;
    private readonly groupHandler;
    private readonly labelHandle;
    private eventHandler;
    private historySyncNotification;
    private isSyncNotificationFromUsedSyncType;
    profilePicture(number: string): Promise<{
        wuid: string;
        profilePictureUrl: string;
    }>;
    getStatus(number: string): Promise<{
        wuid: string;
        status: any;
    }>;
    fetchProfile(instanceName: string, number?: string): Promise<{
        wuid: string;
        name: string;
        numberExists: boolean;
        picture: string;
        status: any;
        isBusiness: boolean;
        email: string;
        description: string;
        website: string;
        os?: undefined;
    } | {
        wuid: string;
        name: any;
        picture: any;
        status: any;
        os: any;
        isBusiness: boolean;
        numberExists?: undefined;
        email?: undefined;
        description?: undefined;
        website?: undefined;
    }>;
    offerCall({ number, isVideo, callDuration }: OfferCallDto): Promise<any>;
    private sendMessage;
    private sendMessageWithTyping;
    sendPresence(data: SendPresenceDto): Promise<{
        presence: WAPresence;
    }>;
    setPresence(data: SetPresenceDto): Promise<{
        presence: WAPresence;
    }>;
    textMessage(data: SendTextDto, isIntegration?: boolean): Promise<any>;
    pollMessage(data: SendPollDto): Promise<any>;
    private formatStatusMessage;
    statusMessage(data: SendStatusDto, file?: any): Promise<any>;
    private prepareMediaMessage;
    private convertToWebP;
    private isAnimatedWebp;
    private isAnimated;
    mediaSticker(data: SendStickerDto, file?: any): Promise<any>;
    mediaMessage(data: SendMediaDto, file?: any, isIntegration?: boolean): Promise<any>;
    ptvMessage(data: SendPtvDto, file?: any, isIntegration?: boolean): Promise<any>;
    processAudioMp4(audio: string): Promise<Buffer<ArrayBufferLike>>;
    processAudio(audio: string): Promise<Buffer>;
    audioWhatsapp(data: SendAudioDto, file?: any, isIntegration?: boolean): Promise<any>;
    private generateRandomId;
    private toJSONString;
    private readonly mapType;
    private readonly mapKeyType;
    buttonMessage(data: SendButtonsDto): Promise<any>;
    locationMessage(data: SendLocationDto): Promise<any>;
    listMessage(data: SendListDto): Promise<any>;
    contactMessage(data: SendContactDto): Promise<any>;
    reactionMessage(data: SendReactionDto): Promise<any>;
    whatsappNumber(data: WhatsAppNumberDto): Promise<OnWhatsAppDto[]>;
    markMessageAsRead(data: ReadMessageDto): Promise<{
        message: string;
        read: string;
    }>;
    getLastMessage(number: string): Promise<LastMessage>;
    archiveChat(data: ArchiveChatDto): Promise<{
        chatId: string;
        archived: boolean;
    }>;
    markChatUnread(data: MarkChatUnreadDto): Promise<{
        chatId: string;
        markedChatUnread: boolean;
    }>;
    deleteMessage(del: DeleteMessage): Promise<proto.WebMessageInfo>;
    mapMediaType(mediaType: any): Promise<any>;
    getBase64FromMediaMessage(data: getBase64FromMediaMessageDto, getBuffer?: boolean): Promise<{
        mediaType: string;
        fileName: any;
        caption: any;
        size: {
            fileLength: any;
            height: any;
            width: any;
        };
        mimetype: any;
        base64: string;
        buffer: Buffer<ArrayBufferLike>;
    }>;
    fetchPrivacySettings(): Promise<{
        readreceipts: string;
        profile: string;
        status: string;
        online: string;
        last: string;
        groupadd: string;
    }>;
    updatePrivacySettings(settings: PrivacySettingDto): Promise<{
        update: string;
        data: {
            readreceipts: import("baileys").WAReadReceiptsValue;
            profile: import("baileys").WAPrivacyValue;
            status: import("baileys").WAPrivacyValue;
            online: import("baileys").WAPrivacyOnlineValue;
            last: import("baileys").WAPrivacyValue;
            groupadd: string;
        };
    }>;
    fetchBusinessProfile(number: string): Promise<NumberBusiness>;
    updateProfileName(name: string): Promise<{
        update: string;
    }>;
    updateProfileStatus(status: string): Promise<{
        update: string;
    }>;
    updateProfilePicture(picture: string): Promise<{
        update: string;
    }>;
    removeProfilePicture(): Promise<{
        update: string;
    }>;
    blockUser(data: BlockUserDto): Promise<{
        block: string;
    }>;
    private formatUpdateMessage;
    updateMessage(data: UpdateMessageDto): Promise<proto.WebMessageInfo>;
    fetchLabels(): Promise<LabelDto[]>;
    handleLabel(data: HandleLabelDto): Promise<{
        numberJid: string;
        labelId: string;
        add: boolean;
        remove?: undefined;
    } | {
        numberJid: string;
        labelId: string;
        remove: boolean;
        add?: undefined;
    }>;
    private updateGroupMetadataCache;
    private getGroupMetadataCache;
    createGroup(create: CreateGroupDto): Promise<GroupMetadata>;
    updateGroupPicture(picture: GroupPictureDto): Promise<{
        update: string;
    }>;
    updateGroupSubject(data: GroupSubjectDto): Promise<{
        update: string;
    }>;
    updateGroupDescription(data: GroupDescriptionDto): Promise<{
        update: string;
    }>;
    findGroup(id: GroupJid, reply?: 'inner' | 'out'): Promise<{
        id: string;
        subject: string;
        subjectOwner: string;
        subjectTime: number;
        pictureUrl: string;
        size: number;
        creation: number;
        owner: string;
        desc: string;
        descId: string;
        restrict: boolean;
        announce: boolean;
        participants: import("baileys").GroupParticipant[];
        isCommunity: boolean;
        isCommunityAnnounce: boolean;
        linkedParent: string;
    }>;
    fetchAllGroups(getParticipants: GetParticipant): Promise<any[]>;
    inviteCode(id: GroupJid): Promise<{
        inviteUrl: string;
        inviteCode: string;
    }>;
    inviteInfo(id: GroupInvite): Promise<GroupMetadata>;
    sendInvite(id: GroupSendInvite): Promise<{
        send: boolean;
        inviteUrl: string;
    }>;
    acceptInviteCode(id: AcceptGroupInvite): Promise<{
        accepted: boolean;
        groupJid: string;
    }>;
    revokeInviteCode(id: GroupJid): Promise<{
        revoked: boolean;
        inviteCode: string;
    }>;
    findParticipants(id: GroupJid): Promise<{
        participants: {
            name: string;
            imgUrl: string;
            id: string;
            lid?: string;
            notify?: string;
            verifiedName?: string;
            status?: string;
            isAdmin?: boolean;
            isSuperAdmin?: boolean;
            admin?: "admin" | "superadmin" | null;
        }[];
    }>;
    updateGParticipant(update: GroupUpdateParticipantDto): Promise<{
        updateParticipants: {
            status: string;
            jid: string;
            content: import("baileys").BinaryNode;
        }[];
    }>;
    updateGSetting(update: GroupUpdateSettingDto): Promise<{
        updateSetting: void;
    }>;
    toggleEphemeral(update: GroupToggleEphemeralDto): Promise<{
        success: boolean;
    }>;
    leaveGroup(id: GroupJid): Promise<{
        groupJid: string;
        leave: boolean;
    }>;
    templateMessage(): Promise<void>;
    private prepareMessage;
    private syncChatwootLostMessages;
    private updateMessagesReadedByTimestamp;
    private updateChatUnreadMessages;
    private addLabel;
    private removeLabel;
    baileysOnWhatsapp(jid: string): Promise<{
        exists: boolean;
        jid: string;
    }[]>;
    baileysProfilePictureUrl(jid: string, type: 'image' | 'preview', timeoutMs: number): Promise<string>;
    baileysAssertSessions(jids: string[], force: boolean): Promise<boolean>;
    baileysCreateParticipantNodes(jids: string[], message: proto.IMessage, extraAttrs: any): Promise<any>;
    baileysSendNode(stanza: any): Promise<void>;
    baileysGetUSyncDevices(jids: string[], useCache: boolean, ignoreZeroDevices: boolean): Promise<{}>;
    baileysGenerateMessageTag(): Promise<string>;
    baileysSignalRepositoryDecryptMessage(jid: string, type: 'pkmsg' | 'msg', ciphertext: string): Promise<string>;
    baileysGetAuthState(): Promise<{
        me: Contact;
        account: proto.IADVSignedDeviceIdentity;
    }>;
    fetchCatalog(instanceName: string, data: getCollectionsDto): Promise<{
        wuid: string;
        numberExists: boolean;
        isBusiness: boolean;
        catalogLength: number;
        catalog: Product[];
        name?: undefined;
    } | {
        wuid: string;
        name: any;
        isBusiness: boolean;
        numberExists?: undefined;
        catalogLength?: undefined;
        catalog?: undefined;
    }>;
    getCatalog({ jid, limit, cursor, }: GetCatalogOptions): Promise<{
        products: Product[];
        nextPageCursor: string | undefined;
    }>;
    fetchCollections(instanceName: string, data: getCollectionsDto): Promise<{
        wuid: string;
        name: string;
        numberExists: boolean;
        isBusiness: boolean;
        collectionsLength: number;
        collections: CatalogCollection[];
    } | {
        wuid: string;
        name: any;
        isBusiness: boolean;
        numberExists?: undefined;
        collectionsLength?: undefined;
        collections?: undefined;
    }>;
    getCollections(jid?: string | undefined, limit?: number): Promise<CatalogCollection[]>;
    fetchMessages(query: Query<Message>): Promise<{
        messages: {
            total: number;
            pages: number;
            currentPage: number;
            records: {
                id: string;
                instanceId: string;
                message: import("@prisma/client/runtime/library").JsonValue;
                key: import("@prisma/client/runtime/library").JsonValue;
                pushName: string;
                messageType: string;
                contextInfo: import("@prisma/client/runtime/library").JsonValue;
                source: import(".prisma/client").$Enums.DeviceMessage;
                messageTimestamp: number;
                MessageUpdate: {
                    status: string;
                }[];
            }[];
        };
    }>;
}
