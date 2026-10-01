import { config } from "./config";

export type OtpDelivery =
  | { ok: true; shownOnScreen?: string }
  | { ok: false };

/**
 * Sends the one-time code. In production this posts to the SMS gateway configured
 * in MILKIYAT_SMS_WEBHOOK_URL. In demo mode the code is returned for display instead.
 */
export async function deliverOtp(phone: string, code: string): Promise<OtpDelivery> {
  if (config.demoMode) return { ok: true, shownOnScreen: code };

  if (!config.smsWebhookUrl) {
    if (!config.isProduction) {
      console.warn(`[milkiyat] No SMS gateway configured. One-time code for ${phone}: ${code}`);
      return { ok: true };
    }
    console.error("[milkiyat] MILKIYAT_SMS_WEBHOOK_URL is not set; cannot send one-time codes.");
    return { ok: false };
  }

  try {
    const res = await fetch(config.smsWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.smsWebhookToken ? { Authorization: `Bearer ${config.smsWebhookToken}` } : {}),
      },
      body: JSON.stringify({
        to: phone,
        message: `Your Milkiyat sign-in code is ${code}. It expires in 5 minutes. Do not share it with anyone.`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok ? { ok: true } : { ok: false };
  } catch {
    return { ok: false };
  }
}
