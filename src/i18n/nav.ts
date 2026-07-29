import {
  ABOUT_PATH,
  CONTACT_PATH,
  OFERTA_PATH,
  PROCESS_PATH,
  WORK_INDEX_PATH,
} from "@/lib/routes";

// Pozycje menu głównego (PL-only). Wszystkie prowadzą na podstrony —
// strona główna ma zajawki sekcji (wg designu index.html).
export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export const navItems: NavItem[] = [
  { id: "oferta", label: "Oferta", href: OFERTA_PATH },
  { id: "realizacje", label: "Realizacje", href: WORK_INDEX_PATH },
  { id: "proces", label: "Proces współpracy", href: PROCESS_PATH },
  { id: "o-nas", label: "O nas", href: ABOUT_PATH },
  { id: "kontakt", label: "Kontakt", href: CONTACT_PATH },
];

export function navLabel(item: NavItem): string {
  return item.label;
}
