import { CacheService } from '@api/services/cache.service';
import { AuthenticationState } from 'baileys';
export declare function keyExists(sessionId: string): Promise<any>;
export declare function saveKey(sessionId: string, keyJson: any): Promise<any>;
export declare function getAuthKey(sessionId: string): Promise<any>;
export default function useMultiFileAuthStatePrisma(sessionId: string, cache: CacheService): Promise<{
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
}>;
