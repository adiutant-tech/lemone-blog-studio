// === Formaty scenariuszy poza rolkami (v4.11): YouTube długie, YouTube Shorts, Stories, reklama wideo ===
// Prompty poniżej to SZKICE (Claude, 2026-10-16), żeby każdy format działał od razu. Docelowe prompty matki
// dopisze redakcja (Robert) w aplikacji: Scenariusz -> Prompt; zapisana wersja zastępuje szkic.
// Zapisane w aplikacji wersje i ich historia żyją w Workerze (/prompts/<nazwa>) i są widoczne dla wszystkich.
// Struktura każdego promptu: kim jest model, opis rodzaju, DANE, 1. zasady formatu, 2. zgodność, 3. wynik.
// Nagłówki sekcji wyniku muszą być zgodne z FORMATS w scenario.jsx.
// Bez myślników i półpauz (zasada projektu).

import { SKLEP_ZGODNOSC, KLINIKA_ZGODNOSC } from "./rolki.js";

// ---------- Pola formularzy ----------

const pole = {
  temat: (label = "Temat", placeholder = "") => ({ key: "temat", label, required: true, rows: 2, placeholder }),
  linki: { key: "linki", label: "Linki do naszych stron (produkt, usługa, artykuł)", placeholder: "jeden w linii; Writer pobierze ich treść jako materiał", rows: 2 },
  materialy: (placeholder = "fakty, notatki z karty produktu lub opisu usługi; mają pierwszeństwo nad wiedzą modelu") => ({ key: "materialy", label: "Materiały i notatki", rows: 3, placeholder }),
  wspolpraca: { key: "wspolpraca", label: "Współpraca, reklama lub konflikt interesów", placeholder: "jeżeli dotyczy (wymaga oznaczenia)" },
};

