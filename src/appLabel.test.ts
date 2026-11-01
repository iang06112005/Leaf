import { describe, expect, it } from "vitest";
import { appLabel } from "./appLabel";

describe("appLabel", () => {
  it("shows the application name and package version", () => {
    expect(appLabel()).toBe("TexFlow 0.1.0");
  });
});
