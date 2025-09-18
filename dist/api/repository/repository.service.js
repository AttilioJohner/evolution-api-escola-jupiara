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
            await this.$connect();
            this.logger.info('Repository:Prisma - ON');
        }
        else {
            this.logger.info('Repository:Prisma - DISABLED');
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
