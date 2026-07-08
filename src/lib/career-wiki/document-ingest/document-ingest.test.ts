import { describe, expect, it } from "vitest";

import { assertSafeDocumentInput } from "./guards";
import { parseHtmlDocument } from "./html-adapter";
import { parsePlainTextDocument } from "./plain-text-adapter";

describe("document ingest", () => {
  it("blocks sensitive filenames", () => {
    expect(() =>
      assertSafeDocumentInput({
        file_name: ".env",
        mime_type: "text/plain",
        extension: ".env",
        size_bytes: 12,
        source_type: "upload",
        purpose: "jd",
      }),
    ).toThrow("不支持的文件格式");
  });

  it("parses plain markdown", () => {
    const parsed = parsePlainTextDocument({
      input: {
        file_name: "jd.md",
        mime_type: "text/markdown",
        extension: ".md",
        size_bytes: 42,
        source_type: "pasted_text",
        purpose: "jd",
      },
      text: "# Test JD\n\n- TypeScript\n- React",
    });

    expect(parsed.title).toBe("Test JD");
    expect(parsed.markdown).toContain("TypeScript");
  });

  it("normalizes html into markdown preview", () => {
    const parsed = parseHtmlDocument({
      input: {
        file_name: "jd.html",
        mime_type: "text/html",
        extension: ".html",
        size_bytes: 100,
        source_type: "upload",
        purpose: "jd",
      },
      text: "<h1>JD</h1><ul><li>React</li><li>Node.js</li></ul><script>bad()</script>",
    });

    expect(parsed.markdown).toContain("# JD");
    expect(parsed.markdown).toContain("- React");
    expect(parsed.markdown).not.toContain("bad()");
  });
});
