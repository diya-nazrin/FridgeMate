// Platform healthcheck. Deliberately dependency-free: fridgemate is a pure
// client-side app, so there is no database or upstream service to probe.
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: true, storage: "localStorage", mode: "client-only" });
}
