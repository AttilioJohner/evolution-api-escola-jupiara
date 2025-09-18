import { BaseChatbotDto, BaseChatbotSettingDto } from '../../base-chatbot.dto';
export declare class EvolutionBotDto extends BaseChatbotDto {
    apiUrl: string;
    apiKey: string;
}
export declare class EvolutionBotSettingDto extends BaseChatbotSettingDto {
    botIdFallback?: string;
}
