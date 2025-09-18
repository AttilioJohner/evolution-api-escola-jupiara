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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventSchema = void 0;
const uuid_1 = require("uuid");
const event_controller_1 = require("./event.controller");
__exportStar(require("@api/integrations/event/pusher/pusher.schema"), exports);
__exportStar(require("@api/integrations/event/webhook/webhook.schema"), exports);
exports.eventSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        websocket: {
            $ref: '#/$defs/event',
        },
        rabbitmq: {
            $ref: '#/$defs/event',
        },
        nats: {
            $ref: '#/$defs/event',
        },
        sqs: {
            $ref: '#/$defs/event',
        },
    },
    $defs: {
        event: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean', enum: [true, false] },
                events: {
                    type: 'array',
                    minItems: 0,
                    items: {
                        type: 'string',
                        enum: event_controller_1.EventController.events,
                    },
                },
            },
            required: ['enabled'],
        },
    },
};
