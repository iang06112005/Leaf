export type OutlineEntry = {
  id: string;
  level: number;
  title: string;
  line: number;
  command: string;
};

const SECTION_RE =
  /^\\(part|chapter|section|subsection|subsubsection|paragraph|subparagraph)\*?\{([^{}]*)\}/;

const LEVELS: Record<string, number> = {
  part: 0,
  chapter: 1,
  section: 2,
  subsection: 3,
  subsubsection: 4,
  paragraph: 5,
  subparagraph: 6,
};

/**
 * Extract a simple section outline from TeX source (open buffer).
 * Ignores commented lines and nested braces beyond a single title group.
 */
export function parseTexOutline(source: string): OutlineEntry[] {
  const lines = source.split(/\r?\n/);
  const entries: OutlineEntry[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? "";
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("%")) continue;
    const match = SECTION_RE.exec(trimmed);
    if (!match) continue;
    const command = match[1]!;
    const title = (match[2] ?? "").trim() || "(untitled)";
    entries.push({
      id: `o${entries.length}-${i + 1}`,
      level: LEVELS[command] ?? 2,
      title,
      line: i + 1,
      command,
    });
  }

  return entries;
}
