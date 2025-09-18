"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceController = void 0;
const server_module_1 = require("@api/server.module");
const wa_types_1 = require("@api/types/wa.types");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const baileys_1 = require("baileys");
const class_validator_1 = require("class-validator");
const uuid_1 = require("uuid");
class InstanceController {
    constructor(waMonitor, configService, prismaRepository, eventEmitter, chatwootService, settingsService, proxyService, cache, chatwootCache, baileysCache, providerFiles) {
        this.waMonitor = waMonitor;
        this.configService = configService;
        this.prismaRepository = prismaRepository;
        this.eventEmitter = eventEmitter;
        this.chatwootService = chatwootService;
        this.settingsService = settingsService;
        this.proxyService = proxyService;
        this.cache = cache;
        this.chatwootCache = chatwootCache;
        this.baileysCache = baileysCache;
        this.providerFiles = providerFiles;
        this.logger = new logger_config_1.Logger('InstanceController');
    }
    async createInstance(instanceData) {
        try {
            const instance = server_module_1.channelController.init(instanceData, {
                configService: this.configService,
                eventEmitter: this.eventEmitter,
                prismaRepository: this.prismaRepository,
                cache: this.cache,
                chatwootCache: this.chatwootCache,
                baileysCache: this.baileysCache,
                providerFiles: this.providerFiles,
            });
            if (!instance) {
                throw new _exceptions_1.BadRequestException('Invalid integration');
            }
            const instanceId = (0, uuid_1.v4)();
            instanceData.instanceId = instanceId;
            let hash;
            if (!instanceData.token)
                hash = (0, uuid_1.v4)().toUpperCase();
            else
                hash = instanceData.token;
            await this.waMonitor.saveInstance({
                instanceId,
                integration: instanceData.integration,
                instanceName: instanceData.instanceName,
                ownerJid: instanceData.ownerJid,
                profileName: instanceData.profileName,
                profilePicUrl: instanceData.profilePicUrl,
                hash,
                number: instanceData.number,
                businessId: instanceData.businessId,
                status: instanceData.status,
            });
            instance.setInstance({
                instanceName: instanceData.instanceName,
                instanceId,
                integration: instanceData.integration,
                token: hash,
                number: instanceData.number,
                businessId: instanceData.businessId,
            });
            this.waMonitor.waInstances[instance.instanceName] = instance;
            this.waMonitor.delInstanceTime(instance.instanceName);
            await server_module_1.eventManager.setInstance(instance.instanceName, instanceData);
            instance.sendDataWebhook(wa_types_1.Events.INSTANCE_CREATE, {
                instanceName: instanceData.instanceName,
                instanceId: instanceId,
            });
            if (instanceData.proxyHost && instanceData.proxyPort && instanceData.proxyProtocol) {
                const testProxy = await this.proxyService.testProxy({
                    host: instanceData.proxyHost,
                    port: instanceData.proxyPort,
                    protocol: instanceData.proxyProtocol,
                    username: instanceData.proxyUsername,
                    password: instanceData.proxyPassword,
                });
                if (!testProxy) {
                    throw new _exceptions_1.BadRequestException('Invalid proxy');
                }
                await this.proxyService.createProxy(instance, {
                    enabled: true,
                    host: instanceData.proxyHost,
                    port: instanceData.proxyPort,
                    protocol: instanceData.proxyProtocol,
                    username: instanceData.proxyUsername,
                    password: instanceData.proxyPassword,
                });
            }
            const settings = {
                rejectCall: instanceData.rejectCall === true,
                msgCall: instanceData.msgCall || '',
                groupsIgnore: instanceData.groupsIgnore === true,
                alwaysOnline: instanceData.alwaysOnline === true,
                readMessages: instanceData.readMessages === true,
                readStatus: instanceData.readStatus === true,
                syncFullHistory: instanceData.syncFullHistory === true,
                wavoipToken: instanceData.wavoipToken || '',
            };
            await this.settingsService.create(instance, settings);
            let webhookWaBusiness = null, accessTokenWaBusiness = '';
            if (instanceData.integration === wa_types_1.Integration.WHATSAPP_BUSINESS) {
                if (!instanceData.number) {
                    throw new _exceptions_1.BadRequestException('number is required');
                }
                const urlServer = this.configService.get('SERVER').URL;
                webhookWaBusiness = `${urlServer}/webhook/meta`;
                accessTokenWaBusiness = this.configService.get('WA_BUSINESS').TOKEN_WEBHOOK;
            }
            if (!instanceData.chatwootAccountId || !instanceData.chatwootToken || !instanceData.chatwootUrl) {
                let getQrcode;
                if (instanceData.qrcode && instanceData.integration === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                    await instance.connectToWhatsapp(instanceData.number);
                    await (0, baileys_1.delay)(5000);
                    getQrcode = instance.qrCode;
                }
                const result = {
                    instance: {
                        instanceName: instance.instanceName,
                        instanceId: instanceId,
                        integration: instanceData.integration,
                        webhookWaBusiness,
                        accessTokenWaBusiness,
                        status: instance.connectionStatus.state,
                    },
                    hash,
                    webhook: {
                        webhookUrl: instanceData?.webhook?.url,
                        webhookHeaders: instanceData?.webhook?.headers,
                        webhookByEvents: instanceData?.webhook?.byEvents,
                        webhookBase64: instanceData?.webhook?.base64,
                    },
                    websocket: {
                        enabled: instanceData?.websocket?.enabled,
                    },
                    rabbitmq: {
                        enabled: instanceData?.rabbitmq?.enabled,
                    },
                    nats: {
                        enabled: instanceData?.nats?.enabled,
                    },
                    sqs: {
                        enabled: instanceData?.sqs?.enabled,
                    },
                    settings,
                    qrcode: getQrcode,
                };
                return result;
            }
            if (!this.configService.get('CHATWOOT').ENABLED)
                throw new _exceptions_1.BadRequestException('Chatwoot is not enabled');
            if (!instanceData.chatwootAccountId) {
                throw new _exceptions_1.BadRequestException('accountId is required');
            }
            if (!instanceData.chatwootToken) {
                throw new _exceptions_1.BadRequestException('token is required');
            }
            if (!instanceData.chatwootUrl) {
                throw new _exceptions_1.BadRequestException('url is required');
            }
            if (!(0, class_validator_1.isURL)(instanceData.chatwootUrl, { require_tld: false })) {
                throw new _exceptions_1.BadRequestException('Invalid "url" property in chatwoot');
            }
            if (instanceData.chatwootSignMsg !== true && instanceData.chatwootSignMsg !== false) {
                throw new _exceptions_1.BadRequestException('signMsg is required');
            }
            if (instanceData.chatwootReopenConversation !== true && instanceData.chatwootReopenConversation !== false) {
                throw new _exceptions_1.BadRequestException('reopenConversation is required');
            }
            if (instanceData.chatwootConversationPending !== true && instanceData.chatwootConversationPending !== false) {
                throw new _exceptions_1.BadRequestException('conversationPending is required');
            }
            const urlServer = this.configService.get('SERVER').URL;
            try {
                this.chatwootService.create(instance, {
                    enabled: true,
                    accountId: instanceData.chatwootAccountId,
                    token: instanceData.chatwootToken,
                    url: instanceData.chatwootUrl,
                    signMsg: instanceData.chatwootSignMsg || false,
                    nameInbox: instanceData.chatwootNameInbox ?? instance.instanceName.split('-cwId-')[0],
                    number: instanceData.number,
                    reopenConversation: instanceData.chatwootReopenConversation || false,
                    conversationPending: instanceData.chatwootConversationPending || false,
                    importContacts: instanceData.chatwootImportContacts ?? true,
                    mergeBrazilContacts: instanceData.chatwootMergeBrazilContacts ?? false,
                    importMessages: instanceData.chatwootImportMessages ?? true,
                    daysLimitImportMessages: instanceData.chatwootDaysLimitImportMessages ?? 60,
                    organization: instanceData.chatwootOrganization,
                    logo: instanceData.chatwootLogo,
                    autoCreate: instanceData.chatwootAutoCreate !== false,
                });
            }
            catch (error) {
                this.logger.log(error);
            }
            return {
                instance: {
                    instanceName: instance.instanceName,
                    instanceId: instanceId,
                    integration: instanceData.integration,
                    webhookWaBusiness,
                    accessTokenWaBusiness,
                    status: instance.connectionStatus.state,
                },
                hash,
                webhook: {
                    webhookUrl: instanceData?.webhook?.url,
                    webhookHeaders: instanceData?.webhook?.headers,
                    webhookByEvents: instanceData?.webhook?.byEvents,
                    webhookBase64: instanceData?.webhook?.base64,
                },
                websocket: {
                    enabled: instanceData?.websocket?.enabled,
                },
                rabbitmq: {
                    enabled: instanceData?.rabbitmq?.enabled,
                },
                nats: {
                    enabled: instanceData?.nats?.enabled,
                },
                sqs: {
                    enabled: instanceData?.sqs?.enabled,
                },
                settings,
                chatwoot: {
                    enabled: true,
                    accountId: instanceData.chatwootAccountId,
                    token: instanceData.chatwootToken,
                    url: instanceData.chatwootUrl,
                    signMsg: instanceData.chatwootSignMsg || false,
                    reopenConversation: instanceData.chatwootReopenConversation || false,
                    conversationPending: instanceData.chatwootConversationPending || false,
                    mergeBrazilContacts: instanceData.chatwootMergeBrazilContacts ?? false,
                    importContacts: instanceData.chatwootImportContacts ?? true,
                    importMessages: instanceData.chatwootImportMessages ?? true,
                    daysLimitImportMessages: instanceData.chatwootDaysLimitImportMessages || 60,
                    number: instanceData.number,
                    nameInbox: instanceData.chatwootNameInbox ?? instance.instanceName,
                    webhookUrl: `${urlServer}/chatwoot/webhook/${encodeURIComponent(instance.instanceName)}`,
                },
            };
        }
        catch (error) {
            this.waMonitor.deleteInstance(instanceData.instanceName);
            this.logger.error((0, class_validator_1.isArray)(error.message) ? error.message[0] : error.message);
            throw new _exceptions_1.BadRequestException((0, class_validator_1.isArray)(error.message) ? error.message[0] : error.message);
        }
    }
    async connectToWhatsapp({ instanceName, number = null }) {
        const TAG = "connect-flow:instance.controller";
        function logStep(step, data) {
            const { toMessage } = require('../../lib/toMessage');
            console.error(TAG, step, data ? { message: toMessage(data) } : undefined);
        }
        try {
            logStep("iniciando connectToWhatsapp", { instanceName });
            const instance = this.waMonitor.waInstances[instanceName];
            const state = instance?.connectionStatus?.state || 'close';
            if (!state) {
                throw new _exceptions_1.BadRequestException('The "' + instanceName + '" instance does not exist');
            }
            if (state == 'open') {
                return await this.connectionState({ instanceName });
            }
            if (state == 'connecting') {
                return instance.qrCode;
            }
            if (state == 'close') {
                logStep("antes do connectToWhatsapp Baileys");
                await instance.connectToWhatsapp(number);
                await (0, baileys_1.delay)(2000);
                logStep("retornando qrCode", instance.qrCode);
                return instance.qrCode;
            }
            return {
                instance: {
                    instanceName: instanceName,
                    status: state,
                },
                qrcode: instance?.qrCode,
            };
        }
        catch (error) {
            logStep("erro no connectToWhatsapp", error);
            this.logger.error(error);
            const { toMessage } = require('../../lib/toMessage');
            return { error: true, message: toMessage(error) };
        }
    }
    async restartInstance({ instanceName }) {
        try {
            const instance = this.waMonitor.waInstances[instanceName];
            const state = instance?.connectionStatus?.state;
            if (!state) {
                throw new _exceptions_1.BadRequestException('The "' + instanceName + '" instance does not exist');
            }
            if (state == 'close') {
                throw new _exceptions_1.BadRequestException('The "' + instanceName + '" instance is not connected');
            }
            else if (state == 'open') {
                if (this.configService.get('CHATWOOT').ENABLED)
                    instance.clearCacheChatwoot();
                this.logger.info('restarting instance' + instanceName);
                instance.client?.ws?.close();
                instance.client?.end(new Error('restart'));
                return await this.connectToWhatsapp({ instanceName });
            }
            else if (state == 'connecting') {
                instance.client?.ws?.close();
                instance.client?.end(new Error('restart'));
                return await this.connectToWhatsapp({ instanceName });
            }
        }
        catch (error) {
            this.logger.error(error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { error: true, message: errorMessage };
        }
    }
    async connectionState({ instanceName }) {
        return {
            instance: {
                instanceName: instanceName,
                state: this.waMonitor.waInstances[instanceName]?.connectionStatus?.state,
            },
        };
    }
    async fetchInstances({ instanceName, instanceId, number }, key) {
        const env = this.configService.get('AUTHENTICATION').API_KEY;
        if (env.KEY !== key) {
            if (this.configService.get('DATABASE_ENABLED') !== 'true') {
                throw new _exceptions_1.UnauthorizedException('Database disabled - use global API key');
            }
            const instancesByKey = await this.prismaRepository.instance.findMany({
                where: {
                    token: key,
                    name: instanceName || undefined,
                    id: instanceId || undefined,
                },
            });
            if (instancesByKey.length > 0) {
                const names = instancesByKey.map((instance) => instance.name);
                return this.waMonitor.instanceInfo(names);
            }
            else {
                throw new _exceptions_1.UnauthorizedException();
            }
        }
        if (instanceId || number) {
            return this.waMonitor.instanceInfoById(instanceId, number);
        }
        const instanceNames = instanceName ? [instanceName] : null;
        return this.waMonitor.instanceInfo(instanceNames);
    }
    async setPresence({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].setPresence(data);
    }
    async logout({ instanceName }) {
        const { instance } = await this.connectionState({ instanceName });
        if (instance.state === 'close') {
            throw new _exceptions_1.BadRequestException('The "' + instanceName + '" instance is not connected');
        }
        try {
            this.waMonitor.waInstances[instanceName]?.logoutInstance();
            return { status: 'SUCCESS', error: false, response: { message: 'Instance logged out' } };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new _exceptions_1.InternalServerErrorException(errorMessage);
        }
    }
    async deleteInstance({ instanceName }) {
        const { instance } = await this.connectionState({ instanceName });
        try {
            const waInstances = this.waMonitor.waInstances[instanceName];
            if (this.configService.get('CHATWOOT').ENABLED)
                waInstances?.clearCacheChatwoot();
            if (instance.state === 'connecting' || instance.state === 'open') {
                await this.logout({ instanceName });
            }
            try {
                waInstances?.sendDataWebhook(wa_types_1.Events.INSTANCE_DELETE, {
                    instanceName,
                    instanceId: waInstances.instanceId,
                });
            }
            catch (error) {
                this.logger.error(error);
            }
            this.eventEmitter.emit('remove.instance', instanceName, 'inner');
            return { status: 'SUCCESS', error: false, response: { message: 'Instance deleted' } };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new _exceptions_1.BadRequestException(errorMessage);
        }
    }
}
exports.InstanceController = InstanceController;
