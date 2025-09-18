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
require("./utils/instrumentSentry");
const sessions_1 = require("@api/provider/sessions");
const repository_service_1 = require("@api/repository/repository.service");
const index_router_1 = require("@api/routes/index.router");
const server_module_1 = require("@api/server.module");
const env_config_1 = require("@config/env.config");
const error_config_1 = require("@config/error.config");
const logger_config_1 = require("@config/logger.config");
const path_config_1 = require("@config/path.config");
const Sentry = __importStar(require("@sentry/node"));
const server_up_1 = require("@utils/server-up");
const axios_1 = __importDefault(require("axios"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importStar(require("express"));
const path_1 = require("path");
function initWA() {
    server_module_1.waMonitor.loadInstance();
}
async function bootstrap() {
    const logger = new logger_config_1.Logger('SERVER');
    const app = (0, express_1.default)();
    let providerFiles = null;
    if (env_config_1.configService.get('PROVIDER').ENABLED) {
        providerFiles = new sessions_1.ProviderFiles(env_config_1.configService);
        await providerFiles.onModuleInit();
        logger.info('Provider:Files - ON');
    }
    const prismaRepository = new repository_service_1.PrismaRepository(env_config_1.configService);
    await prismaRepository.onModuleInit();
    app.use((0, cors_1.default)({
        origin(requestOrigin, callback) {
            const { ORIGIN } = env_config_1.configService.get('CORS');
            if (ORIGIN.includes('*')) {
                return callback(null, true);
            }
            if (ORIGIN.indexOf(requestOrigin) !== -1) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        },
        methods: [...env_config_1.configService.get('CORS').METHODS],
        credentials: env_config_1.configService.get('CORS').CREDENTIALS,
    }), (0, express_1.urlencoded)({ extended: true, limit: '136mb' }), (0, express_1.json)({ limit: '136mb' }), (0, compression_1.default)());
    app.set('view engine', 'hbs');
    app.set('views', (0, path_1.join)(path_config_1.ROOT_DIR, 'views'));
    app.use(express_1.default.static((0, path_1.join)(path_config_1.ROOT_DIR, 'public')));
    app.use('/store', express_1.default.static((0, path_1.join)(path_config_1.ROOT_DIR, 'store')));
    app.use('/', index_router_1.router);
    app.use((err, req, res, next) => {
        if (err) {
            const webhook = env_config_1.configService.get('WEBHOOK');
            if (webhook.EVENTS.ERRORS_WEBHOOK && webhook.EVENTS.ERRORS_WEBHOOK != '' && webhook.EVENTS.ERRORS) {
                const tzoffset = new Date().getTimezoneOffset() * 60000;
                const localISOTime = new Date(Date.now() - tzoffset).toISOString();
                const now = localISOTime;
                const globalApiKey = env_config_1.configService.get('AUTHENTICATION').API_KEY.KEY;
                const serverUrl = env_config_1.configService.get('SERVER').URL;
                const errorData = {
                    event: 'error',
                    data: {
                        error: err['error'] || 'Internal Server Error',
                        message: err['message'] || 'Internal Server Error',
                        status: err['status'] || 500,
                        response: {
                            message: err['message'] || 'Internal Server Error',
                        },
                    },
                    date_time: now,
                    api_key: globalApiKey,
                    server_url: serverUrl,
                };
                logger.error(errorData);
                const baseURL = webhook.EVENTS.ERRORS_WEBHOOK;
                const httpService = axios_1.default.create({ baseURL });
                httpService.post('', errorData);
            }
            return res.status(err['status'] || 500).json({
                status: err['status'] || 500,
                error: err['error'] || 'Internal Server Error',
                response: {
                    message: err['message'] || 'Internal Server Error',
                },
            });
        }
        next();
    }, (req, res, next) => {
        const { method, url } = req;
        res.status(index_router_1.HttpStatus.NOT_FOUND).json({
            status: index_router_1.HttpStatus.NOT_FOUND,
            error: 'Not Found',
            response: {
                message: [`Cannot ${method.toUpperCase()} ${url}`],
            },
        });
        next();
    });
    const httpServer = env_config_1.configService.get('SERVER');
    server_up_1.ServerUP.app = app;
    let server = server_up_1.ServerUP[httpServer.TYPE];
    if (server === null) {
        logger.warn('SSL cert load failed — falling back to HTTP.');
        logger.info("Ensure 'SSL_CONF_PRIVKEY' and 'SSL_CONF_FULLCHAIN' env vars point to valid certificate files.");
        httpServer.TYPE = 'http';
        server = server_up_1.ServerUP[httpServer.TYPE];
    }
    server_module_1.eventManager.init(server);
    if (process.env.SENTRY_DSN) {
        logger.info('Sentry - ON');
        Sentry.setupExpressErrorHandler(app);
    }
    server.listen(httpServer.PORT, () => logger.log(httpServer.TYPE.toUpperCase() + ' - ON: ' + httpServer.PORT));
    initWA();
    (0, error_config_1.onUnexpectedError)();
}
bootstrap();
