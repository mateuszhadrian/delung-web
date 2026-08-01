// Formularz /kontakt/ (Etap 5 — port na design delung): walidacja,
// opcjonalny telefon, pułapki antyspamowe (honeypot / submit < 4 s =
// udawany sukces BEZ requestu), wysyłka z mockiem endpointu (200 → .sent,
// 500 → .kt-srv), sloty antyscrapingowe kafli, fallbacki reduce/no-JS.
// Chrome podstrony (meta, navbar, stopka, banner na głównej) testuje
// contact-index.spec.ts. Decyzje: docs/analiza-kontakt.md.
//
// Turnstile jest STUBOWANY (route na challenges.cloudflare.com → atrapa
// window.turnstile) — testy deterministyczne i offline; prawdziwy widget
// weryfikujemy na preview PR-a. Endpoint /api/kontakt jest MOCKOWANY
// przez page.route — astro preview nie serwuje Pages Functions; żywotność
// produkcyjną sprawdza sonda @prod-smoke w smoke.spec.ts.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { CONTACT_DESKTOP_MIN_PX } from "../../src/components/sections/contact/contact-config";
import { CONTACT_PATH } from "../../src/lib/routes";
import { usePreviewGuard } from "../helpers/guards";
import { gotoReady, settle } from "../helpers/scroll";

usePreviewGuard();

const STUB_TOKEN = "e2e-turnstile-stub-token";

/* ── ster zegara antyspamu: contact-ui.ts liczy elapsed z Date.now()
   (próg MIN_FILL_MS = 4000 od initu strony). Wyścig z REALNYM czasem
   flake'ował na CI (wolny runner webkit: networkidle + scroll + fill
   przekraczały 4 s i „za szybki" submit przestawał być za szybki) —
   shim z przestawnym offsetem czyni obie strony progu deterministycznymi:
   skew −10⁷ ms = pułapka NA PEWNO wpada, +10⁷ ms = próg NA PEWNO minięty. ── */
const SKEW_TRAP_MS = -10_000_000;
const SKEW_PASS_MS = 10_000_000;

async function installClockSkew(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const real = Date.now.bind(Date);
    const w = window as unknown as { __skewMs: number };
    w.__skewMs = 0;
    Date.now = () => real() + w.__skewMs;
  });
}

function setClockSkew(page: Page, ms: number): Promise<void> {
  return page.evaluate((v) => {
    (window as unknown as { __skewMs: number }).__skewMs = v;
  }, ms);
}

/** Atrapa Turnstile: skrypt ładowany leniwie przez contact-ui.ts (pierwszy
 *  focus w formularzu) dostaje z route'a implementację, która na execute()
 *  natychmiast oddaje stały token. */
async function stubTurnstile(page: Page): Promise<void> {
  await page.route("https://challenges.cloudflare.com/**", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: `window.turnstile = {
        _cb: null,
        render(el, opts) { this._cb = opts.callback; return "stub-widget"; },
        execute() { const cb = this._cb; queueMicrotask(() => cb && cb(${JSON.stringify(STUB_TOKEN)})); },
        reset() {},
      };`,
    }),
  );
}

/** Mock endpointu + licznik requestów (pułapki assertują ZERO wywołań). */
async function mockEndpoint(
  page: Page,
  respond: (n: number) => { status: number; delayMs?: number },
): Promise<{ count: () => number; bodies: string[] }> {
  let n = 0;
  const bodies: string[] = [];
  await page.route("**/api/kontakt", async (route) => {
    n += 1;
    bodies.push(route.request().postData() ?? "");
    const { status, delayMs } = respond(n);
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({ status, body: status === 200 ? "OK" : "ERR" });
  });
  return { count: () => n, bodies };
}

async function gotoContact(page: Page, path = CONTACT_PATH): Promise<void> {
  await gotoReady(page, path);
  await page.locator("#contact .kt-frame").scrollIntoViewIfNeeded();
  await settle(page, 400);
}

async function fillForm(
  page: Page,
  over: {
    name?: string;
    email?: string;
    phone?: string;
    message?: string;
  } = {},
): Promise<void> {
  await page.fill("#kt-name", over.name ?? "Anna Testowa");
  await page.fill("#kt-email", over.email ?? "anna.testowa@example.com");
  if (over.phone !== undefined) await page.fill("#kt-phone", over.phone);
  await page.fill(
    "#kt-msg",
    over.message ?? "Wiadomość testowa z Playwrighta — co najmniej 10 znaków.",
  );
}

