import { NextResponse } from "next/server";
import { SESSION_COOKIE, completeLogin, sessionCookieOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { challengeId?: unknown; otp?: unknown }
    | null;
  const result = completeLogin(
    typeof body?.challengeId === "string" ? body.challengeId : "",
    typeof body?.otp === "string" ? body.otp.replace(/\s/g, "") : "",
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const res = NextResponse.json({ role: result.session.role });
  res.cookies.set(SESSION_COOKIE, result.token, sessionCookieOptions());
  return res;
}
