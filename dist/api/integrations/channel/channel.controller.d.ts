import { InstanceDto } from '@api/dto/instance.dto';
import { ProviderFiles } from '@api/provider/sessions';
import { PrismaRepository } from '@api/repository/repository.service';
import { CacheService } from '@api/services/cache.service';
import { WAMonitoringService } from '@api/services/monitor.service';
import { ConfigService } from '@config/env.config';
import EventEmitter2 from 'eventemitter2';
import { EvolutionStartupService } from './evolution/evolution.channel.service';
import { BusinessStartupService } from './meta/whatsapp.business.service';
import { BaileysStartupService } from './whatsapp/whatsapp.baileys.service';
type ChannelDataType = {
    configService: ConfigService;
    eventEmitter: EventEmitter2;
    prismaRepository: PrismaRepository;
    cache: CacheService;
    chatwootCache: CacheService;
    baileysCache: CacheService;
    providerFiles: ProviderFiles;
};
export interface ChannelControllerInterface {
    receiveWebhook(data: any): Promise<any>;
}
export declare class ChannelController {
    prismaRepository: PrismaRepository;
    waMonitor: WAMonitoringService;
    constructor(prismaRepository: PrismaRepository, waMonitor: WAMonitoringService);
    set prisma(prisma: PrismaRepository);
    get prisma(): PrismaRepository;
    set monitor(waMonitor: WAMonitoringService);
    get monitor(): WAMonitoringService;
    init(instanceData: InstanceDto, data: ChannelDataType): BusinessStartupService | EvolutionStartupService | BaileysStartupService;
}
export {};
