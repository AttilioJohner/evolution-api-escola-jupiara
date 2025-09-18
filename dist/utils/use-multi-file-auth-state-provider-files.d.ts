import { ProviderFiles } from '@api/provider/sessions';
import { AuthenticationState } from 'baileys';
export type AuthState = {
    state: AuthenticationState;
    saveCreds: () => Promise<void>;
};
export declare class AuthStateProvider {
    private readonly providerFiles;
    constructor(providerFiles: ProviderFiles);
    private readonly logger;
    authStateProvider(instance: string): Promise<AuthState>;
}
