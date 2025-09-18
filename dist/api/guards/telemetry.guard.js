"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendTelemetry_1 = require("@utils/sendTelemetry");
class Telemetry {
    collectTelemetry(req, res, next) {
        (0, sendTelemetry_1.sendTelemetry)(req.path);
        next();
    }
}
exports.default = Telemetry;
