import { RedisClientType } from 'redis';
declare class Redis {
    private logger;
    private client;
    private conf;
    private connected;
    constructor();
    getConnection(): RedisClientType;
}
export declare const redisClient: Redis;
export {};
