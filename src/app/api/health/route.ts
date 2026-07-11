export function GET() {
  return Response.json({ status: "ok", service: "aniverse", timestamp: new Date().toISOString() });
}
