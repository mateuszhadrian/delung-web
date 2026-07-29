// Ścieżki stron delung.pl (PL-only) — jedno źródło prawdy dla Navbara,
// sekcji i plików w src/pages. Osiem tras wg decyzji z
// docs/delung-web-entrance-analysis.md §7.
export const HOME_PATH = "/";
export const OFERTA_PATH = "/oferta/";
// Mobile-only lista kategorii; na desktopie client-side redirect → /oferta/
// (inline skrypt w <head> strony + canonical na /oferta/).
export const KATEGORIE_PATH = "/kategorie/";
export const WORK_INDEX_PATH = "/realizacje/";
export const PROCESS_PATH = "/proces-wspolpracy/";
export const ABOUT_PATH = "/o-nas/";
export const CONTACT_PATH = "/kontakt/";
export const POLICY_PATH = "/polityka-prywatnosci/";
