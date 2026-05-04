import { useState, useMemo } from "react";
import { Copy, Check, FileText, Sparkles, AlertCircle, Loader2, RefreshCw, ChevronDown, ChevronRight, Package, Zap, Download, Plus, X } from "lucide-react";

// === CATEGORIES from Akeneo full export (export_Export_kategorii_2026-05-04, 1149 entries) ===
// Each entry has: n=Polish name, s=auto-derived slug, c=container (1 of 8 Akeneo top-level branches).
// Containers come from Akeneo "Drzewo kategorii Lemone nowe" (root code '2'); legacy 'Kategorie_lemone'
// branch (140 entries: kremy/balsamy/peelingi etc.) folded into 'pielegnacja' for full slug coverage.
// Slugs deterministically derived from Polish labels (PL→ASCII, lowercase, non-alphanum→hyphen).
// Live HEAD validation in /check-link disambiguates 'slug exists in PIM' from 'URL resolves on shop'.
const CATEGORIES = [
  {n:"Kosmetyki pielęgnacyjne",s:"/kosmetyki-pielegnacyjne",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji twarzy",s:"/kosmetyki-do-pielegnacji-twarzy",c:"pielegnacja"},
  {n:"Krem do twarzy na noc",s:"/krem-do-twarzy-na-noc",c:"pielegnacja"},
  {n:"Serum do twarzy na noc",s:"/serum-do-twarzy-na-noc",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji okolic oczu",s:"/kosmetyki-do-pielegnacji-okolic-oczu",c:"pielegnacja"},
  {n:"Odżywki do brwi i rzęs",s:"/odzywki-do-brwi-i-rzes",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji ust",s:"/kosmetyki-do-pielegnacji-ust",c:"pielegnacja"},
  {n:"Serum do ust",s:"/serum-do-ust",c:"pielegnacja"},
  {n:"Olejki do ust",s:"/olejki-do-ust",c:"pielegnacja"},
  {n:"Masełko do ust",s:"/maselko-do-ust",c:"pielegnacja"},
  {n:"Kosmetyki do biustu",s:"/kosmetyki-do-biustu",c:"pielegnacja"},
  {n:"Balsam do biustu",s:"/balsam-do-biustu",c:"pielegnacja"},
  {n:"Kosmetyki do higieny intymnej",s:"/kosmetyki-do-higieny-intymnej",c:"pielegnacja"},
  {n:"Krem do okolic intymnych",s:"/krem-do-okolic-intymnych",c:"pielegnacja"},
  {n:"Kosmetyki do paznokci",s:"/kosmetyki-do-paznokci",c:"pielegnacja"},
  {n:"Kosmetyki do szyi i dekoltu",s:"/kosmetyki-do-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji dłoni",s:"/kosmetyki-do-pielegnacji-dloni",c:"pielegnacja"},
  {n:"Kosmetyki do stóp",s:"/kosmetyki-do-stop",c:"pielegnacja"},
  {n:"Dezodorant do stóp",s:"/dezodorant-do-stop",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji ciała",s:"/kosmetyki-do-pielegnacji-ciala",c:"pielegnacja"},
  {n:"Mleczka do ciała",s:"/mleczka-do-ciala",c:"pielegnacja"},
  {n:"Mydła do ciała",s:"/mydla-do-ciala",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji zarostu",s:"/kosmetyki-do-pielegnacji-zarostu",c:"pielegnacja"},
  {n:"Kosmetyki do skóry głowy",s:"/kosmetyki-do-skory-glowy",c:"pielegnacja"},
  {n:"Wcierka do skóry głowy",s:"/wcierka-do-skory-glowy",c:"pielegnacja"},
  {n:"Szampon do skóry głowy",s:"/szampon-do-skory-glowy",c:"pielegnacja"},
  {n:"Ampułki do skóry głowy",s:"/ampulki-do-skory-glowy",c:"pielegnacja"},
  {n:"Beauty i Spa",s:"/beauty-i-spa",c:"pielegnacja"},
  {n:"Wody toaletowe",s:"/wody-toaletowe",c:"pielegnacja"},
  {n:"Rollery do twarzy",s:"/rollery-do-twarzy",c:"pielegnacja"},
  {n:"Masażery do twarzy",s:"/masazery-do-twarzy",c:"pielegnacja"},
  {n:"Maty masujące",s:"/maty-masujace",c:"pielegnacja"},
  {n:"Szczoteczki elektryczne",s:"/szczoteczki-elektryczne",c:"pielegnacja"},
  {n:"Szczoteczki ekologiczne",s:"/szczoteczki-ekologiczne",c:"pielegnacja"},
  {n:"Szczoteczki do zębów",s:"/szczoteczki-do-zebow",c:"pielegnacja"},
  {n:"Pasty do zębów bez fluoru",s:"/pasty-do-zebow-bez-fluoru",c:"pielegnacja"},
  {n:"Pasty do zębów z fluorem",s:"/pasty-do-zebow-z-fluorem",c:"pielegnacja"},
  {n:"Pasty do zębów ziołowe",s:"/pasty-do-zebow-ziolowe",c:"pielegnacja"},
  {n:"Pasty dla dzieci",s:"/pasty-dla-dzieci",c:"pielegnacja"},
  {n:"Nici dentystyczne",s:"/nici-dentystyczne",c:"pielegnacja"},
  {n:"Płyny do płukania ust",s:"/plyny-do-plukania-ust",c:"pielegnacja"},
  {n:"Irygatory do zębów",s:"/irygatory-do-zebow",c:"pielegnacja"},
  {n:"Olejki eteryczne do sauny",s:"/olejki-eteryczne-do-sauny",c:"pielegnacja"},
  {n:"Szlafroki do sauny",s:"/szlafroki-do-sauny",c:"pielegnacja"},
  {n:"Ręczniki do sauny",s:"/reczniki-do-sauny",c:"pielegnacja"},
  {n:"Olejki zapachowe",s:"/olejki-zapachowe",c:"pielegnacja"},
  {n:"Lampy relaksacyjne",s:"/lampy-relaksacyjne",c:"pielegnacja"},
  {n:"Kosmetyki do włosów",s:"/kosmetyki-do-wlosow",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji włosów",s:"/kosmetyki-do-pielegnacji-wlosow",c:"pielegnacja"},
  {n:"Balsamy do włosów",s:"/balsamy-do-wlosow",c:"pielegnacja"},
  {n:"Kosmetyki do stylizacji włosów",s:"/kosmetyki-do-stylizacji-wlosow",c:"pielegnacja"},
  {n:"Wosk do włosów",s:"/wosk-do-wlosow",c:"pielegnacja"},
  {n:"Guma do włosów",s:"/guma-do-wlosow",c:"pielegnacja"},
  {n:"Pianka do włosów",s:"/pianka-do-wlosow",c:"pielegnacja"},
  {n:"Kosmetyki do kręcenia włosów",s:"/kosmetyki-do-krecenia-wlosow",c:"pielegnacja"},
  {n:"Kosmetyki do prostowania włosów",s:"/kosmetyki-do-prostowania-wlosow",c:"pielegnacja"},
  {n:"Kosmetyki koloryzujące do włosów",s:"/kosmetyki-koloryzujace-do-wlosow",c:"pielegnacja"},
  {n:"Szampon koloryzujący",s:"/szampon-koloryzujacy",c:"pielegnacja"},
  {n:"Odżywka koloryzująca",s:"/odzywka-koloryzujaca",c:"pielegnacja"},
  {n:"Maska koloryzująca",s:"/maska-koloryzujaca",c:"pielegnacja"},
  {n:"Pianka koloryzująca",s:"/pianka-koloryzujaca",c:"pielegnacja"},
  {n:"Wosk koloryzujący",s:"/wosk-koloryzujacy",c:"pielegnacja"},
  {n:"Kosmetyki do włosów kręconych",s:"/kosmetyki-do-wlosow-kreconych",c:"pielegnacja"},
  {n:"Profesjonalne kosmetyki do włosów",s:"/profesjonalne-kosmetyki-do-wlosow",c:"pielegnacja"},
  {n:"Kategorie kosmetyków",s:"/kategorie-kosmetykow",c:"pielegnacja"},
  {n:"Kosmetyki do demakijażu",s:"/kosmetyki-do-demakijazu",c:"pielegnacja"},
  {n:"masło do demakijażu",s:"/maslo-do-demakijazu",c:"pielegnacja"},
  {n:"Kosmetyki do depilacji",s:"/kosmetyki-do-depilacji",c:"pielegnacja"},
  {n:"Kosmetyki złuszczające",s:"/kosmetyki-zluszczajace",c:"pielegnacja"},
  {n:"peelingi kwasowe",s:"/peelingi-kwasowe",c:"pielegnacja"},
  {n:"peelingi mechaniczne",s:"/peelingi-mechaniczne",c:"pielegnacja"},
  {n:"peelingi enzymatyczne",s:"/peelingi-enzymatyczne",c:"pielegnacja"},
  {n:"maseczki złuszczające",s:"/maseczki-zluszczajace",c:"pielegnacja"},
  {n:"skarpetki złuszczające",s:"/skarpetki-zluszczajace",c:"pielegnacja"},
  {n:"toniki z kwasem",s:"/toniki-z-kwasem",c:"pielegnacja"},
  {n:"serum złuszczające",s:"/serum-zluszczajace",c:"pielegnacja"},
  {n:"Kosmetyki do oczyszczania twarzy",s:"/kosmetyki-do-oczyszczania-twarzy",c:"pielegnacja"},
  {n:"płyny micelarne",s:"/plyny-micelarne",c:"pielegnacja"},
  {n:"żele do mycia twarzy",s:"/zele-do-mycia-twarzy",c:"pielegnacja"},
  {n:"pianki do mycia twarzy",s:"/pianki-do-mycia-twarzy",c:"pielegnacja"},
  {n:"emulsje do mycia twarzy",s:"/emulsje-do-mycia-twarzy",c:"pielegnacja"},
  {n:"olejki do mycia twarzy",s:"/olejki-do-mycia-twarzy",c:"pielegnacja"},
  {n:"Kosmetyki ekskluzywne",s:"/kosmetyki-ekskluzywne",c:"pielegnacja"},
  {n:"Kosmetyki orientalne",s:"/kosmetyki-orientalne",c:"pielegnacja"},
  {n:"Kosmetyki po zabiegu medycyny estetycznej",s:"/kosmetyki-po-zabiegu-medycyny-estetycznej",c:"pielegnacja"},
  {n:"kremy po zabiegach medycyny estetycznej",s:"/kremy-po-zabiegach-medycyny-estetycznej",c:"pielegnacja"},
  {n:"Kosmetyki anti pollution",s:"/kosmetyki-anti-pollution",c:"pielegnacja"},
  {n:"Pielęgnacja zimowa",s:"/pielegnacja-zimowa",c:"pielegnacja"},
  {n:"Kosmetyki nadające efekt opalenizny",s:"/kosmetyki-nadajace-efekt-opalenizny",c:"pielegnacja"},
  {n:"Kosmetyki do makijażu",s:"/kosmetyki-do-makijazu",c:"pielegnacja"},
  {n:"Pomadki do ust",s:"/pomadki-do-ust",c:"pielegnacja"},
  {n:"Pudry prasowane",s:"/pudry-prasowane",c:"pielegnacja"},
  {n:"Pudry sypkie",s:"/pudry-sypkie",c:"pielegnacja"},
  {n:"Zastosowanie kosmetyków",s:"/zastosowanie-kosmetykow",c:"pielegnacja"},
  {n:"Kosmetyki na przebarwienia",s:"/kosmetyki-na-przebarwienia",c:"pielegnacja"},
  {n:"krem do twarzy na przebarwienia",s:"/krem-do-twarzy-na-przebarwienia",c:"pielegnacja"},
  {n:"serum do twarzy na przebarwienia",s:"/serum-do-twarzy-na-przebarwienia",c:"pielegnacja"},
  {n:"Kosmetyki na zmarszczki",s:"/kosmetyki-na-zmarszczki",c:"pielegnacja"},
  {n:"Kemy przeciwzmarszczkowe",s:"/kemy-przeciwzmarszczkowe",c:"pielegnacja"},
  {n:"serum do twarzy przeciwzmarszczkowe",s:"/serum-do-twarzy-przeciwzmarszczkowe",c:"pielegnacja"},
  {n:"Kosmetyki nawilżające",s:"/kosmetyki-nawilzajace",c:"pielegnacja"},
  {n:"maski nawilżające do twarzy",s:"/maski-nawilzajace-do-twarzy",c:"pielegnacja"},
  {n:"kremy nawilżające do twarzy",s:"/kremy-nawilzajace-do-twarzy",c:"pielegnacja"},
  {n:"nawilżające serum do twarzy",s:"/nawilzajace-serum-do-twarzy",c:"pielegnacja"},
  {n:"Kosmetyki nawadniające skórę",s:"/kosmetyki-nawadniajace-skore",c:"pielegnacja"},
  {n:"Krem nawadniający do twarzy",s:"/krem-nawadniajacy-do-twarzy",c:"pielegnacja"},
  {n:"Kosmetyki ujędrniające",s:"/kosmetyki-ujedrniajace",c:"pielegnacja"},
  {n:"Balsam ujędrniający",s:"/balsam-ujedrniajacy",c:"pielegnacja"},
  {n:"Kosmetyki przeciwłupieżowe",s:"/kosmetyki-przeciwlupiezowe",c:"pielegnacja"},
  {n:"Kosmetyki do skóry atopowej",s:"/kosmetyki-do-skory-atopowej",c:"pielegnacja"},
  {n:"Balsam do skóry atopowej",s:"/balsam-do-skory-atopowej",c:"pielegnacja"},
  {n:"Krem do skóry atopowej",s:"/krem-do-skory-atopowej",c:"pielegnacja"},
  {n:"Kosmetyki na bielactwo",s:"/kosmetyki-na-bielactwo",c:"pielegnacja"},
  {n:"Krem na bielactwo",s:"/krem-na-bielactwo",c:"pielegnacja"},
  {n:"Kosmetyki na blizny",s:"/kosmetyki-na-blizny",c:"pielegnacja"},
  {n:"Kosmetyki na cellulit",s:"/kosmetyki-na-cellulit",c:"pielegnacja"},
  {n:"Kosmetyki na cienie pod oczami",s:"/kosmetyki-na-cienie-pod-oczami",c:"pielegnacja"},
  {n:"Krem na cienie pod oczami",s:"/krem-na-cienie-pod-oczami",c:"pielegnacja"},
  {n:"Kosmetyki na łojotok twarzy",s:"/kosmetyki-na-lojotok-twarzy",c:"pielegnacja"},
  {n:"Kosmetyki na łuszczycę",s:"/kosmetyki-na-luszczyce",c:"pielegnacja"},
  {n:"Kosmetyki na popękane naczynka",s:"/kosmetyki-na-popekane-naczynka",c:"pielegnacja"},
  {n:"Kremy na pękające naczynka",s:"/kremy-na-pekajace-naczynka",c:"pielegnacja"},
  {n:"Płyny do dezynfekcji",s:"/plyny-do-dezynfekcji",c:"pielegnacja"},
  {n:"Kosmetyki na rogowacenie mieszkowe",s:"/kosmetyki-na-rogowacenie-mieszkowe",c:"pielegnacja"},
  {n:"Kosmetyki na rozstępy",s:"/kosmetyki-na-rozstepy",c:"pielegnacja"},
  {n:"Kosmetyki do cery naczynkowej",s:"/kosmetyki-do-cery-naczynkowej",c:"pielegnacja"},
  {n:"Kosmetyki na trądzik",s:"/kosmetyki-na-tradzik",c:"pielegnacja"},
  {n:"Preparaty na trądzik",s:"/preparaty-na-tradzik",c:"pielegnacja"},
  {n:"Kosmetyki na trądzik różowaty",s:"/kosmetyki-na-tradzik-rozowaty",c:"pielegnacja"},
  {n:"Kosmetyki wyszczuplające",s:"/kosmetyki-wyszczuplajace",c:"pielegnacja"},
  {n:"Kosmetyki owal twarzy",s:"/kosmetyki-owal-twarzy",c:"pielegnacja"},
  {n:"Krem na owal twarzy",s:"/krem-na-owal-twarzy",c:"pielegnacja"},
  {n:"Maseczki na owal twarzy",s:"/maseczki-na-owal-twarzy",c:"pielegnacja"},
  {n:"Kosmetyki na zaskórniki",s:"/kosmetyki-na-zaskorniki",c:"pielegnacja"},
  {n:"Kosmetyki na AZS",s:"/kosmetyki-na-azs",c:"pielegnacja"},
  {n:"Krem na AZS",s:"/krem-na-azs",c:"pielegnacja"},
  {n:"Kosmetyki z probiotykami",s:"/kosmetyki-z-probiotykami",c:"pielegnacja"},
  {n:"kremy z probiotykami",s:"/kremy-z-probiotykami",c:"pielegnacja"},
  {n:"Zestawy kosmetyków",s:"/zestawy-kosmetykow",c:"pielegnacja"},
  {n:"zestaw kosmetyków do włosów",s:"/zestaw-kosmetykow-do-wlosow",c:"pielegnacja"},
  {n:"Pielęgnacja",s:"/pielegnacja",c:"pielegnacja"},
  {n:"Ochrona przeciwsłoneczna",s:"/ochrona-przeciwsloneczna",c:"pielegnacja"},
  {n:"Balsam do opalania",s:"/balsam-do-opalania",c:"pielegnacja"},
  {n:"Emulsje od opalania",s:"/emulsje-od-opalania",c:"pielegnacja"},
  {n:"Filtry do twarzy",s:"/filtry-do-twarzy",c:"pielegnacja"},
  {n:"Filtry do ciała",s:"/filtry-do-ciala",c:"pielegnacja"},
  {n:"Kremy z filtrem do twarzy",s:"/kremy-z-filtrem-do-twarzy",c:"pielegnacja"},
  {n:"Olejki do opalania",s:"/olejki-do-opalania",c:"pielegnacja"},
  {n:"Mgiełki z filtrem do twarzy",s:"/mgielki-z-filtrem-do-twarzy",c:"pielegnacja"},
  {n:"Mgiełki z filtrem do ciała",s:"/mgielki-z-filtrem-do-ciala",c:"pielegnacja"},
  {n:"Krem BB z filtrem",s:"/krem-bb-z-filtrem",c:"pielegnacja"},
  {n:"Emulsja do opalania",s:"/emulsja-do-opalania",c:"pielegnacja"},
  {n:"Krem BB z filtrem przeciwsłonecznym",s:"/krem-bb-z-filtrem-przeciwslonecznym",c:"pielegnacja"},
  {n:"Krem-żel SPF",s:"/krem-zel-spf",c:"pielegnacja"},
  {n:"Mleczka do opalania",s:"/mleczka-do-opalania",c:"pielegnacja"},
  {n:"Spraye z filtrem do ciała",s:"/spraye-z-filtrem-do-ciala",c:"pielegnacja"},
  {n:"Spraye z filtrem do twarzy",s:"/spraye-z-filtrem-do-twarzy",c:"pielegnacja"},
  {n:"Sztyft przeciwsłoneczny",s:"/sztyft-przeciwsloneczny",c:"pielegnacja"},
  {n:"Przyśpieszacze opalania",s:"/przyspieszacze-opalania",c:"pielegnacja"},
  {n:"Pielęgnacja - demakijaż",s:"/pielegnacja-demakijaz",c:"pielegnacja"},
  {n:"Olejki do demakijażu",s:"/olejki-do-demakijazu",c:"pielegnacja"},
  {n:"Mleczka do demakijażu",s:"/mleczka-do-demakijazu",c:"pielegnacja"},
  {n:"Chusteczki do demakijażu",s:"/chusteczki-do-demakijazu",c:"pielegnacja"},
  {n:"Balsam do demakijażu",s:"/balsam-do-demakijazu",c:"pielegnacja"},
  {n:"Emulsja do demakijażu",s:"/emulsja-do-demakijazu",c:"pielegnacja"},
  {n:"Pianki do demakijażu",s:"/pianki-do-demakijazu",c:"pielegnacja"},
  {n:"Płyny micelarne do demakijażu",s:"/plyny-micelarne-do-demakijazu",c:"pielegnacja"},
  {n:"Rękawica do demakijażu",s:"/rekawica-do-demakijazu",c:"pielegnacja"},
  {n:"Wody do demakijażu",s:"/wody-do-demakijazu",c:"pielegnacja"},
  {n:"Żele do demakijażu",s:"/zele-do-demakijazu",c:"pielegnacja"},
  {n:"Pielęgnacja - oczyszczanie twarzy",s:"/pielegnacja-oczyszczanie-twarzy",c:"pielegnacja"},
  {n:"Akcesoria do oczyszczania twarzy",s:"/akcesoria-do-oczyszczania-twarzy",c:"pielegnacja"},
  {n:"Balsamy oczyszczające do twarzy",s:"/balsamy-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Emulsje oczyszczające do twarzy",s:"/emulsje-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Gąbki do mycia twarzy",s:"/gabki-do-mycia-twarzy",c:"pielegnacja"},
  {n:"Kosmetyki do tonizacji twarzy",s:"/kosmetyki-do-tonizacji-twarzy",c:"pielegnacja"},
  {n:"Kremy oczyszczające do twarzy",s:"/kremy-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Masła oczyszczające do twarzy",s:"/masla-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Mleczka oczyszczające do twarzy",s:"/mleczka-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Mydła do twarzy",s:"/mydla-do-twarzy",c:"pielegnacja"},
  {n:"Olejki oczyszczające do twarzy",s:"/olejki-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Pasty oczyszczające do twarzy",s:"/pasty-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Pianki oczyszczające do twarzy",s:"/pianki-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Płatki oczyszczające do twarzy",s:"/platki-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Płyny micelarne do twarzy",s:"/plyny-micelarne-do-twarzy",c:"pielegnacja"},
  {n:"Proszki oczyszczające do twarzy",s:"/proszki-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Żele oczyszczające do twarzy",s:"/zele-oczyszczajace-do-twarzy",c:"pielegnacja"},
  {n:"Pielęgnacja biustu",s:"/pielegnacja-biustu",c:"pielegnacja"},
  {n:"Serum do biustu",s:"/serum-do-biustu",c:"pielegnacja"},
  {n:"Kremy do biustu",s:"/kremy-do-biustu",c:"pielegnacja"},
  {n:"Emulsje do biustu",s:"/emulsje-do-biustu",c:"pielegnacja"},
  {n:"Maski na biust",s:"/maski-na-biust",c:"pielegnacja"},
  {n:"Masła do biustu",s:"/masla-do-biustu",c:"pielegnacja"},
  {n:"Olejki do biustu",s:"/olejki-do-biustu",c:"pielegnacja"},
  {n:"Peelingi do biustu",s:"/peelingi-do-biustu",c:"pielegnacja"},
  {n:"Żele do biustu",s:"/zele-do-biustu",c:"pielegnacja"},
  {n:"Pielęgnacja brwi",s:"/pielegnacja-brwi",c:"pielegnacja"},
  {n:"Odżywki do brwi",s:"/odzywki-do-brwi",c:"pielegnacja"},
  {n:"Serum do brwi",s:"/serum-do-brwi",c:"pielegnacja"},
  {n:"Pielęgnacja całoroczna",s:"/pielegnacja-caloroczna",c:"pielegnacja"},
  {n:"Pielęgnacja ciała",s:"/pielegnacja-ciala",c:"pielegnacja"},
  {n:"Peelingi do ciała",s:"/peelingi-do-ciala",c:"pielegnacja"},
  {n:"Olejki do ciała",s:"/olejki-do-ciala",c:"pielegnacja"},
  {n:"Mgiełki do ciała",s:"/mgielki-do-ciala",c:"pielegnacja"},
  {n:"Masła do ciała",s:"/masla-do-ciala",c:"pielegnacja"},
  {n:"Balsamy do ciała",s:"/balsamy-do-ciala",c:"pielegnacja"},
  {n:"Akcesoria do pielęgnacji ciała",s:"/akcesoria-do-pielegnacji-ciala",c:"pielegnacja"},
  {n:"Bronzer do ciała",s:"/bronzer-do-ciala",c:"pielegnacja"},
  {n:"Emulsje do ciała",s:"/emulsje-do-ciala",c:"pielegnacja"},
  {n:"Kremy do ciała",s:"/kremy-do-ciala",c:"pielegnacja"},
  {n:"Mleczko do ciała",s:"/mleczko-do-ciala",c:"pielegnacja"},
  {n:"Pielęgnacja dłoni",s:"/pielegnacja-dloni",c:"pielegnacja"},
  {n:"Peelingi do rąk",s:"/peelingi-do-rak",c:"pielegnacja"},
  {n:"Maski do rąk",s:"/maski-do-rak",c:"pielegnacja"},
  {n:"Kremy do rąk",s:"/kremy-do-rak",c:"pielegnacja"},
  {n:"Balsamy do rąk",s:"/balsamy-do-rak",c:"pielegnacja"},
  {n:"Emulsje do rąk",s:"/emulsje-do-rak",c:"pielegnacja"},
  {n:"Kosmetyki do kąpieli dłoni",s:"/kosmetyki-do-kapieli-dloni",c:"pielegnacja"},
  {n:"Mydła do rąk",s:"/mydla-do-rak",c:"pielegnacja"},
  {n:"Olejki do rąk",s:"/olejki-do-rak",c:"pielegnacja"},
  {n:"Serum do rąk",s:"/serum-do-rak",c:"pielegnacja"},
  {n:"Pielęgnacja jamy ustnej",s:"/pielegnacja-jamy-ustnej",c:"pielegnacja"},
  {n:"Pasta do zębów",s:"/pasta-do-zebow",c:"pielegnacja"},
  {n:"Płyny do jamy ustnej",s:"/plyny-do-jamy-ustnej",c:"pielegnacja"},
  {n:"Spraye do ust",s:"/spraye-do-ust",c:"pielegnacja"},
  {n:"Pielęgnacja na jesień",s:"/pielegnacja-na-jesien",c:"pielegnacja"},
  {n:"Pielęgnacja na lato",s:"/pielegnacja-na-lato",c:"pielegnacja"},
  {n:"Pielęgnacja na wiosnę",s:"/pielegnacja-na-wiosne",c:"pielegnacja"},
  {n:"Pielęgnacja na zimę",s:"/pielegnacja-na-zime",c:"pielegnacja"},
  {n:"Kremy do twarzy na zimę",s:"/kremy-do-twarzy-na-zime",c:"pielegnacja"},
  {n:"Ampułki do twarzy na zimę",s:"/ampulki-do-twarzy-na-zime",c:"pielegnacja"},
  {n:"Balsamy do twarzy na zimę",s:"/balsamy-do-twarzy-na-zime",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji ciała zimą",s:"/kosmetyki-do-pielegnacji-ciala-zima",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji dłoni zimą",s:"/kosmetyki-do-pielegnacji-dloni-zima",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji stóp zimą",s:"/kosmetyki-do-pielegnacji-stop-zima",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji ust zimą",s:"/kosmetyki-do-pielegnacji-ust-zima",c:"pielegnacja"},
  {n:"Kosmetyki do pielęgnacji włosów zimą",s:"/kosmetyki-do-pielegnacji-wlosow-zima",c:"pielegnacja"},
  {n:"Maski do twarzy na zimę",s:"/maski-do-twarzy-na-zime",c:"pielegnacja"},
  {n:"Masła do twarzy na zimę",s:"/masla-do-twarzy-na-zime",c:"pielegnacja"},
  {n:"Serum do twarzy na zimę",s:"/serum-do-twarzy-na-zime",c:"pielegnacja"},
  {n:"Pielęgnacja nóg",s:"/pielegnacja-nog",c:"pielegnacja"},
  {n:"Balsamy do nóg",s:"/balsamy-do-nog",c:"pielegnacja"},
  {n:"Kremy do nóg",s:"/kremy-do-nog",c:"pielegnacja"},
  {n:"Kremy-żele do nóg",s:"/kremy-zele-do-nog",c:"pielegnacja"},
  {n:"Olejki do nóg",s:"/olejki-do-nog",c:"pielegnacja"},
  {n:"Żele do nóg",s:"/zele-do-nog",c:"pielegnacja"},
  {n:"Pielęgnacja okolic intymnych",s:"/pielegnacja-okolic-intymnych",c:"pielegnacja"},
  {n:"Żele do okolic intymnych",s:"/zele-do-okolic-intymnych",c:"pielegnacja"},
  {n:"Kremy-żele do okolic intymnych",s:"/kremy-zele-do-okolic-intymnych",c:"pielegnacja"},
  {n:"Maski do okolic intymnych",s:"/maski-do-okolic-intymnych",c:"pielegnacja"},
  {n:"Olejki do okolic intymnych",s:"/olejki-do-okolic-intymnych",c:"pielegnacja"},
  {n:"Pianki do okolic intymnych",s:"/pianki-do-okolic-intymnych",c:"pielegnacja"},
  {n:"Płyny do okolic intymnych",s:"/plyny-do-okolic-intymnych",c:"pielegnacja"},
  {n:"Pielęgnacja okolic oczu",s:"/pielegnacja-okolic-oczu",c:"pielegnacja"},
  {n:"Serum pod oczy",s:"/serum-pod-oczy",c:"pielegnacja"},
  {n:"Płatki pod oczy",s:"/platki-pod-oczy",c:"pielegnacja"},
  {n:"Kremy pod oczy",s:"/kremy-pod-oczy",c:"pielegnacja"},
  {n:"Ampułki pod oczy",s:"/ampulki-pod-oczy",c:"pielegnacja"},
  {n:"Akcesoria do pielęgnacji okolic oczu",s:"/akcesoria-do-pielegnacji-okolic-oczu",c:"pielegnacja"},
  {n:"Balsamy pod oczy",s:"/balsamy-pod-oczy",c:"pielegnacja"},
  {n:"Emulsje pod oczy",s:"/emulsje-pod-oczy",c:"pielegnacja"},
  {n:"Korektory pielęgnacyjne pod oczy",s:"/korektory-pielegnacyjne-pod-oczy",c:"pielegnacja"},
  {n:"Krem-żel pod oczy",s:"/krem-zel-pod-oczy",c:"pielegnacja"},
  {n:"Kremy pod oczy na noc",s:"/kremy-pod-oczy-na-noc",c:"pielegnacja"},
  {n:"Kuracje okolic oczu",s:"/kuracje-okolic-oczu",c:"pielegnacja"},
  {n:"Maski na okolice oczu",s:"/maski-na-okolice-oczu",c:"pielegnacja"},
  {n:"Ochrona przeciwsłoneczna okolic oczu",s:"/ochrona-przeciwsloneczna-okolic-oczu",c:"pielegnacja"},
  {n:"Sztyfty pod oczy",s:"/sztyfty-pod-oczy",c:"pielegnacja"},
  {n:"Tonizacja okolic oczu",s:"/tonizacja-okolic-oczu",c:"pielegnacja"},
  {n:"Żele pod oczy",s:"/zele-pod-oczy",c:"pielegnacja"},
  {n:"Pielęgnacja onkologiczna",s:"/pielegnacja-onkologiczna",c:"pielegnacja"},
  {n:"Kremy onkologiczne",s:"/kremy-onkologiczne",c:"pielegnacja"},
  {n:"Serum onkologiczne",s:"/serum-onkologiczne",c:"pielegnacja"},
  {n:"Szampony onkologiczne",s:"/szampony-onkologiczne",c:"pielegnacja"},
  {n:"Pielęgnacja paznokci",s:"/pielegnacja-paznokci",c:"pielegnacja"},
  {n:"Serum do paznokci",s:"/serum-do-paznokci",c:"pielegnacja"},
  {n:"Olejki do paznokci",s:"/olejki-do-paznokci",c:"pielegnacja"},
  {n:"Kremy do paznokci",s:"/kremy-do-paznokci",c:"pielegnacja"},
  {n:"Maski do paznokci",s:"/maski-do-paznokci",c:"pielegnacja"},
  {n:"Płyny do paznokci",s:"/plyny-do-paznokci",c:"pielegnacja"},
  {n:"Pielęgnacja pozabiegowa",s:"/pielegnacja-pozabiegowa",c:"pielegnacja"},
  {n:"Kremy pozabiegowe",s:"/kremy-pozabiegowe",c:"pielegnacja"},
  {n:"Krem łagodzący po zabiegach kosmetycznych",s:"/krem-lagodzacy-po-zabiegach-kosmetycznych",c:"pielegnacja"},
  {n:"Ampułki pozabiegowe",s:"/ampulki-pozabiegowe",c:"pielegnacja"},
  {n:"Balsamy pozabiegowe",s:"/balsamy-pozabiegowe",c:"pielegnacja"},
  {n:"Emulsje pozabiegowe",s:"/emulsje-pozabiegowe",c:"pielegnacja"},
  {n:"Esencje pozabiegowe",s:"/esencje-pozabiegowe",c:"pielegnacja"},
  {n:"Makijaż po zabiegach",s:"/makijaz-po-zabiegach",c:"pielegnacja"},
  {n:"Maseczki pozabiegowe",s:"/maseczki-pozabiegowe",c:"pielegnacja"},
  {n:"Olejki pozabiegowe",s:"/olejki-pozabiegowe",c:"pielegnacja"},
  {n:"Serum pozabiegowe",s:"/serum-pozabiegowe",c:"pielegnacja"},
  {n:"Toniki po zabiegach",s:"/toniki-po-zabiegach",c:"pielegnacja"},
  {n:"Żele pozabiegowe",s:"/zele-pozabiegowe",c:"pielegnacja"},
  {n:"Pielęgnacja rzęs",s:"/pielegnacja-rzes",c:"pielegnacja"},
  {n:"Kremy do rzęs",s:"/kremy-do-rzes",c:"pielegnacja"},
  {n:"Odżywki do rzęs",s:"/odzywki-do-rzes",c:"pielegnacja"},
  {n:"Serum do rzęs",s:"/serum-do-rzes",c:"pielegnacja"},
  {n:"Żele do rzęs",s:"/zele-do-rzes",c:"pielegnacja"},
  {n:"Pielęgnacja skóry głowy",s:"/pielegnacja-skory-glowy",c:"pielegnacja"},
  {n:"Serum do skóry głowy",s:"/serum-do-skory-glowy",c:"pielegnacja"},
  {n:"Peelingi do skóry głowy",s:"/peelingi-do-skory-glowy",c:"pielegnacja"},
  {n:"Oleje do skóry głowy",s:"/oleje-do-skory-glowy",c:"pielegnacja"},
  {n:"Maski do skóry głowy",s:"/maski-do-skory-glowy",c:"pielegnacja"},
  {n:"Pielęgnacja stóp",s:"/pielegnacja-stop",c:"pielegnacja"},
  {n:"Peelingi do stóp",s:"/peelingi-do-stop",c:"pielegnacja"},
  {n:"Kremy do stóp",s:"/kremy-do-stop",c:"pielegnacja"},
  {n:"Akcesoria do stóp",s:"/akcesoria-do-stop",c:"pielegnacja"},
  {n:"Balsamy do stóp",s:"/balsamy-do-stop",c:"pielegnacja"},
  {n:"Maski do stóp",s:"/maski-do-stop",c:"pielegnacja"},
  {n:"Masła do stóp",s:"/masla-do-stop",c:"pielegnacja"},
  {n:"Mgiełki do stóp",s:"/mgielki-do-stop",c:"pielegnacja"},
  {n:"Olejki do stóp",s:"/olejki-do-stop",c:"pielegnacja"},
  {n:"Sole do stóp",s:"/sole-do-stop",c:"pielegnacja"},
  {n:"Spraye do stóp",s:"/spraye-do-stop",c:"pielegnacja"},
  {n:"Toniki do stóp",s:"/toniki-do-stop",c:"pielegnacja"},
  {n:"Żele do stóp",s:"/zele-do-stop",c:"pielegnacja"},
  {n:"Pielęgnacja szyi i dekoltu",s:"/pielegnacja-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Serum do szyi i dekoltu",s:"/serum-do-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Maski na szyję i dekolt",s:"/maski-na-szyje-i-dekolt",c:"pielegnacja"},
  {n:"Kremy do szyi i dekoltu",s:"/kremy-do-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Akcesoria do szyi i dekoltu",s:"/akcesoria-do-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Emulsje do szyi i dekoltu",s:"/emulsje-do-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Krem-żel do szyi i dekoltu",s:"/krem-zel-do-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Masła do szyi i dekoltu",s:"/masla-do-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Mgiełki do szyi i dekoltu",s:"/mgielki-do-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Peelingi do szyi i dekoltu",s:"/peelingi-do-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Żele do szyi i dekoltu",s:"/zele-do-szyi-i-dekoltu",c:"pielegnacja"},
  {n:"Pielęgnacja twarzy",s:"/pielegnacja-twarzy",c:"pielegnacja"},
  {n:"Toniki do twarzy",s:"/toniki-do-twarzy",c:"pielegnacja"},
  {n:"Serum do twarzy",s:"/serum-do-twarzy",c:"pielegnacja"},
  {n:"Peelingi do twarzy",s:"/peelingi-do-twarzy",c:"pielegnacja"},
  {n:"Olejki do twarzy",s:"/olejki-do-twarzy",c:"pielegnacja"},
  {n:"Mgiełki do twarzy",s:"/mgielki-do-twarzy",c:"pielegnacja"},
  {n:"Maseczki na twarz",s:"/maseczki-na-twarz",c:"pielegnacja"},
  {n:"Kremy do twarzy",s:"/kremy-do-twarzy",c:"pielegnacja"},
  {n:"Hydrolaty do twarzy",s:"/hydrolaty-do-twarzy",c:"pielegnacja"},
  {n:"Ampułki do twarzy",s:"/ampulki-do-twarzy",c:"pielegnacja"},
  {n:"Akcesoria do pielęgnacji twarzy",s:"/akcesoria-do-pielegnacji-twarzy",c:"pielegnacja"},
  {n:"Emulsje do twarzy",s:"/emulsje-do-twarzy",c:"pielegnacja"},
  {n:"Esencje do twarzy",s:"/esencje-do-twarzy",c:"pielegnacja"},
  {n:"Hydrolat różany do twarzy",s:"/hydrolat-rozany-do-twarzy",c:"pielegnacja"},
  {n:"Krem-żel do twarzy",s:"/krem-zel-do-twarzy",c:"pielegnacja"},
  {n:"Masła do twarzy",s:"/masla-do-twarzy",c:"pielegnacja"},
  {n:"Płatki do twarzy",s:"/platki-do-twarzy",c:"pielegnacja"},
  {n:"Pielęgnacja ust",s:"/pielegnacja-ust",c:"pielegnacja"},
  {n:"Peelingi do ust",s:"/peelingi-do-ust",c:"pielegnacja"},
  {n:"Balsamy do ust",s:"/balsamy-do-ust",c:"pielegnacja"},
  {n:"Kremy do ust i na okolice ust",s:"/kremy-do-ust-i-na-okolice-ust",c:"pielegnacja"},
  {n:"Kuracje do ust i na okolice ust",s:"/kuracje-do-ust-i-na-okolice-ust",c:"pielegnacja"},
  {n:"Masełka do ust",s:"/maselka-do-ust",c:"pielegnacja"},
  {n:"Maski do ust",s:"/maski-do-ust",c:"pielegnacja"},
  {n:"Serum do ust i na okolice ust",s:"/serum-do-ust-i-na-okolice-ust",c:"pielegnacja"},
  {n:"Sztyfty do ust",s:"/sztyfty-do-ust",c:"pielegnacja"},
  {n:"Żele do ust i na okolice ust",s:"/zele-do-ust-i-na-okolice-ust",c:"pielegnacja"},
  {n:"Pielęgnacja włosów",s:"/pielegnacja-wlosow",c:"pielegnacja"},
  {n:"Ampułki do włosów",s:"/ampulki-do-wlosow",c:"pielegnacja"},
  {n:"Farby do włosów",s:"/farby-do-wlosow",c:"pielegnacja"},
  {n:"Henny do włosów",s:"/henny-do-wlosow",c:"pielegnacja"},
  {n:"Odżywki do włosów",s:"/odzywki-do-wlosow",c:"pielegnacja"},
  {n:"Olejki do włosów",s:"/olejki-do-wlosow",c:"pielegnacja"},
  {n:"Maski do włosów",s:"/maski-do-wlosow",c:"pielegnacja"},
  {n:"Tonery do włosów",s:"/tonery-do-wlosow",c:"pielegnacja"},
  {n:"Tonik do włosów",s:"/tonik-do-wlosow",c:"pielegnacja"},
  {n:"Serum do włosów",s:"/serum-do-wlosow",c:"pielegnacja"},
  {n:"Spray do włosów",s:"/spray-do-wlosow",c:"pielegnacja"},
  {n:"Szampony do włosów",s:"/szampony-do-wlosow",c:"pielegnacja"},
  {n:"Wcierki do włosów",s:"/wcierki-do-wlosow",c:"pielegnacja"},
  {n:"Pielęgnacja zarostu",s:"/pielegnacja-zarostu",c:"pielegnacja"},
  {n:"Balsam do brody",s:"/balsam-do-brody",c:"pielegnacja"},
  {n:"Kosmetyki i akcesoria do golenia",s:"/kosmetyki-i-akcesoria-do-golenia",c:"pielegnacja"},
  {n:"Kosmetyki i akcesoria do stylizacji zarostu",s:"/kosmetyki-i-akcesoria-do-stylizacji-zarostu",c:"pielegnacja"},
  {n:"Oczyszczanie zarostu",s:"/oczyszczanie-zarostu",c:"pielegnacja"},
  {n:"Szczotka do brody",s:"/szczotka-do-brody",c:"pielegnacja"},
  {n:"Dermokosmetyki",s:"/dermokosmetyki",c:"dermokosmetyki"},
  {n:"Dermokosmetyki - krem BB",s:"/dermokosmetyki-krem-bb",c:"dermokosmetyki"},
  {n:"Dermokosmetyki - podkłady",s:"/dermokosmetyki-podklady",c:"dermokosmetyki"},
  {n:"Dermokosmetyki dla dzieci",s:"/dermokosmetyki-dla-dzieci",c:"dermokosmetyki"},
  {n:"Dermokosmetyki dla mężczyzn",s:"/dermokosmetyki-dla-mezczyzn",c:"dermokosmetyki"},
  {n:"Dermokosmetyki dla nastolatków",s:"/dermokosmetyki-dla-nastolatkow",c:"dermokosmetyki"},
  {n:"Dermokosmetyki do cery mieszanej",s:"/dermokosmetyki-do-cery-mieszanej",c:"dermokosmetyki"},
  {n:"Dermokosmetyki do cery naczynkowej",s:"/dermokosmetyki-do-cery-naczynkowej",c:"dermokosmetyki"},
  {n:"Dermokosmetyki do cery tłustej",s:"/dermokosmetyki-do-cery-tlustej",c:"dermokosmetyki"},
  {n:"Dermokosmetyki do cery trądzikowej",s:"/dermokosmetyki-do-cery-tradzikowej",c:"dermokosmetyki"},
  {n:"Dermokosmetyki do ciała",s:"/dermokosmetyki-do-ciala",c:"dermokosmetyki"},
  {n:"Dermokosmetyki do opalania",s:"/dermokosmetyki-do-opalania",c:"dermokosmetyki"},
  {n:"Dermokosmetyki do skóry wrażliwej",s:"/dermokosmetyki-do-skory-wrazliwej",c:"dermokosmetyki"},
  {n:"Dermokosmetyki do twarzy",s:"/dermokosmetyki-do-twarzy",c:"dermokosmetyki"},
  {n:"Dermokosmetyki do włosów",s:"/dermokosmetyki-do-wlosow",c:"dermokosmetyki"},
  {n:"Dermokosmetyki na łuszczycę",s:"/dermokosmetyki-na-luszczyce",c:"dermokosmetyki"},
  {n:"Dermokosmetyki na przebarwienia",s:"/dermokosmetyki-na-przebarwienia",c:"dermokosmetyki"},
  {n:"Dermokosmetyki na wrastające włoski",s:"/dermokosmetyki-na-wrastajace-wloski",c:"dermokosmetyki"},
  {n:"Dermokosmetyki naturalne",s:"/dermokosmetyki-naturalne",c:"dermokosmetyki"},
  {n:"Dermokosmetyki pod oczy",s:"/dermokosmetyki-pod-oczy",c:"dermokosmetyki"},
  {n:"Dermokosmetyki przeciwzmarszczkowe",s:"/dermokosmetyki-przeciwzmarszczkowe",c:"dermokosmetyki"},
  {n:"Zestawy dermokosmetyków",s:"/zestawy-dermokosmetykow",c:"dermokosmetyki"},
  {n:"Kosmetyki naturalne",s:"/kosmetyki-naturalne",c:"kosmetyki_naturalne"},
  {n:"Kosmetyki do masażu",s:"/kosmetyki-do-masazu",c:"kosmetyki_naturalne"},
  {n:"Olejek do masażu",s:"/olejek-do-masazu",c:"kosmetyki_naturalne"},
  {n:"Rękawica do masażu",s:"/rekawica-do-masazu",c:"kosmetyki_naturalne"},
  {n:"Szczotka do masażu",s:"/szczotka-do-masazu",c:"kosmetyki_naturalne"},
  {n:"Kosmetyki po opalaniu",s:"/kosmetyki-po-opalaniu",c:"kosmetyki_naturalne"},
  {n:"Balsamy po opalaniu",s:"/balsamy-po-opalaniu",c:"kosmetyki_naturalne"},
  {n:"Kremy po opalaniu",s:"/kremy-po-opalaniu",c:"kosmetyki_naturalne"},
  {n:"Emulsje po opalaniu",s:"/emulsje-po-opalaniu",c:"kosmetyki_naturalne"},
  {n:"Maski po opalaniu",s:"/maski-po-opalaniu",c:"kosmetyki_naturalne"},
  {n:"Masła po opalaniu",s:"/masla-po-opalaniu",c:"kosmetyki_naturalne"},
  {n:"Mgiełki po opalaniu",s:"/mgielki-po-opalaniu",c:"kosmetyki_naturalne"},
  {n:"Mleczka po opalaniu",s:"/mleczka-po-opalaniu",c:"kosmetyki_naturalne"},
  {n:"Serum po opalaniu",s:"/serum-po-opalaniu",c:"kosmetyki_naturalne"},
  {n:"Żele po opalaniu",s:"/zele-po-opalaniu",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do włosów",s:"/naturalne-kosmetyki-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Naturalne maski do włosów",s:"/naturalne-maski-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Naturalne odżywki do włosów",s:"/naturalne-odzywki-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Naturalne olejki do włosów",s:"/naturalne-olejki-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Naturalne szampony do włosów",s:"/naturalne-szampony-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Naturalne szampony do włosów cienkich i delikatnych",s:"/naturalne-szampony-do-wlosow-cienkich-i-delikatnych",c:"kosmetyki_naturalne"},
  {n:"Naturalne szampony do włosów farbowanych",s:"/naturalne-szampony-do-wlosow-farbowanych",c:"kosmetyki_naturalne"},
  {n:"Naturalne szampony do włosów przetłuszczających się",s:"/naturalne-szampony-do-wlosow-przetluszczajacych-sie",c:"kosmetyki_naturalne"},
  {n:"Naturalne szampony do włosów zniszczonych",s:"/naturalne-szampony-do-wlosow-zniszczonych",c:"kosmetyki_naturalne"},
  {n:"Naturalne szampony przeciwłupieżowe",s:"/naturalne-szampony-przeciwlupiezowe",c:"kosmetyki_naturalne"},
  {n:"Naturalne wcierki do włosów",s:"/naturalne-wcierki-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki dla dzieci",s:"/naturalne-kosmetyki-dla-dzieci",c:"kosmetyki_naturalne"},
  {n:"Naturalne filtry dla dzieci",s:"/naturalne-filtry-dla-dzieci",c:"kosmetyki_naturalne"},
  {n:"Naturalne kremy dla dzieci",s:"/naturalne-kremy-dla-dzieci",c:"kosmetyki_naturalne"},
  {n:"Naturalne oleje dla dzieci",s:"/naturalne-oleje-dla-dzieci",c:"kosmetyki_naturalne"},
  {n:"Naturalne olejki dla dzieci",s:"/naturalne-olejki-dla-dzieci",c:"kosmetyki_naturalne"},
  {n:"Naturalne szampony dla dzieci",s:"/naturalne-szampony-dla-dzieci",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki dla mężczyzn",s:"/naturalne-kosmetyki-dla-mezczyzn",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do golenia",s:"/naturalne-kosmetyki-do-golenia",c:"kosmetyki_naturalne"},
  {n:"Naturalne kremy dla mężczyzn",s:"/naturalne-kremy-dla-mezczyzn",c:"kosmetyki_naturalne"},
  {n:"Naturalne szampony dla mężczyzn",s:"/naturalne-szampony-dla-mezczyzn",c:"kosmetyki_naturalne"},
  {n:"Naturalne żele pod prysznic dla mężczyzn",s:"/naturalne-zele-pod-prysznic-dla-mezczyzn",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do ciała",s:"/naturalne-kosmetyki-do-ciala",c:"kosmetyki_naturalne"},
  {n:"Naturalne balsamy do ciała",s:"/naturalne-balsamy-do-ciala",c:"kosmetyki_naturalne"},
  {n:"Naturalne olejki ujędrniające do ciała",s:"/naturalne-olejki-ujedrniajace-do-ciala",c:"kosmetyki_naturalne"},
  {n:"Naturalne peelingi do ciała",s:"/naturalne-peelingi-do-ciala",c:"kosmetyki_naturalne"},
  {n:"Naturalne żele aloesowe",s:"/naturalne-zele-aloesowe",c:"kosmetyki_naturalne"},
  {n:"Naturalne żele pod prysznic",s:"/naturalne-zele-pod-prysznic",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do makijażu",s:"/naturalne-kosmetyki-do-makijazu",c:"kosmetyki_naturalne"},
  {n:"Naturalne kremy BB",s:"/naturalne-kremy-bb",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do rąk",s:"/naturalne-kosmetyki-do-rak",c:"kosmetyki_naturalne"},
  {n:"Naturalne kremy do rąk",s:"/naturalne-kremy-do-rak",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do rzęs",s:"/naturalne-kosmetyki-do-rzes",c:"kosmetyki_naturalne"},
  {n:"Naturalne tusze do rzęs",s:"/naturalne-tusze-do-rzes",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do stóp",s:"/naturalne-kosmetyki-do-stop",c:"kosmetyki_naturalne"},
  {n:"Naturalne kremy do stóp",s:"/naturalne-kremy-do-stop",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do twarzy",s:"/naturalne-kosmetyki-do-twarzy",c:"kosmetyki_naturalne"},
  {n:"Naturalne serum do twarzy",s:"/naturalne-serum-do-twarzy",c:"kosmetyki_naturalne"},
  {n:"Naturalne hydrolaty",s:"/naturalne-hydrolaty",c:"kosmetyki_naturalne"},
  {n:"Naturalne kremy do twarzy",s:"/naturalne-kremy-do-twarzy",c:"kosmetyki_naturalne"},
  {n:"Naturalne kremy do twarzy przeciwzmarszczkowe",s:"/naturalne-kremy-do-twarzy-przeciwzmarszczkowe",c:"kosmetyki_naturalne"},
  {n:"Naturalne kremy z filtrem",s:"/naturalne-kremy-z-filtrem",c:"kosmetyki_naturalne"},
  {n:"Naturalne maseczki do twarzy",s:"/naturalne-maseczki-do-twarzy",c:"kosmetyki_naturalne"},
  {n:"Naturalne olejki ujędrniające do twarzy",s:"/naturalne-olejki-ujedrniajace-do-twarzy",c:"kosmetyki_naturalne"},
  {n:"Naturalne peelingi do twarzy",s:"/naturalne-peelingi-do-twarzy",c:"kosmetyki_naturalne"},
  {n:"Naturalne płyny micelarne",s:"/naturalne-plyny-micelarne",c:"kosmetyki_naturalne"},
  {n:"Naturalne toniki do twarzy",s:"/naturalne-toniki-do-twarzy",c:"kosmetyki_naturalne"},
  {n:"Naturalne żele do mycia twarzy",s:"/naturalne-zele-do-mycia-twarzy",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki do ust",s:"/naturalne-kosmetyki-do-ust",c:"kosmetyki_naturalne"},
  {n:"Naturalne balsamy do ust",s:"/naturalne-balsamy-do-ust",c:"kosmetyki_naturalne"},
  {n:"Naturalne błyszczyki do ust",s:"/naturalne-blyszczyki-do-ust",c:"kosmetyki_naturalne"},
  {n:"Naturalne peelingi do ust",s:"/naturalne-peelingi-do-ust",c:"kosmetyki_naturalne"},
  {n:"Naturalne pomadki do ust",s:"/naturalne-pomadki-do-ust",c:"kosmetyki_naturalne"},
  {n:"Naturalne kosmetyki pod oczy",s:"/naturalne-kosmetyki-pod-oczy",c:"kosmetyki_naturalne"},
  {n:"Naturalne kremy pod oczy",s:"/naturalne-kremy-pod-oczy",c:"kosmetyki_naturalne"},
  {n:"Naturalne serum pod oczy",s:"/naturalne-serum-pod-oczy",c:"kosmetyki_naturalne"},
  {n:"Kosmetyki pod prysznic",s:"/kosmetyki-pod-prysznic",c:"kosmetyki_naturalne"},
  {n:"Akcesoria pod prysznic",s:"/akcesoria-pod-prysznic",c:"kosmetyki_naturalne"},
  {n:"Mydła pod prysznic",s:"/mydla-pod-prysznic",c:"kosmetyki_naturalne"},
  {n:"Olejki pod prysznic",s:"/olejki-pod-prysznic",c:"kosmetyki_naturalne"},
  {n:"Peelingi pod prysznic",s:"/peelingi-pod-prysznic",c:"kosmetyki_naturalne"},
  {n:"Pianki pod prysznic",s:"/pianki-pod-prysznic",c:"kosmetyki_naturalne"},
  {n:"Żele pod prysznic",s:"/zele-pod-prysznic",c:"kosmetyki_naturalne"},
  {n:"Kosmetyki wegańskie",s:"/kosmetyki-weganskie",c:"kosmetyki_naturalne"},
  {n:"Kosmetyki z kwasami",s:"/kosmetyki-z-kwasami",c:"kosmetyki_naturalne"},
  {n:"Kosmetyki z retinolem",s:"/kosmetyki-z-retinolem",c:"kosmetyki_naturalne"},
  {n:"Krem z retinolem",s:"/krem-z-retinolem",c:"kosmetyki_naturalne"},
  {n:"Krem z retinolem na noc",s:"/krem-z-retinolem-na-noc",c:"kosmetyki_naturalne"},
  {n:"Kremy z retinolem do twarzy",s:"/kremy-z-retinolem-do-twarzy",c:"kosmetyki_naturalne"},
  {n:"Kremy z retinolem pod oczy",s:"/kremy-z-retinolem-pod-oczy",c:"kosmetyki_naturalne"},
  {n:"Serum z retinolem",s:"/serum-z-retinolem",c:"kosmetyki_naturalne"},
  {n:"Serum do twarzy z retinolem",s:"/serum-do-twarzy-z-retinolem",c:"kosmetyki_naturalne"},
  {n:"Serum pod oczy z retinolem",s:"/serum-pod-oczy-z-retinolem",c:"kosmetyki_naturalne"},
  {n:"Kosmetyki z witaminą C",s:"/kosmetyki-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Ampułki z witaminą C",s:"/ampulki-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Kremy z witaminą C",s:"/kremy-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Kremy do twarzy z witaminą C",s:"/kremy-do-twarzy-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Kremy pod oczy z witaminą C",s:"/kremy-pod-oczy-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Maski z witaminą C",s:"/maski-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Peelingi z witaminą C",s:"/peelingi-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Serum z witaminą C",s:"/serum-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Serum do twarzy z witaminą C",s:"/serum-do-twarzy-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Serum pod oczy z witaminą C",s:"/serum-pod-oczy-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Toniki z witaminą C",s:"/toniki-z-witamina-c",c:"kosmetyki_naturalne"},
  {n:"Ochrona przed światłem niebieskim",s:"/ochrona-przed-swiatlem-niebieskim",c:"kosmetyki_naturalne"},
  {n:"Stylizacja włosów",s:"/stylizacja-wlosow",c:"kosmetyki_naturalne"},
  {n:"Żele do włosów",s:"/zele-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Pomady do włosów",s:"/pomady-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Lakiery do włosów",s:"/lakiery-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Glinki do włosów",s:"/glinki-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Gumy do włosów",s:"/gumy-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Kremy do włosów",s:"/kremy-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Pasty do włosów",s:"/pasty-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Pianki do włosów",s:"/pianki-do-wlosow",c:"kosmetyki_naturalne"},
  {n:"Stylizacja loków",s:"/stylizacja-lokow",c:"kosmetyki_naturalne"},
  {n:"Zapachy",s:"/zapachy",c:"kosmetyki_naturalne"},
  {n:"Zestawy",s:"/zestawy",c:"kosmetyki_naturalne"},
  {n:"Zestawy do pielęgnacji",s:"/zestawy-do-pielegnacji",c:"kosmetyki_naturalne"},
  {n:"Zestawy do pielęgnacji ciała",s:"/zestawy-do-pielegnacji-ciala",c:"kosmetyki_naturalne"},
  {n:"Zestawy do pielęgnacji dłoni",s:"/zestawy-do-pielegnacji-dloni",c:"kosmetyki_naturalne"},
  {n:"Zestawy do pielęgnacji stóp",s:"/zestawy-do-pielegnacji-stop",c:"kosmetyki_naturalne"},
  {n:"Zestawy do pielęgnacji twarzy",s:"/zestawy-do-pielegnacji-twarzy",c:"kosmetyki_naturalne"},
  {n:"Złuszczanie",s:"/zluszczanie",c:"kosmetyki_naturalne"},
  {n:"Płatki złuszczające",s:"/platki-zluszczajace",c:"kosmetyki_naturalne"},
  {n:"Tonik złuszczający",s:"/tonik-zluszczajacy",c:"kosmetyki_naturalne"},
  {n:"Żywność Funkcjonalna",s:"/zywnosc-funkcjonalna",c:"kosmetyki_naturalne"},
  {n:"Suplementy diety",s:"/suplementy-diety",c:"suplementy"},
  {n:"Witaminy i minerały",s:"/witaminy-i-mineraly",c:"suplementy"},
  {n:"Suplementy z witaminą E",s:"/suplementy-z-witamina-e",c:"suplementy"},
  {n:"Suplementy z witaminą D",s:"/suplementy-z-witamina-d",c:"suplementy"},
  {n:"Suplementy z witaminą C",s:"/suplementy-z-witamina-c",c:"suplementy"},
  {n:"Suplementy z witaminami",s:"/suplementy-z-witaminami",c:"suplementy"},
  {n:"Suplementy z siarką",s:"/suplementy-z-siarka",c:"suplementy"},
  {n:"Suplementy z minerałami",s:"/suplementy-z-mineralami",c:"suplementy"},
  {n:"Suplementy z magnezem",s:"/suplementy-z-magnezem",c:"suplementy"},
  {n:"Suplementy z krzemem",s:"/suplementy-z-krzemem",c:"suplementy"},
  {n:"Suplementy z cynkiem",s:"/suplementy-z-cynkiem",c:"suplementy"},
  {n:"Suplementy z chromem",s:"/suplementy-z-chromem",c:"suplementy"},
  {n:"Suplementy z biotyną (witamina B7)",s:"/suplementy-z-biotyna-witamina-b7",c:"suplementy"},
  {n:"Budujące organizm",s:"/budujace-organizm",c:"suplementy"},
  {n:"Suplementy z tranem",s:"/suplementy-z-tranem",c:"suplementy"},
  {n:"Suplementy z tauryną",s:"/suplementy-z-tauryna",c:"suplementy"},
  {n:"Suplementy z olejkami eterycznymi",s:"/suplementy-z-olejkami-eterycznymi",c:"suplementy"},
  {n:"Suplementy z olejem z wiesiołka",s:"/suplementy-z-olejem-z-wiesiolka",c:"suplementy"},
  {n:"Suplementy z olejem z pestek winogron",s:"/suplementy-z-olejem-z-pestek-winogron",c:"suplementy"},
  {n:"Suplementy z olejem z ogórecznika",s:"/suplementy-z-olejem-z-ogorecznika",c:"suplementy"},
  {n:"Suplementy z olejem CBD",s:"/suplementy-z-olejem-cbd",c:"suplementy"},
  {n:"Suplementy z olejami",s:"/suplementy-z-olejami",c:"suplementy"},
  {n:"Suplementy z NNKT",s:"/suplementy-z-nnkt",c:"suplementy"},
  {n:"Suplementy z kwasami Omega 3",s:"/suplementy-z-kwasami-omega-3",c:"suplementy"},
  {n:"Suplementy z kolagenem",s:"/suplementy-z-kolagenem",c:"suplementy"},
  {n:"Suplementy z keratyną",s:"/suplementy-z-keratyna",c:"suplementy"},
  {n:"Suplementy z elastyną",s:"/suplementy-z-elastyna",c:"suplementy"},
  {n:"Suplementy z aminokwasami",s:"/suplementy-z-aminokwasami",c:"suplementy"},
  {n:"Tarcza antyoksydacyjna",s:"/tarcza-antyoksydacyjna",c:"suplementy"},
  {n:"Suplementy z ziołami i herbatami",s:"/suplementy-z-ziolami-i-herbatami",c:"suplementy"},
  {n:"Suplementy z rumiankiem",s:"/suplementy-z-rumiankiem",c:"suplementy"},
  {n:"Suplementy z resweratrolem",s:"/suplementy-z-resweratrolem",c:"suplementy"},
  {n:"Suplementy z propolisem",s:"/suplementy-z-propolisem",c:"suplementy"},
  {n:"Suplementy z piperyną",s:"/suplementy-z-piperyna",c:"suplementy"},
  {n:"Suplementy z lukrecją",s:"/suplementy-z-lukrecja",c:"suplementy"},
  {n:"Suplementy z kwasem alfa-liponowym",s:"/suplementy-z-kwasem-alfa-liponowym",c:"suplementy"},
  {n:"Suplementy z kurkumą",s:"/suplementy-z-kurkuma",c:"suplementy"},
  {n:"Suplementy z koenzymem Q10",s:"/suplementy-z-koenzymem-q10",c:"suplementy"},
  {n:"Suplementy z karotenoidami",s:"/suplementy-z-karotenoidami",c:"suplementy"},
  {n:"Suplementy z glutationem",s:"/suplementy-z-glutationem",c:"suplementy"},
  {n:"Suplementy z ekstraktami ziołowymi",s:"/suplementy-z-ekstraktami-ziolowymi",c:"suplementy"},
  {n:"Suplementy z arbutyną",s:"/suplementy-z-arbutyna",c:"suplementy"},
  {n:"Suplementy z aloesem",s:"/suplementy-z-aloesem",c:"suplementy"},
  {n:"Suplementy z adaptogenami",s:"/suplementy-z-adaptogenami",c:"suplementy"},
  {n:"Bioaktywne formuły",s:"/bioaktywne-formuly",c:"suplementy"},
  {n:"Suplementy ze złotem koloidalnym",s:"/suplementy-ze-zlotem-koloidalnym",c:"suplementy"},
  {n:"Suplementy ze srebrem koloidalnym",s:"/suplementy-ze-srebrem-koloidalnym",c:"suplementy"},
  {n:"Suplementy z probiotykami",s:"/suplementy-z-probiotykami",c:"suplementy"},
  {n:"Suplementy z papainą",s:"/suplementy-z-papaina",c:"suplementy"},
  {n:"Suplementy z kwasem hialuronowym (HA)",s:"/suplementy-z-kwasem-hialuronowym-ha",c:"suplementy"},
  {n:"Suplementy z kofeiną",s:"/suplementy-z-kofeina",c:"suplementy"},
  {n:"Suplementy z glukozaminą",s:"/suplementy-z-glukozamina",c:"suplementy"},
  {n:"Suplementy z enzymami",s:"/suplementy-z-enzymami",c:"suplementy"},
  {n:"Suplementy z elektrolitami",s:"/suplementy-z-elektrolitami",c:"suplementy"},
  {n:"Suplementy z chondroityną",s:"/suplementy-z-chondroityna",c:"suplementy"},
  {n:"Suplementy z błonnikiem",s:"/suplementy-z-blonnikiem",c:"suplementy"},
  {n:"Suplementy z algami",s:"/suplementy-z-algami",c:"suplementy"},
  {n:"Suplementy mitoceutyczne",s:"/suplementy-mitoceutyczne",c:"suplementy"},
  {n:"Wsparcie ukierunkowane",s:"/wsparcie-ukierunkowane",c:"suplementy"},
  {n:"Suplementy na żylaki",s:"/suplementy-na-zylaki",c:"suplementy"},
  {n:"Suplementy na wzrok",s:"/suplementy-na-wzrok",c:"suplementy"},
  {n:"Suplementy na włosy",s:"/suplementy-na-wlosy",c:"suplementy"},
  {n:"Suplementy na wątrobę",s:"/suplementy-na-watrobe",c:"suplementy"},
  {n:"Suplementy na układ nerwowy",s:"/suplementy-na-uklad-nerwowy",c:"suplementy"},
  {n:"Suplementy na trzustkę",s:"/suplementy-na-trzustke",c:"suplementy"},
  {n:"Suplementy na trądzik",s:"/suplementy-na-tradzik",c:"suplementy"},
  {n:"Suplementy na trawienie",s:"/suplementy-na-trawienie",c:"suplementy"},
  {n:"Suplementy na tarczycę",s:"/suplementy-na-tarczyce",c:"suplementy"},
  {n:"Suplementy na stawy",s:"/suplementy-na-stawy",c:"suplementy"},
  {n:"Suplementy na skórę",s:"/suplementy-na-skore",c:"suplementy"},
  {n:"Suplementy na serce",s:"/suplementy-na-serce",c:"suplementy"},
  {n:"Suplementy na prostatę",s:"/suplementy-na-prostate",c:"suplementy"},
  {n:"Suplementy na paznokcie",s:"/suplementy-na-paznokcie",c:"suplementy"},
  {n:"Suplementy na nerki",s:"/suplementy-na-nerki",c:"suplementy"},
  {n:"Suplementy na jelita",s:"/suplementy-na-jelita",c:"suplementy"},
  {n:"Suplementy na cholesterol",s:"/suplementy-na-cholesterol",c:"suplementy"},
  {n:"Codzienne dolegliwości",s:"/codzienne-dolegliwosci",c:"suplementy"},
  {n:"Suplementy po COVID",s:"/suplementy-po-covid",c:"suplementy"},
  {n:"Suplementy na zakwasy",s:"/suplementy-na-zakwasy",c:"suplementy"},
  {n:"Suplementy na stres",s:"/suplementy-na-stres",c:"suplementy"},
  {n:"Suplementy na stany zapalne",s:"/suplementy-na-stany-zapalne",c:"suplementy"},
  {n:"Suplementy na sen",s:"/suplementy-na-sen",c:"suplementy"},
  {n:"Suplementy na poprawę nastroju",s:"/suplementy-na-poprawe-nastroju",c:"suplementy"},
  {n:"Suplementy na pasożyty",s:"/suplementy-na-pasozyty",c:"suplementy"},
  {n:"Suplementy na odchudzanie",s:"/suplementy-na-odchudzanie",c:"suplementy"},
  {n:"Suplementy na oczyszczanie organizmu",s:"/suplementy-na-oczyszczanie-organizmu",c:"suplementy"},
  {n:"Suplementy na menopauzę",s:"/suplementy-na-menopauze",c:"suplementy"},
  {n:"Suplementy na libido",s:"/suplementy-na-libido",c:"suplementy"},
  {n:"Suplementy na energię",s:"/suplementy-na-energie",c:"suplementy"},
  {n:"Suplementy keto",s:"/suplementy-keto",c:"suplementy"},
  {n:"Suplementy antyoksydacyjne",s:"/suplementy-antyoksydacyjne",c:"suplementy"},
  {n:"Formuły dedykowane",s:"/formuly-dedykowane",c:"suplementy"},
  {n:"Suplementy na siłownię",s:"/suplementy-na-silownie",c:"suplementy"},
  {n:"Suplementy na masę mięśniową",s:"/suplementy-na-mase-miesniowa",c:"suplementy"},
  {n:"Suplementy dla wegetarian",s:"/suplementy-dla-wegetarian",c:"suplementy"},
  {n:"Suplementy dla wegan",s:"/suplementy-dla-wegan",c:"suplementy"},
  {n:"Suplementy dla sportowców",s:"/suplementy-dla-sportowcow",c:"suplementy"},
  {n:"Suplementy dla seniorów",s:"/suplementy-dla-seniorow",c:"suplementy"},
  {n:"Suplementy dla nastolatków",s:"/suplementy-dla-nastolatkow",c:"suplementy"},
  {n:"Suplementy dla mężczyzn starających się o dziecko",s:"/suplementy-dla-mezczyzn-starajacych-sie-o-dziecko",c:"suplementy"},
  {n:"Suplementy dla mężczyzn",s:"/suplementy-dla-mezczyzn",c:"suplementy"},
  {n:"Suplementy dla kolarzy",s:"/suplementy-dla-kolarzy",c:"suplementy"},
  {n:"Suplementy dla kobiet w ciąży",s:"/suplementy-dla-kobiet-w-ciazy",c:"suplementy"},
  {n:"Suplementy dla kobiet starających się o dziecko",s:"/suplementy-dla-kobiet-starajacych-sie-o-dziecko",c:"suplementy"},
  {n:"Suplementy dla kobiet karmiących",s:"/suplementy-dla-kobiet-karmiacych",c:"suplementy"},
  {n:"Suplementy dla kobiet",s:"/suplementy-dla-kobiet",c:"suplementy"},
  {n:"Suplementy dla dzieci",s:"/suplementy-dla-dzieci",c:"suplementy"},
  {n:"Suplementy dla cukrzyków",s:"/suplementy-dla-cukrzykow",c:"suplementy"},
  {n:"Suplementy dla biegaczy",s:"/suplementy-dla-biegaczy",c:"suplementy"},
  {n:"Wskazanie",s:"/wskazanie",c:"wskazanie"},
  {n:"Wypadanie włosów",s:"/wypadanie-wlosow",c:"wskazanie"},
  {n:"Szampony przeciw wypadaniu włosów",s:"/szampony-przeciw-wypadaniu-wlosow",c:"wskazanie"},
  {n:"Szampony przeciw wypadaniu włosów dla mężczyzn",s:"/szampony-przeciw-wypadaniu-wlosow-dla-mezczyzn",c:"wskazanie"},
  {n:"Wcierki przeciw wypadaniu włosów",s:"/wcierki-przeciw-wypadaniu-wlosow",c:"wskazanie"},
  {n:"Odżywki przeciw wypadaniu włosów",s:"/odzywki-przeciw-wypadaniu-wlosow",c:"wskazanie"},
  {n:"Peelingi na wypadające włosy",s:"/peelingi-na-wypadajace-wlosy",c:"wskazanie"},
  {n:"Suplementy na wypadanie włosów",s:"/suplementy-na-wypadanie-wlosow",c:"wskazanie"},
  {n:"Ampułki przeciw wypadaniu włosów",s:"/ampulki-przeciw-wypadaniu-wlosow",c:"wskazanie"},
  {n:"Preparaty przeciw wypadaniu włosów",s:"/preparaty-przeciw-wypadaniu-wlosow",c:"wskazanie"},
  {n:"Serum przeciw wypadaniu włosów",s:"/serum-przeciw-wypadaniu-wlosow",c:"wskazanie"},
  {n:"Akcesoria na wypadające włosy",s:"/akcesoria-na-wypadajace-wlosy",c:"wskazanie"},
  {n:"Kuracje przeciw wypadaniu włosów",s:"/kuracje-przeciw-wypadaniu-wlosow",c:"wskazanie"},
  {n:"Maski na wypadające włosy",s:"/maski-na-wypadajace-wlosy",c:"wskazanie"},
  {n:"Olejki na wypadające włosy",s:"/olejki-na-wypadajace-wlosy",c:"wskazanie"},
  {n:"Łojotok",s:"/lojotok",c:"wskazanie"},
  {n:"Szampony przeciwłojotokowe",s:"/szampony-przeciwlojotokowe",c:"wskazanie"},
  {n:"Ampułki na łojotok",s:"/ampulki-na-lojotok",c:"wskazanie"},
  {n:"Emulsje na łojotok",s:"/emulsje-na-lojotok",c:"wskazanie"},
  {n:"Hydrolaty na łojotok",s:"/hydrolaty-na-lojotok",c:"wskazanie"},
  {n:"Krem-żel na łojotok",s:"/krem-zel-na-lojotok",c:"wskazanie"},
  {n:"Kremy na łojotok",s:"/kremy-na-lojotok",c:"wskazanie"},
  {n:"Kuracje na łojotok",s:"/kuracje-na-lojotok",c:"wskazanie"},
  {n:"Maseczki na łojotok",s:"/maseczki-na-lojotok",c:"wskazanie"},
  {n:"Peelingi na łojotok",s:"/peelingi-na-lojotok",c:"wskazanie"},
  {n:"Płatki na łojotok",s:"/platki-na-lojotok",c:"wskazanie"},
  {n:"Serum na łojotok",s:"/serum-na-lojotok",c:"wskazanie"},
  {n:"Szampony na łojotok",s:"/szampony-na-lojotok",c:"wskazanie"},
  {n:"Toniki na łojotok",s:"/toniki-na-lojotok",c:"wskazanie"},
  {n:"Żele na łojotok",s:"/zele-na-lojotok",c:"wskazanie"},
  {n:"Anti-pollution",s:"/anti-pollution",c:"wskazanie"},
  {n:"Ampułki anti-pollution",s:"/ampulki-anti-pollution",c:"wskazanie"},
  {n:"Kremy anti-pollution",s:"/kremy-anti-pollution",c:"wskazanie"},
  {n:"Makijaż anti-pollution",s:"/makijaz-anti-pollution",c:"wskazanie"},
  {n:"Mgiełki anti-pollution",s:"/mgielki-anti-pollution",c:"wskazanie"},
  {n:"Olejki anti-pollution",s:"/olejki-anti-pollution",c:"wskazanie"},
  {n:"Serum anti-pollution",s:"/serum-anti-pollution",c:"wskazanie"},
  {n:"Żele anti-pollution",s:"/zele-anti-pollution",c:"wskazanie"},
  {n:"Atopowe zapalenie skóry AZS",s:"/atopowe-zapalenie-skory-azs",c:"wskazanie"},
  {n:"Ampułki na atopowe zapalenie skóry",s:"/ampulki-na-atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Balsamy na atopowe zapalenie skóry",s:"/balsamy-na-atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Kremy na atopowe zapalenie skóry",s:"/kremy-na-atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Kremy na atopowe zapalenie skóry dla dzieci",s:"/kremy-na-atopowe-zapalenie-skory-dla-dzieci",c:"wskazanie"},
  {n:"Maseczki na atopowe zapalenie skóry",s:"/maseczki-na-atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Maści na atopowe zapalenie skóry",s:"/masci-na-atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Maści na atopowe zapalenie skóry dla dzieci",s:"/masci-na-atopowe-zapalenie-skory-dla-dzieci",c:"wskazanie"},
  {n:"Mydła na atopowe zapalenie skóry",s:"/mydla-na-atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Olejki na atopowe zapalenie skóry",s:"/olejki-na-atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Serum na atopowe zapalenie skóry",s:"/serum-na-atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Szampony na atopowe zapalenie skóry",s:"/szampony-na-atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Żele na atopowe zapalenie skóry",s:"/zele-na-atopowe-zapalenie-skory",c:"wskazanie"},
  {n:"Bielactwo",s:"/bielactwo",c:"wskazanie"},
  {n:"Blizny",s:"/blizny",c:"wskazanie"},
  {n:"Kremy na blizny",s:"/kremy-na-blizny",c:"wskazanie"},
  {n:"Ampułki na blizny",s:"/ampulki-na-blizny",c:"wskazanie"},
  {n:"Olejki na blizny",s:"/olejki-na-blizny",c:"wskazanie"},
  {n:"Peelingi na blizny",s:"/peelingi-na-blizny",c:"wskazanie"},
  {n:"Serum na blizny",s:"/serum-na-blizny",c:"wskazanie"},
  {n:"Żele na blizny",s:"/zele-na-blizny",c:"wskazanie"},
  {n:"Cellulit",s:"/cellulit",c:"wskazanie"},
  {n:"Kremy na cellulit",s:"/kremy-na-cellulit",c:"wskazanie"},
  {n:"Balsamy na cellulit",s:"/balsamy-na-cellulit",c:"wskazanie"},
  {n:"Akcesoria na cellulit",s:"/akcesoria-na-cellulit",c:"wskazanie"},
  {n:"Rękawice na cellulit",s:"/rekawice-na-cellulit",c:"wskazanie"},
  {n:"Rollery na cellulit",s:"/rollery-na-cellulit",c:"wskazanie"},
  {n:"Szczotki na cellulit",s:"/szczotki-na-cellulit",c:"wskazanie"},
  {n:"Emulsje na cellulit",s:"/emulsje-na-cellulit",c:"wskazanie"},
  {n:"Kuracje na cellulit",s:"/kuracje-na-cellulit",c:"wskazanie"},
  {n:"Maski na cellulit",s:"/maski-na-cellulit",c:"wskazanie"},
  {n:"Olejki na cellulit",s:"/olejki-na-cellulit",c:"wskazanie"},
  {n:"Peelingi na cellulit",s:"/peelingi-na-cellulit",c:"wskazanie"},
  {n:"Serum na cellulit",s:"/serum-na-cellulit",c:"wskazanie"},
  {n:"Sole do kąpieli na cellulit",s:"/sole-do-kapieli-na-cellulit",c:"wskazanie"},
  {n:"Żele na cellulit",s:"/zele-na-cellulit",c:"wskazanie"},
  {n:"Cienie i obrzęki pod oczami",s:"/cienie-i-obrzeki-pod-oczami",c:"wskazanie"},
  {n:"Serum na cienie pod oczami",s:"/serum-na-cienie-pod-oczami",c:"wskazanie"},
  {n:"Akcesoria na cienie pod oczami",s:"/akcesoria-na-cienie-pod-oczami",c:"wskazanie"},
  {n:"Ampułki na cienie pod oczami",s:"/ampulki-na-cienie-pod-oczami",c:"wskazanie"},
  {n:"Emulsje na cienie pod oczami",s:"/emulsje-na-cienie-pod-oczami",c:"wskazanie"},
  {n:"Korektory na cienie pod oczami",s:"/korektory-na-cienie-pod-oczami",c:"wskazanie"},
  {n:"Kremy pod oczy na cienie",s:"/kremy-pod-oczy-na-cienie",c:"wskazanie"},
  {n:"Maski na cienie pod oczami",s:"/maski-na-cienie-pod-oczami",c:"wskazanie"},
  {n:"Płatki pod oczy na cienie",s:"/platki-pod-oczy-na-cienie",c:"wskazanie"},
  {n:"Żele pod oczy na cienie",s:"/zele-pod-oczy-na-cienie",c:"wskazanie"},
  {n:"Dermo-makijaż (brak dalszego podziału)",s:"/dermo-makijaz-brak-dalszego-podzialu",c:"wskazanie"},
  {n:"Fotostarzenie (brak dalszego podziału)",s:"/fotostarzenie-brak-dalszego-podzialu",c:"wskazanie"},
  {n:"Higiena intymna",s:"/higiena-intymna",c:"wskazanie"},
  {n:"Kremy do higieny intymnej",s:"/kremy-do-higieny-intymnej",c:"wskazanie"},
  {n:"Mydła do higieny intymnej",s:"/mydla-do-higieny-intymnej",c:"wskazanie"},
  {n:"Olejki do higieny intymnej",s:"/olejki-do-higieny-intymnej",c:"wskazanie"},
  {n:"Płyny do higieny intymnej",s:"/plyny-do-higieny-intymnej",c:"wskazanie"},
  {n:"Naturalne płyny do higieny intymnej",s:"/naturalne-plyny-do-higieny-intymnej",c:"wskazanie"},
  {n:"Żele do higieny intymnej",s:"/zele-do-higieny-intymnej",c:"wskazanie"},
  {n:"Kosmetyki na wrastające włoski",s:"/kosmetyki-na-wrastajace-wloski",c:"wskazanie"},
  {n:"Akcesoria na wrastające włoski",s:"/akcesoria-na-wrastajace-wloski",c:"wskazanie"},
  {n:"Dezodoranty na wrastające włoski",s:"/dezodoranty-na-wrastajace-wloski",c:"wskazanie"},
  {n:"Emulsje na wrastające włoski",s:"/emulsje-na-wrastajace-wloski",c:"wskazanie"},
  {n:"Mleczka na wrastające włoski",s:"/mleczka-na-wrastajace-wloski",c:"wskazanie"},
  {n:"Płyny na wrastające włoski",s:"/plyny-na-wrastajace-wloski",c:"wskazanie"},
  {n:"Serum na wrastające włoski",s:"/serum-na-wrastajace-wloski",c:"wskazanie"},
  {n:"Żele na wrastające włoski",s:"/zele-na-wrastajace-wloski",c:"wskazanie"},
  {n:"Łupież",s:"/lupiez",c:"wskazanie"},
  {n:"Szampony przeciwłupieżowe",s:"/szampony-przeciwlupiezowe",c:"wskazanie"},
  {n:"Maski przeciwłupieżowe do włosów",s:"/maski-przeciwlupiezowe-do-wlosow",c:"wskazanie"},
  {n:"Peelingi przeciwłupieżowe do skóry głowy",s:"/peelingi-przeciwlupiezowe-do-skory-glowy",c:"wskazanie"},
  {n:"Spray przeciwłupieżowy do włosów",s:"/spray-przeciwlupiezowy-do-wlosow",c:"wskazanie"},
  {n:"Szampony na łupież suchy",s:"/szampony-na-lupiez-suchy",c:"wskazanie"},
  {n:"Szampony na łupież tłusty",s:"/szampony-na-lupiez-tlusty",c:"wskazanie"},
  {n:"Szampony przeciwłupieżowe dla mężczyzn",s:"/szampony-przeciwlupiezowe-dla-mezczyzn",c:"wskazanie"},
  {n:"Łuszczyca",s:"/luszczyca",c:"wskazanie"},
  {n:"Szampony na łuszczycę",s:"/szampony-na-luszczyce",c:"wskazanie"},
  {n:"Kremy na łuszczycę",s:"/kremy-na-luszczyce",c:"wskazanie"},
  {n:"Balsamy na łuszczycę",s:"/balsamy-na-luszczyce",c:"wskazanie"},
  {n:"Maski na łuszczycę",s:"/maski-na-luszczyce",c:"wskazanie"},
  {n:"Maści na łuszczycę",s:"/masci-na-luszczyce",c:"wskazanie"},
  {n:"Mydła na łuszczycę",s:"/mydla-na-luszczyce",c:"wskazanie"},
  {n:"Olejki na łuszczycę",s:"/olejki-na-luszczyce",c:"wskazanie"},
  {n:"Płyny na łuszczycę",s:"/plyny-na-luszczyce",c:"wskazanie"},
  {n:"Menopauza",s:"/menopauza",c:"wskazanie"},
  {n:"Kremy w okresie menopauzy",s:"/kremy-w-okresie-menopauzy",c:"wskazanie"},
  {n:"Maski w okresie menopauzy",s:"/maski-w-okresie-menopauzy",c:"wskazanie"},
  {n:"Olejki eteryczne w okresie menopauzy",s:"/olejki-eteryczne-w-okresie-menopauzy",c:"wskazanie"},
  {n:"Olejki w okresie menopauzy",s:"/olejki-w-okresie-menopauzy",c:"wskazanie"},
  {n:"Serum w okresie menopauzy",s:"/serum-w-okresie-menopauzy",c:"wskazanie"},
  {n:"Naczynka",s:"/naczynka",c:"wskazanie"},
  {n:"Ampułki na naczynka",s:"/ampulki-na-naczynka",c:"wskazanie"},
  {n:"Emulsje na naczynka",s:"/emulsje-na-naczynka",c:"wskazanie"},
  {n:"Hydrolaty na naczynka",s:"/hydrolaty-na-naczynka",c:"wskazanie"},
  {n:"Kremy na naczynka",s:"/kremy-na-naczynka",c:"wskazanie"},
  {n:"Maseczki na naczynka",s:"/maseczki-na-naczynka",c:"wskazanie"},
  {n:"Olejki na naczynka",s:"/olejki-na-naczynka",c:"wskazanie"},
  {n:"Peeling na naczynka",s:"/peeling-na-naczynka",c:"wskazanie"},
  {n:"Serum na naczynka",s:"/serum-na-naczynka",c:"wskazanie"},
  {n:"Toniki na naczynka",s:"/toniki-na-naczynka",c:"wskazanie"},
  {n:"Żele na naczynka",s:"/zele-na-naczynka",c:"wskazanie"},
  {n:"Nadmierna potliwość",s:"/nadmierna-potliwosc",c:"wskazanie"},
  {n:"Antyperspiranty na nadmierne pocenie",s:"/antyperspiranty-na-nadmierne-pocenie",c:"wskazanie"},
  {n:"Dezodoranty na potliwość",s:"/dezodoranty-na-potliwosc",c:"wskazanie"},
  {n:"Kremy na nadmierne pocenie",s:"/kremy-na-nadmierne-pocenie",c:"wskazanie"},
  {n:"Żele pod prysznic na nadmierne pocenie",s:"/zele-pod-prysznic-na-nadmierne-pocenie",c:"wskazanie"},
  {n:"Odkażanie i dezynfekcja",s:"/odkazanie-i-dezynfekcja",c:"wskazanie"},
  {n:"Mydła do dezynfekcji rąk",s:"/mydla-do-dezynfekcji-rak",c:"wskazanie"},
  {n:"Płyny do dezynfekcji rąk",s:"/plyny-do-dezynfekcji-rak",c:"wskazanie"},
  {n:"Odwodnienie",s:"/odwodnienie",c:"wskazanie"},
  {n:"Ampułki nawadniające",s:"/ampulki-nawadniajace",c:"wskazanie"},
  {n:"Kremy nawadniające",s:"/kremy-nawadniajace",c:"wskazanie"},
  {n:"Maseczki nawadniające",s:"/maseczki-nawadniajace",c:"wskazanie"},
  {n:"Serum nawadniające",s:"/serum-nawadniajace",c:"wskazanie"},
  {n:"Toniki nawadniające",s:"/toniki-nawadniajace",c:"wskazanie"},
  {n:"Żele nawadniające",s:"/zele-nawadniajace",c:"wskazanie"},
  {n:"Oparzenie słoneczne",s:"/oparzenie-sloneczne",c:"wskazanie"},
  {n:"Aloes na oparzenia słoneczne",s:"/aloes-na-oparzenia-sloneczne",c:"wskazanie"},
  {n:"Balsamy na oparzenia słoneczne",s:"/balsamy-na-oparzenia-sloneczne",c:"wskazanie"},
  {n:"Kremy na oparzenia słoneczne",s:"/kremy-na-oparzenia-sloneczne",c:"wskazanie"},
  {n:"Maseczki na oparzenia słoneczne",s:"/maseczki-na-oparzenia-sloneczne",c:"wskazanie"},
  {n:"Serum na oparzenia słoneczne",s:"/serum-na-oparzenia-sloneczne",c:"wskazanie"},
  {n:"Żele na oparzenia słoneczne",s:"/zele-na-oparzenia-sloneczne",c:"wskazanie"},
  {n:"Osłabienie brwi lub rzęs",s:"/oslabienie-brwi-lub-rzes",c:"wskazanie"},
  {n:"Odżywki na porost brwi",s:"/odzywki-na-porost-brwi",c:"wskazanie"},
  {n:"Odżywki na porost rzęs",s:"/odzywki-na-porost-rzes",c:"wskazanie"},
  {n:"Serum na porost brwi",s:"/serum-na-porost-brwi",c:"wskazanie"},
  {n:"Serum na porost rzęs",s:"/serum-na-porost-rzes",c:"wskazanie"},
  {n:"Podrażnienie/uwrażliwienie",s:"/podraznienie-uwrazliwienie",c:"wskazanie"},
  {n:"Ampułki na podrażnienia",s:"/ampulki-na-podraznienia",c:"wskazanie"},
  {n:"Balsamy na podrażnienia",s:"/balsamy-na-podraznienia",c:"wskazanie"},
  {n:"Emulsje na podrażnienia",s:"/emulsje-na-podraznienia",c:"wskazanie"},
  {n:"Esencje na podrażnienia",s:"/esencje-na-podraznienia",c:"wskazanie"},
  {n:"Krem regenerujący do twarzy",s:"/krem-regenerujacy-do-twarzy",c:"wskazanie"},
  {n:"Krem-żel na podrażnienia",s:"/krem-zel-na-podraznienia",c:"wskazanie"},
  {n:"Kremy na podrażnienia",s:"/kremy-na-podraznienia",c:"wskazanie"},
  {n:"Kuracje na podrażnienia",s:"/kuracje-na-podraznienia",c:"wskazanie"},
  {n:"Makijaż dla skóry podrażnionej",s:"/makijaz-dla-skory-podraznionej",c:"wskazanie"},
  {n:"Maseczki na podrażnienia",s:"/maseczki-na-podraznienia",c:"wskazanie"},
  {n:"Masła na podrażnienia",s:"/masla-na-podraznienia",c:"wskazanie"},
  {n:"Mgiełki na podrażnienia",s:"/mgielki-na-podraznienia",c:"wskazanie"},
  {n:"Mleczka na podrażnienia",s:"/mleczka-na-podraznienia",c:"wskazanie"},
  {n:"Olejki na podrażnienia",s:"/olejki-na-podraznienia",c:"wskazanie"},
  {n:"Pianki na podrażnienia",s:"/pianki-na-podraznienia",c:"wskazanie"},
  {n:"Serum na podrażnienia",s:"/serum-na-podraznienia",c:"wskazanie"},
  {n:"Szampony na podrażnienia",s:"/szampony-na-podraznienia",c:"wskazanie"},
  {n:"Toniki na podrażnienia",s:"/toniki-na-podraznienia",c:"wskazanie"},
  {n:"Żele na podrażnienia",s:"/zele-na-podraznienia",c:"wskazanie"},
  {n:"Porost włosów",s:"/porost-wlosow",c:"wskazanie"},
  {n:"Suplementy na porost włosów",s:"/suplementy-na-porost-wlosow",c:"wskazanie"},
  {n:"Ampułki na porost włosów",s:"/ampulki-na-porost-wlosow",c:"wskazanie"},
  {n:"Maski na porost włosów",s:"/maski-na-porost-wlosow",c:"wskazanie"},
  {n:"Odżywki na porost włosów",s:"/odzywki-na-porost-wlosow",c:"wskazanie"},
  {n:"Olejki na prost włosów",s:"/olejki-na-prost-wlosow",c:"wskazanie"},
  {n:"Szampony na porost włosów",s:"/szampony-na-porost-wlosow",c:"wskazanie"},
  {n:"Szampony na porost włosów dla mężczyzn",s:"/szampony-na-porost-wlosow-dla-mezczyzn",c:"wskazanie"},
  {n:"Wcierki na porost włosów",s:"/wcierki-na-porost-wlosow",c:"wskazanie"},
  {n:"Przebarwienia",s:"/przebarwienia",c:"wskazanie"},
  {n:"Ampułki rozjaśniające przebarwienia",s:"/ampulki-rozjasniajace-przebarwienia",c:"wskazanie"},
  {n:"Balsamy rozjaśniające przebarwienia",s:"/balsamy-rozjasniajace-przebarwienia",c:"wskazanie"},
  {n:"Emulsje na przebarwienia",s:"/emulsje-na-przebarwienia",c:"wskazanie"},
  {n:"Kremy na przebarwienia",s:"/kremy-na-przebarwienia",c:"wskazanie"},
  {n:"Kremy na przebarwienia na twarzy",s:"/kremy-na-przebarwienia-na-twarzy",c:"wskazanie"},
  {n:"Kremy na przebarwienia po trądziku",s:"/kremy-na-przebarwienia-po-tradziku",c:"wskazanie"},
  {n:"Kremy z witaminą C na przebarwienia",s:"/kremy-z-witamina-c-na-przebarwienia",c:"wskazanie"},
  {n:"Kuracja przeciw przebarwieniom",s:"/kuracja-przeciw-przebarwieniom",c:"wskazanie"},
  {n:"Maseczki na przebarwienia",s:"/maseczki-na-przebarwienia",c:"wskazanie"},
  {n:"Peelingi na przebarwienia",s:"/peelingi-na-przebarwienia",c:"wskazanie"},
  {n:"Serum na przebarwienia",s:"/serum-na-przebarwienia",c:"wskazanie"},
  {n:"Serum na przebarwienia po trądziku",s:"/serum-na-przebarwienia-po-tradziku",c:"wskazanie"},
  {n:"Serum z witaminą C na przebarwienia",s:"/serum-z-witamina-c-na-przebarwienia",c:"wskazanie"},
  {n:"Toniki na przebarwienia",s:"/toniki-na-przebarwienia",c:"wskazanie"},
  {n:"Żele na przebarwienia",s:"/zele-na-przebarwienia",c:"wskazanie"},
  {n:"Relaksacja",s:"/relaksacja",c:"wskazanie"},
  {n:"Akcesoria relaksacyjne",s:"/akcesoria-relaksacyjne",c:"wskazanie"},
  {n:"Kąpiele relaksacyjne",s:"/kapiele-relaksacyjne",c:"wskazanie"},
  {n:"Olejki relaksacyjne",s:"/olejki-relaksacyjne",c:"wskazanie"},
  {n:"Relaks pod prysznicem",s:"/relaks-pod-prysznicem",c:"wskazanie"},
  {n:"Relaksacyjne olejki eteryczne",s:"/relaksacyjne-olejki-eteryczne",c:"wskazanie"},
  {n:"Świece relaksacyjne",s:"/swiece-relaksacyjne",c:"wskazanie"},
  {n:"Rogowacenie okołomieszkowe",s:"/rogowacenie-okolomieszkowe",c:"wskazanie"},
  {n:"Kremy na rogowacenie mieszkowe",s:"/kremy-na-rogowacenie-mieszkowe",c:"wskazanie"},
  {n:"Akcesoria na rogowacenie mieszkowe",s:"/akcesoria-na-rogowacenie-mieszkowe",c:"wskazanie"},
  {n:"Balsamy na rogowacenie mieszkowe",s:"/balsamy-na-rogowacenie-mieszkowe",c:"wskazanie"},
  {n:"Peelingi na rogowacenie mieszkowe",s:"/peelingi-na-rogowacenie-mieszkowe",c:"wskazanie"},
  {n:"Serum na rogowacenie mieszkowe",s:"/serum-na-rogowacenie-mieszkowe",c:"wskazanie"},
  {n:"Żele na rogowacenie mieszkowe",s:"/zele-na-rogowacenie-mieszkowe",c:"wskazanie"},
  {n:"Rozstępy",s:"/rozstepy",c:"wskazanie"},
  {n:"Olejki na rozstępy",s:"/olejki-na-rozstepy",c:"wskazanie"},
  {n:"Kremy na rozstępy w ciąży",s:"/kremy-na-rozstepy-w-ciazy",c:"wskazanie"},
  {n:"Kremy na rozstępy",s:"/kremy-na-rozstepy",c:"wskazanie"},
  {n:"Ampułki na rozstępy",s:"/ampulki-na-rozstepy",c:"wskazanie"},
  {n:"Balsamy na rozstępy",s:"/balsamy-na-rozstepy",c:"wskazanie"},
  {n:"Balsamy na rozstępy w ciąży",s:"/balsamy-na-rozstepy-w-ciazy",c:"wskazanie"},
  {n:"Derma roller na rozstępy",s:"/derma-roller-na-rozstepy",c:"wskazanie"},
  {n:"Kremy na rozstępy dla nastolatków",s:"/kremy-na-rozstepy-dla-nastolatkow",c:"wskazanie"},
  {n:"Kremy na rozstępy na piersiach",s:"/kremy-na-rozstepy-na-piersiach",c:"wskazanie"},
  {n:"Masła na rozstępy",s:"/masla-na-rozstepy",c:"wskazanie"},
  {n:"Mleczka na rozstępy",s:"/mleczka-na-rozstepy",c:"wskazanie"},
  {n:"Olejki na rozstępy w ciąży",s:"/olejki-na-rozstepy-w-ciazy",c:"wskazanie"},
  {n:"Peelingi na rozstępy",s:"/peelingi-na-rozstepy",c:"wskazanie"},
  {n:"Serum na rozstępy",s:"/serum-na-rozstepy",c:"wskazanie"},
  {n:"Żele na rozstępy",s:"/zele-na-rozstepy",c:"wskazanie"},
  {n:"Rozszerzone pory",s:"/rozszerzone-pory",c:"wskazanie"},
  {n:"Kremy na rozszerzone pory",s:"/kremy-na-rozszerzone-pory",c:"wskazanie"},
  {n:"Maseczki na rozszerzone pory",s:"/maseczki-na-rozszerzone-pory",c:"wskazanie"},
  {n:"Peelingi na rozszerzone pory",s:"/peelingi-na-rozszerzone-pory",c:"wskazanie"},
  {n:"Serum na rozszerzone pory",s:"/serum-na-rozszerzone-pory",c:"wskazanie"},
  {n:"Toniki na rozszerzone pory",s:"/toniki-na-rozszerzone-pory",c:"wskazanie"},
  {n:"Rumień/zaczerwienienie",s:"/rumien-zaczerwienienie",c:"wskazanie"},
  {n:"Ampułki na zaczerwienienie",s:"/ampulki-na-zaczerwienienie",c:"wskazanie"},
  {n:"Emulsje na zaczerwienienia",s:"/emulsje-na-zaczerwienienia",c:"wskazanie"},
  {n:"Emulsje łagodzące zaczerwienienia",s:"/emulsje-lagodzace-zaczerwienienia",c:"wskazanie"},
  {n:"Emulsje oczyszczające dla zaczerwienionej skóry",s:"/emulsje-oczyszczajace-dla-zaczerwienionej-skory",c:"wskazanie"},
  {n:"Kremy na rumień",s:"/kremy-na-rumien",c:"wskazanie"},
  {n:"Kuracje na zaczerwienienia",s:"/kuracje-na-zaczerwienienia",c:"wskazanie"},
  {n:"Makijaż na zaczerwienienia",s:"/makijaz-na-zaczerwienienia",c:"wskazanie"},
  {n:"Maseczki na rumień",s:"/maseczki-na-rumien",c:"wskazanie"},
  {n:"Mgiełki na zaczerwienienia",s:"/mgielki-na-zaczerwienienia",c:"wskazanie"},
  {n:"Olejki na zaczerwienienia",s:"/olejki-na-zaczerwienienia",c:"wskazanie"},
  {n:"Pianki na zaczerwienienia",s:"/pianki-na-zaczerwienienia",c:"wskazanie"},
  {n:"Serum na rumień",s:"/serum-na-rumien",c:"wskazanie"},
  {n:"Toniki na zaczerwienienia",s:"/toniki-na-zaczerwienienia",c:"wskazanie"},
  {n:"Suchość",s:"/suchosc",c:"wskazanie"},
  {n:"Ampułki nawilżające",s:"/ampulki-nawilzajace",c:"wskazanie"},
  {n:"Balsamy nawilżające",s:"/balsamy-nawilzajace",c:"wskazanie"},
  {n:"Emulsje nawilżające",s:"/emulsje-nawilzajace",c:"wskazanie"},
  {n:"Kremy nawilżające",s:"/kremy-nawilzajace",c:"wskazanie"},
  {n:"Maseczki nawilżające",s:"/maseczki-nawilzajace",c:"wskazanie"},
  {n:"Olejki nawilżające do twarzy",s:"/olejki-nawilzajace-do-twarzy",c:"wskazanie"},
  {n:"Serum nawilżające",s:"/serum-nawilzajace",c:"wskazanie"},
  {n:"Szampony nawilżające",s:"/szampony-nawilzajace",c:"wskazanie"},
  {n:"Toniki nawilżające",s:"/toniki-nawilzajace",c:"wskazanie"},
  {n:"Żele nawilżające",s:"/zele-nawilzajace",c:"wskazanie"},
  {n:"Świąd",s:"/swiad",c:"wskazanie"},
  {n:"Balsamy na swędzącą skórę",s:"/balsamy-na-swedzaca-skore",c:"wskazanie"},
  {n:"Emulsje na swędzenie skóry",s:"/emulsje-na-swedzenie-skory",c:"wskazanie"},
  {n:"Kremy na swędzenie skóry",s:"/kremy-na-swedzenie-skory",c:"wskazanie"},
  {n:"Maseczki na swędząca skórę",s:"/maseczki-na-swedzaca-skore",c:"wskazanie"},
  {n:"Serum na swędzenie skóry",s:"/serum-na-swedzenie-skory",c:"wskazanie"},
  {n:"Szampony na swędzącą skórę głowy",s:"/szampony-na-swedzaca-skore-glowy",c:"wskazanie"},
  {n:"Trądzik pospolity",s:"/tradzik-pospolity",c:"wskazanie"},
  {n:"Kremy na trądzik",s:"/kremy-na-tradzik",c:"wskazanie"},
  {n:"Krem na noc do cery trądzikowej",s:"/krem-na-noc-do-cery-tradzikowej",c:"wskazanie"},
  {n:"Kuracje przeciwtrądzikowe",s:"/kuracje-przeciwtradzikowe",c:"wskazanie"},
  {n:"Maseczki na trądzik",s:"/maseczki-na-tradzik",c:"wskazanie"},
  {n:"Mydła na trądzik",s:"/mydla-na-tradzik",c:"wskazanie"},
  {n:"Olejki na trądzik",s:"/olejki-na-tradzik",c:"wskazanie"},
  {n:"Peelingi na trądzik",s:"/peelingi-na-tradzik",c:"wskazanie"},
  {n:"Płyny na trądzik",s:"/plyny-na-tradzik",c:"wskazanie"},
  {n:"Serum na trądzik",s:"/serum-na-tradzik",c:"wskazanie"},
  {n:"Toniki do cery trądzikowej",s:"/toniki-do-cery-tradzikowej",c:"wskazanie"},
  {n:"Żele na trądzik",s:"/zele-na-tradzik",c:"wskazanie"},
  {n:"Trądzik różowaty",s:"/tradzik-rozowaty",c:"wskazanie"},
  {n:"Kremy na trądzik różowaty",s:"/kremy-na-tradzik-rozowaty",c:"wskazanie"},
  {n:"Maseczki na trądzik różowaty",s:"/maseczki-na-tradzik-rozowaty",c:"wskazanie"},
  {n:"Peelingi na trądzik różowaty",s:"/peelingi-na-tradzik-rozowaty",c:"wskazanie"},
  {n:"Serum na trądzik różowaty",s:"/serum-na-tradzik-rozowaty",c:"wskazanie"},
  {n:"Toniki na trądzik różowaty",s:"/toniki-na-tradzik-rozowaty",c:"wskazanie"},
  {n:"Żele na trądzik różowaty",s:"/zele-na-tradzik-rozowaty",c:"wskazanie"},
  {n:"Utrata blasku skóry",s:"/utrata-blasku-skory",c:"wskazanie"},
  {n:"Ampułki rozświetlające",s:"/ampulki-rozswietlajace",c:"wskazanie"},
  {n:"Balsamy rozświetlające",s:"/balsamy-rozswietlajace",c:"wskazanie"},
  {n:"Emulsje rozświetlające",s:"/emulsje-rozswietlajace",c:"wskazanie"},
  {n:"Kremy BB i CC rozświetlające",s:"/kremy-bb-i-cc-rozswietlajace",c:"wskazanie"},
  {n:"Kremy rozświetlające pod oczy",s:"/kremy-rozswietlajace-pod-oczy",c:"wskazanie"},
  {n:"Kuracje rozświetlające",s:"/kuracje-rozswietlajace",c:"wskazanie"},
  {n:"Bazy rozświetlające",s:"/bazy-rozswietlajace",c:"wskazanie"},
  {n:"Bronzery rozświetlające",s:"/bronzery-rozswietlajace",c:"wskazanie"},
  {n:"Korektory rozświetlające",s:"/korektory-rozswietlajace",c:"wskazanie"},
  {n:"Podkład rozświetlający",s:"/podklad-rozswietlajacy",c:"wskazanie"},
  {n:"Pudry rozświetlające",s:"/pudry-rozswietlajace",c:"wskazanie"},
  {n:"Róże rozświetlające",s:"/roze-rozswietlajace",c:"wskazanie"},
  {n:"Maseczki rozświetlające",s:"/maseczki-rozswietlajace",c:"wskazanie"},
  {n:"Mgiełki rozświetlające",s:"/mgielki-rozswietlajace",c:"wskazanie"},
  {n:"Odżywki dodające blasku",s:"/odzywki-dodajace-blasku",c:"wskazanie"},
  {n:"Olejki rozświetlające",s:"/olejki-rozswietlajace",c:"wskazanie"},
  {n:"Peelingi rozświetlające",s:"/peelingi-rozswietlajace",c:"wskazanie"},
  {n:"Pianki dodające blasku",s:"/pianki-dodajace-blasku",c:"wskazanie"},
  {n:"Płatki rozświetlające",s:"/platki-rozswietlajace",c:"wskazanie"},
  {n:"Serum rozświetlające",s:"/serum-rozswietlajace",c:"wskazanie"},
  {n:"Szampony dodające blasku",s:"/szampony-dodajace-blasku",c:"wskazanie"},
  {n:"Toniki rozświetlające",s:"/toniki-rozswietlajace",c:"wskazanie"},
  {n:"Żele rozświetlające",s:"/zele-rozswietlajace",c:"wskazanie"},
  {n:"Utrata jędrności",s:"/utrata-jedrnosci",c:"wskazanie"},
  {n:"Serum ujędrniające do twarzy",s:"/serum-ujedrniajace-do-twarzy",c:"wskazanie"},
  {n:"Akcesoria ujędrniające",s:"/akcesoria-ujedrniajace",c:"wskazanie"},
  {n:"Ampułki ujędrniające",s:"/ampulki-ujedrniajace",c:"wskazanie"},
  {n:"Balsamy ujędrniające",s:"/balsamy-ujedrniajace",c:"wskazanie"},
  {n:"Balsamy ujędrniające po porodzie",s:"/balsamy-ujedrniajace-po-porodzie",c:"wskazanie"},
  {n:"Emulsje ujędrniające",s:"/emulsje-ujedrniajace",c:"wskazanie"},
  {n:"Esencje ujędrniające",s:"/esencje-ujedrniajace",c:"wskazanie"},
  {n:"Kremy ujędrniające",s:"/kremy-ujedrniajace",c:"wskazanie"},
  {n:"Kremy ujędrniające do biustu",s:"/kremy-ujedrniajace-do-biustu",c:"wskazanie"},
  {n:"Kremy ujędrniające do twarzy",s:"/kremy-ujedrniajace-do-twarzy",c:"wskazanie"},
  {n:"Kremy ujędrniające po ciąży",s:"/kremy-ujedrniajace-po-ciazy",c:"wskazanie"},
  {n:"Kuracje ujędrniające",s:"/kuracje-ujedrniajace",c:"wskazanie"},
  {n:"Maski ujędrniające",s:"/maski-ujedrniajace",c:"wskazanie"},
  {n:"Maski ujędrniające do twarzy",s:"/maski-ujedrniajace-do-twarzy",c:"wskazanie"},
  {n:"Maski ujędrniające pod oczy",s:"/maski-ujedrniajace-pod-oczy",c:"wskazanie"},
  {n:"Masła ujędrniające",s:"/masla-ujedrniajace",c:"wskazanie"},
  {n:"Mgiełki ujędrniające",s:"/mgielki-ujedrniajace",c:"wskazanie"},
  {n:"Mleczka ujędrniające",s:"/mleczka-ujedrniajace",c:"wskazanie"},
  {n:"Olejki ujędrniające",s:"/olejki-ujedrniajace",c:"wskazanie"},
  {n:"Olejki ujędrniające do ciała",s:"/olejki-ujedrniajace-do-ciala",c:"wskazanie"},
  {n:"Olejki ujędrniające do twarzy",s:"/olejki-ujedrniajace-do-twarzy",c:"wskazanie"},
  {n:"Peelingi ujędrniające",s:"/peelingi-ujedrniajace",c:"wskazanie"},
  {n:"Płatki ujędrniające",s:"/platki-ujedrniajace",c:"wskazanie"},
  {n:"Serum ujędrniające",s:"/serum-ujedrniajace",c:"wskazanie"},
  {n:"Serum ujędrniające pod oczy",s:"/serum-ujedrniajace-pod-oczy",c:"wskazanie"},
  {n:"Toniki ujędrniające",s:"/toniki-ujedrniajace",c:"wskazanie"},
  {n:"Żele ujędrniające",s:"/zele-ujedrniajace",c:"wskazanie"},
  {n:"Żele ujędrniające do ciała",s:"/zele-ujedrniajace-do-ciala",c:"wskazanie"},
  {n:"Wągry i zaskórniki",s:"/wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Ampułki na wągry i zaskórniki",s:"/ampulki-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Emulsje na wągry i zaskórniki",s:"/emulsje-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Esencje na wągry i zaskórniki",s:"/esencje-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Kremy na wągry i zaskórniki",s:"/kremy-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Kuracje na wągry i zaskórniki",s:"/kuracje-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Maseczki na wągry i zaskórniki",s:"/maseczki-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Mydła na wągry i zaskórniki",s:"/mydla-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Olejki na wągry i zaskórniki",s:"/olejki-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Pasty na wągry i zaskórniki",s:"/pasty-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Peelingi na wągry i zaskórniki",s:"/peelingi-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Pianki na wągry i zaskórniki",s:"/pianki-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Płatki na wągry i zaskórniki",s:"/platki-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Płyny na wągry i zaskórniki",s:"/plyny-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Serum na wągry i zaskórniki",s:"/serum-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Toniki na wągry i zaskórniki",s:"/toniki-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Żele na wągry i zaskórniki",s:"/zele-na-wagry-i-zaskorniki",c:"wskazanie"},
  {n:"Wyszczuplanie",s:"/wyszczuplanie",c:"wskazanie"},
  {n:"Akcesoria wyszczuplające",s:"/akcesoria-wyszczuplajace",c:"wskazanie"},
  {n:"Balsamy wyszczuplające",s:"/balsamy-wyszczuplajace",c:"wskazanie"},
  {n:"Emulsje wyszczuplające",s:"/emulsje-wyszczuplajace",c:"wskazanie"},
  {n:"Kremy wyszczuplające",s:"/kremy-wyszczuplajace",c:"wskazanie"},
  {n:"Kuracje wyszczuplające",s:"/kuracje-wyszczuplajace",c:"wskazanie"},
  {n:"Maski wyszczuplające",s:"/maski-wyszczuplajace",c:"wskazanie"},
  {n:"Olejki wyszczuplające",s:"/olejki-wyszczuplajace",c:"wskazanie"},
  {n:"Serum wyszczuplające",s:"/serum-wyszczuplajace",c:"wskazanie"},
  {n:"Żele wyszczuplające",s:"/zele-wyszczuplajace",c:"wskazanie"},
  {n:"Home care",s:"/home-care",c:"wskazanie"},
  {n:"Zabiegi domowe na ciało",s:"/zabiegi-domowe-na-cialo",c:"wskazanie"},
  {n:"Zabiegi domowe na dłonie",s:"/zabiegi-domowe-na-dlonie",c:"wskazanie"},
  {n:"Zabiegi domowe na okolice oczu",s:"/zabiegi-domowe-na-okolice-oczu",c:"wskazanie"},
  {n:"Zabiegi domowe na skórę głowy",s:"/zabiegi-domowe-na-skore-glowy",c:"wskazanie"},
  {n:"Zabiegi domowe na stopy",s:"/zabiegi-domowe-na-stopy",c:"wskazanie"},
  {n:"Zabiegi domowe na szyję i dekolt",s:"/zabiegi-domowe-na-szyje-i-dekolt",c:"wskazanie"},
  {n:"Zabiegi domowe na twarz",s:"/zabiegi-domowe-na-twarz",c:"wskazanie"},
  {n:"Zabiegi domowe na usta",s:"/zabiegi-domowe-na-usta",c:"wskazanie"},
  {n:"Zabiegi domowe na włosy",s:"/zabiegi-domowe-na-wlosy",c:"wskazanie"},
  {n:"Zaburzony owal twarzy",s:"/zaburzony-owal-twarzy",c:"wskazanie"},
  {n:"Akcesoria poprawiające owal twarzy",s:"/akcesoria-poprawiajace-owal-twarzy",c:"wskazanie"},
  {n:"Ampułki poprawiające owal twarzy",s:"/ampulki-poprawiajace-owal-twarzy",c:"wskazanie"},
  {n:"Emulsje poprawiające owal twarzy",s:"/emulsje-poprawiajace-owal-twarzy",c:"wskazanie"},
  {n:"Esencje poprawiające owal twarzy",s:"/esencje-poprawiajace-owal-twarzy",c:"wskazanie"},
  {n:"Kremy poprawiające owal twarzy",s:"/kremy-poprawiajace-owal-twarzy",c:"wskazanie"},
  {n:"Kuracje poprawiające owal twarzy",s:"/kuracje-poprawiajace-owal-twarzy",c:"wskazanie"},
  {n:"Maski poprawiające owal twarzy",s:"/maski-poprawiajace-owal-twarzy",c:"wskazanie"},
  {n:"Olejki poprawiające owal twarzy",s:"/olejki-poprawiajace-owal-twarzy",c:"wskazanie"},
  {n:"Peelingi poprawiające owal twarzy",s:"/peelingi-poprawiajace-owal-twarzy",c:"wskazanie"},
  {n:"Serum poprawiające owal twarzy",s:"/serum-poprawiajace-owal-twarzy",c:"wskazanie"},
  {n:"Żele poprawiające owal twarzy",s:"/zele-poprawiajace-owal-twarzy",c:"wskazanie"},
  {n:"Zmarszczki",s:"/zmarszczki",c:"wskazanie"},
  {n:"Akcesoria na zmarszczki",s:"/akcesoria-na-zmarszczki",c:"wskazanie"},
  {n:"Ampułki na zmarszczki",s:"/ampulki-na-zmarszczki",c:"wskazanie"},
  {n:"Balsamy przeciwzmarszczkowe",s:"/balsamy-przeciwzmarszczkowe",c:"wskazanie"},
  {n:"Emulsje przeciwzmarszczkowe",s:"/emulsje-przeciwzmarszczkowe",c:"wskazanie"},
  {n:"Esencje przeciwzmarszczkowe",s:"/esencje-przeciwzmarszczkowe",c:"wskazanie"},
  {n:"Kremy na zmarszczki dla mężczyzn",s:"/kremy-na-zmarszczki-dla-mezczyzn",c:"wskazanie"},
  {n:"Kremy pod oczy przeciwzmarszczkowe",s:"/kremy-pod-oczy-przeciwzmarszczkowe",c:"wskazanie"},
  {n:"Kremy przeciwzmarszczkowe na noc",s:"/kremy-przeciwzmarszczkowe-na-noc",c:"wskazanie"},
  {n:"Kuracje przeciwzmarszczkowe",s:"/kuracje-przeciwzmarszczkowe",c:"wskazanie"},
  {n:"Makijaż na zmarszczki",s:"/makijaz-na-zmarszczki",c:"wskazanie"},
  {n:"Maseczki na zmarszczki",s:"/maseczki-na-zmarszczki",c:"wskazanie"},
  {n:"Mgiełki przeciwzmarszczkowe",s:"/mgielki-przeciwzmarszczkowe",c:"wskazanie"},
  {n:"Olejki na zmarszczki",s:"/olejki-na-zmarszczki",c:"wskazanie"},
  {n:"Peelingi przeciwzmarszczkowe",s:"/peelingi-przeciwzmarszczkowe",c:"wskazanie"},
  {n:"Płatki pod oczy przeciwzmarszczkowe",s:"/platki-pod-oczy-przeciwzmarszczkowe",c:"wskazanie"},
  {n:"Serum przeciwzmarszczkowe do twarzy",s:"/serum-przeciwzmarszczkowe-do-twarzy",c:"wskazanie"},
  {n:"Serum przeciwzmarszczkowe pod oczy",s:"/serum-przeciwzmarszczkowe-pod-oczy",c:"wskazanie"},
  {n:"Toniki przeciwzmarszczkowe",s:"/toniki-przeciwzmarszczkowe",c:"wskazanie"},
  {n:"Żele przeciwzmarszczkowe",s:"/zele-przeciwzmarszczkowe",c:"wskazanie"},
  {n:"Makijaż",s:"/makijaz",c:"makijaz"},
  {n:"Akcesoria do makijażu",s:"/akcesoria-do-makijazu",c:"makijaz"},
  {n:"Pędzle do makijażu",s:"/pedzle-do-makijazu",c:"makijaz"},
  {n:"Gąbka do makijażu",s:"/gabka-do-makijazu",c:"makijaz"},
  {n:"Akcesoria do brwi",s:"/akcesoria-do-brwi",c:"makijaz"},
  {n:"Pędzle do ust",s:"/pedzle-do-ust",c:"makijaz"},
  {n:"Konturowanie",s:"/konturowanie",c:"makijaz"},
  {n:"Róże do policzków",s:"/roze-do-policzkow",c:"makijaz"},
  {n:"Bronzery do twarzy",s:"/bronzery-do-twarzy",c:"makijaz"},
  {n:"Pędzle do konturowania",s:"/pedzle-do-konturowania",c:"makijaz"},
  {n:"Rozświetlacze do twarzy",s:"/rozswietlacze-do-twarzy",c:"makijaz"},
  {n:"Sztyft do konturowania",s:"/sztyft-do-konturowania",c:"makijaz"},
  {n:"Kosmetyki mineralne",s:"/kosmetyki-mineralne",c:"makijaz"},
  {n:"Bronzery mineralne",s:"/bronzery-mineralne",c:"makijaz"},
  {n:"Cienie mineralne",s:"/cienie-mineralne",c:"makijaz"},
  {n:"Korektory mineralne",s:"/korektory-mineralne",c:"makijaz"},
  {n:"Podkłady mineralne",s:"/podklady-mineralne",c:"makijaz"},
  {n:"Pudry mineralne",s:"/pudry-mineralne",c:"makijaz"},
  {n:"Rozświetlacze mineralne",s:"/rozswietlacze-mineralne",c:"makijaz"},
  {n:"Róże mineralne",s:"/roze-mineralne",c:"makijaz"},
  {n:"Makijaż brwi",s:"/makijaz-brwi",c:"makijaz"},
  {n:"Żele do brwi",s:"/zele-do-brwi",c:"makijaz"},
  {n:"Kredki do brwi",s:"/kredki-do-brwi",c:"makijaz"},
  {n:"Mydło do brwi",s:"/mydlo-do-brwi",c:"makijaz"},
  {n:"Pędzel do brwi",s:"/pedzel-do-brwi",c:"makijaz"},
  {n:"Pomady do brwi",s:"/pomady-do-brwi",c:"makijaz"},
  {n:"Makijaż oczu",s:"/makijaz-oczu",c:"makijaz"},
  {n:"Kredki do oczu",s:"/kredki-do-oczu",c:"makijaz"},
  {n:"Korektor pod oczy",s:"/korektor-pod-oczy",c:"makijaz"},
  {n:"Eyelinery",s:"/eyelinery",c:"makijaz"},
  {n:"Cienie do powiek",s:"/cienie-do-powiek",c:"makijaz"},
  {n:"Bazy pod cienie do powiek",s:"/bazy-pod-cienie-do-powiek",c:"makijaz"},
  {n:"Kamuflaż pod oczy",s:"/kamuflaz-pod-oczy",c:"makijaz"},
  {n:"Palety cieni do powiek",s:"/palety-cieni-do-powiek",c:"makijaz"},
  {n:"Pędzle do makijażu oczu",s:"/pedzle-do-makijazu-oczu",c:"makijaz"},
  {n:"Makijaż rzęs",s:"/makijaz-rzes",c:"makijaz"},
  {n:"Tusze do rzęs",s:"/tusze-do-rzes",c:"makijaz"},
  {n:"Bazy do rzęs",s:"/bazy-do-rzes",c:"makijaz"},
  {n:"Makijaż twarzy",s:"/makijaz-twarzy",c:"makijaz"},
  {n:"Podkłady do twarzy",s:"/podklady-do-twarzy",c:"makijaz"},
  {n:"Kremy koloryzujące do twarzy BB i CC",s:"/kremy-koloryzujace-do-twarzy-bb-i-cc",c:"makijaz"},
  {n:"Bazy pod makijaż",s:"/bazy-pod-makijaz",c:"makijaz"},
  {n:"Korektory do twarzy",s:"/korektory-do-twarzy",c:"makijaz"},
  {n:"Pudry do twarzy",s:"/pudry-do-twarzy",c:"makijaz"},
  {n:"Utrwalacze do makijażu",s:"/utrwalacze-do-makijazu",c:"makijaz"},
  {n:"Makijaż ust",s:"/makijaz-ust",c:"makijaz"},
  {n:"Kredki do ust",s:"/kredki-do-ust",c:"makijaz"},
  {n:"Konturówki do ust",s:"/konturowki-do-ust",c:"makijaz"},
  {n:"Błyszczyki do ust",s:"/blyszczyki-do-ust",c:"makijaz"},
  {n:"Pomadki i szminki do ust",s:"/pomadki-i-szminki-do-ust",c:"makijaz"},
  {n:"Zestawy do makijażu",s:"/zestawy-do-makijazu",c:"makijaz"},
  {n:"Zestawy do stylizacji brwi",s:"/zestawy-do-stylizacji-brwi",c:"makijaz"},
  {n:"Zestawy do stylizacji rzęs",s:"/zestawy-do-stylizacji-rzes",c:"makijaz"},
  {n:"Zestawy pędzli do makijażu",s:"/zestawy-pedzli-do-makijazu",c:"makijaz"},
  {n:"Kategorie",s:"/kategorie",c:"kategorie"},
  {n:"Akcesoria do włosów",s:"/akcesoria-do-wlosow",c:"kategorie"},
  {n:"Gumki do włosów",s:"/gumki-do-wlosow",c:"kategorie"},
  {n:"Spinki do włosów",s:"/spinki-do-wlosow",c:"kategorie"},
  {n:"Szczotki do włosów",s:"/szczotki-do-wlosow",c:"kategorie"},
  {n:"Turbany do włosów",s:"/turbany-do-wlosow",c:"kategorie"},
  {n:"Kosmetyki do kąpieli",s:"/kosmetyki-do-kapieli",c:"kategorie"},
  {n:"Akcesoria do kąpieli",s:"/akcesoria-do-kapieli",c:"kategorie"},
  {n:"Glinki do kąpieli",s:"/glinki-do-kapieli",c:"kategorie"},
  {n:"Kule musujące do kąpieli",s:"/kule-musujace-do-kapieli",c:"kategorie"},
  {n:"Mydła do kąpieli",s:"/mydla-do-kapieli",c:"kategorie"},
  {n:"Olejki do kąpieli",s:"/olejki-do-kapieli",c:"kategorie"},
  {n:"Olejki eteryczne do kąpieli",s:"/olejki-eteryczne-do-kapieli",c:"kategorie"},
  {n:"Płyny do kąpieli",s:"/plyny-do-kapieli",c:"kategorie"},
  {n:"Sole do kąpieli",s:"/sole-do-kapieli",c:"kategorie"},
  {n:"Żele do kąpieli",s:"/zele-do-kapieli",c:"kategorie"},
  {n:"Akcesoria i dodatki",s:"/akcesoria-i-dodatki",c:"kategorie"},
  {n:"Balsam po goleniu",s:"/balsam-po-goleniu",c:"kategorie"},
  {n:"Depilacja/golenie",s:"/depilacja-golenie",c:"kategorie"},
  {n:"Domowe SPA",s:"/domowe-spa",c:"kategorie"},
  {n:"Domowe urządzenia pielęgnacyjne",s:"/domowe-urzadzenia-pielegnacyjne",c:"kategorie"},
  {n:"Kosmetyki do opalania",s:"/kosmetyki-do-opalania",c:"kategorie"},
  {n:"Samoopalacze",s:"/samoopalacze",c:"kategorie"},
  {n:"Balsamy brązujące",s:"/balsamy-brazujace",c:"kategorie"},
  {n:"Pianka samoopalająca",s:"/pianka-samoopalajaca",c:"kategorie"},
  {n:"Rękawice do samoopalacza",s:"/rekawice-do-samoopalacza",c:"kategorie"},
  {n:"Dla kogo",s:"/dla-kogo",c:"dla_kogo"},
  {n:"Dla kobiety i mężczyzny",s:"/dla-kobiety-i-mezczyzny",c:"dla_kogo"},
  {n:"Dzieci",s:"/dzieci",c:"dla_kogo"},
  {n:"Kobiety",s:"/kobiety",c:"dla_kogo"},
  {n:"Kobiety w ciąży lub karmiące",s:"/kobiety-w-ciazy-lub-karmiace",c:"dla_kogo"},
  {n:"Balsamy dla kobiet w ciąży",s:"/balsamy-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Kremy dla kobiet w ciąży",s:"/kremy-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Kremy do biustu dla kobiet w ciąży",s:"/kremy-do-biustu-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Kremy do twarzy dla kobiet w ciąży",s:"/kremy-do-twarzy-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Kremy na brzuch dla kobiet w ciąży",s:"/kremy-na-brzuch-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Kremy pod oczy dla kobiet w ciąży",s:"/kremy-pod-oczy-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Maseczki na twarz dla kobiet w ciąży",s:"/maseczki-na-twarz-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Olejki dla kobiet w ciąży",s:"/olejki-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Płyny do higieny intymnej w ciąży i po porodzie",s:"/plyny-do-higieny-intymnej-w-ciazy-i-po-porodzie",c:"dla_kogo"},
  {n:"Serum dla kobiet w ciąży",s:"/serum-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Szampony dla kobiet w ciąży",s:"/szampony-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Toniki dla kobiet w ciąży",s:"/toniki-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Żele do mycia twarzy dla kobiet w ciąży",s:"/zele-do-mycia-twarzy-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Żele na obrzęki nóg dla kobiet w ciąży",s:"/zele-na-obrzeki-nog-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Żele pod prysznic dla kobiet w ciąży",s:"/zele-pod-prysznic-dla-kobiet-w-ciazy",c:"dla_kogo"},
  {n:"Mężczyżni",s:"/mezczyzni",c:"dla_kogo"},
  {n:"Kremy na dzień dla mężczyzn",s:"/kremy-na-dzien-dla-mezczyzn",c:"dla_kogo"},
  {n:"Krem na noc dla mężczyzn",s:"/krem-na-noc-dla-mezczyzn",c:"dla_kogo"},
  {n:"Serum dla mężczyzn",s:"/serum-dla-mezczyzn",c:"dla_kogo"},
  {n:"Żele do higieny intymnej dla mężczyzn",s:"/zele-do-higieny-intymnej-dla-mezczyzn",c:"dla_kogo"},
  {n:"Żele do mycia twarzy dla mężczyzn",s:"/zele-do-mycia-twarzy-dla-mezczyzn",c:"dla_kogo"},
  {n:"Żele pod prysznic dla mężczyzn",s:"/zele-pod-prysznic-dla-mezczyzn",c:"dla_kogo"},
  {n:"Nastolatkowie",s:"/nastolatkowie",c:"dla_kogo"}
];

const VALID_SLUGS = new Set(CATEGORIES.map(c => c.s));
const CATS_LIST_TEXT = CATEGORIES.map(c => `${c.n} | ${c.s}`).join("\n"); // fallback only — used when classifier fails

// === CONTAINER METADATA ===
// 8 top-level branches from Akeneo "Drzewo kategorii Lemone nowe" — used by classifier (multi-label).
// Order matters for prompt readability (most common first).
const CONTAINERS = [
  { id: "pielegnacja",         label: "Pielęgnacja",         desc: "codzienna pielęgnacja skóry/włosów/ciała/ust — kremy, sera, mleczka, balsamy, peelingi, oleje, maski; kategorie typu 'Krem do twarzy na noc', 'Serum do ust', 'Mleczko do ciała'" },
  { id: "wskazanie",           label: "Wskazanie",           desc: "produkt nakierowany na konkretny problem — trądzik, zmarszczki, AZS, łuszczyca, wypadanie włosów, menopauza, blizny, cienie pod oczami, przebarwienia, cellulit" },
  { id: "kosmetyki_naturalne", label: "Kosmetyki naturalne", desc: "clean / natural beauty — ekologiczne, wegańskie, retinol naturalny, witamina C, kosmetyki bez parabenów; nie konfundować ze zwykłą pielęgnacją" },
  { id: "suplementy",          label: "Suplementy diety",    desc: "produkty do spożycia — witaminy, minerały, kapsułki, tabletki, formuły bioaktywne, syropy, krople, fitoterapia" },
  { id: "makijaz",             label: "Makijaż",             desc: "kolorówka — podkład, korektor, puder, róż, pomadka, szminka, błyszczyk, tusz do rzęs, eyeliner, cienie, kredka, akcesoria do makijażu" },
  { id: "dla_kogo",            label: "Dla kogo",            desc: "produkty wyraźnie targetowane na grupę — dzieci, kobiety w ciąży / karmiące, mężczyźni, nastolatki" },
  { id: "kategorie",           label: "Kategorie",           desc: "akcesoria i SPA — szczotki, masażery, urządzenia, kosmetyki do kąpieli, opalanie, akcesoria do włosów, dodatki" },
  { id: "dermokosmetyki",      label: "Dermokosmetyki",      desc: "linie dermo / apteczne / lecznicze — szczególnie do skóry wrażliwej, atopowej, trądzikowej, naczynkowej, podkłady i kremy BB dermokosmetyczne" }
];
const CONTAINER_IDS = new Set(CONTAINERS.map(c => c.id));

// Pre-bucketed lookup for fast filtering: containerId → array of {n, s, c}
const CATEGORIES_BY_CONTAINER = (() => {
  const m = {};
  for (const id of CONTAINER_IDS) m[id] = [];
  for (const cat of CATEGORIES) {
    if (m[cat.c]) m[cat.c].push(cat);
  }
  return m;
})();

// Returns concatenated, deduped category list for a set of container IDs.
// Falls back to ALL categories when input is empty/invalid (safety net).
function getCategoriesForContainers(containers) {
  if (!Array.isArray(containers) || containers.length === 0) return CATEGORIES;
  const set = new Set();
  const out = [];
  for (const c of containers) {
    for (const cat of (CATEGORIES_BY_CONTAINER[c] || [])) {
      if (!set.has(cat.s)) {
        set.add(cat.s);
        out.push(cat);
      }
    }
  }
  return out.length > 0 ? out : CATEGORIES;
}

// === HTML PARSER ===
const PRODUCT_URL_RE = /^\/p-.+\.html$/;

function parseProducts(input) {
  const html = (input || "").trim();
  if (!html) return [];

  const doc = new DOMParser().parseFromString(html, "text/html");
  const allLinks = Array.from(doc.querySelectorAll("a[href]"));
  const productLinks = allLinks.filter(a => PRODUCT_URL_RE.test(a.getAttribute("href")));

  if (productLinks.length === 0) return [];

  const order = [];
  const byUrl = new Map();
  for (const link of productLinks) {
    const url = link.getAttribute("href");
    if (!byUrl.has(url)) { byUrl.set(url, []); order.push(url); }
    byUrl.get(url).push(link);
  }

  const products = [];
  for (const url of order) {
    const links = byUrl.get(url);
    let name = "";
    let subtitle = "";
    let imageUrl = "";

    for (const l of links) {
      const strong = l.querySelector("strong");
      if (strong) {
        const t = strong.textContent.replace(/\s+/g, " ").trim();
        if (t.length > name.length) name = t;
      }
    }
    if (!name) {
      for (const l of links) {
        const t = l.textContent.replace(/\s+/g, " ").trim();
        if (t && !l.querySelector("img") && t.length > name.length) name = t;
      }
    }
    if (!name) continue;

    for (const l of links) {
      const sub = l.querySelector(".subtitle, span.subtitle");
      if (sub) {
        const t = sub.textContent.replace(/\s+/g, " ").trim();
        if (t && t !== name) { subtitle = t; break; }
      }
    }

    for (const l of links) {
      const img = l.querySelector("img");
      if (img) { imageUrl = img.getAttribute("src") || ""; break; }
    }

    products.push({ url, name, subtitle, imageUrl, description: "" });
  }

  const fullText = doc.body.textContent.replace(/\s+/g, " ").trim();
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const startIdx = fullText.indexOf(p.name);
    if (startIdx < 0) continue;
    let endIdx = fullText.length;
    if (i + 1 < products.length) {
      const next = fullText.indexOf(products[i + 1].name, startIdx + p.name.length);
      if (next > 0) endIdx = next;
    }
    p.description = fullText.slice(startIdx, endIdx).slice(0, 2000).trim();
  }

  return products;
}

// === TOC EXTRACTOR ===
function extractTocItems(input) {
  const html = (input || "").trim();
  if (!html) return [];

  const doc = new DOMParser().parseFromString(html, "text/html");
  const items = [];
  const seen = new Set();

  // H2s in document order — these are the main article sections
  const h2s = Array.from(doc.querySelectorAll("h2"));
  for (const h2 of h2s) {
    const text = h2.textContent.replace(/\s+/g, " ").trim();
    if (!text || seen.has(text)) continue;
    // Skip the FAQ wrapper heading (its summaries become items themselves)
    if (/najczęstsze pytania|faq/i.test(text)) continue;
    items.push(text);
    seen.add(text);
  }

  // FAQ summaries from <details><summary>
  const summaries = Array.from(doc.querySelectorAll("details summary, summary"));
  for (const sum of summaries) {
    const clone = sum.cloneNode(true);
    // Strip toggle indicators (typically last <span> with + / -)
    const spans = clone.querySelectorAll("span");
    for (const sp of spans) {
      const t = sp.textContent.trim();
      if (/^[+\-]$/.test(t)) sp.remove();
    }
    const text = clone.textContent.replace(/\s+/g, " ").trim();
    if (!text || seen.has(text)) continue;
    items.push(text);
    seen.add(text);
  }

  return items;
}

function buildTocHTML(items) {
  const filtered = (items || []).map(s => (s || "").trim()).filter(Boolean);
  if (filtered.length === 0) return "";

  const itemsHtml = filtered.map((q, i) => {
    const isLast = i === filtered.length - 1;
    const style = isLast
      ? "margin:0;color:#3a4a3a;line-height:1.5;"
      : "margin:0 0 12px;padding:0 0 12px;border-bottom:1px solid #dce8dc;color:#3a4a3a;line-height:1.5;";
    const id = slugifyToId(q);
    // Wewnętrzny link kotwicowy. color:inherit + text-decoration:underline żeby było widać że klikalne,
    // ale w kolorze TOC, nie domyślnym niebieskim brand-shopu. cursor:pointer redundant ale defensywnie.
    const inner = id
      ? `<a href="#${id}" style="color:inherit;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;cursor:pointer;">${escapeHtml(q)}</a>`
      : escapeHtml(q);
    return `            <p style="${style}">\n                ${inner}\n            </p>`;
  }).join("\n");

  return `<div style="background-color:#f4f8f4;border-radius:12px;border:1px solid #dce8dc;margin:25px 0;padding:24px 28px;">
            <h3 style="margin:0 0 18px;font-size:17px;color:#2d4a2d;font-weight:600;letter-spacing:0.2px;">
                Czego dowiesz się w tym artykule
            </h3>
${itemsHtml}
        </div>`;
}

// Generates an HTML-safe id from Polish text. Used for both TOC anchors and the H2/summary id targets.
// Prefix "sec-" zapobiega kolizji z innymi id na stronie (np. "kontakt", "navbar" itd.).
function slugifyToId(text) {
  if (!text) return "";
  const PL_MAP = {ą:'a',ć:'c',ę:'e',ł:'l',ń:'n',ó:'o',ś:'s',ź:'z',ż:'z',Ą:'A',Ć:'C',Ę:'E',Ł:'L',Ń:'N',Ó:'O',Ś:'S',Ź:'Z',Ż:'Z'};
  const t = String(text).split("").map(ch => PL_MAP[ch] || ch).join("");
  const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug ? `sec-${slug}` : "";
}

// === FULL ARTICLE ASSEMBLER ===
function buildCompleteArticle(originalHtml, products, boxes, tocItems) {
  if (!originalHtml || !originalHtml.trim()) return "";

  const doc = new DOMParser().parseFromString(originalHtml, "text/html");

  // 1. Remove any existing TOC blocks (avoids double-TOC after enhancement)
  const tocCandidates = Array.from(doc.querySelectorAll("h3, p strong"));
  for (const el of tocCandidates) {
    const text = (el.textContent || "").toLowerCase();
    if (text.includes("czego dowiesz się") || text.includes("szybka nawigacja")) {
      const container = el.closest("div");
      if (container && container !== doc.body && container.children.length < 30) {
        container.remove();
      }
    }
  }

  // 2. Nadaj id wszystkim H2 i summary (cel kotwic z TOC). Robimy to PRZED wstawieniem TOC,
  // żeby TOC mógł się do nich linkować. Duplikaty rozstrzygane suffixem -2, -3...
  const usedIds = new Set();
  const headingsForIds = doc.querySelectorAll("h2, summary");
  for (const h of headingsForIds) {
    if (h.getAttribute("id")) {
      usedIds.add(h.getAttribute("id"));
      continue;
    }
    const text = (h.textContent || "").replace(/\s+/g, " ").trim();
    const baseId = slugifyToId(text);
    if (!baseId) continue;
    let unique = baseId;
    let n = 2;
    while (usedIds.has(unique)) { unique = `${baseId}-${n}`; n++; }
    usedIds.add(unique);
    h.setAttribute("id", unique);
  }

  // 3. Insert new TOC right before first H2
  const firstH2 = doc.querySelector("h2");
  const tocHtml = buildTocHTML(tocItems);
  if (firstH2 && tocHtml) {
    const tmp = doc.createElement("div");
    tmp.innerHTML = tocHtml;
    if (tmp.firstElementChild) {
      firstH2.parentNode.insertBefore(tmp.firstElementChild, firstH2);
    }
  }

  // 4. TRANSFORMACJA struktury obrazków: <p><a><strong>?<img></strong>?</a></p> → <figure class="image"><a><img></a></figure>
  // To wzorzec który działa na sklep.lemone.pl (potwierdzone na produkcyjnym artykule z Dermaquest).
  // CSS sklepu rozciąga <img> w <p> na 100% szerokości, ale honoruje max-width:400px na <img> w <figure class="image">.
  // Walka z CSS przez !important nie działa — różnica jest w opakowaniu, nie w stylu.
  const allParas = Array.from(doc.querySelectorAll("p"));
  for (const p of allParas) {
    const link = p.querySelector("a");
    if (!link) continue;
    const href = link.getAttribute("href") || "";
    if (!PRODUCT_URL_RE.test(href)) continue;
    const img = link.querySelector("img");
    if (!img) continue;
    // Tylko jeśli paragraf zawiera WYŁĄCZNIE obrazek (i ewentualnie whitespace)
    if (p.textContent.replace(/\s+/g, "") !== "") continue;

    // Buduj <figure class="image" style="height:auto;"><a href="..."><img style="..." src="..." alt="..." width="400"></a></figure>
    const figure = doc.createElement("figure");
    figure.setAttribute("class", "image");
    figure.setAttribute("style", "height:auto;");

    const newA = doc.createElement("a");
    newA.setAttribute("href", href);

    const newImg = doc.createElement("img");
    newImg.setAttribute("src", img.getAttribute("src") || "");
    if (img.getAttribute("alt")) newImg.setAttribute("alt", img.getAttribute("alt"));
    newImg.setAttribute("width", "400");
    newImg.setAttribute("style", "display:block;max-width:400px;");

    newA.appendChild(newImg);
    figure.appendChild(newA);
    p.replaceWith(figure);
  }

  // 5. Wyczyść WSZYSTKIE istniejące żółte boxy z poprzednich generacji.
  // Robimy to najpierw, niezależnie od `wrapper` — wcześniejsza logika zostawiała stare boxy
  // gdy struktura była zagnieżdżona i `closest("div.product")` zwracał innego "rodzica".
  const oldBoxes = Array.from(doc.querySelectorAll("div[style]")).filter(el =>
    /background-color:\s*#fff8e6/i.test(el.getAttribute("style") || "")
  );
  for (const oldBox of oldBoxes) oldBox.remove();

  // 6. Dla każdego produktu — znajdź najlepszy "anchor" do wstawienia boxa.
  // Priorytet: <p> z <img> linku produktu → <figure> linku produktu → <p> z linkiem tytułowym → fallback.
  // Działa zarówno dla zagnieżdżonej struktury Roberta (img w <p><a>...</a></p>)
  // jak i dla klasycznych artykułów z <figure class="image">.
  for (const product of products) {
    const box = boxes[product.url];
    if (!box || box.status !== "ready") continue;

    const newBoxHtml = buildBoxOnly({
      forWho: box.forWho,
      whyWorth: box.whyWorth,
      related: box.related
    });
    const tmp = doc.createElement("div");
    tmp.innerHTML = newBoxHtml;
    const newBox = tmp.firstElementChild;
    if (!newBox) continue;

    // Wszystkie linki do tego konkretnego produktu w całym dokumencie.
    // (Inne produkty mają inne URL-e, więc to nie złapie zagnieżdżonych.)
    const productLinks = Array.from(doc.querySelectorAll(`a[href="${CSS.escape(product.url)}"]`));
    if (productLinks.length === 0) continue;

    let anchor = null; // element po którym wstawimy box

    // Priorytet 1: <p> zawierający <a><img>...</a></p> dla tego produktu
    for (const link of productLinks) {
      if (link.querySelector("img")) {
        anchor = link.closest("p") || link.closest("figure") || link.parentElement;
        if (anchor) break;
      }
    }

    // Priorytet 2: <figure> zawierający link do tego produktu (stary format z <figure class="image">)
    if (!anchor) {
      for (const link of productLinks) {
        const fig = link.closest("figure");
        if (fig) { anchor = fig; break; }
      }
    }

    // Priorytet 3: <p> zawierający link do tego produktu (paragraf tytułowy z nazwą)
    if (!anchor) {
      for (const link of productLinks) {
        const p = link.closest("p");
        if (p) { anchor = p; break; }
      }
    }

    // Wstaw box po anchorze. Jeśli żaden nie znaleziony — last resort: po pierwszym linku produktu.
    if (anchor) {
      anchor.after(newBox);
    } else {
      productLinks[0].after(newBox);
    }
  }

  return doc.body.innerHTML;
}

// === LINK VALIDATOR ===
const LINK_CHECK_URL = import.meta.env.VITE_LINK_CHECK_URL || "https://lemone-api.r-tomala.workers.dev/check-link";
const SHOP_HOSTNAME = "sklep.lemone.pl";

// Extract all relative non-product links from article HTML.
// Returns deduped list: [{url, text, count, localStatus}]
// - skips /p-XXX.html (product pages)
// - skips mailto:, tel:, #anchors, external hosts
// - normalizes absolute sklep.lemone.pl URLs to relative
function extractArticleLinks(html) {
  if (!html) return [];
  const doc = new DOMParser().parseFromString(html, "text/html");
  const map = new Map();

  for (const a of Array.from(doc.querySelectorAll("a[href]"))) {
    const raw = (a.getAttribute("href") || "").trim();
    if (!raw) continue;
    if (PRODUCT_URL_RE.test(raw)) continue;
    if (raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) continue;

    let path = raw;
    if (/^https?:\/\//i.test(path)) {
      try {
        const u = new URL(path);
        if (u.hostname !== SHOP_HOSTNAME) continue;
        path = u.pathname + u.search + u.hash;
      } catch (_) {
        continue;
      }
    }
    if (!path.startsWith("/")) continue;

    // Canonical slug = path without query/hash, trailing slash stripped (but keep "/" itself)
    const slug = path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
    if (slug === "/" || PRODUCT_URL_RE.test(slug)) continue;

    if (!map.has(slug)) {
      const text = (a.textContent || "").replace(/\s+/g, " ").trim();
      map.set(slug, {
        url: slug,
        text: text || slug,
        count: 1,
        localStatus: VALID_SLUGS.has(slug) ? "local-ok" : "local-missing"
      });
    } else {
      map.get(slug).count += 1;
    }
  }

  return Array.from(map.values()).sort((a, b) => a.url.localeCompare(b.url));
}

// POST list of slugs to Worker /check-link endpoint, which performs HEAD requests
// to https://sklep.lemone.pl<slug> server-side (no CORS issue).
// Expected response: { results: [{ url, status, ok }, ...] }
async function checkLinksLive(urls) {
  if (!urls || urls.length === 0) return {};
  const response = await fetch(LINK_CHECK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls })
  });
  if (!response.ok) {
    throw new Error(`Link check API ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  const out = {};
  for (const r of (data.results || [])) {
    if (r && r.url) out[r.url] = r;
  }
  return out;
}

// Wrap broken links in the rendered preview with red/orange highlight.
// Does NOT modify the original article HTML used for copy/download.
// statusBySlug values: "local-ok" | "local-missing" | "live-ok" | "live-broken" | "live-error"
function highlightBrokenLinks(html, links, liveStatuses) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");

  const statusBySlug = new Map();
  for (const l of links) {
    if (l.localStatus === "local-missing") {
      statusBySlug.set(l.url, "local-missing");
      continue;
    }
    const live = liveStatuses[l.url];
    if (!live) {
      statusBySlug.set(l.url, "local-ok");
    } else if (live.ok) {
      statusBySlug.set(l.url, "live-ok");
    } else if (live.error) {
      statusBySlug.set(l.url, "live-error");
    } else {
      statusBySlug.set(l.url, "live-broken");
    }
  }

  for (const a of Array.from(doc.querySelectorAll("a[href]"))) {
    const raw = (a.getAttribute("href") || "").trim();
    if (!raw || PRODUCT_URL_RE.test(raw)) continue;
    if (raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) continue;

    let path = raw;
    if (/^https?:\/\//i.test(path)) {
      try {
        const u = new URL(path);
        if (u.hostname !== SHOP_HOSTNAME) continue;
        path = u.pathname + u.search + u.hash;
      } catch (_) { continue; }
    }
    if (!path.startsWith("/")) continue;
    const slug = path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

    const status = statusBySlug.get(slug);
    if (status !== "local-missing" && status !== "live-broken" && status !== "live-error") continue;

    const styleByStatus = {
      "local-missing": { bg: "#fde2e0", border: "#c0392b", title: "Slug nie istnieje w bazie kategorii" },
      "live-broken":   { bg: "#fef3c7", border: "#d97706", title: "Slug w bazie, ale URL zwraca błąd na sklep.lemone.pl" },
      "live-error":    { bg: "#f0eadb", border: "#7d6e4a", title: "Nie udało się sprawdzić tego linku" }
    };
    const cfg = styleByStatus[status];
    const existingStyle = a.getAttribute("style") || "";
    a.setAttribute("style", `${existingStyle};background:${cfg.bg};border-bottom:2px wavy ${cfg.border};padding:0 2px;border-radius:2px;`);
    a.setAttribute("title", cfg.title);
    a.setAttribute("data-link-status", status);
  }

  return doc.body.innerHTML;
}

// === RATE-LIMIT-AWARE FETCH ===
// Anthropic API zwraca 429 przy przekroczeniu RPM/TPM (typowo TPM przy dużych promptach).
// Worker proxy może też zwrócić 502/503 przy chwilowych problemach. Retry z exp backoff,
// honoruje header Retry-After jeśli jest podany przez serwer.
async function fetchWithRetry(url, options, maxRetries = 5) {
  let lastResponse;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      lastResponse = await fetch(url, options);
    } catch (e) {
      // Network error — retry too, ale tylko raz (mogło być Failed to fetch / DNS hiccup)
      if (attempt === maxRetries) throw e;
      await new Promise(r => setTimeout(r, 3000 * Math.pow(2, attempt)));
      continue;
    }

    const retryable = lastResponse.status === 429 || lastResponse.status === 502 || lastResponse.status === 503;
    if (!retryable) return lastResponse;
    if (attempt === maxRetries) return lastResponse;

    // Server-provided Retry-After ma pierwszeństwo (Anthropic czasem podaje sekundy do resetu TPM).
    const retryAfter = lastResponse.headers.get("retry-after");
    const serverWaitMs = retryAfter ? Math.min(parseFloat(retryAfter) * 1000, 30000) : null;
    const backoffMs = serverWaitMs ?? Math.min(3000 * Math.pow(2, attempt), 30000);
    await new Promise(r => setTimeout(r, backoffMs));
  }
  return lastResponse;
}

// === ANTHROPIC API CALL — CLASSIFIER (multi-label, picks 1-4 containers per product) ===
// Runs before generateBoxData. Output drives which categories enter the box-generation prompt,
// cutting input tokens 2-10× depending on product type.
async function classifyProduct(product) {
  const containerLines = CONTAINERS.map(c => `- ${c.id}: ${c.desc}`).join("\n");

  const prompt = `Sklasyfikuj produkt do 1-4 kontenerów z listy poniżej. Zwróć WYŁĄCZNIE JSON.

PRODUKT:
Nazwa: ${product.name}
Podtytuł: ${product.subtitle || "(brak)"}

KONTENERY (multi-label):
${containerLines}

ZASADY DOBORU:
- Wybierz 1-4 kontenerów które FAKTYCZNIE pasują do tego produktu
- Większość produktów pasuje do 2-3 kontenerów
- "wskazanie" dodaj tylko jeśli produkt jest jawnie nakierowany na konkretny problem (np. krem przeciwzmarszczkowy, ampułka na wypadanie); zwykły krem nawilżający to TYLKO "pielegnacja"
- "kosmetyki_naturalne" tylko gdy produkt jest jawnie naturalny / clean / wegański / bio
- "dermokosmetyki" tylko dla linii apteczno-dermatologicznych (Bioderma, La Roche-Posay, Avène, Pharmaceris, itp.)
- "dla_kogo" tylko gdy produkt JAWNIE targetuje grupę (np. "krem dla mężczyzn", "suplement dla kobiet w ciąży")

PRZYKŁADY:
- "Medik8 Crystal Retinal 3" (krem z retinolem) → ["pielegnacja", "wskazanie", "kosmetyki_naturalne"]
- "Vichy Dercos Aminexil" (ampułki na wypadanie włosów) → ["pielegnacja", "wskazanie", "dermokosmetyki"]
- "Solgar Magnez Cytrynian" (suplement) → ["suplementy"]
- "Sukin Hand Cream" (krem do rąk natural) → ["pielegnacja", "kosmetyki_naturalne"]
- "Avène Cleanance Comedomed" (krem na trądzik) → ["pielegnacja", "wskazanie", "dermokosmetyki"]
- "Bioderma Sensibio H2O" (płyn micelarny do wrażliwej) → ["pielegnacja", "dermokosmetyki"]
- "Lierac Lift Integral" (krem przeciwzmarszczkowy) → ["pielegnacja", "wskazanie"]
- "Mustela krem przy zmianie pieluszki" → ["pielegnacja", "dla_kogo"]

ZWRÓĆ TYLKO JSON, BEZ MARKDOWN:
{"containers":["..."]}`;

  const apiUrl = import.meta.env.VITE_API_URL || "https://api.anthropic.com/v1/messages";
  const response = await fetchWithRetry(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // Haiku ma osobny pool TPM od Sonneta — classifier nie zjada budżetu generatorowi boxa.
      // Multi-label classification to dla Haiku 4.5 trywialne zadanie, jakość zostaje, koszt 5× niższy.
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.text();
      if (body) detail = body.slice(0, 300);
    } catch (_) {}
    throw new Error(`Classifier API ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("").trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Niepoprawny JSON z classifier: " + cleaned.slice(0, 120));
  }

  const raw = Array.isArray(parsed.containers) ? parsed.containers : [];
  // Validate against known IDs — drop anything the model hallucinated
  const valid = raw.filter(c => CONTAINER_IDS.has(c));
  const dropped = raw.filter(c => !CONTAINER_IDS.has(c));

  return {
    containers: valid,
    droppedContainers: dropped
  };
}

// === ANTHROPIC API CALL — BOX GENERATOR ===
async function generateBoxData(product) {
  // Step 1 — classify product to subset of containers (multi-label). Failures fall back to full list.
  let classifyResult = null;
  let classifyError = null;
  try {
    classifyResult = await classifyProduct(product);
  } catch (e) {
    classifyError = e.message || String(e);
  }

  const chosenContainers = classifyResult ? classifyResult.containers : [];
  const filteredCats = getCategoriesForContainers(chosenContainers);
  const usingFallback = filteredCats === CATEGORIES;
  const filteredListText = filteredCats.map(c => `${c.n} | ${c.s}`).join("\n");

  // Step 2 — generate box with filtered category list
  const prompt = `Jesteś redaktorem polskiego bloga kosmetycznego Lemoné. Generujesz dane do boxa pod produkt w artykule.

PRODUKT:
Nazwa: ${product.name}
Podtytuł: ${product.subtitle || "(brak)"}

OPIS Z ARTYKUŁU:
${product.description || "(brak — zinterpretuj na podstawie nazwy)"}

KATEGORIE STRONY (wybierz dokładnie 3 najlepiej dopasowane, slug KOPIUJ 1:1 z listy, NIE WYMYŚLAJ NOWYCH):
${filteredListText}

ZASADY:
- "forWho" — 3-4 krótkie linijki po polsku: typ skóry/problem/sytuacja użytkownika. Format jak: "skóra sucha / odwodniona", "skóra wrażliwa / reaktywna", "po zabiegach estetycznych".
- "whyWorth" — 3 linijki po polsku z głównymi korzyściami z opisu produktu. Format jak: "intensywna odbudowa bariery hydrolipidowej", "szybkie ukojenie skóry".
- "related" — DOKŁADNIE 3 obiekty {slug, label}. Slug 1:1 z listy. Label to skrócona, lowercase nazwa wyświetlana w linku (max 4 słowa, naturalna forma w zdaniu np. "kremy nawilżające", "podrażnienie skóry").
- Jeśli produkt to suplement diety: w "forWho" pomiń "skóra X", użyj zdrowotnego kontekstu.

ZWRÓĆ WYŁĄCZNIE JSON, BEZ MARKDOWN, BEZ KOMENTARZY:
{"forWho":["...","...","..."],"whyWorth":["...","...","..."],"related":[{"slug":"/...","label":"..."},{"slug":"/...","label":"..."},{"slug":"/...","label":"..."}]}`;

  const apiUrl = import.meta.env.VITE_API_URL || "https://api.anthropic.com/v1/messages";
  const response = await fetchWithRetry(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.text();
      if (body) detail = body.slice(0, 300);
    } catch (_) {}
    if (response.status === 429) {
      throw new Error(`Limit (429) — pomimo 3 prób. ${detail}`);
    }
    throw new Error(`API ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("").trim();
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error("Niepoprawny JSON z API: " + cleaned.slice(0, 120));
  }

  const validRelated = (parsed.related || []).filter(r => r && r.slug && VALID_SLUGS.has(r.slug));
  const droppedRelated = (parsed.related || []).filter(r => !r || !r.slug || !VALID_SLUGS.has(r.slug));

  const warnings = [];
  if (droppedRelated.length > 0) {
    warnings.push(`Pominięto ${droppedRelated.length} slug(ów) spoza bazy: ${droppedRelated.map(r => r?.slug || "?").join(", ")}`);
  }
  if (classifyError) {
    warnings.push(`Klasyfikator zawiódł — użyto pełnej listy kategorii. Błąd: ${classifyError}`);
  } else if (classifyResult && classifyResult.droppedContainers.length > 0) {
    warnings.push(`Klasyfikator zwrócił nieznane kontenery: ${classifyResult.droppedContainers.join(", ")}`);
  }

  return {
    forWho: Array.isArray(parsed.forWho) ? parsed.forWho.filter(Boolean) : [],
    whyWorth: Array.isArray(parsed.whyWorth) ? parsed.whyWorth.filter(Boolean) : [],
    related: validRelated,
    containers: chosenContainers,
    catsConsidered: filteredCats.length,
    fallbackUsed: usingFallback,
    warnings
  };
}

// === HTML BUILDER ===
const escapeHtml = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildBoxOnly(data) {
  const forWhoLines = (data.forWho || []).map(l => l.trim()).filter(Boolean);
  const whyLines = (data.whyWorth || []).map(l => l.trim()).filter(Boolean);
  const related = data.related || [];

  const forWhoHtml = forWhoLines.length
    ? `    <p>\n        <strong>Dla kogo?</strong><br>\n${forWhoLines.map((l, i) => `        ✔ ${escapeHtml(l)}${i < forWhoLines.length - 1 ? "<br>" : ""}`).join("\n")}\n    </p>`
    : "";

  const whyHtml = whyLines.length
    ? `    <p>\n        <strong>Dlaczego warto:</strong><br>\n${whyLines.map((l, i) => `        → ${escapeHtml(l)}${i < whyLines.length - 1 ? "<br>" : ""}`).join("\n")}\n    </p>`
    : "";

  const relatedHtml = related.length
    ? `    <p>\n        <strong>Powiązane:</strong> ${related.map(r => `<a href="${escapeHtml(r.slug)}">${escapeHtml(r.label)}</a>`).join(" • ")}\n    </p>`
    : "";

  return `<div style="background-color:#fff8e6;border-radius:10px;border:1px solid #f0e6c8;margin:15px 0;padding:15px;">
${[forWhoHtml, whyHtml, relatedHtml].filter(Boolean).join("\n")}
</div>`;
}

function buildBoxHTML(product, data) {
  const innerBox = buildBoxOnly(data).split("\n").map(l => "            " + l).join("\n");

  const figure = product.imageUrl
    ? `            <figure class="image" style="height:auto;">
                <a href="${escapeHtml(product.url)}"><img style="display:block;max-width:400px;" src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" width="400"></a>
            </figure>
`
    : "";

  const subtitleHtml = product.subtitle
    ? `\n                <a href="${escapeHtml(product.url)}"><span class="subtitle">${escapeHtml(product.subtitle)}</span></a>`
    : "";

  return `<div class="product">
    <div class="row">
        <div class="col-12">
            <p style="text-align:left;">
                <a href="${escapeHtml(product.url)}"><strong>${escapeHtml(product.name)}</strong></a><br>${subtitleHtml}
            </p>
${figure}${innerBox}
        </div>
    </div>
</div>`;
}

// === MAIN APP ===
export default function App() {
  const [step, setStep] = useState("input");
  const [input, setInput] = useState("");
  const [products, setProducts] = useState([]);
  const [boxes, setBoxes] = useState({});
  const [progress, setProgress] = useState(null);
  const [tocItems, setTocItems] = useState([]);

  const handleAnalyze = async () => {
    const found = parseProducts(input);
    if (found.length === 0) {
      setProducts([]);
      setStep("empty");
      return;
    }
    setProducts(found);
    setBoxes({});
    setTocItems(extractTocItems(input));
    setStep("results");

    setProgress({ current: 0, total: found.length });
    const generatedBoxes = {};
    for (let i = 0; i < found.length; i++) {
      setProgress({ current: i + 1, total: found.length });
      const result = await runOne(found[i]);
      if (result?.status === "ready") generatedBoxes[found[i].url] = result;
      // Gap między boxami — rozkłada calls w czasie żeby nie kumulować rate limitu po stronie Workera/Anthropic.
      // Dla 4 produktów dodaje ~6s, ale dramatycznie zmniejsza szansę padu po 3-4 boxach.
      if (i < found.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
    setProgress(null);

    // Po wygenerowaniu wszystkich boxów: walidacja `related` przeciwko żywym URL-om sklepu.
    // CATEGORIES ma 1149 wpisów z auto-derywowanymi slugami, ale shop może mieć inne dla części
    // kategorii. /check-link w Workerze robi HEAD do sklep.lemone.pl<slug> i mówi czy URL działa.
    // Te które nie działają, usuwamy z `related` i regenerujemy HTML boxa.
    if (Object.keys(generatedBoxes).length > 0) {
      await validateRelatedSlugs(found, generatedBoxes);
    }
  };

  // Sprawdza wszystkie unikalne slugi `related` we wszystkich boxach naraz (1 request HTTP).
  // Te które wracają !ok, są usuwane z odpowiednich boxów. HTML każdego dotkniętego boxa jest regenerowany.
  // Jeśli /check-link nie istnieje (Worker bez endpointu), pokazujemy globalny warning ale nie crashujemy.
  const validateRelatedSlugs = async (productList, currentBoxes) => {
    const allSlugs = new Set();
    for (const p of productList) {
      const box = currentBoxes[p.url];
      if (box?.status === "ready" && Array.isArray(box.related)) {
        for (const r of box.related) {
          if (r?.slug) allSlugs.add(r.slug);
        }
      }
    }
    if (allSlugs.size === 0) return;

    let liveStatuses;
    try {
      liveStatuses = await checkLinksLive([...allSlugs]);
    } catch (e) {
      // Worker bez /check-link albo inny problem sieciowy — graceful: dorzuć warning do każdego boxa,
      // ale nie modyfikuj related. Robert zobaczy ostrzeżenie i będzie wiedział że trzeba wdrożyć Worker.
      const reason = e.message || String(e);
      setBoxes(prev => {
        const next = { ...prev };
        for (const url in next) {
          const b = next[url];
          if (b.status === "ready") {
            next[url] = { ...b, warnings: [...(b.warnings || []), `Walidacja slugów niedostępna (${reason}). Wdróż endpoint /check-link w Workerze (worker-check-link.js).`] };
          }
        }
        return next;
      });
      return;
    }

    // Zaaplikuj wyniki: filtruj related, regeneruj html, dorzuć warning gdy coś usunięte.
    setBoxes(prev => {
      const next = { ...prev };
      for (const product of productList) {
        const box = next[product.url];
        if (!box || box.status !== "ready" || !Array.isArray(box.related)) continue;

        const dead = box.related.filter(r => {
          const live = liveStatuses[r.slug];
          return live && !live.ok && !live.error;
        });
        if (dead.length === 0) continue;

        const alive = box.related.filter(r => !dead.includes(r));
        const newHtml = buildBoxHTML(product, {
          forWho: box.forWho,
          whyWorth: box.whyWorth,
          related: alive
        });
        const deadList = dead.map(r => r.slug).join(", ");
        next[product.url] = {
          ...box,
          related: alive,
          html: newHtml,
          warnings: [...(box.warnings || []), `Usunięto ${dead.length} martwy(ch) slug(ów) (404 na sklepie): ${deadList}`]
        };
      }
      return next;
    });
  };

  const runOne = async (product) => {
    setBoxes(prev => ({ ...prev, [product.url]: { status: "loading" } }));
    try {
      const data = await generateBoxData(product);
      const html = buildBoxHTML(product, data);
      const boxState = { status: "ready", ...data, html };
      setBoxes(prev => ({ ...prev, [product.url]: boxState }));
      return boxState;
    } catch (e) {
      const errState = { status: "error", error: e.message || String(e) };
      setBoxes(prev => ({ ...prev, [product.url]: errState }));
      return errState;
    }
  };

  const handleReset = () => {
    setStep("input");
    setProducts([]);
    setBoxes({});
    setProgress(null);
    setTocItems([]);
  };

  const allReady = products.length > 0 && products.every(p => boxes[p.url]?.status === "ready");

  return (
    <div style={{ minHeight: "100vh", background: "#faf8f4", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#1f2e1f" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        body { background: #faf8f4; }
        .display-font { font-family: 'Fraunces', Georgia, serif; font-feature-settings: 'ss01'; }
        .mono-font { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        .scroll-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scroll-thin::-webkit-scrollbar-thumb { background: #d8d3c8; border-radius: 3px; }
        .scroll-thin::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      <header style={{ borderBottom: "1px solid #e8e4dc", background: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "26px 24px 22px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #d4e4a8, #2d4a2d)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={18} color="#faf8f4" />
          </div>
          <div>
            <h1 className="display-font" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
              Lemoné Blog Studio
              <span style={{ fontSize: 10, fontWeight: 500, color: "#7d7d6d", background: "#eef2e8", padding: "2px 7px", borderRadius: 99, marginLeft: 10, verticalAlign: "middle", fontFamily: "ui-monospace, monospace" }}>
                v1.6 · transformacja img na figure (zgodnie z działającym wzorcem)
              </span>
            </h1>
            <p style={{ fontSize: 12, color: "#6b6b5b", margin: "2px 0 0" }}>
              Wklej artykuł — dostaniesz boxy produktowe z powiązaniami z bazy {CATEGORIES.length} kategorii
            </p>
          </div>
          <div style={{ flex: 1 }} />
          {step !== "input" && (
            <button onClick={handleReset} style={btnSecondary}>
              <FileText size={14} /> Nowy artykuł
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}>
        {step === "input" && <InputView input={input} setInput={setInput} onAnalyze={handleAnalyze} />}
        {step === "empty" && <EmptyView onBack={handleReset} />}
        {step === "results" && (
          <ResultsView
            products={products}
            boxes={boxes}
            progress={progress}
            allReady={allReady}
            onRetry={runOne}
            tocItems={tocItems}
            setTocItems={setTocItems}
            rawHtml={input}
          />
        )}
      </main>

      <footer style={{ borderTop: "1px solid #e8e4dc", padding: "20px", textAlign: "center", fontSize: 11.5, color: "#6b6b5b" }}>
        Powiązania zawsze 1:1 z pliku Mapowanie_kategorii_Lemone.xlsx · slugi spoza bazy są odrzucane
      </footer>
    </div>
  );
}

function InputView({ input, setInput, onAnalyze }) {
  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28, maxWidth: 720 }}>
        <h2 className="display-font" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
          Wklej tekst artykułu
        </h2>
        <p style={{ fontSize: 14, color: "#3a4a3a", marginTop: 10, lineHeight: 1.6 }}>
          Wkleić można pełny HTML wpisu blogowego ze sklepu lub fragment z linkami produktowymi.
          Narzędzie wykryje wszystkie produkty po wzorcu URL <code className="mono-font" style={inlineCode}>/p-XXX.html</code>,
          a następnie dla każdego z nich wygeneruje box korzyści z propozycją 3 powiązań — wybranych ze 156 kategorii znajdujących się w bazie sklepu.
        </p>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 20 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Wklej HTML artykułu...'
          className="scroll-thin"
          style={{
            width: "100%",
            minHeight: 360,
            padding: 16,
            border: "1px solid #d8d3c8",
            borderRadius: 8,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12.5,
            lineHeight: 1.55,
            resize: "vertical",
            outline: "none",
            background: "#faf8f4",
            color: "#1f2e1f",
            boxSizing: "border-box"
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#6b6b5b" }}>
            {input.length.toLocaleString()} znaków
          </span>
          <button
            onClick={onAnalyze}
            disabled={!input.trim()}
            style={{
              ...btnPrimary,
              opacity: input.trim() ? 1 : 0.4,
              cursor: input.trim() ? "pointer" : "not-allowed",
              padding: "11px 22px",
              fontSize: 14
            }}
          >
            <Zap size={15} /> Analizuj artykuł
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyView({ onBack }) {
  return (
    <div className="fade-in" style={{ maxWidth: 640, margin: "60px auto", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fff4e6", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <AlertCircle size={26} color="#c89a4a" />
      </div>
      <h2 className="display-font" style={{ fontSize: 26, fontWeight: 600, margin: "0 0 12px" }}>
        Nie wykryto produktów
      </h2>
      <p style={{ fontSize: 14, color: "#3a4a3a", lineHeight: 1.6, margin: "0 0 24px" }}>
        W przesłanym tekście nie znaleziono żadnych linków produktowych w formacie <code className="mono-font" style={inlineCode}>/p-NAZWA-XXXX.html</code>.
        <br />Sprawdź, czy kopiujesz HTML wraz z atrybutami <code className="mono-font" style={inlineCode}>href</code>, a nie czysty tekst.
      </p>
      <button onClick={onBack} style={btnPrimary}>
        <FileText size={15} /> Wróć i spróbuj ponownie
      </button>
    </div>
  );
}

function ResultsView({ products, boxes, progress, allReady, onRetry, tocItems, setTocItems, rawHtml }) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const allBoxesHtml = useMemo(() => {
    return products.map(p => boxes[p.url]?.html).filter(Boolean).join("\n\n");
  }, [products, boxes]);

  const fullArticleHtml = useMemo(() => {
    if (!allReady) return "";
    return buildCompleteArticle(rawHtml, products, boxes, tocItems);
  }, [rawHtml, products, boxes, tocItems, allReady]);

  const copyText = async (text, setFlag) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      setTimeout(() => setFlag(false), 1800);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setFlag(true); setTimeout(() => setFlag(false), 1800); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  const downloadFullArticle = () => {
    const blob = new Blob([fullArticleHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `artykul-lemone-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h2 className="display-font" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", margin: 0 }}>
            Wykryto {products.length} {products.length === 1 ? "produkt" : products.length < 5 ? "produkty" : "produktów"}
          </h2>
          <p style={{ fontSize: 13, color: "#6b6b5b", margin: "4px 0 0" }}>
            {progress
              ? `Generowanie boxów: ${progress.current} / ${progress.total}`
              : allReady
                ? `Wszystko gotowe — pełny artykuł zawiera spis treści (${tocItems.length} pytań) i ${products.length} boxów`
                : "Ładowanie..."}
          </p>
        </div>
        <div style={{ flex: 1 }} />
        {allReady && (
          <>
            <button onClick={() => copyText(fullArticleHtml, setCopiedFull)} style={{ ...btnPrimary, background: copiedFull ? "#5b8c5a" : "#2d4a2d" }}>
              {copiedFull ? <Check size={15} /> : <Copy size={15} />}
              {copiedFull ? "Skopiowano!" : "Kopiuj cały artykuł"}
            </button>
            <button onClick={downloadFullArticle} style={btnSecondary}>
              <Download size={14} /> Pobierz .html
            </button>
          </>
        )}
      </div>

      {progress && (
        <div style={{ height: 4, background: "#e8e4dc", borderRadius: 99, overflow: "hidden", marginBottom: 24 }}>
          <div style={{
            height: "100%",
            width: `${(progress.current / progress.total) * 100}%`,
            background: "linear-gradient(90deg, #5b8c5a, #2d4a2d)",
            transition: "width 0.4s ease"
          }} />
        </div>
      )}

      <SectionHeader title="Spis treści" subtitle="Wyciągnięty z H2 i FAQ artykułu — możesz edytować przed kopiowaniem" />
      <TocCard items={tocItems} setItems={setTocItems} />

      <SectionHeader title="Boxy produktowe" subtitle={`${products.length} ${products.length === 1 ? "wykryty produkt" : "wykrytych produktów"} z artykułu`} extraTop={28} />
      <div style={{ display: "grid", gap: 16 }}>
        {products.map((p, idx) => (
          <ProductCard
            key={p.url}
            product={p}
            box={boxes[p.url]}
            index={idx + 1}
            onRetry={() => onRetry(p)}
          />
        ))}
      </div>

      {allReady && (
        <>
          <SectionHeader title="Pełny artykuł" subtitle="Twój artykuł z wstawionym spisem treści i podmienionymi boxami — kopiuj lub pobierz jako plik" extraTop={28} />
          <FullArticleCard
            html={fullArticleHtml}
            onCopy={() => copyText(fullArticleHtml, setCopiedAll)}
            copied={copiedAll}
            onDownload={downloadFullArticle}
            boxesHtml={allBoxesHtml}
          />
        </>
      )}
    </div>
  );
}

function SectionHeader({ title, subtitle, extraTop = 0 }) {
  return (
    <div style={{ marginTop: extraTop, marginBottom: 14, display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
      <h3 className="display-font" style={{ fontSize: 20, fontWeight: 600, color: "#1f2e1f", margin: 0, letterSpacing: "-0.01em" }}>
        {title}
      </h3>
      <span style={{ fontSize: 12.5, color: "#6b6b5b" }}>{subtitle}</span>
    </div>
  );
}

function TocCard({ items, setItems }) {
  const [copied, setCopied] = useState(false);

  const updateItem = (i, v) => setItems(items.map((x, idx) => idx === i ? v : x));
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const addItem = () => setItems([...items, ""]);

  const html = useMemo(() => buildTocHTML(items), [items]);

  const copyToc = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = html;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, padding: 20, color: "#a8a89a", fontSize: 13 }}>
        Nie udało się wyciągnąć żadnych pytań. Upewnij się, że artykuł zawiera nagłówki <code className="mono-font" style={inlineCode}>&lt;h2&gt;</code> lub sekcję FAQ z <code className="mono-font" style={inlineCode}>&lt;details&gt;&lt;summary&gt;</code>.
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 0 }}>
        <div style={{ padding: 18, borderRight: "1px solid #f0ebe0" }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: "#5b8c5a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Pytania ({items.length})
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {items.map((q, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span className="mono-font" style={{ fontSize: 11, color: "#a8a89a", paddingTop: 10, minWidth: 22 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <input
                  value={q}
                  onChange={(e) => updateItem(i, e.target.value)}
                  style={{
                    flex: 1,
                    padding: "7px 10px",
                    border: "1px solid #d8d3c8",
                    borderRadius: 5,
                    fontSize: 13,
                    fontFamily: "inherit",
                    color: "#1f2e1f",
                    background: "#faf8f4",
                    outline: "none"
                  }}
                />
                <button
                  onClick={() => removeItem(i)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#a8a89a", padding: 6, display: "flex" }}
                  title="Usuń"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addItem} style={{ ...btnSecondary, marginTop: 10, fontSize: 12 }}>
            <Plus size={12} /> Dodaj pytanie
          </button>
        </div>

        <div style={{ padding: 18, background: "#faf8f4" }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: "#5b8c5a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Podgląd
          </div>
          <div dangerouslySetInnerHTML={{ __html: html }} style={{ fontSize: 12.5 }} />
          <button
            onClick={copyToc}
            style={{ ...btnPrimary, marginTop: 12, padding: "7px 12px", fontSize: 12.5, background: copied ? "#5b8c5a" : "#2d4a2d" }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Skopiowano" : "Kopiuj tylko spis treści"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FullArticleCard({ html, onCopy, copied, onDownload, boxesHtml }) {
  const [tab, setTab] = useState("preview");
  const [copiedBoxes, setCopiedBoxes] = useState(false);
  const [liveStatuses, setLiveStatuses] = useState({}); // { url: { url, status, ok, error? } }
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState(null);

  // Extract all relative non-product links once per article
  const links = useMemo(() => extractArticleLinks(html), [html]);

  // Counts for tab badge
  const localMissingCount = useMemo(() => links.filter(l => l.localStatus === "local-missing").length, [links]);
  const liveBrokenCount = useMemo(
    () => Object.values(liveStatuses).filter(r => r && !r.ok && !r.error).length,
    [liveStatuses]
  );
  const totalIssues = localMissingCount + liveBrokenCount;

  // Highlighted preview HTML — recomputed when statuses change
  const previewHtml = useMemo(
    () => highlightBrokenLinks(html, links, liveStatuses),
    [html, links, liveStatuses]
  );

  const runLiveCheck = async () => {
    if (links.length === 0) return;
    setChecking(true);
    setCheckError(null);
    try {
      // Only check links that exist locally — skip local-missing (URL would 404 anyway, no point hammering shop)
      const candidates = links.filter(l => l.localStatus === "local-ok").map(l => l.url);
      if (candidates.length === 0) {
        setLiveStatuses({});
        return;
      }
      const result = await checkLinksLive(candidates);
      setLiveStatuses(result);
    } catch (e) {
      setCheckError(e.message || String(e));
    } finally {
      setChecking(false);
    }
  };

  const copyJustBoxes = async () => {
    try {
      await navigator.clipboard.writeText(boxesHtml);
      setCopiedBoxes(true);
      setTimeout(() => setCopiedBoxes(false), 1500);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = boxesHtml;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopiedBoxes(true); setTimeout(() => setCopiedBoxes(false), 1500); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  const tabBtn = (id, label, badge = null, badgeColor = null) => (
    <button
      onClick={() => setTab(id)}
      style={{
        background: "none",
        border: "none",
        padding: "12px 18px",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: tab === id ? 600 : 400,
        color: tab === id ? "#1f2e1f" : "#6b6b5b",
        borderBottom: `2px solid ${tab === id ? "#2d4a2d" : "transparent"}`,
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 7
      }}
    >
      {label}
      {badge != null && (
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "1px 7px",
          borderRadius: 99,
          background: badgeColor || "#e8e4dc",
          color: badgeColor ? "#fff" : "#5b6b5b",
          minWidth: 18,
          textAlign: "center"
        }}>{badge}</span>
      )}
    </button>
  );

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #f0ebe0", background: "#faf8f4", flexWrap: "wrap" }}>
        {tabBtn("preview", "Podgląd renderowany", totalIssues > 0 ? totalIssues : null, totalIssues > 0 ? "#c0392b" : null)}
        {tabBtn("links", "Linki", links.length > 0 ? links.length : null)}
        {tabBtn("code", `Kod HTML (${(html.length / 1024).toFixed(1)} KB)`)}
      </div>

      {tab === "preview" && (
        <div className="scroll-thin" style={{ padding: 20, maxHeight: 600, overflow: "auto" }}>
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      )}

      {tab === "links" && (
        <LinksPanel
          links={links}
          liveStatuses={liveStatuses}
          checking={checking}
          checkError={checkError}
          onCheck={runLiveCheck}
        />
      )}

      {tab === "code" && (
        <pre className="mono-font scroll-thin" style={{
          margin: 0,
          padding: 18,
          fontSize: 11,
          lineHeight: 1.55,
          color: "#d8d3c8",
          background: "#1f2e1f",
          maxHeight: 500,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}>
          {html}
        </pre>
      )}

      <div style={{ display: "flex", gap: 8, padding: 14, borderTop: "1px solid #f0ebe0", background: "#faf8f4", flexWrap: "wrap" }}>
        <button onClick={onCopy} style={{ ...btnPrimary, padding: "8px 14px", fontSize: 13, background: copied ? "#5b8c5a" : "#2d4a2d" }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Skopiowano cały artykuł" : "Kopiuj cały artykuł"}
        </button>
        <button onClick={onDownload} style={btnSecondary}>
          <Download size={13} /> Pobierz .html
        </button>
        <button onClick={copyJustBoxes} style={btnSecondary}>
          {copiedBoxes ? <Check size={13} /> : <Copy size={13} />}
          {copiedBoxes ? "Skopiowano boxy" : "Tylko boxy (do ręcznego wklejenia)"}
        </button>
      </div>
    </div>
  );
}

function LinksPanel({ links, liveStatuses, checking, checkError, onCheck }) {
  if (links.length === 0) {
    return (
      <div style={{ padding: 28, textAlign: "center", color: "#6b6b5b", fontSize: 13 }}>
        Brak linków kategorii w artykule (oprócz produktów <code style={inlineCode}>/p-XXX.html</code>).
      </div>
    );
  }

  const localOk = links.filter(l => l.localStatus === "local-ok").length;
  const localMissing = links.filter(l => l.localStatus === "local-missing").length;
  const liveCount = Object.keys(liveStatuses).length;

  const statusFor = (link) => {
    if (link.localStatus === "local-missing") return { label: "Brak slugu w bazie", color: "#c0392b", bg: "#fde2e0" };
    const live = liveStatuses[link.url];
    if (!live) return { label: "Lokalnie OK", color: "#5b8c5a", bg: "#e8f0e0" };
    if (live.error) return { label: `Błąd: ${live.error}`, color: "#7d6e4a", bg: "#f0eadb" };
    if (live.ok) return { label: `Live OK (${live.status})`, color: "#2d4a2d", bg: "#d4e8c8" };
    return { label: `Live ${live.status || "404"}`, color: "#d97706", bg: "#fef3c7" };
  };

  return (
    <div className="scroll-thin" style={{ maxHeight: 600, overflow: "auto" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0ebe0", background: "#faf8f4", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 13, color: "#3a4a3a" }}>
          <strong>{links.length}</strong> linków · <span style={{ color: "#5b8c5a" }}>{localOk} w bazie</span>
          {localMissing > 0 && <> · <span style={{ color: "#c0392b" }}>{localMissing} brak slugu</span></>}
          {liveCount > 0 && <> · <span style={{ color: "#5b6b5b" }}>{liveCount} sprawdzonych live</span></>}
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={onCheck}
          disabled={checking || localOk === 0}
          style={{
            ...btnPrimary,
            padding: "7px 13px",
            fontSize: 12.5,
            background: checking ? "#5b8c5a" : "#2d4a2d",
            opacity: localOk === 0 ? 0.4 : 1,
            cursor: localOk === 0 ? "not-allowed" : "pointer"
          }}
        >
          {checking ? <Loader2 size={13} className="spin" /> : <Zap size={13} />}
          {checking ? "Sprawdzam..." : `Sprawdź na żywo (${localOk})`}
        </button>
      </div>

      {checkError && (
        <div style={{ padding: "10px 20px", background: "#fde2e0", color: "#8a2a1f", fontSize: 12.5, borderBottom: "1px solid #f0ebe0" }}>
          <AlertCircle size={13} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Live check nie powiódł się: {checkError}
        </div>
      )}

      <div>
        {links.map((link) => {
          const s = statusFor(link);
          return (
            <div key={link.url} style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: 12,
              padding: "11px 20px",
              borderBottom: "1px solid #f4f0e6",
              alignItems: "center"
            }}>
              <div style={{ minWidth: 0 }}>
                <div className="mono-font" style={{ fontSize: 12, color: "#1f2e1f", wordBreak: "break-all" }}>
                  {link.url}
                  {link.count > 1 && <span style={{ marginLeft: 8, fontSize: 10.5, color: "#7d7d6d", fontWeight: 500 }}>×{link.count}</span>}
                </div>
                <div style={{ fontSize: 11.5, color: "#7d7d6d", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  „{link.text}"
                </div>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "3px 9px",
                borderRadius: 99,
                background: s.bg,
                color: s.color,
                whiteSpace: "nowrap"
              }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductCard({ product, box, index, onRetry }) {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = box?.status || "pending";

  const copyHtml = async () => {
    if (!box?.html) return;
    try {
      await navigator.clipboard.writeText(box.html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = box.html;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (_) {}
      document.body.removeChild(ta);
    }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e4dc", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: "1px solid #f0ebe0" }}>
        <span className="display-font" style={{ fontSize: 26, fontStyle: "italic", color: "#a8a89a", lineHeight: 1, minWidth: 36 }}>
          {String(index).padStart(2, "0")}
        </span>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, border: "1px solid #f0ebe0", background: "#fafafa" }} onError={(e) => e.currentTarget.style.display = "none"} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 6, background: "#f4f0e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={18} color="#a8a89a" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "#1f2e1f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.name}
          </div>
          <div className="mono-font" style={{ fontSize: 11, color: "#6b6b5b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {product.url}
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div style={{ padding: 18 }}>
        {status === "loading" && <LoadingState />}
        {status === "error" && <ErrorState error={box.error} onRetry={onRetry} />}
        {status === "pending" && <PendingState />}
        {status === "ready" && (
          <ReadyState
            box={box}
            onShowCode={() => setShowCode(s => !s)}
            showCode={showCode}
            onCopy={copyHtml}
            copied={copied}
            onRetry={onRetry}
          />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: { bg: "#f4f0e6", color: "#a8a89a", text: "Oczekuje" },
    loading: { bg: "#fff4e6", color: "#c89a4a", text: "Generuję..." },
    ready: { bg: "#eef4e8", color: "#5b8c5a", text: "Gotowe" },
    error: { bg: "#fdecec", color: "#c66060", text: "Błąd" }
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 99, background: s.bg, color: s.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {s.text}
    </span>
  );
}

function PendingState() {
  return <div style={{ textAlign: "center", color: "#a8a89a", fontSize: 13, padding: "16px 0" }}>Czeka w kolejce...</div>;
}

function LoadingState() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "20px 0", color: "#6b6b5b", fontSize: 13 }}>
      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
      <span>Claude Sonnet analizuje opis i dobiera kategorie...</span>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div style={{ background: "#fdecec", border: "1px solid #f4caca", borderRadius: 8, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
      <AlertCircle size={18} color="#c66060" style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#9a4a4a", marginBottom: 4 }}>Generowanie nie powiodło się</div>
        <div style={{ fontSize: 12.5, color: "#6b4a4a", marginBottom: 10 }}>{error}</div>
        <button onClick={onRetry} style={btnSecondary}>
          <RefreshCw size={13} /> Spróbuj ponownie
        </button>
      </div>
    </div>
  );
}

function ContainerStrip({ containers, catsConsidered, fallbackUsed }) {
  if (fallbackUsed) {
    return (
      <span style={{ fontSize: 11, color: "#9a6e2a", display: "inline-flex", alignItems: "center", gap: 5 }}>
        <AlertCircle size={11} />
        fallback — pełna lista {catsConsidered} kategorii
      </span>
    );
  }
  if (!containers || containers.length === 0) return null;
  const labelById = Object.fromEntries(CONTAINERS.map(c => [c.id, c.label]));
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap", fontSize: 11 }}>
      <span style={{ color: "#7d7d6d" }}>klasyfikator:</span>
      {containers.map((id) => (
        <span key={id} style={{
          background: "#eaf3e2",
          color: "#2d4a2d",
          border: "1px solid #cfe1bf",
          padding: "2px 8px",
          borderRadius: 99,
          fontWeight: 500
        }}>{labelById[id] || id}</span>
      ))}
      <span style={{ color: "#7d7d6d" }}>· {catsConsidered} kat.</span>
    </div>
  );
}

function ReadyState({ box, onShowCode, showCode, onCopy, copied, onRetry }) {
  return (
    <div>
      <div style={{ background: "#faf8f4", borderRadius: 10, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: "#5b8c5a", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Podgląd
          </div>
          <ContainerStrip containers={box.containers} catsConsidered={box.catsConsidered} fallbackUsed={box.fallbackUsed} />
        </div>
        <div style={{ background: "#fff8e6", borderRadius: 10, border: "1px solid #f0e6c8", padding: 15, fontSize: 13, lineHeight: 1.55 }}>
          {box.forWho?.length > 0 && (
            <p style={{ margin: "0 0 10px" }}>
              <strong>Dla kogo?</strong><br />
              {box.forWho.map((l, i) => (
                <span key={i}>✔ {l}{i < box.forWho.length - 1 && <br />}</span>
              ))}
            </p>
          )}
          {box.whyWorth?.length > 0 && (
            <p style={{ margin: "10px 0" }}>
              <strong>Dlaczego warto:</strong><br />
              {box.whyWorth.map((l, i) => (
                <span key={i}>→ {l}{i < box.whyWorth.length - 1 && <br />}</span>
              ))}
            </p>
          )}
          {box.related?.length > 0 && (
            <p style={{ margin: "10px 0 0" }}>
              <strong>Powiązane:</strong>{" "}
              {box.related.map((r, i) => (
                <span key={i}>
                  <a href={r.slug} onClick={(e) => e.preventDefault()} style={{ color: "#2d4a2d", textDecoration: "underline" }}>
                    {r.label}
                  </a>
                  {i < box.related.length - 1 && " • "}
                </span>
              ))}
            </p>
          )}
        </div>

        {box.related?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {box.related.map((r, i) => (
              <span key={i} className="mono-font" style={{ fontSize: 10.5, color: "#5b8c5a", background: "#eef4e8", padding: "3px 8px", borderRadius: 99, border: "1px solid #d4e4c8" }}>
                ✓ {r.slug}
              </span>
            ))}
          </div>
        )}

        {box.warnings?.length > 0 && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#fff4e6", borderRadius: 6, fontSize: 11.5, color: "#9a6e2a" }}>
            ⚠ {box.warnings.join("; ")}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={onCopy} style={{ ...btnPrimary, padding: "8px 14px", fontSize: 13, background: copied ? "#5b8c5a" : "#2d4a2d" }}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Skopiowano" : "Kopiuj HTML"}
        </button>
        <button onClick={onShowCode} style={{ ...btnSecondary, fontSize: 12.5 }}>
          {showCode ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {showCode ? "Ukryj kod" : "Pokaż kod"}
        </button>
        <button onClick={onRetry} style={{ ...btnSecondary, fontSize: 12.5 }}>
          <RefreshCw size={13} /> Wygeneruj ponownie
        </button>
      </div>

      {showCode && (
        <pre className="mono-font scroll-thin" style={{
          margin: "12px 0 0",
          padding: 14,
          fontSize: 11.5,
          lineHeight: 1.55,
          color: "#d8d3c8",
          background: "#1f2e1f",
          borderRadius: 8,
          maxHeight: 320,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}>
          {box.html}
        </pre>
      )}
    </div>
  );
}

const btnPrimary = {
  background: "#2d4a2d",
  color: "#faf8f4",
  border: "none",
  borderRadius: 6,
  padding: "9px 16px",
  fontSize: 13.5,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  fontFamily: "inherit",
  transition: "background 0.15s"
};

const btnSecondary = {
  background: "#fff",
  color: "#2d4a2d",
  border: "1px solid #d8d3c8",
  borderRadius: 6,
  padding: "7px 12px",
  fontSize: 12.5,
  fontWeight: 500,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: "inherit",
  transition: "all 0.15s"
};

const inlineCode = {
  background: "#f4f0e6",
  padding: "1px 6px",
  borderRadius: 4,
  fontSize: "0.9em",
  color: "#5b6b5b"
};
