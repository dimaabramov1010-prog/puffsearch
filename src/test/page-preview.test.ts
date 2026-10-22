import { describe, expect, it } from "vitest";
import { preparePagePreview, publicWebsiteUrl } from "../lib/page-preview";

describe("Website previews", () => {
  it("removes third-party scripts that rely on cookies or history", () => {
    const html = preparePagePreview('<head><script>document.cookie; history.replaceState(null,"","/srcdoc")</script></head><body onload="throwError()"><a href="/wiki/Fish">Fish</a></body>', "https://en.wikipedia.org");
    expect(html).not.toContain("document.cookie");
    expect(html).not.toContain("history.replaceState");
    expect(html).not.toContain("onload=");
    expect(html).toContain('href="/wiki/Fish"');
    expect(html).toContain("puff-navigate");
  });

  it("removes frames, base overrides and refresh navigation", () => {
    const html = preparePagePreview('<base href="https://evil.example"><meta http-equiv="refresh" content="0;url=https://evil.example"><iframe src="https://example.com"></iframe>', "https://example.com/page");
    expect(html).not.toContain("evil.example");
    expect(html).not.toContain("<iframe");
    expect(html).toContain('<base href="https://example.com/page">');
  });

  it.each(["http://127.0.0.1", "http://10.0.0.1", "http://169.254.169.254", "http://localhost", "http://[::1]", "file:///etc/passwd", "https://user:pass@example.com"])("rejects nonpublic target %s", (url) => {
    expect(() => publicWebsiteUrl(url)).toThrow();
  });
});