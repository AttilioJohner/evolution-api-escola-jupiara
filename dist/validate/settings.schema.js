"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsSchema = void 0;
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
exports.settingsSchema = {
    $id: (0, uuid_1.v4)(),
    type: 'object',
    properties: {
        rejectCall: { type: 'boolean' },
        msgCall: { type: 'string' },
        groupsIgnore: { type: 'boolean' },
        alwaysOnline: { type: 'boolean' },
        readMessages: { type: 'boolean' },
        readStatus: { type: 'boolean' },
        syncFullHistory: { type: 'boolean' },
        wavoipToken: { type: 'string' },
    },
    required: ['rejectCall', 'groupsIgnore', 'alwaysOnline', 'readMessages', 'readStatus', 'syncFullHistory'],
    ...isNotEmpty('rejectCall', 'groupsIgnore', 'alwaysOnline', 'readMessages', 'readStatus', 'syncFullHistory'),
};
