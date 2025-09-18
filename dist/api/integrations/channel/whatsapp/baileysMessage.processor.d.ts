import { BaileysEventMap, MessageUpsertType, proto } from 'baileys';
import { Subject } from 'rxjs';
type MessageUpsertPayload = BaileysEventMap['messages.upsert'] & {
    requestId?: string;
};
type MountProps = {
    onMessageReceive: (payload: MessageUpsertPayload, settings: any) => Promise<void>;
};
export declare class BaileysMessageProcessor {
    private processorLogs;
    private subscription?;
    protected messageSubject: Subject<{
        messages: proto.IWebMessageInfo[];
        type: MessageUpsertType;
        requestId?: string;
        settings: any;
    }>;
    mount({ onMessageReceive }: MountProps): void;
    processMessage(payload: MessageUpsertPayload, settings: any): void;
    onDestroy(): void;
}
export {};
