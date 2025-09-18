export declare class Logger {
    private readonly configService;
    private context;
    constructor(context?: string);
    private instance;
    setContext(value: string): void;
    setInstance(value: string): void;
    private console;
    log(value: any): void;
    info(value: any): void;
    warn(value: any): void;
    error(value: any): void;
    verbose(value: any): void;
    debug(value: any): void;
    dark(value: any): void;
}
