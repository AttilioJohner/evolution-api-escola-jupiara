import { TriggerOperator, TriggerType } from '@prisma/client';
export declare class BaseChatbotDto {
    enabled?: boolean;
    description: string;
    expire?: number;
    keywordFinish?: string;
    delayMessage?: number;
    unknownMessage?: string;
    listeningFromMe?: boolean;
    stopBotFromMe?: boolean;
    keepOpen?: boolean;
    debounceTime?: number;
    triggerType: TriggerType;
    triggerOperator?: TriggerOperator;
    triggerValue?: string;
    ignoreJids?: string[];
    splitMessages?: boolean;
    timePerChar?: number;
}
export declare class BaseChatbotSettingDto {
    expire?: number;
    keywordFinish?: string;
    delayMessage?: number;
    unknownMessage?: string;
    listeningFromMe?: boolean;
    stopBotFromMe?: boolean;
    keepOpen?: boolean;
    debounceTime?: number;
    ignoreJids?: any;
    splitMessages?: boolean;
    timePerChar?: number;
    fallbackId?: string;
}
