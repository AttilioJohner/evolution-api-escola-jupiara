import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { NatsConnection } from 'nats';
import { EmitData, EventController, EventControllerInterface } from '../event.controller';
export declare class NatsController extends EventController implements EventControllerInterface {
    natsClient: NatsConnection | null;
    private readonly logger;
    private readonly sc;
    constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    init(): Promise<void>;
    emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, integration, }: EmitData): Promise<void>;
    private initGlobalSubscriptions;
}
