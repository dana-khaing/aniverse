"use client";

import {
  Ban,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { type ManagedRole } from "@/lib/admin-users";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type ManagedUser = {
  id: string;
  email: string;
  displayName: string;
  username: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  roles: ManagedRole[];
  suspendedAt: string | null;
  suspensionReason: string | null;
};

const localUsers: ManagedUser[] = [
  {
    id: "e4dfc305-3170-4233-88a2-372bc76bf88d",
    email: "lewisdana04@gmail.com",
    displayName: "Dana Lewis",
    username: "dana",
    createdAt: "2026-07-11T10:20:00Z",
    lastSignInAt: "2026-07-25T09:42:00Z",
    roles: ["viewer", "creator", "admin"],
    suspendedAt: null,
    suspensionReason: null,
  },
  {
    id: "95c19d33-6791-42ca-91be-4d4f7cc34384",
    email: "mika@example.com",
    displayName: "Mika",
    username: "mika_watches",
    createdAt: "2026-07-17T14:10:00Z",
    lastSignInAt: "2026-07-24T21:08:00Z",
    roles: ["viewer", "moderator"],
    suspendedAt: null,
    suspensionReason: null,
  },
  {
    id: "5f64dc39-9b2d-46ed-a8cc-3287399e040b",
    email: "ren@example.com",
    displayName: "Ren",
    username: "ren_frames",
    createdAt: "2026-07-19T08:35:00Z",
    lastSignInAt: null,
    roles: ["viewer"],
    suspendedAt: "2026-07-23T12:00:00Z",
    suspensionReason: "Repeated automated spam after prior warnings.",
  },
];

const roleOptions: ManagedRole[] = ["viewer", "creator", "moderator", "admin"];

export function AdminUserManager() {
  const cloud = isSupabaseConfigured();
  const [users, setUsers] = useState(localUsers);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState(localUsers[0]?.id ?? "");
  const [role, setRole] = useState<ManagedRole>("creator");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!cloud) return;
    setBusy(true);
    const params = new URLSearchParams({
      query: submittedQuery,
      cursor: String(page),
      limit: "20",
    });
    const response = await fetch(`/api/v1/admin/users?${params}`, {
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      users?: ManagedUser[];
      hasMore?: boolean;
      error?: string;
    };
    if (response.ok && data.users) {
      setUsers(data.users);
      setHasMore(Boolean(data.hasMore));
      setSelected((current) =>
        data.users?.some((user) => user.id === current)
          ? current
          : (data.users?.[0]?.id ?? ""),
      );
      setMessage("");
    } else setMessage(data.error ?? "Users could not be loaded.");
    setBusy(false);
  }, [cloud, page, submittedQuery]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const visibleUsers = useMemo(() => {
    if (cloud || !submittedQuery) return users;
    const normalized = submittedQuery.toLocaleLowerCase();
    return users.filter((user) =>
      [user.displayName, user.email, user.username ?? ""]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalized),
    );
  }, [cloud, submittedQuery, users]);
  const active = users.find((user) => user.id === selected);

  function search(event: FormEvent) {
    event.preventDefault();
    const nextQuery = query.trim();
    setPage(1);
    setSubmittedQuery(nextQuery);
    if (!cloud) {
      const normalized = nextQuery.toLocaleLowerCase();
      const first = users.find((user) =>
        [user.displayName, user.email, user.username ?? ""]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalized),
      );
      setSelected(first?.id ?? "");
    }
  }

  async function change(
    action: "grant_role" | "revoke_role" | "suspend" | "restore",
  ) {
    if (!active || reason.trim().length < 10) {
      setMessage("Add a reason of at least 10 characters.");
      return;
    }
    setBusy(true);
    setMessage("");
    const includesRole = action === "grant_role" || action === "revoke_role";
    if (cloud) {
      const response = await fetch("/api/v1/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: active.id,
          action,
          reason,
          ...(includesRole ? { role } : {}),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        setMessage(data.error ?? "Access change could not be saved.");
        setBusy(false);
        return;
      }
    }
    setUsers((current) =>
      current.map((user) => {
        if (user.id !== active.id) return user;
        if (action === "grant_role")
          return {
            ...user,
            roles: [...new Set([...user.roles, role])],
          };
        if (action === "revoke_role")
          return { ...user, roles: user.roles.filter((item) => item !== role) };
        return {
          ...user,
          suspendedAt: action === "suspend" ? new Date().toISOString() : null,
          suspensionReason: action === "suspend" ? reason.trim() : null,
        };
      }),
    );
    setMessage(
      action === "grant_role"
        ? `${role} role granted.`
        : action === "revoke_role"
          ? `${role} role revoked.`
          : action === "suspend"
            ? "Account suspended and sessions blocked."
            : "Account access restored.",
    );
    setReason("");
    setBusy(false);
  }

  return (
    <section className="moderation-panel admin-user-manager">
      <div className="panel-title">
        <div>
          <p>IDENTITY &amp; ACCESS</p>
          <h2>User and role management</h2>
        </div>
        <span>
          <ShieldCheck /> Admin only
        </span>
      </div>
      <form className="admin-user-search" onSubmit={search} role="search">
        <Search />
        <input
          aria-label="Search users"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search email, username, or display name"
        />
        <button disabled={busy}>Search</button>
      </form>
      <div className="admin-user-layout">
        <nav className="admin-user-list" aria-label="User directory">
          {visibleUsers.map((user) => (
            <button
              type="button"
              aria-label={`${user.displayName}, ${user.email}`}
              key={user.id}
              aria-current={selected === user.id}
              onClick={() => {
                setSelected(user.id);
                setMessage("");
              }}
            >
              <span>
                {user.displayName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <div>
                <b>{user.displayName}</b>
                <small>{user.email}</small>
                <i>{user.roles.join(" · ")}</i>
              </div>
              {user.suspendedAt && <em>Suspended</em>}
            </button>
          ))}
          {!visibleUsers.length && (
            <div className="studio-empty">
              <UserCog />
              <h3>No matching users</h3>
            </div>
          )}
          {cloud && (
            <footer>
              <button
                type="button"
                aria-label="Previous user page"
                disabled={page === 1 || busy}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft />
              </button>
              <span>Page {page}</span>
              <button
                type="button"
                aria-label="Next user page"
                disabled={!hasMore || busy}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight />
              </button>
            </footer>
          )}
        </nav>
        {active && (
          <article className="admin-user-detail">
            <header>
              <div>
                <p>{active.username ? `@${active.username}` : "Member"}</p>
                <h3>{active.displayName}</h3>
                <small>{active.email}</small>
              </div>
              <i className={active.suspendedAt ? "danger" : ""}>
                {active.suspendedAt ? "Suspended" : "Active"}
              </i>
            </header>
            <div className="admin-role-chips" aria-label="Current roles">
              {active.roles.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            {active.suspensionReason && (
              <p className="admin-suspension-note">
                <Ban /> {active.suspensionReason}
              </p>
            )}
            <label>
              Role
              <select
                aria-label="Role"
                value={role}
                onChange={(event) => setRole(event.target.value as ManagedRole)}
              >
                {roleOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Change reason
              <textarea
                aria-label="Access change reason"
                value={reason}
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Document why this access change is necessary…"
              />
            </label>
            <div className="admin-access-actions">
              <button
                type="button"
                disabled={busy || active.roles.includes(role)}
                onClick={() => void change("grant_role")}
              >
                <ShieldCheck /> Grant role
              </button>
              <button
                type="button"
                disabled={
                  busy || role === "viewer" || !active.roles.includes(role)
                }
                onClick={() => void change("revoke_role")}
              >
                Revoke role
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void change(active.suspendedAt ? "restore" : "suspend")
                }
              >
                {busy ? (
                  <LoaderCircle className="spin" />
                ) : active.suspendedAt ? (
                  <RotateCcw />
                ) : (
                  <Ban />
                )}
                {active.suspendedAt ? "Restore account" : "Suspend account"}
              </button>
            </div>
            <small className="admin-access-warning">
              Every change is permanent in the audit history. You cannot remove
              the baseline viewer role, your own admin role, or the last
              administrator.
            </small>
          </article>
        )}
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
