import { BaseChatbotDto, BaseChatbotSettingDto } from '../../base-chatbot.dto';
export declare class FlowiseDto extends BaseChatbotDto {
    apiUrl: string;
    apiKey?: string;
}
export declare class FlowiseSettingDto extends BaseChatbotSettingDto {
    flowiseIdFallback?: string;
}
