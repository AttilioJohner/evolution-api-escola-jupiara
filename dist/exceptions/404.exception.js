"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotFoundException = void 0;
const index_router_1 = require("@api/routes/index.router");
class NotFoundException {
    constructor(...objectError) {
        throw {
            status: index_router_1.HttpStatus.NOT_FOUND,
            error: 'Not Found',
            message: objectError.length > 0 ? objectError : undefined,
        };
    }
}
exports.NotFoundException = NotFoundException;
