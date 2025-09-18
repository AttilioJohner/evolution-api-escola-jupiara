"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatwootService = void 0;
const postgres_client_1 = require("@api/integrations/chatbot/chatwoot/libs/postgres.client");
const chatwoot_import_helper_1 = require("@api/integrations/chatbot/chatwoot/utils/chatwoot-import-helper");
const wa_types_1 = require("@api/types/wa.types");
const logger_config_1 = require("@config/logger.config");
const chatwoot_sdk_1 = __importDefault(require("@figuro/chatwoot-sdk"));
const request_1 = require("@figuro/chatwoot-sdk/dist/core/request");
const i18n_1 = __importDefault(require("@utils/i18n"));
const sendTelemetry_1 = require("@utils/sendTelemetry");
const axios_1 = __importDefault(require("axios"));
const dayjs_1 = __importDefault(require("dayjs"));
const form_data_1 = __importDefault(require("form-data"));
const jimp_1 = __importDefault(require("jimp"));
const long_1 = __importDefault(require("long"));
const mime_types_1 = __importDefault(require("mime-types"));
const path_1 = __importDefault(require("path"));
const stream_1 = require("stream");
class ChatwootService {
    constructor(waMonitor, configService, prismaRepository, cache) {
        this.waMonitor = waMonitor;
        this.configService = configService;
        this.prismaRepository = prismaRepository;
        this.cache = cache;
        this.logger = new logger_config_1.Logger('ChatwootService');
        this.pgClient = postgres_client_1.postgresClient.getChatwootConnection();
    }
    async getProvider(instance) {
        const cacheKey = `${instance.instanceName}:getProvider`;
        if (await this.cache.has(cacheKey)) {
            const provider = (await this.cache.get(cacheKey));
            return provider;
        }
        const provider = await this.waMonitor.waInstances[instance.instanceName]?.findChatwoot();
        if (!provider) {
            this.logger.warn('provider not found');
            return null;
        }
        this.cache.set(cacheKey, provider);
        return provider;
    }
    async clientCw(instance) {
        const provider = await this.getProvider(instance);
        if (!provider) {
            this.logger.error('provider not found');
            return null;
        }
        this.provider = provider;
        const client = new chatwoot_sdk_1.default({
            config: this.getClientCwConfig(),
        });
        return client;
    }
    getClientCwConfig() {
        return {
            basePath: this.provider.url,
            with_credentials: true,
            credentials: 'include',
            token: this.provider.token,
            nameInbox: this.provider.nameInbox,
            mergeBrazilContacts: this.provider.mergeBrazilContacts,
        };
    }
    getCache() {
        return this.cache;
    }
    async create(instance, data) {
        await this.waMonitor.waInstances[instance.instanceName].setChatwoot(data);
        if (data.autoCreate) {
            this.logger.log('Auto create chatwoot instance');
            const urlServer = this.configService.get('SERVER').URL;
            await this.initInstanceChatwoot(instance, data.nameInbox ?? instance.instanceName.split('-cwId-')[0], `${urlServer}/chatwoot/webhook/${encodeURIComponent(instance.instanceName)}`, true, data.number, data.organization, data.logo);
        }
        return data;
    }
    async find(instance) {
        try {
            return await this.waMonitor.waInstances[instance.instanceName].findChatwoot();
        }
        catch (error) {
            this.logger.error('chatwoot not found');
            return { enabled: null, url: '' };
        }
    }
    async getContact(instance, id) {
        const client = await this.clientCw(instance);
        if (!client) {
            this.logger.warn('client not found');
            return null;
        }
        if (!id) {
            this.logger.warn('id is required');
            return null;
        }
        const contact = await client.contact.getContactable({
            accountId: this.provider.accountId,
            id,
        });
        if (!contact) {
            this.logger.warn('contact not found');
            return null;
        }
        return contact;
    }
    async initInstanceChatwoot(instance, inboxName, webhookUrl, qrcode, number, organization, logo) {
        const client = await this.clientCw(instance);
        if (!client) {
            this.logger.warn('client not found');
            return null;
        }
        const findInbox = await client.inboxes.list({
            accountId: this.provider.accountId,
        });
        const checkDuplicate = findInbox.payload.map((inbox) => inbox.name).includes(inboxName);
        let inboxId;
        this.logger.log('Creating chatwoot inbox');
        if (!checkDuplicate) {
            const data = {
                type: 'api',
                webhook_url: webhookUrl,
            };
            const inbox = await client.inboxes.create({
                accountId: this.provider.accountId,
                data: {
                    name: inboxName,
                    channel: data,
                },
            });
            if (!inbox) {
                this.logger.warn('inbox not found');
                return null;
            }
            inboxId = inbox.id;
        }
        else {
            const inbox = findInbox.payload.find((inbox) => inbox.name === inboxName);
            if (!inbox) {
                this.logger.warn('inbox not found');
                return null;
            }
            inboxId = inbox.id;
        }
        this.logger.log(`Inbox created - inboxId: ${inboxId}`);
        if (!this.configService.get('CHATWOOT').BOT_CONTACT) {
            this.logger.log('Chatwoot bot contact is disabled');
            return true;
        }
        this.logger.log('Creating chatwoot bot contact');
        const contact = (await this.findContact(instance, '123456')) ||
            (await this.createContact(instance, '123456', inboxId, false, organization ? organization : 'EvolutionAPI', logo ? logo : 'https://evolution-api.com/files/evolution-api-favicon.png'));
        if (!contact) {
            this.logger.warn('contact not found');
            return null;
        }
        const contactId = contact.id || contact.payload.contact.id;
        this.logger.log(`Contact created - contactId: ${contactId}`);
        if (qrcode) {
            this.logger.log('QR code enabled');
            const data = {
                contact_id: contactId.toString(),
                inbox_id: inboxId.toString(),
            };
            const conversation = await client.conversations.create({
                accountId: this.provider.accountId,
                data,
            });
            if (!conversation) {
                this.logger.warn('conversation not found');
                return null;
            }
            let contentMsg = 'init';
            if (number) {
                contentMsg = `init:${number}`;
            }
            const message = await client.messages.create({
                accountId: this.provider.accountId,
                conversationId: conversation.id,
                data: {
                    content: contentMsg,
                    message_type: 'outgoing',
                },
            });
            if (!message) {
                this.logger.warn('conversation not found');
                return null;
            }
            this.logger.log('Init message sent');
        }
        return true;
    }
    async createContact(instance, phoneNumber, inboxId, isGroup, name, avatar_url, jid) {
        try {
            const client = await this.clientCw(instance);
            if (!client) {
                this.logger.warn('client not found');
                return null;
            }
            let data = {};
            if (!isGroup) {
                data = {
                    inbox_id: inboxId,
                    name: name || phoneNumber,
                    identifier: jid,
                    avatar_url: avatar_url,
                };
                if ((jid && jid.includes('@')) || !jid) {
                    data['phone_number'] = `+${phoneNumber}`;
                }
            }
            else {
                data = {
                    inbox_id: inboxId,
                    name: name || phoneNumber,
                    identifier: phoneNumber,
                    avatar_url: avatar_url,
                };
            }
            const contact = await client.contacts.create({
                accountId: this.provider.accountId,
                data,
            });
            if (!contact) {
                this.logger.warn('contact not found');
                return null;
            }
            const findContact = await this.findContact(instance, phoneNumber);
            const contactId = findContact?.id;
            await this.addLabelToContact(this.provider.nameInbox, contactId);
            return contact;
        }
        catch (error) {
            this.logger.error('Error creating contact');
            console.log(error);
            return null;
        }
    }
    async updateContact(instance, id, data) {
        const client = await this.clientCw(instance);
        if (!client) {
            this.logger.warn('client not found');
            return null;
        }
        if (!id) {
            this.logger.warn('id is required');
            return null;
        }
        try {
            const contact = await client.contacts.update({
                accountId: this.provider.accountId,
                id,
                data,
            });
            return contact;
        }
        catch (error) {
            return null;
        }
    }
    async addLabelToContact(nameInbox, contactId) {
        try {
            const uri = this.configService.get('CHATWOOT').IMPORT.DATABASE.CONNECTION.URI;
            if (!uri)
                return false;
            const sqlTags = `SELECT id, taggings_count FROM tags WHERE name = $1 LIMIT 1`;
            const tagData = (await this.pgClient.query(sqlTags, [nameInbox]))?.rows[0];
            let tagId = tagData?.id;
            const taggingsCount = tagData?.taggings_count || 0;
            const sqlTag = `INSERT INTO tags (name, taggings_count) 
                      VALUES ($1, $2) 
                      ON CONFLICT (name) 
                      DO UPDATE SET taggings_count = tags.taggings_count + 1 
                      RETURNING id`;
            tagId = (await this.pgClient.query(sqlTag, [nameInbox, taggingsCount + 1]))?.rows[0]?.id;
            const sqlCheckTagging = `SELECT 1 FROM taggings 
                               WHERE tag_id = $1 AND taggable_type = 'Contact' AND taggable_id = $2 AND context = 'labels' LIMIT 1`;
            const taggingExists = (await this.pgClient.query(sqlCheckTagging, [tagId, contactId]))?.rowCount > 0;
            if (!taggingExists) {
                const sqlInsertLabel = `INSERT INTO taggings (tag_id, taggable_type, taggable_id, context, created_at) 
                                VALUES ($1, 'Contact', $2, 'labels', NOW())`;
                await this.pgClient.query(sqlInsertLabel, [tagId, contactId]);
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async findContact(instance, phoneNumber) {
        const client = await this.clientCw(instance);
        if (!client) {
            this.logger.warn('client not found');
            return null;
        }
        let query;
        const isGroup = phoneNumber.includes('@g.us');
        if (!isGroup) {
            query = `+${phoneNumber}`;
        }
        else {
            query = phoneNumber;
        }
        let contact;
        if (isGroup) {
            contact = await client.contacts.search({
                accountId: this.provider.accountId,
                q: query,
            });
        }
        else {
            contact = await (0, request_1.request)(this.getClientCwConfig(), {
                method: 'POST',
                url: `/api/v1/accounts/${this.provider.accountId}/contacts/filter`,
                body: {
                    payload: this.getFilterPayload(query),
                },
            });
        }
        if (!contact && contact?.payload?.length === 0) {
            this.logger.warn('contact not found');
            return null;
        }
        if (!isGroup) {
            return contact.payload.length > 1 ? this.findContactInContactList(contact.payload, query) : contact.payload[0];
        }
        else {
            return contact.payload.find((contact) => contact.identifier === query);
        }
    }
    async mergeContacts(baseId, mergeId) {
        try {
            const contact = await (0, request_1.request)(this.getClientCwConfig(), {
                method: 'POST',
                url: `/api/v1/accounts/${this.provider.accountId}/actions/contact_merge`,
                body: {
                    base_contact_id: baseId,
                    mergee_contact_id: mergeId,
                },
            });
            return contact;
        }
        catch {
            this.logger.error('Error merging contacts');
            return null;
        }
    }
    async mergeBrazilianContacts(contacts) {
        try {
            const contact = await (0, request_1.request)(this.getClientCwConfig(), {
                method: 'POST',
                url: `/api/v1/accounts/${this.provider.accountId}/actions/contact_merge`,
                body: {
                    base_contact_id: contacts.find((contact) => contact.phone_number.length === 14)?.id,
                    mergee_contact_id: contacts.find((contact) => contact.phone_number.length === 13)?.id,
                },
            });
            return contact;
        }
        catch {
            this.logger.error('Error merging contacts');
            return null;
        }
    }
    findContactInContactList(contacts, query) {
        const phoneNumbers = this.getNumbers(query);
        const searchableFields = this.getSearchableFields();
        if (contacts.length === 2 && this.getClientCwConfig().mergeBrazilContacts && query.startsWith('+55')) {
            const contact = this.mergeBrazilianContacts(contacts);
            if (contact) {
                return contact;
            }
        }
        const phone = phoneNumbers.reduce((savedNumber, number) => (number.length > savedNumber.length ? number : savedNumber), '');
        const contact_with9 = contacts.find((contact) => contact.phone_number === phone);
        if (contact_with9) {
            return contact_with9;
        }
        for (const contact of contacts) {
            for (const field of searchableFields) {
                if (contact[field] && phoneNumbers.includes(contact[field])) {
                    return contact;
                }
            }
        }
        return null;
    }
    getNumbers(query) {
        const numbers = [];
        numbers.push(query);
        if (query.startsWith('+55') && query.length === 14) {
            const withoutNine = query.slice(0, 5) + query.slice(6);
            numbers.push(withoutNine);
        }
        else if (query.startsWith('+55') && query.length === 13) {
            const withNine = query.slice(0, 5) + '9' + query.slice(5);
            numbers.push(withNine);
        }
        return numbers;
    }
    getSearchableFields() {
        return ['phone_number'];
    }
    getFilterPayload(query) {
        const filterPayload = [];
        const numbers = this.getNumbers(query);
        const fieldsToSearch = this.getSearchableFields();
        fieldsToSearch.forEach((field, index1) => {
            numbers.forEach((number, index2) => {
                const queryOperator = fieldsToSearch.length - 1 === index1 && numbers.length - 1 === index2 ? null : 'OR';
                filterPayload.push({
                    attribute_key: field,
                    filter_operator: 'equal_to',
                    values: [number.replace('+', '')],
                    query_operator: queryOperator,
                });
            });
        });
        return filterPayload;
    }
    async createConversation(instance, body) {
        if (!body?.key) {
            this.logger.warn(`body.key is null or undefined in createConversation. Full body object: ${JSON.stringify(body)}`);
            return null;
        }
        const isLid = body.key.previousRemoteJid?.includes('@lid') && body.key.participant;
        const remoteJid = body.key.remoteJid;
        const cacheKey = `${instance.instanceName}:createConversation-${remoteJid}`;
        const lockKey = `${instance.instanceName}:lock:createConversation-${remoteJid}`;
        const maxWaitTime = 5000;
        try {
            if (isLid && body.key.participant !== body.key.previousRemoteJid) {
                const contact = await this.findContact(instance, body.key.remoteJid.split('@')[0]);
                if (contact && contact.identifier !== body.key.participant) {
                    this.logger.verbose(`Identifier needs update: (contact.identifier: ${contact.identifier}, body.key.remoteJid: ${body.key.remoteJid}, body.key.participant: ${body.key.participant}`);
                    const updateContact = await this.updateContact(instance, contact.id, {
                        identifier: body.key.participant,
                        phone_number: `+${body.key.participant.split('@')[0]}`,
                    });
                    if (updateContact === null) {
                        const baseContact = await this.findContact(instance, body.key.participant.split('@')[0]);
                        if (baseContact) {
                            await this.mergeContacts(baseContact.id, contact.id);
                            this.logger.verbose(`Merge contacts: (${baseContact.id}) ${baseContact.phone_number} and (${contact.id}) ${contact.phone_number}`);
                        }
                    }
                }
            }
            this.logger.verbose(`--- Start createConversation ---`);
            this.logger.verbose(`Instance: ${JSON.stringify(instance)}`);
            if (await this.cache.has(cacheKey)) {
                const conversationId = (await this.cache.get(cacheKey));
                this.logger.verbose(`Found conversation to: ${remoteJid}, conversation ID: ${conversationId}`);
                return conversationId;
            }
            if (await this.cache.has(lockKey)) {
                this.logger.verbose(`Operação de criação já em andamento para ${remoteJid}, aguardando resultado...`);
                const start = Date.now();
                while (await this.cache.has(lockKey)) {
                    if (Date.now() - start > maxWaitTime) {
                        this.logger.warn(`Timeout aguardando lock para ${remoteJid}`);
                        break;
                    }
                    await new Promise((res) => setTimeout(res, 300));
                    if (await this.cache.has(cacheKey)) {
                        const conversationId = (await this.cache.get(cacheKey));
                        this.logger.verbose(`Resolves creation of: ${remoteJid}, conversation ID: ${conversationId}`);
                        return conversationId;
                    }
                }
            }
            await this.cache.set(lockKey, true, 30);
            this.logger.verbose(`Bloqueio adquirido para: ${lockKey}`);
            try {
                if (await this.cache.has(cacheKey)) {
                    return (await this.cache.get(cacheKey));
                }
                const client = await this.clientCw(instance);
                if (!client)
                    return null;
                const isGroup = remoteJid.includes('@g.us');
                const chatId = isGroup ? remoteJid : remoteJid.split('@')[0];
                let nameContact = !body.key.fromMe ? body.pushName : chatId;
                const filterInbox = await this.getInbox(instance);
                if (!filterInbox)
                    return null;
                if (isGroup) {
                    this.logger.verbose(`Processing group conversation`);
                    const group = await this.waMonitor.waInstances[instance.instanceName].client.groupMetadata(chatId);
                    this.logger.verbose(`Group metadata: ${JSON.stringify(group)}`);
                    nameContact = `${group.subject} (GROUP)`;
                    const picture_url = await this.waMonitor.waInstances[instance.instanceName].profilePicture(body.key.participant.split('@')[0]);
                    this.logger.verbose(`Participant profile picture URL: ${JSON.stringify(picture_url)}`);
                    const findParticipant = await this.findContact(instance, body.key.participant.split('@')[0]);
                    this.logger.verbose(`Found participant: ${JSON.stringify(findParticipant)}`);
                    if (findParticipant) {
                        if (!findParticipant.name || findParticipant.name === chatId) {
                            await this.updateContact(instance, findParticipant.id, {
                                name: body.pushName,
                                avatar_url: picture_url.profilePictureUrl || null,
                            });
                        }
                    }
                    else {
                        await this.createContact(instance, body.key.participant.split('@')[0], filterInbox.id, false, body.pushName, picture_url.profilePictureUrl || null, body.key.participant);
                    }
                }
                const picture_url = await this.waMonitor.waInstances[instance.instanceName].profilePicture(chatId);
                this.logger.verbose(`Contact profile picture URL: ${JSON.stringify(picture_url)}`);
                let contact = await this.findContact(instance, chatId);
                if (contact) {
                    this.logger.verbose(`Found contact: ${JSON.stringify(contact)}`);
                    if (!body.key.fromMe) {
                        const waProfilePictureFile = picture_url?.profilePictureUrl?.split('#')[0].split('?')[0].split('/').pop() || '';
                        const chatwootProfilePictureFile = contact?.thumbnail?.split('#')[0].split('?')[0].split('/').pop() || '';
                        const pictureNeedsUpdate = waProfilePictureFile !== chatwootProfilePictureFile;
                        const nameNeedsUpdate = !contact.name ||
                            contact.name === chatId ||
                            (`+${chatId}`.startsWith('+55')
                                ? this.getNumbers(`+${chatId}`).some((v) => contact.name === v || contact.name === v.substring(3) || contact.name === v.substring(1))
                                : false);
                        this.logger.verbose(`Picture needs update: ${pictureNeedsUpdate}`);
                        this.logger.verbose(`Name needs update: ${nameNeedsUpdate}`);
                        if (pictureNeedsUpdate || nameNeedsUpdate) {
                            contact = await this.updateContact(instance, contact.id, {
                                ...(nameNeedsUpdate && { name: nameContact }),
                                ...(waProfilePictureFile === '' && { avatar: null }),
                                ...(pictureNeedsUpdate && { avatar_url: picture_url?.profilePictureUrl }),
                            });
                        }
                    }
                }
                else {
                    contact = await this.createContact(instance, chatId, filterInbox.id, isGroup, nameContact, picture_url.profilePictureUrl || null, remoteJid);
                }
                if (!contact) {
                    this.logger.warn(`Contact not created or found`);
                    return null;
                }
                const contactId = contact?.payload?.id || contact?.payload?.contact?.id || contact?.id;
                this.logger.verbose(`Contact ID: ${contactId}`);
                const contactConversations = (await client.contacts.listConversations({
                    accountId: this.provider.accountId,
                    id: contactId,
                }));
                this.logger.verbose(`Contact conversations: ${JSON.stringify(contactConversations)}`);
                if (!contactConversations || !contactConversations.payload) {
                    this.logger.error(`No conversations found or payload is undefined`);
                    return null;
                }
                let inboxConversation = contactConversations.payload.find((conversation) => conversation.inbox_id == filterInbox.id);
                if (inboxConversation) {
                    if (this.provider.reopenConversation) {
                        this.logger.verbose(`Found conversation in reopenConversation mode: ${JSON.stringify(inboxConversation)}`);
                        if (inboxConversation && this.provider.conversationPending && inboxConversation.status !== 'open') {
                            await client.conversations.toggleStatus({
                                accountId: this.provider.accountId,
                                conversationId: inboxConversation.id,
                                data: {
                                    status: 'pending',
                                },
                            });
                        }
                    }
                    else {
                        inboxConversation = contactConversations.payload.find((conversation) => conversation && conversation.status !== 'resolved' && conversation.inbox_id == filterInbox.id);
                        this.logger.verbose(`Found conversation: ${JSON.stringify(inboxConversation)}`);
                    }
                    if (inboxConversation) {
                        this.logger.verbose(`Returning existing conversation ID: ${inboxConversation.id}`);
                        this.cache.set(cacheKey, inboxConversation.id);
                        return inboxConversation.id;
                    }
                }
                const data = {
                    contact_id: contactId.toString(),
                    inbox_id: filterInbox.id.toString(),
                };
                if (this.provider.conversationPending) {
                    data['status'] = 'pending';
                }
                if (await this.cache.has(cacheKey)) {
                    return (await this.cache.get(cacheKey));
                }
                const conversation = await client.conversations.create({
                    accountId: this.provider.accountId,
                    data,
                });
                if (!conversation) {
                    this.logger.warn(`Conversation not created or found`);
                    return null;
                }
                this.logger.verbose(`New conversation created of ${remoteJid} with ID: ${conversation.id}`);
                this.cache.set(cacheKey, conversation.id);
                return conversation.id;
            }
            finally {
                await this.cache.delete(lockKey);
                this.logger.verbose(`Block released for: ${lockKey}`);
            }
        }
        catch (error) {
            this.logger.error(`Error in createConversation: ${error}`);
            return null;
        }
    }
    async getInbox(instance) {
        const cacheKey = `${instance.instanceName}:getInbox`;
        if (await this.cache.has(cacheKey)) {
            return (await this.cache.get(cacheKey));
        }
        const client = await this.clientCw(instance);
        if (!client) {
            this.logger.warn('client not found');
            return null;
        }
        const inbox = (await client.inboxes.list({
            accountId: this.provider.accountId,
        }));
        if (!inbox) {
            this.logger.warn('inbox not found');
            return null;
        }
        const findByName = inbox.payload.find((inbox) => inbox.name === this.getClientCwConfig().nameInbox);
        if (!findByName) {
            this.logger.warn('inbox not found');
            return null;
        }
        this.cache.set(cacheKey, findByName);
        return findByName;
    }
    async createMessage(instance, conversationId, content, messageType, privateMessage, attachments, messageBody, sourceId, quotedMsg) {
        const client = await this.clientCw(instance);
        if (!client) {
            this.logger.warn('client not found');
            return null;
        }
        const replyToIds = await this.getReplyToIds(messageBody, instance);
        const sourceReplyId = quotedMsg?.chatwootMessageId || null;
        const message = await client.messages.create({
            accountId: this.provider.accountId,
            conversationId: conversationId,
            data: {
                content: content,
                message_type: messageType,
                attachments: attachments,
                private: privateMessage || false,
                source_id: sourceId,
                content_attributes: {
                    ...replyToIds,
                },
                source_reply_id: sourceReplyId ? sourceReplyId.toString() : null,
            },
        });
        if (!message) {
            this.logger.warn('message not found');
            return null;
        }
        return message;
    }
    async getOpenConversationByContact(instance, inbox, contact) {
        const client = await this.clientCw(instance);
        if (!client) {
            this.logger.warn('client not found');
            return null;
        }
        const conversations = (await client.contacts.listConversations({
            accountId: this.provider.accountId,
            id: contact.id,
        }));
        return (conversations.payload.find((conversation) => conversation.inbox_id === inbox.id && conversation.status === 'open') || undefined);
    }
    async createBotMessage(instance, content, messageType, attachments) {
        const client = await this.clientCw(instance);
        if (!client) {
            this.logger.warn('client not found');
            return null;
        }
        const contact = await this.findContact(instance, '123456');
        if (!contact) {
            this.logger.warn('contact not found');
            return null;
        }
        const filterInbox = await this.getInbox(instance);
        if (!filterInbox) {
            this.logger.warn('inbox not found');
            return null;
        }
        const conversation = await this.getOpenConversationByContact(instance, filterInbox, contact);
        if (!conversation) {
            this.logger.warn('conversation not found');
            return;
        }
        const message = await client.messages.create({
            accountId: this.provider.accountId,
            conversationId: conversation.id,
            data: {
                content: content,
                message_type: messageType,
                attachments: attachments,
            },
        });
        if (!message) {
            this.logger.warn('message not found');
            return null;
        }
        return message;
    }
    async sendData(conversationId, fileStream, fileName, messageType, content, instance, messageBody, sourceId, quotedMsg) {
        if (sourceId && this.isImportHistoryAvailable()) {
            const messageAlreadySaved = await chatwoot_import_helper_1.chatwootImport.getExistingSourceIds([sourceId], conversationId);
            if (messageAlreadySaved) {
                if (messageAlreadySaved.size > 0) {
                    this.logger.warn('Message already saved on chatwoot');
                    return null;
                }
            }
        }
        const data = new form_data_1.default();
        if (content) {
            data.append('content', content);
        }
        data.append('message_type', messageType);
        data.append('attachments[]', fileStream, { filename: fileName });
        const sourceReplyId = quotedMsg?.chatwootMessageId || null;
        if (messageBody && instance) {
            const replyToIds = await this.getReplyToIds(messageBody, instance);
            if (replyToIds.in_reply_to || replyToIds.in_reply_to_external_id) {
                const content = JSON.stringify({
                    ...replyToIds,
                });
                data.append('content_attributes', content);
            }
        }
        if (sourceReplyId) {
            data.append('source_reply_id', sourceReplyId.toString());
        }
        if (sourceId) {
            data.append('source_id', sourceId);
        }
        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${this.provider.url}/api/v1/accounts/${this.provider.accountId}/conversations/${conversationId}/messages`,
            headers: {
                api_access_token: this.provider.token,
                ...data.getHeaders(),
            },
            data: data,
        };
        try {
            const { data } = await axios_1.default.request(config);
            return data;
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async createBotQr(instance, content, messageType, fileStream, fileName) {
        const client = await this.clientCw(instance);
        if (!client) {
            this.logger.warn('client not found');
            return null;
        }
        if (!this.configService.get('CHATWOOT').BOT_CONTACT) {
            this.logger.log('Chatwoot bot contact is disabled');
            return true;
        }
        const contact = await this.findContact(instance, '123456');
        if (!contact) {
            this.logger.warn('contact not found');
            return null;
        }
        const filterInbox = await this.getInbox(instance);
        if (!filterInbox) {
            this.logger.warn('inbox not found');
            return null;
        }
        const conversation = await this.getOpenConversationByContact(instance, filterInbox, contact);
        if (!conversation) {
            this.logger.warn('conversation not found');
            return;
        }
        const data = new form_data_1.default();
        if (content) {
            data.append('content', content);
        }
        data.append('message_type', messageType);
        if (fileStream && fileName) {
            data.append('attachments[]', fileStream, { filename: fileName });
        }
        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${this.provider.url}/api/v1/accounts/${this.provider.accountId}/conversations/${conversation.id}/messages`,
            headers: {
                api_access_token: this.provider.token,
                ...data.getHeaders(),
            },
            data: data,
        };
        try {
            const { data } = await axios_1.default.request(config);
            return data;
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async sendAttachment(waInstance, number, media, caption, options) {
        try {
            const parsedMedia = path_1.default.parse(decodeURIComponent(media));
            let mimeType = mime_types_1.default.lookup(parsedMedia?.ext) || '';
            let fileName = parsedMedia?.name + parsedMedia?.ext;
            if (!mimeType) {
                const parts = media.split('/');
                fileName = decodeURIComponent(parts[parts.length - 1]);
                const response = await axios_1.default.get(media, {
                    responseType: 'arraybuffer',
                });
                mimeType = response.headers['content-type'];
            }
            let type = 'document';
            switch (mimeType.split('/')[0]) {
                case 'image':
                    type = 'image';
                    break;
                case 'video':
                    type = 'video';
                    break;
                case 'audio':
                    type = 'audio';
                    break;
                default:
                    type = 'document';
                    break;
            }
            if (type === 'audio') {
                const data = {
                    number: number,
                    audio: media,
                    delay: 1200,
                    quoted: options?.quoted,
                };
                (0, sendTelemetry_1.sendTelemetry)('/message/sendWhatsAppAudio');
                const messageSent = await waInstance?.audioWhatsapp(data, null, true);
                return messageSent;
            }
            const documentExtensions = ['.gif', '.svg', '.tiff', '.tif'];
            if (type === 'image' && parsedMedia && documentExtensions.includes(parsedMedia?.ext)) {
                type = 'document';
            }
            const data = {
                number: number,
                mediatype: type,
                fileName: fileName,
                media: media,
                delay: 1200,
                quoted: options?.quoted,
            };
            (0, sendTelemetry_1.sendTelemetry)('/message/sendMedia');
            if (caption) {
                data.caption = caption;
            }
            const messageSent = await waInstance?.mediaMessage(data, null, true);
            return messageSent;
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    async onSendMessageError(instance, conversation, error) {
        this.logger.verbose(`onSendMessageError ${JSON.stringify(error)}`);
        const client = await this.clientCw(instance);
        if (!client) {
            return;
        }
        if (error && error?.status === 400 && error?.message[0]?.exists === false) {
            client.messages.create({
                accountId: this.provider.accountId,
                conversationId: conversation,
                data: {
                    content: `${i18n_1.default.t('cw.message.numbernotinwhatsapp')}`,
                    message_type: 'outgoing',
                    private: true,
                },
            });
            return;
        }
        client.messages.create({
            accountId: this.provider.accountId,
            conversationId: conversation,
            data: {
                content: i18n_1.default.t('cw.message.notsent', {
                    error: error ? `_${error instanceof Error ? error.message : String(error)}_` : '',
                }),
                message_type: 'outgoing',
                private: true,
            },
        });
    }
    async receiveWebhook(instance, body) {
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            const client = await this.clientCw(instance);
            if (!client) {
                this.logger.warn('client not found');
                return null;
            }
            if (this.provider.reopenConversation === false &&
                body.event === 'conversation_status_changed' &&
                body.status === 'resolved' &&
                body.meta?.sender?.identifier) {
                const keyToDelete = `${instance.instanceName}:createConversation-${body.meta.sender.identifier}`;
                this.cache.delete(keyToDelete);
            }
            if (!body?.conversation ||
                body.private ||
                (body.event === 'message_updated' && !body.content_attributes?.deleted)) {
                return { message: 'bot' };
            }
            const chatId = body.conversation.meta.sender?.identifier || body.conversation.meta.sender?.phone_number.replace('+', '');
            const messageReceived = body.content
                ? body.content
                    .replaceAll(/(?<!\*)\*((?!\s)([^\n*]+?)(?<!\s))\*(?!\*)/g, '_$1_')
                    .replaceAll(/\*{2}((?!\s)([^\n*]+?)(?<!\s))\*{2}/g, '*$1*')
                    .replaceAll(/~{2}((?!\s)([^\n*]+?)(?<!\s))~{2}/g, '~$1~')
                    .replaceAll(/(?<!`)`((?!\s)([^`*]+?)(?<!\s))`(?!`)/g, '```$1```')
                : body.content;
            const senderName = body?.conversation?.messages[0]?.sender?.available_name || body?.sender?.name;
            const waInstance = this.waMonitor.waInstances[instance.instanceName];
            if (body.event === 'message_updated' && body.content_attributes?.deleted) {
                const message = await this.prismaRepository.message.findFirst({
                    where: {
                        chatwootMessageId: body.id,
                        instanceId: instance.instanceId,
                    },
                });
                if (message) {
                    const key = message.key;
                    await waInstance?.client.sendMessage(key.remoteJid, { delete: key });
                    await this.prismaRepository.message.deleteMany({
                        where: {
                            instanceId: instance.instanceId,
                            chatwootMessageId: body.id,
                        },
                    });
                }
                return { message: 'bot' };
            }
            const cwBotContact = this.configService.get('CHATWOOT').BOT_CONTACT;
            if (chatId === '123456' && body.message_type === 'outgoing') {
                const command = messageReceived.replace('/', '');
                if (cwBotContact && (command.includes('init') || command.includes('iniciar'))) {
                    const state = waInstance?.connectionStatus?.state;
                    if (state !== 'open') {
                        const number = command.split(':')[1];
                        await waInstance.connectToWhatsapp(number);
                    }
                    else {
                        await this.createBotMessage(instance, i18n_1.default.t('cw.inbox.alreadyConnected', {
                            inboxName: body.inbox.name,
                        }), 'incoming');
                    }
                }
                if (command === 'clearcache') {
                    waInstance.clearCacheChatwoot();
                    await this.createBotMessage(instance, i18n_1.default.t('cw.inbox.clearCache', {
                        inboxName: body.inbox.name,
                    }), 'incoming');
                }
                if (command === 'status') {
                    const state = waInstance?.connectionStatus?.state;
                    if (!state) {
                        await this.createBotMessage(instance, i18n_1.default.t('cw.inbox.notFound', {
                            inboxName: body.inbox.name,
                        }), 'incoming');
                    }
                    if (state) {
                        await this.createBotMessage(instance, i18n_1.default.t('cw.inbox.status', {
                            inboxName: body.inbox.name,
                            state: state,
                        }), 'incoming');
                    }
                }
                if (cwBotContact && (command === 'disconnect' || command === 'desconectar')) {
                    const msgLogout = i18n_1.default.t('cw.inbox.disconnect', {
                        inboxName: body.inbox.name,
                    });
                    await this.createBotMessage(instance, msgLogout, 'incoming');
                    await waInstance?.client?.logout('Log out instance: ' + instance.instanceName);
                    await waInstance?.client?.ws?.close();
                }
            }
            if (body.message_type === 'outgoing' && body?.conversation?.messages?.length && chatId !== '123456') {
                if (body?.conversation?.messages[0]?.source_id?.substring(0, 5) === 'WAID:') {
                    return { message: 'bot' };
                }
                if (!waInstance && body.conversation?.id) {
                    this.onSendMessageError(instance, body.conversation?.id, 'Instance not found');
                    return { message: 'bot' };
                }
                let formatText;
                if (senderName === null || senderName === undefined) {
                    formatText = messageReceived;
                }
                else {
                    const formattedDelimiter = this.provider.signDelimiter
                        ? this.provider.signDelimiter.replaceAll('\\n', '\n')
                        : '\n';
                    const textToConcat = this.provider.signMsg ? [`*${senderName}:*`] : [];
                    textToConcat.push(messageReceived);
                    formatText = textToConcat.join(formattedDelimiter);
                }
                for (const message of body.conversation.messages) {
                    if (message.attachments && message.attachments.length > 0) {
                        for (const attachment of message.attachments) {
                            if (!messageReceived) {
                                formatText = null;
                            }
                            const options = {
                                quoted: await this.getQuotedMessage(body, instance),
                            };
                            const messageSent = await this.sendAttachment(waInstance, chatId, attachment.data_url, formatText, options);
                            if (!messageSent && body.conversation?.id) {
                                this.onSendMessageError(instance, body.conversation?.id);
                            }
                            await this.updateChatwootMessageId({
                                ...messageSent,
                                owner: instance.instanceName,
                            }, {
                                messageId: body.id,
                                inboxId: body.inbox?.id,
                                conversationId: body.conversation?.id,
                                contactInboxSourceId: body.conversation?.contact_inbox?.source_id,
                            }, instance);
                        }
                    }
                    else {
                        const data = {
                            number: chatId,
                            text: formatText,
                            delay: 1200,
                            quoted: await this.getQuotedMessage(body, instance),
                        };
                        (0, sendTelemetry_1.sendTelemetry)('/message/sendText');
                        let messageSent;
                        try {
                            messageSent = await waInstance?.textMessage(data, true);
                            if (!messageSent) {
                                throw new Error('Message not sent');
                            }
                            if (long_1.default.isLong(messageSent?.messageTimestamp)) {
                                messageSent.messageTimestamp = messageSent.messageTimestamp?.toNumber();
                            }
                            await this.updateChatwootMessageId({
                                ...messageSent,
                                instanceId: instance.instanceId,
                            }, {
                                messageId: body.id,
                                inboxId: body.inbox?.id,
                                conversationId: body.conversation?.id,
                                contactInboxSourceId: body.conversation?.contact_inbox?.source_id,
                            }, instance);
                        }
                        catch (error) {
                            if (!messageSent && body.conversation?.id) {
                                this.onSendMessageError(instance, body.conversation?.id, error);
                            }
                            throw error;
                        }
                    }
                }
                const chatwootRead = this.configService.get('CHATWOOT').MESSAGE_READ;
                if (chatwootRead) {
                    const lastMessage = await this.prismaRepository.message.findFirst({
                        where: {
                            key: {
                                path: ['fromMe'],
                                equals: false,
                            },
                            instanceId: instance.instanceId,
                        },
                    });
                    if (lastMessage && !lastMessage.chatwootIsRead) {
                        const key = lastMessage.key;
                        waInstance?.markMessageAsRead({
                            readMessages: [
                                {
                                    id: key.id,
                                    fromMe: key.fromMe,
                                    remoteJid: key.remoteJid,
                                },
                            ],
                        });
                        const updateMessage = {
                            chatwootMessageId: lastMessage.chatwootMessageId,
                            chatwootConversationId: lastMessage.chatwootConversationId,
                            chatwootInboxId: lastMessage.chatwootInboxId,
                            chatwootContactInboxSourceId: lastMessage.chatwootContactInboxSourceId,
                            chatwootIsRead: true,
                        };
                        await this.prismaRepository.message.updateMany({
                            where: {
                                instanceId: instance.instanceId,
                                key: {
                                    path: ['id'],
                                    equals: key.id,
                                },
                            },
                            data: updateMessage,
                        });
                    }
                }
            }
            if (body.message_type === 'template' && body.event === 'message_created') {
                const data = {
                    number: chatId,
                    text: body.content.replace(/\\\r\n|\\\n|\n/g, '\n'),
                    delay: 1200,
                };
                (0, sendTelemetry_1.sendTelemetry)('/message/sendText');
                await waInstance?.textMessage(data);
            }
            return { message: 'bot' };
        }
        catch (error) {
            this.logger.error(error);
            return { message: 'bot' };
        }
    }
    async updateChatwootMessageId(message, chatwootMessageIds, instance) {
        const key = message.key;
        if (!chatwootMessageIds.messageId || !key?.id) {
            return;
        }
        await this.prismaRepository.message.updateMany({
            where: {
                key: {
                    path: ['id'],
                    equals: key.id,
                },
                instanceId: instance.instanceId,
            },
            data: {
                chatwootMessageId: chatwootMessageIds.messageId,
                chatwootConversationId: chatwootMessageIds.conversationId,
                chatwootInboxId: chatwootMessageIds.inboxId,
                chatwootContactInboxSourceId: chatwootMessageIds.contactInboxSourceId,
                chatwootIsRead: chatwootMessageIds.isRead,
            },
        });
        if (this.isImportHistoryAvailable()) {
            chatwoot_import_helper_1.chatwootImport.updateMessageSourceID(chatwootMessageIds.messageId, key.id);
        }
    }
    async getMessageByKeyId(instance, keyId) {
        const messages = await this.prismaRepository.message.findFirst({
            where: {
                key: {
                    path: ['id'],
                    equals: keyId,
                },
                instanceId: instance.instanceId,
            },
        });
        return messages || null;
    }
    async getReplyToIds(msg, instance) {
        let inReplyTo = null;
        let inReplyToExternalId = null;
        if (msg) {
            inReplyToExternalId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId ?? msg.contextInfo?.stanzaId;
            if (inReplyToExternalId) {
                const message = await this.getMessageByKeyId(instance, inReplyToExternalId);
                if (message?.chatwootMessageId) {
                    inReplyTo = message.chatwootMessageId;
                }
            }
        }
        return {
            in_reply_to: inReplyTo,
            in_reply_to_external_id: inReplyToExternalId,
        };
    }
    async getQuotedMessage(msg, instance) {
        if (msg?.content_attributes?.in_reply_to) {
            const message = await this.prismaRepository.message.findFirst({
                where: {
                    chatwootMessageId: msg?.content_attributes?.in_reply_to,
                    instanceId: instance.instanceId,
                },
            });
            const key = message?.key;
            if (message && key?.id) {
                return {
                    key: message.key,
                    message: message.message,
                };
            }
        }
        return null;
    }
    isMediaMessage(message) {
        const media = [
            'imageMessage',
            'documentMessage',
            'documentWithCaptionMessage',
            'audioMessage',
            'videoMessage',
            'stickerMessage',
            'viewOnceMessageV2',
        ];
        const messageKeys = Object.keys(message);
        const result = messageKeys.some((key) => media.includes(key));
        return result;
    }
    getAdsMessage(msg) {
        const adsMessage = {
            title: msg.extendedTextMessage?.contextInfo?.externalAdReply?.title || msg.contextInfo?.externalAdReply?.title,
            body: msg.extendedTextMessage?.contextInfo?.externalAdReply?.body || msg.contextInfo?.externalAdReply?.body,
            thumbnailUrl: msg.extendedTextMessage?.contextInfo?.externalAdReply?.thumbnailUrl ||
                msg.contextInfo?.externalAdReply?.thumbnailUrl,
            sourceUrl: msg.extendedTextMessage?.contextInfo?.externalAdReply?.sourceUrl || msg.contextInfo?.externalAdReply?.sourceUrl,
        };
        return adsMessage;
    }
    getReactionMessage(msg) {
        const reactionMessage = msg?.reactionMessage;
        return reactionMessage;
    }
    getTypeMessage(msg) {
        const types = {
            conversation: msg.conversation,
            imageMessage: msg.imageMessage?.caption,
            videoMessage: msg.videoMessage?.caption,
            extendedTextMessage: msg.extendedTextMessage?.text,
            messageContextInfo: msg.messageContextInfo?.stanzaId,
            stickerMessage: undefined,
            documentMessage: msg.documentMessage?.caption,
            documentWithCaptionMessage: msg.documentWithCaptionMessage?.message?.documentMessage?.caption,
            audioMessage: msg.audioMessage ? (msg.audioMessage.caption ?? '') : undefined,
            contactMessage: msg.contactMessage?.vcard,
            contactsArrayMessage: msg.contactsArrayMessage,
            locationMessage: msg.locationMessage,
            liveLocationMessage: msg.liveLocationMessage,
            listMessage: msg.listMessage,
            listResponseMessage: msg.listResponseMessage,
            viewOnceMessageV2: msg?.message?.viewOnceMessageV2?.message?.imageMessage?.url ||
                msg?.message?.viewOnceMessageV2?.message?.videoMessage?.url ||
                msg?.message?.viewOnceMessageV2?.message?.audioMessage?.url,
        };
        return types;
    }
    getMessageContent(types) {
        const typeKey = Object.keys(types).find((key) => types[key] !== undefined);
        let result = typeKey ? types[typeKey] : undefined;
        if (result && typeof result === 'string' && result.includes('externalAdReplyBody|')) {
            result = result.split('externalAdReplyBody|').filter(Boolean).join('');
        }
        if (typeKey === 'locationMessage' || typeKey === 'liveLocationMessage') {
            const latitude = result.degreesLatitude;
            const longitude = result.degreesLongitude;
            const locationName = result?.name;
            const locationAddress = result?.address;
            const formattedLocation = `*${i18n_1.default.t('cw.locationMessage.location')}:*\n\n` +
                `_${i18n_1.default.t('cw.locationMessage.latitude')}:_ ${latitude} \n` +
                `_${i18n_1.default.t('cw.locationMessage.longitude')}:_ ${longitude} \n` +
                (locationName ? `_${i18n_1.default.t('cw.locationMessage.locationName')}:_ ${locationName}\n` : '') +
                (locationAddress ? `_${i18n_1.default.t('cw.locationMessage.locationAddress')}:_ ${locationAddress} \n` : '') +
                `_${i18n_1.default.t('cw.locationMessage.locationUrl')}:_ ` +
                `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
            return formattedLocation;
        }
        if (typeKey === 'contactMessage') {
            const vCardData = result.split('\n');
            const contactInfo = {};
            vCardData.forEach((line) => {
                const [key, value] = line.split(':');
                if (key && value) {
                    contactInfo[key] = value;
                }
            });
            let formattedContact = `*${i18n_1.default.t('cw.contactMessage.contact')}:*\n\n` +
                `_${i18n_1.default.t('cw.contactMessage.name')}:_ ${contactInfo['FN']}`;
            let numberCount = 1;
            Object.keys(contactInfo).forEach((key) => {
                if (key.startsWith('item') && key.includes('TEL')) {
                    const phoneNumber = contactInfo[key];
                    formattedContact += `\n_${i18n_1.default.t('cw.contactMessage.number')} (${numberCount}):_ ${phoneNumber}`;
                    numberCount++;
                }
                else if (key.includes('TEL')) {
                    const phoneNumber = contactInfo[key];
                    formattedContact += `\n_${i18n_1.default.t('cw.contactMessage.number')} (${numberCount}):_ ${phoneNumber}`;
                    numberCount++;
                }
            });
            return formattedContact;
        }
        if (typeKey === 'contactsArrayMessage') {
            const formattedContacts = result.contacts.map((contact) => {
                const vCardData = contact.vcard.split('\n');
                const contactInfo = {};
                vCardData.forEach((line) => {
                    const [key, value] = line.split(':');
                    if (key && value) {
                        contactInfo[key] = value;
                    }
                });
                let formattedContact = `*${i18n_1.default.t('cw.contactMessage.contact')}:*\n\n_${i18n_1.default.t('cw.contactMessage.name')}:_ ${contact.displayName}`;
                let numberCount = 1;
                Object.keys(contactInfo).forEach((key) => {
                    if (key.startsWith('item') && key.includes('TEL')) {
                        const phoneNumber = contactInfo[key];
                        formattedContact += `\n_${i18n_1.default.t('cw.contactMessage.number')} (${numberCount}):_ ${phoneNumber}`;
                        numberCount++;
                    }
                    else if (key.includes('TEL')) {
                        const phoneNumber = contactInfo[key];
                        formattedContact += `\n_${i18n_1.default.t('cw.contactMessage.number')} (${numberCount}):_ ${phoneNumber}`;
                        numberCount++;
                    }
                });
                return formattedContact;
            });
            const formattedContactsArray = formattedContacts.join('\n\n');
            return formattedContactsArray;
        }
        if (typeKey === 'listMessage') {
            const listTitle = result?.title || 'Unknown';
            const listDescription = result?.description || 'Unknown';
            const listFooter = result?.footerText || 'Unknown';
            let formattedList = '*List Menu:*\n\n' +
                '_Title_: ' +
                listTitle +
                '\n' +
                '_Description_: ' +
                listDescription +
                '\n' +
                '_Footer_: ' +
                listFooter;
            if (result.sections && result.sections.length > 0) {
                result.sections.forEach((section, sectionIndex) => {
                    formattedList += '\n\n*Section ' + (sectionIndex + 1) + ':* ' + section.title || 'Unknown\n';
                    if (section.rows && section.rows.length > 0) {
                        section.rows.forEach((row, rowIndex) => {
                            formattedList += '\n*Line ' + (rowIndex + 1) + ':*\n';
                            formattedList += '_▪️ Title:_ ' + (row.title || 'Unknown') + '\n';
                            formattedList += '_▪️ Description:_ ' + (row.description || 'Unknown') + '\n';
                            formattedList += '_▪️ ID:_ ' + (row.rowId || 'Unknown') + '\n';
                        });
                    }
                    else {
                        formattedList += '\nNo lines found in this section.\n';
                    }
                });
            }
            else {
                formattedList += '\nNo sections found.\n';
            }
            return formattedList;
        }
        if (typeKey === 'listResponseMessage') {
            const responseTitle = result?.title || 'Unknown';
            const responseDescription = result?.description || 'Unknown';
            const responseRowId = result?.singleSelectReply?.selectedRowId || 'Unknown';
            const formattedResponseList = '*List Response:*\n\n' +
                '_Title_: ' +
                responseTitle +
                '\n' +
                '_Description_: ' +
                responseDescription +
                '\n' +
                '_ID_: ' +
                responseRowId;
            return formattedResponseList;
        }
        return result;
    }
    getConversationMessage(msg) {
        const types = this.getTypeMessage(msg);
        const messageContent = this.getMessageContent(types);
        return messageContent;
    }
    async eventWhatsapp(event, instance, body) {
        try {
            if (body?.type && body.type !== 'message' && body.type !== 'conversation') {
                this.logger.verbose(`Ignoring non-message event type: ${body.type}`);
                return;
            }
            const waInstance = this.waMonitor.waInstances[instance.instanceName];
            if (!waInstance) {
                this.logger.warn('wa instance not found');
                return null;
            }
            const client = await this.clientCw(instance);
            if (!client) {
                this.logger.warn('client not found');
                return null;
            }
            if (this.provider?.ignoreJids && this.provider?.ignoreJids.length > 0) {
                const ignoreJids = this.provider?.ignoreJids;
                let ignoreGroups = false;
                let ignoreContacts = false;
                if (ignoreJids.includes('@g.us')) {
                    ignoreGroups = true;
                }
                if (ignoreJids.includes('@s.whatsapp.net')) {
                    ignoreContacts = true;
                }
                if (ignoreGroups && body?.key?.remoteJid.endsWith('@g.us')) {
                    this.logger.warn('Ignoring message from group: ' + body?.key?.remoteJid);
                    return;
                }
                if (ignoreContacts && body?.key?.remoteJid.endsWith('@s.whatsapp.net')) {
                    this.logger.warn('Ignoring message from contact: ' + body?.key?.remoteJid);
                    return;
                }
                if (ignoreJids.includes(body?.key?.remoteJid)) {
                    this.logger.warn('Ignoring message from jid: ' + body?.key?.remoteJid);
                    return;
                }
            }
            if (event === 'messages.upsert' || event === 'send.message') {
                if (!body?.key) {
                    this.logger.warn(`body.key is null or undefined. Full body object: ${JSON.stringify(body)}`);
                    return;
                }
                if (body.key.remoteJid === 'status@broadcast') {
                    return;
                }
                if (body.message?.ephemeralMessage?.message) {
                    body.message = {
                        ...body.message?.ephemeralMessage?.message,
                    };
                }
                const originalMessage = await this.getConversationMessage(body.message);
                const bodyMessage = originalMessage
                    ? originalMessage
                        .replaceAll(/\*((?!\s)([^\n*]+?)(?<!\s))\*/g, '**$1**')
                        .replaceAll(/_((?!\s)([^\n_]+?)(?<!\s))_/g, '*$1*')
                        .replaceAll(/~((?!\s)([^\n~]+?)(?<!\s))~/g, '~~$1~~')
                    : originalMessage;
                if (bodyMessage && bodyMessage.includes('/survey/responses/') && bodyMessage.includes('http')) {
                    return;
                }
                const quotedId = body.contextInfo?.stanzaId || body.message?.contextInfo?.stanzaId;
                let quotedMsg = null;
                if (quotedId)
                    quotedMsg = await this.prismaRepository.message.findFirst({
                        where: {
                            key: {
                                path: ['id'],
                                equals: quotedId,
                            },
                            chatwootMessageId: {
                                not: null,
                            },
                        },
                    });
                const isMedia = this.isMediaMessage(body.message);
                const adsMessage = this.getAdsMessage(body);
                const reactionMessage = this.getReactionMessage(body.message);
                if (!bodyMessage && !isMedia && !reactionMessage) {
                    this.logger.warn('no body message found');
                    return;
                }
                const getConversation = await this.createConversation(instance, body);
                if (!getConversation) {
                    this.logger.warn('conversation not found');
                    return;
                }
                const messageType = body.key.fromMe ? 'outgoing' : 'incoming';
                if (isMedia) {
                    const downloadBase64 = await waInstance?.getBase64FromMediaMessage({
                        message: {
                            ...body,
                        },
                    });
                    let nameFile;
                    const messageBody = body?.message[body?.messageType];
                    const originalFilename = messageBody?.fileName || messageBody?.filename || messageBody?.message?.documentMessage?.fileName;
                    if (originalFilename) {
                        const parsedFile = path_1.default.parse(originalFilename);
                        if (parsedFile.name && parsedFile.ext) {
                            nameFile = `${parsedFile.name}-${Math.floor(Math.random() * (99 - 10 + 1) + 10)}${parsedFile.ext}`;
                        }
                    }
                    if (!nameFile) {
                        nameFile = `${Math.random().toString(36).substring(7)}.${mime_types_1.default.extension(downloadBase64.mimetype) || ''}`;
                    }
                    const fileData = Buffer.from(downloadBase64.base64, 'base64');
                    const fileStream = new stream_1.Readable();
                    fileStream._read = () => { };
                    fileStream.push(fileData);
                    fileStream.push(null);
                    if (body.key.remoteJid.includes('@g.us')) {
                        const participantName = body.pushName;
                        const rawPhoneNumber = body.key.participant.split('@')[0];
                        const phoneMatch = rawPhoneNumber.match(/^(\d{2})(\d{2})(\d{4})(\d{4})$/);
                        let formattedPhoneNumber;
                        if (phoneMatch) {
                            formattedPhoneNumber = `+${phoneMatch[1]} (${phoneMatch[2]}) ${phoneMatch[3]}-${phoneMatch[4]}`;
                        }
                        else {
                            formattedPhoneNumber = `+${rawPhoneNumber}`;
                        }
                        let content;
                        if (!body.key.fromMe) {
                            content = `**${formattedPhoneNumber} - ${participantName}:**\n\n${bodyMessage}`;
                        }
                        else {
                            content = `${bodyMessage}`;
                        }
                        const send = await this.sendData(getConversation, fileStream, nameFile, messageType, content, instance, body, 'WAID:' + body.key.id, quotedMsg);
                        if (!send) {
                            this.logger.warn('message not sent');
                            return;
                        }
                        return send;
                    }
                    else {
                        const send = await this.sendData(getConversation, fileStream, nameFile, messageType, bodyMessage, instance, body, 'WAID:' + body.key.id, quotedMsg);
                        if (!send) {
                            this.logger.warn('message not sent');
                            return;
                        }
                        return send;
                    }
                }
                if (reactionMessage) {
                    if (reactionMessage.text) {
                        const send = await this.createMessage(instance, getConversation, reactionMessage.text, messageType, false, [], {
                            message: { extendedTextMessage: { contextInfo: { stanzaId: reactionMessage.key.id } } },
                        }, 'WAID:' + body.key.id, quotedMsg);
                        if (!send) {
                            this.logger.warn('message not sent');
                            return;
                        }
                    }
                    return;
                }
                const isAdsMessage = (adsMessage && adsMessage.title) || adsMessage.body || adsMessage.thumbnailUrl;
                if (isAdsMessage) {
                    const imgBuffer = await axios_1.default.get(adsMessage.thumbnailUrl, { responseType: 'arraybuffer' });
                    const extension = mime_types_1.default.extension(imgBuffer.headers['content-type']);
                    const mimeType = extension && mime_types_1.default.lookup(extension);
                    if (!mimeType) {
                        this.logger.warn('mimetype of Ads message not found');
                        return;
                    }
                    const random = Math.random().toString(36).substring(7);
                    const nameFile = `${random}.${mime_types_1.default.extension(mimeType)}`;
                    const fileData = Buffer.from(imgBuffer.data, 'binary');
                    const img = await jimp_1.default.read(fileData);
                    await img.cover(320, 180);
                    const processedBuffer = await img.getBufferAsync('image/png');
                    const fileStream = new stream_1.Readable();
                    fileStream._read = () => { };
                    fileStream.push(processedBuffer);
                    fileStream.push(null);
                    const truncStr = (str, len) => {
                        if (!str)
                            return '';
                        return str.length > len ? str.substring(0, len) + '...' : str;
                    };
                    const title = truncStr(adsMessage.title, 40);
                    const description = truncStr(adsMessage?.body, 75);
                    const send = await this.sendData(getConversation, fileStream, nameFile, messageType, `${bodyMessage}\n\n\n**${title}**\n${description}\n${adsMessage.sourceUrl}`, instance, body, 'WAID:' + body.key.id);
                    if (!send) {
                        this.logger.warn('message not sent');
                        return;
                    }
                    return send;
                }
                if (body.key.remoteJid.includes('@g.us')) {
                    const participantName = body.pushName;
                    const rawPhoneNumber = body.key.participant.split('@')[0];
                    const phoneMatch = rawPhoneNumber.match(/^(\d{2})(\d{2})(\d{4})(\d{4})$/);
                    let formattedPhoneNumber;
                    if (phoneMatch) {
                        formattedPhoneNumber = `+${phoneMatch[1]} (${phoneMatch[2]}) ${phoneMatch[3]}-${phoneMatch[4]}`;
                    }
                    else {
                        formattedPhoneNumber = `+${rawPhoneNumber}`;
                    }
                    let content;
                    if (!body.key.fromMe) {
                        content = `**${formattedPhoneNumber} - ${participantName}:**\n\n${bodyMessage}`;
                    }
                    else {
                        content = `${bodyMessage}`;
                    }
                    const send = await this.createMessage(instance, getConversation, content, messageType, false, [], body, 'WAID:' + body.key.id, quotedMsg);
                    if (!send) {
                        this.logger.warn('message not sent');
                        return;
                    }
                    return send;
                }
                else {
                    const send = await this.createMessage(instance, getConversation, bodyMessage, messageType, false, [], body, 'WAID:' + body.key.id, quotedMsg);
                    if (!send) {
                        this.logger.warn('message not sent');
                        return;
                    }
                    return send;
                }
            }
            if (event === wa_types_1.Events.MESSAGES_DELETE) {
                const chatwootDelete = this.configService.get('CHATWOOT').MESSAGE_DELETE;
                if (chatwootDelete === true) {
                    if (!body?.key?.id) {
                        this.logger.warn('message id not found');
                        return;
                    }
                    const message = await this.getMessageByKeyId(instance, body.key.id);
                    if (message?.chatwootMessageId && message?.chatwootConversationId) {
                        await this.prismaRepository.message.deleteMany({
                            where: {
                                key: {
                                    path: ['id'],
                                    equals: body.key.id,
                                },
                                instanceId: instance.instanceId,
                            },
                        });
                        return await client.messages.delete({
                            accountId: this.provider.accountId,
                            conversationId: message.chatwootConversationId,
                            messageId: message.chatwootMessageId,
                        });
                    }
                }
            }
            if (event === 'messages.edit' || event === 'send.message.update') {
                if (body?.type && body.type !== 'message') {
                    this.logger.verbose(`Ignoring non-message event type: ${body.type}`);
                    return;
                }
                if (!body?.key?.id) {
                    this.logger.warn(`body.key.id is null or undefined in messages.edit. Full body object: ${JSON.stringify(body)}`);
                    return;
                }
                const editedText = `${body?.editedMessage?.conversation || body?.editedMessage?.extendedTextMessage?.text}\n\n_\`${i18n_1.default.t('cw.message.edited')}.\`_`;
                const message = await this.getMessageByKeyId(instance, body.key.id);
                const key = message.key;
                const messageType = key?.fromMe ? 'outgoing' : 'incoming';
                if (message && message.chatwootConversationId) {
                    const send = await this.createMessage(instance, message.chatwootConversationId, editedText, messageType, false, [], {
                        message: { extendedTextMessage: { contextInfo: { stanzaId: key.id } } },
                    }, 'WAID:' + body.key.id, null);
                    if (!send) {
                        this.logger.warn('edited message not sent');
                        return;
                    }
                }
                return;
            }
            if (event === 'messages.read') {
                if (!body?.key?.id || !body?.key?.remoteJid) {
                    this.logger.warn('message id not found');
                    return;
                }
                const message = await this.getMessageByKeyId(instance, body.key.id);
                const conversationId = message?.chatwootConversationId;
                const contactInboxSourceId = message?.chatwootContactInboxSourceId;
                if (conversationId) {
                    let sourceId = contactInboxSourceId;
                    const inbox = (await this.getInbox(instance));
                    if (!sourceId && inbox) {
                        const conversation = (await client.conversations.get({
                            accountId: this.provider.accountId,
                            conversationId: conversationId,
                        }));
                        sourceId = conversation.last_non_activity_message?.conversation?.contact_inbox?.source_id;
                    }
                    if (sourceId && inbox?.inbox_identifier) {
                        const url = `/public/api/v1/inboxes/${inbox.inbox_identifier}/contacts/${sourceId}` +
                            `/conversations/${conversationId}/update_last_seen`;
                        (0, request_1.request)(this.getClientCwConfig(), {
                            method: 'POST',
                            url: url,
                        });
                    }
                }
                return;
            }
            if (event === 'status.instance') {
                const data = body;
                const inbox = await this.getInbox(instance);
                if (!inbox) {
                    this.logger.warn('inbox not found');
                    return;
                }
                const msgStatus = i18n_1.default.t('cw.inbox.status', {
                    inboxName: inbox.name,
                    state: data.status,
                });
                await this.createBotMessage(instance, msgStatus, 'incoming');
            }
            if (event === 'connection.update') {
                if (body.status === 'open') {
                    if (this.waMonitor.waInstances[instance.instanceName].qrCode.count > 0) {
                        const msgConnection = i18n_1.default.t('cw.inbox.connected');
                        await this.createBotMessage(instance, msgConnection, 'incoming');
                        this.waMonitor.waInstances[instance.instanceName].qrCode.count = 0;
                        chatwoot_import_helper_1.chatwootImport.clearAll(instance);
                    }
                }
            }
            if (event === 'qrcode.updated') {
                if (body.statusCode === 500) {
                    const erroQRcode = `🚨 ${i18n_1.default.t('qrlimitreached')}`;
                    return await this.createBotMessage(instance, erroQRcode, 'incoming');
                }
                else {
                    const fileData = Buffer.from(body?.qrcode.base64.replace('data:image/png;base64,', ''), 'base64');
                    const fileStream = new stream_1.Readable();
                    fileStream._read = () => { };
                    fileStream.push(fileData);
                    fileStream.push(null);
                    await this.createBotQr(instance, i18n_1.default.t('qrgeneratedsuccesfully'), 'incoming', fileStream, `${instance.instanceName}.png`);
                    let msgQrCode = `⚡️${i18n_1.default.t('qrgeneratedsuccesfully')}\n\n${i18n_1.default.t('scanqr')}`;
                    if (body?.qrcode?.pairingCode) {
                        msgQrCode =
                            msgQrCode +
                                `\n\n*Pairing Code:* ${body.qrcode.pairingCode.substring(0, 4)}-${body.qrcode.pairingCode.substring(4, 8)}`;
                    }
                    await this.createBotMessage(instance, msgQrCode, 'incoming');
                }
            }
        }
        catch (error) {
            this.logger.error(error);
        }
    }
    getNumberFromRemoteJid(remoteJid) {
        return remoteJid.replace(/:\d+/, '').split('@')[0];
    }
    startImportHistoryMessages(instance) {
        if (!this.isImportHistoryAvailable()) {
            return;
        }
        this.createBotMessage(instance, i18n_1.default.t('cw.import.startImport'), 'incoming');
    }
    isImportHistoryAvailable() {
        const uri = this.configService.get('CHATWOOT').IMPORT.DATABASE.CONNECTION.URI;
        return uri && uri !== 'postgres://user:password@hostname:port/dbname';
    }
    addHistoryMessages(instance, messagesRaw) {
        if (!this.isImportHistoryAvailable()) {
            return;
        }
        chatwoot_import_helper_1.chatwootImport.addHistoryMessages(instance, messagesRaw);
    }
    addHistoryContacts(instance, contactsRaw) {
        if (!this.isImportHistoryAvailable()) {
            return;
        }
        return chatwoot_import_helper_1.chatwootImport.addHistoryContacts(instance, contactsRaw);
    }
    async importHistoryMessages(instance) {
        if (!this.isImportHistoryAvailable()) {
            return;
        }
        this.createBotMessage(instance, i18n_1.default.t('cw.import.importingMessages'), 'incoming');
        const totalMessagesImported = await chatwoot_import_helper_1.chatwootImport.importHistoryMessages(instance, this, await this.getInbox(instance), this.provider);
        this.updateContactAvatarInRecentConversations(instance);
        const msg = Number.isInteger(totalMessagesImported)
            ? i18n_1.default.t('cw.import.messagesImported', { totalMessagesImported })
            : i18n_1.default.t('cw.import.messagesException');
        this.createBotMessage(instance, msg, 'incoming');
        return totalMessagesImported;
    }
    async updateContactAvatarInRecentConversations(instance, limitContacts = 100) {
        try {
            if (!this.isImportHistoryAvailable()) {
                return;
            }
            const client = await this.clientCw(instance);
            if (!client) {
                this.logger.warn('client not found');
                return null;
            }
            const inbox = await this.getInbox(instance);
            if (!inbox) {
                this.logger.warn('inbox not found');
                return null;
            }
            const recentContacts = await chatwoot_import_helper_1.chatwootImport.getContactsOrderByRecentConversations(inbox, this.provider, limitContacts);
            const contactIdentifiers = recentContacts
                .map((contact) => contact.identifier)
                .filter((identifier) => identifier !== null);
            const contactsWithProfilePicture = (await this.prismaRepository.contact.findMany({
                where: {
                    instanceId: instance.instanceId,
                    id: {
                        in: contactIdentifiers,
                    },
                    profilePicUrl: {
                        not: null,
                    },
                },
            })).reduce((acc, contact) => acc.set(contact.id, contact), new Map());
            recentContacts.forEach(async (contact) => {
                if (contactsWithProfilePicture.has(contact.identifier)) {
                    client.contacts.update({
                        accountId: this.provider.accountId,
                        id: contact.id,
                        data: {
                            avatar_url: contactsWithProfilePicture.get(contact.identifier).profilePictureUrl || null,
                        },
                    });
                }
            });
        }
        catch (error) {
            this.logger.error(`Error on update avatar in recent conversations: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async syncLostMessages(instance, chatwootConfig, prepareMessage) {
        try {
            if (!this.isImportHistoryAvailable()) {
                return;
            }
            if (!this.configService.get('DATABASE').SAVE_DATA.MESSAGE_UPDATE) {
                return;
            }
            const inbox = await this.getInbox(instance);
            const sqlMessages = `select * from messages m
      where account_id = ${chatwootConfig.accountId}
      and inbox_id = ${inbox.id}
      and created_at >= now() - interval '6h'
      order by created_at desc`;
            const messagesData = (await this.pgClient.query(sqlMessages))?.rows;
            const ids = messagesData
                .filter((message) => !!message.source_id)
                .map((message) => message.source_id.replace('WAID:', ''));
            const savedMessages = await this.prismaRepository.message.findMany({
                where: {
                    Instance: { name: instance.instanceName },
                    messageTimestamp: { gte: (0, dayjs_1.default)().subtract(6, 'hours').unix() },
                    AND: ids.map((id) => ({ key: { path: ['id'], not: id } })),
                },
            });
            const filteredMessages = savedMessages.filter((msg) => !chatwoot_import_helper_1.chatwootImport.isIgnorePhoneNumber(msg.key?.remoteJid));
            const messagesRaw = [];
            for (const m of filteredMessages) {
                if (!m.message || !m.key || !m.messageTimestamp) {
                    continue;
                }
                if (long_1.default.isLong(m?.messageTimestamp)) {
                    m.messageTimestamp = m.messageTimestamp?.toNumber();
                }
                messagesRaw.push(prepareMessage(m));
            }
            this.addHistoryMessages(instance, messagesRaw.filter((msg) => !chatwoot_import_helper_1.chatwootImport.isIgnorePhoneNumber(msg.key?.remoteJid)));
            await chatwoot_import_helper_1.chatwootImport.importHistoryMessages(instance, this, inbox, this.provider);
            const waInstance = this.waMonitor.waInstances[instance.instanceName];
            waInstance.clearCacheChatwoot();
        }
        catch (error) {
            return;
        }
    }
}
exports.ChatwootService = ChatwootService;
