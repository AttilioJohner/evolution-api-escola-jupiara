"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateGroupDescriptionSchema = exports.updateGroupSubjectSchema = exports.updateGroupPictureSchema = exports.toggleEphemeralSchema = exports.updateSettingsSchema = exports.updateParticipantsSchema = exports.AcceptGroupInviteSchema = exports.groupInviteSchema = exports.groupSendInviteSchema = exports.getParticipantsSchema = exports.groupJidSchema = exports.createGroupSchema = void 0;
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
exports.createGroupSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        subject: { type: 'string' },
        description: { type: 'string' },
        profilePicture: { type: 'string' },
        promoteParticipants: { type: 'boolean', enum: [true, false] },
        participants: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: {
                type: 'string',
                minLength: 10,
                pattern: '\\d+',
                description: '"participants" must be an array of numeric strings',
            },
        },
    },
    required: ['subject', 'participants'],
    ...isNotEmpty('subject', 'description', 'profilePicture'),
};
exports.groupJidSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        groupJid: { type: 'string', pattern: '^[\\d-]+@g.us$' },
    },
    required: ['groupJid'],
    ...isNotEmpty('groupJid'),
};
exports.getParticipantsSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        getParticipants: { type: 'string', enum: ['true', 'false'] },
    },
    required: ['getParticipants'],
    ...isNotEmpty('getParticipants'),
};
exports.groupSendInviteSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        groupJid: { type: 'string' },
        description: { type: 'string' },
        numbers: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: {
                type: 'string',
                minLength: 10,
                pattern: '\\d+',
                description: '"numbers" must be an array of numeric strings',
            },
        },
    },
    required: ['groupJid', 'description', 'numbers'],
    ...isNotEmpty('groupJid', 'description', 'numbers'),
};
exports.groupInviteSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        inviteCode: { type: 'string', pattern: '^[a-zA-Z0-9]{22}$' },
    },
    required: ['inviteCode'],
    ...isNotEmpty('inviteCode'),
};
exports.AcceptGroupInviteSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        inviteCode: { type: 'string', pattern: '^[a-zA-Z0-9]{22}$' },
    },
    required: ['inviteCode'],
    ...isNotEmpty('inviteCode'),
};
exports.updateParticipantsSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        groupJid: { type: 'string' },
        action: {
            type: 'string',
            enum: ['add', 'remove', 'promote', 'demote'],
        },
        participants: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: {
                type: 'string',
                minLength: 10,
                pattern: '\\d+',
                description: '"participants" must be an array of numeric strings',
            },
        },
    },
    required: ['groupJid', 'action', 'participants'],
    ...isNotEmpty('groupJid', 'action'),
};
exports.updateSettingsSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        groupJid: { type: 'string' },
        action: {
            type: 'string',
            enum: ['announcement', 'not_announcement', 'locked', 'unlocked'],
        },
    },
    required: ['groupJid', 'action'],
    ...isNotEmpty('groupJid', 'action'),
};
exports.toggleEphemeralSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        groupJid: { type: 'string' },
        expiration: {
            type: 'number',
            enum: [0, 86400, 604800, 7776000],
        },
    },
    required: ['groupJid', 'expiration'],
    ...isNotEmpty('groupJid', 'expiration'),
};
exports.updateGroupPictureSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        groupJid: { type: 'string' },
        image: { type: 'string' },
    },
    required: ['groupJid', 'image'],
    ...isNotEmpty('groupJid', 'image'),
};
exports.updateGroupSubjectSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        groupJid: { type: 'string' },
        subject: { type: 'string' },
    },
    required: ['groupJid', 'subject'],
    ...isNotEmpty('groupJid', 'subject'),
};
exports.updateGroupDescriptionSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        groupJid: { type: 'string' },
        description: { type: 'string' },
    },
    required: ['groupJid', 'description'],
    ...isNotEmpty('groupJid', 'description'),
};
