// Słownik PL-only (decyzja #2 delung — bez EN). Mechanizm useTranslations
// zostaje uśpiony na jednym języku: Lang = "pl", zero martwych kluczy.
// Klucze sekcji work/contact odziedziczone z szablonu źródłowego — teksty do wymiany
// wraz z budową widoków delung (Etap 4/5).
export const languages = {
  pl: "Polski",
} as const;

export const defaultLang = "pl";

export const ui = {
  pl: {
    "meta.title": "Delung Meble — meble na wymiar",
    "work.eyebrow": "NASZE REALIZACJE",
    "work.cta": "Zobacz realizację",
    "work.gallery": "Galeria",
    "work.specs": "Szczegóły realizacji",
    "work.close": "Zamknij",
    "workPage.title": "Realizacje — Delung Meble",
    "workPage.description":
      "Galeria zrealizowanych mebli na wymiar — kuchnie, szafy i garderoby, zabudowy łazienkowe i nietypowe projekty.",
    "workPage.headlineLead": "wybrane",
    "workPage.headlineAccent": "realizacje",
    "workPage.intro":
      "Przeglądaj wybrane realizacje. Kliknij, by zobaczyć szczegóły projektu.",
    "workPage.ghost": "Kolejne realizacje wkrótce",
    "contact.meta": "Formularz · e-mail · telefon",
    "contact.ghost": "KONTAKT",
    "contact.kick": "Kontakt",
    "contact.headLead": "napisz",
    "contact.headAccent": "do nas",
    "contact.intro":
      "Niezależnie czy masz już gotową wizję mebli, czy dopiero szukasz najlepszego rozwiązania — napisz lub zadzwoń. Doradzimy i wspólnie ustalimy plan działania.",
    "contact.stOn": "Przyjmujemy nowe zlecenia",
    "contact.stOff": "Odpowiadamy do 24h w dni robocze",
    "contact.emailLbl": "E-mail",
    "contact.phoneLbl": "Telefon",
    "contact.reveal": "[ POKAŻ ]",
    "contact.copy": "[ KOPIUJ ]",
    "contact.copied": "[ SKOPIOWANO ]",
    "contact.showEmailAria": "Pokaż adres e-mail",
    "contact.showPhoneAria": "Pokaż numer telefonu",
    "contact.copyEmailAria": "Kopiuj adres e-mail",
    "contact.copyPhoneAria": "Kopiuj numer telefonu",
    "contact.hpLbl": "Firma",
    "contact.nameLbl": "Imię i nazwisko",
    "contact.namePh": "np. Anna Kowalska",
    "contact.nameErr": "Podaj imię",
    "contact.emailFieldLbl": "Twój e-mail",
    "contact.emailPh": "adres do odpowiedzi",
    "contact.emailErr": "Podaj poprawny adres e-mail",
    "contact.topicLbl": "Czego dotyczy wiadomość",
    "contact.topic1": "Kuchnia",
    "contact.topic2": "Szafa / garderoba",
    "contact.topic3": "Łazienka",
    "contact.topic4": "Inny temat",
    "contact.msgLbl": "Wiadomość",
    "contact.msgPh":
      "Napisz tu swoją wiadomość — odpowiadamy najpóźniej w ciągu 24 godzin (w dni robocze).",
    "contact.msgErr": "Napisz kilka słów wiadomości",
    "contact.notePre": "Wysyłając wiadomość akceptujesz ",
    "contact.noteLink": "politykę prywatności",
    "contact.notePost":
      " — Twoje dane wykorzystujemy wyłącznie po to, żeby odpowiedzieć.",
    "contact.srvErr":
      "Nie udało się wysłać — spróbuj ponownie albo napisz bezpośrednio na e-mail",
    "contact.send": "Wyślij wiadomość",
    "contact.sending": "Wysyłam…",
    "contact.doneHead": "Wiadomość wysłana",
    "contact.doneP":
      "Odezwiemy się najpóźniej w ciągu 24 godzin w dni robocze — zwykle znacznie szybciej.",
    "contact.again": "[ Wyślij kolejną ]",
    "contact.toastValTitle": "Uzupełnij formularz",
    "contact.toastValMsg": "Sprawdź zaznaczone pola i spróbuj ponownie.",
    "contact.toastErrTitle": "Nie udało się wysłać",
    "contact.toastErrMsg": "Sprawdź połączenie i spróbuj ponownie.",
    "contact.toastOkTitle": "Wiadomość wysłana",
    "contact.toastOkMsg": "Odezwiemy się w ciągu 24h w dni robocze.",
    "contact.policyHref": "/polityka-prywatnosci/",
    "contactPage.title": "Kontakt — Delung Meble",
    "contactPage.description":
      "Skontaktuj się z nami — formularz kontaktowy, e-mail i telefon. Napisz, czego potrzebujesz: kuchnia, szafa, garderoba czy inna zabudowa na wymiar. Odpowiadamy do 24 h w dni robocze.",
  },
} as const;
