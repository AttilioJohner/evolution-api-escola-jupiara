"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypebotController = void 0;
const wa_types_1 = require("@api/types/wa.types");
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const axios_1 = __importDefault(require("axios"));
const base_chatbot_controller_1 = require("../../base-chatbot.controller");
class TypebotController extends base_chatbot_controller_1.BaseChatbotController {
    constructor(typebotService, prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor);
        this.typebotService = typebotService;
        this.logger = new logger_config_1.Logger('TypebotController');
        this.integrationName = 'Typebot';
        this.integrationEnabled = env_config_1.configService.get('TYPEBOT').ENABLED;
        this.userMessageDebounce = {};
        this.botRepository = this.prismaRepository.typebot;
        this.settingsRepository = this.prismaRepository.typebotSetting;
        this.sessionRepository = this.prismaRepository.integrationSession;
    }
    getFallbackBotId(settings) {
        return settings?.typebotIdFallback;
    }
    getFallbackFieldName() {
        return 'typebotIdFallback';
    }
    getIntegrationType() {
        return 'typebot';
    }
    getAdditionalBotData(data) {
        return {
            url: data.url,
            typebot: data.typebot,
        };
    }
    getAdditionalUpdateFields(data) {
        return {
            url: data.url,
            typebot: data.typebot,
        };
    }
    async validateNoDuplicatesOnUpdate(botId, instanceId, data) {
        const checkDuplicate = await this.botRepository.findFirst({
            where: {
                url: data.url,
                typebot: data.typebot,
                id: {
                    not: botId,
                },
                instanceId: instanceId,
            },
        });
        if (checkDuplicate) {
            throw new Error('Typebot already exists');
        }
    }
    async processBot(instance, remoteJid, bot, session, settings, content, pushName, msg) {
        await this.typebotService.processTypebot(instance, remoteJid, msg, session, bot, bot.url, settings.expire, bot.typebot, settings.keywordFinish, settings.delayMessage, settings.unknownMessage, settings.listeningFromMe, settings.stopBotFromMe, settings.keepOpen, content, {});
    }
    async startBot(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException('Typebot is disabled');
        if (data.remoteJid === 'status@broadcast')
            return;
        const instanceData = await this.prismaRepository.instance.findFirst({
            where: {
                name: instance.instanceName,
            },
        });
        if (!instanceData)
            throw new Error('Instance not found');
        const remoteJid = data.remoteJid;
        const url = data.url;
        const typebot = data.typebot;
        const startSession = data.startSession;
        const variables = data.variables;
        let expire = data?.typebot?.expire;
        let keywordFinish = data?.typebot?.keywordFinish;
        let delayMessage = data?.typebot?.delayMessage;
        let unknownMessage = data?.typebot?.unknownMessage;
        let listeningFromMe = data?.typebot?.listeningFromMe;
        let stopBotFromMe = data?.typebot?.stopBotFromMe;
        let keepOpen = data?.typebot?.keepOpen;
        let debounceTime = data?.typebot?.debounceTime;
        let ignoreJids = data?.typebot?.ignoreJids;
        const defaultSettingCheck = await this.settingsRepository.findFirst({
            where: {
                instanceId: instanceData.id,
            },
        });
        if (this.checkIgnoreJids(defaultSettingCheck?.ignoreJids, remoteJid))
            throw new Error('Jid not allowed');
        if (!expire ||
            !keywordFinish ||
            !delayMessage ||
            !unknownMessage ||
            !listeningFromMe ||
            !stopBotFromMe ||
            !keepOpen ||
            !debounceTime ||
            !ignoreJids) {
            if (expire === undefined || expire === null)
                expire = defaultSettingCheck.expire;
            if (keywordFinish === undefined || keywordFinish === null)
                keywordFinish = defaultSettingCheck.keywordFinish;
            if (delayMessage === undefined || delayMessage === null)
                delayMessage = defaultSettingCheck.delayMessage;
            if (unknownMessage === undefined || unknownMessage === null)
                unknownMessage = defaultSettingCheck.unknownMessage;
            if (listeningFromMe === undefined || listeningFromMe === null)
                listeningFromMe = defaultSettingCheck.listeningFromMe;
            if (stopBotFromMe === undefined || stopBotFromMe === null)
                stopBotFromMe = defaultSettingCheck.stopBotFromMe;
            if (keepOpen === undefined || keepOpen === null)
                keepOpen = defaultSettingCheck.keepOpen;
            if (debounceTime === undefined || debounceTime === null)
                debounceTime = defaultSettingCheck.debounceTime;
            if (ignoreJids === undefined || ignoreJids === null)
                ignoreJids = defaultSettingCheck.ignoreJids;
            if (!defaultSettingCheck) {
                await this.settings(instance, {
                    expire: expire,
                    keywordFinish: keywordFinish,
                    delayMessage: delayMessage,
                    unknownMessage: unknownMessage,
                    listeningFromMe: listeningFromMe,
                    stopBotFromMe: stopBotFromMe,
                    keepOpen: keepOpen,
                    debounceTime: debounceTime,
                    ignoreJids: ignoreJids,
                });
            }
        }
        const prefilledVariables = {};
        if (variables?.length) {
            variables.forEach((variable) => {
                prefilledVariables[variable.name] = variable.value;
            });
        }
        if (startSession) {
            let findBot = await this.botRepository.findFirst({
                where: {
                    url: url,
                    typebot: typebot,
                    instanceId: instanceData.id,
                },
            });
            if (!findBot) {
                findBot = await this.botRepository.create({
                    data: {
                        enabled: true,
                        url: url,
                        typebot: typebot,
                        instanceId: instanceData.id,
                        expire: expire,
                        keywordFinish: keywordFinish,
                        delayMessage: delayMessage,
                        unknownMessage: unknownMessage,
                        listeningFromMe: listeningFromMe,
                        stopBotFromMe: stopBotFromMe,
                        keepOpen: keepOpen,
                    },
                });
            }
            await this.prismaRepository.integrationSession.deleteMany({
                where: {
                    remoteJid: remoteJid,
                    instanceId: instanceData.id,
                    botId: { not: null },
                },
            });
            await this.typebotService.processTypebot(this.waMonitor.waInstances[instanceData.name], remoteJid, null, null, findBot, url, expire, typebot, keywordFinish, delayMessage, unknownMessage, listeningFromMe, stopBotFromMe, keepOpen, 'init', prefilledVariables);
        }
        else {
            const id = Math.floor(Math.random() * 10000000000).toString();
            try {
                const version = env_config_1.configService.get('TYPEBOT').API_VERSION;
                let url;
                let reqData;
                if (version === 'latest') {
                    url = `${data.url}/api/v1/typebots/${data.typebot}/startChat`;
                    reqData = {
                        prefilledVariables: prefilledVariables,
                    };
                }
                else {
                    url = `${data.url}/api/v1/sendMessage`;
                    reqData = {
                        startParams: {
                            publicId: data.typebot,
                            prefilledVariables: prefilledVariables,
                        },
                    };
                }
                const request = await axios_1.default.post(url, reqData);
                await this.typebotService.sendWAMessage(instanceData, null, {
                    expire: expire,
                    keywordFinish: keywordFinish,
                    delayMessage: delayMessage,
                    unknownMessage: unknownMessage,
                    listeningFromMe: listeningFromMe,
                    stopBotFromMe: stopBotFromMe,
                    keepOpen: keepOpen,
                }, remoteJid, request.data.messages, request.data.input, request.data.clientSideActions);
                this.waMonitor.waInstances[instance.instanceName].sendDataWebhook(wa_types_1.Events.TYPEBOT_START, {
                    remoteJid: remoteJid,
                    url: url,
                    typebot: typebot,
                    variables: variables,
                    sessionId: id,
                });
            }
            catch (error) {
                this.logger.error(error);
                return;
            }
        }
        return {
            typebot: {
                ...instance,
                typebot: {
                    url: url,
                    remoteJid: remoteJid,
                    typebot: typebot,
                    prefilledVariables: prefilledVariables,
                },
            },
        };
    }
}
exports.TypebotController = TypebotController;
