"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateSchema = void 0;
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
exports.templateSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        name: { type: 'string' },
        category: { type: 'string', enum: ['AUTHENTICATION', 'MARKETING', 'UTILITY'] },
        allowCategoryChange: { type: 'boolean' },
        language: { type: 'string' },
        components: { type: 'array' },
        webhookUrl: { type: 'string' },
    },
    required: ['name', 'category', 'language', 'components'],
    ...isNotEmpty('name', 'category', 'language', 'components'),
};
