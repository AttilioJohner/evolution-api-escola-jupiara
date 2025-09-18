"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openaiIgnoreJidSchema = exports.openaiSettingSchema = exports.openaiStatusSchema = exports.openaiCredsSchema = exports.openaiSchema = void 0;
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
exports.openaiSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        enabled: { type: 'boolean' },
        description: { type: 'string' },
        openaiCredsId: { type: 'string' },
        botType: { type: 'string', enum: ['assistant', 'chatCompletion'] },
        assistantId: { type: 'string' },
        functionUrl: { type: 'string' },
        model: { type: 'string' },
        systemMessages: { type: 'array', items: { type: 'string' } },
        assistantMessages: { type: 'array', items: { type: 'string' } },
        userMessages: { type: 'array', items: { type: 'string' } },
        maxTokens: { type: 'integer' },
        triggerType: { type: 'string', enum: ['all', 'keyword', 'none', 'advanced'] },
        triggerOperator: { type: 'string', enum: ['equals', 'contains', 'startsWith', 'endsWith', 'regex'] },
        triggerValue: { type: 'string' },
        expire: { type: 'integer' },
        keywordFinish: { type: 'string' },
        delayMessage: { type: 'integer' },
        unknownMessage: { type: 'string' },
        listeningFromMe: { type: 'boolean' },
        stopBotFromMe: { type: 'boolean' },
        keepOpen: { type: 'boolean' },
        debounceTime: { type: 'integer' },
        ignoreJids: { type: 'array', items: { type: 'string' } },
    },
    required: ['enabled', 'openaiCredsId', 'botType', 'triggerType'],
    ...isNotEmpty('enabled', 'openaiCredsId', 'botType', 'triggerType'),
};
exports.openaiCredsSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        name: { type: 'string' },
        apiKey: { type: 'string' },
    },
    required: ['name', 'apiKey'],
    ...isNotEmpty('name', 'apiKey'),
};
exports.openaiStatusSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        remoteJid: { type: 'string' },
        status: { type: 'string', enum: ['opened', 'closed', 'paused', 'delete'] },
    },
    required: ['remoteJid', 'status'],
    ...isNotEmpty('remoteJid', 'status'),
};
exports.openaiSettingSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        openaiCredsId: { type: 'string' },
        expire: { type: 'integer' },
        keywordFinish: { type: 'string' },
        delayMessage: { type: 'integer' },
        unknownMessage: { type: 'string' },
        listeningFromMe: { type: 'boolean' },
        stopBotFromMe: { type: 'boolean' },
        keepOpen: { type: 'boolean' },
        debounceTime: { type: 'integer' },
        speechToText: { type: 'boolean' },
        ignoreJids: { type: 'array', items: { type: 'string' } },
        openaiIdFallback: { type: 'string' },
    },
    required: [
        'openaiCredsId',
        'expire',
        'keywordFinish',
        'delayMessage',
        'unknownMessage',
        'listeningFromMe',
        'stopBotFromMe',
        'keepOpen',
        'debounceTime',
        'ignoreJids',
    ],
    ...isNotEmpty('openaiCredsId', 'expire', 'keywordFinish', 'delayMessage', 'unknownMessage', 'listeningFromMe', 'stopBotFromMe', 'keepOpen', 'debounceTime', 'ignoreJids'),
};
exports.openaiIgnoreJidSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        remoteJid: { type: 'string' },
        action: { type: 'string', enum: ['add', 'remove'] },
    },
    required: ['remoteJid', 'action'],
    ...isNotEmpty('remoteJid', 'action'),
};
