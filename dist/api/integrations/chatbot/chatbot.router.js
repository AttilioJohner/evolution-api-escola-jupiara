"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotRouter = void 0;
const chatwoot_router_1 = require("@api/integrations/chatbot/chatwoot/routes/chatwoot.router");
const dify_router_1 = require("@api/integrations/chatbot/dify/routes/dify.router");
const openai_router_1 = require("@api/integrations/chatbot/openai/routes/openai.router");
const typebot_router_1 = require("@api/integrations/chatbot/typebot/routes/typebot.router");
const express_1 = require("express");
const evoai_router_1 = require("./evoai/routes/evoai.router");
const evolutionBot_router_1 = require("./evolutionBot/routes/evolutionBot.router");
const flowise_router_1 = require("./flowise/routes/flowise.router");
const n8n_router_1 = require("./n8n/routes/n8n.router");
class ChatbotRouter {
    constructor(...guards) {
        this.router = (0, express_1.Router)();
        this.router.use('/evolutionBot', new evolutionBot_router_1.EvolutionBotRouter(...guards).router);
        this.router.use('/chatwoot', new chatwoot_router_1.ChatwootRouter(...guards).router);
        this.router.use('/typebot', new typebot_router_1.TypebotRouter(...guards).router);
        this.router.use('/openai', new openai_router_1.OpenaiRouter(...guards).router);
        this.router.use('/dify', new dify_router_1.DifyRouter(...guards).router);
        this.router.use('/flowise', new flowise_router_1.FlowiseRouter(...guards).router);
        this.router.use('/n8n', new n8n_router_1.N8nRouter(...guards).router);
        this.router.use('/evoai', new evoai_router_1.EvoaiRouter(...guards).router);
    }
}
exports.ChatbotRouter = ChatbotRouter;