const FIELDS = {
  // YouTube długie
  "yt-klinika-zabieg": [
    pole.temat("Zabieg lub usługa", "np. mezoterapia mikroigłowa skóry głowy"),
    { key: "wystepuje", label: "Kto prowadzi i kto wykonuje zabieg", required: true, placeholder: "np. lek. Agnieszka Tomala, dermatolog; kosmetolożka kliniki" },
    { key: "pacjent", label: "Osoba poddająca się zabiegowi i zgoda", placeholder: "np. pacjentka, pisemna zgoda na nagranie; brak = ujęcia bez twarzy" },
    { key: "odbiorcy", label: "Odbiorcy", placeholder: "domyślnie osoby rozważające zabieg, bez wiedzy medycznej" },
    { key: "pytanie", label: "Najważniejsze pytanie widza", placeholder: "np. Czy to boli i kiedy widać efekt?" },
    { key: "dlugosc", label: "Docelowa długość", placeholder: "domyślnie 6-10 minut" },
    pole.linki,
    pole.materialy("opis zabiegu z naszej strony, przeciwwskazania, zalecenia pozabiegowe"),
    { key: "kolejny", label: "Powiązany film lub usługa, do których można odesłać", placeholder: "opcjonalnie" },
  ],
  "yt-klinika-rozmowa": [
    pole.temat("Temat rozmowy"),
    { key: "wystepuje", label: "Prowadzący i ekspert (gość)", required: true, rows: 2, placeholder: "np. prowadząca: Joanna; ekspertka: lek. Agnieszka Tomala, dermatolog (nie dopisuj niepodanych kwalifikacji)" },
    { key: "pytania", label: "Pytania widzów do wykorzystania", rows: 3, placeholder: "z komentarzy, DM, recepcji; opcjonalnie" },
    { key: "odbiorcy", label: "Odbiorcy", placeholder: "domyślnie dorośli bez wykształcenia medycznego" },
    { key: "dlugosc", label: "Docelowa długość", placeholder: "domyślnie 15-25 minut" },
    pole.linki,
    pole.materialy("źródła, notatki eksperta, tezy do omówienia"),
    pole.wspolpraca,
  ],
  "yt-sklep-poradnik": [
    pole.temat("Temat poradnika", "np. jak zbudować wieczorną pielęgnację z retinolem"),
    { key: "wystepuje", label: "Kto prowadzi", required: true, placeholder: "np. kosmetolożka sklepu, Joanna z zespołu (nie dopisuj niepodanych kwalifikacji)" },
    { key: "produkty", label: "Produkty, które mogą się pojawić", rows: 2, placeholder: "opcjonalnie; poradnik nie jest reklamą, produkty jako przykłady" },
    { key: "odbiorcy", label: "Odbiorcy", placeholder: "domyślnie osoby dbające o skórę, 25-45 lat" },
    { key: "cel", label: "Co widz ma umieć po filmie", rows: 2 },
    { key: "dlugosc", label: "Docelowa długość", placeholder: "domyślnie 8-12 minut" },
    pole.linki,
    pole.materialy(),
    pole.wspolpraca,
  ],
  "yt-sklep-zestawienie": [
    pole.temat("Temat zestawienia", "np. 5 serum z witaminą C dla różnych typów skóry"),
    { key: "wystepuje", label: "Kto prowadzi", required: true, placeholder: "np. kosmetolożka sklepu" },
    { key: "produkty", label: "Produkty w zestawieniu", required: true, rows: 3, placeholder: "nazwy handlowe; jeden w linii" },
    { key: "kryteria", label: "Kryteria porównania", rows: 2, placeholder: "domyślnie: dla kogo, składniki aktywne, tekstura, sposób użycia, cena za ml" },
    { key: "odbiorcy", label: "Odbiorcy", placeholder: "domyślnie osoby wybierające produkt" },
    { key: "dlugosc", label: "Docelowa długość", placeholder: "domyślnie 10-14 minut" },
    pole.linki,
    pole.materialy("karty produktów, składy, ceny (tylko aktualne)"),
    pole.wspolpraca,
  ],

  // YouTube Shorts
  "shorts-klinika": [
    pole.temat("Temat i jedna myśl Shorta"),
    { key: "wystepuje", label: "Kto mówi", required: true, placeholder: "np. lek. Agnieszka Tomala, dermatolog; kosmetolożka kliniki" },
    { key: "film", label: "Film długi, z którego pochodzi (opcjonalnie)", rows: 3, placeholder: "wklej scenariusz lub transkrypcję albo tytuł i link; puste = Short samodzielny" },
    { key: "odbiorcy", label: "Odbiorcy", placeholder: "domyślnie dorośli bez wykształcenia medycznego" },
    { key: "dlugosc", label: "Długość", placeholder: "domyślnie 30-50 sekund" },
    pole.linki,
    pole.materialy("fakty i źródła; mają pierwszeństwo nad wiedzą modelu"),
  ],
  "shorts-sklep": [
    pole.temat("Temat i jedna myśl Shorta"),
    { key: "wystepuje", label: "Kto mówi", required: true, placeholder: "np. Joanna z zespołu sklepu, sam lektor bez twarzy" },
    { key: "produkty", label: "Produkt lub produkty (opcjonalnie)", rows: 2, placeholder: "nazwa handlowa, pojemność, kluczowe cechy z karty produktu" },
    { key: "film", label: "Film długi, z którego pochodzi (opcjonalnie)", rows: 3, placeholder: "wklej scenariusz lub transkrypcję albo tytuł i link; puste = Short samodzielny" },
    { key: "odbiorcy", label: "Odbiorcy", placeholder: "domyślnie osoby dbające o skórę, 25-45 lat" },
    { key: "dlugosc", label: "Długość", placeholder: "domyślnie 30-50 sekund" },
    pole.linki,
    pole.materialy(),
  ],

  // Stories
  "stories-sklep": [
    pole.temat("Temat serii", "np. nowość w sklepie, rytuał wieczorny, quiz o SPF"),
    { key: "wystepuje", label: "Kto występuje", required: true, placeholder: "np. Joanna z zespołu sklepu, same ujęcia produktów" },
    { key: "produkty", label: "Produkty (opcjonalnie)", rows: 2, placeholder: "nazwa handlowa, pojemność, kluczowe cechy z karty produktu" },
    { key: "cel", label: "Cel i wezwanie do działania", placeholder: "np. kliknięcie w link, odpowiedź w ankiecie, wiadomość" },
    { key: "plansze", label: "Liczba plansz", placeholder: "domyślnie 5-7" },
    pole.linki,
    pole.materialy(),
    pole.wspolpraca,
  ],
  "stories-klinika": [
    pole.temat("Temat serii", "np. dzień w klinice, jak przygotować się do zabiegu, pytania do lekarza"),
    { key: "wystepuje", label: "Kto występuje", required: true, placeholder: "np. kosmetolożka kliniki, recepcja, lekarz" },
    { key: "usluga", label: "Usługa lub zabieg (opcjonalnie)", placeholder: "tylko informacyjnie" },
    { key: "cel", label: "Cel i wezwanie do działania", placeholder: "np. pytania w naklejce, zapis na konsultację" },
    { key: "plansze", label: "Liczba plansz", placeholder: "domyślnie 5-7" },
    pole.linki,
    pole.materialy("opis usługi z naszej strony, zalecenia, przeciwwskazania"),
  ],

  // Reklama wideo
  "reklama-sklep": [
    { key: "temat", label: "Produkt lub zestaw w reklamie", required: true, rows: 2, placeholder: "nazwa handlowa, pojemność, kluczowe cechy z karty produktu" },
    { key: "cel", label: "Cel kampanii", required: true, placeholder: "np. sprzedaż, ruch na stronę produktu, zasięg nowości" },
    { key: "odbiorcy", label: "Grupa docelowa", placeholder: "domyślnie osoby dbające o skórę, 25-45 lat; bez danych wrażliwych" },
    { key: "platformy", label: "Platformy", placeholder: "domyślnie Meta (Instagram, Facebook), TikTok, YouTube" },
    { key: "dlugosc", label: "Długość", placeholder: "domyślnie 15-20 sekund i wersja 6 sekund" },
    { key: "oferta", label: "Oferta lub promocja", placeholder: "tylko jeśli obowiązuje; z datami" },
    { key: "wystepuje", label: "Kto lub co występuje", placeholder: "domyślnie same ujęcia produktu i dłoni, lektor" },
    pole.linki,
    pole.materialy(),
  ],
};

