"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const chat_dto_1 = require("@api/dto/chat.dto");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
const index_router_1 = require("./index.router");
class BusinessRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('getCatalog'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.catalogSchema,
                ClassRef: chat_dto_1.NumberDto,
                execute: (instance, data) => server_module_1.businessController.fetchCatalog(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('getCollections'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.collectionsSchema,
                ClassRef: chat_dto_1.NumberDto,
                execute: (instance, data) => server_module_1.businessController.fetchCollections(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.BusinessRouter = BusinessRouter;
