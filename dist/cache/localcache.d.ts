import { ICache } from '@api/abstract/abstract.cache';
import { ConfigService } from '@config/env.config';
import NodeCache from 'node-cache';
export declare class LocalCache implements ICache {
    private readonly configService;
    private readonly module;
    private readonly logger;
    private conf;
    static localCache: NodeCache;
    constructor(configService: ConfigService, module: string);
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<boolean>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<number>;
    deleteAll(appendCriteria?: string): Promise<number>;
    keys(appendCriteria?: string): Promise<string[]>;
    buildKey(key: string): string;
    hGet(key: string, field: string): Promise<any>;
    hSet(key: string, field: string, value: any): Promise<void>;
    hDelete(key: string, field: string): Promise<1 | 0>;
}
