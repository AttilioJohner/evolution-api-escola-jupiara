"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3UrlSchema = exports.s3Schema = void 0;
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
exports.s3Schema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        id: { type: 'string' },
        type: { type: 'string' },
        messageId: { type: 'integer' },
    },
    ...isNotEmpty('id', 'type', 'messageId'),
};
exports.s3UrlSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        id: { type: 'string', pattern: '\\d+', minLength: 1 },
        expiry: { type: 'string', pattern: '\\d+', minLength: 1 },
    },
    ...isNotEmpty('id'),
    required: ['id'],
};
