import { randomUUID } from "node:crypto";
import {
  artworkFileError,
  artworkMetadataSchema,
  safeArtworkFilename,
  trailerReferenceSchema,
} from "@/lib/creator-title-assets";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function context() {
  if (!isSupabaseConfigured())
    return {
      error: Response.json(
        { error: "Cloud title assets are unavailable" },
        { status: 503 },
      ),
    };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return {
      error: Response.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  const { data: membership } = await supabase
    .from("creator_team_memberships")
    .select("team_id,role")
    .eq("user_id", user.id)
    .in("role", ["owner", "editor"])
    .order("joined_at")
    .limit(1)
    .maybeSingle();
  if (!membership)
    return {
      error: Response.json(
        { error: "Creator editing permission required" },
        { status: 403 },
      ),
    };
  return { supabase, admin: getAdminClient(), user, membership };
}

async function teamTitles(
  admin: ReturnType<typeof getAdminClient>,
  teamId: string,
) {
  return admin
    .from("titles")
    .select("id,name,slug,status")
    .eq("creator_team_id", teamId)
    .order("created_at");
}

function presentAsset(
  admin: ReturnType<typeof getAdminClient>,
  asset: {
    id: string;
    title_id: string;
    kind: string;
    storage_path: string | null;
    source_url: string | null;
    mime_type: string | null;
    bytes: number | null;
    updated_at: string;
  },
) {
  return {
    id: asset.id,
    titleId: asset.title_id,
    kind: asset.kind,
    url: asset.storage_path
      ? admin.storage.from("title-artwork").getPublicUrl(asset.storage_path)
          .data.publicUrl
      : asset.source_url,
    mimeType: asset.mime_type,
    bytes: asset.bytes,
    updatedAt: asset.updated_at,
  };
}

export async function GET() {
  const access = await context();
  if ("error" in access) return access.error;
  const { data: titles, error: titleError } = await teamTitles(
    access.admin,
    access.membership.team_id,
  );
  if (titleError)
    return Response.json(
      { error: "Title catalog could not be loaded" },
      { status: 500 },
    );
  const { data: assets, error } = titles?.length
    ? await access.admin
        .from("title_assets")
        .select(
          "id,title_id,kind,storage_path,source_url,mime_type,bytes,updated_at",
        )
        .in(
          "title_id",
          titles.map((title) => title.id),
        )
        .order("updated_at", { ascending: false })
    : { data: [], error: null };
  if (error)
    return Response.json(
      { error: "Title assets could not be loaded" },
      { status: 500 },
    );
  return Response.json(
    {
      titles: titles ?? [],
      assets: (assets ?? []).map((asset) => presentAsset(access.admin, asset)),
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Untrusted asset origin" }, { status: 403 });
  const access = await context();
  if ("error" in access) return access.error;
  const json = request.headers
    .get("content-type")
    ?.startsWith("application/json");
  if (json) {
    const parsed = trailerReferenceSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success)
      return Response.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid trailer reference",
        },
        { status: 400 },
      );
    const { data: title } = await access.admin
      .from("titles")
      .select("id")
      .eq("id", parsed.data.titleId)
      .eq("creator_team_id", access.membership.team_id)
      .maybeSingle();
    if (!title)
      return Response.json({ error: "Title not found" }, { status: 404 });
    const { data: asset, error } = await access.admin
      .from("title_assets")
      .upsert(
        {
          title_id: title.id,
          kind: "trailer",
          source_url: parsed.data.sourceUrl,
          storage_path: null,
          mime_type: null,
          bytes: null,
          created_by: access.user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "title_id,kind" },
      )
      .select(
        "id,title_id,kind,storage_path,source_url,mime_type,bytes,updated_at",
      )
      .single();
    if (error || !asset)
      return Response.json(
        { error: "Trailer reference could not be saved" },
        { status: 500 },
      );
    return Response.json(
      { asset: presentAsset(access.admin, asset) },
      { status: 201 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const parsed = artworkMetadataSchema.safeParse({
    titleId: form?.get("titleId"),
    kind: form?.get("kind"),
  });
  if (!(file instanceof File) || !parsed.success) {
    return Response.json({ error: "Invalid artwork upload" }, { status: 400 });
  }
  const fileError = artworkFileError(file);
  if (fileError) return Response.json({ error: fileError }, { status: 400 });
  const { data: title } = await access.admin
    .from("titles")
    .select("id")
    .eq("id", parsed.data.titleId)
    .eq("creator_team_id", access.membership.team_id)
    .maybeSingle();
  if (!title)
    return Response.json({ error: "Title not found" }, { status: 404 });
  const { data: previous } = await access.admin
    .from("title_assets")
    .select("storage_path")
    .eq("title_id", title.id)
    .eq("kind", parsed.data.kind)
    .maybeSingle();
  const path = `${access.user.id}/${title.id}/${parsed.data.kind}-${randomUUID()}-${safeArtworkFilename(file.name)}`;
  const { error: uploadError } = await access.supabase.storage
    .from("title-artwork")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError)
    return Response.json(
      { error: "Artwork file could not be stored" },
      { status: 500 },
    );
  const { data: asset, error } = await access.admin
    .from("title_assets")
    .upsert(
      {
        title_id: title.id,
        kind: parsed.data.kind,
        storage_path: path,
        source_url: null,
        mime_type: file.type,
        bytes: file.size,
        created_by: access.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "title_id,kind" },
    )
    .select(
      "id,title_id,kind,storage_path,source_url,mime_type,bytes,updated_at",
    )
    .single();
  if (error || !asset) {
    await access.supabase.storage.from("title-artwork").remove([path]);
    return Response.json(
      { error: "Artwork metadata could not be saved" },
      { status: 500 },
    );
  }
  if (previous?.storage_path)
    await access.admin.storage
      .from("title-artwork")
      .remove([previous.storage_path]);
  return Response.json(
    { asset: presentAsset(access.admin, asset) },
    { status: 201 },
  );
}

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Untrusted deletion origin" },
      { status: 403 },
    );
  const access = await context();
  if ("error" in access) return access.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id))
    return Response.json({ error: "Invalid title asset" }, { status: 400 });
  const { data: asset } = await access.admin
    .from("title_assets")
    .select("id,storage_path,titles!inner(creator_team_id)")
    .eq("id", id)
    .maybeSingle();
  const teamId = (
    asset?.titles as unknown as { creator_team_id: string | null } | undefined
  )?.creator_team_id;
  if (!asset || teamId !== access.membership.team_id)
    return Response.json({ error: "Title asset not found" }, { status: 404 });
  const { error } = await access.admin
    .from("title_assets")
    .delete()
    .eq("id", id);
  if (error)
    return Response.json(
      { error: "Title asset could not be deleted" },
      { status: 500 },
    );
  if (asset.storage_path)
    await access.admin.storage
      .from("title-artwork")
      .remove([asset.storage_path]);
  return new Response(null, { status: 204 });
}
