// === Wersja aplikacji (v4.14) ===
// Jedno miejsce na numer i opis wersji: plakietka w nagłówku i plik version.json (vite.config.js).
// Przy każdej zmianie funkcjonalnej podbij APP_VERSION i opisz zmianę w APP_VERSION_NOTE.
export const APP_VERSION = "v4.22";
export const APP_VERSION_NOTE = "Rejestr: dodawanie dokumentów zewnętrznych (HTML lub tekst)";

// Znacznik builda wstawiany przez Vite (define); w trybie dev "dev" = sprawdzanie wyłączone
// eslint-disable-next-line no-undef
export const BUILD_ID = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";
