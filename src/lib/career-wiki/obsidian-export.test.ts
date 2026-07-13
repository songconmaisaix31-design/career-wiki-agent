import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveUniqueMarkdownPath } from "./obsidian-export";

describe("career wiki obsidian export", () => {
  it("uses a timestamped filename instead of overwriting", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "career-wiki-export-"));
    const target = path.join(dir, "profile.md");
    writeFileSync(target, "existing", "utf8");

    const next = resolveUniqueMarkdownPath(target, new Date("2026-07-08T06:07:08Z"));

    expect(next).not.toBe(target);
    expect(path.basename(next)).toBe("profile-20260708-140708.md");
  });
});
