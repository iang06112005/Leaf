import type { Engine } from "./settings";

export type BuildHistoryEntry = {
  id: string;
  at: number;
  engine: Engine;
  rootFile: string;
  ok: boolean;
  cancelled: boolean;
  durationMs: number;
  code: number | null;
};

const KEY = "texflow.buildHistory.v1";
const MAX = 40;

export function loadBuildHistory(): BuildHistoryEntry[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BuildHistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function persistBuildHistory(entries: BuildHistoryEntry[]): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    // sessionStorage may be unavailable
  }
}

export function appendBuildHistory(
  entries: BuildHistoryEntry[],
  entry: Omit<BuildHistoryEntry, "id">,
): BuildHistoryEntry[] {
  const next = [{ ...entry, id: `b${entry.at}` }, ...entries].slice(0, MAX);
  persistBuildHistory(next);
  return next;
}
