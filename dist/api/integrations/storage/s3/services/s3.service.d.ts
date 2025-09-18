import { InstanceDto } from '@api/dto/instance.dto';
import { MediaDto } from '@api/integrations/storage/s3/dto/media.dto';
import { PrismaRepository } from '@api/repository/repository.service';
export declare class S3Service {
    private readonly prismaRepository;
    constructor(prismaRepository: PrismaRepository);
    private readonly logger;
    getMedia(instance: InstanceDto, query?: MediaDto): Promise<{
        id: string;
        fileName: string;
        type: string;
        mimetype: string;
        createdAt: Date;
        Message: {
            id: string;
            instanceId: string;
            message: import("@prisma/client/runtime/library").JsonValue;
            key: import("@prisma/client/runtime/library").JsonValue;
            pushName: string | null;
            participant: string | null;
            messageType: string;
            contextInfo: import("@prisma/client/runtime/library").JsonValue | null;
            source: import(".prisma/client").$Enums.DeviceMessage;
            messageTimestamp: number;
            chatwootMessageId: number | null;
            chatwootInboxId: number | null;
            chatwootConversationId: number | null;
            chatwootContactInboxSourceId: string | null;
            chatwootIsRead: boolean | null;
            webhookUrl: string | null;
            status: string | null;
            sessionId: string | null;
        };
    }[]>;
    getMediaUrl(instance: InstanceDto, data: MediaDto): Promise<{
        id: string;
        fileName: string;
        type: string;
        mimetype: string;
        createdAt: Date;
        Message: {
            id: string;
            instanceId: string;
            message: import("@prisma/client/runtime/library").JsonValue;
            key: import("@prisma/client/runtime/library").JsonValue;
            pushName: string | null;
            participant: string | null;
            messageType: string;
            contextInfo: import("@prisma/client/runtime/library").JsonValue | null;
            source: import(".prisma/client").$Enums.DeviceMessage;
            messageTimestamp: number;
            chatwootMessageId: number | null;
            chatwootInboxId: number | null;
            chatwootConversationId: number | null;
            chatwootContactInboxSourceId: string | null;
            chatwootIsRead: boolean | null;
            webhookUrl: string | null;
            status: string | null;
            sessionId: string | null;
        };
        mediaUrl: string;
    }>;
}
