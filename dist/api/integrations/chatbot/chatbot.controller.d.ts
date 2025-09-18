import { InstanceDto } from '@api/dto/instance.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { Logger } from '@config/logger.config';
import { IntegrationSession } from '@prisma/client';
export type EmitData = {
    instance: InstanceDto;
    remoteJid: string;
    msg: any;
    pushName?: string;
};
export interface ChatbotControllerInterface {
    integrationEnabled: boolean;
    botRepository: any;
    settingsRepository: any;
    sessionRepository: any;
    userMessageDebounce: {
        [key: string]: {
            message: string;
            timeoutId: NodeJS.Timeout;
        };
    };
    createBot(instance: InstanceDto, data: any): Promise<any>;
    findBot(instance: InstanceDto): Promise<any>;
    fetchBot(instance: InstanceDto, botId: string): Promise<any>;
    updateBot(instance: InstanceDto, botId: string, data: any): Promise<any>;
    deleteBot(instance: InstanceDto, botId: string): Promise<any>;
    settings(instance: InstanceDto, data: any): Promise<any>;
    fetchSettings(instance: InstanceDto): Promise<any>;
    changeStatus(instance: InstanceDto, botId: string, status: string): Promise<any>;
    fetchSessions(instance: InstanceDto, botId: string, remoteJid?: string): Promise<any>;
    ignoreJid(instance: InstanceDto, data: any): Promise<any>;
    emit(data: EmitData): Promise<void>;
}
export declare class ChatbotController {
    prismaRepository: PrismaRepository;
    waMonitor: WAMonitoringService;
    readonly logger: Logger;
    constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    set prisma(prisma: PrismaRepository);
    get prisma(): PrismaRepository;
    set monitor(waMonitor: WAMonitoringService);
    get monitor(): WAMonitoringService;
    emit({ instance, remoteJid, msg, pushName, isIntegration, }: {
        instance: InstanceDto;
        remoteJid: string;
        msg: any;
        pushName?: string;
        isIntegration?: boolean;
    }): Promise<void>;
    processDebounce(userMessageDebounce: any, content: string, remoteJid: string, debounceTime: number, callback: any): void;
    checkIgnoreJids(ignoreJids: any, remoteJid: string): boolean;
    getSession(remoteJid: string, instance: InstanceDto): Promise<{
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
    }>;
    findBotTrigger(botRepository: any, content: string, instance: InstanceDto, session?: IntegrationSession): Promise<any>;
}
