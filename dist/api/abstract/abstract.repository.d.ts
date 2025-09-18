import { ConfigService, Database } from '@config/env.config';
export type IInsert = {
    insertCount: number;
};
export interface IRepository {
    insert(data: any, instanceName: string, saveDb?: boolean): Promise<IInsert>;
    update(data: any, instanceName: string, saveDb?: boolean): Promise<IInsert>;
    find(query: any): Promise<any>;
    delete(query: any, force?: boolean): Promise<any>;
    dbSettings: Database;
    readonly storePath: string;
}
type WriteStore<U> = {
    path: string;
    fileName: string;
    data: U;
};
export declare abstract class Repository implements IRepository {
    constructor(configService: ConfigService);
    dbSettings: Database;
    readonly storePath: string;
    writeStore: <T = any>(create: WriteStore<T>) => {
        message: string;
    };
    insert(data: any, instanceName: string, saveDb?: boolean): Promise<IInsert>;
    update(data: any, instanceName: string, saveDb?: boolean): Promise<IInsert>;
    find(query: any): Promise<any>;
    delete(query: any, force?: boolean): Promise<any>;
}
export {};
