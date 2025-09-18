"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyController = void 0;
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const makeProxyAgent_1 = require("@utils/makeProxyAgent");
const axios_1 = __importDefault(require("axios"));
const logger = new logger_config_1.Logger('ProxyController');
class ProxyController {
    constructor(proxyService, waMonitor) {
        this.proxyService = proxyService;
        this.waMonitor = waMonitor;
    }
    async createProxy(instance, data) {
        if (!this.waMonitor.waInstances[instance.instanceName]) {
            throw new _exceptions_1.NotFoundException(`The "${instance.instanceName}" instance does not exist`);
        }
        if (!data?.enabled) {
            data.host = '';
            data.port = '';
            data.protocol = '';
            data.username = '';
            data.password = '';
        }
        if (data.host) {
            const testProxy = await this.testProxy(data);
            if (!testProxy) {
                throw new _exceptions_1.BadRequestException('Invalid proxy');
            }
        }
        return this.proxyService.create(instance, data);
    }
    async findProxy(instance) {
        if (!this.waMonitor.waInstances[instance.instanceName]) {
            throw new _exceptions_1.NotFoundException(`The "${instance.instanceName}" instance does not exist`);
        }
        return this.proxyService.find(instance);
    }
    async testProxy(proxy) {
        try {
            const serverIp = await axios_1.default.get('https://icanhazip.com/');
            const response = await axios_1.default.get('https://icanhazip.com/', {
                httpsAgent: (0, makeProxyAgent_1.makeProxyAgent)(proxy),
            });
            const result = response?.data !== serverIp?.data;
            if (result) {
                logger.info('testProxy: proxy connection successful');
            }
            else {
                logger.warn("testProxy: proxy connection doesn't change the origin IP");
            }
            return result;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                logger.error('testProxy error: axios error: ' + error.message);
            }
            else {
                logger.error('testProxy error: unexpected error: ' + error);
            }
            return false;
        }
    }
}
exports.ProxyController = ProxyController;