const frame = (page: Page) => page.locator("#contact .kt-frame");
const submitBtn = (page: Page) => page.locator("#contact .kt-send");

test("walidacja: pusty submit → 3 błędy + fokus na Imię; wpisywanie czyści; zły e-mail", async ({
  page,
}) => {
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  // Pusty submit: 3 pola z błędem (telefon jest opcjonalny — NIE liczy się),
  // aria-invalid, fokus na pierwszym błędnym.
  await submitBtn(page).click();
  await expect(page.locator("#contact .kt-form .err")).toHaveCount(3);
  await expect(page.locator("#kt-name")).toBeFocused();
  await expect(page.locator("#kt-name")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("#kt-msg")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#kt-phone")).not.toHaveAttribute(
    "aria-invalid",
    "true",
  );

  // Wpisanie w pole czyści JEGO błąd (pozostałe zostają).
  await page.fill("#kt-name", "Anna");
  await expect(page.locator("#kt-name")).toHaveAttribute(
    "aria-invalid",
    "false",
  );
  await expect(page.locator("#contact .kt-form .err")).toHaveCount(2);

  // Zły e-mail (bez TLD) → błąd tylko na e-mailu.
  await fillForm(page, { email: "abc@x" });
  await submitBtn(page).click();
  await expect(page.locator("#contact .kt-form .err")).toHaveCount(1);
  await expect(page.locator("#kt-email")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("#kt-email")).toBeFocused();

  // Walidacja kliencka NIE wypuściła żadnego requestu.
  expect(mock.count()).toBe(0);
});

test("telefon jest opcjonalny: pusty przechodzi, wypełniony ląduje w payloadzie", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  // Bez telefonu — wysyłka przechodzi.
  await fillForm(page);
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();
  await expect(frame(page)).toHaveClass(/sent/);
  expect(mock.count()).toBe(1);
  expect(mock.bodies[0]).toMatch(/name="phone"\r\n\r\n\r\n/);

  // Z telefonem — wartość wchodzi do multipartu.
  await page.locator("#contact .kt-again").click();
  await fillForm(page, { phone: "600 123 456" });
  await setClockSkew(page, SKEW_PASS_MS * 2);
  await submitBtn(page).click();
  await expect(frame(page)).toHaveClass(/sent/);
  expect(mock.count()).toBe(2);
  expect(mock.bodies[1]).toContain("600 123 456");
});

test("pułapka: submit < 4 s od załadowania → potwierdzenie BEZ requestu", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  await fillForm(page);
  // Cofnięty zegar = elapsed na pewno poniżej progu (deterministycznie,
  // bez wyścigu z czasem ładowania na wolnych runnerach).
  await setClockSkew(page, SKEW_TRAP_MS);
  await submitBtn(page).click();

  await expect(frame(page)).toHaveClass(/sent/);
  await expect(page.locator("#contact .kt-done-h")).toBeVisible();
  expect(mock.count()).toBe(0);
});

test("pułapka: wypełniony honeypot → potwierdzenie BEZ requestu (mimo odczekania)", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  // Strażnik regresu autofillu: honeypot MUSI startować jako readonly
  // (Chrome nie autofilluje pól readonly — incydent z preview, Etap 4),
  // a focus „po bocie" zdejmuje blokadę, żeby pułapka dalej łapała.
  const hp = page.locator("#kt-firma");
  await expect(hp).toHaveAttribute("readonly");
  await page.evaluate(() =>
    document.querySelector<HTMLInputElement>("#kt-firma")?.focus(),
  );
  await expect(hp).not.toHaveAttribute("readonly");

  // Honeypot jest poza ekranem (left: -9999px) — wartość wchodzi jak u bota,
  // wprost w DOM (fill() wymagałby widoczności).
  await page.evaluate(() => {
    const el = document.querySelector<HTMLInputElement>("#kt-firma");
    if (el) el.value = "Bot Sp. z o.o.";
  });
  await fillForm(page);
  // Zegar przestawiony ZA próg antyspamu — izoluje pułapkę honeypota od
  // pułapki „za szybko".
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();

  await expect(frame(page)).toHaveClass(/sent/);
  expect(mock.count()).toBe(0);
});

