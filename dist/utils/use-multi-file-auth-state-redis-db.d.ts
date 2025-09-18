import { CacheService } from '@api/services/cache.service';
import { AuthenticationState } from 'baileys';
export declare function useMultiFileAuthStateRedisDb(instanceName: string, cache: CacheService): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
}>;
