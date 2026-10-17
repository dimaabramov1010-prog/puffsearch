import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Fish, Search, ExternalLink, Waves } from "lucide-react";

import puffer from "@/assets/puffer.png";
import { BrowserShell } from "@/components/BrowserShell";
import { puffSearch, type PuffSearchResponse } from "@/lib/search.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PuffSearch — the pufferfish search engine" },
      {
        name: "description",
        content:
          "Ask Puff anything. A pufferfish-powered search engine that swims the web and brings back answers with sources.",
      },
      { property: "og:title", content: "PuffSearch — the pufferfish search engine" },
      {
        property: "og:description",
        content:
          "Ask Puff anything. A pufferfish-powered search engine that swims the web and brings back answers with sources.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <BrowserShell renderHome={(open) => <PuffSearchPage onOpen={open} />} />,
});

const SUGGESTIONS = [
  "Why do pufferfish puff up?",
  "Latest news on electric cars",
  "Best time to visit Japan",
  "How do black holes form?",
];

const BUBBLES = [
  { left: "8%", size: 14, duration: 14, delay: 0 },
  { left: "22%", size: 8, duration: 18, delay: 3 },
  { left: "45%", size: 18, duration: 16, delay: 6 },
  { left: "63%", size: 10, duration: 20, delay: 1.5 },
  { left: "78%", size: 16, duration: 15, delay: 4.5 },
  { left: "90%", size: 9, duration: 19, delay: 2 },
];

function PuffSearchPage({ onOpen }: { onOpen: (url: string, title: string) => void }) {
  const search = useServerFn(puffSearch);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<PuffSearchResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const hasResults = response !== null;

  useEffect(() => {
    if (hasResults && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hasResults]);

  async function runSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await search({ data: { query: trimmed } });
      setResponse(res);
    } catch {
      setResponse({ error: "Blub blub... something went wrong down here. Try again!" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-ocean">
      {/* Ambient bubbles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="animate-bubble absolute bottom-[-40px] rounded-full border border-foam/40"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>

      <main className="relative mx-auto flex min-h-full w-full max-w-3xl flex-col items-center px-4 pb-24 pt-16 sm:pt-24">
        {/* Mascot + wordmark */}
        <img
          src={puffer}
          alt="Puff the pufferfish"
          width={1024}
          height={1024}
          className="animate-bob h-32 w-32 drop-shadow-[0_12px_32px_oklch(0.86_0.17_95/0.25)] sm:h-40 sm:w-40"
        />
        <h1 className="font-display mt-4 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Puff<span className="text-primary">Search</span>
        </h1>
        <p className="mt-3 max-w-md text-center text-muted-foreground">
          Ask anything. Puff swims the web and puffs back an answer — with sources.
        </p>

        {/* Search box */}
        <form
          className="mt-10 w-full"
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(query);
          }}
        >
          <div className="flex items-center gap-2 rounded-full border border-input bg-card/80 p-2 shadow-[0_8px_40px_oklch(0_0_0/0.35)] backdrop-blur transition-colors focus-within:border-ring">
            <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What should Puff find?"
              className="min-w-0 flex-1 bg-transparent text-lg text-foreground outline-none placeholder:text-muted-foreground"
              aria-label="Search query"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="shrink-0 rounded-full bg-primary px-6 py-3 font-display text-base font-bold text-primary-foreground transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "Swimming…" : "Search"}
            </button>
          </div>
        </form>

        {/* Suggestions (idle state) */}
        {!hasResults && !loading && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  void runSearch(s);
                }}
                className="rounded-full border border-border bg-secondary/60 px-4 py-2 text-sm text-secondary-foreground transition-colors hover:border-accent hover:text-accent"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-16 flex flex-col items-center gap-4" role="status">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="animate-puff-dot h-4 w-4 rounded-full bg-primary"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Puff is diving for answers…
            </p>
          </div>
        )}

        {/* Results */}
        {hasResults && !loading && (
          <div ref={resultsRef} className="mt-12 w-full scroll-mt-8 space-y-6">
            {response.error ? (
              <div className="rounded-2xl border border-destructive/40 bg-card p-6 text-center">
                <Fish className="mx-auto h-8 w-8 text-destructive" />
                <p className="mt-3 text-foreground">{response.error}</p>
              </div>
            ) : (
              <>
                {response.answer && (
                  <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_8px_40px_oklch(0_0_0/0.3)]">
                    <div className="flex items-center gap-2">
                      <img
                        src={puffer}
                        alt=""
                        width={1024}
                        height={1024}
                        loading="lazy"
                        className="h-8 w-8"
                      />
                      <h2 className="font-display text-lg font-bold text-primary">
                        Puff says
                      </h2>
                    </div>
                    <p className="mt-3 leading-relaxed text-card-foreground">
                      {response.answer}
                    </p>
                  </section>
                )}

                {response.results && response.results.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      <Waves className="h-4 w-4" /> Sources from the deep
                    </h2>
                    {response.results.map((r, i) => (
                      <a
                        key={r.url}
                        href={r.url}
                        onClick={(e) => {
                          e.preventDefault();
                          onOpen(r.url, r.title);
                        }}
                        className="group block rounded-2xl border border-border bg-card/60 p-5 transition-colors hover:border-accent hover:bg-card"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-display font-bold leading-snug text-foreground group-hover:text-accent">
                            <span className="mr-2 text-muted-foreground">[{i + 1}]</span>
                            {r.title}
                          </h3>
                          <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-accent" />
                        </div>
                        {r.snippet && (
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {r.snippet}
                          </p>
                        )}
                        <p className="mt-2 truncate text-xs text-foam/70">{r.url}</p>
                      </a>
                    ))}
                  </section>
                )}

                {!response.answer && (!response.results || response.results.length === 0) && (
                  <div className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">
                    Puff swam far and wide but found nothing. Try rephrasing your search!
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
