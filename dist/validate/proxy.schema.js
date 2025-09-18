"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxySchema = void 0;
const uuid_1 = require("uuid");
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
exports.proxySchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        enabled: { type: 'boolean', enum: [true, false] },
        host: { type: 'string' },
        port: { type: 'string' },
        protocol: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string' },
    },
    required: ['enabled', 'host', 'port', 'protocol'],
    ...isNotEmpty('enabled', 'host', 'port', 'protocol'),
};
