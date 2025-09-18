"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRouter = void 0;
const nats_router_1 = require("@api/integrations/event/nats/nats.router");
const pusher_router_1 = require("@api/integrations/event/pusher/pusher.router");
const rabbitmq_router_1 = require("@api/integrations/event/rabbitmq/rabbitmq.router");
const sqs_router_1 = require("@api/integrations/event/sqs/sqs.router");
const webhook_router_1 = require("@api/integrations/event/webhook/webhook.router");
const websocket_router_1 = require("@api/integrations/event/websocket/websocket.router");
const express_1 = require("express");
class EventRouter {
    constructor(configService, ...guards) {
        this.router = (0, express_1.Router)();
        this.router.use('/webhook', new webhook_router_1.WebhookRouter(configService, ...guards).router);
        this.router.use('/websocket', new websocket_router_1.WebsocketRouter(...guards).router);
        this.router.use('/rabbitmq', new rabbitmq_router_1.RabbitmqRouter(...guards).router);
        this.router.use('/nats', new nats_router_1.NatsRouter(...guards).router);
        this.router.use('/pusher', new pusher_router_1.PusherRouter(...guards).router);
        this.router.use('/sqs', new sqs_router_1.SqsRouter(...guards).router);
    }
}
exports.EventRouter = EventRouter;
