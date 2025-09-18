import { AxiosRequestConfig } from 'axios';
import { WAVersion } from 'baileys';
export declare const fetchLatestWaWebVersion: (options: AxiosRequestConfig<{}>) => Promise<{
    version: WAVersion;
    isLatest: boolean;
    error?: undefined;
} | {
    version: WAVersion;
    isLatest: boolean;
    error: any;
}>;
