// Portrety zespołu /o-nas/ — OSOBNO od onas-content.ts, bo tamten moduł
// importują testy Playwright (Node nie zaimportuje .webp; wzorzec
// oferta-images.ts z 4.3). Klucz = pole `name` wpisu ZESPOL.
import adamPortrait from "@/assets/o-nas/adam-portrait.webp";
import tomekPortrait from "@/assets/o-nas/tomek-portrait.webp";
import marcinPortrait from "@/assets/o-nas/marcin-portrait.webp";
import type { ZESPOL } from "./onas-content";

type TeamName = (typeof ZESPOL)[number]["name"];

export const TEAM_IMAGES: Record<TeamName, ImageMetadata> = {
  Adam: adamPortrait,
  Tomek: tomekPortrait,
  Marcin: marcinPortrait,
};
