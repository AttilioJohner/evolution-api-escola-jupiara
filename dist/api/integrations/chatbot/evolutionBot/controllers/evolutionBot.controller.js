"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionBotController = void 0;
const logger_config_1 = require("@config/logger.config");
const base_chatbot_controller_1 = require("../../base-chatbot.controller");
class EvolutionBotController extends base_chatbot_controller_1.BaseChatbotController {
    constructor(evolutionBotService, prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor);
        this.evolutionBotService = evolutionBotService;
        this.logger = new logger_config_1.Logger('EvolutionBotController');
        this.integrationName = 'EvolutionBot';
        this.integrationEnabled = true;
        this.userMessageDebounce = {};
        this.botRepository = this.prismaRepository.evolutionBot;
        this.settingsRepository = this.prismaRepository.evolutionBotSetting;
        this.sessionRepository = this.prismaRepository.integrationSession;
    }
    getFallbackBotId(settings) {
        return settings?.botIdFallback;
    }
    getFallbackFieldName() {
        return 'botIdFallback';
    }
    getIntegrationType() {
        return 'evolution';
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
                id: {
                    not: botId,
                },
                instanceId: instanceId,
                apiUrl: data.apiUrl,
                apiKey: data.apiKey,
            },
        });
        if (checkDuplicate) {
            throw new Error('Evolution Bot already exists');
        }
    }
    async processBot(instance, remoteJid, bot, session, settings, content, pushName, msg) {
        await this.evolutionBotService.process(instance, remoteJid, bot, session, settings, content, pushName, msg);
    }
}
exports.EvolutionBotController = EvolutionBotController;
