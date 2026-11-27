import type { BibEntry } from "./bib";

let entries: BibEntry[] = [];

export function setBibEntries(next: BibEntry[]): void {
  entries = next;
}

export function getBibEntries(): BibEntry[] {
  return entries;
}
