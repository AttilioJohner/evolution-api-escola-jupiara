"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const instance_dto_1 = require("@api/dto/instance.dto");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
const index_router_1 = require("./index.router");
class InstanceRouter extends abstract_router_1.RouterBroker {
    constructor(configService, ...guards) {
        super();
        this.configService = configService;
        this.router = (0, express_1.Router)();
        this.router
            .post('/create', ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.instanceSchema,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.instanceController.createInstance(instance),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('restart'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: null,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.instanceController.restartInstance(instance),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('connect'), ...guards, async (req, res) => {
            try {
                const response = await this.dataValidate({
                    request: req,
                    schema: null,
                    ClassRef: instance_dto_1.InstanceDto,
                    execute: (instance) => server_module_1.instanceController.connectToWhatsapp(instance),
                });
                if (response?.error) {
                    const { toMessage } = await Promise.resolve().then(() => __importStar(require('../../lib/toMessage')));
                    return res.status(index_router_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                        error: true,
                        message: toMessage(response.message ?? response),
                        details: response?.details ?? undefined,
                    });
                }
                return res.status(index_router_1.HttpStatus.OK).json(response);
            }
            catch (err) {
                const { toMessage } = await Promise.resolve().then(() => __importStar(require('../../lib/toMessage')));
                return res.status(index_router_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                    error: true,
                    message: toMessage(err),
                });
            }
        })
            .get(this.routerPath('connectionState'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: null,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.instanceController.connectionState(instance),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchInstances', false), ...guards, async (req, res) => {
            const key = req.get('apikey');
            const response = await this.dataValidate({
                request: req,
                schema: null,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.instanceController.fetchInstances(instance, key),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('setPresence'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.presenceOnlySchema,
                ClassRef: instance_dto_1.SetPresenceDto,
                execute: (instance, data) => server_module_1.instanceController.setPresence(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .delete(this.routerPath('logout'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: null,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.instanceController.logout(instance),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .delete(this.routerPath('delete'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: null,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.instanceController.deleteInstance(instance),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.InstanceRouter = InstanceRouter;
