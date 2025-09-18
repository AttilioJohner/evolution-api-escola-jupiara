"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalServerErrorException = void 0;
const index_router_1 = require("@api/routes/index.router");
class InternalServerErrorException {
    constructor(...objectError) {
        throw {
            status: index_router_1.HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Internal Server Error',
            message: objectError.length > 0 ? objectError : undefined,
        };
    }
}
exports.InternalServerErrorException = InternalServerErrorException;
