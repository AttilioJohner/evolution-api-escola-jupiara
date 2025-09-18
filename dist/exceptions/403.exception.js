"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenException = void 0;
const index_router_1 = require("@api/routes/index.router");
class ForbiddenException {
    constructor(...objectError) {
        throw {
            status: index_router_1.HttpStatus.FORBIDDEN,
            error: 'Forbidden',
            message: objectError.length > 0 ? objectError : undefined,
        };
    }
}
exports.ForbiddenException = ForbiddenException;
