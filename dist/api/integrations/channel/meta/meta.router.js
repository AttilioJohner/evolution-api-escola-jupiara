"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const server_module_1 = require("@api/server.module");
const express_1 = require("express");
class MetaRouter extends abstract_router_1.RouterBroker {
    constructor(configService) {
        super();
        this.configService = configService;
        this.router = (0, express_1.Router)();
        this.router
            .get(this.routerPath('webhook/meta', false), async (req, res) => {
            if (req.query['hub.verify_token'] === configService.get('WA_BUSINESS').TOKEN_WEBHOOK)
                res.send(req.query['hub.challenge']);
            else
                res.send('Error, wrong validation token');
        })
            .post(this.routerPath('webhook/meta', false), async (req, res) => {
            const { body } = req;
            const response = await server_module_1.metaController.receiveWebhook(body);
            return res.status(200).json(response);
        });
    }
}
exports.MetaRouter = MetaRouter;
