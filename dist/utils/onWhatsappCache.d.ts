interface ISaveOnWhatsappCacheParams {
    remoteJid: string;
    lid?: string;
}
export declare function saveOnWhatsappCache(data: ISaveOnWhatsappCacheParams[]): Promise<void>;
export declare function getOnWhatsappCache(remoteJids: string[]): Promise<{
    remoteJid: string;
    number: string;
    jidOptions: string[];
    lid?: string;
}[]>;
export {};
