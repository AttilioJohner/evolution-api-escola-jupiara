import { BaseChatbotDto, BaseChatbotSettingDto } from '../../base-chatbot.dto';
export declare class EvoaiDto extends BaseChatbotDto {
    agentUrl?: string;
    apiKey?: string;
}
export declare class EvoaiSettingDto extends BaseChatbotSettingDto {
    evoaiIdFallback?: string;
}
