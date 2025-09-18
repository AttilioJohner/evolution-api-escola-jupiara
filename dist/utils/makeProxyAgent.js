"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeProxyAgent = makeProxyAgent;
const https_proxy_agent_1 = require("https-proxy-agent");
const socks_proxy_agent_1 = require("socks-proxy-agent");
function selectProxyAgent(proxyUrl) {
    const url = new URL(proxyUrl);
    const PROXY_HTTP_PROTOCOL = 'http:';
    const PROXY_SOCKS_PROTOCOL = 'socks:';
    switch (url.protocol) {
        case PROXY_HTTP_PROTOCOL:
            return new https_proxy_agent_1.HttpsProxyAgent(url);
        case PROXY_SOCKS_PROTOCOL:
            return new socks_proxy_agent_1.SocksProxyAgent(url);
        default:
            throw new Error(`Unsupported proxy protocol: ${url.protocol}`);
    }
}
function makeProxyAgent(proxy) {
    if (typeof proxy === 'string') {
        return selectProxyAgent(proxy);
    }
    const { host, password, port, protocol, username } = proxy;
    let proxyUrl = `${protocol}://${host}:${port}`;
    if (username && password) {
        proxyUrl = `${protocol}://${username}:${password}@${host}:${port}`;
    }
    return selectProxyAgent(proxyUrl);
}
