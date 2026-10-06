// === Prompty kliniki MEDLINES (Etap 3) ===
// Źródło masterpromptu: "Prompty - Diagnostyka i leczenie włosów oraz skóry głowy" (dokument roboczy Roberta, 2026-10-06).
// Na dziedzinę przypada jeden prompt matka (masterprompt). To WARTOŚĆ DOMYŚLNA: edycje w Generatorze
// zapisują się w przeglądarce (localStorage), z przyciskiem "Przywróć oryginał".
// Zmiana na stałe dla wszystkich = edycja tego pliku + commit.
// Zgodnie z zasadami projektu myślniki i półpauzy zamienione na dywiz "-".

export const DZIEDZINY = {
  trychologia: {
    label: "Trychologia",
    section: "Diagnostyka i leczenie włosów oraz skóry głowy",
    promptMatka: "INSTRUKCJA WSPÓLNA:\nKażdy prompt ma prowadzić do przygotowania rzetelnego tekstu dla strony internetowej kliniki medycznej. Najpierw wykorzystaj wcześniej opracowane materiały dostępne w projekcie, następnie zweryfikuj informacje w aktualnych, wiarygodnych źródłach medycznych. Preferuj wytyczne, stanowiska towarzystw naukowych, PubMed/MEDLINE, przeglądy systematyczne, metaanalizy, RCT, DermNet, AAD, EADV, BAD i inne uznane źródła akademickie. Nie opieraj zaleceń na materiałach marketingowych producentów ani stronach komercyjnych klinik.\n\nSTANDARD REDAKCYJNY:\n- Język polski, profesjonalny, spokojny, zrozumiały dla świadomego pacjenta.\n- Bez obietnic efektów, sensacyjnych określeń i agresywnego marketingu.\n- Wyraźnie rozdzielaj leczenie przyczynowe, farmakoterapię, korektę niedoborów, leczenie wspomagające i zabiegowe.\n- Przy każdej metodzie oceń jakość dowodów i zaznacz zastosowania off-label.\n- Nie przenoś wyników badań z jednego rozpoznania na inne bez uzasadnienia.\n- Nie zalecaj rutynowo szerokich paneli laboratoryjnych bez wskazań klinicznych.\n- Na końcu każdego opracowania dodaj krótką notatkę merytoryczną dla lekarza ze źródłami i punktami wymagającymi szczególnej ostrożności.\n\nCEL CAŁEGO SERWISU:\nStrona ma komunikować podejście: najpierw rozpoznanie mechanizmu problemu, następnie leczenie przyczyny, a dopiero potem dobór terapii wspomagających i zabiegów.",
  },
};
