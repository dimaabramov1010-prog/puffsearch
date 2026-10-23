export type Site = { url: string; title: string };

export const SITES = {
  google: { url: "https://www.google.com/search?igu=1", title: "Google" },
  youtube: { url: "https://www.youtube.com/", title: "YouTube" },
  gemini: { url: "https://gemini.google.com/", title: "Gemini" },
  claude: { url: "https://claude.ai/", title: "Claude" },
  wikipedia: { url: "https://en.wikipedia.org/", title: "Wikipedia" },
} satisfies Record<string, Site>;

const SHORTCUTS: Record<string, Site> = {
  google: SITES.google,
  "google.com": SITES.google,
  youtube: SITES.youtube,
  "youtube.com": SITES.youtube,
  gemini: SITES.gemini,
  "gemini.google.com": SITES.gemini,
  claude: SITES.claude,
  "claude.ai": SITES.claude,
  wikipedia: SITES.wikipedia,
  wikpeidia: SITES.wikipedia,
  "wikipedia.org": SITES.wikipedia,
  "en.wikipedia.org": SITES.wikipedia,
};

const looksLikeUrl = (v: string) =>
  /^https?:\/\//i.test(v) || /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(v);

/** Turns typed text into a site to open, or null when it is just a search query. */
export function resolveSiteInput(input: string): Site | null {
  const v = input.trim();
  if (!v) return null;
  const key = v
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
  if (SHORTCUTS[key]) return SHORTCUTS[key];
  if (looksLikeUrl(v)) {
    const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    try {
      return { url, title: new URL(url).hostname };
    } catch {
      return null;
    }
  }
  return null;
}
