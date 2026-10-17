import { describe, expect, it } from "vitest";

import { markdownToSpeech } from "./speech";

describe("markdownToSpeech", () => {
  it("drops emphasis and inline code marks", () => {
    expect(markdownToSpeech("This is **bold**, *italic*, __strong__ and `code`.")).toBe(
      "This is bold, italic, strong and code.",
    );
  });

  it("keeps underscores inside words", () => {
    expect(markdownToSpeech("Call get_user_name, it is _really_ handy")).toBe(
      "Call get_user_name, it is really handy",
    );
  });

  it("replaces code blocks with a short note", () => {
    expect(markdownToSpeech("Run this:\n\n```js\nconsole.log('hi');\n```\n\nDone.")).toBe(
      "Run this:\n\n(Code block.)\n\nDone.",
    );
  });

  it("handles a code block that is still streaming", () => {
    expect(markdownToSpeech("Here:\n```python\nprint(")).toBe("Here:\n\n(Code block.)");
  });

  it("reads links and images as their text", () => {
    expect(markdownToSpeech("See [the docs](https://example.com) and ![a cat](cat.png).")).toBe(
      "See the docs and a cat.",
    );
  });

  it("removes headings, quotes, bullets, numbers and rules", () => {
    const markdown =
      "## Steps\n\n> Note this\n\n- First\n* Second\n1. Third\n2) Fourth\n\n---\n\nEnd";
    expect(markdownToSpeech(markdown)).toBe(
      "Steps\n\nNote this\n\nFirst\nSecond\nThird\nFourth\n\nEnd",
    );
  });

  it("reads table cells as a list", () => {
    const markdown = "| Name | Age |\n| --- | :-: |\n| Ada | 36 |";
    expect(markdownToSpeech(markdown)).toBe("Name, Age\n\nAda, 36");
  });

  it("drops HTML tags", () => {
    expect(markdownToSpeech("Line one<br>line <b>two</b>")).toBe("Line oneline two");
  });
});
