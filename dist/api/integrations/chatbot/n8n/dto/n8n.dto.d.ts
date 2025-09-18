import { BaseChatbotDto, BaseChatbotSettingDto } from '../../base-chatbot.dto';
export declare class N8nDto extends BaseChatbotDto {
    webhookUrl?: string;
    basicAuthUser?: string;
    basicAuthPass?: string;
}
export declare class N8nSettingDto extends BaseChatbotSettingDto {
}
export declare class N8nMessageDto {
    chatInput: string;
    sessionId: string;
}
