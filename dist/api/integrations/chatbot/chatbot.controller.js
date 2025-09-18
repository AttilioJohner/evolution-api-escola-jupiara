"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotController = void 0;
const server_module_1 = require("@api/server.module");
const logger_config_1 = require("@config/logger.config");
const findBotByTrigger_1 = require("@utils/findBotByTrigger");
class ChatbotController {
    constructor(prismaRepository, waMonitor) {
        this.logger = new logger_config_1.Logger('ChatbotController');
        this.prisma = prismaRepository;
        this.monitor = waMonitor;
    }
    set prisma(prisma) {
        this.prismaRepository = prisma;
    }
    get prisma() {
        return this.prismaRepository;
    }
    set monitor(waMonitor) {
        this.waMonitor = waMonitor;
    }
    get monitor() {
        return this.waMonitor;
    }
    async emit({ instance, remoteJid, msg, pushName, isIntegration = false, }) {
        const emitData = {
            instance,
            remoteJid,
            msg,
            pushName,
            isIntegration,
        };
        await server_module_1.evolutionBotController.emit(emitData);
        await server_module_1.typebotController.emit(emitData);
        await server_module_1.openaiController.emit(emitData);
        await server_module_1.difyController.emit(emitData);
        await server_module_1.n8nController.emit(emitData);
        await server_module_1.evoaiController.emit(emitData);
        await server_module_1.flowiseController.emit(emitData);
    }
    processDebounce(userMessageDebounce, content, remoteJid, debounceTime, callback) {
        if (userMessageDebounce[remoteJid]) {
            userMessageDebounce[remoteJid].message += `\n${content}`;
            this.logger.log('message debounced: ' + userMessageDebounce[remoteJid].message);
            clearTimeout(userMessageDebounce[remoteJid].timeoutId);
        }
        else {
            userMessageDebounce[remoteJid] = {
                message: content,
                timeoutId: null,
            };
        }
        userMessageDebounce[remoteJid].timeoutId = setTimeout(() => {
            const myQuestion = userMessageDebounce[remoteJid].message;
            this.logger.log('Debounce complete. Processing message: ' + myQuestion);
            delete userMessageDebounce[remoteJid];
            callback(myQuestion);
        }, debounceTime * 1000);
    }
    checkIgnoreJids(ignoreJids, remoteJid) {
        if (ignoreJids && ignoreJids.length > 0) {
            let ignoreGroups = false;
            let ignoreContacts = false;
            if (ignoreJids.includes('@g.us')) {
                ignoreGroups = true;
            }
            if (ignoreJids.includes('@s.whatsapp.net')) {
                ignoreContacts = true;
            }
            if (ignoreGroups && remoteJid.endsWith('@g.us')) {
                this.logger.warn('Ignoring message from group: ' + remoteJid);
                return true;
            }
            if (ignoreContacts && remoteJid.endsWith('@s.whatsapp.net')) {
                this.logger.warn('Ignoring message from contact: ' + remoteJid);
                return true;
            }
            if (ignoreJids.includes(remoteJid)) {
                this.logger.warn('Ignoring message from jid: ' + remoteJid);
                return true;
            }
            return false;
        }
        return false;
    }
    async getSession(remoteJid, instance) {
        let session = await this.prismaRepository.integrationSession.findFirst({
            where: {
                remoteJid: remoteJid,
                instanceId: instance.instanceId,
            },
            orderBy: { createdAt: 'desc' },
        });
        if (session) {
            if (session.status !== 'closed' && !session.botId) {
                this.logger.warn('Session is already opened in another integration');
                return null;
            }
            else if (!session.botId) {
                session = null;
            }
        }
        return session;
    }
    async findBotTrigger(botRepository, content, instance, session) {
        let findBot = null;
        if (!session) {
            findBot = await (0, findBotByTrigger_1.findBotByTrigger)(botRepository, content, instance.instanceId);
            if (!findBot) {
                return null;
            }
        }
        else {
            findBot = await botRepository.findFirst({
                where: {
                    id: session.botId,
                },
            });
        }
        return findBot;
    }
}
exports.ChatbotController = ChatbotController;
