import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NumberFlowProps } from "@number-flow/react";
import { AnimatedNumber } from "./animated-number";

const numberFlowProps = vi.hoisted(() => [] as NumberFlowProps[]);

vi.mock("@number-flow/react", () => ({
  default: (props: NumberFlowProps) => {
    numberFlowProps.push(props);
    return <span>{props.value}</span>;
  },
}));

describe("AnimatedNumber", () => {
  beforeEach(() => numberFlowProps.splice(0));

  it("lets score changes choose their direction from the value delta", () => {
    renderToStaticMarkup(<AnimatedNumber value={7} />);

    expect(numberFlowProps.at(-1)).not.toHaveProperty("trend");
    expect(numberFlowProps.at(-1)).not.toHaveProperty("plugins");
  });

  it("supports a bounded downward clock reel", () => {
    renderToStaticMarkup(
      <AnimatedNumber digits={{ 1: { max: 5 } }} trend={-1} value={59} />,
    );

    expect(numberFlowProps.at(-1)).toMatchObject({
      digits: { 1: { max: 5 } },
      trend: -1,
      value: 59,
    });
  });
});
