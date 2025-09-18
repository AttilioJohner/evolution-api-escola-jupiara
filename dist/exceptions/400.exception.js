"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestException = void 0;
const index_router_1 = require("@api/routes/index.router");
class BadRequestException {
    constructor(...objectError) {
        throw {
            status: index_router_1.HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: objectError.length > 0 ? objectError : undefined,
        };
    }
}
exports.BadRequestException = BadRequestException;
