"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMessage = toMessage;
function toMessage(err) {
    if (err instanceof Error)
        return err.message ?? String(err);
    if (typeof err === "string")
        return err;
    try {
        const seen = new WeakSet();
        return JSON.stringify(err, (_k, v) => {
            if (typeof v === "object" && v !== null) {
                if (seen.has(v))
                    return "[Circular]";
                seen.add(v);
            }
            return v;
        });
    }
    catch {
        return String(err);
    }
}
