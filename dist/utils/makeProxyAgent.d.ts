import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
type Proxy = {
    host: string;
    password?: string;
    port: string;
    protocol: string;
    username?: string;
};
export declare function makeProxyAgent(proxy: Proxy | string): HttpsProxyAgent<string> | SocksProxyAgent;
export {};
