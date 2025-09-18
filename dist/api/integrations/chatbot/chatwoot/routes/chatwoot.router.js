"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatwootRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const instance_dto_1 = require("@api/dto/instance.dto");
const chatwoot_dto_1 = require("@api/integrations/chatbot/chatwoot/dto/chatwoot.dto");
const index_router_1 = require("@api/routes/index.router");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
class ChatwootRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('set'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.chatwootSchema,
                ClassRef: chatwoot_dto_1.ChatwootDto,
                execute: (instance, data) => server_module_1.chatwootController.createChatwoot(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .get(this.routerPath('find'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.chatwootController.findChatwoot(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('webhook'), async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance, data) => server_module_1.chatwootController.receiveWebhook(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.ChatwootRouter = ChatwootRouter;
