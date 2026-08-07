// Wpisy kolekcji realizacji czytane wprost z plików JSON — tak samo, jak robi
// to build. Testy dzięki temu nie hardkodują treści CMS-a: liczą to, co realnie
// leży w repo.
//
// KATALOG MOŻE NIE ISTNIEĆ. Git nie przechowuje pustych katalogów, więc
// usunięcie w panelu ostatniej realizacji kasuje cały `src/content/realizacje`.
// Wcześniej trzy pliki testowe wołały `readdirSync` przy ładowaniu modułu, więc
// wywracały się PRZED uruchomieniem czegokolwiek — `quality` i `prod-smoke`
// czerwone z komunikatem `ENOENT: scandir` zamiast informacji „nie ma treści"
// (zdarzyło się realnie 2026-08-06). Build tego stanu nie ma za złe: strona
// buduje się i deployuje bez wpisów, tylko z pustą listą i pustą sceną na
// stronie głównej.
//
// Uwaga: to NIE jest fixture testów wizualnych (`tests/fixtures/realizacje`,
// `pnpm build:visual`) — tamten jest zamrożony i niezależny od treści
// produkcyjnej. Reguła: `.claude/rules/testing.md`.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const REALIZACJE_DIR = fileURLToPath(
  new URL("../../src/content/realizacje", import.meta.url),
);

/** Nazwy plików wpisów; pusta tablica, gdy katalogu nie ma. */
export function realizacjeFiles(): string[] {
  if (!existsSync(REALIZACJE_DIR)) return [];
  return readdirSync(REALIZACJE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort();
}

/** Surowa treść wpisu (JSON prosto z pliku). */
export function readRealizacja<T>(name: string): T {
  return JSON.parse(readFileSync(join(REALIZACJE_DIR, name), "utf8")) as T;
}

/** Wpisy posortowane jak na stronie (rosnąco po `order`). */
export function readRealizacje<T extends { order: number }>(): T[] {
  return realizacjeFiles()
    .map((name) => readRealizacja<T>(name))
    .sort((a, b) => a.order - b.order);
}

/** Ile realizacji pokazuje zajawka na stronie głównej (kap z HomeRealizacje). */
export const HOME_MAX = 3;
