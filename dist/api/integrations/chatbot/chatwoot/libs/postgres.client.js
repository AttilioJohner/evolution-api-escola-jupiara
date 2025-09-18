"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postgresClient = void 0;
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
class Postgres {
    constructor() {
        this.logger = new logger_config_1.Logger('Postgres');
        this.connected = false;
    }
    getConnection(connectionString) {
        if (this.connected) {
            return this.pool;
        }
        else {
            this.pool = new Pool({
                connectionString,
                ssl: {
                    rejectUnauthorized: false,
                },
            });
            this.pool.on('error', () => {
                this.logger.error('postgres disconnected');
                this.connected = false;
            });
            try {
                this.connected = true;
            }
            catch (e) {
                this.connected = false;
                this.logger.error('postgres connect exception caught: ' + e);
                return null;
            }
            return this.pool;
        }
    }
    getChatwootConnection() {
        const uri = env_config_1.configService.get('CHATWOOT').IMPORT.DATABASE.CONNECTION.URI;
        return this.getConnection(uri);
    }
}
exports.postgresClient = new Postgres();
