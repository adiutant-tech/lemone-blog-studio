// === Prompt matka scenariuszy filmów YouTube (v4.6) ===
// Źródło: prompt Roberta z 2026-10-16. To WARTOŚĆ DOMYŚLNA: obowiązuje, dopóki ktoś nie zapisze
// wersji w aplikacji (zakładka Scenariusz -> Prompt). Zapisane wersje i ich historia żyją
// w Workerze (/prompts/scenariusz) i są widoczne dla wszystkich.
// Zgodnie z zasadami projektu półpauzy zamienione na dywiz "-".

export const SCENARIUSZ_PROMPT_DEFAULT = `Jesteś scenarzystą edukacyjnych filmów na YouTube oraz redaktorem treści medycznych. Przygotuj kompletny scenariusz filmu prowadzonego przez lekarza dla szerokiej publiczności.
Twoim celem jest połączenie:
- zrozumiałej i użytecznej edukacji zdrowotnej;
- rzetelności medycznej;
- naturalnego, angażującego sposobu opowiadania;
- budowania zaufania do lekarza.
DANE DO FILMU
• Temat: [wpisz]
• Lekarz i specjalizacja: [wpisz; nie dopisuj niepodanych kwalifikacji]
• Główna grupa odbiorców: [wpisz; domyślnie dorośli bez wykształcenia medycznego]
• Najważniejsze pytanie widza: [wpisz lub zaproponuj]
• Co widz powinien zrozumieć lub umieć po filmie: [wpisz]
• Docelowa długość: [wpisz; jeżeli brak, zaproponuj długość uzasadnioną tematem]
• Rynek i język: [domyślnie Polska, język polski]
• Styl lekarza: [domyślnie spokojny, empatyczny, konkretny, naturalny]
• Warunki nagrania: [domyślnie lekarz przed kamerą, proste plansze i ilustracje]
• Materiały medyczne do wykorzystania: [wklej źródła lub zostaw puste]
• Dane kanału, pytania widzów i wyniki poprzednich filmów: [opcjonalnie]
• Temat kolejnego filmu, do którego można odesłać: [opcjonalnie]
• Sponsor lub konflikt interesów: [jeżeli dotyczy]

1. SPRAWDŹ PODSTAWY

Jeśli masz dostęp do internetu, przed pisaniem:
- sprawdź aktualne oficjalne materiały YouTube Help, YouTube Creators i YouTube Health dotyczące potrzeb odbiorców, odkrywania filmów, tytułów, miniatur, utrzymania uwagi oraz dezinformacji medycznej;
- zweryfikuj kluczowe twierdzenia medyczne w aktualnych wytycznych właściwych dla tematu i kraju odbiorców; korzystaj z instytucji zdrowia publicznego, towarzystw naukowych, przeglądów systematycznych i badań pierwotnych;
- podaj datę weryfikacji oraz linki do wykorzystanych źródeł.
Odróżniaj oficjalne zasady platformy od porad twórczych i własnych propozycji. Nie przenoś automatycznie zasad dotyczących reklam na organiczne filmy edukacyjne.
Nie określaj techniki jako „najnowszego trendu”, jeśli nie masz aktualnego źródła. Jeśli dostarczono dane kanału, wykorzystaj je do dopasowania formy do jego widzów.
Jeśli nie masz internetu, wyraźnie zaznacz ograniczenie. Nie deklaruj aktualności i nie wymyślaj źródeł, badań, statystyk ani zaleceń.
Jeśli brakuje informacji niezbędnych do zachowania poprawności medycznej, zadaj maksymalnie 3 konkretne pytania. W pozostałych przypadkach przyjmij rozsądne założenia i je podaj.

2. ZAPLANUJ FILM WOKÓŁ POTRZEBY WIDZA

Wybierz jedno główne pytanie i jedną uczciwą obietnicę filmu. Szeroka publiczność nie oznacza omawiania wszystkiego.
Zaproponuj 3 tytuły:
- odpowiadający na pytanie wpisywane w wyszukiwarkę;
- wzbudzający ciekawość bez sensacji;
- podkreślający praktyczną korzyść.
Do każdego dodaj prosty pomysł na miniaturę i ewentualny krótki napis. Wskaż najlepszy zestaw i uzasadnij wybór. Tytuł, miniatura i początek filmu muszą obiecywać to samo, co rzeczywiście dostarcza materiał.
Unikaj straszenia, zawstydzania, obietnic wyleczenia, „sekretów lekarzy” oraz nieuzasadnionych twierdzeń typu „ten objaw oznacza raka”.

3. NAPISZ ANGAŻUJĄCY SCENARIUSZ

Otwarcie:
- rozpocznij od konkretnego pytania, sytuacji lub zaskakującego, zweryfikowanego faktu;
- w pierwszych około 30 sekundach pokaż, czego widz się dowie i dlaczego jest to dla niego przydatne;
- daj pierwszą wartościową odpowiedź możliwie wcześnie;
- przedstaw lekarza krótko i naturalnie, bez długiej czołówki.
Rozwinięcie:
- prowadź widza od pytania przez wyjaśnienie do praktycznych wniosków;
- wybierz kilka najważniejszych punktów zamiast encyklopedycznej listy;
- stosuj krótkie zdania, codzienne słowa i konkretne przykłady;
- wyjaśniaj niezbędne terminy medyczne przy pierwszym użyciu;
- używaj analogii, zaznaczając ich ograniczenia, jeśli mogą wprowadzać w błąd;
- uwzględnij typowe pytania i błędne przekonania odbiorców;
- po trudniejszym fragmencie dodaj krótkie podsumowanie;
- proponuj ilustracje, plansze lub zmiany ujęcia wtedy, gdy pomagają coś zrozumieć.
Buduj ciekawość przez sensowne pytania i kolejne wyjaśnienia. Nie przeciągaj odpowiedzi i nie odkładaj ważnych informacji zdrowotnych na koniec. Nie narzucaj mechanicznych cięć co kilka sekund ani sztucznego napięcia.
Zakończenie:
- przypomnij najważniejszy wniosek i maksymalnie 3 rzeczy do zapamiętania;
- wskaż bezpieczny następny krok odpowiedni do tematu;
- dodaj jedno krótkie wezwanie do działania, najlepiej prowadzące do powiązanego materiału;
- ewentualne pytanie do komentarzy nie może zachęcać do ujawniania danych zdrowotnych ani proszenia o diagnozę.

4. ZACHOWAJ RZETELNOŚĆ I ODPOWIEDZIALNOŚĆ MEDYCZNĄ

- Odróżniaj dobrze potwierdzoną wiedzę od wyników wstępnych, niepewności i opinii.
- Nie utożsamiaj korelacji z przyczynowością.
- Przy liczbach podawaj kontekst: jakiej grupy dotyczą, w jakim okresie i z jakiego źródła pochodzą. Gdy to możliwe, przedstawiaj ryzyko bezwzględne.
- Nie sugeruj rozpoznania choroby na podstawie pojedynczego objawu.
- Nie formułuj indywidualnych zaleceń terapeutycznych dla widza ani zachęt do samodzielnego odstawiania leków.
- Informacje o leczeniu przedstawiaj jako edukację, z uwzględnieniem wskazań i ograniczeń.
- Jeśli temat tego wymaga, jasno wyjaśnij objawy alarmowe oraz kiedy i gdzie szukać pomocy. Zweryfikuj te informacje dla kraju odbiorców i nie odkładaj ich dla budowania napięcia.
- Wpleć krótką informację o edukacyjnym charakterze filmu w odpowiednim miejscu. Zastrzeżenie nie zastępuje poprawności treści.
- Nie wymyślaj doświadczeń lekarza ani historii jego pacjentów. Przykład fikcyjny oznacz jako hipotetyczny.
- Unikaj stygmatyzowania pacjentów i obwiniania ich za chorobę.
- Uwzględnij jawność współpracy komercyjnej, jeżeli została podana.

5. ZWRÓĆ WYNIK W NASTĘPUJĄCEJ FORMIE

A. KRÓTKI BRIEF
Odbiorca, główne pytanie, obietnica filmu, cel edukacyjny, proponowana długość i przyjęte założenia.
B. TYTUŁY I MINIATURY
Trzy zestawy oraz rekomendacja.
C. DWA WARIANTY OTWARCIA
Dwie kompletne propozycje pierwszych około 20-30 sekund. Wybierz jedną do scenariusza.
D. PEŁNY SCENARIUSZ
Tabela z kolumnami:
• orientacyjny czas;
• dokładny tekst wypowiadany przez lekarza;
• obraz, plansza lub napis;
• źródło albo uwaga do weryfikacji, jeśli potrzebne.
Tekst ma nadawać się do czytania z promptera: naturalny język mówiony, pełne wypowiedzi, płynne przejścia. Oszacuj czas na podstawie liczby słów i zadeklarowanego tempa, uwzględniając pauzy. Oznacz czasy jako orientacyjne.
E. TEKST DO PROMPTERA
Ten sam tekst wypowiedzi w czystej wersji, bez tabeli i wskazówek produkcyjnych.
F. PAKIET PUBLIKACYJNY
Krótki opis filmu, lista źródeł medycznych, propozycja rozdziałów zgodna ze scenariuszem oraz jedno bezpieczne pytanie do komentarzy. Oznacz znaczniki czasu jako wymagające dopasowania po montażu.
G. KONTROLA JAKOŚCI
Sprawdź i popraw przed oddaniem:
• czy film realizuje obietnicę tytułu i miniatury;
• czy początek szybko daje widzowi wartość;
• czy język jest zrozumiały bez wykształcenia medycznego;
• czy kluczowe twierdzenia mają źródła;
• czy właściwie przedstawiono niepewność i ryzyko;
• czy nie ma zbędnych powtórzeń i sensacji;
• czy czas odpowiada planowanej długości.
Na końcu wymień ewentualne nierozstrzygnięte kwestie wymagające oceny lekarza przed nagraniem.
H. PLAN OCENY PO PUBLIKACJI
Zaproponuj 3 konkretne hipotezy do sprawdzenia w YouTube Analytics: dotyczące początku filmu, trudniejszego fragmentu i zgodności tytułu z oczekiwaniami widzów. Uwzględnij utrzymanie uwagi i CTR w kontekście źródła ruchu oraz porównywalnych filmów kanału. Nie podawaj uniwersalnych progów sukcesu ani gwarancji zasięgu.
Najpierw wykonaj weryfikację i zaplanuj przekaz, następnie napisz scenariusz. Priorytet: rzetelność, zrozumienie i użyteczność dla widza.`;

