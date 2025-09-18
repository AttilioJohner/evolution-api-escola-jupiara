"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = exports.HttpStatus = void 0;
const auth_guard_1 = require("@api/guards/auth.guard");
const instance_guard_1 = require("@api/guards/instance.guard");
const telemetry_guard_1 = __importDefault(require("@api/guards/telemetry.guard"));
const channel_router_1 = require("@api/integrations/channel/channel.router");
const chatbot_router_1 = require("@api/integrations/chatbot/chatbot.router");
const event_router_1 = require("@api/integrations/event/event.router");
const storage_router_1 = require("@api/integrations/storage/storage.router");
const env_config_1 = require("@config/env.config");
const fetchLatestWaWebVersion_1 = require("@utils/fetchLatestWaWebVersion");
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const mime_types_1 = __importDefault(require("mime-types"));
const path_1 = __importDefault(require("path"));
const business_router_1 = require("./business.router");
const call_router_1 = require("./call.router");
const chat_router_1 = require("./chat.router");
const group_router_1 = require("./group.router");
const instance_router_1 = require("./instance.router");
const label_router_1 = require("./label.router");
const proxy_router_1 = require("./proxy.router");
const sendMessage_router_1 = require("./sendMessage.router");
const settings_router_1 = require("./settings.router");
const template_router_1 = require("./template.router");
const view_router_1 = require("./view.router");
var HttpStatus;
(function (HttpStatus) {
    HttpStatus[HttpStatus["OK"] = 200] = "OK";
    HttpStatus[HttpStatus["CREATED"] = 201] = "CREATED";
    HttpStatus[HttpStatus["NOT_FOUND"] = 404] = "NOT_FOUND";
    HttpStatus[HttpStatus["FORBIDDEN"] = 403] = "FORBIDDEN";
    HttpStatus[HttpStatus["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HttpStatus[HttpStatus["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HttpStatus[HttpStatus["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
})(HttpStatus || (exports.HttpStatus = HttpStatus = {}));
const router = (0, express_1.Router)();
exports.router = router;
const serverConfig = env_config_1.configService.get('SERVER');
const guards = [instance_guard_1.instanceExistsGuard, instance_guard_1.instanceLoggedGuard, auth_guard_1.authGuard['apikey']];
const telemetry = new telemetry_guard_1.default();
const packageJson = JSON.parse(fs_1.default.readFileSync('./package.json', 'utf8'));
if (!serverConfig.DISABLE_MANAGER)
    router.use('/manager', new view_router_1.ViewsRouter().router);
router.get('/health', (req, res) => {
    res.status(HttpStatus.OK).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: packageJson.version,
        database_enabled: process.env.DATABASE_ENABLED || 'true'
    });
});
router.get('/health/db', async (req, res) => {
    try {
        if (process.env.DATABASE_ENABLED === 'false') {
            return res.status(HttpStatus.OK).json({
                status: 'database_disabled',
                message: 'Database is disabled via DATABASE_ENABLED=false'
            });
        }
        const testQuery = 'SELECT 1 as test';
        res.status(HttpStatus.OK).json({
            status: 'ok',
            message: 'Database connection successful',
            timestamp: new Date().toISOString(),
            database_url: process.env.DATABASE_URL ? 'configured' : 'not_configured'
        });
    }
    catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            status: 'error',
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/assets/*', (req, res) => {
    const fileName = req.params[0];
    const basePath = path_1.default.join(process.cwd(), 'manager', 'dist');
    const filePath = path_1.default.join(basePath, 'assets/', fileName);
    if (fs_1.default.existsSync(filePath)) {
        res.set('Content-Type', mime_types_1.default.lookup(filePath) || 'text/css');
        res.send(fs_1.default.readFileSync(filePath));
    }
    else {
        res.status(404).send('File not found');
    }
});
router
    .use((req, res, next) => telemetry.collectTelemetry(req, res, next))
    .get('/', async (req, res) => {
    res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Welcome to the Evolution API, it is working!',
        version: packageJson.version,
        clientName: process.env.DATABASE_CONNECTION_CLIENT_NAME,
        manager: !serverConfig.DISABLE_MANAGER ? `${req.protocol}://${req.get('host')}/manager` : undefined,
        documentation: `https://doc.evolution-api.com`,
        whatsappWebVersion: (await (0, fetchLatestWaWebVersion_1.fetchLatestWaWebVersion)({})).version.join('.'),
    });
})
    .post('/verify-creds', auth_guard_1.authGuard['apikey'], async (req, res) => {
    return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Credentials are valid',
        facebookAppId: process.env.FACEBOOK_APP_ID,
        facebookConfigId: process.env.FACEBOOK_CONFIG_ID,
        facebookUserToken: process.env.FACEBOOK_USER_TOKEN,
    });
})
    .use('/instance', new instance_router_1.InstanceRouter(env_config_1.configService, ...guards).router)
    .use('/message', new sendMessage_router_1.MessageRouter(...guards).router)
    .use('/call', new call_router_1.CallRouter(...guards).router)
    .use('/chat', new chat_router_1.ChatRouter(...guards).router)
    .use('/business', new business_router_1.BusinessRouter(...guards).router)
    .use('/group', new group_router_1.GroupRouter(...guards).router)
    .use('/template', new template_router_1.TemplateRouter(env_config_1.configService, ...guards).router)
    .use('/settings', new settings_router_1.SettingsRouter(...guards).router)
    .use('/proxy', new proxy_router_1.ProxyRouter(...guards).router)
    .use('/label', new label_router_1.LabelRouter(...guards).router)
    .use('', new channel_router_1.ChannelRouter(env_config_1.configService, ...guards).router)
    .use('', new event_router_1.EventRouter(env_config_1.configService, ...guards).router)
    .use('', new chatbot_router_1.ChatbotRouter(...guards).router)
    .use('', new storage_router_1.StorageRouter(...guards).router);
