import { InstanceDto } from '@api/dto/instance.dto';
import { MediaDto } from '@api/integrations/storage/s3/dto/media.dto';
import { S3Service } from '@api/integrations/storage/s3/services/s3.service';
export declare class S3Controller {
    private readonly s3Service;
    constructor(s3Service: S3Service);
    getMedia(instance: InstanceDto, data: MediaDto): Promise<{
        id: string;
        Message: {
            id: string;
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
            instanceId: string;
            webhookUrl: string | null;
            status: string | null;
            sessionId: string | null;
        };
        createdAt: Date;
        mimetype: string;
        fileName: string;
        type: string;
    }[]>;
    getMediaUrl(instance: InstanceDto, data: MediaDto): Promise<{
        id: string;
        Message: {
            id: string;
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
            instanceId: string;
            webhookUrl: string | null;
            status: string | null;
            sessionId: string | null;
        };
        createdAt: Date;
        mimetype: string;
        fileName: string;
        type: string;
        mediaUrl: string;
    }>;
}
