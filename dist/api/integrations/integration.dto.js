"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationDto = void 0;
const chatwoot_dto_1 = require("@api/integrations/chatbot/chatwoot/dto/chatwoot.dto");
const event_dto_1 = require("@api/integrations/event/event.dto");
class IntegrationDto extends (0, event_dto_1.EventInstanceMixin)((0, chatwoot_dto_1.ChatwootInstanceMixin)(class {
})) {
}
exports.IntegrationDto = IntegrationDto;
