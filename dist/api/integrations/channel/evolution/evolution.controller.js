"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionController = void 0;
const logger_config_1 = require("@config/logger.config");
const channel_controller_1 = require("../channel.controller");
class EvolutionController extends channel_controller_1.ChannelController {
    constructor(prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor);
        this.logger = new logger_config_1.Logger('EvolutionController');
    }
    async receiveWebhook(data) {
        const numberId = data.numberId;
        if (!numberId) {
            this.logger.error('WebhookService -> receiveWebhookEvolution -> numberId not found');
            return;
        }
        const instance = await this.prismaRepository.instance.findFirst({
            where: { number: numberId },
        });
        if (!instance) {
            this.logger.error('WebhookService -> receiveWebhook -> instance not found');
            return;
        }
        await this.waMonitor.waInstances[instance.name].connectToWhatsapp(data);
        return {
            status: 'success',
        };
    }
}
exports.EvolutionController = EvolutionController;
