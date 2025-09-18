"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthStateProvider = void 0;
const logger_config_1 = require("@config/logger.config");
const baileys_1 = require("baileys");
const class_validator_1 = require("class-validator");
class AuthStateProvider {
    constructor(providerFiles) {
        this.providerFiles = providerFiles;
        this.logger = new logger_config_1.Logger('AuthStateProvider');
    }
    async authStateProvider(instance) {
        const [, error] = await this.providerFiles.create(instance);
        if (error) {
            this.logger.error(['Failed to create folder on file server', error?.message, error?.stack]);
            return;
        }
        const writeData = async (data, key) => {
            const json = JSON.stringify(data, baileys_1.BufferJSON.replacer);
            const [response, error] = await this.providerFiles.write(instance, key, {
                data: json,
            });
            if (error) {
                return;
            }
            return response;
        };
        const readData = async (key) => {
            const [response, error] = await this.providerFiles.read(instance, key);
            if (error) {
                return;
            }
            if ((0, class_validator_1.isNotEmpty)(response?.data)) {
                return JSON.parse(JSON.stringify(response.data), baileys_1.BufferJSON.reviver);
            }
        };
        const removeData = async (key) => {
            const [response, error] = await this.providerFiles.delete(instance, key);
            if (error) {
                return;
            }
            return response;
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
}
exports.AuthStateProvider = AuthStateProvider;
