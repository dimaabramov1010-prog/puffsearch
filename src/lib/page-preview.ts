import sanitizeHtml from "sanitize-html";

export function publicWebsiteUrl(input: string): string {
  const url = new URL(input);
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!/^https?:$/.test(url.protocol) || url.username || url.password ||
    host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") ||
    host === "::1" || host === "::" || /^(fc|fd|fe[89ab])/i.test(host) ||
    /^(0|10|127)\./.test(host) || /^169\.254\./.test(host) || /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host.includes(":")) {
    throw new Error("Enter a public website address.");
  }
  return url.toString();
}

// Third-party scripts require their original origin, cookies and browser state.
// Keep the page's content and styling, then add only our isolated navigation bridge.
export function preparePagePreview(text: string, finalUrl: string): string {
  const safeUrl = publicWebsiteUrl(finalUrl);
  const content = sanitizeHtml(text, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "html", "head", "body", "title", "style", "link", "img", "picture", "source", "form", "input", "select", "option", "button", "label", "textarea"],
    allowedAttributes: {
      "*": ["class", "id", "style", "title", "lang", "dir", "aria-*", "role"],
      a: ["href", "name"],
      link: ["href", "rel", "media"],
      img: ["src", "srcset", "alt", "width", "height", "loading"],
      source: ["src", "srcset", "type", "media"],
      form: ["action", "method"],
      input: ["type", "name", "value", "placeholder", "checked"],
      select: ["name"], option: ["value", "selected"],
      button: ["type", "name", "value"], label: ["for"], textarea: ["name"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowVulnerableTags: true, // Styles are allowed; scripts and embedded frames are not.
    parseStyleAttributes: false,
  });
  const base = `<base href="${sanitizeHtml(safeUrl, { allowedTags: [], allowedAttributes: {} }).replace(/"/g, "&quot;")}">`;
  const bridge = `<script>
    function navigate(url) {
      if (/^https?:$/.test(url.protocol)) parent.postMessage({type: 'puff-navigate', url: url.href}, '*');
    }
    document.addEventListener('click', function(event) {
      var link = event.target.closest && event.target.closest('a[href]');
      if (!link || link.getAttribute('href').startsWith('#')) return;
      event.preventDefault(); navigate(new URL(link.href, document.baseURI));
    });
    document.addEventListener('submit', function(event) {
      event.preventDefault();
      var form = event.target;
      if ((form.method || 'get').toLowerCase() !== 'get') return;
      var url = new URL(form.getAttribute('action') || document.baseURI, document.baseURI);
      new FormData(form).forEach(function(value, key) { if (typeof value === 'string') url.searchParams.append(key, value); });
      navigate(url);
    });
  </script>`;
  return (/<head[^>]*>/i.test(content)
    ? content.replace(/<head[^>]*>/i, (head) => head + base)
    : base + content) + bridge;
}