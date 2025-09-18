import { ICache } from '@api/abstract/abstract.cache';
export declare class CacheService {
    private readonly cache;
    private readonly logger;
    constructor(cache: ICache);
    get(key: string): Promise<any>;
    hGet(key: string, field: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<void>;
    hSet(key: string, field: string, value: any): Promise<void>;
    has(key: string): Promise<boolean>;
    delete(key: string): Promise<number>;
    hDelete(key: string, field: string): Promise<boolean>;
    deleteAll(appendCriteria?: string): Promise<number>;
    keys(appendCriteria?: string): Promise<string[]>;
}
