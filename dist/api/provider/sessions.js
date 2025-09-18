"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderFiles = void 0;
const logger_config_1 = require("@config/logger.config");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
class ProviderFiles {
    constructor(configService) {
        this.configService = configService;
        this.logger = new logger_config_1.Logger('ProviderFiles');
        this.config = Object.freeze(this.configService.get('PROVIDER'));
        this.baseUrl = `http://${this.config.HOST}:${this.config.PORT}/session/${this.config.PREFIX}`;
        this.globalApiToken = this.configService.get('AUTHENTICATION').API_KEY.KEY;
    }
    get isEnabled() {
        return !!this.config?.ENABLED;
    }
    async onModuleInit() {
        if (this.config.ENABLED) {
            const url = `http://${this.config.HOST}:${this.config.PORT}`;
            try {
                const response = await axios_1.default.options(url + '/ping');
                if (response?.data != 'pong') {
                    throw new Error('Offline file provider.');
                }
                await axios_1.default.post(`${url}/session`, { group: this.config.PREFIX }, { headers: { apikey: this.globalApiToken } });
            }
            catch (error) {
                this.logger.error(['Failed to connect to the file server', error?.message, error?.stack]);
                const pid = process.pid;
                (0, child_process_1.execFileSync)('kill', ['-9', `${pid}`]);
            }
        }
    }
    async onModuleDestroy() {
    }
    async create(instance) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}`, {
                instance,
            }, { headers: { apikey: this.globalApiToken } });
            return [{ status: response.status, data: response?.data }];
        }
        catch (error) {
            return [
                {
                    status: error?.response?.status,
                    data: error?.response?.data,
                },
                error,
            ];
        }
    }
    async write(instance, key, data) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/${instance}/${key}`, data, {
                headers: { apikey: this.globalApiToken },
            });
            return [{ status: response.status, data: response?.data }];
        }
        catch (error) {
            return [
                {
                    status: error?.response?.status,
                    data: error?.response?.data,
                },
                error,
            ];
        }
    }
    async read(instance, key) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/${instance}/${key}`, {
                headers: { apikey: this.globalApiToken },
            });
            return [{ status: response.status, data: response?.data }];
        }
        catch (error) {
            return [
                {
                    status: error?.response?.status,
                    data: error?.response?.data,
                },
                error,
            ];
        }
    }
    async delete(instance, key) {
        try {
            const response = await axios_1.default.delete(`${this.baseUrl}/${instance}/${key}`, {
                headers: { apikey: this.globalApiToken },
            });
            return [{ status: response.status, data: response?.data }];
        }
        catch (error) {
            return [
                {
                    status: error?.response?.status,
                    data: error?.response?.data,
                },
                error,
            ];
        }
    }
    async allInstances() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/list-instances`, { headers: { apikey: this.globalApiToken } });
            return [{ status: response.status, data: response?.data }];
        }
        catch (error) {
            return [
                {
                    status: error?.response?.status,
                    data: error?.response?.data,
                },
                error,
            ];
        }
    }
    async removeSession(instance) {
        try {
            const response = await axios_1.default.delete(`${this.baseUrl}/${instance}`, { headers: { apikey: this.globalApiToken } });
            return [{ status: response.status, data: response?.data }];
        }
        catch (error) {
            return [
                {
                    status: error?.response?.status,
                    data: error?.response?.data,
                },
                error,
            ];
        }
    }
}
exports.ProviderFiles = ProviderFiles;
