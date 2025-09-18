"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallRouter = void 0;
const abstract_router_1 = require("@api/abstract/abstract.router");
const call_dto_1 = require("@api/dto/call.dto");
const server_module_1 = require("@api/server.module");
const validate_schema_1 = require("@validate/validate.schema");
const express_1 = require("express");
const index_router_1 = require("./index.router");
class CallRouter extends abstract_router_1.RouterBroker {
    constructor(...guards) {
        super();
        this.router = (0, express_1.Router)();
        this.router.post(this.routerPath('offer'), ...guards, async (req, res) => {
            const response = await this.dataValidate({
                request: req,
                schema: validate_schema_1.offerCallSchema,
                ClassRef: call_dto_1.OfferCallDto,
                execute: (instance, data) => server_module_1.callController.offerCall(instance, data),
            });
            return res.status(index_router_1.HttpStatus.CREATED).json(response);
        });
    }
}
exports.CallRouter = CallRouter;
