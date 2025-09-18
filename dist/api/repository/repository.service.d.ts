import { ConfigService } from '@config/env.config';
import { PrismaClient } from '@prisma/client';
export declare class Query<T> {
    where?: T;
    sort?: 'asc' | 'desc';
    page?: number;
    offset?: number;
}
export declare class PrismaRepository extends PrismaClient {
    private readonly configService;
    constructor(configService: ConfigService);
    private readonly logger;
    onModuleInit(): Promise<void>;
    private connectWithFallback;
    onModuleDestroy(): Promise<void>;
}
