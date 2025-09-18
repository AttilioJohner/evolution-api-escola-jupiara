"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseChatbotController = void 0;
const _exceptions_1 = require("@exceptions");
const getConversationMessage_1 = require("@utils/getConversationMessage");
const chatbot_controller_1 = require("./chatbot.controller");
class BaseChatbotController extends chatbot_controller_1.ChatbotController {
    constructor(prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor);
        this.userMessageDebounce = {};
        this.sessionRepository = this.prismaRepository.integrationSession;
    }
    async createBot(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException(`${this.integrationName} is disabled`);
        const instanceId = await this.prismaRepository.instance
            .findFirst({
            where: {
                name: instance.instanceName,
            },
        })
            .then((instance) => instance.id);
        if (!data.expire ||
            !data.keywordFinish ||
            !data.delayMessage ||
            !data.unknownMessage ||
            !data.listeningFromMe ||
            !data.stopBotFromMe ||
            !data.keepOpen ||
            !data.debounceTime ||
            !data.ignoreJids ||
            !data.splitMessages ||
            !data.timePerChar) {
            const defaultSettingCheck = await this.settingsRepository.findFirst({
                where: {
                    instanceId: instanceId,
                },
            });
            if (data.expire === undefined || data.expire === null)
                data.expire = defaultSettingCheck?.expire;
            if (data.keywordFinish === undefined || data.keywordFinish === null)
                data.keywordFinish = defaultSettingCheck?.keywordFinish;
            if (data.delayMessage === undefined || data.delayMessage === null)
                data.delayMessage = defaultSettingCheck?.delayMessage;
            if (data.unknownMessage === undefined || data.unknownMessage === null)
                data.unknownMessage = defaultSettingCheck?.unknownMessage;
            if (data.listeningFromMe === undefined || data.listeningFromMe === null)
                data.listeningFromMe = defaultSettingCheck?.listeningFromMe;
            if (data.stopBotFromMe === undefined || data.stopBotFromMe === null)
                data.stopBotFromMe = defaultSettingCheck?.stopBotFromMe;
            if (data.keepOpen === undefined || data.keepOpen === null)
                data.keepOpen = defaultSettingCheck?.keepOpen;
            if (data.debounceTime === undefined || data.debounceTime === null)
                data.debounceTime = defaultSettingCheck?.debounceTime;
            if (data.ignoreJids === undefined || data.ignoreJids === null)
                data.ignoreJids = defaultSettingCheck?.ignoreJids;
            if (data.splitMessages === undefined || data.splitMessages === null)
                data.splitMessages = defaultSettingCheck?.splitMessages ?? false;
            if (data.timePerChar === undefined || data.timePerChar === null)
                data.timePerChar = defaultSettingCheck?.timePerChar ?? 0;
            if (!defaultSettingCheck) {
                await this.settings(instance, {
                    expire: data.expire,
                    keywordFinish: data.keywordFinish,
                    delayMessage: data.delayMessage,
                    unknownMessage: data.unknownMessage,
                    listeningFromMe: data.listeningFromMe,
                    stopBotFromMe: data.stopBotFromMe,
                    keepOpen: data.keepOpen,
                    debounceTime: data.debounceTime,
                    ignoreJids: data.ignoreJids,
                    splitMessages: data.splitMessages,
                    timePerChar: data.timePerChar,
                });
            }
        }
        const checkTriggerAll = await this.botRepository.findFirst({
            where: {
                enabled: true,
                triggerType: 'all',
                instanceId: instanceId,
            },
        });
        if (checkTriggerAll && data.triggerType === 'all') {
            throw new Error(`You already have a ${this.integrationName} with an "All" trigger, you cannot have more bots while it is active`);
        }
        if (data.triggerType === 'keyword') {
            if (!data.triggerOperator || !data.triggerValue) {
                throw new Error('Trigger operator and value are required');
            }
            const checkDuplicate = await this.botRepository.findFirst({
                where: {
                    triggerOperator: data.triggerOperator,
                    triggerValue: data.triggerValue,
                    instanceId: instanceId,
                },
            });
            if (checkDuplicate) {
                throw new Error('Trigger already exists');
            }
        }
        if (data.triggerType === 'advanced') {
            if (!data.triggerValue) {
                throw new Error('Trigger value is required');
            }
            const checkDuplicate = await this.botRepository.findFirst({
                where: {
                    triggerValue: data.triggerValue,
                    instanceId: instanceId,
                },
            });
            if (checkDuplicate) {
                throw new Error('Trigger already exists');
            }
        }
        try {
            const botData = {
                enabled: data?.enabled,
                description: data.description,
                expire: data.expire,
                keywordFinish: data.keywordFinish,
                delayMessage: data.delayMessage,
                unknownMessage: data.unknownMessage,
                listeningFromMe: data.listeningFromMe,
                stopBotFromMe: data.stopBotFromMe,
                keepOpen: data.keepOpen,
                debounceTime: data.debounceTime,
                instanceId: instanceId,
                triggerType: data.triggerType,
                triggerOperator: data.triggerOperator,
                triggerValue: data.triggerValue,
                ignoreJids: data.ignoreJids,
                splitMessages: data.splitMessages,
                timePerChar: data.timePerChar,
                ...this.getAdditionalBotData(data),
            };
            const bot = await this.botRepository.create({
                data: botData,
            });
            return bot;
        }
        catch (error) {
            this.logger.error(error);
            throw new Error(`Error creating ${this.integrationName}`);
        }
    }
    async findBot(instance) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException(`${this.integrationName} is disabled`);
        const instanceId = await this.prismaRepository.instance
            .findFirst({
            where: {
                name: instance.instanceName,
            },
        })
            .then((instance) => instance.id);
        try {
            const bots = await this.botRepository.findMany({
                where: {
                    instanceId: instanceId,
                },
            });
            return bots;
        }
        catch (error) {
            this.logger.error(error);
            throw new Error(`Error finding ${this.integrationName}`);
        }
    }
    async fetchBot(instance, botId) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException(`${this.integrationName} is disabled`);
        try {
            const bot = await this.botRepository.findUnique({
                where: {
                    id: botId,
                },
            });
            if (!bot) {
                return null;
            }
            return bot;
        }
        catch (error) {
            this.logger.error(error);
            throw new Error(`Error fetching ${this.integrationName}`);
        }
    }
    async settings(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException(`${this.integrationName} is disabled`);
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
            const fallbackFieldName = this.getFallbackFieldName();
            const settingsData = {
                expire: data.expire,
                keywordFinish: data.keywordFinish,
                delayMessage: data.delayMessage,
                unknownMessage: data.unknownMessage,
                listeningFromMe: data.listeningFromMe,
                stopBotFromMe: data.stopBotFromMe,
                keepOpen: data.keepOpen,
                debounceTime: data.debounceTime,
                ignoreJids: data.ignoreJids,
                splitMessages: data.splitMessages,
                timePerChar: data.timePerChar,
                [fallbackFieldName]: data.fallbackId,
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
                    fallbackId: settings[fallbackFieldName],
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
                    fallbackId: settings[fallbackFieldName],
                };
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new Error('Error setting default settings');
        }
    }
    async fetchSettings(instance) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException(`${this.integrationName} is disabled`);
        try {
            const instanceId = await this.prismaRepository.instance
                .findFirst({
                where: {
                    name: instance.instanceName,
                },
            })
                .then((instance) => instance.id);
            const settings = await this.settingsRepository.findFirst({
                where: {
                    instanceId: instanceId,
                },
                include: {
                    Fallback: true,
                },
            });
            const fallbackFieldName = this.getFallbackFieldName();
            if (!settings) {
                return {
                    expire: 300,
                    keywordFinish: 'bye',
                    delayMessage: 1000,
                    unknownMessage: 'Sorry, I dont understand',
                    listeningFromMe: true,
                    stopBotFromMe: true,
                    keepOpen: false,
                    debounceTime: 1,
                    ignoreJids: [],
                    splitMessages: false,
                    timePerChar: 0,
                    fallbackId: '',
                    fallback: null,
                };
            }
            return {
                ...settings,
                fallbackId: settings[fallbackFieldName],
                fallback: settings.Fallback,
            };
        }
        catch (error) {
            this.logger.error(error);
            throw new Error('Error fetching settings');
        }
    }
    async changeStatus(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException(`${this.integrationName} is disabled`);
        try {
            const instanceId = await this.prismaRepository.instance
                .findFirst({
                where: {
                    name: instance.instanceName,
                },
            })
                .then((instance) => instance.id);
            const defaultSettingCheck = await this.settingsRepository.findFirst({
                where: {
                    instanceId,
                },
            });
            const remoteJid = data.remoteJid;
            const status = data.status;
            if (status === 'delete') {
                await this.sessionRepository.deleteMany({
                    where: {
                        remoteJid: remoteJid,
                        botId: { not: null },
                    },
                });
                return { bot: { remoteJid: remoteJid, status: status } };
            }
            if (status === 'closed') {
                if (defaultSettingCheck?.keepOpen) {
                    await this.sessionRepository.updateMany({
                        where: {
                            remoteJid: remoteJid,
                            botId: { not: null },
                        },
                        data: {
                            status: 'closed',
                        },
                    });
                }
                else {
                    await this.sessionRepository.deleteMany({
                        where: {
                            remoteJid: remoteJid,
                            botId: { not: null },
                        },
                    });
                }
                return { bot: { ...instance, bot: { remoteJid: remoteJid, status: status } } };
            }
            else {
                const session = await this.sessionRepository.updateMany({
                    where: {
                        instanceId: instanceId,
                        remoteJid: remoteJid,
                        botId: { not: null },
                    },
                    data: {
                        status: status,
                    },
                });
                const botData = {
                    remoteJid: remoteJid,
                    status: status,
                    session,
                };
                return { bot: { ...instance, bot: botData } };
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new Error(`Error changing ${this.integrationName} status`);
        }
    }
    async fetchSessions(instance, botId, remoteJid) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException(`${this.integrationName} is disabled`);
        try {
            const instanceId = await this.prismaRepository.instance
                .findFirst({
                where: {
                    name: instance.instanceName,
                },
            })
                .then((instance) => instance.id);
            const bot = await this.botRepository.findFirst({
                where: {
                    id: botId,
                },
            });
            if (bot && bot.instanceId !== instanceId) {
                throw new Error(`${this.integrationName} not found`);
            }
            const integrationType = this.getIntegrationType();
            return await this.sessionRepository.findMany({
                where: {
                    instanceId: instanceId,
                    remoteJid,
                    botId: bot ? botId : { not: null },
                    type: integrationType,
                },
            });
        }
        catch (error) {
            this.logger.error(error);
            throw new Error('Error fetching sessions');
        }
    }
    async ignoreJid(instance, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException(`${this.integrationName} is disabled`);
        try {
            const instanceId = await this.prismaRepository.instance
                .findFirst({
                where: {
                    name: instance.instanceName,
                },
            })
                .then((instance) => instance.id);
            const settings = await this.settingsRepository.findFirst({
                where: {
                    instanceId: instanceId,
                },
            });
            if (!settings) {
                throw new Error('Settings not found');
            }
            let ignoreJids = settings?.ignoreJids || [];
            if (data.action === 'add') {
                if (ignoreJids.includes(data.remoteJid))
                    return { ignoreJids: ignoreJids };
                ignoreJids.push(data.remoteJid);
            }
            else {
                ignoreJids = ignoreJids.filter((jid) => jid !== data.remoteJid);
            }
            const updateSettings = await this.settingsRepository.update({
                where: {
                    id: settings.id,
                },
                data: {
                    ignoreJids: ignoreJids,
                },
            });
            return {
                ignoreJids: updateSettings.ignoreJids,
            };
        }
        catch (error) {
            this.logger.error(error);
            throw new Error('Error setting default settings');
        }
    }
    async updateBot(instance, botId, data) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException(`${this.integrationName} is disabled`);
        try {
            const instanceId = await this.prismaRepository.instance
                .findFirst({
                where: {
                    name: instance.instanceName,
                },
            })
                .then((instance) => instance.id);
            const bot = await this.botRepository.findFirst({
                where: {
                    id: botId,
                },
            });
            if (!bot) {
                throw new Error(`${this.integrationName} not found`);
            }
            if (bot.instanceId !== instanceId) {
                throw new Error(`${this.integrationName} not found`);
            }
            if (data.triggerType === 'all') {
                const checkTriggerAll = await this.botRepository.findFirst({
                    where: {
                        enabled: true,
                        triggerType: 'all',
                        id: {
                            not: botId,
                        },
                        instanceId: instanceId,
                    },
                });
                if (checkTriggerAll) {
                    throw new Error(`You already have a ${this.integrationName} with an "All" trigger, you cannot have more bots while it is active`);
                }
            }
            await this.validateNoDuplicatesOnUpdate(botId, instanceId, data);
            if (data.triggerType === 'keyword') {
                if (!data.triggerOperator || !data.triggerValue) {
                    throw new Error('Trigger operator and value are required');
                }
                const checkDuplicate = await this.botRepository.findFirst({
                    where: {
                        triggerOperator: data.triggerOperator,
                        triggerValue: data.triggerValue,
                        id: { not: botId },
                        instanceId: instanceId,
                    },
                });
                if (checkDuplicate) {
                    throw new Error('Trigger already exists');
                }
            }
            if (data.triggerType === 'advanced') {
                if (!data.triggerValue) {
                    throw new Error('Trigger value is required');
                }
                const checkDuplicate = await this.botRepository.findFirst({
                    where: {
                        triggerValue: data.triggerValue,
                        id: { not: botId },
                        instanceId: instanceId,
                    },
                });
                if (checkDuplicate) {
                    throw new Error('Trigger already exists');
                }
            }
            const updateData = {
                enabled: data?.enabled,
                description: data.description,
                expire: data.expire,
                keywordFinish: data.keywordFinish,
                delayMessage: data.delayMessage,
                unknownMessage: data.unknownMessage,
                listeningFromMe: data.listeningFromMe,
                stopBotFromMe: data.stopBotFromMe,
                keepOpen: data.keepOpen,
                debounceTime: data.debounceTime,
                instanceId: instanceId,
                triggerType: data.triggerType,
                triggerOperator: data.triggerOperator,
                triggerValue: data.triggerValue,
                ignoreJids: data.ignoreJids,
                splitMessages: data.splitMessages,
                timePerChar: data.timePerChar,
                ...this.getAdditionalUpdateFields(data),
            };
            const updatedBot = await this.botRepository.update({
                where: {
                    id: botId,
                },
                data: updateData,
            });
            return updatedBot;
        }
        catch (error) {
            this.logger.error(error);
            throw new Error(`Error updating ${this.integrationName}`);
        }
    }
    async deleteBot(instance, botId) {
        if (!this.integrationEnabled)
            throw new _exceptions_1.BadRequestException(`${this.integrationName} is disabled`);
        try {
            const instanceId = await this.prismaRepository.instance
                .findFirst({
                where: {
                    name: instance.instanceName,
                },
            })
                .then((instance) => instance.id);
            const bot = await this.botRepository.findFirst({
                where: {
                    id: botId,
                },
            });
            if (!bot) {
                throw new Error(`${this.integrationName} not found`);
            }
            if (bot.instanceId !== instanceId) {
                throw new Error(`${this.integrationName} not found`);
            }
            await this.prismaRepository.integrationSession.deleteMany({
                where: {
                    botId: botId,
                },
            });
            await this.botRepository.delete({
                where: {
                    id: botId,
                },
            });
            return { bot: { id: botId } };
        }
        catch (error) {
            this.logger.error(error);
            throw new Error(`Error deleting ${this.integrationName} bot`);
        }
    }
    async emit({ instance, remoteJid, msg }) {
        if (!this.integrationEnabled)
            return;
        try {
            const settings = await this.settingsRepository.findFirst({
                where: {
                    instanceId: instance.instanceId,
                },
            });
            if (this.checkIgnoreJids(settings?.ignoreJids, remoteJid))
                return;
            const session = await this.getSession(remoteJid, instance);
            const content = (0, getConversationMessage_1.getConversationMessage)(msg);
            let findBot = await this.findBotTrigger(this.botRepository, content, instance, session);
            if (!findBot) {
                const fallback = await this.settingsRepository.findFirst({
                    where: {
                        instanceId: instance.instanceId,
                    },
                });
                const fallbackId = this.getFallbackBotId(fallback);
                if (fallbackId) {
                    const findFallback = await this.botRepository.findFirst({
                        where: {
                            id: fallbackId,
                        },
                    });
                    findBot = findFallback;
                }
                else {
                    return;
                }
            }
            if (!findBot) {
                return;
            }
            let expire = findBot.expire;
            let keywordFinish = findBot.keywordFinish;
            let delayMessage = findBot.delayMessage;
            let unknownMessage = findBot.unknownMessage;
            let listeningFromMe = findBot.listeningFromMe;
            let stopBotFromMe = findBot.stopBotFromMe;
            let keepOpen = findBot.keepOpen;
            let debounceTime = findBot.debounceTime;
            let ignoreJids = findBot.ignoreJids;
            let splitMessages = findBot.splitMessages;
            let timePerChar = findBot.timePerChar;
            if (expire === undefined || expire === null)
                expire = settings.expire;
            if (keywordFinish === undefined || keywordFinish === null)
                keywordFinish = settings.keywordFinish;
            if (delayMessage === undefined || delayMessage === null)
                delayMessage = settings.delayMessage;
            if (unknownMessage === undefined || unknownMessage === null)
                unknownMessage = settings.unknownMessage;
            if (listeningFromMe === undefined || listeningFromMe === null)
                listeningFromMe = settings.listeningFromMe;
            if (stopBotFromMe === undefined || stopBotFromMe === null)
                stopBotFromMe = settings.stopBotFromMe;
            if (keepOpen === undefined || keepOpen === null)
                keepOpen = settings.keepOpen;
            if (debounceTime === undefined || debounceTime === null)
                debounceTime = settings.debounceTime;
            if (ignoreJids === undefined || ignoreJids === null)
                ignoreJids = settings.ignoreJids;
            if (splitMessages === undefined || splitMessages === null)
                splitMessages = settings?.splitMessages ?? false;
            if (timePerChar === undefined || timePerChar === null)
                timePerChar = settings?.timePerChar ?? 0;
            const key = msg.key;
            if (stopBotFromMe && key.fromMe && session) {
                await this.prismaRepository.integrationSession.update({
                    where: {
                        id: session.id,
                    },
                    data: {
                        status: 'paused',
                    },
                });
                return;
            }
            if (!listeningFromMe && key.fromMe) {
                return;
            }
            if (session && session.status === 'closed') {
                return;
            }
            if (session && session.status === 'paused') {
                this.logger.warn(`Session for ${remoteJid} is paused, skipping message processing`);
                return;
            }
            const mergedSettings = {
                ...settings,
                expire,
                keywordFinish,
                delayMessage,
                unknownMessage,
                listeningFromMe,
                stopBotFromMe,
                keepOpen,
                debounceTime,
                ignoreJids,
                splitMessages,
                timePerChar,
            };
            if (debounceTime && debounceTime > 0) {
                this.processDebounce(this.userMessageDebounce, content, remoteJid, debounceTime, async (debouncedContent) => {
                    await this.processBot(this.waMonitor.waInstances[instance.instanceName], remoteJid, findBot, session, mergedSettings, debouncedContent, msg?.pushName, msg);
                });
            }
            else {
                await this.processBot(this.waMonitor.waInstances[instance.instanceName], remoteJid, findBot, session, mergedSettings, content, msg?.pushName, msg);
            }
        }
        catch (error) {
            this.logger.error(error);
        }
    }
}
exports.BaseChatbotController = BaseChatbotController;
