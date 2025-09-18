import { EventDto } from '@api/integrations/event/event.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { wa } from '@api/types/wa.types';
import { EmitData, EventController, EventControllerInterface } from '../event.controller';
export declare class WebhookController extends EventController implements EventControllerInterface {
    private readonly logger;
    constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    set(instanceName: string, data: EventDto): Promise<wa.LocalWebHook>;
    emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, local, integration, }: EmitData): Promise<void>;
    private retryWebhookRequest;
    private generateJwtToken;
}
