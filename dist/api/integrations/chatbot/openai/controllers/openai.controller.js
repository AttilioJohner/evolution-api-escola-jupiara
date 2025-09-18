"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenaiController = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const openai_1 = __importDefault(require("openai"));
const base_chatbot_controller_1 = require("../../base-chatbot.controller");
class OpenaiController extends base_chatbot_controller_1.BaseChatbotController {
    constructor(openaiService, prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor);
        this.openaiService = openaiService;
        this.logger = new logger_config_1.Logger('OpenaiController');
        this.integrationName = 'Openai';
        this.integrationEnabled = env_config_1.configService.get('OPENAI').ENABLED;
        this.userMessageDebounce = {};
        this.botRepository = this.prismaRepository.openaiBot;
        this.settingsRepository = this.prismaRepository.openaiSetting;
        this.sessionRepository = this.prismaRepository.integrationSession;
        this.credsRepository = this.prismaRepository.openaiCreds;
    }
    getFallbackBotId(settings) {
        return settings?.openaiIdFallback;
    }
    getFallbackFieldName() {
        return 'openaiIdFallback';
    }
    getIntegrationType() {
        return 'openai';
    }
    getAdditionalBotData(data) {
        return {
            openaiCredsId: data.openaiCredsId,
            botType: data.botType,
            assistantId: data.assistantId,
            functionUrl: data.functionUrl,
            model: data.model,
            systemMessages: data.systemMessages,
            assistantMessages: data.assistantMessages,
            userMessages: data.userMessages,
            maxTokens: data.maxTokens,
        };
    }
    getAdditionalUpdateFields(data) {
        return {
            openaiCredsId: data.openaiCredsId,
            botType: data.botType,
            assistantId: data.assistantId,
            functionUrl: data.functionUrl,
            model: data.model,
            systemMessages: data.systemMessages,
            assistantMessages: data.assistantMessages,
            userMessages: data.userMessages,
            maxTokens: data.maxTokens,
        };
    }
    async validateNoDuplicatesOnUpdate(botId, instanceId, data) {
        let whereDuplication = {
            id: {
                not: botId,
            },
            instanceId: instanceId,
        };
        if (data.botType === 'assistant') {
            if (!data.assistantId)
                throw new Error('Assistant ID is required');
            whereDuplication = {
                ...whereDuplication,
                assistantId: data.assistantId,
                botType: data.botType,
            };
        }
        else if (data.botType === 'chatCompletion') {
            if (!data.model)
                throw new Error('Model is required');
            if (!data.maxTokens)
                throw new Error('Max tokens is required');
            whereDuplication = {
                ...whereDuplication,
                model: data.model,
                maxTokens: data.maxTokens,
                botType: data.botType,
            };
        }
        else {
            throw new Error('Bot type is required');
        }
        const checkDuplicate = await this.botRepository.findFirst({
            where: whereDuplication,
        });
        if (checkDuplicate) {
            throw new Error('OpenAI Bot already exists');
        }
    }
    async createBot(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException('Openai is disabled');
        const instanceId = await this.prismaRepository.instance
            .findFirst({
            where: {
                name: instance.instanceName,
            },
        })
            .then((instance) => instance.id);
        let whereDuplication = {
            instanceId: instanceId,
        };
        if (data.botType === 'assistant') {
            if (!data.assistantId)
                throw new Error('Assistant ID is required');
            whereDuplication = {
                ...whereDuplication,
                assistantId: data.assistantId,
                botType: data.botType,
            };
        }
        else if (data.botType === 'chatCompletion') {
            if (!data.model)
                throw new Error('Model is required');
            if (!data.maxTokens)
                throw new Error('Max tokens is required');
            whereDuplication = {
                ...whereDuplication,
                model: data.model,
                maxTokens: data.maxTokens,
                botType: data.botType,
            };
        }
        else {
            throw new Error('Bot type is required');
        }
        const checkDuplicate = await this.botRepository.findFirst({
            where: whereDuplication,
        });
        if (checkDuplicate) {
            throw new Error('Openai Bot already exists');
        }
        const existingSettings = await this.settingsRepository.findFirst({
            where: {
                instanceId: instanceId,
            },
        });
        if (!existingSettings) {
            await this.settings(instance, {
                openaiCredsId: data.openaiCredsId,
                expire: data.expire || 300,
                keywordFinish: data.keywordFinish || 'bye',
                delayMessage: data.delayMessage || 1000,
                unknownMessage: data.unknownMessage || 'Sorry, I dont understand',
                listeningFromMe: data.listeningFromMe !== undefined ? data.listeningFromMe : true,
                stopBotFromMe: data.stopBotFromMe !== undefined ? data.stopBotFromMe : true,
                keepOpen: data.keepOpen !== undefined ? data.keepOpen : false,
                debounceTime: data.debounceTime || 1,
                ignoreJids: data.ignoreJids || [],
                speechToText: false,
            });
        }
        else if (!existingSettings.openaiCredsId && data.openaiCredsId) {
            await this.settingsRepository.update({
                where: {
                    id: existingSettings.id,
                },
                data: {
                    OpenaiCreds: {
                        connect: {
                            id: data.openaiCredsId,
                        },
                    },
                },
            });
        }
        return super.createBot(instance, data);
    }
    async processBot(instance, remoteJid, bot, session, settings, content, pushName, msg) {
        await this.openaiService.process(instance, remoteJid, bot, session, settings, content, pushName, msg);
    }
    async createOpenaiCreds(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException('Openai is disabled');
        const instanceId = await this.prismaRepository.instance
            .findFirst({
            where: {
                name: instance.instanceName,
            },
        })
            .then((instance) => instance.id);
        if (!data.apiKey)
            throw new _exceptions_1.BadRequestException('API Key is required');
        if (!data.name)
            throw new _exceptions_1.BadRequestException('Name is required');
        const existingApiKey = await this.credsRepository.findFirst({
            where: {
                apiKey: data.apiKey,
            },
        });
        if (existingApiKey) {
            throw new _exceptions_1.BadRequestException('This API key is already registered. Please use a different API key.');
        }
        const existingName = await this.credsRepository.findFirst({
            where: {
                name: data.name,
                instanceId: instanceId,
            },
        });
        if (existingName) {
            throw new _exceptions_1.BadRequestException('This credential name is already in use. Please choose a different name.');
        }
        try {
            const creds = await this.credsRepository.create({
                data: {
                    name: data.name,
                    apiKey: data.apiKey,
                    instanceId: instanceId,
                },
            });
            return creds;
        }
        catch (error) {
            this.logger.error(error);
            throw new Error('Error creating openai creds');
        }
    }
    async findOpenaiCreds(instance) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException('Openai is disabled');
        const instanceId = await this.prismaRepository.instance
            .findFirst({
            where: {
                name: instance.instanceName,
            },
        })
            .then((instance) => instance.id);
        const creds = await this.credsRepository.findMany({
            where: {
                instanceId: instanceId,
            },
            include: {
                OpenaiAssistant: true,
            },
        });
        return creds;
    }
    async deleteCreds(instance, openaiCredsId) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException('Openai is disabled');
        const instanceId = await this.prismaRepository.instance
            .findFirst({
            where: {
                name: instance.instanceName,
            },
        })
            .then((instance) => instance.id);
        const creds = await this.credsRepository.findFirst({
            where: {
                id: openaiCredsId,
            },
        });
        if (!creds) {
            throw new Error('Openai Creds not found');
        }
        if (creds.instanceId !== instanceId) {
            throw new Error('Openai Creds not found');
        }
        try {
            await this.credsRepository.delete({
                where: {
                    id: openaiCredsId,
                },
            });
            return { openaiCreds: { id: openaiCredsId } };
        }
        catch (error) {
            this.logger.error(error);
            throw new Error('Error deleting openai creds');
        }
    }
    async settings(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException('Openai is disabled');
        try {
            const instanceId = await this.prismaRepository.instance
                .findFirst({
                where: {
                    name: instance.instanceName,
                },
            })
                .then((instance) => instance.id);
            const existingSettings = await this.settingsRepository.findFirst({
                where: {
                    instanceId: instanceId,
                },
            });
            const keywordFinish = data.keywordFinish;
            const settingsData = {
                expire: data.expire,
                keywordFinish,
                delayMessage: data.delayMessage,
                unknownMessage: data.unknownMessage,
                listeningFromMe: data.listeningFromMe,
                stopBotFromMe: data.stopBotFromMe,
                keepOpen: data.keepOpen,
                debounceTime: data.debounceTime,
                ignoreJids: data.ignoreJids,
                splitMessages: data.splitMessages,
                timePerChar: data.timePerChar,
                openaiIdFallback: data.fallbackId,
                OpenaiCreds: data.openaiCredsId
                    ? {
                        connect: {
                            id: data.openaiCredsId,
                        },
                    }
                    : undefined,
                speechToText: data.speechToText,
            };
            if (existingSettings) {
                const settings = await this.settingsRepository.update({
                    where: {
                        id: existingSettings.id,
                    },
                    data: settingsData,
                });
                return {
                    ...settings,
                    fallbackId: settings.openaiIdFallback,
                };
            }
            else {
                const settings = await this.settingsRepository.create({
                    data: {
                        ...settingsData,
                        Instance: {
                            connect: {
                                id: instanceId,
                            },
                        },
                    },
                });
                return {
                    ...settings,
                    fallbackId: settings.openaiIdFallback,
                };
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new Error('Error setting default settings');
        }
    }
    async getModels(instance, openaiCredsId) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException('Openai is disabled');
        const instanceId = await this.prismaRepository.instance
            .findFirst({
            where: {
                name: instance.instanceName,
            },
        })
            .then((instance) => instance.id);
        if (!instanceId)
            throw new Error('Instance not found');
        let apiKey;
        if (openaiCredsId) {
            const creds = await this.credsRepository.findFirst({
                where: {
                    id: openaiCredsId,
                    instanceId: instanceId,
                },
            });
            if (!creds)
                throw new Error('OpenAI credentials not found for the provided ID');
            apiKey = creds.apiKey;
        }
        else {
            const defaultSettings = await this.settingsRepository.findFirst({
                where: {
                    instanceId: instanceId,
                },
                include: {
                    OpenaiCreds: true,
                },
            });
            if (!defaultSettings)
                throw new Error('Settings not found');
            if (!defaultSettings.OpenaiCreds)
                throw new Error('OpenAI credentials not found. Please create credentials and associate them with the settings.');
            apiKey = defaultSettings.OpenaiCreds.apiKey;
        }
        try {
            this.client = new openai_1.default({ apiKey });
            const models = await this.client.models.list();
            return models?.body?.data;
        }
        catch (error) {
            this.logger.error(error);
            throw new Error('Error fetching models');
        }
    }
}
exports.OpenaiController = OpenaiController;
