"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelemetry = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const packageJson = JSON.parse(fs_1.default.readFileSync('./package.json', 'utf8'));
const sendTelemetry = async (route) => {
    const enabled = process.env.TELEMETRY_ENABLED === undefined || process.env.TELEMETRY_ENABLED === 'true';
    if (!enabled) {
        return;
    }
    if (route === '/') {
        return;
    }
    const telemetry = {
        route,
        apiVersion: `${packageJson.version}`,
        timestamp: new Date(),
    };
    const url = process.env.TELEMETRY_URL && process.env.TELEMETRY_URL !== ''
        ? process.env.TELEMETRY_URL
        : 'https://log.evolution-api.com/telemetry';
    axios_1.default
        .post(url, telemetry)
        .then(() => { })
        .catch(() => { });
};
exports.sendTelemetry = sendTelemetry;
