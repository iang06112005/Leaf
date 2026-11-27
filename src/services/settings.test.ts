import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  dropProjectFromHistory,
  restoreProjectCandidates,
  type AppSettings,
} from "./settings";

function withHistory(partial: Partial<AppSettings>): AppSettings {
  return { ...DEFAULT_SETTINGS, ...partial };
}

describe("restoreProjectCandidates", () => {
  it("puts last project first and dedupes recent", () => {
    const settings = withHistory({
      lastProjectPath: "/a/last",
      recentProjects: ["/a/last", "/b/other", "/c/third"],
    });
    expect(restoreProjectCandidates(settings)).toEqual(["/a/last", "/b/other", "/c/third"]);
  });

  it("falls back to recent when last is empty", () => {
    const settings = withHistory({
      lastProjectPath: "",
      recentProjects: [" /x ", "/y"],
    });
    expect(restoreProjectCandidates(settings)).toEqual(["/x", "/y"]);
  });
});

describe("dropProjectFromHistory", () => {
  it("clears last and recent entry", () => {
    const settings = withHistory({
      lastProjectPath: "/gone",
      recentProjects: ["/gone", "/keep"],
    });
    expect(dropProjectFromHistory(settings, "/gone")).toEqual(
      withHistory({ lastProjectPath: "", recentProjects: ["/keep"] }),
    );
  });

  it("returns same object when path was not stored", () => {
    const settings = withHistory({
      lastProjectPath: "/keep",
      recentProjects: ["/keep"],
    });
    expect(dropProjectFromHistory(settings, "/missing")).toBe(settings);
  });
});
