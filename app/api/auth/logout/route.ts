import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { audit } from "@/lib/audit";
import { revokeSession, sessionCookieName, verifySession } from "@/lib/auth";
import { clientIp, sameOrigin } from "@/lib/request";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const jar = await cookies();
  const session = verifySession(jar.get(sessionCookieName())?.value);
  if (session) {
    revokeSession(session);
    audit("logout", session.sub, clientIp(req));
  }
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.delete(sessionCookieName());
  return res;
}
