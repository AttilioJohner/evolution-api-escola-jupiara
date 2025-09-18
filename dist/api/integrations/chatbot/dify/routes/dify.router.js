"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DifyRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const chatbot_dto_1 = require("@api/dto/chatbot.dto");
const instance_dto_1 = require("@api/dto/instance.dto");
const dify_dto_1 = require("@api/integrations/chatbot/dify/dto/dify.dto");
const index_router_1 = require("@api/routes/index.router");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
class DifyRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('create'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.difySchema,
                ClassRef: dify_dto_1.DifyDto,
                execute: (instance, data) => server_module_1.difyController.createBot(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .get(this.routerPath('find'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.difyController.findBot(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetch/:difyId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.difyController.fetchBot(instance, req.params.difyId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .put(this.routerPath('update/:difyId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.difySchema,
                ClassRef: dify_dto_1.DifyDto,
                execute: (instance, data) => server_module_1.difyController.updateBot(instance, req.params.difyId, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .delete(this.routerPath('delete/:difyId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.difyController.deleteBot(instance, req.params.difyId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('settings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.difySettingSchema,
                ClassRef: dify_dto_1.DifySettingDto,
                execute: (instance, data) => server_module_1.difyController.settings(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchSettings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.difyController.fetchSettings(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('changeStatus'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.difyStatusSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance, data) => server_module_1.difyController.changeStatus(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchSessions/:difyId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.difyController.fetchSessions(instance, req.params.difyId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('ignoreJid'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.difyIgnoreJidSchema,
                ClassRef: chatbot_dto_1.IgnoreJidDto,
                execute: (instance, data) => server_module_1.difyController.ignoreJid(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.DifyRouter = DifyRouter;
