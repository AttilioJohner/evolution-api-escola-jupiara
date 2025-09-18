"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RouterBroker = void 0;
require("express-async-errors");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const jsonschema_1 = require("jsonschema");
const logger = new logger_config_1.Logger('Validate');
class RouterBroker {
    constructor() { }
    routerPath(path, param = true) {
        let route = '/' + path;
        param ? (route += '/:instanceName') : null;
        return route;
    }
    async dataValidate(args) {
        const { request, schema, ClassRef, execute } = args;
        const ref = new ClassRef();
        const body = request.body;
        const instance = request.params;
        if (request?.query && Object.keys(request.query).length > 0) {
            Object.assign(instance, request.query);
        }
        if (request.originalUrl.includes('/instance/create')) {
            Object.assign(instance, body);
        }
        Object.assign(ref, body);
        const v = schema ? (0, jsonschema_1.validate)(ref, schema) : { valid: true, errors: [] };
        if (!v.valid) {
            const message = v.errors.map(({ stack, schema }) => {
                let message;
                if (schema['description']) {
                    message = schema['description'];
                }
                else {
                    message = stack.replace('instance.', '');
                }
                return message;
            });
            logger.error(message);
            throw new _exceptions_1.BadRequestException(message);
        }
        return await execute(instance, ref);
    }
    async groupNoValidate(args) {
        const { request, ClassRef, schema, execute } = args;
        const instance = request.params;
        const ref = new ClassRef();
        Object.assign(ref, request.body);
        const v = (0, jsonschema_1.validate)(ref, schema);
        if (!v.valid) {
            const message = v.errors.map(({ property, stack, schema }) => {
                let message;
                if (schema['description']) {
                    message = schema['description'];
                }
                else {
                    message = stack.replace('instance.', '');
                }
                return {
                    property: property.replace('instance.', ''),
                    message,
                };
            });
            logger.error([...message]);
            throw new _exceptions_1.BadRequestException(...message);
        }
        return await execute(instance, ref);
    }
    async groupValidate(args) {
        const { request, ClassRef, schema, execute } = args;
        const instance = request.params;
        const body = request.body;
        let groupJid = body?.groupJid;
        if (!groupJid) {
            if (request.query?.groupJid) {
                groupJid = request.query.groupJid;
            }
            else {
                throw new _exceptions_1.BadRequestException('The group id needs to be informed in the query', 'ex: "groupJid=120362@g.us"');
            }
        }
        if (!groupJid.endsWith('@g.us')) {
            groupJid = groupJid + '@g.us';
        }
        Object.assign(body, {
            groupJid: groupJid,
        });
        const ref = new ClassRef();
        Object.assign(ref, body);
        const v = (0, jsonschema_1.validate)(ref, schema);
        if (!v.valid) {
            const message = v.errors.map(({ property, stack, schema }) => {
                let message;
                if (schema['description']) {
                    message = schema['description'];
                }
                else {
                    message = stack.replace('instance.', '');
                }
                return {
                    property: property.replace('instance.', ''),
                    message,
                };
            });
            logger.error([...message]);
            throw new _exceptions_1.BadRequestException(...message);
        }
        return await execute(instance, ref);
    }
    async inviteCodeValidate(args) {
        const { request, ClassRef, schema, execute } = args;
        const inviteCode = request.query;
        if (!inviteCode?.inviteCode) {
            throw new _exceptions_1.BadRequestException('The group invite code id needs to be informed in the query', 'ex: "inviteCode=F1EX5QZxO181L3TMVP31gY" (Obtained from group join link)');
        }
        const instance = request.params;
        const body = request.body;
        const ref = new ClassRef();
        Object.assign(body, inviteCode);
        Object.assign(ref, body);
        const v = (0, jsonschema_1.validate)(ref, schema);
        if (!v.valid) {
            const message = v.errors.map(({ property, stack, schema }) => {
                let message;
                if (schema['description']) {
                    message = schema['description'];
                }
                else {
                    message = stack.replace('instance.', '');
                }
                return {
                    property: property.replace('instance.', ''),
                    message,
                };
            });
            logger.error([...message]);
            throw new _exceptions_1.BadRequestException(...message);
        }
        return await execute(instance, ref);
    }
    async getParticipantsValidate(args) {
        const { request, ClassRef, schema, execute } = args;
        const getParticipants = request.query;
        if (!getParticipants?.getParticipants) {
            throw new _exceptions_1.BadRequestException('The getParticipants needs to be informed in the query');
        }
        const instance = request.params;
        const body = request.body;
        const ref = new ClassRef();
        Object.assign(body, getParticipants);
        Object.assign(ref, body);
        const v = (0, jsonschema_1.validate)(ref, schema);
        if (!v.valid) {
            const message = v.errors.map(({ property, stack, schema }) => {
                let message;
                if (schema['description']) {
                    message = schema['description'];
                }
                else {
                    message = stack.replace('instance.', '');
                }
                return {
                    property: property.replace('instance.', ''),
                    message,
                };
            });
            logger.error([...message]);
            throw new _exceptions_1.BadRequestException(...message);
        }
        return await execute(instance, ref);
    }
}
exports.RouterBroker = RouterBroker;
