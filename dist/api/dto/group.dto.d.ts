export declare class CreateGroupDto {
    subject: string;
    participants: string[];
    description?: string;
    promoteParticipants?: boolean;
}
export declare class GroupPictureDto {
    groupJid: string;
    image: string;
}
export declare class GroupSubjectDto {
    groupJid: string;
    subject: string;
}
export declare class GroupDescriptionDto {
    groupJid: string;
    description: string;
}
export declare class GroupJid {
    groupJid: string;
}
export declare class GetParticipant {
    getParticipants: string;
}
export declare class GroupInvite {
    inviteCode: string;
}
export declare class AcceptGroupInvite {
    inviteCode: string;
}
export declare class GroupSendInvite {
    groupJid: string;
    description: string;
    numbers: string[];
}
export declare class GroupUpdateParticipantDto extends GroupJid {
    action: 'add' | 'remove' | 'promote' | 'demote';
    participants: string[];
}
export declare class GroupUpdateSettingDto extends GroupJid {
    action: 'announcement' | 'not_announcement' | 'unlocked' | 'locked';
}
export declare class GroupToggleEphemeralDto extends GroupJid {
    expiration: 0 | 86400 | 604800 | 7776000;
}
