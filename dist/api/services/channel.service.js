"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelStartupService = void 0;
const chatwoot_service_1 = require("@api/integrations/chatbot/chatwoot/services/chatwoot.service");
const dify_service_1 = require("@api/integrations/chatbot/dify/services/dify.service");
const openai_service_1 = require("@api/integrations/chatbot/openai/services/openai.service");
const typebot_service_1 = require("@api/integrations/chatbot/typebot/services/typebot.service");
const server_module_1 = require("@api/server.module");
const wa_types_1 = require("@api/types/wa.types");
const logger_config_1 = require("@config/logger.config");
const _exceptions_1 = require("@exceptions");
const client_1 = require("@prisma/client");
const createJid_1 = require("@utils/createJid");
const class_validator_1 = require("class-validator");
const uuid_1 = require("uuid");
class ChannelStartupService {
    constructor(configService, eventEmitter, prismaRepository, chatwootCache) {
        this.configService = configService;
        this.eventEmitter = eventEmitter;
        this.prismaRepository = prismaRepository;
        this.chatwootCache = chatwootCache;
        this.logger = new logger_config_1.Logger('ChannelStartupService');
        this.instance = {};
        this.localChatwoot = {};
        this.localProxy = {};
        this.localSettings = {};
        this.localWebhook = {};
        this.chatwootService = new chatwoot_service_1.ChatwootService(server_module_1.waMonitor, this.configService, this.prismaRepository, this.chatwootCache);
        this.openaiService = new openai_service_1.OpenaiService(server_module_1.waMonitor, this.prismaRepository, this.configService);
        this.typebotService = new typebot_service_1.TypebotService(server_module_1.waMonitor, this.configService, this.prismaRepository, this.openaiService);
        this.difyService = new dify_service_1.DifyService(server_module_1.waMonitor, this.prismaRepository, this.configService, this.openaiService);
    }
    setInstance(instance) {
        this.logger.setInstance(instance.instanceName);
        this.instance.name = instance.instanceName;
        this.instance.id = instance.instanceId;
        this.instance.integration = instance.integration;
        this.instance.number = instance.number;
        this.instance.token = instance.token;
        this.instance.businessId = instance.businessId;
        if (this.configService.get('CHATWOOT').ENABLED && this.localChatwoot?.enabled) {
            this.chatwootService.eventWhatsapp(wa_types_1.Events.STATUS_INSTANCE, { instanceName: this.instance.name }, {
                instance: this.instance.name,
                status: 'created',
            });
        }
    }
    set instanceName(name) {
        this.logger.setInstance(name);
        if (!name) {
            this.instance.name = (0, uuid_1.v4)();
            return;
        }
        this.instance.name = name;
    }
    get instanceName() {
        return this.instance.name;
    }
    set instanceId(id) {
        if (!id) {
            this.instance.id = (0, uuid_1.v4)();
            return;
        }
        this.instance.id = id;
    }
    get instanceId() {
        return this.instance.id;
    }
    set integration(integration) {
        this.instance.integration = integration;
    }
    get integration() {
        return this.instance.integration;
    }
    set number(number) {
        this.instance.number = number;
    }
    get number() {
        return this.instance.number;
    }
    set token(token) {
        this.instance.token = token;
    }
    get token() {
        return this.instance.token;
    }
    get wuid() {
        return this.instance.wuid;
    }
    async loadWebhook() {
        const data = await this.prismaRepository.webhook.findUnique({
            where: {
                instanceId: this.instanceId,
            },
        });
        this.localWebhook.enabled = data?.enabled;
        this.localWebhook.webhookBase64 = data?.webhookBase64;
    }
    async loadSettings() {
        const data = await this.prismaRepository.setting.findUnique({
            where: {
                instanceId: this.instanceId,
            },
        });
        this.localSettings.rejectCall = data?.rejectCall;
        this.localSettings.msgCall = data?.msgCall;
        this.localSettings.groupsIgnore = data?.groupsIgnore;
        this.localSettings.alwaysOnline = data?.alwaysOnline;
        this.localSettings.readMessages = data?.readMessages;
        this.localSettings.readStatus = data?.readStatus;
        this.localSettings.syncFullHistory = data?.syncFullHistory;
        this.localSettings.wavoipToken = data?.wavoipToken;
    }
    async setSettings(data) {
        if (this.configService.get('DATABASE_ENABLED') !== 'true') {
            Object.assign(this.localSettings, data);
            return;
        }
        await this.prismaRepository.setting.upsert({
            where: {
                instanceId: this.instanceId,
            },
            update: {
                rejectCall: data.rejectCall,
                msgCall: data.msgCall,
                groupsIgnore: data.groupsIgnore,
                alwaysOnline: data.alwaysOnline,
                readMessages: data.readMessages,
                readStatus: data.readStatus,
                syncFullHistory: data.syncFullHistory,
                wavoipToken: data.wavoipToken,
            },
            create: {
                rejectCall: data.rejectCall,
                msgCall: data.msgCall,
                groupsIgnore: data.groupsIgnore,
                alwaysOnline: data.alwaysOnline,
                readMessages: data.readMessages,
                readStatus: data.readStatus,
                syncFullHistory: data.syncFullHistory,
                wavoipToken: data.wavoipToken,
                instanceId: this.instanceId,
            },
        });
        this.localSettings.rejectCall = data?.rejectCall;
        this.localSettings.msgCall = data?.msgCall;
        this.localSettings.groupsIgnore = data?.groupsIgnore;
        this.localSettings.alwaysOnline = data?.alwaysOnline;
        this.localSettings.readMessages = data?.readMessages;
        this.localSettings.readStatus = data?.readStatus;
        this.localSettings.syncFullHistory = data?.syncFullHistory;
        this.localSettings.wavoipToken = data?.wavoipToken;
        if (this.localSettings.wavoipToken && this.localSettings.wavoipToken.length > 0) {
            this.client.ws.close();
            this.client.ws.connect();
        }
    }
    async findSettings() {
        const data = await this.prismaRepository.setting.findUnique({
            where: {
                instanceId: this.instanceId,
            },
        });
        if (!data) {
            return null;
        }
        return {
            rejectCall: data.rejectCall,
            msgCall: data.msgCall,
            groupsIgnore: data.groupsIgnore,
            alwaysOnline: data.alwaysOnline,
            readMessages: data.readMessages,
            readStatus: data.readStatus,
            syncFullHistory: data.syncFullHistory,
            wavoipToken: data.wavoipToken,
        };
    }
    async loadChatwoot() {
        if (!this.configService.get('CHATWOOT').ENABLED) {
            return;
        }
        const data = await this.prismaRepository.chatwoot.findUnique({
            where: {
                instanceId: this.instanceId,
            },
        });
        this.localChatwoot.enabled = data?.enabled;
        this.localChatwoot.accountId = data?.accountId;
        this.localChatwoot.token = data?.token;
        this.localChatwoot.url = data?.url;
        this.localChatwoot.nameInbox = data?.nameInbox;
        this.localChatwoot.signMsg = data?.signMsg;
        this.localChatwoot.signDelimiter = data?.signDelimiter;
        this.localChatwoot.number = data?.number;
        this.localChatwoot.reopenConversation = data?.reopenConversation;
        this.localChatwoot.conversationPending = data?.conversationPending;
        this.localChatwoot.mergeBrazilContacts = data?.mergeBrazilContacts;
        this.localChatwoot.importContacts = data?.importContacts;
        this.localChatwoot.importMessages = data?.importMessages;
        this.localChatwoot.daysLimitImportMessages = data?.daysLimitImportMessages;
    }
    async setChatwoot(data) {
        if (!this.configService.get('CHATWOOT').ENABLED) {
            return;
        }
        const chatwoot = await this.prismaRepository.chatwoot.findUnique({
            where: {
                instanceId: this.instanceId,
            },
        });
        if (chatwoot) {
            await this.prismaRepository.chatwoot.update({
                where: {
                    instanceId: this.instanceId,
                },
                data: {
                    enabled: data?.enabled,
                    accountId: data.accountId,
                    token: data.token,
                    url: data.url,
                    nameInbox: data.nameInbox,
                    signMsg: data.signMsg,
                    signDelimiter: data.signMsg ? data.signDelimiter : null,
                    number: data.number,
                    reopenConversation: data.reopenConversation,
                    conversationPending: data.conversationPending,
                    mergeBrazilContacts: data.mergeBrazilContacts,
                    importContacts: data.importContacts,
                    importMessages: data.importMessages,
                    daysLimitImportMessages: data.daysLimitImportMessages,
                    organization: data.organization,
                    logo: data.logo,
                    ignoreJids: data.ignoreJids,
                },
            });
            Object.assign(this.localChatwoot, { ...data, signDelimiter: data.signMsg ? data.signDelimiter : null });
            this.clearCacheChatwoot();
            return;
        }
        await this.prismaRepository.chatwoot.create({
            data: {
                enabled: data?.enabled,
                accountId: data.accountId,
                token: data.token,
                url: data.url,
                nameInbox: data.nameInbox,
                signMsg: data.signMsg,
                number: data.number,
                reopenConversation: data.reopenConversation,
                conversationPending: data.conversationPending,
                mergeBrazilContacts: data.mergeBrazilContacts,
                importContacts: data.importContacts,
                importMessages: data.importMessages,
                daysLimitImportMessages: data.daysLimitImportMessages,
                organization: data.organization,
                logo: data.logo,
                ignoreJids: data.ignoreJids,
                instanceId: this.instanceId,
            },
        });
        Object.assign(this.localChatwoot, { ...data, signDelimiter: data.signMsg ? data.signDelimiter : null });
        this.clearCacheChatwoot();
    }
    async findChatwoot() {
        if (!this.configService.get('CHATWOOT').ENABLED) {
            return null;
        }
        const data = await this.prismaRepository.chatwoot.findUnique({
            where: {
                instanceId: this.instanceId,
            },
        });
        if (!data) {
            return null;
        }
        const ignoreJidsArray = Array.isArray(data.ignoreJids) ? data.ignoreJids.map((event) => String(event)) : [];
        return {
            enabled: data?.enabled,
            accountId: data.accountId,
            token: data.token,
            url: data.url,
            nameInbox: data.nameInbox,
            signMsg: data.signMsg,
            signDelimiter: data.signDelimiter || null,
            reopenConversation: data.reopenConversation,
            conversationPending: data.conversationPending,
            mergeBrazilContacts: data.mergeBrazilContacts,
            importContacts: data.importContacts,
            importMessages: data.importMessages,
            daysLimitImportMessages: data.daysLimitImportMessages,
            organization: data.organization,
            logo: data.logo,
            ignoreJids: ignoreJidsArray,
        };
    }
    clearCacheChatwoot() {
        if (this.localChatwoot?.enabled) {
            this.chatwootService.getCache()?.deleteAll(this.instanceName);
        }
    }
    async loadProxy() {
        this.localProxy.enabled = false;
        if (process.env.PROXY_HOST) {
            this.localProxy.enabled = true;
            this.localProxy.host = process.env.PROXY_HOST;
            this.localProxy.port = process.env.PROXY_PORT || '80';
            this.localProxy.protocol = process.env.PROXY_PROTOCOL || 'http';
            this.localProxy.username = process.env.PROXY_USERNAME;
            this.localProxy.password = process.env.PROXY_PASSWORD;
        }
        const data = await this.prismaRepository.proxy.findUnique({
            where: {
                instanceId: this.instanceId,
            },
        });
        if (data?.enabled) {
            this.localProxy.enabled = true;
            this.localProxy.host = data?.host;
            this.localProxy.port = data?.port;
            this.localProxy.protocol = data?.protocol;
            this.localProxy.username = data?.username;
            this.localProxy.password = data?.password;
        }
    }
    async setProxy(data) {
        await this.prismaRepository.proxy.upsert({
            where: {
                instanceId: this.instanceId,
            },
            update: {
                enabled: data?.enabled,
                host: data.host,
                port: data.port,
                protocol: data.protocol,
                username: data.username,
                password: data.password,
            },
            create: {
                enabled: data?.enabled,
                host: data.host,
                port: data.port,
                protocol: data.protocol,
                username: data.username,
                password: data.password,
                instanceId: this.instanceId,
            },
        });
        Object.assign(this.localProxy, data);
    }
    async findProxy() {
        const data = await this.prismaRepository.proxy.findUnique({
            where: {
                instanceId: this.instanceId,
            },
        });
        if (!data) {
            throw new _exceptions_1.NotFoundException('Proxy not found');
        }
        return data;
    }
    async sendDataWebhook(event, data, local = true, integration) {
        const serverUrl = this.configService.get('SERVER').URL;
        const tzoffset = new Date().getTimezoneOffset() * 60000;
        const localISOTime = new Date(Date.now() - tzoffset).toISOString();
        const now = localISOTime;
        const expose = this.configService.get('AUTHENTICATION').EXPOSE_IN_FETCH_INSTANCES;
        const instanceApikey = this.token || 'Apikey not found';
        await server_module_1.eventManager.emit({
            instanceName: this.instance.name,
            origin: ChannelStartupService.name,
            event,
            data,
            serverUrl,
            dateTime: now,
            sender: this.wuid,
            apiKey: expose && instanceApikey ? instanceApikey : null,
            local,
            integration,
        });
    }
    formatMXOrARNumber(jid) {
        const countryCode = jid.substring(0, 2);
        if (Number(countryCode) === 52 || Number(countryCode) === 54) {
            if (jid.length === 13) {
                const number = countryCode + jid.substring(3);
                return number;
            }
            return jid;
        }
        return jid;
    }
    formatBRNumber(jid) {
        const regexp = new RegExp(/^(\d{2})(\d{2})\d{1}(\d{8})$/);
        if (regexp.test(jid)) {
            const match = regexp.exec(jid);
            if (match && match[1] === '55') {
                const joker = Number.parseInt(match[3][0]);
                const ddd = Number.parseInt(match[2]);
                if (joker < 7 || ddd < 31) {
                    return match[0];
                }
                return match[1] + match[2] + match[3];
            }
            return jid;
        }
        else {
            return jid;
        }
    }
    async fetchContacts(query) {
        const remoteJid = query?.where?.remoteJid
            ? query?.where?.remoteJid.includes('@')
                ? query.where?.remoteJid
                : (0, createJid_1.createJid)(query.where?.remoteJid)
            : null;
        const where = {
            instanceId: this.instanceId,
        };
        if (remoteJid) {
            where['remoteJid'] = remoteJid;
        }
        const contactFindManyArgs = {
            where,
        };
        if (query.offset)
            contactFindManyArgs.take = query.offset;
        if (query.page) {
            const validPage = Math.max(query.page, 1);
            contactFindManyArgs.skip = query.offset * (validPage - 1);
        }
        const contacts = await this.prismaRepository.contact.findMany(contactFindManyArgs);
        return contacts.map((contact) => {
            const remoteJid = contact.remoteJid;
            const isGroup = remoteJid.endsWith('@g.us');
            const isSaved = !!contact.pushName || !!contact.profilePicUrl;
            const type = isGroup ? 'group' : isSaved ? 'contact' : 'group_member';
            return {
                ...contact,
                isGroup,
                isSaved,
                type,
            };
        });
    }
    cleanMessageData(message) {
        if (!message)
            return message;
        const cleanedMessage = { ...message };
        const mediaUrl = cleanedMessage.message.mediaUrl;
        delete cleanedMessage.message.base64;
        if (cleanedMessage.message) {
            if (cleanedMessage.message.imageMessage) {
                cleanedMessage.message.imageMessage = {
                    caption: cleanedMessage.message.imageMessage.caption,
                };
            }
            if (cleanedMessage.message.videoMessage) {
                cleanedMessage.message.videoMessage = {
                    caption: cleanedMessage.message.videoMessage.caption,
                };
            }
            if (cleanedMessage.message.audioMessage) {
                cleanedMessage.message.audioMessage = {
                    seconds: cleanedMessage.message.audioMessage.seconds,
                };
            }
            if (cleanedMessage.message.stickerMessage) {
                cleanedMessage.message.stickerMessage = {};
            }
            if (cleanedMessage.message.documentMessage) {
                cleanedMessage.message.documentMessage = {
                    caption: cleanedMessage.message.documentMessage.caption,
                    name: cleanedMessage.message.documentMessage.name,
                };
            }
            if (cleanedMessage.message.documentWithCaptionMessage) {
                cleanedMessage.message.documentWithCaptionMessage = {
                    caption: cleanedMessage.message.documentWithCaptionMessage.caption,
                    name: cleanedMessage.message.documentWithCaptionMessage.name,
                };
            }
        }
        if (mediaUrl)
            cleanedMessage.message.mediaUrl = mediaUrl;
        return cleanedMessage;
    }
    async fetchMessages(query) {
        const keyFilters = query?.where?.key;
        const timestampFilter = {};
        if (query?.where?.messageTimestamp) {
            if (query.where.messageTimestamp['gte'] && query.where.messageTimestamp['lte']) {
                timestampFilter['messageTimestamp'] = {
                    gte: Math.floor(new Date(query.where.messageTimestamp['gte']).getTime() / 1000),
                    lte: Math.floor(new Date(query.where.messageTimestamp['lte']).getTime() / 1000),
                };
            }
        }
        const count = await this.prismaRepository.message.count({
            where: {
                instanceId: this.instanceId,
                id: query?.where?.id,
                source: query?.where?.source,
                messageType: query?.where?.messageType,
                ...timestampFilter,
                AND: [
                    keyFilters?.id ? { key: { path: ['id'], equals: keyFilters?.id } } : {},
                    keyFilters?.fromMe ? { key: { path: ['fromMe'], equals: keyFilters?.fromMe } } : {},
                    keyFilters?.remoteJid ? { key: { path: ['remoteJid'], equals: keyFilters?.remoteJid } } : {},
                    keyFilters?.participants ? { key: { path: ['participants'], equals: keyFilters?.participants } } : {},
                ],
            },
        });
        if (!query?.offset) {
            query.offset = 50;
        }
        if (!query?.page) {
            query.page = 1;
        }
        const messages = await this.prismaRepository.message.findMany({
            where: {
                instanceId: this.instanceId,
                id: query?.where?.id,
                source: query?.where?.source,
                messageType: query?.where?.messageType,
                ...timestampFilter,
                AND: [
                    keyFilters?.id ? { key: { path: ['id'], equals: keyFilters?.id } } : {},
                    keyFilters?.fromMe ? { key: { path: ['fromMe'], equals: keyFilters?.fromMe } } : {},
                    keyFilters?.remoteJid ? { key: { path: ['remoteJid'], equals: keyFilters?.remoteJid } } : {},
                    keyFilters?.participants ? { key: { path: ['participants'], equals: keyFilters?.participants } } : {},
                ],
            },
            orderBy: {
                messageTimestamp: 'desc',
            },
            skip: query.offset * (query?.page === 1 ? 0 : query?.page - 1),
            take: query.offset,
            select: {
                id: true,
                key: true,
                pushName: true,
                messageType: true,
                message: true,
                messageTimestamp: true,
                instanceId: true,
                source: true,
                contextInfo: true,
                MessageUpdate: {
                    select: {
                        status: true,
                    },
                },
            },
        });
        return {
            messages: {
                total: count,
                pages: Math.ceil(count / query.offset),
                currentPage: query.page,
                records: messages,
            },
        };
    }
    async fetchStatusMessage(query) {
        if (!query?.offset) {
            query.offset = 50;
        }
        if (!query?.page) {
            query.page = 1;
        }
        return await this.prismaRepository.messageUpdate.findMany({
            where: {
                instanceId: this.instanceId,
                remoteJid: query.where?.remoteJid,
                keyId: query.where?.id,
            },
            skip: query.offset * (query?.page === 1 ? 0 : query?.page - 1),
            take: query.offset,
        });
    }
    async findChatByRemoteJid(remoteJid) {
        if (!remoteJid)
            return null;
        return await this.prismaRepository.chat.findFirst({
            where: {
                instanceId: this.instanceId,
                remoteJid: remoteJid,
            },
        });
    }
    async fetchChats(query) {
        const remoteJid = query?.where?.remoteJid
            ? query?.where?.remoteJid.includes('@')
                ? query.where?.remoteJid
                : (0, createJid_1.createJid)(query.where?.remoteJid)
            : null;
        const where = {
            instanceId: this.instanceId,
        };
        if (remoteJid) {
            where['remoteJid'] = remoteJid;
        }
        const timestampFilter = query?.where?.messageTimestamp?.gte && query?.where?.messageTimestamp?.lte
            ? client_1.Prisma.sql `
        AND "Message"."messageTimestamp" >= ${Math.floor(new Date(query.where.messageTimestamp.gte).getTime() / 1000)}
        AND "Message"."messageTimestamp" <= ${Math.floor(new Date(query.where.messageTimestamp.lte).getTime() / 1000)}`
            : client_1.Prisma.sql ``;
        const limit = query?.take ? client_1.Prisma.sql `LIMIT ${query.take}` : client_1.Prisma.sql ``;
        const offset = query?.skip ? client_1.Prisma.sql `OFFSET ${query.skip}` : client_1.Prisma.sql ``;
        const results = await this.prismaRepository.$queryRaw `
      WITH rankedMessages AS (
        SELECT DISTINCT ON ("Message"."key"->>'remoteJid') 
          "Contact"."id" as "contactId",
          "Message"."key"->>'remoteJid' as "remoteJid",
          CASE 
            WHEN "Message"."key"->>'remoteJid' LIKE '%@g.us' THEN COALESCE("Chat"."name", "Contact"."pushName")
            ELSE COALESCE("Contact"."pushName", "Message"."pushName")
          END as "pushName",
          "Contact"."profilePicUrl",
          COALESCE(
            to_timestamp("Message"."messageTimestamp"::double precision), 
            "Contact"."updatedAt"
          ) as "updatedAt",
          "Chat"."name" as "pushName",
          "Chat"."createdAt" as "windowStart",
          "Chat"."createdAt" + INTERVAL '24 hours' as "windowExpires",
          "Chat"."unreadMessages" as "unreadMessages",
          CASE WHEN "Chat"."createdAt" + INTERVAL '24 hours' > NOW() THEN true ELSE false END as "windowActive",
          "Message"."id" AS "lastMessageId",
          "Message"."key" AS "lastMessage_key",
          CASE
            WHEN "Message"."key"->>'fromMe' = 'true' THEN 'Você'
            ELSE "Message"."pushName"
          END AS "lastMessagePushName",
          "Message"."participant" AS "lastMessageParticipant",
          "Message"."messageType" AS "lastMessageMessageType",
          "Message"."message" AS "lastMessageMessage",
          "Message"."contextInfo" AS "lastMessageContextInfo",
          "Message"."source" AS "lastMessageSource",
          "Message"."messageTimestamp" AS "lastMessageMessageTimestamp",
          "Message"."instanceId" AS "lastMessageInstanceId",
          "Message"."sessionId" AS "lastMessageSessionId",
          "Message"."status" AS "lastMessageStatus"
        FROM "Message"
        LEFT JOIN "Contact" ON "Contact"."remoteJid" = "Message"."key"->>'remoteJid' AND "Contact"."instanceId" = "Message"."instanceId"
        LEFT JOIN "Chat" ON "Chat"."remoteJid" = "Message"."key"->>'remoteJid' AND "Chat"."instanceId" = "Message"."instanceId"
        WHERE "Message"."instanceId" = ${this.instanceId}
        ${remoteJid ? client_1.Prisma.sql `AND "Message"."key"->>'remoteJid' = ${remoteJid}` : client_1.Prisma.sql ``}
        ${timestampFilter}
        ORDER BY "Message"."key"->>'remoteJid', "Message"."messageTimestamp" DESC
      )
      SELECT * FROM rankedMessages 
      ORDER BY "updatedAt" DESC NULLS LAST
      ${limit}
      ${offset};
    `;
        if (results && (0, class_validator_1.isArray)(results) && results.length > 0) {
            const mappedResults = results.map((contact) => {
                const lastMessage = contact.lastMessageId
                    ? {
                        id: contact.lastMessageId,
                        key: contact.lastMessage_key,
                        pushName: contact.lastMessagePushName,
                        participant: contact.lastMessageParticipant,
                        messageType: contact.lastMessageMessageType,
                        message: contact.lastMessageMessage,
                        contextInfo: contact.lastMessageContextInfo,
                        source: contact.lastMessageSource,
                        messageTimestamp: contact.lastMessageMessageTimestamp,
                        instanceId: contact.lastMessageInstanceId,
                        sessionId: contact.lastMessageSessionId,
                        status: contact.lastMessageStatus,
                    }
                    : undefined;
                return {
                    id: contact.contactId || null,
                    remoteJid: contact.remoteJid,
                    pushName: contact.pushName,
                    profilePicUrl: contact.profilePicUrl,
                    updatedAt: contact.updatedAt,
                    windowStart: contact.windowStart,
                    windowExpires: contact.windowExpires,
                    windowActive: contact.windowActive,
                    lastMessage: lastMessage ? this.cleanMessageData(lastMessage) : undefined,
                    unreadCount: contact.unreadMessages,
                    isSaved: !!contact.contactId,
                };
            });
            return mappedResults;
        }
        return [];
    }
    hasValidMediaContent(message) {
        if (!message?.message)
            return false;
        const msg = message.message;
        if (Object.keys(msg).length === 1 && 'messageContextInfo' in msg) {
            return false;
        }
        const mediaTypes = [
            'imageMessage',
            'videoMessage',
            'stickerMessage',
            'documentMessage',
            'documentWithCaptionMessage',
            'ptvMessage',
            'audioMessage',
        ];
        return mediaTypes.some((type) => msg[type] && Object.keys(msg[type]).length > 0);
    }
}
exports.ChannelStartupService = ChannelStartupService;
