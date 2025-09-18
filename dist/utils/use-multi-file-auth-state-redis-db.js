"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useMultiFileAuthStateRedisDb = useMultiFileAuthStateRedisDb;
const logger_config_1 = require("@config/logger.config");
const baileys_1 = require("baileys");
async function useMultiFileAuthStateRedisDb(instanceName, cache) {
    const logger = new logger_config_1.Logger('useMultiFileAuthStateRedisDb');
    const writeData = async (data, key) => {
        try {
            return await cache.hSet(instanceName, key, data);
        }
        catch (error) {
            return logger.error({ localError: 'writeData', error });
        }
    };
    const readData = async (key) => {
        try {
            return await cache.hGet(instanceName, key);
        }
        catch (error) {
            logger.error({ localError: 'readData', error });
            return;
        }
    };
    const removeData = async (key) => {
        try {
            return await cache.hDelete(instanceName, key);
        }
        catch (error) {
            logger.error({ readData: 'removeData', error });
        }
    };
    const creds = (await readData('creds')) || (0, baileys_1.initAuthCreds)();
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            value = baileys_1.proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }));
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? await writeData(value, key) : await removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: async () => {
            return await writeData(creds, 'creds');
        },
    };
}
