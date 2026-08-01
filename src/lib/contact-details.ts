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

/** Wypełnia sloty telefonu/maila w DOM (chrome renderuje je puste+hidden).
 *  Kotwica z wewnętrznym [data-slot] (wiersze bannera kontaktu — ikona
 *  i etykieta zostają) dostaje tekst do slotu; bez slotu — jak dotąd,
 *  w textContent całej kotwicy. Wariant `data-tel="href"`/`data-mail="href"`
 *  (4.5 — np. „Zadzwoń teraz" w CTA procesu): podmieniamy WYŁĄCZNIE cel
 *  linku, etykieta kotwicy zostaje nietknięta. */
export function fillContactSlots(root: ParentNode = document): void {
  const fill = (
    a: HTMLAnchorElement,
    mode: string | undefined,
    href: string,
    text: string,
  ) => {
    a.href = href;
    if (mode !== "href") {
      (a.querySelector<HTMLElement>("[data-slot]") ?? a).textContent = text;
    }
    a.hidden = false;
  };
  root
    .querySelectorAll<HTMLAnchorElement>("a[data-tel]")
    .forEach((a) =>
      fill(a, a.dataset.tel, buildPhoneHref(), buildPhoneDisplay()),
    );
  root.querySelectorAll<HTMLAnchorElement>("a[data-mail]").forEach((a) => {
    const email = buildEmail();
    fill(a, a.dataset.mail, "mailto:" + email, email);
  });
}
