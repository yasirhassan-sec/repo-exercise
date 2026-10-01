import { NextResponse } from "next/server";
import { startLogin } from "@/lib/auth";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { cnic?: unknown; password?: unknown; role?: unknown }
    | null;
  const result = startLogin(
    typeof body?.cnic === "string" ? body.cnic.trim() : "",
    typeof body?.password === "string" ? body.password : "",
    typeof body?.role === "string" ? body.role : "",
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    challengeId: result.challengeId,
    maskedPhone: result.maskedPhone,
    devOtp: result.devOtp,
  });
}
