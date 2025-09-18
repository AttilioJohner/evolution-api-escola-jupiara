import { OfferCallDto } from '@api/dto/call.dto';
import { InstanceDto } from '@api/dto/instance.dto';
import { WAMonitoringService } from '@api/services/monitor.service';
export declare class CallController {
    private readonly waMonitor;
    constructor(waMonitor: WAMonitoringService);
    offerCall({ instanceName }: InstanceDto, data: OfferCallDto): Promise<any>;
}
