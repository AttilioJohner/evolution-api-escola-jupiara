"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvoaiController = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const base_chatbot_controller_1 = require("../../base-chatbot.controller");
class EvoaiController extends base_chatbot_controller_1.BaseChatbotController {
    constructor(evoaiService, prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor);
        this.evoaiService = evoaiService;
        this.logger = new logger_config_1.Logger('EvoaiController');
        this.integrationName = 'Evoai';
        this.integrationEnabled = env_config_1.configService.get('EVOAI').ENABLED;
        this.userMessageDebounce = {};
        this.botRepository = this.prismaRepository.evoai;
        this.settingsRepository = this.prismaRepository.evoaiSetting;
        this.sessionRepository = this.prismaRepository.integrationSession;
    }
    getFallbackBotId(settings) {
        return settings?.evoaiIdFallback;
    }
    getFallbackFieldName() {
        return 'evoaiIdFallback';
    }
    getIntegrationType() {
        return 'evoai';
    }
    getAdditionalBotData(data) {
        return {
            agentUrl: data.agentUrl,
            apiKey: data.apiKey,
        };
    }
    getAdditionalUpdateFields(data) {
        return {
            agentUrl: data.agentUrl,
            apiKey: data.apiKey,
        };
    }
    async validateNoDuplicatesOnUpdate(botId, instanceId, data) {
        const checkDuplicate = await this.botRepository.findFirst({
            where: {
                id: {
                    not: botId,
                },
                instanceId: instanceId,
                agentUrl: data.agentUrl,
                apiKey: data.apiKey,
            },
        });
        if (checkDuplicate) {
            throw new Error('Evoai already exists');
        }
    }
    async createBot(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException('Evoai is disabled');
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
                agentUrl: data.agentUrl,
                apiKey: data.apiKey,
            },
        });
        if (checkDuplicate) {
            throw new Error('Evoai already exists');
        }
        return super.createBot(instance, data);
    }
    async processBot(instance, remoteJid, bot, session, settings, content, pushName, msg) {
        await this.evoaiService.process(instance, remoteJid, bot, session, settings, content, pushName, msg);
    }
}
exports.EvoaiController = EvoaiController;
