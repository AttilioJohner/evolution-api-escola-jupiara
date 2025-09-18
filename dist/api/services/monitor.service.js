"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAMonitoringService = void 0;
const server_module_1 = require("@api/server.module");
const wa_types_1 = require("@api/types/wa.types");
const logger_config_1 = require("@config/logger.config");
const path_config_1 = require("@config/path.config");
const _exceptions_1 = require("@exceptions");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
class WAMonitoringService {
    constructor(eventEmitter, configService, prismaRepository, providerFiles, cache, chatwootCache, baileysCache) {
        this.eventEmitter = eventEmitter;
        this.configService = configService;
        this.prismaRepository = prismaRepository;
        this.providerFiles = providerFiles;
        this.cache = cache;
        this.chatwootCache = chatwootCache;
        this.baileysCache = baileysCache;
        this.db = {};
        this.redis = {};
        this.logger = new logger_config_1.Logger('WAMonitoringService');
        this.waInstances = {};
        this.providerSession = Object.freeze(this.configService.get('PROVIDER'));
        this.removeInstance();
        this.noConnection();
        Object.assign(this.db, configService.get('DATABASE'));
        Object.assign(this.redis, configService.get('CACHE'));
    }
    delInstanceTime(instance) {
        const time = this.configService.get('DEL_INSTANCE');
        if (typeof time === 'number' && time > 0) {
            setTimeout(async () => {
                if (this.waInstances[instance]?.connectionStatus?.state !== 'open') {
                    if (this.waInstances[instance]?.connectionStatus?.state === 'connecting') {
                        if ((await this.waInstances[instance].integration) === wa_types_1.Integration.WHATSAPP_BAILEYS) {
                            await this.waInstances[instance]?.client?.logout('Log out instance: ' + instance);
                            this.waInstances[instance]?.client?.ws?.close();
                            this.waInstances[instance]?.client?.end(undefined);
                        }
                        this.eventEmitter.emit('remove.instance', instance, 'inner');
                    }
                    else {
                        this.eventEmitter.emit('remove.instance', instance, 'inner');
                    }
                }
            }, 1000 * 60 * time);
        }
    }
    async instanceInfo(instanceNames) {
        if (instanceNames && instanceNames.length > 0) {
            const inexistentInstances = instanceNames ? instanceNames.filter((instance) => !this.waInstances[instance]) : [];
            if (inexistentInstances.length > 0) {
                throw new _exceptions_1.NotFoundException(`Instance${inexistentInstances.length > 1 ? 's' : ''} "${inexistentInstances.join(', ')}" not found`);
            }
        }
        const clientName = this.configService.get('DATABASE').CONNECTION.CLIENT_NAME;
        const where = instanceNames && instanceNames.length > 0
            ? {
                name: {
                    in: instanceNames,
                },
                clientName,
            }
            : { clientName };
        const instances = await this.prismaRepository.instance.findMany({
            where,
            include: {
                Chatwoot: true,
                Proxy: true,
                Rabbitmq: true,
                Nats: true,
                Sqs: true,
                Websocket: true,
                Setting: true,
                _count: {
                    select: {
                        Message: true,
                        Contact: true,
                        Chat: true,
                    },
                },
            },
        });
        return instances;
    }
    async instanceInfoById(instanceId, number) {
        let instanceName;
        if (instanceId) {
            instanceName = await this.prismaRepository.instance.findFirst({ where: { id: instanceId } }).then((r) => r?.name);
            if (!instanceName) {
                throw new _exceptions_1.NotFoundException(`Instance "${instanceId}" not found`);
            }
        }
        else if (number) {
            instanceName = await this.prismaRepository.instance.findFirst({ where: { number } }).then((r) => r?.name);
            if (!instanceName) {
                throw new _exceptions_1.NotFoundException(`Instance "${number}" not found`);
            }
        }
        if (!instanceName) {
            throw new _exceptions_1.NotFoundException(`Instance "${instanceId}" not found`);
        }
        if (instanceName && !this.waInstances[instanceName]) {
            throw new _exceptions_1.NotFoundException(`Instance "${instanceName}" not found`);
        }
        const instanceNames = instanceName ? [instanceName] : null;
        return this.instanceInfo(instanceNames);
    }
    async cleaningUp(instanceName) {
        let instanceDbId;
        if (this.db.SAVE_DATA.INSTANCE && this.configService.get('DATABASE_ENABLED') === 'true') {
            const findInstance = await this.prismaRepository.instance.findFirst({
                where: { name: instanceName },
            });
            if (findInstance) {
                const instance = await this.prismaRepository.instance.update({
                    where: { name: instanceName },
                    data: { connectionStatus: 'close' },
                });
                (0, fs_1.rmSync)((0, path_1.join)(path_config_1.INSTANCE_DIR, instance.id), { recursive: true, force: true });
                instanceDbId = instance.id;
                await this.prismaRepository.session.deleteMany({ where: { sessionId: instance.id } });
            }
        }
        if (this.redis.REDIS.ENABLED && this.redis.REDIS.SAVE_INSTANCES) {
            await this.cache.delete(instanceName);
            if (instanceDbId) {
                await this.cache.delete(instanceDbId);
            }
        }
        if (this.providerSession?.ENABLED) {
            await this.providerFiles.removeSession(instanceName);
        }
    }
    async cleaningStoreData(instanceName) {
        if (this.configService.get('CHATWOOT').ENABLED) {
            const instancePath = (0, path_1.join)(path_config_1.STORE_DIR, 'chatwoot', instanceName);
            (0, child_process_1.execFileSync)('rm', ['-rf', instancePath]);
        }
        const instance = await this.prismaRepository.instance.findFirst({
            where: { name: instanceName },
        });
        if (!instance)
            return;
        (0, fs_1.rmSync)((0, path_1.join)(path_config_1.INSTANCE_DIR, instance.id), { recursive: true, force: true });
        await this.prismaRepository.session.deleteMany({ where: { sessionId: instance.id } });
        await this.prismaRepository.chat.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.contact.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.messageUpdate.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.message.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.webhook.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.chatwoot.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.proxy.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.rabbitmq.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.nats.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.sqs.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.integrationSession.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.typebot.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.websocket.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.setting.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.label.deleteMany({ where: { instanceId: instance.id } });
        await this.prismaRepository.instance.delete({ where: { name: instanceName } });
    }
    async loadInstance() {
        try {
            if (this.providerSession?.ENABLED) {
                await this.loadInstancesFromProvider();
            }
            else if (this.db.SAVE_DATA.INSTANCE) {
                await this.loadInstancesFromDatabasePostgres();
            }
            else if (this.redis.REDIS.ENABLED && this.redis.REDIS.SAVE_INSTANCES) {
                await this.loadInstancesFromRedis();
            }
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async saveInstance(data) {
        try {
            if (this.configService.get('DATABASE_ENABLED') !== 'true') {
                return;
            }
            const clientName = await this.configService.get('DATABASE').CONNECTION.CLIENT_NAME;
            await this.prismaRepository.instance.create({
                data: {
                    id: data.instanceId,
                    name: data.instanceName,
                    ownerJid: data.ownerJid,
                    profileName: data.profileName,
                    profilePicUrl: data.profilePicUrl,
                    connectionStatus: data.integration && data.integration === wa_types_1.Integration.WHATSAPP_BAILEYS ? 'close' : (data.status ?? 'open'),
                    number: data.number,
                    integration: data.integration || wa_types_1.Integration.WHATSAPP_BAILEYS,
                    token: data.hash,
                    clientName: clientName,
                    businessId: data.businessId,
                },
            });
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    deleteInstance(instanceName) {
        try {
            this.eventEmitter.emit('remove.instance', instanceName, 'inner');
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async setInstance(instanceData) {
        const instance = server_module_1.channelController.init(instanceData, {
            configService: this.configService,
            eventEmitter: this.eventEmitter,
            prismaRepository: this.prismaRepository,
            cache: this.cache,
            chatwootCache: this.chatwootCache,
            baileysCache: this.baileysCache,
            providerFiles: this.providerFiles,
        });
        if (!instance)
            return;
        instance.setInstance({
            instanceId: instanceData.instanceId,
            instanceName: instanceData.instanceName,
            integration: instanceData.integration,
            token: instanceData.token,
            number: instanceData.number,
            businessId: instanceData.businessId,
        });
        await instance.connectToWhatsapp();
        this.waInstances[instanceData.instanceName] = instance;
    }
    async loadInstancesFromRedis() {
        const keys = await this.cache.keys();
        if (keys?.length > 0) {
            await Promise.all(keys.map(async (k) => {
                const instanceData = await this.prismaRepository.instance.findUnique({
                    where: { id: k.split(':')[1] },
                });
                if (!instanceData) {
                    return;
                }
                const instance = {
                    instanceId: k.split(':')[1],
                    instanceName: k.split(':')[2],
                    integration: instanceData.integration,
                    token: instanceData.token,
                    number: instanceData.number,
                    businessId: instanceData.businessId,
                };
                this.setInstance(instance);
            }));
        }
    }
    async loadInstancesFromDatabasePostgres() {
        const clientName = await this.configService.get('DATABASE').CONNECTION.CLIENT_NAME;
        const instances = await this.prismaRepository.instance.findMany({
            where: { clientName: clientName },
        });
        if (instances.length === 0) {
            return;
        }
        await Promise.all(instances.map(async (instance) => {
            this.setInstance({
                instanceId: instance.id,
                instanceName: instance.name,
                integration: instance.integration,
                token: instance.token,
                number: instance.number,
                businessId: instance.businessId,
            });
        }));
    }
    async loadInstancesFromProvider() {
        const [instances] = await this.providerFiles.allInstances();
        if (!instances?.data) {
            return;
        }
        await Promise.all(instances?.data?.map(async (instanceId) => {
            const instance = await this.prismaRepository.instance.findUnique({
                where: { id: instanceId },
            });
            this.setInstance({
                instanceId: instance.id,
                instanceName: instance.name,
                integration: instance.integration,
                token: instance.token,
                businessId: instance.businessId,
            });
        }));
    }
    removeInstance() {
        this.eventEmitter.on('remove.instance', async (instanceName) => {
            try {
                await this.waInstances[instanceName]?.sendDataWebhook(wa_types_1.Events.REMOVE_INSTANCE, null);
                this.cleaningUp(instanceName);
                this.cleaningStoreData(instanceName);
            }
            finally {
                this.logger.warn(`Instance "${instanceName}" - REMOVED`);
            }
            try {
                delete this.waInstances[instanceName];
            }
            catch (error) {
                this.logger.error(error);
            }
        });
        this.eventEmitter.on('logout.instance', async (instanceName) => {
            try {
                await this.waInstances[instanceName]?.sendDataWebhook(wa_types_1.Events.LOGOUT_INSTANCE, null);
                if (this.configService.get('CHATWOOT').ENABLED) {
                    this.waInstances[instanceName]?.clearCacheChatwoot();
                }
                this.cleaningUp(instanceName);
            }
            finally {
                this.logger.warn(`Instance "${instanceName}" - LOGOUT`);
            }
        });
    }
    noConnection() {
        this.eventEmitter.on('no.connection', async (instanceName) => {
            try {
                await this.waInstances[instanceName]?.client?.logout('Log out instance: ' + instanceName);
                this.waInstances[instanceName]?.client?.ws?.close();
                this.waInstances[instanceName].instance.qrcode = { count: 0 };
                this.waInstances[instanceName].stateConnection.state = 'close';
            }
            catch (error) {
                this.logger.error({
                    localError: 'noConnection',
                    warn: 'Error deleting instance from memory.',
                    error,
                });
            }
            finally {
                this.logger.warn(`Instance "${instanceName}" - NOT CONNECTION`);
            }
        });
    }
}
exports.WAMonitoringService = WAMonitoringService;
