"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const chat_dto_1 = require("@api/dto/chat.dto");
const instance_dto_1 = require("@api/dto/instance.dto");
const repository_service_1 = require("@api/repository/repository.service");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
const index_router_1 = require("./index.router");
class ChatRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('whatsappNumbers'), ...guards, async (req, res) => {
            try {
                const response = await this.dataValidate({
                    request: req,
                    schema: validate_schema_1.whatsappNumberSchema,
                    ClassRef: chat_dto_1.WhatsAppNumberDto,
                    execute: (instance, data) => server_module_1.chatController.whatsappNumber(instance, data),
                });
                return res.status(index_router_1.HttpStatus.OK).json(response);
            }
            catch (error) {
                console.log(error);
                return res.status(index_router_1.HttpStatus.BAD_REQUEST).json(error);
            }
        })
            .post(this.routerPath('markMessageAsRead'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.readMessageSchema,
                ClassRef: chat_dto_1.ReadMessageDto,
                execute: (instance, data) => server_module_1.chatController.readMessage(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('archiveChat'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.archiveChatSchema,
                ClassRef: chat_dto_1.ArchiveChatDto,
                execute: (instance, data) => server_module_1.chatController.archiveChat(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('markChatUnread'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.markChatUnreadSchema,
                ClassRef: chat_dto_1.MarkChatUnreadDto,
                execute: (instance, data) => server_module_1.chatController.markChatUnread(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .delete(this.routerPath('deleteMessageForEveryone'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.deleteMessageSchema,
                ClassRef: chat_dto_1.DeleteMessage,
                execute: (instance, data) => server_module_1.chatController.deleteMessage(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('fetchProfilePictureUrl'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.profilePictureSchema,
                ClassRef: chat_dto_1.NumberDto,
                execute: (instance, data) => server_module_1.chatController.fetchProfilePicture(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('getBase64FromMediaMessage'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: null,
                ClassRef: chat_dto_1.getBase64FromMediaMessageDto,
                execute: (instance, data) => server_module_1.chatController.getBase64FromMediaMessage(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('updateMessage'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.updateMessageSchema,
                ClassRef: chat_dto_1.UpdateMessageDto,
                execute: (instance, data) => server_module_1.chatController.updateMessage(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('sendPresence'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.presenceSchema,
                ClassRef: chat_dto_1.SendPresenceDto,
                execute: (instance, data) => server_module_1.chatController.sendPresence(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('updateBlockStatus'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.blockUserSchema,
                ClassRef: chat_dto_1.BlockUserDto,
                execute: (instance, data) => server_module_1.chatController.blockUser(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('findContacts'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.contactValidateSchema,
                ClassRef: (repository_service_1.Query),
                execute: (instance, data) => server_module_1.chatController.fetchContacts(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('findMessages'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.messageValidateSchema,
                ClassRef: (repository_service_1.Query),
                execute: (instance, data) => server_module_1.chatController.fetchMessages(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('findStatusMessage'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.messageUpSchema,
                ClassRef: (repository_service_1.Query),
                execute: (instance, data) => server_module_1.chatController.fetchStatusMessage(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('findChats'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.contactValidateSchema,
                ClassRef: (repository_service_1.Query),
                execute: (instance, data) => server_module_1.chatController.fetchChats(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('findChatByRemoteJid'), ...guards, async (req, res) => {
            const instance = req.params;
            const { remoteJid } = req.query;
            if (!remoteJid) {
                return res.status(index_router_1.HttpStatus.BAD_REQUEST).json({ error: 'remoteJid is a required query parameter' });
            }
            const response = await server_module_1.chatController.findChatByRemoteJid(instance, remoteJid);
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('fetchBusinessProfile'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.profilePictureSchema,
                ClassRef: chat_dto_1.ProfilePictureDto,
                execute: (instance, data) => server_module_1.chatController.fetchBusinessProfile(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('fetchProfile'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.profileSchema,
                ClassRef: chat_dto_1.NumberDto,
                execute: (instance, data) => server_module_1.chatController.fetchProfile(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('updateProfileName'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.profileNameSchema,
                ClassRef: chat_dto_1.ProfileNameDto,
                execute: (instance, data) => server_module_1.chatController.updateProfileName(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('updateProfileStatus'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.profileStatusSchema,
                ClassRef: chat_dto_1.ProfileStatusDto,
                execute: (instance, data) => server_module_1.chatController.updateProfileStatus(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('updateProfilePicture'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.profilePictureSchema,
                ClassRef: chat_dto_1.ProfilePictureDto,
                execute: (instance, data) => server_module_1.chatController.updateProfilePicture(instance, data),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .delete(this.routerPath('removeProfilePicture'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.profilePictureSchema,
                ClassRef: chat_dto_1.ProfilePictureDto,
                execute: (instance) => server_module_1.chatController.removeProfilePicture(instance),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchPrivacySettings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: null,
                ClassRef: instance_dto_1.InstanceDto,
                execute: (instance) => server_module_1.chatController.fetchPrivacySettings(instance),
            });
            return res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('updatePrivacySettings'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.privacySettingsSchema,
                ClassRef: chat_dto_1.PrivacySettingDto,
                execute: (instance, data) => server_module_1.chatController.updatePrivacySettings(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        });
    }
}
exports.ChatRouter = ChatRouter;
