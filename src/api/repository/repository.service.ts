import { ConfigService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { PrismaClient } from '@prisma/client';

export class Query<T> {
  where?: T;
  sort?: 'asc' | 'desc';
  page?: number;
  offset?: number;
}

export class PrismaRepository extends PrismaClient {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  private readonly logger = new Logger('PrismaRepository');

  public async onModuleInit() {
    if (this.configService.get('DATABASE_ENABLED') === 'true') {
      await this.connectWithFallback();
      this.logger.info('Repository:Prisma - ON');
    } else {
      this.logger.info('Repository:Prisma - DISABLED');
    }
  }

  private async connectWithFallback() {
    const databaseUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;

    try {
      // Tentar conexão primária (pooler ou configurada)
      this.logger.info('Attempting primary database connection...');
      await this.$connect();

      // Teste rápido de conectividade
      await this.$queryRaw`SELECT 1`;

      const connectionType = databaseUrl?.includes('pgbouncer=true') ? 'pooler' : 'direct';
      this.logger.info(`Primary connection successful (${connectionType})`);

    } catch (primaryError) {
      this.logger.warn(`Primary connection failed: ${primaryError instanceof Error ? primaryError.message : primaryError}`);

      // Se temos DIRECT_URL disponível, tentar fallback
      if (directUrl && directUrl !== databaseUrl) {
        try {
          this.logger.info('Attempting fallback to direct connection...');

          // Desconectar cliente atual
          await this.$disconnect().catch(() => {});

          // Recriar cliente com DIRECT_URL
          const fallbackClient = new PrismaClient({
            datasources: {
              db: { url: directUrl }
            }
          });

          // Copiar métodos para este cliente
          Object.setPrototypeOf(this, fallbackClient);
          Object.assign(this, fallbackClient);

          await this.$connect();
          await this.$queryRaw`SELECT 1`;

          this.logger.info('✅ Fallback connection successful (direct)');
          this.logger.warn('⚠️  Using fallback direct connection - pooler unavailable');

        } catch (fallbackError) {
          this.logger.error('❌ Both primary and fallback connections failed');
          this.logger.error(`Primary error: ${primaryError instanceof Error ? primaryError.message : primaryError}`);
          this.logger.error(`Fallback error: ${fallbackError instanceof Error ? fallbackError.message : fallbackError}`);
          throw new Error('Database connection failed: Both pooler and direct connections are unavailable');
        }
      } else {
        this.logger.error('❌ No fallback connection available');
        throw primaryError;
      }
    }
  }

  public async onModuleDestroy() {
    if (this.configService.get('DATABASE_ENABLED') === 'true') {
      await this.$disconnect();
      this.logger.warn('Repository:Prisma - OFF');
    }
  }
}
