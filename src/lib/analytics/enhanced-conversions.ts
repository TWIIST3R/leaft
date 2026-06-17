/** Normalisation & hachage SHA-256 pour Google Enhanced Conversions / Meta Advanced Matching */

export type ConversionUserData = {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
};

export type ConversionUserDataHashed = {
  sha256_email_address: string;
  sha256_phone_number: string;
  sha256_first_name: string;
  sha256_last_name: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Format E.164 — par défaut indicatif France (+33) si numéro local */
export function normalizePhoneE164(phone: string, defaultCountryCode = "33"): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";

  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }
  if (digits.startsWith("0")) {
    digits = defaultCountryCode + digits.slice(1);
  } else if (!digits.startsWith(defaultCountryCode)) {
    digits = defaultCountryCode + digits;
  }
  return `+${digits}`;
}

async function sha256(value: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashUserData(data: ConversionUserData): Promise<ConversionUserDataHashed> {
  const email = normalizeEmail(data.email);
  const phone = normalizePhoneE164(data.phone);
  const firstName = normalizeName(data.first_name);
  const lastName = normalizeName(data.last_name);

  const [sha256_email_address, sha256_phone_number, sha256_first_name, sha256_last_name] = await Promise.all([
    email ? sha256(email) : Promise.resolve(""),
    phone ? sha256(phone) : Promise.resolve(""),
    firstName ? sha256(firstName) : Promise.resolve(""),
    lastName ? sha256(lastName) : Promise.resolve(""),
  ]);

  return {
    sha256_email_address,
    sha256_phone_number,
    sha256_first_name,
    sha256_last_name,
  };
}