test("mock 200: wysyłka → .sent + fokus na nagłówku; payload ma lang, elapsed i token", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  await fillForm(page, { phone: "600 000 000" });
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();

  await expect(frame(page)).toHaveClass(/sent/);
  await expect(page.locator("#contact .kt-done-h")).toBeFocused();
  expect(mock.count()).toBe(1);

  // Kontrakt endpointu: pola z formularza + dokładane przez skrypt.
  const body = mock.bodies[0];
  expect(body).toContain('name="name"');
  expect(body).toContain("anna.testowa@example.com");
  expect(body).toContain('name="phone"');
  expect(body).toContain('name="firma"');
  expect(body).toContain(STUB_TOKEN);
  expect(body).toMatch(/name="lang"\r\n\r\npl/);
  const elapsed = Number(/name="elapsed"\r\n\r\n(\d+)/.exec(body)?.[1]);
  expect(elapsed).toBeGreaterThanOrEqual(4000);
});

test("mock 500: w trakcie disabled + „Wysyłam…”; błąd → .kt-srv, formularz aktywny; ponowna próba → .sent", async ({
  page,
}) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  // Pierwszy POST pada (z opóźnieniem — łapiemy stan „w trakcie"), drugi wchodzi.
  const mock = await mockEndpoint(page, (n) =>
    n === 1 ? { status: 500, delayMs: 700 } : { status: 200 },
  );
  await gotoContact(page);

  await fillForm(page);
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();

  // Stan „w trakcie": przycisk disabled, etykieta z data-sending, aria-busy.
  await expect(submitBtn(page)).toBeDisabled();
  const sending = await submitBtn(page).getAttribute("data-sending");
  await expect(submitBtn(page).locator(".lb")).toHaveText(sending ?? "…");
  await expect(page.locator("#contact .kt-form")).toHaveAttribute(
    "aria-busy",
    "true",
  );

  // 500 → komunikat serwerowy, formularz dalej aktywny (bez .sent).
  await expect(page.locator("#contact .kt-srv")).toBeVisible();
  await expect(frame(page)).not.toHaveClass(/sent/);
  await expect(submitBtn(page)).toBeEnabled();
  const send = await submitBtn(page).getAttribute("data-send");
  await expect(submitBtn(page).locator(".lb")).toHaveText(send ?? "");

  // Ponowny submit (Turnstile zresetowany → świeży token) → sukces.
  await submitBtn(page).click();
  await expect(frame(page)).toHaveClass(/sent/);
  await expect(page.locator("#contact .kt-srv")).toBeHidden();
  expect(mock.count()).toBe(2);
});

test("„Wyślij kolejną”: reset pól i zegara antyspamu", async ({ page }) => {
  await installClockSkew(page);
  await stubTurnstile(page);
  const mock = await mockEndpoint(page, () => ({ status: 200 }));
  await gotoContact(page);

  // Pierwsza wysyłka REALNA (zegar za progiem) — po niej „Wyślij kolejną".
  await fillForm(page, { phone: "600 000 000" });
  await setClockSkew(page, SKEW_PASS_MS);
  await submitBtn(page).click();
  await expect(frame(page)).toHaveClass(/sent/);
  expect(mock.count()).toBe(1);

  await page.locator("#contact .kt-again").click();
  await expect(frame(page)).not.toHaveClass(/sent/);
  await expect(page.locator("#kt-name")).toHaveValue("");
  await expect(page.locator("#kt-email")).toHaveValue("");
  await expect(page.locator("#kt-phone")).toHaveValue("");
  await expect(page.locator("#kt-msg")).toHaveValue("");
  await expect(page.locator("#kt-name")).toBeFocused();

  // Zegar zresetowany: skew bez zmian, więc elapsed drugiego submitu to
  // tylko czas wypełniania (≪ 4 s) → pułapka „za szybko", .sent BEZ
  // drugiego requestu. Regresja (brak resetu t0) dałaby elapsed ~10⁷ ms
  // i prawdziwy POST — licznik mocka by ją wyłapał.
  await fillForm(page);
  await submitBtn(page).click();
  await expect(frame(page)).toHaveClass(/sent/);
  expect(mock.count()).toBe(1);
});

test("kafle tel/mail: href i wartość składane w JS (sloty D-CH5)", async ({
  page,
}) => {
  await gotoContact(page);
  const tel = page.locator(".kt-cards a[data-tel]");
  const mail = page.locator(".kt-cards a[data-mail]");

  await expect(tel).toHaveAttribute("href", "tel:+48690291143");
  await expect(tel.locator("[data-slot]")).toHaveText("+48 690 291 143");
  await expect(mail).toHaveAttribute("href", "mailto:kontakt@delung.pl");
  await expect(mail.locator("[data-slot]")).toHaveText("kontakt@delung.pl");
});

