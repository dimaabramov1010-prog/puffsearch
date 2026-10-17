import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, RotateCw, Plus, X, Circle, CircleDot, ExternalLink, Search } from "lucide-react";
import puffer from "@/assets/puffer.png";

type Tab = { id: number; title: string; url: string | null };
type Bookmark = { title: string; url: string };

let nextId = 2;

export function BrowserShell({
  renderHome,
}: {
  renderHome: (openSite: (url: string, title: string) => void) => ReactNode;
}) {
  const [tabs, setTabs] = useState<Tab[]>([{ id: 1, title: "PuffSearch", url: null }]);
  const [activeId, setActiveId] = useState(1);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [address, setAddress] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("puff-bookmarks");
      if (raw) setBookmarks(JSON.parse(raw) as Bookmark[]);
    } catch {
      /* ignore */
    }
  }, []);

  const saveBookmarks = (b: Bookmark[]) => {
    setBookmarks(b);
    localStorage.setItem("puff-bookmarks", JSON.stringify(b));
  };

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0]!;

  useEffect(() => {
    setAddress(active.url ?? "");
  }, [active.id, active.url]);

  const updateActive = (patch: Partial<Tab>) =>
    setTabs((ts) => ts.map((t) => (t.id === active.id ? { ...t, ...patch } : t)));

  const newTab = (url: string | null = null, title = "PuffSearch") => {
    const id = nextId++;
    setTabs((ts) => [...ts, { id, title, url }]);
    setActiveId(id);
  };

  const closeTab = (id: number) => {
    setTabs((ts) => {
      const idx = ts.findIndex((t) => t.id === id);
      const rest = ts.filter((t) => t.id !== id);
      if (rest.length === 0) {
        const fresh = { id: nextId++, title: "PuffSearch", url: null };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(rest[Math.max(0, idx - 1)]!.id);
      return rest;
    });
  };

  const openSite = (url: string, title: string) => newTab(url, title);

  const go = (input: string) => {
    const v = input.trim();
    if (!v) return updateActive({ url: null, title: "PuffSearch" });
    const looksUrl = /^https?:\/\//i.test(v) || /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v);
    if (looksUrl) {
      const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      updateActive({ url, title: new URL(url).hostname });
    } else {
      updateActive({ url: null, title: "PuffSearch" });
    }
  };

  const bookmarked = active.url ? bookmarks.some((b) => b.url === active.url) : false;
  const toggleBookmark = () => {
    if (!active.url) return;
    saveBookmarks(
      bookmarked
        ? bookmarks.filter((b) => b.url !== active.url)
        : [...bookmarks, { title: active.title, url: active.url }],
    );
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Firefox-style tab strip */}
      <div className="flex items-end gap-1 bg-muted px-2 pt-2">
        {tabs.map((t) => {
          const isActive = t.id === active.id;
          return (
            <div
              key={t.id}
              onClick={() => setActiveId(t.id)}
              onAuxClick={(e) => e.button === 1 && closeTab(t.id)}
              className={`group mb-1.5 flex h-9 w-52 min-w-0 cursor-default items-center gap-2 rounded-md px-3 text-sm transition-colors ${
                isActive
                  ? "bg-card text-foreground shadow-[0_0_0_1px_var(--color-border),0_2px_6px_oklch(0_0_0/0.35)]"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t.url ? (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${new URL(t.url).hostname}&sz=32`}
                  alt=""
                  className="h-4 w-4 shrink-0"
                />
              ) : (
                <img src={puffer} alt="" width={16} height={16} className="h-4 w-4 shrink-0" />
              )}
              <span className="flex-1 truncate">{t.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(t.id);
                }}
                aria-label="Close tab"
                className="rounded p-0.5 opacity-70 hover:bg-secondary hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
        <button
          onClick={() => newTab()}
          aria-label="New tab"
          className="mb-1.5 rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-border bg-card px-2 py-1.5">
        <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Back"
          onClick={() => updateActive({ url: null, title: "PuffSearch" })}>
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button className="rounded p-1.5 text-muted-foreground/40" aria-label="Forward" disabled>
          <ArrowRight className="h-4 w-4" />
        </button>
        <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Reload"
          onClick={() => setReloadKey((k) => k + 1)}>
          <RotateCw className="h-4 w-4" />
        </button>
        <form
          className="mx-1 flex flex-1 items-center gap-2 rounded-md border border-input bg-muted px-3 py-1.5 focus-within:border-ring"
          onSubmit={(e) => {
            e.preventDefault();
            go(address);
          }}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Search with PuffSearch or enter address"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-label="Address bar"
          />
          <button
            type="button"
            onClick={toggleBookmark}
            disabled={!active.url}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this site"}
            title={bookmarked ? "Remove bookmark" : "Bookmark this site"}
            className="text-muted-foreground hover:text-primary disabled:opacity-30"
          >
            {bookmarked ? <CircleDot className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4" />}
          </button>
        </form>
      </div>

      {/* Bookmarks bar */}
      <div className="flex min-h-8 items-center gap-1 overflow-x-auto border-b border-border bg-card px-2 py-1 text-xs">
        {bookmarks.length === 0 ? (
          <span className="px-2 text-muted-foreground">Click the circle in the address bar to bookmark a site</span>
        ) : (
          bookmarks.map((b) => (
            <button
              key={b.url}
              onClick={() => updateActive({ url: b.url, title: b.title })}
              onContextMenu={(e) => {
                e.preventDefault();
                saveBookmarks(bookmarks.filter((x) => x.url !== b.url));
              }}
              title={`${b.url} (right-click to remove)`}
              className="flex max-w-48 shrink-0 items-center gap-1.5 rounded px-2 py-1 text-foreground hover:bg-secondary"
            >
              <img src={`https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=32`} alt="" className="h-3.5 w-3.5" />
              <span className="truncate">{b.title}</span>
            </button>
          ))
        )}
      </div>

      {/* Content — keep every tab mounted so state survives switching */}
      <div className="relative flex-1 overflow-hidden">
        {tabs.map((t) => (
          <div key={t.id} className={`absolute inset-0 overflow-auto ${t.id === active.id ? "" : "hidden"}`}>
            {t.url ? (
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between gap-2 bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  <span>Some sites refuse to load inside other pages.</span>
                  <a href={t.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline">
                    Open in real tab <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <iframe key={reloadKey} src={t.url} title={t.title} className="w-full flex-1 border-0 bg-card" />
              </div>
            ) : (
              renderHome(openSite)
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
