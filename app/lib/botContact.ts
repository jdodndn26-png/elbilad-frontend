import crypto from "crypto";

const BOT_TOKEN_SECRET =
  process.env.ADMIN_INTERNAL_TOKEN ||
  process.env.JWT_SECRET ||
  "elblad_bot_contact_token_secret_2025";

/**
 * Creates a signed stateless token representing a Bot 2 customer
 */
export function createBot2UserToken(): string {
  const payload = "bot_2_user";
  const signature = crypto
    .createHmac("sha256", BOT_TOKEN_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 16);
  return `${payload}.${signature}`;
}

/**
 * Verifies if a given token represents a Bot 2 customer
 */
export function isBot2UserToken(token?: string | null): boolean {
  if (!token || typeof token !== "string") return false;
  const [payload, signature] = token.split(".");
  if (payload !== "bot_2_user" || !signature) return false;
  const expectedSignature = crypto
    .createHmac("sha256", BOT_TOKEN_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 16);
  return signature === expectedSignature;
}

/**
 * Returns the contact details for Bot 2 from environment variables
 */
export function getBot2ContactDetails() {
  return {
    whatsapp: (process.env.BOT_2_WHATSAPP || "").trim(),
    phone: (process.env.BOT_2_PHONE || "").trim(),
    email: (process.env.BOT_2_EMAIL || "").trim(),
  };
}

/**
 * Merges company data with Bot 2 contact info if the user is assigned to Bot 2.
 * Original logo, nameAr, nameEn, images, footerItems, etc. are 100% preserved.
 */
export function applyBotContactOverride<T extends Record<string, unknown>>(
  companyData: T,
  isBot2: boolean
): T {
  if (!isBot2 || !companyData) return companyData;

  const bot2Contact = getBot2ContactDetails();

  return {
    ...companyData,
    whatsapp: bot2Contact.whatsapp || companyData.whatsapp,
    phone: bot2Contact.phone || companyData.phone,
    email: bot2Contact.email || companyData.email,
  };
}
