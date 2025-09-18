"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
const path_config_1 = require("@config/path.config");
const fs_1 = require("fs");
const path_1 = require("path");
class Repository {
    constructor(configService) {
        this.storePath = (0, path_1.join)(path_config_1.ROOT_DIR, 'store');
        this.writeStore = (create) => {
            if (!(0, fs_1.existsSync)(create.path)) {
                (0, fs_1.mkdirSync)(create.path, { recursive: true });
            }
            try {
                (0, fs_1.writeFileSync)((0, path_1.join)(create.path, create.fileName + '.json'), JSON.stringify({ ...create.data }), {
                    encoding: 'utf-8',
                });
                return { message: 'create - success' };
            }
            finally {
                create.data = undefined;
            }
        };
        this.dbSettings = configService.get('DATABASE');
    }
    insert(data, instanceName, saveDb = false) {
        throw new Error('Method not implemented.');
    }
    update(data, instanceName, saveDb = false) {
        throw new Error('Method not implemented.');
    }
    find(query) {
        throw new Error('Method not implemented.');
    }
    delete(query, force) {
        throw new Error('Method not implemented.');
    }
}
exports.Repository = Repository;
