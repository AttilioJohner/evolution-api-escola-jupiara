"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const sendMessage_dto_1 = require("@api/dto/sendMessage.dto");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const index_router_1 = require("./index.router");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
class MessageRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('sendTemplate'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.templateMessageSchema,
                ClassRef: sendMessage_dto_1.SendTemplateDto,
                execute: (instance, data) => server_module_1.sendMessageController.sendTemplate(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendText'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.textMessageSchema,
                ClassRef: sendMessage_dto_1.SendTextDto,
                execute: (instance, data) => server_module_1.sendMessageController.sendText(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendMedia'), ...guards, upload.single('file'), async (req, res) => {
            const bodyData = req.body;
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.mediaMessageSchema,
                ClassRef: sendMessage_dto_1.SendMediaDto,
                execute: (instance) => server_module_1.sendMessageController.sendMedia(instance, bodyData, req.file),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendPtv'), ...guards, upload.single('file'), async (req, res) => {
            const bodyData = req.body;
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.ptvMessageSchema,
                ClassRef: sendMessage_dto_1.SendPtvDto,
                execute: (instance) => server_module_1.sendMessageController.sendPtv(instance, bodyData, req.file),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendWhatsAppAudio'), ...guards, upload.single('file'), async (req, res) => {
            const bodyData = req.body;
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.audioMessageSchema,
                ClassRef: sendMessage_dto_1.SendMediaDto,
                execute: (instance) => server_module_1.sendMessageController.sendWhatsAppAudio(instance, bodyData, req.file),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendStatus'), ...guards, upload.single('file'), async (req, res) => {
            const bodyData = req.body;
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.statusMessageSchema,
                ClassRef: sendMessage_dto_1.SendStatusDto,
                execute: (instance) => server_module_1.sendMessageController.sendStatus(instance, bodyData, req.file),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendSticker'), ...guards, upload.single('file'), async (req, res) => {
            const bodyData = req.body;
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.stickerMessageSchema,
                ClassRef: sendMessage_dto_1.SendStickerDto,
                execute: (instance) => server_module_1.sendMessageController.sendSticker(instance, bodyData, req.file),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendLocation'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.locationMessageSchema,
                ClassRef: sendMessage_dto_1.SendLocationDto,
                execute: (instance, data) => server_module_1.sendMessageController.sendLocation(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendContact'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.contactMessageSchema,
                ClassRef: sendMessage_dto_1.SendContactDto,
                execute: (instance, data) => server_module_1.sendMessageController.sendContact(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendReaction'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.reactionMessageSchema,
                ClassRef: sendMessage_dto_1.SendReactionDto,
                execute: (instance, data) => server_module_1.sendMessageController.sendReaction(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendPoll'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.pollMessageSchema,
                ClassRef: sendMessage_dto_1.SendPollDto,
                execute: (instance, data) => server_module_1.sendMessageController.sendPoll(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendList'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.listMessageSchema,
                ClassRef: sendMessage_dto_1.SendListDto,
                execute: (instance, data) => server_module_1.sendMessageController.sendList(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('sendButtons'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.buttonsMessageSchema,
                ClassRef: sendMessage_dto_1.SendButtonsDto,
                execute: (instance, data) => server_module_1.sendMessageController.sendButtons(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        });
    }
}
exports.MessageRouter = MessageRouter;