// ---------- Wspólne bloki promptów ----------

const DANE = (tytul, kind) => `${tytul}\n${FIELDS[kind].map(f => `• ${f.label.replace(/ \(opcjonalnie\)$/, "")}: [wpisz]`).join("\n")}`;

const HEAD = {
  ytKlinika: "Jesteś scenarzystą filmów na YouTube i redaktorem treści medycznych Kliniki Lemoné (lemone.pl, medycyna estetyczna i trychologia, Częstochowa).",
  ytSklep: "Jesteś scenarzystą filmów na YouTube i redaktorem treści sklepu Lemoné (sklep.lemone.pl, kosmetyki premium i suplementy).",
  shortsKlinika: "Jesteś scenarzystą YouTube Shorts i redaktorem treści Kliniki Lemoné (lemone.pl, medycyna estetyczna i trychologia, Częstochowa).",
  shortsSklep: "Jesteś scenarzystą YouTube Shorts i redaktorem treści sklepu Lemoné (sklep.lemone.pl, kosmetyki premium i suplementy).",
  storiesKlinika: "Jesteś twórcą serii Stories (Instagram, Facebook) i redaktorem treści Kliniki Lemoné (lemone.pl, medycyna estetyczna, Częstochowa).",
  storiesSklep: "Jesteś twórcą serii Stories (Instagram, Facebook) i redaktorem treści sklepu Lemoné (sklep.lemone.pl, kosmetyki premium i suplementy).",
  reklamaSklep: "Jesteś scenarzystą reklam wideo w mediach społecznościowych i redaktorem treści sklepu Lemoné (sklep.lemone.pl, kosmetyki premium i suplementy).",
};

const WERYFIKACJA = "Jeśli masz dostęp do internetu, zweryfikuj kluczowe fakty w aktualnych, wiarygodnych źródłach i podaj je przy tezach. Nie wymyślaj statystyk, badań ani zaleceń.";

const YT_FORMAT = `1. ZASADY FILMU

Planowanie:
- Jedno główne pytanie widza i jedna uczciwa obietnica filmu; nie omawiaj wszystkiego.
- Tytuł, miniatura i początek filmu obiecują to samo, co film rzeczywiście dostarcza. Bez sensacji, straszenia i "sekretów".
Otwarcie:
- Konkretne pytanie, sytuacja albo zweryfikowany fakt; w pierwszych około 30 sekundach widz wie, czego się dowie i po co.
- Pierwsza wartościowa odpowiedź możliwie wcześnie; prowadzący przedstawiony krótko, bez długiej czołówki.
Rozwinięcie:
- Kilka najważniejszych punktów zamiast encyklopedii; krótkie zdania, codzienne słowa, konkretne przykłady.
- Terminy fachowe wyjaśniane przy pierwszym użyciu; po trudniejszym fragmencie krótkie podsumowanie.
- Plansze, zbliżenia i zmiany ujęcia tam, gdzie pomagają zrozumieć; bez mechanicznych cięć i sztucznego napięcia.
Zakończenie:
- Najważniejszy wniosek, najwyżej 3 rzeczy do zapamiętania, jedno wezwanie do działania (najlepiej do powiązanego materiału).
- Pytanie do komentarzy nie może zachęcać do ujawniania danych zdrowotnych.
Język neutralny rodzajowo ("Twoja skóra", nie "jesteś zmęczona"). Nie wymyślaj doświadczeń prowadzących, historii klientów ani wyników; przykład fikcyjny oznacz jako hipotetyczny.`;

