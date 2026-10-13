// POST /api/ai { input: string | messages, json?: boolean, images?: [dataURL], tier?: "quick"|"default" }
import Anthropic from "@anthropic-ai/sdk";
const MODELS = { quick: "claude-haiku-4-5", default: "claude-sonnet-4-5", complex: "claude-sonnet-4-5" };
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set" });
  const { input, json = false, tier = "default", images = [] } = req.body || {};
  if (!input) return res.status(400).json({ error: "input is required" });
  const content = [];
  for (const d of images.slice(0, 8)) { const m = /^data:(image\/\w+);base64,(.+)$/.exec(d || ""); if (m) content.push({ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } }); }
  content.push({ type: "text", text: typeof input === "string" ? input : JSON.stringify(input) });
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  try {
    const msg = await client.messages.create({ model: MODELS[tier] || MODELS.default, max_tokens: 6000, system: json ? "Respond with valid JSON only. No prose, no code fences." : undefined, messages: [{ role: "user", content }] });
    const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    if (!json) return res.json({ text });
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try { return res.json({ value: JSON.parse(cleaned) }); } catch { const m = cleaned.match(/[\[{][\s\S]*[\]}]/); if (m) return res.json({ value: JSON.parse(m[0]) }); return res.status(502).json({ error: "Model did not return valid JSON" }); }
  } catch (e) { return res.status(e?.status === 429 ? 429 : 500).json({ error: e?.message || "AI request failed" }); }
}
