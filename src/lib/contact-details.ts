// Telefon i e-mail firmowy dla chrome'u (navbar, sheet menu, stopka).
// Antyscraping jak w PolicyPage/contact-ui: pełne ciągi NIE istnieją
// w bundle'u ani w statycznym HTML — składane z fragmentów dopiero w JS
// po załadowaniu strony (sloty [data-tel]/[data-mail] startują ukryte;
// bez JS chrome nie pokazuje numeru — spójnie z polityką prywatności).
// Sekcja kontaktu ma własne fragmenty (contact-ui.ts, odsłanianie na klik)
// — ewentualna unifikacja przy porcie widoku kontaktu (Etap 5).

const PHONE_PARTS = [48, 690, 291, 143] as const;
const EMAIL_PARTS = ["kontakt", "delung", "pl"] as const;

export const buildPhoneHref = (): string => "tel:+" + PHONE_PARTS.join("");

export const buildPhoneDisplay = (): string =>
  "+" + PHONE_PARTS[0] + " " + PHONE_PARTS.slice(1).join(" ");

export const buildEmail = (): string =>
  EMAIL_PARTS[0] +
  String.fromCharCode(64) +
  EMAIL_PARTS[1] +
  "." +
  EMAIL_PARTS[2];

/** Wypełnia sloty telefonu/maila w DOM (chrome renderuje je puste+hidden). */
export function fillContactSlots(root: ParentNode = document): void {
  root.querySelectorAll<HTMLAnchorElement>("a[data-tel]").forEach((a) => {
    a.href = buildPhoneHref();
    a.textContent = buildPhoneDisplay();
    a.hidden = false;
  });
  root.querySelectorAll<HTMLAnchorElement>("a[data-mail]").forEach((a) => {
    const email = buildEmail();
    a.href = "mailto:" + email;
    a.textContent = email;
    a.hidden = false;
  });
}
