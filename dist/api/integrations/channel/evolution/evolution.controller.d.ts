import { PrismaRepository } from '@api/repository/repository.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ChannelController, ChannelControllerInterface } from '../channel.controller';
export declare class EvolutionController extends ChannelController implements ChannelControllerInterface {
    private readonly logger;
    constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    integrationEnabled: boolean;
    receiveWebhook(data: any): Promise<{
        status: string;
    }>;
}
