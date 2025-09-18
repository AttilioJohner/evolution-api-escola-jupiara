"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedException = void 0;
const index_router_1 = require("@api/routes/index.router");
class UnauthorizedException {
    constructor(...objectError) {
        throw {
            status: index_router_1.HttpStatus.UNAUTHORIZED,
            error: 'Unauthorized',
            message: objectError.length > 0 ? objectError : 'Unauthorized',
        };
    }
}
exports.UnauthorizedException = UnauthorizedException;
