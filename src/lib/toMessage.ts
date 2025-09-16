// Evita "[object Object]" e lida com Error, string, objeto, etc.
export function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message ?? String(err);
  if (typeof err === "string") return err;
  try {
    // cuidado com ciclos
    const seen = new WeakSet();
    return JSON.stringify(err, (_k, v) => {
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    });
  } catch {
    return String(err);
  }
}