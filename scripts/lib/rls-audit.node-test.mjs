import assert from "node:assert/strict";
import test from "node:test";
import { auditRlsSchema } from "./rls-audit.mjs";

const secureSchema = `
  create table public.notes(id uuid primary key, owner_id uuid);
  alter table public.notes enable row level security;
  create policy "owners update notes" on public.notes for update to authenticated
    using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
  create view public.safe_notes with (security_invoker = true) as select id from public.notes;
  create function public.safe_write(p_id uuid) returns void language plpgsql
    security definer set search_path = '' as $$ begin return; end; $$;
  revoke execute on function public.safe_write(uuid) from public, anon;
`;

test("accepts an RLS schema with bounded privileged objects", () => {
  assert.deepEqual(auditRlsSchema(secureSchema).findings, []);
});

test("reports each unsafe semantic pattern", () => {
  const result = auditRlsSchema(`
    create table public.secrets(id uuid);
    create view public.leaked_secrets as select * from public.secrets;
    create policy "unsafe update" on public.secrets for update using (auth.role() = 'authenticated');
    create function public.unsafe_write() returns void language plpgsql security definer
      as $$ begin return; end; $$;
  `);
  assert.deepEqual(
    new Set(result.findings.map((finding) => finding.rule)),
    new Set([
      "table-rls-enabled",
      "avoid-auth-role-function",
      "view-security-invoker",
      "update-policy-with-check",
      "definer-search-path",
      "definer-revoke-public",
    ]),
  );
});
