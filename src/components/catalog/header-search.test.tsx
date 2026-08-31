import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HeaderSearch } from "./header-search";

describe("HeaderSearch", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("orders playable results before Kitsu discovery results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          data: [{ slug:"neon-ronin",name:"Neon Ronin",nativeName:"ネオン浪人",studio:"Voltage Frame",tone:"cyan" }],
          discovery: [{ id:"1555",title:"Naruto: Shippuden",nativeTitle:"ナルト 疾風伝",subtype:"TV",posterImage:null }],
          meta: { discoveryAvailable:true },
        }),
      ),
    );
    render(<HeaderSearch locale="en" open onOpen={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name:"Search anime" }), { target:{ value:"neon" } });

    const options = await screen.findAllByRole("option");
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveTextContent("Watch on AniVerse");
    expect(options[0]).toHaveAttribute("href", "/anime/neon-ronin");
    expect(options[1]).toHaveTextContent("Discover via Kitsu");
    expect(options[1]).toHaveAttribute("href", "/en/discover/kitsu/1555");
  });

  it("supports keyboard selection and Escape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          data: [{ slug:"neon-ronin",name:"Neon Ronin",nativeName:"ネオン浪人",studio:"Voltage Frame",tone:"cyan" }],
          discovery: [],
          meta: { discoveryAvailable:false },
        }),
      ),
    );
    const onClose = vi.fn();
    render(<HeaderSearch locale="en" open onOpen={vi.fn()} onClose={onClose} />);
    const input = screen.getByRole("combobox", { name:"Search anime" });
    fireEvent.change(input, { target:{ value:"neon" } });
    await screen.findByRole("option");
    fireEvent.keyDown(input, { key:"ArrowDown" });
    await waitFor(() => expect(screen.getByRole("option")).toHaveAttribute("aria-selected", "true"));
    fireEvent.keyDown(input, { key:"Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
