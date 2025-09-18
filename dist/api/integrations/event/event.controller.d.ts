import { EventDto } from '@api/integrations/event/event.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { wa } from '@api/types/wa.types';
export type EmitData = {
    instanceName: string;
    origin: string;
    event: string;
    data: any;
    serverUrl: string;
    dateTime: string;
    sender: string;
    apiKey?: string;
    local?: boolean;
    integration?: string[];
};
export interface EventControllerInterface {
    set(instanceName: string, data: any): Promise<any>;
    get(instanceName: string): Promise<any>;
    emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, local }: EmitData): Promise<void>;
}
export declare class EventController {
    prismaRepository: PrismaRepository;
    protected waMonitor: WAMonitoringService;
    private integrationStatus;
    private integrationName;
    constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService, integrationStatus: boolean, integrationName: string);
    set prisma(prisma: PrismaRepository);
    get prisma(): PrismaRepository;
    set monitor(waMonitor: WAMonitoringService);
    get monitor(): WAMonitoringService;
    set name(name: string);
    get name(): string;
    set status(status: boolean);
    get status(): boolean;
    set(instanceName: string, data: EventDto): Promise<wa.LocalEvent>;
    get(instanceName: string): Promise<wa.LocalEvent>;
    static readonly events: string[];
}
