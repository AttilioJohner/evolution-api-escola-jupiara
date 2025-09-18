"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const instance_dto_1 = require("@api/dto/instance.dto");
const index_router_1 = require("@api/routes/index.router");
const server_module_1 = require("@api/server.module");
const instance_schema_1 = require("@validate/instance.schema");
const express_1 = require("express");
class BaileysRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('onWhatsapp'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.baileysController.onWhatsapp(instance, req.body),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('profilePictureUrl'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.baileysController.profilePictureUrl(instance, req.body),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('assertSessions'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.baileysController.assertSessions(instance, req.body),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('createParticipantNodes'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.baileysController.createParticipantNodes(instance, req.body),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('getUSyncDevices'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.baileysController.getUSyncDevices(instance, req.body),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('generateMessageTag'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.baileysController.generateMessageTag(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('sendNode'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.baileysController.sendNode(instance, req.body),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('signalRepositoryDecryptMessage'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.baileysController.signalRepositoryDecryptMessage(instance, req.body),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('getAuthState'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: instance_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.baileysController.getAuthState(instance),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.BaileysRouter = BaileysRouter;
