import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { CheckCircleIcon, CheckIcon, ChevronDownIcon, CloseIcon, MinusIcon, PlusIcon, StarIcon } from "./icons";

const icons = { StarIcon, CheckIcon, CheckCircleIcon, ChevronDownIcon, CloseIcon, MinusIcon, PlusIcon };

describe("icons", () => {
  it.each(Object.entries(icons))("%s is hidden from assistive technology and takes a class", async (_, Icon) => {
    const screen = await render(<Icon className="size-4" />);
    const svg = screen.container.querySelector("svg");

    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("class")).toBe("size-4");
  });
});