const ytOutput = (kolumnaTekstu) => `3. ZWRÓĆ WYNIK

A. KRÓTKI BRIEF
Odbiorca, główne pytanie, obietnica filmu, cel, proponowana długość i przyjęte założenia.
B. TYTUŁY I MINIATURY
Trzy zestawy (tytuł pod wyszukiwanie, tytuł z ciekawością bez sensacji, tytuł z praktyczną korzyścią), do każdego pomysł na miniaturę i krótki napis; rekomendacja z uzasadnieniem.
C. DWA WARIANTY OTWARCIA
Dwie kompletne propozycje pierwszych 20-30 sekund; wybierz jedną do scenariusza.
D. PEŁNY SCENARIUSZ
Tabela z kolumnami: orientacyjny czas; ${kolumnaTekstu}; obraz, plansza lub napis; źródło albo uwaga do weryfikacji. Tekst naturalny, mówiony, gotowy do promptera; czasy szacowane z liczby słów i oznaczone jako orientacyjne.
E. TEKST DO PROMPTERA
Ten sam tekst wypowiedzi w czystej wersji.
F. PAKIET PUBLIKACYJNY
Opis filmu, rozdziały zgodne ze scenariuszem (znaczniki czasu do dopasowania po montażu), lista źródeł, linki do naszych stron, jedno bezpieczne pytanie do komentarzy, propozycja 2-3 Shorts wyciętych z filmu (moment w scenariuszu i hook).
G. KONTROLA JAKOŚCI
Czy film realizuje obietnicę tytułu i miniatury, czy początek szybko daje wartość, czy język jest zrozumiały, czy twierdzenia mają źródła, czy czas odpowiada długości. Na końcu kwestie do decyzji przed nagraniem.
H. PLAN OCENY PO PUBLIKACJI
3 hipotezy do sprawdzenia w YouTube Analytics (początek filmu, trudniejszy fragment, zgodność tytułu z oczekiwaniami). Bez uniwersalnych progów sukcesu.`;

const SHORTS_FORMAT = `1. ZASADY FORMATU (YouTube Shorts)

- Pion 9:16, domyślnie 30-50 sekund, najwyżej 60 sekund. Jedna myśl na Shorta.
- Pierwsza sekunda decyduje: hook w obrazie i w zdaniu, od razu do rzeczy, bez powitań i przedstawiania się.
- Shorts są wyszukiwane i polecane jak filmy: tytuł zawiera frazę, którą widz wpisałby w wyszukiwarkę.
- Zakończenie może płynnie przechodzić w początek (zapętlenie), jeśli to naturalne.
- Jeżeli podano film długi: wybierz z niego najmocniejszy, samodzielnie zrozumiały fragment, skróć go i dopisz hook; Short odsyła do pełnego filmu (funkcja powiązanego filmu). Bez filmu długiego: Short samodzielny.
- Każda scena ma krótki napis na ekranie (do 6-8 słów); ujęcia możliwe do nagrania telefonem.
- Język neutralny rodzajowo. Nie wymyślaj doświadczeń, opinii ani wyników.`;

