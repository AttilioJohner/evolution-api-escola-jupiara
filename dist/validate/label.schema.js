"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLabelSchema = void 0;
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
const numberDefinition = {
    type: 'string',
    description: 'Invalid format',
};
exports.handleLabelSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        number: { ...numberDefinition },
        labelId: { type: 'string' },
        action: { type: 'string', enum: ['add', 'remove'] },
    },
    required: ['number', 'labelId', 'action'],
    ...isNotEmpty('number', 'labelId', 'action'),
};
