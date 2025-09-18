"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const instance_dto_1 = require("@api/dto/instance.dto");
const proxy_dto_1 = require("@api/dto/proxy.dto");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
const index_router_1 = require("./index.router");
class ProxyRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('set'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.proxySchema,
                ClassRef: proxy_dto_1.ProxyDto,
                execute: (instance, data) => server_module_1.proxyController.createProxy(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .get(this.routerPath('find'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.proxyController.findProxy(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.ProxyRouter = ProxyRouter;
