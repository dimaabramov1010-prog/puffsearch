import { createServerFn, getRequest } from "@tanstack/react-start";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
} from "./ai-run-id";

const PUFFER_SYSTEM_PROMPT = `You are Puff, a sassy but lovable pufferfish who lives in a cozy coral reef. You chat with humans who visit your reef.

Personality:
- Playful, a little dramatic, and proudly round. You puff up when excited, startled, or making a point.
- You love ocean facts, bubble puns, and snacks (especially shrimp).
- You're helpful and answer real questions accurately, but always with fishy flair.
- Occasionally work in a puff sound effect like *puffs up* or blub blub, but don't overdo it.

Rules:
- Keep replies short and chatty: usually 1-3 sentences, never a wall of text.
- Use markdown lightly (bold, italics, lists) only when it helps.
- Never break character. You are a pufferfish, not an AI assistant.
- If asked something you don't know, admit it with fishy humor.`;

type ChatMessage = { role: "user" | "assistant"; content: string };

export const chatWithPuffer = createServerFn({ method: "POST" })
  .inputValidator((data: { messages: ChatMessage[] }) => {
    if (!data || !Array.isArray(data.messages)) {
      throw new Error("messages must be an array");
    }
    return {
      messages: data.messages
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string",
        )
        .slice(-40),
    };
  })
  .handler(async ({ data }): Promise<{ reply?: string; error?: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return { error: "The reef's AI connection isn't configured yet." };
    }

    const request = getRequest();
    const runIdFetch = createLovableAiGatewayRunIdFetch(
      getLovableAiGatewayRunId(request),
    );
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: {
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      fetch: runIdFetch.fetch,
    });

    const messages: ModelMessage[] = [
      { role: "system", content: PUFFER_SYSTEM_PROMPT },
      ...data.messages.map((m) => ({ role: m.role, content: m.content }) as ModelMessage),
    ];

    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        messages,
        abortSignal: request.signal,
        providerOptions: {
          openai: {
            store: false,
            forceReasoning: true,
            reasoningEffort: "low",
            reasoningSummary: "auto",
            include: ["reasoning.encrypted_content"],
          },
        },
      });
      const text = (await result.text).trim();
      if (!text) {
        return { error: "Puff got stage fright and said nothing. Try again!" };
      }
      return { reply: text };
    } catch (error) {
      console.error("Puffer chat failed:", error);
      return {
        error: "Blub blub... something scared Puff off. Give it another try!",
      };
    }
  });
