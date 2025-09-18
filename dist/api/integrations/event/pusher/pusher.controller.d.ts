import { EventDto } from '@api/integrations/event/event.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { wa } from '@api/types/wa.types';
import { EmitData, EventController, EventControllerInterface } from '../event.controller';
export declare class PusherController extends EventController implements EventControllerInterface {
    private readonly logger;
    private pusherClients;
    private globalPusherClient;
    private pusherConfig;
    constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    init(): Promise<void>;
    set(instanceName: string, data: EventDto): Promise<wa.LocalPusher>;
    emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, local, integration, }: EmitData): Promise<void>;
}