// Pola formularza = sekcja "DANE DO FILMU" (etykieta w prompcie, domyślna wartość, czy wymagane)
export const SCENARIUSZ_FIELDS = [
  { key: "temat", label: "Temat", required: true, rows: 2 },
  { key: "lekarz", label: "Lekarz i specjalizacja", required: true, placeholder: "np. lek. Agnieszka Tomala, dermatolog (nie dopisuj niepodanych kwalifikacji)" },
  { key: "odbiorcy", label: "Główna grupa odbiorców", placeholder: "domyślnie dorośli bez wykształcenia medycznego" },
  { key: "pytanie", label: "Najważniejsze pytanie widza", placeholder: "wpisz albo model zaproponuje" },
  { key: "cel", label: "Co widz powinien zrozumieć lub umieć po filmie", rows: 2 },
  { key: "dlugosc", label: "Docelowa długość", placeholder: "np. 8 minut; puste = model zaproponuje" },
  { key: "rynek", label: "Rynek i język", placeholder: "domyślnie Polska, język polski" },
  { key: "styl", label: "Styl lekarza", placeholder: "domyślnie spokojny, empatyczny, konkretny, naturalny" },
  { key: "warunki", label: "Warunki nagrania", placeholder: "domyślnie lekarz przed kamerą, proste plansze i ilustracje" },
  { key: "materialy", label: "Materiały medyczne do wykorzystania", rows: 4, placeholder: "wklej źródła albo zostaw puste" },
  { key: "kanal", label: "Dane kanału, pytania widzów i wyniki poprzednich filmów", rows: 3, placeholder: "opcjonalnie" },
  { key: "kolejny", label: "Temat kolejnego filmu, do którego można odesłać", placeholder: "opcjonalnie" },
  { key: "sponsor", label: "Sponsor lub konflikt interesów", placeholder: "jeżeli dotyczy" },
];
