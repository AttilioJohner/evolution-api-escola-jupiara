import { ConfigService } from '@config/env.config';
type ResponseSuccess = {
    status: number;
    data?: any;
};
type ResponseProvider = Promise<[ResponseSuccess?, Error?]>;
export declare class ProviderFiles {
    private readonly configService;
    constructor(configService: ConfigService);
    private readonly logger;
    private baseUrl;
    private globalApiToken;
    private readonly config;
    get isEnabled(): boolean;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    create(instance: string): ResponseProvider;
    write(instance: string, key: string, data: any): ResponseProvider;
    read(instance: string, key: string): ResponseProvider;
    delete(instance: string, key: string): ResponseProvider;
    allInstances(): ResponseProvider;
    removeSession(instance: string): ResponseProvider;
}
export {};
