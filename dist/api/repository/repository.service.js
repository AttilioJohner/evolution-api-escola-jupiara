"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaRepository = exports.Query = void 0;
const logger_config_1 = require("@config/logger.config");
const client_1 = require("@prisma/client");
class Query {
}
exports.Query = Query;
class PrismaRepository extends client_1.PrismaClient {
    constructor(configService) {
        super();
        this.configService = configService;
        this.logger = new logger_config_1.Logger('PrismaRepository');
    }
    async onModuleInit() {
        if (this.configService.get('DATABASE_ENABLED') === 'true') {
            await this.connectWithFallback();
            this.logger.info('Repository:Prisma - ON');
        }
        else {
            this.logger.info('Repository:Prisma - DISABLED');
        }
    }
    async connectWithFallback() {
        const databaseUrl = process.env.DATABASE_URL;
        const directUrl = process.env.DIRECT_URL;
        try {
            this.logger.info('Attempting primary database connection...');
            await this.$connect();
            await this.$queryRaw `SELECT 1`;
            const connectionType = databaseUrl?.includes('pgbouncer=true') ? 'pooler' : 'direct';
            this.logger.info(`Primary connection successful (${connectionType})`);
        }
        catch (primaryError) {
            this.logger.warn(`Primary connection failed: ${primaryError instanceof Error ? primaryError.message : primaryError}`);
            if (directUrl && directUrl !== databaseUrl) {
                try {
                    this.logger.info('Attempting fallback to direct connection...');
                    await this.$disconnect().catch(() => { });
                    const fallbackClient = new client_1.PrismaClient({
                        datasources: {
                            db: { url: directUrl }
                        }
                    });
                    Object.setPrototypeOf(this, fallbackClient);
                    Object.assign(this, fallbackClient);
                    await this.$connect();
                    await this.$queryRaw `SELECT 1`;
                    this.logger.info('✅ Fallback connection successful (direct)');
                    this.logger.warn('⚠️  Using fallback direct connection - pooler unavailable');
                }
                catch (fallbackError) {
                    this.logger.error('❌ Both primary and fallback connections failed');
                    this.logger.error(`Primary error: ${primaryError instanceof Error ? primaryError.message : primaryError}`);
                    this.logger.error(`Fallback error: ${fallbackError instanceof Error ? fallbackError.message : fallbackError}`);
                    throw new Error('Database connection failed: Both pooler and direct connections are unavailable');
                }
            }
            else {
                this.logger.error('❌ No fallback connection available');
                throw primaryError;
            }
        }
    }
    async onModuleDestroy() {
        if (this.configService.get('DATABASE_ENABLED') === 'true') {
            await this.$disconnect();
            this.logger.warn('Repository:Prisma - OFF');
        }
    }
}
exports.PrismaRepository = PrismaRepository;
