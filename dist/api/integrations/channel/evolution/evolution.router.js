"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvolutionRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const server_module_1 = require("@api/server.module");
const express_1 = require("express");
class EvolutionRouter extends abstract_router_1.RouterBroker {
    constructor(configService) {
        super();
        this.configService = configService;
        this.router = (0, express_1.Router)();
        this.router.post(this.routerPath('webhook/evolution', false), async (req, res) => {
            const { body } = req;
            const response = await server_module_1.evolutionController.receiveWebhook(body);
            return res.status(200).json(response);
        });
    }
}
exports.EvolutionRouter = EvolutionRouter;