const SHORTS_OUTPUT = `3. ZWRÓĆ WYNIK

A. BRIEF
Jedna myśl, odbiorca, wezwanie do działania, długość, źródło materiału (fragment filmu długiego albo Short samodzielny) i przyjęte założenia.
B. TRZY WARIANTY HOOKA
Każdy: pierwsze zdanie, obraz pierwszej sekundy, napis. Przy filmie długim: trzy kandydujące fragmenty z uzasadnieniem. Wskaż najlepszy.
C. SCENARIUSZ
Tabela z kolumnami: czas; tekst mówiony lub lektor; ujęcie i obraz; napis na ekranie. Czasy orientacyjne.
D. TEKST DO PROMPTERA LUB LEKTORA
Czysty tekst mówiony z tabeli C.
E. TYTUŁ, OPIS I POWIĄZANY FILM
3 propozycje tytułu (do 100 znaków, z frazą wyszukiwaną), krótki opis, 3-5 hashtagów, który film długi podpiąć jako powiązany.
F. KONTROLA ZGODNOŚCI
Sprawdź punkty z części 2 i wypisz kwestie do decyzji przed publikacją.
G. PLAN OCENY
3 hipotezy: odsetek widzów, którzy zostali (a nie przewinęli), średni czas oglądania, przejścia do powiązanego filmu. Bez uniwersalnych progów.`;

const STORIES_FORMAT = `1. ZASADY FORMATU (Stories)

- Seria pionowych plansz 9:16, domyślnie 5-7; każda plansza 5-15 sekund (wideo, zdjęcie albo plansza z tekstem).
- Pierwsza plansza mówi, o czym jest seria i po co oglądać dalej. Każda kolejna ma jeden cel.
- Stories są bezpośrednie i codzienne: mówienie do kamery, kulisy, ręce przy produkcie; mniej produkcji, więcej autentyczności.
- Wykorzystuj naklejki interaktywne tam, gdzie mają sens: ankieta, quiz, suwak, pytanie, link; najwyżej jedna naklejka na planszę.
- Napisy krótkie i czytelne, z dala od krawędzi ekranu (tam są elementy interfejsu).
- Ostatnia plansza: jedno wezwanie do działania (link, wiadomość, odpowiedź).
- Język neutralny rodzajowo. Nie wymyślaj doświadczeń, opinii ani wyników.`;

const STORIES_OUTPUT = `3. ZWRÓĆ WYNIK

A. BRIEF
Cel serii, odbiorca, jeden przekaz, wezwanie do działania, liczba plansz i przyjęte założenia.
B. TRZY POMYSŁY NA PIERWSZĄ PLANSZĘ
Każdy: obraz, zdanie, napis. Wskaż najlepszy.
C. SEKWENCJA PLANSZ
Tabela z kolumnami: plansza i czas; tekst mówiony lub lektor (puste, jeśli plansza bez mowy); obraz; napis i naklejka.
D. TEKST DO NAGRANIA
Czysty tekst mówiony z tabeli C.
E. NAKLEJKI, LINK I WYRÓŻNIONE
Treść każdej naklejki (pytanie ankiety z odpowiedziami, quiz z poprawną odpowiedzią), link i jego podpis, czy i do której kolekcji wyróżnionych dodać serię wraz z nazwą okładki.
F. KONTROLA ZGODNOŚCI
Sprawdź punkty z części 2 i wypisz kwestie do decyzji przed publikacją.
G. PLAN OCENY
3 hipotezy: odpływ widzów między planszami, odpowiedzi na naklejki, kliknięcia w link. Bez uniwersalnych progów.`;

const REKLAMA_FORMAT = `1. ZASADY FORMATU (reklama wideo)

- Wersja główna pion 9:16; scenariusz musi dać się przyciąć do 4:5 lub 1:1 (feed) i 16:9 (YouTube): najważniejsze rzeczy w środku kadru.
- Marka lub produkt widoczne w pierwszych 3 sekundach. Hook w pierwszych 1-2 sekundach, bez clickbaitu.
- Jeden problem pielęgnacyjny, jedna korzyść, jeden dowód (tekstura, sposób użycia, fakt z karty produktu), jedno wezwanie do działania.
- Napisy na każdej scenie (reklamy są oglądane bez dźwięku); tekst na ekranie oszczędny.
- Trzy różne hooki do testu A/B przy tym samym środku i zakończeniu, żeby wynik testu mówił, który początek działa.
- Wersja skrócona 6 sekund (bumper) z tym samym przekazem.
- Klinika nie ma tego rodzaju: reklama świadczeń zdrowotnych podlega ograniczeniom prawnym; materiały kliniki przygotowuj jako informacyjne (rolki, Shorts, Stories).`;

