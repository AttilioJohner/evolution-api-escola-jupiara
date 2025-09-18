import { InstanceDto } from '@api/dto/instance.dto';
import { HandleLabelDto } from '@api/dto/label.dto';
import { WAMonitoringService } from '@api/services/monitor.service';
export declare class LabelController {
    private readonly waMonitor;
    constructor(waMonitor: WAMonitoringService);
    fetchLabels({ instanceName }: InstanceDto): Promise<any>;
    handleLabel({ instanceName }: InstanceDto, data: HandleLabelDto): Promise<any>;
}
