"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pusherSchema = void 0;
const uuid_1 = require("uuid");
const event_controller_1 = require("../event.controller");
const isNotEmpty = (...propertyNames) => {
    const properties = {};
    propertyNames.forEach((property) => (properties[property] = {
        minLength: 1,
        description: `The "${property}" cannot be empty`,
    }));
    return {
        if: {
            propertyNames: {
                enum: [...propertyNames],
            },
        },
        then: { properties },
    };
};
exports.pusherSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        pusher: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                appId: { type: 'string' },
                key: { type: 'string' },
                secret: { type: 'string' },
                cluster: { type: 'string' },
                useTLS: { type: 'boolean' },
                events: {
                    type: 'array',
                    minItems: 0,
                    items: {
                        type: 'string',
                        enum: event_controller_1.EventController.events,
                    },
                },
            },
            required: ['enabled', 'appId', 'key', 'secret', 'cluster', 'useTLS'],
            ...isNotEmpty('enabled', 'appId', 'key', 'secret', 'cluster', 'useTLS'),
        },
    },
    required: ['pusher'],
};
