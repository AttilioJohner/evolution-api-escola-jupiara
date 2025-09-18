"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileSchema = exports.profileStatusSchema = exports.profileNameSchema = exports.privacySettingsSchema = exports.messageUpSchema = exports.messageValidateSchema = exports.contactValidateSchema = exports.blockUserSchema = exports.presenceSchema = exports.updateMessageSchema = exports.profilePictureSchema = exports.deleteMessageSchema = exports.markChatUnreadSchema = exports.archiveChatSchema = exports.readMessageSchema = exports.whatsappNumberSchema = void 0;
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
exports.whatsappNumberSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        numbers: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: {
                type: 'string',
                description: '"numbers" must be an array of numeric strings',
            },
        },
    },
};
exports.readMessageSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        readMessages: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: {
                properties: {
                    id: { type: 'string' },
                    fromMe: { type: 'boolean', enum: [true, false] },
                    remoteJid: { type: 'string' },
                },
                required: ['id', 'fromMe', 'remoteJid'],
                ...isNotEmpty('id', 'remoteJid'),
            },
        },
    },
    required: ['readMessages'],
};
exports.archiveChatSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        chat: { type: 'string' },
        lastMessage: {
            type: 'object',
            properties: {
                key: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        remoteJid: { type: 'string' },
                        fromMe: { type: 'boolean', enum: [true, false] },
                    },
                    required: ['id', 'fromMe', 'remoteJid'],
                    ...isNotEmpty('id', 'remoteJid'),
                },
                messageTimestamp: { type: 'integer', minLength: 1 },
            },
            required: ['key'],
            ...isNotEmpty('messageTimestamp'),
        },
        archive: { type: 'boolean', enum: [true, false] },
    },
    required: ['archive'],
};
exports.markChatUnreadSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        chat: { type: 'string' },
        lastMessage: {
            type: 'object',
            properties: {
                key: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        remoteJid: { type: 'string' },
                        fromMe: { type: 'boolean', enum: [true, false] },
                    },
                    required: ['id', 'fromMe', 'remoteJid'],
                    ...isNotEmpty('id', 'remoteJid'),
                },
                messageTimestamp: { type: 'integer', minLength: 1 },
            },
            required: ['key'],
            ...isNotEmpty('messageTimestamp'),
        },
    },
    required: ['lastMessage'],
};
exports.deleteMessageSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        id: { type: 'string' },
        fromMe: { type: 'boolean', enum: [true, false] },
        remoteJid: { type: 'string' },
        participant: { type: 'string' },
    },
    required: ['id', 'fromMe', 'remoteJid'],
    ...isNotEmpty('id', 'remoteJid', 'participant'),
};
exports.profilePictureSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        number: { type: 'string' },
        picture: { type: 'string' },
    },
};
exports.updateMessageSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        number: { type: 'string' },
        text: { type: 'string' },
        key: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                remoteJid: { type: 'string' },
                fromMe: { type: 'boolean', enum: [true, false] },
            },
            required: ['id', 'fromMe', 'remoteJid'],
            ...isNotEmpty('id', 'remoteJid'),
        },
    },
    ...isNotEmpty('number', 'text', 'key'),
};
exports.presenceSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        number: { ...numberDefinition },
        delay: { type: 'number' },
        presence: {
            type: 'string',
            enum: ['unavailable', 'available', 'composing', 'recording', 'paused'],
        },
    },
    required: ['number', 'presence', 'delay'],
};
exports.blockUserSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        number: { type: 'string' },
        status: { type: 'string', enum: ['block', 'unblock'] },
    },
    required: ['number', 'status'],
    ...isNotEmpty('number', 'status'),
};
exports.contactValidateSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        where: {
            type: 'object',
            properties: {
                _id: { type: 'string', minLength: 1 },
                pushName: { type: 'string', minLength: 1 },
                id: { type: 'string', minLength: 1 },
            },
            ...isNotEmpty('_id', 'id', 'pushName'),
        },
    },
};
exports.messageValidateSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        where: {
            type: 'object',
            properties: {
                _id: { type: 'string', minLength: 1 },
                key: {
                    type: 'object',
                    if: {
                        propertyNames: {
                            enum: ['fromMe', 'remoteJid', 'id'],
                        },
                    },
                    then: {
                        properties: {
                            remoteJid: {
                                type: 'string',
                                minLength: 1,
                                description: 'The property cannot be empty',
                            },
                            id: {
                                type: 'string',
                                minLength: 1,
                                description: 'The property cannot be empty',
                            },
                            fromMe: { type: 'boolean', enum: [true, false] },
                        },
                    },
                },
                message: { type: 'object' },
            },
            ...isNotEmpty('_id'),
        },
        limit: { type: 'integer' },
    },
};
exports.messageUpSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        where: {
            type: 'object',
            properties: {
                _id: { type: 'string' },
                remoteJid: { type: 'string' },
                id: { type: 'string' },
                fromMe: { type: 'boolean', enum: [true, false] },
                participant: { type: 'string' },
                status: {
                    type: 'string',
                    enum: ['ERROR', 'PENDING', 'SERVER_ACK', 'DELIVERY_ACK', 'READ', 'PLAYED'],
                },
            },
            ...isNotEmpty('_id', 'remoteJid', 'id', 'status'),
        },
        limit: { type: 'integer' },
    },
};
exports.privacySettingsSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        readreceipts: { type: 'string', enum: ['all', 'none'] },
        profile: {
            type: 'string',
            enum: ['all', 'contacts', 'contact_blacklist', 'none'],
        },
        status: {
            type: 'string',
            enum: ['all', 'contacts', 'contact_blacklist', 'none'],
        },
        online: { type: 'string', enum: ['all', 'match_last_seen'] },
        last: { type: 'string', enum: ['all', 'contacts', 'contact_blacklist', 'none'] },
        groupadd: {
            type: 'string',
            enum: ['all', 'contacts', 'contact_blacklist', 'none'],
        },
    },
    required: ['readreceipts', 'profile', 'status', 'online', 'last', 'groupadd'],
    ...isNotEmpty('readreceipts', 'profile', 'status', 'online', 'last', 'groupadd'),
};
exports.profileNameSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        name: { type: 'string' },
    },
    ...isNotEmpty('name'),
};
exports.profileStatusSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        status: { type: 'string' },
    },
    ...isNotEmpty('status'),
};
exports.profileSchema = {
    type: 'object',
    properties: {
        wuid: { type: 'string' },
        name: { type: 'string' },
        picture: { type: 'string' },
        status: { type: 'string' },
        isBusiness: { type: 'boolean' },
    },
};
