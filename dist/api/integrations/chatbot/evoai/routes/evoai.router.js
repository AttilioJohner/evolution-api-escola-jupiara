"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvoaiRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const chatbot_dto_1 = require("@api/dto/chatbot.dto");
const instance_dto_1 = require("@api/dto/instance.dto");
const index_router_1 = require("@api/routes/index.router");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
const evoai_dto_1 = require("../dto/evoai.dto");
class EvoaiRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('create'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.evoaiSchema,
                ClassRef: evoai_dto_1.EvoaiDto,
                execute: (instance, data) => server_module_1.evoaiController.createBot(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .get(this.routerPath('find'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.evoaiController.findBot(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetch/:evoaiId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.evoaiController.fetchBot(instance, req.params.evoaiId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .put(this.routerPath('update/:evoaiId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.evoaiSchema,
                ClassRef: evoai_dto_1.EvoaiDto,
                execute: (instance, data) => server_module_1.evoaiController.updateBot(instance, req.params.evoaiId, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .delete(this.routerPath('delete/:evoaiId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.evoaiController.deleteBot(instance, req.params.evoaiId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('settings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.evoaiSettingSchema,
                ClassRef: evoai_dto_1.EvoaiSettingDto,
                execute: (instance, data) => server_module_1.evoaiController.settings(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchSettings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.evoaiController.fetchSettings(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('changeStatus'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.evoaiStatusSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance, data) => server_module_1.evoaiController.changeStatus(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchSessions/:evoaiId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.evoaiController.fetchSessions(instance, req.params.evoaiId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('ignoreJid'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.evoaiIgnoreJidSchema,
                ClassRef: chatbot_dto_1.IgnoreJidDto,
                execute: (instance, data) => server_module_1.evoaiController.ignoreJid(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.EvoaiRouter = EvoaiRouter;
