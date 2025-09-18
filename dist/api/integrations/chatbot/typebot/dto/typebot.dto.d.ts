import { BaseChatbotDto, BaseChatbotSettingDto } from '../../base-chatbot.dto';
export declare class PrefilledVariables {
    remoteJid?: string;
    pushName?: string;
    messageType?: string;
    additionalData?: {
        [key: string]: any;
    };
}
export declare class TypebotDto extends BaseChatbotDto {
    url: string;
    typebot: string;
}
export declare class TypebotSettingDto extends BaseChatbotSettingDto {
    typebotIdFallback?: string;
}
