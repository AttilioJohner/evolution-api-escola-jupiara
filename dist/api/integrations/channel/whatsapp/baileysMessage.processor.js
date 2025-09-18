"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaileysMessageProcessor = void 0;
const logger_config_1 = require("@config/logger.config");
const rxjs_1 = require("rxjs");
class BaileysMessageProcessor {
    constructor() {
        this.processorLogs = new logger_config_1.Logger('BaileysMessageProcessor');
        this.messageSubject = new rxjs_1.Subject();
    }
    mount({ onMessageReceive }) {
        this.subscription = this.messageSubject
            .pipe((0, rxjs_1.tap)(({ messages }) => {
            this.processorLogs.log(`Processing batch of ${messages.length} messages`);
        }), (0, rxjs_1.concatMap)(({ messages, type, requestId, settings }) => (0, rxjs_1.from)(onMessageReceive({ messages, type, requestId }, settings)).pipe((0, rxjs_1.retryWhen)((errors) => errors.pipe((0, rxjs_1.tap)((error) => this.processorLogs.warn(`Retrying message batch due to error: ${error.message}`)), (0, rxjs_1.delay)(1000), (0, rxjs_1.take)(3))))), (0, rxjs_1.catchError)((error) => {
            this.processorLogs.error(`Error processing message batch: ${error}`);
            return rxjs_1.EMPTY;
        }))
            .subscribe({
            error: (error) => {
                this.processorLogs.error(`Message stream error: ${error}`);
            },
        });
    }
    processMessage(payload, settings) {
        const { messages, type, requestId } = payload;
        this.messageSubject.next({ messages, type, requestId, settings });
    }
    onDestroy() {
        this.subscription?.unsubscribe();
        this.messageSubject.complete();
    }
}
exports.BaileysMessageProcessor = BaileysMessageProcessor;
