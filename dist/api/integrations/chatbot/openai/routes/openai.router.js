"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenaiRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const chatbot_dto_1 = require("@api/dto/chatbot.dto");
const instance_dto_1 = require("@api/dto/instance.dto");
const openai_dto_1 = require("@api/integrations/chatbot/openai/dto/openai.dto");
const index_router_1 = require("@api/routes/index.router");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
class OpenaiRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('creds'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.openaiCredsSchema,
                ClassRef: openai_dto_1.OpenaiCredsDto,
                execute: (instance, data) => server_module_1.openaiController.createOpenaiCreds(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .get(this.routerPath('creds'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.openaiController.findOpenaiCreds(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .delete(this.routerPath('creds/:openaiCredsId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.openaiController.deleteCreds(instance, req.params.openaiCredsId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('create'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.openaiSchema,
                ClassRef: openai_dto_1.OpenaiDto,
                execute: (instance, data) => server_module_1.openaiController.createBot(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .get(this.routerPath('find'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.openaiController.findBot(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetch/:openaiBotId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.openaiController.fetchBot(instance, req.params.openaiBotId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .put(this.routerPath('update/:openaiBotId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.openaiSchema,
                ClassRef: openai_dto_1.OpenaiDto,
                execute: (instance, data) => server_module_1.openaiController.updateBot(instance, req.params.openaiBotId, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .delete(this.routerPath('delete/:openaiBotId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.openaiController.deleteBot(instance, req.params.openaiBotId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('settings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.openaiSettingSchema,
                ClassRef: openai_dto_1.OpenaiSettingDto,
                execute: (instance, data) => server_module_1.openaiController.settings(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchSettings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.openaiController.fetchSettings(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('changeStatus'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.openaiStatusSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance, data) => server_module_1.openaiController.changeStatus(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchSessions/:openaiBotId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.openaiController.fetchSessions(instance, req.params.openaiBotId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('ignoreJid'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.openaiIgnoreJidSchema,
                ClassRef: chatbot_dto_1.IgnoreJidDto,
                execute: (instance, data) => server_module_1.openaiController.ignoreJid(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('getModels'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.openaiController.getModels(instance, req.query.openaiCredsId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.OpenaiRouter = OpenaiRouter;
