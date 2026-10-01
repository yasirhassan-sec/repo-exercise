import { NextResponse } from "next/server";
import { completeLogin, sessionCookieName, sessionCookieOptions } from "@/lib/auth";
import { clientIp, sameOrigin } from "@/lib/request";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const result = completeLogin(str(body?.challengeId), str(body?.otp).replace(/\s/g, ""), clientIp(req));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookieName(), result.token, sessionCookieOptions());
  return res;
}
