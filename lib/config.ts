import path from "node:path";

/**
 * Deployment settings, read from environment variables on the server.
 * See .env.example for the full list.
 */
export const config = {
  /** Name of the department operating the portal, shown in the header and footer. */
  orgName: process.env.MILKIYAT_ORG_NAME || "[Department name]",
  orgNameUr: process.env.MILKIYAT_ORG_NAME_UR || "[محکمے کا نام]",
  helpline: process.env.MILKIYAT_HELPLINE || "[Helpline number]",
  officeHours: process.env.MILKIYAT_OFFICE_HOURS || "[Office hours]",
  /** Demo mode seeds test accounts and shows one-time codes on screen. Never enable in production. */
  demoMode: process.env.MILKIYAT_DEMO_MODE === "true",
  /** Folder holding users.json and the audit log. */
  dataDir: process.env.MILKIYAT_DATA_DIR || path.join(process.cwd(), "data"),
  /** Only trust X-Forwarded-For when the app runs behind a known reverse proxy. */
  trustProxy: process.env.MILKIYAT_TRUST_PROXY === "true",
  smsWebhookUrl: process.env.MILKIYAT_SMS_WEBHOOK_URL || "",
  smsWebhookToken: process.env.MILKIYAT_SMS_WEBHOOK_TOKEN || "",
  isProduction: process.env.NODE_ENV === "production",
};
