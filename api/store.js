// Generic key-value / hash / list store on Upstash Redis with an in-memory fallback for local dev.
// POST /api/store { op, key, field?, value?, prefix?, ifVersion? }
import { Redis } from "@upstash/redis";
const mem = globalThis.__ideMem || (globalThis.__ideMem = { kv: new Map(), h: new Map() });
function redis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}
const ok = (k) => /^[A-Za-z0-9_:.\-]{1,200}$/.test(k || "");
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const { op, key, field, value, prefix } = req.body || {};
  const r = redis();
  try {
    switch (op) {
      case "get": { if (!ok(key)) return bad(res); const v = r ? await r.get(key) : mem.kv.get(key) ?? null; return res.json({ value: v, persistent: !!r }); }
      case "set": { if (!ok(key)) return bad(res); if (r) await r.set(key, value); else mem.kv.set(key, value); return res.json({ ok: true }); }
      case "del": { if (!ok(key)) return bad(res); if (r) await r.del(key); else { mem.kv.delete(key); mem.h.delete(key); } return res.json({ ok: true }); }
      case "hget": { if (!ok(key) || !ok(field)) return bad(res); const v = r ? await r.hget(key, field) : (mem.h.get(key) || new Map()).get(field) ?? null; return res.json({ value: v }); }
      case "hset": { if (!ok(key) || !ok(field)) return bad(res); if (r) await r.hset(key, { [field]: value }); else { if (!mem.h.has(key)) mem.h.set(key, new Map()); mem.h.get(key).set(field, value); } return res.json({ ok: true }); }
      case "hdel": { if (!ok(key) || !ok(field)) return bad(res); if (r) await r.hdel(key, field); else mem.h.get(key)?.delete(field); return res.json({ ok: true }); }
      case "hgetall": { if (!ok(key)) return bad(res); const v = r ? (await r.hgetall(key)) || {} : Object.fromEntries(mem.h.get(key) || []); return res.json({ value: v }); }
      case "sadd": { if (!ok(key)) return bad(res); if (r) await r.sadd(key, value); else { const s = mem.kv.get(key) || []; if (!s.includes(value)) s.push(value); mem.kv.set(key, s); } return res.json({ ok: true }); }
      case "smembers": { if (!ok(key)) return bad(res); const v = r ? await r.smembers(key) : mem.kv.get(key) || []; return res.json({ value: v }); }
      case "mget": { const keys = (value || []).filter(ok).slice(0, 200); if (!keys.length) return res.json({ value: [] }); const v = r ? await r.mget(...keys) : keys.map((k) => mem.kv.get(k) ?? null); return res.json({ value: v }); }
      default: return res.status(400).json({ error: "unknown op" });
    }
  } catch (e) { return res.status(500).json({ error: e?.message || "store error" }); }
}
function bad(res) { return res.status(400).json({ error: "bad key" }); }
