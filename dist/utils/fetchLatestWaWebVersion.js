"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchLatestWaWebVersion = void 0;
const axios_1 = __importDefault(require("axios"));
const baileys_1 = require("baileys");
const fetchLatestWaWebVersion = async (options) => {
    try {
        const { data } = await axios_1.default.get('https://web.whatsapp.com/sw.js', {
            ...options,
            responseType: 'json',
        });
        const regex = /\\?"client_revision\\?":\s*(\d+)/;
        const match = data.match(regex);
        if (!match?.[1]) {
            return {
                version: (await (0, baileys_1.fetchLatestBaileysVersion)()).version,
                isLatest: false,
                error: {
                    message: 'Could not find client revision in the fetched content',
                },
            };
        }
        const clientRevision = match[1];
        return {
            version: [2, 3000, +clientRevision],
            isLatest: true,
        };
    }
    catch (error) {
        return {
            version: (await (0, baileys_1.fetchLatestBaileysVersion)()).version,
            isLatest: false,
            error,
        };
    }
};
exports.fetchLatestWaWebVersion = fetchLatestWaWebVersion;
