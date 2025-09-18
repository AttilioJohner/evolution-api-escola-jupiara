"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUnexpectedError = onUnexpectedError;
const logger_config_1 = require("./logger.config");
function onUnexpectedError() {
    process.on('uncaughtException', (error, origin) => {
        const logger = new logger_config_1.Logger('uncaughtException');
        logger.error({
            origin,
            stderr: process.stderr.fd,
            error,
        });
    });
    process.on('unhandledRejection', (error, origin) => {
        const logger = new logger_config_1.Logger('unhandledRejection');
        logger.error({
            origin,
            stderr: process.stderr.fd,
        });
        logger.error(error);
    });
}
