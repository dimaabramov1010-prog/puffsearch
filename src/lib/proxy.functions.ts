import { createServerFn } from "@tanstack/react-start";

export const fetchPage = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => {
    const u = new URL(d.url);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("Bad URL");
    return { url: u.toString() };
  })
  .handler(async ({ data }) => {
    try {
      const res = await fetch(data.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          Accept: "text/html,*/*",
        },
        redirect: "follow",
      });
      const text = await res.text();
      const base = `<base href="${res.url || data.url}" target="_blank">`;
      const html = /<head[^>]*>/i.test(text)
        ? text.replace(/<head[^>]*>/i, (m) => m + base)
        : base + text;
      return { html, error: undefined as string | undefined };
    } catch (e) {
      return { html: "", error: e instanceof Error ? e.message : "Failed to load" };
    }
  });
