"use client";

import { Copy, Crown, MailPlus, Shield, UserMinus, Users } from "lucide-react";
import { useState } from "react";
import { canManageParty } from "@/lib/watch-party";

export type PartyMember = {
  user_id: string;
  role: "host" | "moderator" | "viewer";
  profiles?: { username?: string; display_name?: string | null } | null;
};

export type PartyInvitation = {
  id: string;
  email: string;
  role: "moderator" | "viewer";
  status: string;
  expires_at: string;
};

export function PartyLobbyControls({
  partyId,
  inviteCode,
  role,
  status,
  members,
  invitations,
  onStatus,
}: {
  partyId: string;
  inviteCode: string;
  role: "host" | "moderator" | "viewer";
  status: "scheduled" | "live" | "ended";
  members: PartyMember[];
  invitations: PartyInvitation[];
  onStatus: (status: "scheduled" | "live" | "ended") => void;
}) {
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"moderator" | "viewer">(
    "viewer",
  );
  const [pendingInvites, setPendingInvites] = useState(invitations);
  const [participants, setParticipants] = useState(members);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const manager = canManageParty(role);

  async function action(body: object) {
    return fetch(`/api/v1/parties/${encodeURIComponent(partyId)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const response = await action({
      action: "invite",
      email,
      role: inviteRole,
    });
    const data = (await response.json().catch(() => ({}))) as {
      invitation?: PartyInvitation;
      error?: string;
    };
    if (response.ok && data.invitation) {
      setPendingInvites((current) => [data.invitation!, ...current]);
      setEmail("");
      setMessage("Invitation created.");
    } else setMessage(data.error ?? "Invitation failed.");
    setBusy(false);
  }

  async function lifecycle(next: "scheduled" | "live" | "ended") {
    setBusy(true);
    const response = await action({ action: "lifecycle", status: next });
    if (response.ok) onStatus(next);
    else setMessage("Only the host can change party status.");
    setBusy(false);
  }

  async function updateMember(
    userId: string,
    nextRole?: "moderator" | "viewer",
  ) {
    setBusy(true);
    const response = await action(
      nextRole
        ? { action: "member-role", userId, role: nextRole }
        : { action: "remove-member", userId },
    );
    if (response.ok)
      setParticipants((current) =>
        nextRole
          ? current.map((member) =>
              member.user_id === userId
                ? { ...member, role: nextRole }
                : member,
            )
          : current.filter((member) => member.user_id !== userId),
      );
    else setMessage("Participant update failed.");
    setBusy(false);
  }

  return (
    <section className="party-lobby" aria-label="Party management">
      <div className="party-lifecycle">
        <b>{status}</b>
        {role === "host" && status !== "live" && (
          <button disabled={busy} onClick={() => void lifecycle("live")}>
            Start party
          </button>
        )}
        {role === "host" && status === "live" && (
          <button disabled={busy} onClick={() => void lifecycle("ended")}>
            End party
          </button>
        )}
      </div>
      <div className="party-code">
        <span>
          Invite code <b>{inviteCode}</b>
        </span>
        <button
          aria-label="Copy invite code"
          onClick={() => void navigator.clipboard?.writeText(inviteCode)}
        >
          <Copy />
        </button>
      </div>
      <h3>
        <Users /> Participants
      </h3>
      <div className="party-members">
        {participants.map((member) => (
          <article key={member.user_id}>
            <span>
              {member.role === "host" ? (
                <Crown />
              ) : member.role === "moderator" ? (
                <Shield />
              ) : (
                <Users />
              )}
            </span>
            <b>
              {member.profiles?.display_name ??
                member.profiles?.username ??
                "Party member"}
              <small>{member.role}</small>
            </b>
            {role === "host" && member.role !== "host" && (
              <span>
                <button
                  aria-label={`Toggle role for ${member.profiles?.display_name ?? "participant"}`}
                  disabled={busy}
                  onClick={() =>
                    void updateMember(
                      member.user_id,
                      member.role === "moderator" ? "viewer" : "moderator",
                    )
                  }
                >
                  <Shield />
                </button>
                <button
                  aria-label={`Remove ${member.profiles?.display_name ?? "participant"}`}
                  disabled={busy}
                  onClick={() => void updateMember(member.user_id)}
                >
                  <UserMinus />
                </button>
              </span>
            )}
          </article>
        ))}
      </div>
      {manager && (
        <form onSubmit={(event) => void invite(event)}>
          <h3>
            <MailPlus /> Invite someone
          </h3>
          <input
            aria-label="Invite email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="friend@example.com"
          />
          <select
            aria-label="Invite role"
            value={inviteRole}
            onChange={(event) =>
              setInviteRole(event.target.value as "moderator" | "viewer")
            }
          >
            <option value="viewer">Viewer</option>
            <option value="moderator">Moderator</option>
          </select>
          <button disabled={busy}>Send invite</button>
        </form>
      )}
      {pendingInvites.length > 0 && (
        <p>
          {pendingInvites.length} pending invitation
          {pendingInvites.length === 1 ? "" : "s"}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
