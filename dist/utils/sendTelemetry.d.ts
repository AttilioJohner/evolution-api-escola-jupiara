export interface TelemetryData {
    route: string;
    apiVersion: string;
    timestamp: Date;
}
export declare const sendTelemetry: (route: string) => Promise<void>;
