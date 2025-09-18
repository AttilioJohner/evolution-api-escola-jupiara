"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockUserDto = exports.UpdateMessageDto = exports.SendPresenceDto = exports.Metadata = exports.Options = exports.DeleteMessage = exports.PrivacySettingDto = exports.MarkChatUnreadDto = exports.ArchiveChatDto = exports.LastMessage = exports.ReadMessageDto = exports.ProfilePictureDto = exports.ProfileStatusDto = exports.ProfileNameDto = exports.NumberBusiness = exports.NumberDto = exports.WhatsAppNumberDto = exports.getBase64FromMediaMessageDto = exports.OnWhatsAppDto = void 0;
class OnWhatsAppDto {
    constructor(jid, exists, number, name, lid) {
        this.jid = jid;
        this.exists = exists;
        this.number = number;
        this.name = name;
        this.lid = lid;
    }
}
exports.OnWhatsAppDto = OnWhatsAppDto;
class getBase64FromMediaMessageDto {
}
exports.getBase64FromMediaMessageDto = getBase64FromMediaMessageDto;
class WhatsAppNumberDto {
}
exports.WhatsAppNumberDto = WhatsAppNumberDto;
class NumberDto {
}
exports.NumberDto = NumberDto;
class NumberBusiness {
}
exports.NumberBusiness = NumberBusiness;
class ProfileNameDto {
}
exports.ProfileNameDto = ProfileNameDto;
class ProfileStatusDto {
}
exports.ProfileStatusDto = ProfileStatusDto;
class ProfilePictureDto {
}
exports.ProfilePictureDto = ProfilePictureDto;
class Key {
}
class ReadMessageDto {
}
exports.ReadMessageDto = ReadMessageDto;
class LastMessage {
}
exports.LastMessage = LastMessage;
class ArchiveChatDto {
}
exports.ArchiveChatDto = ArchiveChatDto;
class MarkChatUnreadDto {
}
exports.MarkChatUnreadDto = MarkChatUnreadDto;
class PrivacySettingDto {
}
exports.PrivacySettingDto = PrivacySettingDto;
class DeleteMessage {
}
exports.DeleteMessage = DeleteMessage;
class Options {
}
exports.Options = Options;
class OptionsMessage {
}
class Metadata extends OptionsMessage {
}
exports.Metadata = Metadata;
class SendPresenceDto extends Metadata {
}
exports.SendPresenceDto = SendPresenceDto;
class UpdateMessageDto extends Metadata {
}
exports.UpdateMessageDto = UpdateMessageDto;
class BlockUserDto {
}
exports.BlockUserDto = BlockUserDto;
