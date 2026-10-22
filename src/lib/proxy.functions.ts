import { createServerFn } from "@tanstack/react-start";
import { preparePagePreview, publicWebsiteUrl } from "./page-preview";

export const fetchPage = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => {
    return { url: publicWebsiteUrl(d.url) };
  })
  .handler(async ({ data }) => {
    try {
      let url = data.url;
      let res: Response | undefined;
      for (let attempt = 0; attempt < 6; attempt++) {
        res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
          Accept: "text/html,*/*",
        },
          redirect: "manual",
          signal: AbortSignal.timeout(15000),
        });
        if (![301, 302, 303, 307, 308].includes(res.status)) break;
        const location = res.headers.get("location");
        if (!location) break;
        url = publicWebsiteUrl(new URL(location, url).href);
      }
      if (!res?.ok) {
        return { html: "", error: "This website blocks page previews or is temporarily unavailable." };
      }
      if (!(res.headers.get("content-type") || "").includes("text/html")) {
        return { html: "", error: "This address isn't a web page Puff can display." };
      }
      const text = await res.text();
      const html = preparePagePreview(text, url);
      return { html, error: undefined as string | undefined };
    } catch (e) {
      console.error("Website preview failed", e instanceof Error ? e.message : "Unknown failure");
      return { html: "", error: "This site didn't respond. Try again in a moment." };
    }
  });
