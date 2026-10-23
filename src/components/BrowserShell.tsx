import { useEffect, useRef, useState, type ReactNode } from "react";
import { Plus, X, Circle, CircleDot, Home } from "lucide-react";
import puffer from "@/assets/puffer.png";
import { useServerFn } from "@tanstack/react-start";
import { fetchPage } from "@/lib/proxy.functions";
import { AccountButton } from "@/components/AccountButton";

function SiteFrame({ url, title, onNavigate, onFail }: { url: string; title: string; onNavigate: (url: string) => void; onFail: () => void }) {
  const load = useServerFn(fetchPage);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [attempt] = useState(0);
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setHtml(null);
    setErr(null);
    load({ data: { url } })
      .then((r) => alive && (r.error ? setErr(r.error) : setHtml(r.html)))
      .catch(() => alive && setErr("Failed to load"));
    return () => {
      alive = false;
    };
  }, [url, load, attempt]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (!frameRef.current || event.source !== frameRef.current.contentWindow ||
        event.data?.type !== "puff-navigate" || typeof event.data.url !== "string") return;
      try {
        const next = new URL(event.data.url);
        if (/^https?:$/.test(next.protocol)) onNavigate(next.href);
      } catch { /* Ignore invalid navigation messages. */ }
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [onNavigate]);
  useEffect(() => {
    if (err) onFail();
  }, [err, onFail]);
  if (err) return null;
  if (html === null) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  return <iframe ref={frameRef} srcDoc={html} title={title} sandbox="allow-scripts" className="w-full flex-1 border-0 bg-card" />;
}

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
  const [bookmarkMenu, setBookmarkMenu] = useState<{ x: number; y: number; url: string } | null>(null);
  const [editing, setEditing] = useState<Bookmark | null>(null);
  const [editName, setEditName] = useState("");

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

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0] ?? { id: 1, title: "PuffSearch", url: null };

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
      const neighbor = rest[Math.max(0, idx - 1)];
      if (id === activeId && neighbor) setActiveId(neighbor.id);
      return rest;
    });
  };

  const openSite = (url: string, title: string) => newTab(url, title);

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
      <div className="flex items-center gap-1 bg-muted px-2 py-1.5">
        <button
          onClick={() => updateActive({ url: null, title: "PuffSearch" })}
          aria-label="PuffSearch home"
          title="PuffSearch home"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Home className="h-4 w-4" />
        </button>
        {tabs.map((t) => {
          const isActive = t.id === active.id;
          return (
            <div
              key={t.id}
              onClick={() => setActiveId(t.id)}
              onAuxClick={(e) => e.button === 1 && closeTab(t.id)}
              className={`group flex h-9 w-52 min-w-0 cursor-default items-center gap-2 rounded-md px-3 text-sm transition-colors ${
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
          className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button
            onClick={toggleBookmark}
            disabled={!active.url}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this site"}
            title={bookmarked ? "Remove bookmark" : "Bookmark this site"}
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-primary disabled:opacity-30"
          >
            {bookmarked ? <CircleDot className="h-4 w-4 text-primary" /> : <Circle className="h-4 w-4" />}
          </button>
          <AccountButton />
        </div>
      </div>

      {/* Bookmarks bar */}
      <div className="flex min-h-8 items-center gap-1 overflow-x-auto border-b border-border bg-card px-2 py-1 text-xs">
        {bookmarks.length === 0 ? (
          <span className="px-2 text-muted-foreground">Click the circle at the top right to bookmark a site</span>
        ) : (
          bookmarks.map((b) => (
            <button
              key={b.url}
              onClick={() => updateActive({ url: b.url, title: b.title })}
              onContextMenu={(e) => {
                e.preventDefault();
                setBookmarkMenu({ x: e.clientX, y: e.clientY, url: b.url });
              }}
              title={b.url}
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
                <SiteFrame url={t.url} title={t.title} onNavigate={(url) =>
                  setTabs((current) => current.map((tab) => tab.id === t.id ? { ...tab, url, title: new URL(url).hostname } : tab))
                } onFail={() =>
                  setTabs((current) => current.map((tab) => tab.id === t.id ? { ...tab, url: null, title: "PuffSearch" } : tab))
                } />
              </div>
            ) : (
              renderHome(openSite)
            )}
          </div>
        ))}
      </div>

      {/* Bookmark right-click menu */}
      {bookmarkMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setBookmarkMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setBookmarkMenu(null);
            }}
          />
          <div
            className="fixed z-50 min-w-36 overflow-hidden rounded-md border border-border bg-popover py-1 text-sm shadow-lg"
            style={{ left: bookmarkMenu.x, top: bookmarkMenu.y }}
          >
            <button
              onClick={() => {
                const bm = bookmarks.find((x) => x.url === bookmarkMenu.url);
                if (bm) {
                  setEditName(bm.title);
                  setEditing(bm);
                }
                setBookmarkMenu(null);
              }}
              className="block w-full px-3 py-1.5 text-left text-popover-foreground hover:bg-secondary"
            >
              Edit
            </button>
            <button
              onClick={() => {
                saveBookmarks(bookmarks.filter((x) => x.url !== bookmarkMenu.url));
                setBookmarkMenu(null);
              }}
              className="block w-full px-3 py-1.5 text-left text-destructive hover:bg-secondary"
            >
              Delete
            </button>
          </div>
        </>
      )}

      {/* Rename dialog */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70" onClick={() => setEditing(null)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              const name = editName.trim() || editing.title;
              saveBookmarks(bookmarks.map((b) => (b.url === editing.url ? { ...b, title: name } : b)));
              setEditing(null);
            }}
            className="w-72 rounded-lg border border-border bg-card p-4 shadow-xl"
          >
            <label htmlFor="bookmark-name" className="mb-2 block text-sm font-medium text-foreground">
              Bookmark name
            </label>
            <input
              id="bookmark-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
              className="mb-3 w-full rounded-md border border-input bg-muted px-3 py-1.5 text-sm text-foreground outline-none focus:border-ring"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary">
                Cancel
              </button>
              <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
