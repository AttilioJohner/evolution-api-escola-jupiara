"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.n8nIgnoreJidSchema = exports.n8nSettingSchema = exports.n8nStatusSchema = exports.n8nSchema = void 0;
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
exports.n8nSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        enabled: { type: 'boolean' },
        description: { type: 'string' },
        webhookUrl: { type: 'string' },
        basicAuthUser: { type: 'string' },
        basicAuthPassword: { type: 'string' },
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
    required: ['enabled', 'webhookUrl', 'triggerType'],
    ...isNotEmpty('enabled', 'webhookUrl', 'triggerType'),
};
exports.n8nStatusSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        remoteJid: { type: 'string' },
        status: { type: 'string', enum: ['opened', 'closed', 'paused', 'delete'] },
    },
    required: ['remoteJid', 'status'],
    ...isNotEmpty('remoteJid', 'status'),
};
exports.n8nSettingSchema = {
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
        botIdFallback: { type: 'string' },
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
        'splitMessages',
        'timePerChar',
    ],
    ...isNotEmpty('expire', 'keywordFinish', 'delayMessage', 'unknownMessage', 'listeningFromMe', 'stopBotFromMe', 'keepOpen', 'debounceTime', 'ignoreJids', 'splitMessages', 'timePerChar'),
};
exports.n8nIgnoreJidSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        remoteJid: { type: 'string' },
        action: { type: 'string', enum: ['add', 'remove'] },
    },
    required: ['remoteJid', 'action'],
    ...isNotEmpty('remoteJid', 'action'),
};
