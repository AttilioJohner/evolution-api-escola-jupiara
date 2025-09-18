import { proto, WAPresence, WAPrivacyOnlineValue, WAPrivacyValue, WAReadReceiptsValue } from 'baileys';
export declare class OnWhatsAppDto {
    readonly jid: string;
    readonly exists: boolean;
    readonly number: string;
    readonly name?: string;
    readonly lid?: string;
    constructor(jid: string, exists: boolean, number: string, name?: string, lid?: string);
}
export declare class getBase64FromMediaMessageDto {
    message: proto.WebMessageInfo;
    convertToMp4?: boolean;
}
export declare class WhatsAppNumberDto {
    numbers: string[];
}
export declare class NumberDto {
    number: string;
}
export declare class NumberBusiness {
    wid?: string;
    jid?: string;
    exists?: boolean;
    isBusiness: boolean;
    name?: string;
    message?: string;
    description?: string;
    email?: string;
    websites?: string[];
    website?: string[];
    address?: string;
    about?: string;
    vertical?: string;
    profilehandle?: string;
}
export declare class ProfileNameDto {
    name: string;
}
export declare class ProfileStatusDto {
    status: string;
}
export declare class ProfilePictureDto {
    number?: string;
    picture?: string;
}
declare class Key {
    id: string;
    fromMe: boolean;
    remoteJid: string;
}
export declare class ReadMessageDto {
    readMessages: Key[];
}
export declare class LastMessage {
    key: Key;
    messageTimestamp?: number;
}
export declare class ArchiveChatDto {
    lastMessage?: LastMessage;
    chat?: string;
    archive: boolean;
}
export declare class MarkChatUnreadDto {
    lastMessage?: LastMessage;
    chat?: string;
}
export declare class PrivacySettingDto {
    readreceipts: WAReadReceiptsValue;
    profile: WAPrivacyValue;
    status: WAPrivacyValue;
    online: WAPrivacyOnlineValue;
    last: WAPrivacyValue;
    groupadd: string;
}
export declare class DeleteMessage {
    id: string;
    fromMe: boolean;
    remoteJid: string;
    participant?: string;
}
export declare class Options {
    delay?: number;
    presence?: WAPresence;
}
declare class OptionsMessage {
    options: Options;
}
export declare class Metadata extends OptionsMessage {
    number: string;
}
export declare class SendPresenceDto extends Metadata {
    presence: WAPresence;
    delay: number;
}
export declare class UpdateMessageDto extends Metadata {
    number: string;
    key: proto.IMessageKey;
    text: string;
}
export declare class BlockUserDto {
    number: string;
    status: 'block' | 'unblock';
}
export {};
