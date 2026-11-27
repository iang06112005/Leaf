export type BibEntry = {
  key: string;
  type: string;
  title?: string;
  author?: string;
  year?: string;
  source: string;
};

const ENTRY_RE = /@(\w+)\s*\{\s*([^,\s}]+)\s*,/g;

function field(block: string, name: string): string | undefined {
  const re = new RegExp(`${name}\\s*=\\s*[{"]([^}"]+)[}"]`, "i");
  return re.exec(block)?.[1]?.trim();
}

/**
 * Parse BibTeX keys (and light metadata) from file text.
 * Intentionally simple — no online search, local .bib only.
 */
export function parseBibEntries(source: string, filePath: string): BibEntry[] {
  const entries: BibEntry[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(ENTRY_RE);
  while ((match = re.exec(source))) {
    const type = match[1]!.toLowerCase();
    if (type === "string" || type === "preamble" || type === "comment") continue;
    const key = match[2]!;
    const start = match.index;
    const brace = source.indexOf("{", start);
    let depth = 0;
    let end = source.length;
    for (let i = brace; i < source.length; i += 1) {
      const ch = source[i];
      if (ch === "{") depth += 1;
      else if (ch === "}") {
        depth -= 1;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
    const block = source.slice(start, end);
    entries.push({
      key,
      type,
      title: field(block, "title"),
      author: field(block, "author"),
      year: field(block, "year"),
      source: filePath,
    });
  }
  return entries;
}

export function filterBibEntries(entries: BibEntry[], query: string): BibEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (entry) =>
      entry.key.toLowerCase().includes(q) ||
      entry.title?.toLowerCase().includes(q) ||
      entry.author?.toLowerCase().includes(q),
  );
}
