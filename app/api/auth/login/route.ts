import { NextResponse } from "next/server";
import { startLogin } from "@/lib/auth";
import { clientIp, sameOrigin } from "@/lib/request";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const result = await startLogin(str(body?.cnic).trim(), str(body?.password), str(body?.role), clientIp(req));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({
    challengeId: result.challengeId,
    maskedPhone: result.maskedPhone,
    ...(result.demoOtp ? { demoOtp: result.demoOtp } : {}),
  });
}
