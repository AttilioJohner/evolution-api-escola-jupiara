import { BaseChatbotDto, BaseChatbotSettingDto } from '../../base-chatbot.dto';
export declare class OpenaiCredsDto {
    name: string;
    apiKey: string;
}
export declare class OpenaiDto extends BaseChatbotDto {
    openaiCredsId: string;
    botType: string;
    assistantId?: string;
    functionUrl?: string;
    model?: string;
    systemMessages?: string[];
    assistantMessages?: string[];
    userMessages?: string[];
    maxTokens?: number;
}
export declare class OpenaiSettingDto extends BaseChatbotSettingDto {
    openaiCredsId?: string;
    openaiIdFallback?: string;
    speechToText?: boolean;
}
