"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionBotRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const chatbot_dto_1 = require("@api/dto/chatbot.dto");
const instance_dto_1 = require("@api/dto/instance.dto");
const index_router_1 = require("@api/routes/index.router");
const server_module_1 = require("@api/server.module");
const instance_schema_1 = require("@validate/instance.schema");
const express_1 = require("express");
const evolutionBot_dto_1 = require("../dto/evolutionBot.dto");
const evolutionBot_schema_1 = require("../validate/evolutionBot.schema");
class EvolutionBotRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('create'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: evolutionBot_schema_1.evolutionBotSchema,
                ClassRef: evolutionBot_dto_1.EvolutionBotDto,
                execute: (instance, data) => server_module_1.evolutionBotController.createBot(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .get(this.routerPath('find'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.evolutionBotController.findBot(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetch/:evolutionBotId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.evolutionBotController.fetchBot(instance, req.params.evolutionBotId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .put(this.routerPath('update/:evolutionBotId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: evolutionBot_schema_1.evolutionBotSchema,
                ClassRef: evolutionBot_dto_1.EvolutionBotDto,
                execute: (instance, data) => server_module_1.evolutionBotController.updateBot(instance, req.params.evolutionBotId, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .delete(this.routerPath('delete/:evolutionBotId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.evolutionBotController.deleteBot(instance, req.params.evolutionBotId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('settings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: evolutionBot_schema_1.evolutionBotSettingSchema,
                ClassRef: evolutionBot_dto_1.EvolutionBotSettingDto,
                execute: (instance, data) => server_module_1.evolutionBotController.settings(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchSettings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.evolutionBotController.fetchSettings(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('changeStatus'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: evolutionBot_schema_1.evolutionBotStatusSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance, data) => server_module_1.evolutionBotController.changeStatus(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchSessions/:evolutionBotId'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.evolutionBotController.fetchSessions(instance, req.params.evolutionBotId),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('ignoreJid'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: evolutionBot_schema_1.evolutionBotIgnoreJidSchema,
                ClassRef: chatbot_dto_1.IgnoreJidDto,
                execute: (instance, data) => server_module_1.evolutionBotController.ignoreJid(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.EvolutionBotRouter = EvolutionBotRouter;
