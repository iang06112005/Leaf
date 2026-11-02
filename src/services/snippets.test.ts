import { describe, expect, it } from "vitest";
import { filterSnippets, findSnippet, LATEX_SNIPPETS } from "./snippets";

describe("latex snippets", () => {
  it("exposes the required triggers", () => {
    expect(LATEX_SNIPPETS.map((item) => item.trigger).sort()).toEqual(
      ["cite", "eq", "fig", "itz", "sec"].sort(),
    );
  });

  it("finds by id or trigger", () => {
    expect(findSnippet("section")?.trigger).toBe("sec");
    expect(findSnippet("fig")?.id).toBe("figure");
  });

  it("filters by query", () => {
    expect(filterSnippets("fig").map((item) => item.id)).toEqual(["figure"]);
    expect(filterSnippets("").length).toBe(LATEX_SNIPPETS.length);
  });
});
