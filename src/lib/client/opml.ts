export interface OpmlOutline {
  title: string;
  xmlUrl: string;
  htmlUrl?: string;
  category?: string;
}

/**
 * Generate standard OPML 2.0 XML string from user subscriptions.
 */
export function exportToOpml(
  subscriptions: { name: string; feedUrl: string; siteUrl?: string; category?: string }[]
): string {
  const dateStr = new Date().toUTCString();

  const outlines = subscriptions
    .map((s) => {
      const cleanTitle = (s.name || "Blog").replace(/["&<>]/g, "");
      const cleanXmlUrl = (s.feedUrl || "").replace(/["&<>]/g, "");
      const cleanHtmlUrl = (s.siteUrl || "").replace(/["&<>]/g, "");
      const cleanCategory = (s.category || "Indie Web").replace(/["&<>]/g, "");
      return `    <outline text="${cleanTitle}" title="${cleanTitle}" type="rss" xmlUrl="${cleanXmlUrl}" htmlUrl="${cleanHtmlUrl}" category="${cleanCategory}" />`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Small Web Reader Subscriptions</title>
    <dateCreated>${dateStr}</dateCreated>
  </head>
  <body>
${outlines}
  </body>
</opml>`;
}

/**
 * Parse an OPML file string into an array of outlines.
 */
export function parseOpml(opmlText: string): OpmlOutline[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(opmlText, "text/xml");
  const outlines: OpmlOutline[] = [];

  const nodes = Array.from(doc.querySelectorAll("outline[xmlUrl], outline[xmlurl]"));
  for (const node of nodes) {
    const xmlUrl = node.getAttribute("xmlUrl") || node.getAttribute("xmlurl");
    if (!xmlUrl) continue;

    const title =
      node.getAttribute("text") ||
      node.getAttribute("title") ||
      new URL(xmlUrl).hostname;
    const htmlUrl = node.getAttribute("htmlUrl") || node.getAttribute("htmlurl") || "";
    const category = node.getAttribute("category") || "Imported";

    outlines.push({
      title,
      xmlUrl,
      htmlUrl,
      category,
    });
  }

  return outlines;
}

/**
 * Trigger browser file download of OPML file.
 */
export function triggerOpmlDownload(opmlContent: string, filename: string = "subscriptions.opml"): void {
  const blob = new Blob([opmlContent], { type: "text/xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