const REKLAMA_ZGODNOSC = `${SKLEP_ZGODNOSC}
- Zasady platform reklamowych: bez zwracania się do cech osobistych odbiorcy ("Masz trądzik?", "Twoje zmarszczki"), bez zdjęć "przed i po", bez nierealnych obietnic efektów i bez sugerowania, że odbiorca ma problem zdrowotny.
- Oferta, cena i terminy promocji tylko z danych; warunki promocji w opisie.`;

const REKLAMA_OUTPUT = `3. ZWRÓĆ WYNIK

A. BRIEF KAMPANII
Cel, grupa docelowa, jeden problem i jedna korzyść, dowód, wezwanie do działania, platformy, długości i przyjęte założenia.
B. TRZY HOOKI DO TESTU A/B
Każdy: pierwsze 1-2 sekundy (obraz, zdanie, napis) i hipoteza, dlaczego może działać. Środek i zakończenie wspólne.
C. SCENARIUSZ
Tabela z kolumnami: czas; tekst lektora; ujęcie i obraz; napis na ekranie. Wersja główna z najlepszym hookiem; na końcu tabeli wiersze wersji 6 sekund.
D. TEKST LEKTORA
Czysty tekst lektora z tabeli C.
E. TEKSTY REKLAMY I WERSJE FORMATÓW
Tekst główny (2 warianty, do 125 znaków), nagłówek (do 40 znaków), przycisk wezwania do działania, uwagi do przycięcia na 4:5, 1:1 i 16:9.
F. KONTROLA ZGODNOŚCI I ZASAD PLATFORM
Sprawdź punkty z części 2 i wypisz kwestie do decyzji przed uruchomieniem kampanii.
G. PLAN TESTU
Jak przeprowadzić test trzech hooków (jedna zmienna naraz), które wskaźniki porównać (obejrzenia pierwszych 3 sekund, kliknięcia, koszt wyniku) i kiedy zdecydować. Bez uniwersalnych progów.`;

const zloz = (head, opis, dane, format, zgodnosc, output, extra = "") =>
  `${head} ${opis}\n\n${extra ? extra + "\n\n" : ""}${dane}\n\n${format}\n\n${zgodnosc}\n\n${output}`;

// ---------- Rodzaje ----------
// group = kanał (patrz GROUPS w scenario.jsx), format = układ sekcji wyniku, cel = profil i zgodność
// opis i spec trafiają do karty "Format" w zakładce Nowy scenariusz

