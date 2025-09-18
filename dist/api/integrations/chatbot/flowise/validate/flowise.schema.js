"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flowiseIgnoreJidSchema = exports.flowiseSettingSchema = exports.flowiseStatusSchema = exports.flowiseSchema = void 0;
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
exports.flowiseSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        enabled: { type: 'boolean' },
        description: { type: 'string' },
        apiUrl: { type: 'string' },
        apiKey: { type: 'string' },
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
        splitMessages: { type: 'boolean' },
        timePerChar: { type: 'integer' },
    },
    required: ['enabled', 'apiUrl', 'triggerType'],
    ...isNotEmpty('enabled', 'apiUrl', 'triggerType'),
};
exports.flowiseStatusSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        remoteJid: { type: 'string' },
        status: { type: 'string', enum: ['opened', 'closed', 'paused', 'delete'] },
    },
    required: ['remoteJid', 'status'],
    ...isNotEmpty('remoteJid', 'status'),
};
exports.flowiseSettingSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        expire: { type: 'integer' },
        keywordFinish: { type: 'string' },
        delayMessage: { type: 'integer' },
        unknownMessage: { type: 'string' },
        listeningFromMe: { type: 'boolean' },
        stopBotFromMe: { type: 'boolean' },
        keepOpen: { type: 'boolean' },
        debounceTime: { type: 'integer' },
        ignoreJids: { type: 'array', items: { type: 'string' } },
        flowiseIdFallback: { type: 'string' },
        splitMessages: { type: 'boolean' },
        timePerChar: { type: 'integer' },
    },
    required: [
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
    ...isNotEmpty('expire', 'keywordFinish', 'delayMessage', 'unknownMessage', 'listeningFromMe', 'stopBotFromMe', 'keepOpen', 'debounceTime', 'ignoreJids'),
};
exports.flowiseIgnoreJidSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        remoteJid: { type: 'string' },
        action: { type: 'string', enum: ['add', 'remove'] },
    },
    required: ['remoteJid', 'action'],
    ...isNotEmpty('remoteJid', 'action'),
};
