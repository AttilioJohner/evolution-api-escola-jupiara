"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelRouter = void 0;
const express_1 = require("express");
const evolution_router_1 = require("./evolution/evolution.router");
const meta_router_1 = require("./meta/meta.router");
const baileys_router_1 = require("./whatsapp/baileys.router");
class ChannelRouter {
    constructor(configService, ...guards) {
        this.router = (0, express_1.Router)();
        this.router.use('/', new evolution_router_1.EvolutionRouter(configService).router);
        this.router.use('/', new meta_router_1.MetaRouter(configService).router);
        this.router.use('/baileys', new baileys_router_1.BaileysRouter(...guards).router);
    }
}
exports.ChannelRouter = ChannelRouter;
