"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const instance_dto_1 = require("@api/dto/instance.dto");
const template_dto_1 = require("@api/dto/template.dto");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
const index_router_1 = require("./index.router");
class TemplateRouter extends abstract_router_1.RouterBroker {
    constructor(configService, ...guards) {
        super();
        this.configService = configService;
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('create'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.templateSchema,
                ClassRef: template_dto_1.TemplateDto,
                execute: (instance, data) => server_module_1.templateController.createTemplate(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .get(this.routerPath('find'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.templateController.findTemplate(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.TemplateRouter = TemplateRouter;
