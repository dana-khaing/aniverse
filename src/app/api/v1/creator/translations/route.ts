import { creatorTranslationSchema } from "@/lib/creator-translations";
import { getAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

async function context() {
  if (!isSupabaseConfigured())
    return {
      error: Response.json(
        { error: "Cloud translations are unavailable" },
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
  return { admin: getAdminClient(), membership, user };
}

export async function GET() {
  const access = await context();
  if ("error" in access) return access.error;
  const { data: titles, error: titleError } = await access.admin
    .from("titles")
    .select("id,name,native_name,synopsis,status")
    .eq("creator_team_id", access.membership.team_id)
    .order("created_at");
  if (titleError)
    return Response.json(
      { error: "Title catalog could not be loaded" },
      { status: 500 },
    );
  const { data: translations, error } = titles?.length
    ? await access.admin
        .from("title_translations")
        .select(
          "id,title_id,locale,name,native_name,synopsis,seo_title,seo_description,updated_at",
        )
        .in(
          "title_id",
          titles.map((title) => title.id),
        )
        .order("locale")
    : { data: [], error: null };
  if (error)
    return Response.json(
      { error: "Translations could not be loaded" },
      { status: 500 },
    );
  return Response.json(
    {
      titles: titles ?? [],
      translations: (translations ?? []).map((translation) => ({
        id: translation.id,
        titleId: translation.title_id,
        locale: translation.locale,
        name: translation.name,
        nativeName: translation.native_name ?? "",
        synopsis: translation.synopsis,
        seoTitle: translation.seo_title ?? "",
        seoDescription: translation.seo_description ?? "",
        updatedAt: translation.updated_at,
      })),
    },
    { headers: { "cache-control": "private, no-store" } },
  );
}

export async function PUT(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json(
      { error: "Untrusted translation origin" },
      { status: 403 },
    );
  const access = await context();
  if ("error" in access) return access.error;
  const parsed = creatorTranslationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid translated metadata",
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
  const { data: translation, error } = await access.admin
    .from("title_translations")
    .upsert(
      {
        title_id: title.id,
        locale: parsed.data.locale,
        name: parsed.data.name,
        native_name: parsed.data.nativeName || null,
        synopsis: parsed.data.synopsis,
        seo_title: parsed.data.seoTitle || null,
        seo_description: parsed.data.seoDescription || null,
        created_by: access.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "title_id,locale" },
    )
    .select(
      "id,title_id,locale,name,native_name,synopsis,seo_title,seo_description,updated_at",
    )
    .single();
  if (error || !translation)
    return Response.json(
      { error: "Translation could not be saved" },
      { status: 500 },
    );
  return Response.json({
    translation: {
      id: translation.id,
      titleId: translation.title_id,
      locale: translation.locale,
      name: translation.name,
      nativeName: translation.native_name ?? "",
      synopsis: translation.synopsis,
      seoTitle: translation.seo_title ?? "",
      seoDescription: translation.seo_description ?? "",
      updatedAt: translation.updated_at,
    },
  });
}