export const FORMATY = {
  "yt-klinika-zabieg": {
    label: "Klinika: zabieg od konsultacji do efektu", cel: "klinika", group: "youtube", format: "long", webSearch: true,
    tableHead: "<th>Czas (orientacyjny)</th><th>Tekst prowadzącego</th><th>Obraz, plansza lub napis</th><th>Źródło lub uwaga do weryfikacji</th>",
    opis: "Film pokazujący jedną usługę krok po kroku: konsultacja i kwalifikacja, przebieg zabiegu, odczucia, zalecenia po zabiegu, realne oczekiwania co do efektu. Buduje zaufanie przed pierwszą wizytą.",
    spec: { proporcje: "16:9", dlugosc: "6-10 min", platformy: "YouTube" },
    prompt: zloz(HEAD.ytKlinika, `Przygotuj kompletny scenariusz filmu, który pokazuje jeden zabieg lub jedną usługę od konsultacji do efektu.

Film prowadzi widza przez całą ścieżkę: dla kogo jest zabieg, jak wygląda konsultacja i kwalifikacja, przygotowanie, przebieg (z komentarzem specjalisty), odczucia, zalecenia po zabiegu, kiedy i jakich efektów realnie się spodziewać, przeciwwskazania. Odpowiada na obawy (ból, bezpieczeństwo, czas powrotu do codzienności), nie sprzedaje zabiegu.`,
      DANE("DANE DO FILMU", "yt-klinika-zabieg"), YT_FORMAT,
      `${KLINIKA_ZGODNOSC}\n- Nagrywanie osoby poddającej się zabiegowi tylko za jej pisemną zgodą; bez zgody ujęcia bez twarzy i bez cech pozwalających ją rozpoznać.`,
      ytOutput("dokładny tekst prowadzącego i specjalisty (z oznaczeniem, kto mówi)"), WERYFIKACJA),
  },
  "yt-klinika-rozmowa": {
    label: "Klinika: rozmowa z ekspertem (podcast wideo)", cel: "klinika", group: "youtube", format: "long", webSearch: true,
    tableHead: "<th>Czas (orientacyjny)</th><th>Wypowiedź (kto mówi)</th><th>Obraz, plansza lub napis</th><th>Źródło lub uwaga do weryfikacji</th>",
    opis: "Rozmowa prowadzącego z lekarzem lub specjalistą wokół jednego tematu i pytań widzów. Scenariusz to plan pytań z kluczowymi odpowiedziami, nie tekst do wyrecytowania.",
    spec: { proporcje: "16:9", dlugosc: "15-25 min", platformy: "YouTube, podcast" },
    prompt: zloz(HEAD.ytKlinika, `Przygotuj scenariusz rozmowy wideo (podcast wideo) prowadzącego z ekspertem kliniki.

Rozmowa krąży wokół jednego tematu i prawdziwych pytań widzów. Prowadzący reprezentuje widza: pyta prosto, dopytuje o konkret, prosi o przykład. Ekspert odpowiada zrozumiale. Scenariusz zawiera dokładne pytania prowadzącego i kluczowe tezy odpowiedzi eksperta do rozwinięcia własnymi słowami; nie pisz za eksperta długich monologów.`,
      DANE("DANE DO FILMU", "yt-klinika-rozmowa"), YT_FORMAT,
      KLINIKA_ZGODNOSC,
      ytOutput("wypowiedź z oznaczeniem PROWADZĄCY: albo EKSPERT: (pytania dosłownie, odpowiedzi eksperta jako kluczowe tezy)"), WERYFIKACJA),
  },
  "yt-sklep-poradnik": {
    label: "Sklep: poradnik pielęgnacyjny z ekspertem", cel: "sklep", group: "youtube", format: "long",
    tableHead: "<th>Czas (orientacyjny)</th><th>Tekst prowadzącego</th><th>Obraz, plansza lub napis</th><th>Źródło lub uwaga do weryfikacji</th>",
    opis: "Film edukacyjny sklepu: jak dobrać i stosować pielęgnację, jak łączyć składniki, jak czytać skład. Produkty pojawiają się jako przykłady, film nie jest reklamą.",
    spec: { proporcje: "16:9", dlugosc: "8-12 min", platformy: "YouTube" },
    prompt: zloz(HEAD.ytSklep, `Przygotuj kompletny scenariusz filmu poradnikowego prowadzonego przez eksperta sklepu.

Poradnik uczy jednej umiejętności pielęgnacyjnej: dobór, kolejność, łączenie składników, częstotliwość, typowe błędy. Widz po filmie umie to zastosować u siebie. Produkty ze sklepu mogą się pojawić jako przykłady z uzasadnieniem, dla kogo są; poradnik nie jest reklamą.`,
      DANE("DANE DO FILMU", "yt-sklep-poradnik"), YT_FORMAT, SKLEP_ZGODNOSC,
      ytOutput("dokładny tekst prowadzącego")),
  },
  "yt-sklep-zestawienie": {
    label: "Sklep: zestawienie lub porównanie produktów", cel: "sklep", group: "youtube", format: "long",
    tableHead: "<th>Czas (orientacyjny)</th><th>Tekst prowadzącego</th><th>Obraz, plansza lub napis</th><th>Źródło lub uwaga do weryfikacji</th>",
    opis: "Uczciwe porównanie kilku produktów według jasnych kryteriów: który dla kogo. Odpowiednik artykułu typu ranking, z demonstracją tekstur i aplikacji.",
    spec: { proporcje: "16:9", dlugosc: "10-14 min", platformy: "YouTube" },
    prompt: zloz(HEAD.ytSklep, `Przygotuj kompletny scenariusz filmu z zestawieniem lub porównaniem produktów.

Film porównuje podane produkty według jawnych kryteriów i kończy się podpowiedzią "który dla kogo", a nie jednym zwycięzcą dla wszystkich. Każdy produkt ma ten sam schemat prezentacji: dla kogo, składniki aktywne, tekstura i aplikacja na ekranie, sposób użycia, na co uważać. Plansza porównawcza na końcu.`,
      DANE("DANE DO FILMU", "yt-sklep-zestawienie"), YT_FORMAT,
      `${SKLEP_ZGODNOSC}\n- Porównanie oparte tylko na faktach z kart produktów; bez dyskredytowania produktów i marek, bez ocen, których nie da się uzasadnić.`,
      ytOutput("dokładny tekst prowadzącego")),
  },

  "shorts-klinika": {
    label: "Klinika: Short z lekarzem lub specjalistą", cel: "klinika", group: "shorts", format: "shorts", webSearch: true,
    opis: "Jedna myśl w mniej niż minutę: odpowiedź na pytanie, mit, wskazówka. Samodzielny albo wycięty z filmu długiego, z odesłaniem do pełnego filmu.",
    spec: { proporcje: "9:16", dlugosc: "30-50 s (maks. 60 s)", platformy: "YouTube Shorts" },
    prompt: zloz(HEAD.shortsKlinika, `Przygotuj kompletny scenariusz YouTube Shorta, w którym lekarz albo specjalista kliniki przekazuje jedną myśl.`,
      DANE("DANE DO SHORTA", "shorts-klinika"), SHORTS_FORMAT, KLINIKA_ZGODNOSC, SHORTS_OUTPUT, WERYFIKACJA),
  },
  "shorts-sklep": {
    label: "Sklep: Short poradnikowy lub produktowy", cel: "sklep", group: "shorts", format: "shorts",
    opis: "Szybka wskazówka pielęgnacyjna albo pokazanie produktu w akcji. Samodzielny albo wycięty z poradnika na YouTube.",
    spec: { proporcje: "9:16", dlugosc: "30-50 s (maks. 60 s)", platformy: "YouTube Shorts" },
    prompt: zloz(HEAD.shortsSklep, `Przygotuj kompletny scenariusz YouTube Shorta sklepu: jedna wskazówka pielęgnacyjna albo jeden produkt pokazany w użyciu.`,
      DANE("DANE DO SHORTA", "shorts-sklep"), SHORTS_FORMAT, SKLEP_ZGODNOSC, SHORTS_OUTPUT),
  },

  "stories-sklep": {
    label: "Sklep: seria Stories (nowość, rytuał, quiz)", cel: "sklep", group: "stories", format: "stories",
    opis: "Kilka plansz opowiadających jedną historię z naklejkami interaktywnymi: nowość w sklepie, rytuał krok po kroku, quiz o składnikach.",
    spec: { proporcje: "9:16", dlugosc: "5-7 plansz po 5-15 s", platformy: "Instagram, Facebook" },
    prompt: zloz(HEAD.storiesSklep, `Przygotuj kompletną serię Stories sklepu.`,
      DANE("DANE DO STORIES", "stories-sklep"), STORIES_FORMAT, SKLEP_ZGODNOSC, STORIES_OUTPUT),
  },
  "stories-klinika": {
    label: "Klinika: seria Stories (dzień w klinice, pytania)", cel: "klinika", group: "stories", format: "stories",
    opis: "Kulisy i codzienność kliniki, przygotowanie do zabiegu, zbieranie pytań do lekarza. Informuje i ociepla wizerunek, nie sprzedaje zabiegów.",
    spec: { proporcje: "9:16", dlugosc: "5-7 plansz po 5-15 s", platformy: "Instagram, Facebook" },
    prompt: zloz(HEAD.storiesKlinika, `Przygotuj kompletną serię Stories kliniki.`,
      DANE("DANE DO STORIES", "stories-klinika"), STORIES_FORMAT,
      `${KLINIKA_ZGODNOSC}\n- Naklejka z pytaniem nie może zachęcać do przesyłania danych zdrowotnych ani zdjęć zmian skórnych; zapraszaj do konsultacji.`,
      STORIES_OUTPUT),
  },

  "reklama-sklep": {
    label: "Sklep: reklama wideo produktu (test A/B)", cel: "sklep", group: "reklama", format: "ad",
    opis: "Płatna reklama jednego produktu z trzema hookami do testu A/B, tekstami reklamy i wersją 6 sekund. Tylko sklep: reklama świadczeń kliniki podlega ograniczeniom prawnym.",
    spec: { proporcje: "9:16 (+ 4:5, 1:1, 16:9)", dlugosc: "15-20 s + 6 s", platformy: "Meta, TikTok, YouTube" },
    prompt: zloz(HEAD.reklamaSklep, `Przygotuj kompletny scenariusz reklamy wideo jednego produktu lub zestawu, gotowy do testu A/B.`,
      DANE("DANE DO REKLAMY", "reklama-sklep"), REKLAMA_FORMAT, REKLAMA_ZGODNOSC, REKLAMA_OUTPUT),
  },
};

export const formatFields = (kind) => FIELDS[kind];
