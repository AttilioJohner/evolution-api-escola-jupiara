import { proto, WAPresence } from 'baileys';
export declare class Quoted {
    key: proto.IMessageKey;
    message: proto.IMessage;
}
export declare class Options {
    delay?: number;
    presence?: WAPresence;
    quoted?: Quoted;
    linkPreview?: boolean;
    encoding?: boolean;
    mentionsEveryOne?: boolean;
    mentioned?: string[];
    webhookUrl?: string;
}
export declare class MediaMessage {
    mediatype: MediaType;
    mimetype?: string;
    caption?: string;
    fileName?: string;
    media: string;
}
export declare class StatusMessage {
    type: string;
    content: string;
    statusJidList?: string[];
    allContacts?: boolean;
    caption?: string;
    backgroundColor?: string;
    font?: number;
}
export declare class Metadata {
    number: string;
    delay?: number;
    quoted?: Quoted;
    linkPreview?: boolean;
    mentionsEveryOne?: boolean;
    mentioned?: string[];
    encoding?: boolean;
    notConvertSticker?: boolean;
}
export declare class SendTextDto extends Metadata {
    text: string;
}
export declare class SendPresence extends Metadata {
    text: string;
}
export declare class SendStatusDto extends Metadata {
    type: string;
    content: string;
    statusJidList?: string[];
    allContacts?: boolean;
    caption?: string;
    backgroundColor?: string;
    font?: number;
}
export declare class SendPollDto extends Metadata {
    name: string;
    selectableCount: number;
    values: string[];
    messageSecret?: Uint8Array;
}
export type MediaType = 'image' | 'document' | 'video' | 'audio' | 'ptv';
export declare class SendMediaDto extends Metadata {
    mediatype: MediaType;
    mimetype?: string;
    caption?: string;
    fileName?: string;
    media: string;
}
export declare class SendPtvDto extends Metadata {
    video: string;
}
export declare class SendStickerDto extends Metadata {
    sticker: string;
}
export declare class SendAudioDto extends Metadata {
    audio: string;
}
export type TypeButton = 'reply' | 'copy' | 'url' | 'call' | 'pix';
export type KeyType = 'phone' | 'email' | 'cpf' | 'cnpj' | 'random';
export declare class Button {
    type: TypeButton;
    displayText?: string;
    id?: string;
    url?: string;
    copyCode?: string;
    phoneNumber?: string;
    currency?: string;
    name?: string;
    keyType?: KeyType;
    key?: string;
}
export declare class SendButtonsDto extends Metadata {
    thumbnailUrl?: string;
    title: string;
    description?: string;
    footer?: string;
    buttons: Button[];
}
export declare class SendLocationDto extends Metadata {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
}
declare class Row {
    title: string;
    description: string;
    rowId: string;
}
declare class Section {
    title: string;
    rows: Row[];
}
export declare class SendListDto extends Metadata {
    title: string;
    description?: string;
    footerText?: string;
    buttonText: string;
    sections: Section[];
}
export declare class ContactMessage {
    fullName: string;
    wuid: string;
    phoneNumber: string;
    organization?: string;
    email?: string;
    url?: string;
}
export declare class SendTemplateDto extends Metadata {
    name: string;
    language: string;
    components: any;
    webhookUrl?: string;
}
export declare class SendContactDto extends Metadata {
    contact: ContactMessage[];
}
export declare class SendReactionDto {
    key: proto.IMessageKey;
    reaction: string;
}
export {};
