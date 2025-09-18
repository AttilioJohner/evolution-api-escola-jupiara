"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const logger_config_1 = require("@config/logger.config");
const axios_1 = __importDefault(require("axios"));
class TemplateService {
    constructor(waMonitor, prismaRepository, configService) {
        this.waMonitor = waMonitor;
        this.prismaRepository = prismaRepository;
        this.configService = configService;
        this.logger = new logger_config_1.Logger('TemplateService');
    }
    async find(instance) {
        const getInstance = await this.waMonitor.waInstances[instance.instanceName].instance;
        if (!getInstance) {
            throw new Error('Instance not found');
        }
        this.businessId = getInstance.businessId;
        this.token = getInstance.token;
        const response = await this.requestTemplate({}, 'GET');
        if (!response) {
            throw new Error('Error to create template');
        }
        return response.data;
    }
    async create(instance, data) {
        try {
            const getInstance = await this.waMonitor.waInstances[instance.instanceName].instance;
            if (!getInstance) {
                throw new Error('Instance not found');
            }
            this.businessId = getInstance.businessId;
            this.token = getInstance.token;
            const postData = {
                name: data.name,
                category: data.category,
                allow_category_change: data.allowCategoryChange,
                language: data.language,
                components: data.components,
            };
            const response = await this.requestTemplate(postData, 'POST');
            if (!response || response.error) {
                throw new Error('Error to create template');
            }
            const template = await this.prismaRepository.template.create({
                data: {
                    templateId: response.id,
                    name: data.name,
                    template: response,
                    webhookUrl: data.webhookUrl,
                    instanceId: getInstance.id,
                },
            });
            return template;
        }
        catch (error) {
            this.logger.error(error);
            throw new Error('Error to create template');
        }
    }
    async requestTemplate(data, method) {
        try {
            let urlServer = this.configService.get('WA_BUSINESS').URL;
            const version = this.configService.get('WA_BUSINESS').VERSION;
            urlServer = `${urlServer}/${version}/${this.businessId}/message_templates`;
            const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` };
            if (method === 'GET') {
                const result = await axios_1.default.get(urlServer, { headers });
                return result.data;
            }
            else if (method === 'POST') {
                const result = await axios_1.default.post(urlServer, data, { headers });
                return result.data;
            }
        }
        catch (e) {
            this.logger.error(e.response.data);
            return e.response.data.error;
        }
    }
}
exports.TemplateService = TemplateService;
