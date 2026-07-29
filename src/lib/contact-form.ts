// Logika formularza kontaktowego — czysty TS, bez zależności od runtime'u
// Workers. Konsumenci: functions/api/kontakt.ts (Pages Function) i testy
// unit. Kontrakt endpointu i treści maili:
// docs/contact-me-form-analysis-implementation.md (wzorzec) — dane firmowe
// wg docs/design/kontakt.html (decyzja D4).

export const CONTACT_TO = "kontakt@delung.pl";
export const CONTACT_FROM_NOTIFY = "Formularz delung.pl <no-reply@delung.pl>";
export const CONTACT_FROM_CONFIRM = "Delung Meble <no-reply@delung.pl>";

export const MIN_FILL_MS = 4000;
export const NAME_MAX = 100;
export const EMAIL_MAX = 254;
export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 5000;

// Ta sama reguła co walidacja kliencka (referencja kontakt.js).
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Chipsy tematu = kategorie zapytań (contact.topic* w ui.ts). Wartość
// spoza listy jest ignorowana, nie odrzucana (kontrakt §4.2 wzorca).
export const TOPICS = [
  "Kuchnia",
  "Szafa / garderoba",
  "Łazienka",
  "Inny temat",
] as const;

// PL-only (decyzja #2 delung) — pole lang zostaje w kontrakcie multipart,
// ale jedyną wartością jest "pl".
export type ContactLang = "pl";

/** Surowe pola z multipart/form-data (zawsze stringi, mogą być puste). */
export interface ContactRaw {
  name: string;
  email: string;
  temat: string;
  message: string;
  firma: string;
  elapsed: string;
  lang: string;
}

export interface ContactData {
  name: string;
  email: string;
  /** "" gdy nie wybrano albo wartość spoza TOPICS. */
  temat: string;
  message: string;
  lang: ContactLang;
}

/**
 * Pułapka na boty: honeypot `firma` niepusty LUB `elapsed` < MIN_FILL_MS.
 * Brak/niesparsowalny `elapsed` = POST z pominięciem naszego JS = bot.
 */
export function isBotTrap(raw: Pick<ContactRaw, "firma" | "elapsed">): boolean {
  if (raw.firma !== "") return true;
  const elapsed = Number(raw.elapsed);
  return !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS;
}

export type ValidationResult =
  | { ok: true; data: ContactData }
  | { ok: false; field: "name" | "email" | "message" };

export function validateSubmission(raw: ContactRaw): ValidationResult {
  const name = raw.name.trim();
  const email = raw.email.trim();
  const message = raw.message.trim();

  if (name.length === 0 || name.length > NAME_MAX) {
    return { ok: false, field: "name" };
  }
  if (email.length > EMAIL_MAX || !EMAIL_RE.test(email)) {
    return { ok: false, field: "email" };
  }
  if (message.length < MESSAGE_MIN || message.length > MESSAGE_MAX) {
    return { ok: false, field: "message" };
  }

  const tematRaw = raw.temat.trim();
  const temat = (TOPICS as readonly string[]).includes(tematRaw)
    ? tematRaw
    : "";

  return { ok: true, data: { name, email, temat, message, lang: "pl" } };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Do Subject: jedna linia (porządek w temacie, nie mechanizm security). */
export function stripNewlines(s: string): string {
  return s.replace(/\s*[\r\n]+\s*/g, " ").trim();
}

function quoteText(message: string): string {
  return message
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Mail #1 — powiadomienie do skrzynki kontakt@. Czytelnie, bez ozdób;
 * najważniejsze to OD KOGO i NA JAKI ADRES odpisać (samą odpowiedź
 * załatwia Reply-To ustawiane przez endpoint).
 */
export function buildNotifyEmail(
  data: ContactData,
  sentAt: string,
): EmailContent {
  const name = stripNewlines(data.name);
  const subject = data.temat
    ? `[delung.pl] ${data.temat}: wiadomość od ${name}`
    : `[delung.pl] wiadomość od ${name}`;

  const text = [
    "Nowa wiadomość z formularza na delung.pl",
    "",
    `Od: ${name}`,
    `E-mail (odpowiedz na ten adres): ${data.email}`,
    `Temat: ${data.temat || "—"}`,
    `Data: ${sentAt}`,
    "",
    "Wiadomość:",
    data.message,
  ].join("\n");

  const html = [
    "<p>Nowa wiadomość z formularza na delung.pl</p>",
    `<p><strong>Od:</strong> ${escapeHtml(name)}<br>`,
    `<strong>E-mail (odpowiedz na ten adres):</strong> ${escapeHtml(data.email)}<br>`,
    `<strong>Temat:</strong> ${escapeHtml(data.temat || "—")}<br>`,
    `<strong>Data:</strong> ${escapeHtml(sentAt)}</p>`,
    `<div style="white-space:pre-wrap;border-top:1px solid #ccc;padding-top:12px">${escapeHtml(data.message)}</div>`,
  ].join("\n");

  return { subject, html, text };
}

/**
 * Mail #2 — auto-potwierdzenie do nadawcy. Subject jest STAŁY (treść
 * użytkownika nie steruje tematem — §5.5 wzorca); jego wiadomość pojawia
 * się wyłącznie jako oznaczony cytat.
 */
export function buildConfirmEmail(data: ContactData): EmailContent {
  const name = stripNewlines(data.name);

  const subject = "Dziękujemy za wiadomość — Delung Meble";
  const text = [
    `Cześć ${name},`,
    "",
    "dziękujemy za wiadomość wysłaną przez formularz na delung.pl — właśnie",
    "do nas dotarła. Odpowiadamy najpóźniej w ciągu 24 godzin (w dni",
    "robocze), a na szybkie pytania zwykle od ręki.",
    "",
    `Kopia Twojej wiadomości${data.temat ? ` (temat: ${data.temat})` : ""}:`,
    quoteText(data.message),
    "",
    "Pozdrawiamy",
    "Delung Meble",
    "https://delung.pl",
    "",
    "—",
    "Ta wiadomość została wysłana automatycznie. Jeśli to nie Ty",
    "wypełniłeś(-aś) formularz na delung.pl, zignoruj ją — Twój adres nie",
    "zostanie zapisany ani dodany do żadnej listy.",
  ].join("\n");
  const html = [
    `<p>Cześć ${escapeHtml(name)},</p>`,
    "<p>dziękujemy za wiadomość wysłaną przez formularz na delung.pl — właśnie do nas dotarła. Odpowiadamy najpóźniej w ciągu 24 godzin (w dni robocze), a na szybkie pytania zwykle od ręki.</p>",
    `<p>Kopia Twojej wiadomości${data.temat ? ` (temat: ${escapeHtml(data.temat)})` : ""}:</p>`,
    `<blockquote style="white-space:pre-wrap;border-left:3px solid #ccc;margin:0;padding-left:12px">${escapeHtml(data.message)}</blockquote>`,
    '<p>Pozdrawiamy<br>Delung Meble<br><a href="https://delung.pl">delung.pl</a></p>',
    '<p style="color:#777;font-size:12px">Ta wiadomość została wysłana automatycznie. Jeśli to nie Ty wypełniłeś(-aś) formularz na delung.pl, zignoruj ją — Twój adres nie zostanie zapisany ani dodany do żadnej listy.</p>',
  ].join("\n");
  return { subject, html, text };
}
