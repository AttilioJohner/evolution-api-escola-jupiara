"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowiseRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const chatbot_dto_1 = require("@api/dto/chatbot.dto");
const instance_dto_1 = require("@api/dto/instance.dto");
const index_router_1 = require("@api/routes/index.router");
const server_module_1 = require("@api/server.module");
const instance_schema_1 = require("@validate/instance.schema");
const express_1 = require("express");
const flowise_dto_1 = require("../dto/flowise.dto");
const flowise_schema_1 = require("../validate/flowise.schema");
class FlowiseRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('create'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: flowise_schema_1.flowiseSchema,
                ClassRef: flowise_dto_1.FlowiseDto,
                execute: (instance, data) => server_module_1.flowiseController.createBot(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .get(this.routerPath('find'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.flowiseController.findBot(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetch/:flowiseId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.flowiseController.fetchBot(instance, req.params.flowiseId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .put(this.routerPath('update/:flowiseId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: flowise_schema_1.flowiseSchema,
                ClassRef: flowise_dto_1.FlowiseDto,
                execute: (instance, data) => server_module_1.flowiseController.updateBot(instance, req.params.flowiseId, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .delete(this.routerPath('delete/:flowiseId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.flowiseController.deleteBot(instance, req.params.flowiseId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('settings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: flowise_schema_1.flowiseSettingSchema,
                ClassRef: flowise_dto_1.FlowiseSettingDto,
                execute: (instance, data) => server_module_1.flowiseController.settings(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchSettings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.flowiseController.fetchSettings(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('changeStatus'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: flowise_schema_1.flowiseStatusSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance, data) => server_module_1.flowiseController.changeStatus(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchSessions/:flowiseId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.flowiseController.fetchSessions(instance, req.params.flowiseId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('ignoreJid'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: flowise_schema_1.flowiseIgnoreJidSchema,
                ClassRef: chatbot_dto_1.IgnoreJidDto,
                execute: (instance, data) => server_module_1.flowiseController.ignoreJid(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.FlowiseRouter = FlowiseRouter;
