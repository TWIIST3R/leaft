import {
  hashUserData,
  type ConversionUserData,
  type ConversionUserDataHashed,
} from "@/lib/analytics/enhanced-conversions";

export const GTM_ID = "GTM-WRTPH35L";

/** Événements GTM — à utiliser comme déclencheurs dans Tag Manager */
export const DataLayerEvents = {
  CONTACT_FORM_SUBMIT: "contact_form_submit",
  SIGN_UP_COMPLETE: "sign_up_complete",
} as const;

export type DataLayerEventName = (typeof DataLayerEvents)[keyof typeof DataLayerEvents];

type ConversionEventBase = {
  form_name?: "contact";
  company_size?: string;
  page_path: string;
  auth_provider?: "clerk";
  /** Données en clair — variables GTM (email, phone, first_name, last_name) */
  user_data: ConversionUserData;
  /** Données hachées SHA-256 — Google Enhanced Conversions / Meta Advanced Matching */
  user_data_hashed: ConversionUserDataHashed;
};

export type ContactFormSubmitPayload = ConversionEventBase & {
  event: typeof DataLayerEvents.CONTACT_FORM_SUBMIT;
  form_name: "contact";
  company_size: string;
};

export type SignUpCompletePayload = ConversionEventBase & {
  event: typeof DataLayerEvents.SIGN_UP_COMPLETE;
  auth_provider: "clerk";
  page_path: "/sign-up";
};

export type DataLayerPayload = ContactFormSubmitPayload | SignUpCompletePayload;

declare global {
  interface Window {
    dataLayer?: object[];
  }
}

export function pushToDataLayer(payload: DataLayerPayload): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(payload);
}

async function pushConversionEvent(
  payload: Omit<ContactFormSubmitPayload, "user_data_hashed"> | Omit<SignUpCompletePayload, "user_data_hashed">,
): Promise<void> {
  const user_data_hashed = await hashUserData(payload.user_data);
  pushToDataLayer({ ...payload, user_data_hashed } as DataLayerPayload);
}

export async function trackContactFormSubmit(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companySize: string;
}): Promise<void> {
  await pushConversionEvent({
    event: DataLayerEvents.CONTACT_FORM_SUBMIT,
    form_name: "contact",
    company_size: input.companySize,
    page_path: window.location.pathname,
    user_data: {
      email: input.email.trim(),
      phone: input.phone.trim(),
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
    },
  });
}

export async function trackSignUpComplete(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<void> {
  await pushConversionEvent({
    event: DataLayerEvents.SIGN_UP_COMPLETE,
    auth_provider: "clerk",
    page_path: "/sign-up",
    user_data: {
      email: input.email.trim(),
      phone: input.phone.trim(),
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
    },
  });
}
