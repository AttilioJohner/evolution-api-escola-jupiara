import { getCatalogDto, getCollectionsDto } from '@api/dto/business.dto';
import { InstanceDto } from '@api/dto/instance.dto';
import { WAMonitoringService } from '@api/services/monitor.service';
export declare class BusinessController {
    private readonly waMonitor;
    constructor(waMonitor: WAMonitoringService);
    fetchCatalog({ instanceName }: InstanceDto, data: getCatalogDto): Promise<any>;
    fetchCollections({ instanceName }: InstanceDto, data: getCollectionsDto): Promise<any>;
}