test("antyscraping: pełny e-mail i telefon nie występują w źródle ani bundlach", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium-1920",
    "grep dist jest niezależny od przeglądarki — wystarczy raz",
  );
  const FORBIDDEN = ["kontakt@delung.pl", "690291143", "690 291 143"];

  // SUROWY HTML z sieci (bez wykonania JS) — to widzi scraper. Celowo NIE
  // page.content(): od chrome'u 4.1 stopka/pasek i (od Etapu 5) kafle
  // kontaktowe składają tel i mail w JS po załadowaniu, więc DOM po JS
  // ZAWIERA pełne ciągi. Kontrakt pilnuje statycznego źródła: HTML
  // z sieci + cały dist niżej.
  const raw = await (await page.request.get(CONTACT_PATH)).text();
  for (const s of FORBIDDEN) expect(raw).not.toContain(s);

  // Cały build: HTML + bundle JS/CSS (dynamiczne chunki też).
  const dist = fileURLToPath(new URL("../../dist/", import.meta.url));
  test.skip(!existsSync(dist), "brak dist/ (testy przeciw BASE_URL)");
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = `${dir}/${name}`;
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(html|js|mjs|css|json|txt|xml)$/.test(name)) files.push(p);
    }
  };
  walk(dist.replace(/\/$/, ""));
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const s of FORBIDDEN) {
      expect(content.includes(s), `${file} zawiera „${s}"`).toBe(false);
    }
  }
});

test("warianty per breakpoint: dopiski kafli i nagłówek formularza", async ({
  page,
}) => {
  await gotoContact(page);
  const width = page.viewportSize()?.width ?? 0;
  // Dopisek „· 24/7" przy etykiecie telefonu i h2 karty formularza istnieją
  // TYLKO na desktopie; wariant mobilny dostępności — tylko poniżej progu.
  const desktopOnly = page.locator("#contact .kt-head h2");
  const mobileOnly = page.locator(".kt-cards .kt-card-val.mOnly");
  if (width < CONTACT_DESKTOP_MIN_PX) {
    await expect(desktopOnly).toBeHidden();
    await expect(mobileOnly).toBeVisible();
  } else {
    await expect(desktopOnly).toBeVisible();
    await expect(mobileOnly).toBeHidden();
  }
});

/* Świadomy, PUNKTOWY wyjątek od zakazu emulacji reduced-motion
   (.claude/rules/testing.md): reguła chroni przed testami „przechodzącymi"
   na martwej stronie, a ten test assertuje ODWROTNOŚĆ — że przy reduce
   treść jest widoczna bez scrolla, a formularz nadal DZIAŁA (contact-ui.ts
   ładowany poza bramką motion). */
test.describe("prefers-reduced-motion: reduce — treść widoczna, formularz działa", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("sekcje widoczne bez scrolla, pułapka formularza działa", async ({
    page,
  }) => {
    await installClockSkew(page);
    await stubTurnstile(page);
    const mock = await mockEndpoint(page, () => ({ status: 200 }));
    await page.goto(CONTACT_PATH, { waitUntil: "networkidle" });

    // Stany startowe revealów uzbraja html.js-motion — przy reduce klasa
    // nie wchodzi, więc treść jest widoczna od razu (opacity 1).
    await expect(page.locator("main h1")).toBeVisible();
    await expect(frame(page)).toHaveCSS("opacity", "1");

    await fillForm(page);
    await setClockSkew(page, SKEW_TRAP_MS); // pułapka „za szybko" na pewno
    await submitBtn(page).click();
    await expect(frame(page)).toHaveClass(/sent/);
    expect(mock.count()).toBe(0);
  });
});

test.describe("fallback bez JS", () => {
  test.use({ javaScriptEnabled: false });

  test("pełna treść widoczna, dane kontaktowe zamaskowane (świadomy trade-off)", async ({
    page,
  }) => {
    await page.goto(CONTACT_PATH, { waitUntil: "networkidle" });
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("#contact .kt-form")).toBeVisible();
    await expect(page.locator("#contact .kt-send")).toBeVisible();
    // Stopka = chrome strony (Footer.astro), nie sekcja.
    await expect(page.locator("footer.ft")).toBeVisible();
    // Sloty wymagają JS — wartości zostają zamaskowane, bez pełnych ciągów.
    for (const attr of ["data-tel", "data-mail"]) {
      await expect(
        page.locator(`.kt-cards a[${attr}] [data-slot]`),
      ).toContainText("•");
    }
  });
});
