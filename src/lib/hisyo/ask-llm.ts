import { createServerFn } from "@tanstack/react-start";

export const askSecretaryLlm = createServerFn({ method: "POST" })
  .validator((input: { prompt: string; model?: string; maxTokens?: number }) => {
    const prompt = typeof input?.prompt === "string" ? input.prompt.trim() : "";
    if (!prompt) throw new Error("空");
    const model = typeof input?.model === "string" ? input.model.trim() : "";
    const maxTokens = Number(input?.maxTokens) || 400;
    return { prompt: prompt.slice(0, 16000), model: model.slice(0, 80), maxTokens: Math.min(1200, Math.max(120, maxTokens)) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI is not available" };
    const res = await fetch("https://api.x.ai/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ model: data.model || "grok-4.5", max_tokens: data.maxTokens, temperature: 0.4, messages: [{ role: "user", content: data.prompt }] }) });
    if (!res.ok) return { ok: false as const, error: `xAI API error ${res.status}` };
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { ok: false as const, error: "empty" };
    return { ok: true as const, text };
  });
