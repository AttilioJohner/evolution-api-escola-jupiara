"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatwootController = void 0;
const chatwoot_service_1 = require("@api/integrations/chatbot/chatwoot/services/chatwoot.service");
const server_module_1 = require("@api/server.module");
const cache_service_1 = require("@api/services/cache.service");
const cacheengine_1 = require("@cache/cacheengine");
const _exceptions_1 = require("@exceptions");
const class_validator_1 = require("class-validator");
class ChatwootController {
    constructor(chatwootService, configService, prismaRepository) {
        this.chatwootService = chatwootService;
        this.configService = configService;
        this.prismaRepository = prismaRepository;
    }
    async createChatwoot(instance, data) {
        if (!this.configService.get('CHATWOOT').ENABLED)
            throw new _exceptions_1.BadRequestException('Chatwoot is disabled');
        if (data?.enabled) {
            if (!(0, class_validator_1.isURL)(data.url, { require_tld: false })) {
                throw new _exceptions_1.BadRequestException('url is not valid');
            }
            if (!data.accountId) {
                throw new _exceptions_1.BadRequestException('accountId is required');
            }
            if (!data.token) {
                throw new _exceptions_1.BadRequestException('token is required');
            }
            if (data.signMsg !== true && data.signMsg !== false) {
                throw new _exceptions_1.BadRequestException('signMsg is required');
            }
            if (data.signMsg === false)
                data.signDelimiter = null;
        }
        if (!data.nameInbox || data.nameInbox === '') {
            data.nameInbox = instance.instanceName;
        }
        const result = await this.chatwootService.create(instance, data);
        const urlServer = this.configService.get('SERVER').URL;
        const response = {
            ...result,
            webhook_url: `${urlServer}/chatwoot/webhook/${encodeURIComponent(instance.instanceName)}`,
        };
        return response;
    }
    async findChatwoot(instance) {
        if (!this.configService.get('CHATWOOT').ENABLED)
            throw new _exceptions_1.BadRequestException('Chatwoot is disabled');
        const result = await this.chatwootService.find(instance);
        const urlServer = this.configService.get('SERVER').URL;
        if (Object.keys(result || {}).length === 0) {
            return {
                enabled: false,
                url: '',
                accountId: '',
                token: '',
                signMsg: false,
                nameInbox: '',
                webhook_url: '',
            };
        }
        const response = {
            ...result,
            webhook_url: `${urlServer}/chatwoot/webhook/${encodeURIComponent(instance.instanceName)}`,
        };
        return response;
    }
    async receiveWebhook(instance, data) {
        if (!this.configService.get('CHATWOOT').ENABLED)
            throw new _exceptions_1.BadRequestException('Chatwoot is disabled');
        const chatwootCache = new cache_service_1.CacheService(new cacheengine_1.CacheEngine(this.configService, chatwoot_service_1.ChatwootService.name).getEngine());
        const chatwootService = new chatwoot_service_1.ChatwootService(server_module_1.waMonitor, this.configService, this.prismaRepository, chatwootCache);
        return chatwootService.receiveWebhook(instance, data);
    }
}
exports.ChatwootController = ChatwootController;
