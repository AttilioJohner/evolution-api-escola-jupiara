"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabelRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const label_dto_1 = require("@api/dto/label.dto");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
const index_router_1 = require("./index.router");
class LabelRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .get(this.routerPath('findLabels'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: null,
                ClassRef: label_dto_1.LabelDto,
                execute: (instance) => server_module_1.labelController.fetchLabels(instance),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('handleLabel'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.handleLabelSchema,
                ClassRef: label_dto_1.HandleLabelDto,
                execute: (instance, data) => server_module_1.labelController.handleLabel(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.LabelRouter = LabelRouter;
