import { describe, expect, it } from "vitest";
import { filterBibEntries, parseBibEntries } from "./bib";

const SAMPLE = `
@book{knuth1984,
  author    = {Knuth, Donald E.},
  title     = {The TeXbook},
  year      = {1984}
}

@article{lamport94,
  author = {Lamport, Leslie},
  title = {LaTeX},
  year = {1994}
}
`;

describe("parseBibEntries", () => {
  it("extracts keys and fields", () => {
    const entries = parseBibEntries(SAMPLE, "refs.bib");
    expect(entries.map((e) => e.key)).toEqual(["knuth1984", "lamport94"]);
    expect(entries[0]?.title).toBe("The TeXbook");
  });

  it("filters by query", () => {
    const entries = parseBibEntries(SAMPLE, "refs.bib");
    expect(filterBibEntries(entries, "knuth").map((e) => e.key)).toEqual(["knuth1984"]);
  });
});
