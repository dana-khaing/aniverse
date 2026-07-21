import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { LocalPlayer } from "./local-player";

describe("local player", () => {
  beforeEach(() => localStorage.clear());

  it("stores progress and favorite state", () => {
    render(
      <LocalPlayer
        slug="neon-ronin"
        title="Neon Ronin"
        episode={1}
        totalEpisodes={8}
      />,
    );

    fireEvent.change(screen.getByLabelText("Playback position"), {
      target: { value: "720" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Favorite" }));

    const stored = localStorage.getItem("aniverse.library");
    expect(stored).toContain('"position":720');
    expect(stored).toContain('"neon-ronin"');
  });

  it("offers chapters, tracks, subtitle settings, and autoplay",()=>{render(<LocalPlayer slug="neon-ronin" title="Neon Ronin" episode={1} totalEpisodes={8}/>);expect(screen.getByRole("button",{name:/Opening/})).toBeInTheDocument();expect(screen.getByLabelText("Video quality")).toBeInTheDocument();expect(screen.getByLabelText("Audio track")).toBeDisabled();expect(screen.getByLabelText("Subtitle size")).toBeInTheDocument();expect(screen.getByLabelText("Autoplay next")).toBeChecked();expect(screen.getByRole("button",{name:"Mute"})).toBeInTheDocument();});
});
