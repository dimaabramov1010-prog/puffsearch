import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
} from "./ai-run-id";

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  date?: string | undefined;
};

export type PuffSearchResponse = {
  answer?: string | undefined;
  results?: SearchResult[] | undefined;
  error?: string | undefined;
};

const ANSWER_SYSTEM_PROMPT = `You are Puff, a pufferfish-powered search engine. You answer the user's query using ONLY the web search results provided.

Rules:
- Write a clear, helpful answer of 2-5 sentences in plain text (no markdown headers).
- Cite sources inline with [1], [2], etc. matching the numbered results. Every factual claim needs a citation.
- If the results don't answer the query, say so honestly.
- Add a tiny splash of pufferfish personality (one playful touch max), but the answer comes first.
- Never invent sources or facts not present in the results.`;

export const puffSearch = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string }) => {
    const query = typeof data?.query === "string" ? data.query.trim() : "";
    if (!query) throw new Error("query is required");
    return { query: query.slice(0, 500) };
  })
  .handler(async ({ data }): Promise<PuffSearchResponse> => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const perplexityKey = process.env["PERPLEXITY_API_KEY"];
    if (!lovableKey || !perplexityKey) {
      return { error: "Search isn't configured yet — the reef is still being set up." };
    }

    // 1. Web search via the Perplexity Search API (connector gateway)
    let results: SearchResult[] = [];
    try {
      const searchRes = await fetch(
        "https://connector-gateway.lovable.dev/perplexity/search",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": perplexityKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: data.query, max_results: 6 }),
        },
      );
      if (!searchRes.ok) {
        const body = await searchRes.text();
        console.error(`Perplexity search failed [${searchRes.status}]: ${body}`);
        return {
          error: `The search currents are rough right now (${searchRes.status}). Try again in a moment.`,
        };
      }
      const payload = (await searchRes.json()) as {
        results?: { title?: string; url?: string; snippet?: string; date?: string }[];
      };
      results = (payload.results ?? [])
        .filter((r) => r.url && r.title)
        .map((r) => ({
          title: r.title!,
          url: r.url!,
          snippet: r.snippet ?? "",
          date: r.date,
        }));
    } catch (error) {
      console.error("Perplexity search error:", error);
      return { error: "Puff couldn't reach the open ocean. Check your connection and retry." };
    }

    if (results.length === 0) {
      return { answer: undefined, results: [], error: undefined };
    }

    // 2. Synthesize a cited answer with the AI gateway
    const request = getRequest();
    const runIdFetch = createLovableAiGatewayRunIdFetch(
      getLovableAiGatewayRunId(request),
    );
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: lovableKey,
      headers: {
        "Lovable-API-Key": lovableKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
      fetch: runIdFetch.fetch,
    });

    const numbered = results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`)
      .join("\n\n");

    try {
      const result = streamText({
        model: provider.responses("openai/gpt-6-astra"),
        messages: [
          { role: "system", content: ANSWER_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Query: ${data.query}\n\nSearch results:\n${numbered}`,
          },
        ],
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
      const answer = (await result.text).trim();
      return { answer: answer || undefined, results };
    } catch (error) {
      console.error("Answer synthesis failed:", error);
      // Still return the raw results so the user gets value
      return { results };
    }
  });
