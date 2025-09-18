"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowiseController = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const base_chatbot_controller_1 = require("../../base-chatbot.controller");
class FlowiseController extends base_chatbot_controller_1.BaseChatbotController {
    constructor(flowiseService, prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor);
        this.flowiseService = flowiseService;
        this.logger = new logger_config_1.Logger('FlowiseController');
        this.integrationName = 'Flowise';
        this.integrationEnabled = env_config_1.configService.get('FLOWISE').ENABLED;
        this.userMessageDebounce = {};
        this.botRepository = this.prismaRepository.flowise;
        this.settingsRepository = this.prismaRepository.flowiseSetting;
        this.sessionRepository = this.prismaRepository.integrationSession;
    }
    getFallbackBotId(settings) {
        return settings?.flowiseIdFallback;
    }
    getFallbackFieldName() {
        return 'flowiseIdFallback';
    }
    getIntegrationType() {
        return 'flowise';
    }
    getAdditionalBotData(data) {
        return {
            apiUrl: data.apiUrl,
            apiKey: data.apiKey,
        };
    }
    getAdditionalUpdateFields(data) {
        return {
            apiUrl: data.apiUrl,
            apiKey: data.apiKey,
        };
    }
    async validateNoDuplicatesOnUpdate(botId, instanceId, data) {
        const checkDuplicate = await this.botRepository.findFirst({
            where: {
                id: { not: botId },
                instanceId: instanceId,
                apiUrl: data.apiUrl,
                apiKey: data.apiKey,
            },
        });
        if (checkDuplicate) {
            throw new Error('Flowise already exists');
        }
    }
    async processBot(instance, remoteJid, bot, session, settings, content, pushName, msg) {
        await this.flowiseService.processBot(instance, remoteJid, bot, session, settings, content, pushName, msg);
    }
    async createBot(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException('Flowise is disabled');
        const instanceId = await this.prismaRepository.instance
            .findFirst({
            where: {
                name: instance.instanceName,
            },
        })
            .then((instance) => instance.id);
        const checkDuplicate = await this.botRepository.findFirst({
            where: {
                instanceId: instanceId,
                apiUrl: data.apiUrl,
                apiKey: data.apiKey,
            },
        });
        if (checkDuplicate) {
            throw new Error('Flowise already exists');
        }
        return super.createBot(instance, data);
    }
}
exports.FlowiseController = FlowiseController;
