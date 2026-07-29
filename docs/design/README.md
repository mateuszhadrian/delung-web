# Designy-referencje delung.pl

Eksporty designów (samodzielne pliki HTML, mobile+desktop w jednym dokumencie,
breakpoint 1024 px, wzorce 390/1440 px) — opis zawartości w `README.txt`.

Mapowanie plik → route docelowy: patrz tabela §3 w
`../delung-web-entrance-analysis.md`.

## `assets/` — poza repo

Katalog `assets/` (ciężkie PNG, ~142 MB) jest w `.gitignore` — służy WYŁĄCZNIE
do lokalnego podglądu designów w przeglądarce. Do produkcji obrazy przechodzą
pipeline optymalizacji (WebP, docelowe rozmiary), a media realizacji żyją
w R2 (`media.delung.pl`).

Źródło oryginałów (gdyby lokalna kopia zginęła):
`~/Projects/delung-meble/eksport/assets/`
