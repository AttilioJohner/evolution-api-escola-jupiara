"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookSchema = void 0;
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
exports.webhookSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        webhook: {
            type: 'object',
            properties: {
                enabled: { type: 'boolean' },
                url: { type: 'string' },
                headers: { type: 'object' },
                byEvents: { type: 'boolean' },
                base64: { type: 'boolean' },
                events: {
                    type: 'array',
                    minItems: 0,
                    items: {
                        type: 'string',
                        enum: event_controller_1.EventController.events,
                    },
                },
            },
            required: ['enabled', 'url'],
            ...isNotEmpty('enabled', 'url'),
        },
    },
    required: ['webhook'],
};
