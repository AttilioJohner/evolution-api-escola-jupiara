"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelController = void 0;
const wa_types_1 = require("@api/types/wa.types");
const _exceptions_1 = require("@exceptions");
const evolution_channel_service_1 = require("./evolution/evolution.channel.service");
const whatsapp_business_service_1 = require("./meta/whatsapp.business.service");
const whatsapp_baileys_service_1 = require("./whatsapp/whatsapp.baileys.service");
class ChannelController {
    constructor(prismaRepository, waMonitor) {
        this.prisma = prismaRepository;
        this.monitor = waMonitor;
    }
    set prisma(prisma) {
        this.prismaRepository = prisma;
    }
    get prisma() {
        return this.prismaRepository;
    }
    set monitor(waMonitor) {
        this.waMonitor = waMonitor;
    }
    get monitor() {
        return this.waMonitor;
    }
    init(instanceData, data) {
        if (!instanceData.token && instanceData.integration === wa_types_1.Integration.WHATSAPP_BUSINESS) {
            throw new _exceptions_1.BadRequestException('token is required');
        }
        if (instanceData.integration === wa_types_1.Integration.WHATSAPP_BUSINESS) {
            return new whatsapp_business_service_1.BusinessStartupService(data.configService, data.eventEmitter, data.prismaRepository, data.cache, data.chatwootCache, data.baileysCache, data.providerFiles);
        }
        if (instanceData.integration === wa_types_1.Integration.EVOLUTION) {
            return new evolution_channel_service_1.EvolutionStartupService(data.configService, data.eventEmitter, data.prismaRepository, data.cache, data.chatwootCache);
        }
        if (instanceData.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
            return new whatsapp_baileys_service_1.BaileysStartupService(data.configService, data.eventEmitter, data.prismaRepository, data.cache, data.chatwootCache, data.baileysCache, data.providerFiles);
        }
        return null;
    }
}
exports.ChannelController = ChannelController;
