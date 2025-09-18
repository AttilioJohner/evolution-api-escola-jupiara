"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaController = void 0;
const logger_config_1 = require("@config/logger.config");
const axios_1 = __importDefault(require("axios"));
const channel_controller_1 = require("../channel.controller");
class MetaController extends channel_controller_1.ChannelController {
    constructor(prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor);
        this.logger = new logger_config_1.Logger('MetaController');
    }
    async receiveWebhook(data) {
        if (data.object === 'whatsapp_business_account') {
            if (data.entry[0]?.changes[0]?.field === 'message_template_status_update') {
                const template = await this.prismaRepository.template.findFirst({
                    where: { templateId: `${data.entry[0].changes[0].value.message_template_id}` },
                });
                if (!template) {
                    console.log('template not found');
                    return;
                }
                const { webhookUrl } = template;
                await axios_1.default.post(webhookUrl, data.entry[0].changes[0].value, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                return;
            }
            data.entry?.forEach(async (entry) => {
                const numberId = entry.changes[0].value.metadata.phone_number_id;
                if (!numberId) {
                    this.logger.error('WebhookService -> receiveWebhookMeta -> numberId not found');
                    return {
                        status: 'success',
                    };
                }
                const instance = await this.prismaRepository.instance.findFirst({
                    where: { number: numberId },
                });
                if (!instance) {
                    this.logger.error('WebhookService -> receiveWebhookMeta -> instance not found');
                    return {
                        status: 'success',
                    };
                }
                await this.waMonitor.waInstances[instance.name].connectToWhatsapp(data);
                return {
                    status: 'success',
                };
            });
        }
        return {
            status: 'success',
        };
    }
}
exports.MetaController = MetaController;
