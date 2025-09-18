import { $Enums } from '@prisma/client';
import { BaseChatbotDto, BaseChatbotSettingDto } from '../../base-chatbot.dto';
export declare class DifyDto extends BaseChatbotDto {
    botType?: $Enums.DifyBotType;
    apiUrl?: string;
    apiKey?: string;
}
export declare class DifySettingDto extends BaseChatbotSettingDto {
    difyIdFallback?: string;
}
