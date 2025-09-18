"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typebotIgnoreJidSchema = exports.typebotSettingSchema = exports.typebotStartSchema = exports.typebotStatusSchema = exports.typebotSchema = void 0;
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
exports.typebotSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        enabled: { type: 'boolean' },
        description: { type: 'string' },
        url: { type: 'string' },
        typebot: { type: 'string' },
        triggerType: { type: 'string', enum: ['all', 'keyword', 'none', 'advanced'] },
        triggerOperator: { type: 'string', enum: ['equals', 'contains', 'startsWith', 'endsWith', 'regex'] },
        triggerValue: { type: 'string' },
        expire: { type: 'integer' },
        keywordFinish: { type: 'string' },
        delayMessage: { type: 'integer' },
        unknownMessage: { type: 'string' },
        listeningFromMe: { type: 'boolean' },
        stopBotFromMe: { type: 'boolean' },
        ignoreJids: { type: 'array', items: { type: 'string' } },
    },
    required: ['enabled', 'url', 'typebot', 'triggerType'],
    ...isNotEmpty('enabled', 'url', 'typebot', 'triggerType'),
};
exports.typebotStatusSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        remoteJid: { type: 'string' },
        status: { type: 'string', enum: ['opened', 'closed', 'paused', 'delete'] },
    },
    required: ['remoteJid', 'status'],
    ...isNotEmpty('remoteJid', 'status'),
};
exports.typebotStartSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        remoteJid: { type: 'string' },
        url: { type: 'string' },
        typebot: { type: 'string' },
    },
    required: ['remoteJid', 'url', 'typebot'],
    ...isNotEmpty('remoteJid', 'url', 'typebot'),
};
exports.typebotSettingSchema = {
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
        typebotIdFallback: { type: 'string' },
        ignoreJids: { type: 'array', items: { type: 'string' } },
    },
    required: ['expire', 'keywordFinish', 'delayMessage', 'unknownMessage', 'listeningFromMe', 'stopBotFromMe'],
    ...isNotEmpty('expire', 'keywordFinish', 'delayMessage', 'unknownMessage', 'listeningFromMe', 'stopBotFromMe'),
};
exports.typebotIgnoreJidSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        remoteJid: { type: 'string' },
        action: { type: 'string', enum: ['add', 'remove'] },
    },
    required: ['remoteJid', 'action'],
    ...isNotEmpty('remoteJid', 'action'),
};
