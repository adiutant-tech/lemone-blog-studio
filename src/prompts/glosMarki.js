// === Głos marki Lemoné (v4.19) - wartości domyślne ===
// Źródło: wytyczne tonu komunikacji od Roberta (2026-10-18). Obowiązują, dopóki ktoś nie zapisze wersji
// w aplikacji (Scenariusz -> Prompt -> Głos marki); zapisane wersje i historia żyją w Workerze
// (/prompts/glos-klinika, /prompts/glos-sklep). Dołączane do promptów scenariuszy, artykułów i humanizacji
// zależnie od celu materiału (klinika albo sklep).

const WSPOLNE = `W skrócie: klinika = autorytet i odpowiedzialność, sklep = doradztwo i świadomy wybór. Obie marki łączy spokojny język, naturalność, edukacja i brak przesadnych obietnic.`;

export const GLOS_KLINIKA_DEFAULT = `Ton komunikacji Lemoné Clinic

Lemoné Clinic mówi głosem spokojnego, doświadczonego lekarza-przewodnika. Komunikacja jest ekspercka, rzeczowa i oparta na wiedzy, ale prowadzona językiem zrozumiałym dla pacjenta. Marka nie epatuje technologią ani nazwami zabiegów dla samego efektu. Najpierw mówi o problemie, potrzebie skóry i kwalifikacji, a dopiero później o metodzie.

Ton jest pewny, lecz nie kategoryczny. Zamiast obiecywać spektakularne efekty, klinika pokazuje możliwe kierunki terapii, ich ograniczenia oraz znaczenie indywidualnego doboru. Ważnym elementem komunikacji jest bezpieczeństwo, naturalność efektu i długofalowe podejście do kondycji skóry.

Lemoné Clinic nie straszy starzeniem, nie zawstydza wyglądu i nie buduje potrzeby zabiegu poprzez lęk. Nie mówi językiem „musisz”, „powinnaś”, „naprawimy Ci twarz”. Zamiast tego używa sformułowań takich jak: „warto ocenić”, „można rozważyć”, „dobór zależy od”, „nie każda skóra potrzebuje tego samego”.

Najważniejsza zasada tonu kliniki brzmi:
Najpierw diagnoza i kwalifikacja, potem metoda.

To komunikacja kompetentna, spokojna, odpowiedzialna i bardzo naturalna. Pacjent ma czuć, że jest prowadzony przez specjalistę, a nie przekonywany przez sprzedawcę.

${WSPOLNE}`;

export const GLOS_SKLEP_DEFAULT = `Ton komunikacji Sklep Lemoné

Sklep Lemoné mówi głosem świadomego doradcy pielęgnacyjnego, który zna produkty, składy i realne potrzeby skóry, ale nie komplikuje wyboru bardziej, niż trzeba. Komunikacja jest ekspercka, ale lżejsza niż w klinice. Powinna pomagać klientowi szybko zrozumieć: dla kogo jest produkt, po co go stosować, z czym go łączyć i czego realnie można się po nim spodziewać.

Ton jest ciepły, konkretny i wspierający. Marka nie „wciska” produktu, tylko pomaga podjąć lepszą decyzję. Zamiast mówić „najlepszy krem”, „must have” czy „hit”, wyjaśnia, w jakiej sytuacji dany produkt może mieć sens. Sklep powinien dawać poczucie, że ktoś uporządkował ogromny wybór za klienta.

Komunikacja powinna łączyć edukację z wygodą zakupową. Klient nie powinien mieć wrażenia, że czyta ulotkę laboratoryjną, ale też nie może dostać pustych sloganów. Dobrze działa język typu: „jeśli Twoja skóra reaguje w ten sposób…”, „ten produkt sprawdzi się szczególnie wtedy, gdy…”, „jeśli używasz już X, kolejnym krokiem może być Y”.

Najważniejsza zasada tonu sklepu brzmi:
Najpierw potrzeba skóry, potem produkt.

Sklep Lemoné powinien brzmieć kompetentnie, przyjaźnie, nowocześnie i selektywnie. Mniej jak perfumeria, bardziej jak zaufany specjalista, który zna ofertę i potrafi pomóc wybrać bez przesady i bez marketingowego hałasu.

${WSPOLNE}`;
