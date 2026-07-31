// Składanie tel/mail chrome'u (navbar/sheet/stopka) z fragmentów —
// antyscraping D-CH5 (docs/analiza-chrome-globalny.md): pełne ciągi mogą
// powstać WYŁĄCZNIE w runtime; statyczny dist pilnuje osobno grep
// w tests/e2e/contact.spec.ts.
import { describe, expect, it } from "vitest";
import {
  buildEmail,
  buildPhoneDisplay,
  buildPhoneHref,
} from "../../src/lib/contact-details";

describe("contact-details (chrome)", () => {
  it("href telefonu: tel: bez spacji", () => {
    expect(buildPhoneHref()).toBe("tel:+48690291143");
  });

  it("tekst telefonu: ze spacjami (format z designów)", () => {
    expect(buildPhoneDisplay()).toBe("+48 690 291 143");
  });

  it("e-mail administratora", () => {
    expect(buildEmail()).toBe("kontakt@delung.pl");
  });
});
