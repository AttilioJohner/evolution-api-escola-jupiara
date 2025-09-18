"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatwootSchema = void 0;
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
exports.chatwootSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        enabled: { type: 'boolean', enum: [true, false] },
        accountId: { type: 'string' },
        token: { type: 'string' },
        url: { type: 'string' },
        signMsg: { type: 'boolean', enum: [true, false] },
        signDelimiter: { type: ['string', 'null'] },
        nameInbox: { type: ['string', 'null'] },
        reopenConversation: { type: 'boolean', enum: [true, false] },
        conversationPending: { type: 'boolean', enum: [true, false] },
        autoCreate: { type: 'boolean', enum: [true, false] },
        importContacts: { type: 'boolean', enum: [true, false] },
        mergeBrazilContacts: { type: 'boolean', enum: [true, false] },
        importMessages: { type: 'boolean', enum: [true, false] },
        daysLimitImportMessages: { type: 'number' },
        ignoreJids: { type: 'array', items: { type: 'string' } },
    },
    required: ['enabled', 'accountId', 'token', 'url', 'signMsg', 'reopenConversation', 'conversationPending'],
    ...isNotEmpty('enabled', 'accountId', 'token', 'url', 'signMsg', 'reopenConversation', 'conversationPending'),
};
