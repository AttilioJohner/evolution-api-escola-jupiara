"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.N8nController = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const base_chatbot_controller_1 = require("../../base-chatbot.controller");
class N8nController extends base_chatbot_controller_1.BaseChatbotController {
    constructor(n8nService, prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor);
        this.n8nService = n8nService;
        this.logger = new logger_config_1.Logger('N8nController');
        this.integrationName = 'N8n';
        this.integrationEnabled = env_config_1.configService.get('N8N').ENABLED;
        this.userMessageDebounce = {};
        this.botRepository = this.prismaRepository.n8n;
        this.settingsRepository = this.prismaRepository.n8nSetting;
        this.sessionRepository = this.prismaRepository.integrationSession;
    }
    getFallbackBotId(settings) {
        return settings?.fallbackId;
    }
    getFallbackFieldName() {
        return 'n8nIdFallback';
    }
    getIntegrationType() {
        return 'n8n';
    }
    getAdditionalBotData(data) {
        return {
            webhookUrl: data.webhookUrl,
            basicAuthUser: data.basicAuthUser,
            basicAuthPass: data.basicAuthPass,
        };
    }
    getAdditionalUpdateFields(data) {
        return {
            webhookUrl: data.webhookUrl,
            basicAuthUser: data.basicAuthUser,
            basicAuthPass: data.basicAuthPass,
        };
    }
    async validateNoDuplicatesOnUpdate(botId, instanceId, data) {
        const checkDuplicate = await this.botRepository.findFirst({
            where: {
                id: {
                    not: botId,
                },
                instanceId: instanceId,
                webhookUrl: data.webhookUrl,
                basicAuthUser: data.basicAuthUser,
                basicAuthPass: data.basicAuthPass,
            },
        });
        if (checkDuplicate) {
            throw new Error('N8n already exists');
        }
    }
    async createBot(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException('N8n is disabled');
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
                webhookUrl: data.webhookUrl,
                basicAuthUser: data.basicAuthUser,
                basicAuthPass: data.basicAuthPass,
            },
        });
        if (checkDuplicate) {
            throw new Error('N8n already exists');
        }
        return super.createBot(instance, data);
    }
    async processBot(instance, remoteJid, bot, session, settings, content, pushName, msg) {
        await this.n8nService.process(instance, remoteJid, bot, session, settings, content, pushName, msg);
    }
}
exports.N8nController = N8nController;
