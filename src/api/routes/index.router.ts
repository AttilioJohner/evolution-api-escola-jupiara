import { authGuard } from '@api/guards/auth.guard';
import { instanceExistsGuard, instanceLoggedGuard } from '@api/guards/instance.guard';
import Telemetry from '@api/guards/telemetry.guard';
import { ChannelRouter } from '@api/integrations/channel/channel.router';
import { ChatbotRouter } from '@api/integrations/chatbot/chatbot.router';
import { EventRouter } from '@api/integrations/event/event.router';
import { StorageRouter } from '@api/integrations/storage/storage.router';
import { configService } from '@config/env.config';
import { fetchLatestWaWebVersion } from '@utils/fetchLatestWaWebVersion';
import { Router } from 'express';
import fs from 'fs';
import mimeTypes from 'mime-types';
import path from 'path';

import { BusinessRouter } from './business.router';
import { CallRouter } from './call.router';
import { ChatRouter } from './chat.router';
import { GroupRouter } from './group.router';
import { InstanceRouter } from './instance.router';
import { LabelRouter } from './label.router';
import { ProxyRouter } from './proxy.router';
import { MessageRouter } from './sendMessage.router';
import { SettingsRouter } from './settings.router';
import { TemplateRouter } from './template.router';
import { ViewsRouter } from './view.router';

enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NOT_FOUND = 404,
  FORBIDDEN = 403,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  INTERNAL_SERVER_ERROR = 500,
}

const router: Router = Router();
const serverConfig = configService.get('SERVER');
const guards = [instanceExistsGuard, instanceLoggedGuard, authGuard['apikey']];

const telemetry = new Telemetry();

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

if (!serverConfig.DISABLE_MANAGER) router.use('/manager', new ViewsRouter().router);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(HttpStatus.OK).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: packageJson.version,
    database_enabled: process.env.DATABASE_ENABLED || 'true'
  });
});

// Database health check endpoint
router.get('/health/db', async (req, res) => {
  const start = Date.now();

  try {
    if (process.env.DATABASE_ENABLED === 'false') {
      return res.status(HttpStatus.OK).json({
        status: 'database_disabled',
        message: 'Database is disabled via DATABASE_ENABLED=false'
      });
    }

    if (!process.env.DATABASE_URL) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        ok: false,
        status: 'configuration_error',
        message: 'DATABASE_URL not configured',
        timestamp: new Date().toISOString()
      });
    }

    // Import PrismaClient dynamically to avoid circular deps
    const { PrismaClient } = await import('@prisma/client');

    const prisma = new PrismaClient({
      log: ['error']
    });

    try {
      // Test actual database connection
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      await prisma.$disconnect();

      const duration = Date.now() - start;

      res.status(HttpStatus.OK).json({
        ok: true,
        status: 'connected',
        message: 'Database connection successful',
        timestamp: new Date().toISOString(),
        duration_ms: duration,
        connection_type: process.env.DATABASE_URL?.includes('pgbouncer=true') ? 'pooler' : 'direct',
        database_configured: true
      });

    } catch (dbError: any) {
      await prisma.$disconnect();
      throw dbError;
    }

  } catch (error: any) {
    const duration = Date.now() - start;
    const errorCode = error.code || error.errorCode || 'UNKNOWN';

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      ok: false,
      status: 'connection_failed',
      message: 'Database connection failed',
      error_code: errorCode,
      error_message: error.message || String(error),
      timestamp: new Date().toISOString(),
      duration_ms: duration
    });
  }
});

router.get('/assets/*', (req, res) => {
  const fileName = req.params[0];
  const basePath = path.join(process.cwd(), 'manager', 'dist');

  const filePath = path.join(basePath, 'assets/', fileName);

  if (fs.existsSync(filePath)) {
    res.set('Content-Type', mimeTypes.lookup(filePath) || 'text/css');
    res.send(fs.readFileSync(filePath));
  } else {
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
      whatsappWebVersion: (await fetchLatestWaWebVersion({})).version.join('.'),
    });
  })
  .post('/verify-creds', authGuard['apikey'], async (req, res) => {
    return res.status(HttpStatus.OK).json({
      status: HttpStatus.OK,
      message: 'Credentials are valid',
      facebookAppId: process.env.FACEBOOK_APP_ID,
      facebookConfigId: process.env.FACEBOOK_CONFIG_ID,
      facebookUserToken: process.env.FACEBOOK_USER_TOKEN,
    });
  })
  .use('/instance', new InstanceRouter(configService, ...guards).router)
  .use('/message', new MessageRouter(...guards).router)
  .use('/call', new CallRouter(...guards).router)
  .use('/chat', new ChatRouter(...guards).router)
  .use('/business', new BusinessRouter(...guards).router)
  .use('/group', new GroupRouter(...guards).router)
  .use('/template', new TemplateRouter(configService, ...guards).router)
  .use('/settings', new SettingsRouter(...guards).router)
  .use('/proxy', new ProxyRouter(...guards).router)
  .use('/label', new LabelRouter(...guards).router)
  .use('', new ChannelRouter(configService, ...guards).router)
  .use('', new EventRouter(configService, ...guards).router)
  .use('', new ChatbotRouter(...guards).router)
  .use('', new StorageRouter(...guards).router);

export { HttpStatus, router };
