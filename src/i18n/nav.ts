import {
  ABOUT_PATH,
  CONTACT_PATH,
  OFERTA_PATH,
  POLICY_PATH,
  PROCESS_PATH,
  WORK_INDEX_PATH,
} from "@/lib/routes";

// Pozycje menu głównego (PL-only). Wzorzec z designów (hdr-nav + sheet):
// CZTERY pozycje — „Proces współpracy" celowo poza navbarem (linkują go
// CTA sekcji na / i /oferta/ oraz stopka; decyzja D-CH4 w
// docs/analiza-chrome-globalny.md).
export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { id: "oferta", label: "Oferta", href: OFERTA_PATH },
  { id: "realizacje", label: "Realizacje", href: WORK_INDEX_PATH },
  { id: "o-nas", label: "O nas", href: ABOUT_PATH },
  { id: "kontakt", label: "Kontakt", href: CONTACT_PATH },
];

// Nawigacja stopki = pełna mapa strony: pozycje navbara + „Proces
// współpracy" (D-CH4) + polityka prywatności (wymóg instrukcji — widoczna
// także na mobile, wbrew dOnly z eksportu).
export const footerNavItems: NavItem[] = [
  { id: "oferta", label: "Oferta", href: OFERTA_PATH },
  { id: "realizacje", label: "Realizacje", href: WORK_INDEX_PATH },
  { id: "proces", label: "Proces współpracy", href: PROCESS_PATH },
  { id: "o-nas", label: "O nas", href: ABOUT_PATH },
  { id: "kontakt", label: "Kontakt", href: CONTACT_PATH },
  { id: "polityka", label: "Polityka prywatności", href: POLICY_PATH },
];

export function navLabel(item: NavItem): string {
  return item.label;
}
