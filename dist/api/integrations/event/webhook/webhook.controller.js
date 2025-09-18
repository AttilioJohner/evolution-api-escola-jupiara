"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const axios_1 = __importDefault(require("axios"));
const jwt = __importStar(require("jsonwebtoken"));
const event_controller_1 = require("../event.controller");
class WebhookController extends event_controller_1.EventController {
    constructor(prismaRepository, waMonitor) {
        super(prismaRepository, waMonitor, true, 'webhook');
        this.logger = new logger_config_1.Logger('WebhookController');
    }
    async set(instanceName, data) {
        if (!data.webhook?.enabled) {
            data.webhook.events = [];
        }
        else {
            if (0 === data.webhook.events.length) {
                data.webhook.events = event_controller_1.EventController.events;
            }
        }
        return this.prisma.webhook.upsert({
            where: {
                instanceId: this.monitor.waInstances[instanceName].instanceId,
            },
            update: {
                enabled: data.webhook?.enabled,
                events: data.webhook?.events,
                url: data.webhook?.url,
                headers: data.webhook?.headers,
                webhookBase64: data.webhook.base64,
                webhookByEvents: data.webhook.byEvents,
            },
            create: {
                enabled: data.webhook?.enabled,
                events: data.webhook?.events,
                instanceId: this.monitor.waInstances[instanceName].instanceId,
                url: data.webhook?.url,
                headers: data.webhook?.headers,
                webhookBase64: data.webhook.base64,
                webhookByEvents: data.webhook.byEvents,
            },
        });
    }
    async emit({ instanceName, origin, event, data, serverUrl, dateTime, sender, apiKey, local, integration, }) {
        if (integration && !integration.includes('webhook')) {
            return;
        }
        const instance = (await this.get(instanceName));
        const webhookConfig = env_config_1.configService.get('WEBHOOK');
        const webhookLocal = instance?.events;
        const webhookHeaders = { ...(instance?.headers || {}) };
        if (webhookHeaders && 'jwt_key' in webhookHeaders) {
            const jwtKey = webhookHeaders['jwt_key'];
            const jwtToken = this.generateJwtToken(jwtKey);
            webhookHeaders['Authorization'] = `Bearer ${jwtToken}`;
            delete webhookHeaders['jwt_key'];
        }
        const we = event.replace(/[.-]/gm, '_').toUpperCase();
        const transformedWe = we.replace(/_/gm, '-').toLowerCase();
        const enabledLog = env_config_1.configService.get('LOG').LEVEL.includes('WEBHOOKS');
        const regex = /^(https?:\/\/)/;
        const webhookData = {
            event,
            instance: instanceName,
            data,
            destination: instance?.url || `${webhookConfig.GLOBAL.URL}/${transformedWe}`,
            date_time: dateTime,
            sender,
            server_url: serverUrl,
            apikey: apiKey,
        };
        if (local && instance?.enabled) {
            if (Array.isArray(webhookLocal) && webhookLocal.includes(we)) {
                let baseURL;
                if (instance?.webhookByEvents) {
                    baseURL = `${instance?.url}/${transformedWe}`;
                }
                else {
                    baseURL = instance?.url;
                }
                if (enabledLog) {
                    const logData = {
                        local: `${origin}.sendData-Webhook`,
                        url: baseURL,
                        ...webhookData,
                    };
                    this.logger.log(logData);
                }
                try {
                    if (instance?.enabled && regex.test(instance.url)) {
                        const httpService = axios_1.default.create({
                            baseURL,
                            headers: webhookHeaders,
                            timeout: webhookConfig.REQUEST?.TIMEOUT_MS ?? 30000,
                        });
                        await this.retryWebhookRequest(httpService, webhookData, `${origin}.sendData-Webhook`, baseURL, serverUrl);
                    }
                }
                catch (error) {
                    this.logger.error({
                        local: `${origin}.sendData-Webhook`,
                        message: `Todas as tentativas falharam: ${error?.message}`,
                        hostName: error?.hostname,
                        syscall: error?.syscall,
                        code: error?.code,
                        error: error?.errno,
                        stack: error?.stack,
                        name: error?.name,
                        url: baseURL,
                        server_url: serverUrl,
                    });
                }
            }
        }
        if (webhookConfig.GLOBAL?.ENABLED) {
            if (webhookConfig.EVENTS[we]) {
                let globalURL = webhookConfig.GLOBAL.URL;
                if (webhookConfig.GLOBAL.WEBHOOK_BY_EVENTS) {
                    globalURL = `${globalURL}/${transformedWe}`;
                }
                if (enabledLog) {
                    const logData = {
                        local: `${origin}.sendData-Webhook-Global`,
                        url: globalURL,
                        ...webhookData,
                    };
                    this.logger.log(logData);
                }
                try {
                    if (regex.test(globalURL)) {
                        const httpService = axios_1.default.create({
                            baseURL: globalURL,
                            timeout: webhookConfig.REQUEST?.TIMEOUT_MS ?? 30000,
                        });
                        await this.retryWebhookRequest(httpService, webhookData, `${origin}.sendData-Webhook-Global`, globalURL, serverUrl);
                    }
                }
                catch (error) {
                    this.logger.error({
                        local: `${origin}.sendData-Webhook-Global`,
                        message: `Todas as tentativas falharam: ${error?.message}`,
                        hostName: error?.hostname,
                        syscall: error?.syscall,
                        code: error?.code,
                        error: error?.errno,
                        stack: error?.stack,
                        name: error?.name,
                        url: globalURL,
                        server_url: serverUrl,
                    });
                }
            }
        }
    }
    async retryWebhookRequest(httpService, webhookData, origin, baseURL, serverUrl, maxRetries, delaySeconds) {
        const webhookConfig = env_config_1.configService.get('WEBHOOK');
        const maxRetryAttempts = maxRetries ?? webhookConfig.RETRY?.MAX_ATTEMPTS ?? 10;
        const initialDelay = delaySeconds ?? webhookConfig.RETRY?.INITIAL_DELAY_SECONDS ?? 5;
        const useExponentialBackoff = webhookConfig.RETRY?.USE_EXPONENTIAL_BACKOFF ?? true;
        const maxDelay = webhookConfig.RETRY?.MAX_DELAY_SECONDS ?? 300;
        const jitterFactor = webhookConfig.RETRY?.JITTER_FACTOR ?? 0.2;
        const nonRetryableStatusCodes = webhookConfig.RETRY?.NON_RETRYABLE_STATUS_CODES ?? [400, 401, 403, 404, 422];
        let attempts = 0;
        while (attempts < maxRetryAttempts) {
            try {
                await httpService.post('', webhookData);
                if (attempts > 0) {
                    this.logger.log({
                        local: `${origin}`,
                        message: `Sucesso no envio após ${attempts + 1} tentativas`,
                        url: baseURL,
                    });
                }
                return;
            }
            catch (error) {
                attempts++;
                const isTimeout = error.code === 'ECONNABORTED';
                if (error?.response?.status && nonRetryableStatusCodes.includes(error.response.status)) {
                    this.logger.error({
                        local: `${origin}`,
                        message: `Erro não recuperável (${error.response.status}): ${error?.message}. Cancelando retentativas.`,
                        statusCode: error?.response?.status,
                        url: baseURL,
                        server_url: serverUrl,
                    });
                    throw error;
                }
                this.logger.error({
                    local: `${origin}`,
                    message: `Tentativa ${attempts}/${maxRetryAttempts} falhou: ${isTimeout ? 'Timeout da requisição' : error?.message}`,
                    hostName: error?.hostname,
                    syscall: error?.syscall,
                    code: error?.code,
                    isTimeout,
                    statusCode: error?.response?.status,
                    error: error?.errno,
                    stack: error?.stack,
                    name: error?.name,
                    url: baseURL,
                    server_url: serverUrl,
                });
                if (attempts === maxRetryAttempts) {
                    throw error;
                }
                let nextDelay = initialDelay;
                if (useExponentialBackoff) {
                    nextDelay = Math.min(initialDelay * Math.pow(2, attempts - 1), maxDelay);
                    const jitter = nextDelay * jitterFactor * (Math.random() * 2 - 1);
                    nextDelay = Math.max(initialDelay, nextDelay + jitter);
                }
                this.logger.log({
                    local: `${origin}`,
                    message: `Aguardando ${nextDelay.toFixed(1)} segundos antes da próxima tentativa`,
                    url: baseURL,
                });
                await new Promise((resolve) => setTimeout(resolve, nextDelay * 1000));
            }
        }
    }
    generateJwtToken(authToken) {
        try {
            const payload = {
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 600,
                app: 'evolution',
                action: 'webhook',
            };
            const token = jwt.sign(payload, authToken, { algorithm: 'HS256' });
            return token;
        }
        catch (error) {
            this.logger.error({
                local: 'WebhookController.generateJwtToken',
                message: `JWT generation failed: ${error?.message}`,
            });
            throw error;
        }
    }
}
exports.WebhookController = WebhookController;
