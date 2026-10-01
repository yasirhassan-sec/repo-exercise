import { NextResponse } from "next/server";
import { LANG_COOKIE } from "@/lib/i18n";
import { sameOrigin } from "@/lib/request";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const form = await req.formData();
  const lang = form.get("lang") === "ur" ? "ur" : "en";
  const next = String(form.get("next") ?? "/");
  // Only same-site paths, never "//host" or absolute URLs.
  const target = /^\/(?!\/)[\w\-/?=&#.%]*$/.test(next) ? next : "/";
  const res = NextResponse.redirect(new URL(target, req.url), 303);
  res.cookies.set(LANG_COOKIE, lang, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365, httpOnly: true });
  return res;
}
