import { Constructor } from '@api/integrations/integration.dto';
import { JsonValue } from '@prisma/client/runtime/library';
export declare class EventDto {
    webhook?: {
        enabled?: boolean;
        events?: string[];
        url?: string;
        headers?: JsonValue;
        byEvents?: boolean;
        base64?: boolean;
    };
    websocket?: {
        enabled?: boolean;
        events?: string[];
    };
    sqs?: {
        enabled?: boolean;
        events?: string[];
    };
    rabbitmq?: {
        enabled?: boolean;
        events?: string[];
    };
    nats?: {
        enabled?: boolean;
        events?: string[];
    };
    pusher?: {
        enabled?: boolean;
        appId?: string;
        key?: string;
        secret?: string;
        cluster?: string;
        useTLS?: boolean;
        events?: string[];
    };
}
export declare function EventInstanceMixin<TBase extends Constructor>(Base: TBase): {
    new (...args: any[]): {
        webhook?: {
            enabled?: boolean;
            events?: string[];
            headers?: JsonValue;
            url?: string;
            byEvents?: boolean;
            base64?: boolean;
        };
        websocket?: {
            enabled?: boolean;
            events?: string[];
        };
        sqs?: {
            enabled?: boolean;
            events?: string[];
        };
        rabbitmq?: {
            enabled?: boolean;
            events?: string[];
        };
        nats?: {
            enabled?: boolean;
            events?: string[];
        };
        pusher?: {
            enabled?: boolean;
            appId?: string;
            key?: string;
            secret?: string;
            cluster?: string;
            useTLS?: boolean;
            events?: string[];
        };
    };
} & TBase;
