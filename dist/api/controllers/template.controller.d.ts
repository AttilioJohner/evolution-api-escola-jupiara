import { InstanceDto } from '@api/dto/instance.dto';
import { TemplateDto } from '@api/dto/template.dto';
import { TemplateService } from '@api/services/template.service';
export declare class TemplateController {
    private readonly templateService;
    constructor(templateService: TemplateService);
    createTemplate(instance: InstanceDto, data: TemplateDto): Promise<{
        id: string;
        name: string;
        instanceId: string;
        webhookUrl: string | null;
        createdAt: Date | null;
        updatedAt: Date;
        template: import("@prisma/client/runtime/library").JsonValue;
        templateId: string;
    }>;
    findTemplate(instance: InstanceDto): Promise<any>;
}
