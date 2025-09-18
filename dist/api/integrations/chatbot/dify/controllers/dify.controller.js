"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DifyController = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const base_chatbot_controller_1 = require("../../base-chatbot.controller");
class DifyController extends base_chatbot_controller_1.BaseChatbotController {
    constructor(difyService, prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor);
        this.difyService = difyService;
        this.logger = new logger_config_1.Logger('DifyController');
        this.integrationName = 'Dify';
        this.integrationEnabled = env_config_1.configService.get('DIFY').ENABLED;
        this.userMessageDebounce = {};
        this.botRepository = this.prismaRepository.dify;
        this.settingsRepository = this.prismaRepository.difySetting;
        this.sessionRepository = this.prismaRepository.integrationSession;
    }
    getFallbackBotId(settings) {
        return settings?.fallbackId;
    }
    getFallbackFieldName() {
        return 'difyIdFallback';
    }
    getIntegrationType() {
        return 'dify';
    }
    getAdditionalBotData(data) {
        return {
            botType: data.botType,
            apiUrl: data.apiUrl,
            apiKey: data.apiKey,
        };
    }
    getAdditionalUpdateFields(data) {
        return {
            botType: data.botType,
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
                botType: data.botType,
                apiUrl: data.apiUrl,
                apiKey: data.apiKey,
            },
        });
        if (checkDuplicate) {
            throw new Error('Dify already exists');
        }
    }
    async createBot(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException('Dify is disabled');
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
                botType: data.botType,
                apiUrl: data.apiUrl,
                apiKey: data.apiKey,
            },
        });
        if (checkDuplicate) {
            throw new Error('Dify already exists');
        }
        return super.createBot(instance, data);
    }
    async processBot(instance, remoteJid, bot, session, settings, content, pushName, msg) {
        await this.difyService.process(instance, remoteJid, bot, session, settings, content, pushName, msg);
    }
}
exports.DifyController = DifyController;
