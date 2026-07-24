import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PartyLobbyControls } from "./party-lobby-controls";

describe("PartyLobbyControls", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lets a host invite, promote, remove, and end participants", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            invitation: {
              id: "invite-1",
              email: "friend@example.com",
              role: "viewer",
              status: "pending",
              expires_at: "2026-08-01T00:00:00Z",
            },
          }),
          { status: 201 },
        ),
      )
      .mockResolvedValue(new Response(JSON.stringify({ status: "ended" })));
    vi.stubGlobal("fetch", fetchMock);
    const onStatus = vi.fn();
    render(
      <PartyLobbyControls
        partyId="party-1"
        inviteCode="MOON123"
        role="host"
        status="live"
        members={[
          {
            user_id: "user-1",
            role: "viewer",
            profiles: { display_name: "Mika" },
          },
        ]}
        invitations={[]}
        onStatus={onStatus}
      />,
    );

    fireEvent.change(screen.getByLabelText("Invite email"), {
      target: { value: "friend@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send invite" }));
    expect(await screen.findByText("1 pending invitation")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "End party" }));
    await waitFor(() => expect(onStatus).toHaveBeenCalledWith("ended"));
    expect(
      screen.getByRole("button", { name: "Toggle role for Mika" }),
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Remove Mika" })).toBeEnabled();
  });

  it("keeps participant management hidden from viewers", () => {
    render(
      <PartyLobbyControls
        partyId="party-1"
        inviteCode="MOON123"
        role="viewer"
        status="live"
        members={[]}
        invitations={[]}
        onStatus={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("Invite email")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "End party" }),
    ).not.toBeInTheDocument();
  });
});
