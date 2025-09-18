import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { SQS } from '@aws-sdk/client-sqs';
import { EmitData, EventController, EventControllerInterface } from '../event.controller';
import { EventDto } from '../event.dto';
export declare class SqsController extends EventController implements EventControllerInterface {
    private sqs;
    private readonly logger;
    constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    init(): void;
    private set channel(value);
    get channel(): SQS;
    set(instanceName: string, data: EventDto): Promise<any>;
    emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, integration, }: EmitData): Promise<void>;
    private saveQueues;
    private listQueuesByInstance;
    private removeQueuesByInstance;
}
