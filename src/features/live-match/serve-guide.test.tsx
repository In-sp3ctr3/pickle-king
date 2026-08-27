import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ServeGuide } from "./serve-guide";

describe("ServeGuide", () => {
  it("renders one near-side service box, horizontal court anatomy, and player marker", () => {
    const markup = renderToStaticMarkup(
      <ServeGuide
        courtEnd="left"
        isOpeningServe={false}
        receiver={{ name: "Blair", side: "left" }}
        server={{
          name: "Alex",
          side: "left",
          team: "Alex + Bea",
          turn: "second",
        }}
      />,
    );

    expect(markup).toContain("Alex</span> is serving");
    expect(markup).toContain("Blair</span> is receiving");
    expect(markup).toContain("Server 2");
    expect(markup).toContain("Alex / Bea");
    expect(markup).toContain(
      "Full pickleball court. Alex serves from the left service box on the left end.",
    );
    expect(markup).toContain('role="img"');
    expect(markup).toContain("serve-court__net");
    expect(markup).toContain("serve-court__nvz--far");
    expect(markup).toContain("serve-court__nvz--near");
    expect(markup).toContain("serve-court__center-line--far");
    expect(markup).toContain("serve-court__center-line--near");
    expect(
      markup.match(/class="[^"]*serve-court__service-box(?: |")/g),
    ).toHaveLength(4);
    expect(markup.match(/is-active/g)).toHaveLength(1);
    expect(markup).toContain("serve-court__service-box--far-left is-active");
    expect(markup).toContain("serve-court__player-marker--receiver");
    expect(markup).toContain("serve-court__player-marker--near-left");
    expect(markup).toContain("serve-court__player-head");
    expect(markup).toContain("serve-court__player-torso");
    expect(markup.match(/serve-court__player-head/g)).toHaveLength(2);
    expect(markup.match(/serve-court__player-torso/g)).toHaveLength(2);
  });

  it("uses the special opening label only when told the score is 0–0", () => {
    const markup = renderToStaticMarkup(
      <ServeGuide
        courtEnd="right"
        isOpeningServe
        server={{ name: "Alex", side: "right", team: "Aces", turn: "opening" }}
      />,
    );

    expect(markup).toContain("Opening serve · Server 2");
  });

  it("keeps the opening rotation on Server 2 after points are scored", () => {
    const markup = renderToStaticMarkup(
      <ServeGuide
        courtEnd="right"
        isOpeningServe={false}
        server={{ name: "Alex", side: "left", team: "Aces", turn: "opening" }}
      />,
    );

    expect(markup).toContain("Server 2");
    expect(markup).not.toContain("Opening serve ·");
  });
});
