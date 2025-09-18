declare class Postgres {
    private logger;
    private pool;
    private connected;
    getConnection(connectionString: string): any;
    getChatwootConnection(): any;
}
export declare const postgresClient: Postgres;
export {};
