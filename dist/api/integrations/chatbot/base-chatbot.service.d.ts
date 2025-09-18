import { InstanceDto } from '@api/dto/instance.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ConfigService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { IntegrationSession } from '@prisma/client';
export declare abstract class BaseChatbotService<BotType = any, SettingsType = any> {
    protected readonly logger: Logger;
    protected readonly waMonitor: WAMonitoringService;
    protected readonly prismaRepository: PrismaRepository;
    protected readonly configService?: ConfigService;
    constructor(waMonitor: WAMonitoringService, prismaRepository: PrismaRepository, loggerName: string, configService?: ConfigService);
    protected isImageMessage(content: string): boolean;
    protected isAudioMessage(content: string): boolean;
    protected isJSON(str: string): boolean;
    protected getMediaType(url: string): string | null;
    createNewSession(instance: InstanceDto | any, data: any, type: string): Promise<{
        session: {
            id: string;
            type: string | null;
            createdAt: Date | null;
            instanceId: string;
            pushName: string | null;
            status: import(".prisma/client").$Enums.SessionStatus;
            sessionId: string;
            updatedAt: Date;
            remoteJid: string;
            awaitUser: boolean;
            context: import("@prisma/client/runtime/library").JsonValue | null;
            parameters: import("@prisma/client/runtime/library").JsonValue | null;
            botId: string | null;
        };
    }>;
    process(instance: any, remoteJid: string, bot: BotType, session: IntegrationSession, settings: SettingsType, content: string, pushName?: string, msg?: any): Promise<void>;
    protected sendMessageWhatsApp(instance: any, remoteJid: string, message: string, settings: SettingsType): Promise<void>;
    private sendFormattedText;
    protected initNewSession(instance: any, remoteJid: string, bot: BotType, settings: SettingsType, session: IntegrationSession, content: string, pushName?: string | any, msg?: any): Promise<void>;
    protected abstract getBotType(): string;
    protected abstract sendMessageToBot(instance: any, session: IntegrationSession, settings: SettingsType, bot: BotType, remoteJid: string, pushName: string, content: string, msg?: any): Promise<void>;
}
