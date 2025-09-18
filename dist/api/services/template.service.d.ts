import { InstanceDto } from '@api/dto/instance.dto';
import { TemplateDto } from '@api/dto/template.dto';
import { PrismaRepository } from '@api/repository/repository.service';
import { ConfigService } from '@config/env.config';
import { WAMonitoringService } from './monitor.service';
export declare class TemplateService {
    private readonly waMonitor;
    readonly prismaRepository: PrismaRepository;
    private readonly configService;
    constructor(waMonitor: WAMonitoringService, prismaRepository: PrismaRepository, configService: ConfigService);
    private readonly logger;
    private businessId;
    private token;
    find(instance: InstanceDto): Promise<any>;
    create(instance: InstanceDto, data: TemplateDto): Promise<{
        id: string;
        createdAt: Date | null;
        instanceId: string;
        name: string;
        webhookUrl: string | null;
        updatedAt: Date;
        template: import("@prisma/client/runtime/library").JsonValue;
        templateId: string;
    }>;
    private requestTemplate;
}
