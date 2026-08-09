import "server-only";

/**
 * עטיפה ל-WhatsApp Cloud API של Meta — עבודה ישירה מול Meta (לא ספק צד-שלישי).
 * דורש הקמה עצמאית ב-Meta Business Manager (אפליקציית WhatsApp Business, מספר טלפון
 * מאומת, Access Token קבוע, ותבנית הודעה מאושרת מסוג utility) — מתועד ב-README.
 * ריק (WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_ACCESS_TOKEN לא מוגדרים) = כבוי בשקט.
 */

export interface WhatsAppSendResult {
  ok: boolean;
  error?: string;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN);
}

export async function sendWhatsAppReminder(toE164: string, templateBodyParams: string[]): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    return { ok: false, error: "WhatsApp אינו מוגדר (חסרים WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_ACCESS_TOKEN)." };
  }

  const apiVersion = process.env.WHATSAPP_API_VERSION || "v20.0";
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "daily_reminder";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "he";
  const to = toE164.replace(/[^\d]/g, "");

  try {
    const res = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLang },
          ...(templateBodyParams.length > 0
            ? { components: [{ type: "body", parameters: templateBodyParams.map((text) => ({ type: "text", text })) }] }
            : {}),
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Meta Graph API ${res.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
