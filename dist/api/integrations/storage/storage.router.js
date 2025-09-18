"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageRouter = void 0;
const s3_router_1 = require("@api/integrations/storage/s3/routes/s3.router");
const express_1 = require("express");
class StorageRouter {
    constructor(...guards) {
        this.router = (0, express_1.Router)();
        this.router.use('/s3', new s3_router_1.S3Router(...guards).router);
    }
}
exports.StorageRouter = StorageRouter;
