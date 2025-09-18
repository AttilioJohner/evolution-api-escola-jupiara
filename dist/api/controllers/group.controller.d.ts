import { AcceptGroupInvite, CreateGroupDto, GetParticipant, GroupDescriptionDto, GroupInvite, GroupJid, GroupPictureDto, GroupSendInvite, GroupSubjectDto, GroupToggleEphemeralDto, GroupUpdateParticipantDto, GroupUpdateSettingDto } from '@api/dto/group.dto';
import { InstanceDto } from '@api/dto/instance.dto';
import { WAMonitoringService } from '@api/services/monitor.service';
export declare class GroupController {
    private readonly waMonitor;
    constructor(waMonitor: WAMonitoringService);
    createGroup(instance: InstanceDto, create: CreateGroupDto): Promise<any>;
    updateGroupPicture(instance: InstanceDto, update: GroupPictureDto): Promise<any>;
    updateGroupSubject(instance: InstanceDto, update: GroupSubjectDto): Promise<any>;
    updateGroupDescription(instance: InstanceDto, update: GroupDescriptionDto): Promise<any>;
    findGroupInfo(instance: InstanceDto, groupJid: GroupJid): Promise<any>;
    fetchAllGroups(instance: InstanceDto, getPaticipants: GetParticipant): Promise<any>;
    inviteCode(instance: InstanceDto, groupJid: GroupJid): Promise<any>;
    inviteInfo(instance: InstanceDto, inviteCode: GroupInvite): Promise<any>;
    sendInvite(instance: InstanceDto, data: GroupSendInvite): Promise<any>;
    acceptInviteCode(instance: InstanceDto, inviteCode: AcceptGroupInvite): Promise<any>;
    revokeInviteCode(instance: InstanceDto, groupJid: GroupJid): Promise<any>;
    findParticipants(instance: InstanceDto, groupJid: GroupJid): Promise<any>;
    updateGParticipate(instance: InstanceDto, update: GroupUpdateParticipantDto): Promise<any>;
    updateGSetting(instance: InstanceDto, update: GroupUpdateSettingDto): Promise<any>;
    toggleEphemeral(instance: InstanceDto, update: GroupToggleEphemeralDto): Promise<any>;
    leaveGroup(instance: InstanceDto, groupJid: GroupJid): Promise<any>;
}
