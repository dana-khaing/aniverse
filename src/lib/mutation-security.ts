import { z } from "zod";

export function enforceMutationRequest(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== new URL(request.url).origin) || fetchSite === "cross-site")
    return Response.json({ error: "untrusted_origin" }, { status: 403 });
  const type = request.headers.get("content-type")?.split(";", 1)[0];
  if (!["GET", "HEAD", "DELETE"].includes(request.method) &&
    type !== "application/json" && type !== "multipart/form-data")
    return Response.json({ error: "unsupported_content_type" }, { status: 415 });
  const length = Number(request.headers.get("content-length") ?? 0);
  const maximum = type === "multipart/form-data" ? 15_728_640 : 1_048_576;
  if (length > maximum)
    return Response.json({ error: "payload_too_large" }, { status: 413 });
  return null;
}

export async function readJsonBody<T extends z.ZodType>(request: Request, schema: T, maxBytes = 1_048_576) {
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes)
    return { response: Response.json({ error: "payload_too_large" }, { status: 413 }) } as const;
  let body: unknown;
  try {
    body = JSON.parse(text || "null");
  } catch {
    return { response: Response.json({ error: "invalid_request" }, { status: 400 }) } as const;
  }
  const parsed = schema.safeParse(body);
  return parsed.success
    ? ({ data: parsed.data as z.infer<T> } as const)
    : ({ response: Response.json({ error: "invalid_request" }, { status: 400 }) } as const);
}
