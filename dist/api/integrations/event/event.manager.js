"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventManager = void 0;
const nats_controller_1 = require("@api/integrations/event/nats/nats.controller");
const pusher_controller_1 = require("@api/integrations/event/pusher/pusher.controller");
const rabbitmq_controller_1 = require("@api/integrations/event/rabbitmq/rabbitmq.controller");
const sqs_controller_1 = require("@api/integrations/event/sqs/sqs.controller");
const webhook_controller_1 = require("@api/integrations/event/webhook/webhook.controller");
const websocket_controller_1 = require("@api/integrations/event/websocket/websocket.controller");
class EventManager {
    constructor(prismaRepository, waMonitor) {
        this.prisma = prismaRepository;
        this.monitor = waMonitor;
        this.websocket = new websocket_controller_1.WebsocketController(prismaRepository, waMonitor);
        this.webhook = new webhook_controller_1.WebhookController(prismaRepository, waMonitor);
        this.rabbitmq = new rabbitmq_controller_1.RabbitmqController(prismaRepository, waMonitor);
        this.nats = new nats_controller_1.NatsController(prismaRepository, waMonitor);
        this.sqs = new sqs_controller_1.SqsController(prismaRepository, waMonitor);
        this.pusher = new pusher_controller_1.PusherController(prismaRepository, waMonitor);
    }
    set prisma(prisma) {
        this.prismaRepository = prisma;
    }
    get prisma() {
        return this.prismaRepository;
    }
    set monitor(waMonitor) {
        this.waMonitor = waMonitor;
    }
    get monitor() {
        return this.waMonitor;
    }
    set websocket(websocket) {
        this.websocketController = websocket;
    }
    get websocket() {
        return this.websocketController;
    }
    set webhook(webhook) {
        this.webhookController = webhook;
    }
    get webhook() {
        return this.webhookController;
    }
    set rabbitmq(rabbitmq) {
        this.rabbitmqController = rabbitmq;
    }
    get rabbitmq() {
        return this.rabbitmqController;
    }
    set nats(nats) {
        this.natsController = nats;
    }
    get nats() {
        return this.natsController;
    }
    set sqs(sqs) {
        this.sqsController = sqs;
    }
    get sqs() {
        return this.sqsController;
    }
    set pusher(pusher) {
        this.pusherController = pusher;
    }
    get pusher() {
        return this.pusherController;
    }
    init(httpServer) {
        this.websocket.init(httpServer);
        this.rabbitmq.init();
        this.nats.init();
        this.sqs.init();
        this.pusher.init();
    }
    async emit(eventData) {
        await this.websocket.emit(eventData);
        await this.rabbitmq.emit(eventData);
        await this.nats.emit(eventData);
        await this.sqs.emit(eventData);
        await this.webhook.emit(eventData);
        await this.pusher.emit(eventData);
    }
    async setInstance(instanceName, data) {
        if (data.websocket)
            await this.websocket.set(instanceName, {
                websocket: {
                    enabled: true,
                    events: data.websocket?.events,
                },
            });
        if (data.rabbitmq)
            await this.rabbitmq.set(instanceName, {
                rabbitmq: {
                    enabled: true,
                    events: data.rabbitmq?.events,
                },
            });
        if (data.nats)
            await this.nats.set(instanceName, {
                nats: {
                    enabled: true,
                    events: data.nats?.events,
                },
            });
        if (data.sqs)
            await this.sqs.set(instanceName, {
                sqs: {
                    enabled: true,
                    events: data.sqs?.events,
                },
            });
        if (data.webhook)
            await this.webhook.set(instanceName, {
                webhook: {
                    enabled: true,
                    events: data.webhook?.events,
                    url: data.webhook?.url,
                    headers: data.webhook?.headers,
                    base64: data.webhook?.base64,
                    byEvents: data.webhook?.byEvents,
                },
            });
        if (data.pusher)
            await this.pusher.set(instanceName, {
                pusher: {
                    enabled: true,
                    events: data.pusher?.events,
                    appId: data.pusher?.appId,
                    key: data.pusher?.key,
                    secret: data.pusher?.secret,
                    cluster: data.pusher?.cluster,
                    useTLS: data.pusher?.useTLS,
                },
            });
    }
}
exports.EventManager = EventManager;
