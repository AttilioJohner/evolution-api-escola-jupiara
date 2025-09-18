"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMessageController = void 0;
const _exceptions_1 = require("@exceptions");
const class_validator_1 = require("class-validator");
const emoji_regex_1 = __importDefault(require("emoji-regex"));
const regex = (0, emoji_regex_1.default)();
function isEmoji(str) {
    if (str === '')
        return true;
    const match = str.match(regex);
    return match?.length === 1 && match[0] === str;
}
class SendMessageController {
    constructor(waMonitor) {
        this.waMonitor = waMonitor;
    }
    async sendTemplate({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].templateMessage(data);
    }
    async sendText({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].textMessage(data);
    }
    async sendMedia({ instanceName }, data, file) {
        if ((0, class_validator_1.isBase64)(data?.media) && !data?.fileName && data?.mediatype === 'document') {
            throw new _exceptions_1.BadRequestException('For base64 the file name must be informed.');
        }
        if (file || (0, class_validator_1.isURL)(data?.media) || (0, class_validator_1.isBase64)(data?.media)) {
            return await this.waMonitor.waInstances[instanceName].mediaMessage(data, file);
        }
        throw new _exceptions_1.BadRequestException('Owned media must be a url or base64');
    }
    async sendPtv({ instanceName }, data, file) {
        if (file || (0, class_validator_1.isURL)(data?.video) || (0, class_validator_1.isBase64)(data?.video)) {
            return await this.waMonitor.waInstances[instanceName].ptvMessage(data, file);
        }
        throw new _exceptions_1.BadRequestException('Owned media must be a url or base64');
    }
    async sendSticker({ instanceName }, data, file) {
        if (file || (0, class_validator_1.isURL)(data.sticker) || (0, class_validator_1.isBase64)(data.sticker)) {
            return await this.waMonitor.waInstances[instanceName].mediaSticker(data, file);
        }
        throw new _exceptions_1.BadRequestException('Owned media must be a url or base64');
    }
    async sendWhatsAppAudio({ instanceName }, data, file) {
        if (file?.buffer || (0, class_validator_1.isURL)(data.audio) || (0, class_validator_1.isBase64)(data.audio)) {
            return await this.waMonitor.waInstances[instanceName].audioWhatsapp(data, file);
        }
        else {
            console.error('El archivo no tiene buffer o el audio no es una URL o Base64 válida');
            throw new _exceptions_1.BadRequestException('Owned media must be a url, base64, or valid file with buffer');
        }
    }
    async sendButtons({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].buttonMessage(data);
    }
    async sendLocation({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].locationMessage(data);
    }
    async sendList({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].listMessage(data);
    }
    async sendContact({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].contactMessage(data);
    }
    async sendReaction({ instanceName }, data) {
        if (!isEmoji(data.reaction)) {
            throw new _exceptions_1.BadRequestException('Reaction must be a single emoji or empty string');
        }
        return await this.waMonitor.waInstances[instanceName].reactionMessage(data);
    }
    async sendPoll({ instanceName }, data) {
        return await this.waMonitor.waInstances[instanceName].pollMessage(data);
    }
    async sendStatus({ instanceName }, data, file) {
        return await this.waMonitor.waInstances[instanceName].statusMessage(data, file);
    }
}
exports.SendMessageController = SendMessageController;
