import { ICache } from '@api/abstract/abstract.cache';
import { ConfigService } from '@config/env.config';
export declare class RedisCache implements ICache {
    private readonly configService;
    private readonly module;
    private readonly logger;
    private client;
    private conf;
    constructor(configService: ConfigService, module: string);
    get(key: string): Promise<any>;
    hGet(key: string, field: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    hSet(key: string, field: string, value: any): Promise<void>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<number>;
    hDelete(key: string, field: string): Promise<number>;
    deleteAll(appendCriteria?: string): Promise<number>;
    keys(appendCriteria?: string): Promise<any[]>;
    buildKey(key: string): string;
}
