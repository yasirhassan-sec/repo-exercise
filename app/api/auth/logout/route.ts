import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, audit, verifySession } from "@/lib/auth";

export async function POST(req: Request) {
  const jar = await cookies();
  const session = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (session) audit("logout", session.sub);
  const res = NextResponse.redirect(new URL("/login", req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
