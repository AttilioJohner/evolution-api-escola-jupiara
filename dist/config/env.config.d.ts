export type HttpServer = {
    TYPE: 'http' | 'https';
    PORT: number;
    URL: string;
    DISABLE_DOCS: boolean;
    DISABLE_MANAGER: boolean;
};
export type HttpMethods = 'POST' | 'GET' | 'PUT' | 'DELETE';
export type Cors = {
    ORIGIN: string[];
    METHODS: HttpMethods[];
    CREDENTIALS: boolean;
};
export type LogBaileys = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
export type LogLevel = 'ERROR' | 'WARN' | 'DEBUG' | 'INFO' | 'LOG' | 'VERBOSE' | 'DARK' | 'WEBHOOKS' | 'WEBSOCKET';
export type Log = {
    LEVEL: LogLevel[];
    COLOR: boolean;
    BAILEYS: LogBaileys;
};
export type ProviderSession = {
    ENABLED: boolean;
    HOST: string;
    PORT: string;
    PREFIX: string;
};
export type SaveData = {
    INSTANCE: boolean;
    HISTORIC: boolean;
    NEW_MESSAGE: boolean;
    MESSAGE_UPDATE: boolean;
    CONTACTS: boolean;
    CHATS: boolean;
    LABELS: boolean;
    IS_ON_WHATSAPP: boolean;
    IS_ON_WHATSAPP_DAYS: number;
};
export type DBConnection = {
    URI: string;
    CLIENT_NAME: string;
};
export type Database = {
    CONNECTION: DBConnection;
    PROVIDER: string;
    SAVE_DATA: SaveData;
    DELETE_DATA: DeleteData;
};
export type DeleteData = {
    LOGICAL_MESSAGE_DELETE: boolean;
};
export type EventsRabbitmq = {
    APPLICATION_STARTUP: boolean;
    INSTANCE_CREATE: boolean;
    INSTANCE_DELETE: boolean;
    QRCODE_UPDATED: boolean;
    MESSAGES_SET: boolean;
    MESSAGES_UPSERT: boolean;
    MESSAGES_EDITED: boolean;
    MESSAGES_UPDATE: boolean;
    MESSAGES_DELETE: boolean;
    SEND_MESSAGE: boolean;
    SEND_MESSAGE_UPDATE: boolean;
    CONTACTS_SET: boolean;
    CONTACTS_UPDATE: boolean;
    CONTACTS_UPSERT: boolean;
    PRESENCE_UPDATE: boolean;
    CHATS_SET: boolean;
    CHATS_UPDATE: boolean;
    CHATS_DELETE: boolean;
    CHATS_UPSERT: boolean;
    CONNECTION_UPDATE: boolean;
    LABELS_EDIT: boolean;
    LABELS_ASSOCIATION: boolean;
    GROUPS_UPSERT: boolean;
    GROUP_UPDATE: boolean;
    GROUP_PARTICIPANTS_UPDATE: boolean;
    CALL: boolean;
    TYPEBOT_START: boolean;
    TYPEBOT_CHANGE_STATUS: boolean;
};
export type Rabbitmq = {
    ENABLED: boolean;
    URI: string;
    FRAME_MAX: number;
    EXCHANGE_NAME: string;
    GLOBAL_ENABLED: boolean;
    EVENTS: EventsRabbitmq;
    PREFIX_KEY?: string;
};
export type Nats = {
    ENABLED: boolean;
    URI: string;
    EXCHANGE_NAME: string;
    GLOBAL_ENABLED: boolean;
    EVENTS: EventsRabbitmq;
    PREFIX_KEY?: string;
};
export type Sqs = {
    ENABLED: boolean;
    ACCESS_KEY_ID: string;
    SECRET_ACCESS_KEY: string;
    ACCOUNT_ID: string;
    REGION: string;
};
export type Websocket = {
    ENABLED: boolean;
    GLOBAL_EVENTS: boolean;
};
export type WaBusiness = {
    TOKEN_WEBHOOK: string;
    URL: string;
    VERSION: string;
    LANGUAGE: string;
};
export type EventsWebhook = {
    APPLICATION_STARTUP: boolean;
    INSTANCE_CREATE: boolean;
    INSTANCE_DELETE: boolean;
    QRCODE_UPDATED: boolean;
    MESSAGES_SET: boolean;
    MESSAGES_UPSERT: boolean;
    MESSAGES_EDITED: boolean;
    MESSAGES_UPDATE: boolean;
    MESSAGES_DELETE: boolean;
    SEND_MESSAGE: boolean;
    SEND_MESSAGE_UPDATE: boolean;
    CONTACTS_SET: boolean;
    CONTACTS_UPDATE: boolean;
    CONTACTS_UPSERT: boolean;
    PRESENCE_UPDATE: boolean;
    CHATS_SET: boolean;
    CHATS_UPDATE: boolean;
    CHATS_DELETE: boolean;
    CHATS_UPSERT: boolean;
    CONNECTION_UPDATE: boolean;
    LABELS_EDIT: boolean;
    LABELS_ASSOCIATION: boolean;
    GROUPS_UPSERT: boolean;
    GROUP_UPDATE: boolean;
    GROUP_PARTICIPANTS_UPDATE: boolean;
    CALL: boolean;
    TYPEBOT_START: boolean;
    TYPEBOT_CHANGE_STATUS: boolean;
    ERRORS: boolean;
    ERRORS_WEBHOOK: string;
};
export type EventsPusher = {
    APPLICATION_STARTUP: boolean;
    INSTANCE_CREATE: boolean;
    INSTANCE_DELETE: boolean;
    QRCODE_UPDATED: boolean;
    MESSAGES_SET: boolean;
    MESSAGES_UPSERT: boolean;
    MESSAGES_EDITED: boolean;
    MESSAGES_UPDATE: boolean;
    MESSAGES_DELETE: boolean;
    SEND_MESSAGE: boolean;
    SEND_MESSAGE_UPDATE: boolean;
    CONTACTS_SET: boolean;
    CONTACTS_UPDATE: boolean;
    CONTACTS_UPSERT: boolean;
    PRESENCE_UPDATE: boolean;
    CHATS_SET: boolean;
    CHATS_UPDATE: boolean;
    CHATS_DELETE: boolean;
    CHATS_UPSERT: boolean;
    CONNECTION_UPDATE: boolean;
    LABELS_EDIT: boolean;
    LABELS_ASSOCIATION: boolean;
    GROUPS_UPSERT: boolean;
    GROUP_UPDATE: boolean;
    GROUP_PARTICIPANTS_UPDATE: boolean;
    CALL: boolean;
    TYPEBOT_START: boolean;
    TYPEBOT_CHANGE_STATUS: boolean;
};
export type ApiKey = {
    KEY: string;
};
export type Auth = {
    API_KEY: ApiKey;
    EXPOSE_IN_FETCH_INSTANCES: boolean;
};
export type DelInstance = number | boolean;
export type Language = string | 'en';
export type GlobalWebhook = {
    URL: string;
    ENABLED: boolean;
    WEBHOOK_BY_EVENTS: boolean;
};
export type GlobalPusher = {
    ENABLED: boolean;
    APP_ID: string;
    KEY: string;
    SECRET: string;
    CLUSTER: string;
    USE_TLS: boolean;
};
export type CacheConfRedis = {
    ENABLED: boolean;
    URI: string;
    PREFIX_KEY: string;
    TTL: number;
    SAVE_INSTANCES: boolean;
};
export type CacheConfLocal = {
    ENABLED: boolean;
    TTL: number;
};
export type SslConf = {
    PRIVKEY: string;
    FULLCHAIN: string;
};
export type Webhook = {
    GLOBAL?: GlobalWebhook;
    EVENTS: EventsWebhook;
    REQUEST?: {
        TIMEOUT_MS?: number;
    };
    RETRY?: {
        MAX_ATTEMPTS?: number;
        INITIAL_DELAY_SECONDS?: number;
        USE_EXPONENTIAL_BACKOFF?: boolean;
        MAX_DELAY_SECONDS?: number;
        JITTER_FACTOR?: number;
        NON_RETRYABLE_STATUS_CODES?: number[];
    };
};
export type Pusher = {
    ENABLED: boolean;
    GLOBAL?: GlobalPusher;
    EVENTS: EventsPusher;
};
export type ConfigSessionPhone = {
    CLIENT: string;
    NAME: string;
};
export type QrCode = {
    LIMIT: number;
    COLOR: string;
};
export type Typebot = {
    ENABLED: boolean;
    API_VERSION: string;
    SEND_MEDIA_BASE64: boolean;
};
export type Chatwoot = {
    ENABLED: boolean;
    MESSAGE_DELETE: boolean;
    MESSAGE_READ: boolean;
    BOT_CONTACT: boolean;
    IMPORT: {
        DATABASE: {
            CONNECTION: {
                URI: string;
            };
        };
        PLACEHOLDER_MEDIA_MESSAGE: boolean;
    };
};
export type Openai = {
    ENABLED: boolean;
    API_KEY_GLOBAL?: string;
};
export type Dify = {
    ENABLED: boolean;
};
export type N8n = {
    ENABLED: boolean;
};
export type Evoai = {
    ENABLED: boolean;
};
export type Flowise = {
    ENABLED: boolean;
};
export type S3 = {
    ACCESS_KEY: string;
    SECRET_KEY: string;
    ENDPOINT: string;
    BUCKET_NAME: string;
    ENABLE: boolean;
    PORT?: number;
    USE_SSL?: boolean;
    REGION?: string;
    SKIP_POLICY?: boolean;
};
export type CacheConf = {
    REDIS: CacheConfRedis;
    LOCAL: CacheConfLocal;
};
export type Production = boolean;
export interface Env {
    SERVER: HttpServer;
    CORS: Cors;
    SSL_CONF: SslConf;
    PROVIDER: ProviderSession;
    DATABASE: Database;
    DATABASE_ENABLED: string;
    RABBITMQ: Rabbitmq;
    NATS: Nats;
    SQS: Sqs;
    WEBSOCKET: Websocket;
    WA_BUSINESS: WaBusiness;
    LOG: Log;
    DEL_INSTANCE: DelInstance;
    DEL_TEMP_INSTANCES: boolean;
    LANGUAGE: Language;
    WEBHOOK: Webhook;
    PUSHER: Pusher;
    CONFIG_SESSION_PHONE: ConfigSessionPhone;
    QRCODE: QrCode;
    TYPEBOT: Typebot;
    CHATWOOT: Chatwoot;
    OPENAI: Openai;
    DIFY: Dify;
    N8N: N8n;
    EVOAI: Evoai;
    FLOWISE: Flowise;
    CACHE: CacheConf;
    S3?: S3;
    AUTHENTICATION: Auth;
    PRODUCTION?: Production;
}
export type Key = keyof Env;
export declare class ConfigService {
    constructor();
    private env;
    get<T = any>(key: Key): T;
    private loadEnv;
    private envProcess;
}
export declare const configService: ConfigService;
