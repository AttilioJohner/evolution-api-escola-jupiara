"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateController = void 0;
class TemplateController {
    constructor(templateService) {
        this.templateService = templateService;
    }
    async createTemplate(instance, data) {
        return this.templateService.create(instance, data);
    }
    async findTemplate(instance) {
        return this.templateService.find(instance);
    }
}
exports.TemplateController = TemplateController;
