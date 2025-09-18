"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.keyExists = keyExists;
exports.saveKey = saveKey;
exports.getAuthKey = getAuthKey;
exports.default = useMultiFileAuthStatePrisma;
const server_module_1 = require("@api/server.module");
const path_config_1 = require("@config/path.config");
const baileys_1 = require("baileys");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const fixFileName = (file) => {
    if (!file) {
        return undefined;
    }
    const replacedSlash = file.replace(/\//g, '__');
    const replacedColon = replacedSlash.replace(/:/g, '-');
    return replacedColon;
};
async function keyExists(sessionId) {
    try {
        const key = await server_module_1.prismaRepository.session.findUnique({ where: { sessionId: sessionId } });
        return !!key;
    }
    catch (error) {
        return false;
    }
}
async function saveKey(sessionId, keyJson) {
    const exists = await keyExists(sessionId);
    try {
        if (!exists)
            return await server_module_1.prismaRepository.session.create({
                data: {
                    sessionId: sessionId,
                    creds: JSON.stringify(keyJson),
                },
            });
        await server_module_1.prismaRepository.session.update({
            where: { sessionId: sessionId },
            data: { creds: JSON.stringify(keyJson) },
        });
    }
    catch (error) {
        return null;
    }
}
async function getAuthKey(sessionId) {
    try {
        const register = await keyExists(sessionId);
        if (!register)
            return null;
        const auth = await server_module_1.prismaRepository.session.findUnique({ where: { sessionId: sessionId } });
        return JSON.parse(auth?.creds);
    }
    catch (error) {
        return null;
    }
}
async function deleteAuthKey(sessionId) {
    try {
        const register = await keyExists(sessionId);
        if (!register)
            return;
        await server_module_1.prismaRepository.session.delete({ where: { sessionId: sessionId } });
    }
    catch (error) {
        return;
    }
}
async function fileExists(file) {
    try {
        const stat = await promises_1.default.stat(file);
        if (stat.isFile())
            return true;
    }
    catch (error) {
        return;
    }
}
async function useMultiFileAuthStatePrisma(sessionId, cache) {
    const localFolder = path_1.default.join(path_config_1.INSTANCE_DIR, sessionId);
    const localFile = (key) => path_1.default.join(localFolder, fixFileName(key) + '.json');
    await promises_1.default.mkdir(localFolder, { recursive: true });
    async function writeData(data, key) {
        const dataString = JSON.stringify(data, baileys_1.BufferJSON.replacer);
        if (key != 'creds') {
            if (process.env.CACHE_REDIS_ENABLED === 'true') {
                return await cache.hSet(sessionId, key, data);
            }
            else {
                await promises_1.default.writeFile(localFile(key), dataString);
                return;
            }
        }
        await saveKey(sessionId, dataString);
        return;
    }
    async function readData(key) {
        try {
            let rawData;
            if (key != 'creds') {
                if (process.env.CACHE_REDIS_ENABLED === 'true') {
                    return await cache.hGet(sessionId, key);
                }
                else {
                    if (!(await fileExists(localFile(key))))
                        return null;
                    rawData = await promises_1.default.readFile(localFile(key), { encoding: 'utf-8' });
                    return JSON.parse(rawData, baileys_1.BufferJSON.reviver);
                }
            }
            else {
                rawData = await getAuthKey(sessionId);
            }
            const parsedData = JSON.parse(rawData, baileys_1.BufferJSON.reviver);
            return parsedData;
        }
        catch (error) {
            return null;
        }
    }
    async function removeData(key) {
        try {
            if (key != 'creds') {
                if (process.env.CACHE_REDIS_ENABLED === 'true') {
                    return await cache.hDelete(sessionId, key);
                }
                else {
                    await promises_1.default.unlink(localFile(key));
                }
            }
            else {
                await deleteAuthKey(sessionId);
            }
        }
        catch (error) {
            return;
        }
    }
    let creds = await readData('creds');
    if (!creds) {
        creds = (0, baileys_1.initAuthCreds)();
        await writeData(creds, 'creds');
    }
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await readData(`${type}-${id}`);
                        if (type === 'app-state-sync-key' && value) {
                            value = baileys_1.WAProto.Message.AppStateSyncKeyData.fromObject(value);
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
                            tasks.push(value ? writeData(value, key) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: () => {
            return writeData(creds, 'creds');
        },
    };
}
