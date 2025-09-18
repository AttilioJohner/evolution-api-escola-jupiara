"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatwootImport = void 0;
const postgres_client_1 = require("@api/integrations/chatbot/chatwoot/libs/postgres.client");
const env_config_1 = require("@config/env.config");
const logger_config_1 = require("@config/logger.config");
class ChatwootImport {
    constructor() {
        this.logger = new logger_config_1.Logger('ChatwootImport');
        this.repositoryMessagesCache = new Map();
        this.historyMessages = new Map();
        this.historyContacts = new Map();
    }
    getRepositoryMessagesCache(instance) {
        return this.repositoryMessagesCache.has(instance.instanceName)
            ? this.repositoryMessagesCache.get(instance.instanceName)
            : null;
    }
    setRepositoryMessagesCache(instance, repositoryMessagesCache) {
        this.repositoryMessagesCache.set(instance.instanceName, repositoryMessagesCache);
    }
    deleteRepositoryMessagesCache(instance) {
        this.repositoryMessagesCache.delete(instance.instanceName);
    }
    addHistoryMessages(instance, messagesRaw) {
        const actualValue = this.historyMessages.has(instance.instanceName)
            ? this.historyMessages.get(instance.instanceName)
            : [];
        this.historyMessages.set(instance.instanceName, [...actualValue, ...messagesRaw]);
    }
    addHistoryContacts(instance, contactsRaw) {
        const actualValue = this.historyContacts.has(instance.instanceName)
            ? this.historyContacts.get(instance.instanceName)
            : [];
        this.historyContacts.set(instance.instanceName, actualValue.concat(contactsRaw));
    }
    deleteHistoryMessages(instance) {
        this.historyMessages.delete(instance.instanceName);
    }
    deleteHistoryContacts(instance) {
        this.historyContacts.delete(instance.instanceName);
    }
    clearAll(instance) {
        this.deleteRepositoryMessagesCache(instance);
        this.deleteHistoryMessages(instance);
        this.deleteHistoryContacts(instance);
    }
    getHistoryMessagesLenght(instance) {
        return this.historyMessages.get(instance.instanceName)?.length ?? 0;
    }
    async importHistoryContacts(instance, provider) {
        try {
            if (this.getHistoryMessagesLenght(instance) > 0) {
                return;
            }
            const pgClient = postgres_client_1.postgresClient.getChatwootConnection();
            let totalContactsImported = 0;
            const contacts = this.historyContacts.get(instance.instanceName) || [];
            if (contacts.length === 0) {
                return 0;
            }
            let contactsChunk = this.sliceIntoChunks(contacts, 3000);
            while (contactsChunk.length > 0) {
                const labelSql = `SELECT id FROM labels WHERE title = '${provider.nameInbox}' AND account_id = ${provider.accountId} LIMIT 1`;
                let labelId = (await pgClient.query(labelSql))?.rows[0]?.id;
                if (!labelId) {
                    const sqlLabel = `INSERT INTO labels (title, color, show_on_sidebar, account_id, created_at, updated_at) VALUES ('${provider.nameInbox}', '#34039B', true, ${provider.accountId}, NOW(), NOW()) RETURNING id`;
                    labelId = (await pgClient.query(sqlLabel))?.rows[0]?.id;
                }
                let sqlInsert = `INSERT INTO contacts
          (name, phone_number, account_id, identifier, created_at, updated_at) VALUES `;
                const bindInsert = [provider.accountId];
                for (const contact of contactsChunk) {
                    bindInsert.push(contact.pushName);
                    const bindName = `$${bindInsert.length}`;
                    bindInsert.push(`+${contact.remoteJid.split('@')[0]}`);
                    const bindPhoneNumber = `$${bindInsert.length}`;
                    bindInsert.push(contact.remoteJid);
                    const bindIdentifier = `$${bindInsert.length}`;
                    sqlInsert += `(${bindName}, ${bindPhoneNumber}, $1, ${bindIdentifier}, NOW(), NOW()),`;
                }
                if (sqlInsert.slice(-1) === ',') {
                    sqlInsert = sqlInsert.slice(0, -1);
                }
                sqlInsert += ` ON CONFLICT (identifier, account_id)
                       DO UPDATE SET
                        name = EXCLUDED.name,
                        phone_number = EXCLUDED.phone_number,
                        identifier = EXCLUDED.identifier`;
                totalContactsImported += (await pgClient.query(sqlInsert, bindInsert))?.rowCount ?? 0;
                const sqlTags = `SELECT id FROM tags WHERE name = '${provider.nameInbox}' LIMIT 1`;
                const tagData = (await pgClient.query(sqlTags))?.rows[0];
                let tagId = tagData?.id;
                const sqlTag = `INSERT INTO tags (name, taggings_count) VALUES ('${provider.nameInbox}', ${totalContactsImported}) ON CONFLICT (name) DO UPDATE SET taggings_count = tags.taggings_count + ${totalContactsImported} RETURNING id`;
                tagId = (await pgClient.query(sqlTag))?.rows[0]?.id;
                await pgClient.query(sqlTag);
                let sqlInsertLabel = `INSERT INTO taggings (tag_id, taggable_type, taggable_id, context, created_at) VALUES `;
                contactsChunk.forEach((contact) => {
                    const bindTaggableId = `(SELECT id FROM contacts WHERE identifier = '${contact.remoteJid}' AND account_id = ${provider.accountId})`;
                    sqlInsertLabel += `($1, $2, ${bindTaggableId}, $3, NOW()),`;
                });
                if (sqlInsertLabel.slice(-1) === ',') {
                    sqlInsertLabel = sqlInsertLabel.slice(0, -1);
                }
                await pgClient.query(sqlInsertLabel, [tagId, 'Contact', 'labels']);
                contactsChunk = this.sliceIntoChunks(contacts, 3000);
            }
            this.deleteHistoryContacts(instance);
            return totalContactsImported;
        }
        catch (error) {
            this.logger.error(`Error on import history contacts: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getExistingSourceIds(sourceIds, conversationId) {
        try {
            const existingSourceIdsSet = new Set();
            if (sourceIds.length === 0) {
                return existingSourceIdsSet;
            }
            const formattedSourceIds = sourceIds.map((sourceId) => `WAID:${sourceId.replace('WAID:', '')}`);
            const pgClient = postgres_client_1.postgresClient.getChatwootConnection();
            const params = conversationId ? [formattedSourceIds, conversationId] : [formattedSourceIds];
            const query = conversationId
                ? 'SELECT source_id FROM messages WHERE source_id = ANY($1) AND conversation_id = $2'
                : 'SELECT source_id FROM messages WHERE source_id = ANY($1)';
            const result = await pgClient.query(query, params);
            for (const row of result.rows) {
                existingSourceIdsSet.add(row.source_id);
            }
            return existingSourceIdsSet;
        }
        catch (error) {
            this.logger.error(`Error on getExistingSourceIds: ${error instanceof Error ? error.message : String(error)}`);
            return new Set();
        }
    }
    async importHistoryMessages(instance, chatwootService, inbox, provider) {
        try {
            const pgClient = postgres_client_1.postgresClient.getChatwootConnection();
            const chatwootUser = await this.getChatwootUser(provider);
            if (!chatwootUser) {
                throw new Error('User not found to import messages.');
            }
            let totalMessagesImported = 0;
            let messagesOrdered = this.historyMessages.get(instance.instanceName) || [];
            if (messagesOrdered.length === 0) {
                return 0;
            }
            messagesOrdered.sort((a, b) => {
                const aKey = a.key;
                const bKey = b.key;
                const aMessageTimestamp = a.messageTimestamp;
                const bMessageTimestamp = b.messageTimestamp;
                return parseInt(aKey.remoteJid) - parseInt(bKey.remoteJid) || aMessageTimestamp - bMessageTimestamp;
            });
            const allMessagesMappedByPhoneNumber = this.createMessagesMapByPhoneNumber(messagesOrdered);
            const phoneNumbersWithTimestamp = new Map();
            allMessagesMappedByPhoneNumber.forEach((messages, phoneNumber) => {
                phoneNumbersWithTimestamp.set(phoneNumber, {
                    first: messages[0]?.messageTimestamp,
                    last: messages[messages.length - 1]?.messageTimestamp,
                });
            });
            const existingSourceIds = await this.getExistingSourceIds(messagesOrdered.map((message) => message.key.id));
            messagesOrdered = messagesOrdered.filter((message) => !existingSourceIds.has(message.key.id));
            const batchSize = 4000;
            let messagesChunk = this.sliceIntoChunks(messagesOrdered, batchSize);
            while (messagesChunk.length > 0) {
                const messagesByPhoneNumber = this.createMessagesMapByPhoneNumber(messagesChunk);
                if (messagesByPhoneNumber.size > 0) {
                    const fksByNumber = await this.selectOrCreateFksFromChatwoot(provider, inbox, phoneNumbersWithTimestamp, messagesByPhoneNumber);
                    let sqlInsertMsg = `INSERT INTO messages
            (content, processed_message_content, account_id, inbox_id, conversation_id, message_type, private, content_type,
            sender_type, sender_id, source_id, created_at, updated_at) VALUES `;
                    const bindInsertMsg = [provider.accountId, inbox.id];
                    messagesByPhoneNumber.forEach((messages, phoneNumber) => {
                        const fksChatwoot = fksByNumber.get(phoneNumber);
                        messages.forEach((message) => {
                            if (!message.message) {
                                return;
                            }
                            if (!fksChatwoot?.conversation_id || !fksChatwoot?.contact_id) {
                                return;
                            }
                            const contentMessage = this.getContentMessage(chatwootService, message);
                            if (!contentMessage) {
                                return;
                            }
                            bindInsertMsg.push(contentMessage);
                            const bindContent = `$${bindInsertMsg.length}`;
                            bindInsertMsg.push(fksChatwoot.conversation_id);
                            const bindConversationId = `$${bindInsertMsg.length}`;
                            bindInsertMsg.push(message.key.fromMe ? '1' : '0');
                            const bindMessageType = `$${bindInsertMsg.length}`;
                            bindInsertMsg.push(message.key.fromMe ? chatwootUser.user_type : 'Contact');
                            const bindSenderType = `$${bindInsertMsg.length}`;
                            bindInsertMsg.push(message.key.fromMe ? chatwootUser.user_id : fksChatwoot.contact_id);
                            const bindSenderId = `$${bindInsertMsg.length}`;
                            bindInsertMsg.push('WAID:' + message.key.id);
                            const bindSourceId = `$${bindInsertMsg.length}`;
                            bindInsertMsg.push(message.messageTimestamp);
                            const bindmessageTimestamp = `$${bindInsertMsg.length}`;
                            sqlInsertMsg += `(${bindContent}, ${bindContent}, $1, $2, ${bindConversationId}, ${bindMessageType}, FALSE, 0,
                  ${bindSenderType},${bindSenderId},${bindSourceId}, to_timestamp(${bindmessageTimestamp}), to_timestamp(${bindmessageTimestamp})),`;
                        });
                    });
                    if (bindInsertMsg.length > 2) {
                        if (sqlInsertMsg.slice(-1) === ',') {
                            sqlInsertMsg = sqlInsertMsg.slice(0, -1);
                        }
                        totalMessagesImported += (await pgClient.query(sqlInsertMsg, bindInsertMsg))?.rowCount ?? 0;
                    }
                }
                messagesChunk = this.sliceIntoChunks(messagesOrdered, batchSize);
            }
            this.deleteHistoryMessages(instance);
            this.deleteRepositoryMessagesCache(instance);
            const providerData = {
                ...provider,
                ignoreJids: Array.isArray(provider.ignoreJids) ? provider.ignoreJids.map((event) => String(event)) : [],
            };
            this.importHistoryContacts(instance, providerData);
            return totalMessagesImported;
        }
        catch (error) {
            this.logger.error(`Error on import history messages: ${error instanceof Error ? error.message : String(error)}`);
            this.deleteHistoryMessages(instance);
            this.deleteRepositoryMessagesCache(instance);
        }
    }
    async selectOrCreateFksFromChatwoot(provider, inbox, phoneNumbersWithTimestamp, messagesByPhoneNumber) {
        const pgClient = postgres_client_1.postgresClient.getChatwootConnection();
        const bindValues = [provider.accountId, inbox.id];
        const phoneNumberBind = Array.from(messagesByPhoneNumber.keys())
            .map((phoneNumber) => {
            const phoneNumberTimestamp = phoneNumbersWithTimestamp.get(phoneNumber);
            if (phoneNumberTimestamp) {
                bindValues.push(phoneNumber);
                let bindStr = `($${bindValues.length},`;
                bindValues.push(phoneNumberTimestamp.first);
                bindStr += `$${bindValues.length},`;
                bindValues.push(phoneNumberTimestamp.last);
                return `${bindStr}$${bindValues.length})`;
            }
        })
            .join(',');
        const sqlFromChatwoot = `WITH
              phone_number AS (
                SELECT phone_number, created_at::INTEGER, last_activity_at::INTEGER FROM (
                  VALUES 
                   ${phoneNumberBind}
                 ) as t (phone_number, created_at, last_activity_at)
              ),

              only_new_phone_number AS (
                SELECT * FROM phone_number
                WHERE phone_number NOT IN (
                  SELECT phone_number
                  FROM contacts
                    JOIN contact_inboxes ci ON ci.contact_id = contacts.id AND ci.inbox_id = $2
                    JOIN conversations con ON con.contact_inbox_id = ci.id 
                      AND con.account_id = $1
                      AND con.inbox_id = $2
                      AND con.contact_id = contacts.id
                  WHERE contacts.account_id = $1
                )
              ),

              new_contact AS (
                INSERT INTO contacts (name, phone_number, account_id, identifier, created_at, updated_at)
                SELECT REPLACE(p.phone_number, '+', ''), p.phone_number, $1, CONCAT(REPLACE(p.phone_number, '+', ''),
                  '@s.whatsapp.net'), to_timestamp(p.created_at), to_timestamp(p.last_activity_at)
                FROM only_new_phone_number AS p
                ON CONFLICT(identifier, account_id) DO UPDATE SET updated_at = EXCLUDED.updated_at
                RETURNING id, phone_number, created_at, updated_at
              ),

              new_contact_inbox AS (
                INSERT INTO contact_inboxes (contact_id, inbox_id, source_id, created_at, updated_at)
                SELECT new_contact.id, $2, gen_random_uuid(), new_contact.created_at, new_contact.updated_at
                FROM new_contact 
                RETURNING id, contact_id, created_at, updated_at
              ),

              new_conversation AS (
                INSERT INTO conversations (account_id, inbox_id, status, contact_id,
                  contact_inbox_id, uuid, last_activity_at, created_at, updated_at)
                SELECT $1, $2, 0, new_contact_inbox.contact_id, new_contact_inbox.id, gen_random_uuid(),
                  new_contact_inbox.updated_at, new_contact_inbox.created_at, new_contact_inbox.updated_at
                FROM new_contact_inbox
                RETURNING id, contact_id
              )

              SELECT new_contact.phone_number, new_conversation.contact_id, new_conversation.id AS conversation_id
              FROM new_conversation 
              JOIN new_contact ON new_conversation.contact_id = new_contact.id

              UNION

              SELECT p.phone_number, c.id contact_id, con.id conversation_id
                FROM phone_number p
              JOIN contacts c ON c.phone_number = p.phone_number
              JOIN contact_inboxes ci ON ci.contact_id = c.id AND ci.inbox_id = $2
              JOIN conversations con ON con.contact_inbox_id = ci.id AND con.account_id = $1
                AND con.inbox_id = $2 AND con.contact_id = c.id`;
        const fksFromChatwoot = await pgClient.query(sqlFromChatwoot, bindValues);
        return new Map(fksFromChatwoot.rows.map((item) => [item.phone_number, item]));
    }
    async getChatwootUser(provider) {
        try {
            const pgClient = postgres_client_1.postgresClient.getChatwootConnection();
            const sqlUser = `SELECT owner_type AS user_type, owner_id AS user_id
                         FROM access_tokens
                       WHERE token = $1`;
            return (await pgClient.query(sqlUser, [provider.token]))?.rows[0] || false;
        }
        catch (error) {
            this.logger.error(`Error on getChatwootUser: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    createMessagesMapByPhoneNumber(messages) {
        return messages.reduce((acc, message) => {
            const key = message?.key;
            if (!this.isIgnorePhoneNumber(key?.remoteJid)) {
                const phoneNumber = key?.remoteJid?.split('@')[0];
                if (phoneNumber) {
                    const phoneNumberPlus = `+${phoneNumber}`;
                    const messages = acc.has(phoneNumberPlus) ? acc.get(phoneNumberPlus) : [];
                    messages.push(message);
                    acc.set(phoneNumberPlus, messages);
                }
            }
            return acc;
        }, new Map());
    }
    async getContactsOrderByRecentConversations(inbox, provider, limit = 50) {
        try {
            const pgClient = postgres_client_1.postgresClient.getChatwootConnection();
            const sql = `SELECT contacts.id, contacts.identifier, contacts.phone_number
                     FROM conversations
                   JOIN contacts ON contacts.id = conversations.contact_id
                   WHERE conversations.account_id = $1
                     AND inbox_id = $2
                   ORDER BY conversations.last_activity_at DESC
                   LIMIT $3`;
            return (await pgClient.query(sql, [provider.accountId, inbox.id, limit]))?.rows;
        }
        catch (error) {
            this.logger.error(`Error on get recent conversations: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    getContentMessage(chatwootService, msg) {
        const contentMessage = chatwootService.getConversationMessage(msg.message);
        if (contentMessage) {
            return contentMessage;
        }
        if (!env_config_1.configService.get('CHATWOOT').IMPORT.PLACEHOLDER_MEDIA_MESSAGE) {
            return '';
        }
        const types = {
            documentMessage: msg.message.documentMessage,
            documentWithCaptionMessage: msg.message.documentWithCaptionMessage?.message?.documentMessage,
            imageMessage: msg.message.imageMessage,
            videoMessage: msg.message.videoMessage,
            audioMessage: msg.message.audioMessage,
            stickerMessage: msg.message.stickerMessage,
            templateMessage: msg.message.templateMessage?.hydratedTemplate?.hydratedContentText,
        };
        const typeKey = Object.keys(types).find((key) => types[key] !== undefined && types[key] !== null);
        switch (typeKey) {
            case 'documentMessage': {
                const doc = msg.message.documentMessage;
                const fileName = doc?.fileName || 'document';
                const caption = doc?.caption ? ` ${doc.caption}` : '';
                return `_<File: ${fileName}${caption}>_`;
            }
            case 'documentWithCaptionMessage': {
                const doc = msg.message.documentWithCaptionMessage?.message?.documentMessage;
                const fileName = doc?.fileName || 'document';
                const caption = doc?.caption ? ` ${doc.caption}` : '';
                return `_<File: ${fileName}${caption}>_`;
            }
            case 'templateMessage': {
                const template = msg.message.templateMessage?.hydratedTemplate;
                return ((template?.hydratedTitleText ? `*${template.hydratedTitleText}*\n` : '') +
                    (template?.hydratedContentText || ''));
            }
            case 'imageMessage':
                return '_<Image Message>_';
            case 'videoMessage':
                return '_<Video Message>_';
            case 'audioMessage':
                return '_<Audio Message>_';
            case 'stickerMessage':
                return '_<Sticker Message>_';
            default:
                return '';
        }
    }
    sliceIntoChunks(arr, chunkSize) {
        return arr.splice(0, chunkSize);
    }
    isGroup(remoteJid) {
        return remoteJid.includes('@g.us');
    }
    isIgnorePhoneNumber(remoteJid) {
        return this.isGroup(remoteJid) || remoteJid === 'status@broadcast' || remoteJid === '0@s.whatsapp.net';
    }
    updateMessageSourceID(messageId, sourceId) {
        const pgClient = postgres_client_1.postgresClient.getChatwootConnection();
        const sql = `UPDATE messages SET source_id = $1, status = 0, created_at = NOW(), updated_at = NOW() WHERE id = $2;`;
        return pgClient.query(sql, [`WAID:${sourceId}`, messageId]);
    }
}
exports.chatwootImport = new ChatwootImport();
