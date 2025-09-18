"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const group_dto_1 = require("@api/dto/group.dto");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
const index_router_1 = require("./index.router");
class GroupRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router
            .post(this.routerPath('create'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.createGroupSchema,
                ClassRef: group_dto_1.CreateGroupDto,
                execute: (instance, data) => server_module_1.groupController.createGroup(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('updateGroupSubject'), ...guards, async (req, res) => {
            const response = await this.groupValidate({
                request: req,
                schema: validate_schema_1.updateGroupSubjectSchema,
                ClassRef: group_dto_1.GroupSubjectDto,
                execute: (instance, data) => server_module_1.groupController.updateGroupSubject(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('updateGroupPicture'), ...guards, async (req, res) => {
            const response = await this.groupValidate({
                request: req,
                schema: validate_schema_1.updateGroupPictureSchema,
                ClassRef: group_dto_1.GroupPictureDto,
                execute: (instance, data) => server_module_1.groupController.updateGroupPicture(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('updateGroupDescription'), ...guards, async (req, res) => {
            const response = await this.groupValidate({
                request: req,
                schema: validate_schema_1.updateGroupDescriptionSchema,
                ClassRef: group_dto_1.GroupDescriptionDto,
                execute: (instance, data) => server_module_1.groupController.updateGroupDescription(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .get(this.routerPath('findGroupInfos'), ...guards, async (req, res) => {
            const response = await this.groupValidate({
                request: req,
                schema: validate_schema_1.groupJidSchema,
                ClassRef: group_dto_1.GroupJid,
                execute: (instance, data) => server_module_1.groupController.findGroupInfo(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('fetchAllGroups'), ...guards, async (req, res) => {
            const response = await this.getParticipantsValidate({
                request: req,
                schema: validate_schema_1.getParticipantsSchema,
                ClassRef: group_dto_1.GetParticipant,
                execute: (instance, data) => server_module_1.groupController.fetchAllGroups(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('participants'), ...guards, async (req, res) => {
            const response = await this.groupValidate({
                request: req,
                schema: validate_schema_1.groupJidSchema,
                ClassRef: group_dto_1.GroupJid,
                execute: (instance, data) => server_module_1.groupController.findParticipants(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('inviteCode'), ...guards, async (req, res) => {
            const response = await this.groupValidate({
                request: req,
                schema: validate_schema_1.groupJidSchema,
                ClassRef: group_dto_1.GroupJid,
                execute: (instance, data) => server_module_1.groupController.inviteCode(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('inviteInfo'), ...guards, async (req, res) => {
            const response = await this.inviteCodeValidate({
                request: req,
                schema: validate_schema_1.groupInviteSchema,
                ClassRef: group_dto_1.GroupInvite,
                execute: (instance, data) => server_module_1.groupController.inviteInfo(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .get(this.routerPath('acceptInviteCode'), ...guards, async (req, res) => {
            const response = await this.inviteCodeValidate({
                request: req,
                schema: validate_schema_1.AcceptGroupInviteSchema,
                ClassRef: group_dto_1.AcceptGroupInvite,
                execute: (instance, data) => server_module_1.groupController.acceptInviteCode(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('sendInvite'), ...guards, async (req, res) => {
            const response = await this.groupNoValidate({
                request: req,
                schema: validate_schema_1.groupSendInviteSchema,
                ClassRef: group_dto_1.GroupSendInvite,
                execute: (instance, data) => server_module_1.groupController.sendInvite(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        })
            .post(this.routerPath('revokeInviteCode'), ...guards, async (req, res) => {
            const response = await this.groupValidate({
                request: req,
                schema: validate_schema_1.groupJidSchema,
                ClassRef: group_dto_1.GroupJid,
                execute: (instance, data) => server_module_1.groupController.revokeInviteCode(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('updateParticipant'), ...guards, async (req, res) => {
            const response = await this.groupValidate({
                request: req,
                schema: validate_schema_1.updateParticipantsSchema,
                ClassRef: group_dto_1.GroupUpdateParticipantDto,
                execute: (instance, data) => server_module_1.groupController.updateGParticipate(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('updateSetting'), ...guards, async (req, res) => {
            const response = await this.groupValidate({
                request: req,
                schema: validate_schema_1.updateSettingsSchema,
                ClassRef: group_dto_1.GroupUpdateSettingDto,
                execute: (instance, data) => server_module_1.groupController.updateGSetting(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .post(this.routerPath('toggleEphemeral'), ...guards, async (req, res) => {
            const response = await this.groupValidate({
                request: req,
                schema: validate_schema_1.toggleEphemeralSchema,
                ClassRef: group_dto_1.GroupToggleEphemeralDto,
                execute: (instance, data) => server_module_1.groupController.toggleEphemeral(instance, data),
            });
            res.status(index_router_1.HttpStatus.CREATED).json(response);
        })
            .delete(this.routerPath('leaveGroup'), ...guards, async (req, res) => {
            const response = await this.groupValidate({
                request: req,
                schema: {},
                ClassRef: group_dto_1.GroupJid,
                execute: (instance, data) => server_module_1.groupController.leaveGroup(instance, data),
            });
            res.status(index_router_1.HttpStatus.OK).json(response);
        });
    }
}
exports.GroupRouter = GroupRouter;
