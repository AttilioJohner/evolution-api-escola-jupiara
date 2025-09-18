import { ICache } from '@api/abstract/abstract.cache';
import { ConfigService } from '@config/env.config';
export declare class CacheEngine {
    private readonly configService;
    private engine;
    constructor(configService: ConfigService, module: string);
    getEngine(): ICache;
}
