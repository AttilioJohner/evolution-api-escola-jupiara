"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Router = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const media_dto_1 = require("@api/integrations/storage/s3/dto/media.dto");
const s3_schema_1 = require("@api/integrations/storage/s3/validate/s3.schema");
const index_router_1 = require("@api/routes/index.router");
const server_module_1 = require("@api/server.module");
const express_1 = require("express");
class S3Router extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('getMedia'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: s3_schema_1.s3Schema,
                ClassRef: media_dto_1.MediaDto,
                execute: (instance, data) => server_module_1.s3Controller.getMedia(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('getMediaUrl'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: s3_schema_1.s3UrlSchema,
                ClassRef: media_dto_1.MediaDto,
                execute: (instance, data) => server_module_1.s3Controller.getMediaUrl(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.S3Router = S3Router;
