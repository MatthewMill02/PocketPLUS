# PocketPLUS (wersja 1.1)

Prosta i przejrzysta aplikacja internetowa do rejestrowania i zarządzania codziennym budżetem, wydatkami, długami oraz subskrypcjami.

## Stos technologiczny
- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript (ES6+), modułowa struktura plików.
- **Hosting**: GitHub Pages.
- **Baza danych & Backend**: Arkusze Google (Google Spreadsheets) za pośrednictwem skryptu Google Apps Script udostępniającego API przez protokół JSONP.
- **Autoryzacja**: Hasło dostępu konfigurowane we właściwościach skryptu Google Apps Script (`Script Properties`).

## Nowości w wersji 1.1
- **Menu akcji wiersza (3 kropki)**: Opcje edycji oraz konwersji do transakcji zostały przeniesione pod minimalistyczne menu `•••` w każdym wierszu tabeli.
- **Konwersja długów i subskrypcji do transakcji**: Możliwość szybkiego utworzenia wpisu transakcji na podstawie długu lub usługi (z wstępnie uzupełnionymi danymi i możliwością zatwierdzenia w oknie pop-up).
- **Kolorowanie statusu długów**:
  - Niezamknięte długi po stronie użytkownika podświetlane na czerwono,
  - Niezamknięte długi dłużników podświetlane na zielono,
  - Zamknięte/spłacone pozycje w neutralnym białym kolorze.
- **Rozszerzone statystyki**:
  - W długach: dwukolumnowe rozbicie niespłaconych spraw z podziałem na osoby,
  - W subskrypcjach: podsumowanie łącznych wydatków oraz liczby wystąpień danej usługi w historii transakcji.
- **Ujednolicenie nazewnictwa i formularzy**: Etykieta "Koszt *" w subskrypcjach, logiczne układanie pól formularza odpowiadające kolumnom tabeli oraz okno potwierdzenia przed usunięciem rekordu.
- **Dostępność stopki**: Stopka aplikacji z numerem wersji widoczna na każdej podstronie.

## Główne funkcjonalności
- **Ekran powitalny z kafelkami profili**:
  - Dostęp do bazy danych przez kafelki profili:
    - **Matthew**: baza transakcji (wydatki, zyski, oszczędności).
    - **Marco**: baza długów (fioletowy filtr wizualny).
    - **Manhattan**: baza subskrypcji (czerwony filtr wizualny).
  - Pozostałe kafelki pełnią rolę atrap – ich kliknięcie nakłada 15-sekundową blokadę czasową na aplikację.
- **Pasek nawigacyjny podstron**:
  - Trzy duże, wyśrodkowane przyciski na górze ekranu danych umożliwiające natychmiastowe przełączanie między bazami: **Transakcje**, **Długi** i **Subskrypcje**.
- **Widok Transakcji i Danych**:
  - Kolumna z tabelą oraz polem do wprowadzania danych jest idealnie wyśrodkowana na stronie.
  - Lewa kolumna podsumowań i statystyk jest umieszczona z lewej strony od tabeli.
  - Tabela posiada własny, dedykowany pasek przewijania (scrollbar), a nagłówek tabeli pozostaje przypięty u góry podczas przewijania.
  - Dynamiczne ładowanie rekordów (Infinite Scroll): aplikacja ładuje porcjami po 30 rekordów przy przewijaniu tabeli ku końcowi.
  - Formularz szybkiego wprowadzania danych jest na stałe przyklejony do dołu ekranu (desktop/laptop) i nie przemieszcza się bez względu na ilość rekordów w tabeli. Na urządzeniach mobilnych dodawanie wpisów odbywa się przez dedykowany pop-up.
- **Widok Długów**:
  - Pola rekordu: osoba (z podpowiedziami istniejących osób w bazie), nazwa, rodzaj długu ("Dług u mnie" / "Dług u osoby"), kwota, data pożyczki oraz data spłaty.
  - Automatyczne nadawanie unikalnego `id` oraz pola `update`, które odświeża się do bieżącej daty przy tworzeniu oraz przy każdej edycji.
  - Boczny panel podsumowań długów: zliczanie kwot w dwóch kategoriach ("Dłużni u mnie" oraz "Moje długi") wyłącznie dla niespłaconych pozycji z imienną listą osób.
- **Optimistic UI & Synchronizacja w tle**:
  - Wprowadzone, edytowane lub usunięte wpisy natychmiast aktualizują widok.
  - Zmiany są kolejkowane i asynchronicznie synchronizowane z odpowiednią zakładką arkusza w chmurze po autoryzacji hasłem.
- **Tryb offline & domyślne dane**:
  - Przed zalogowaniem lub w trybie podglądu ładowane są przygotowane dane demonstracyjne z folderu `assets/test_data/`.

## Struktura projektu
```text
PocketPLUS/
├── assets/
│   ├── background.png            # Tło aplikacji
│   ├── default_transactions.csv  # Domyślne dane startowe transakcji
│   ├── Matthew.PNG               # Awatar profilu
│   ├── icon.png                  # Ikona aplikacji i kafelki zabezpieczenia
│   └── test_data/                # Pliki CSV z danymi testowymi dla baz
├── css/
│   ├── base.css
│   ├── charts-tables.css         # Stylizacja tabeli, dropdownów akcji i formularzy
│   ├── dashboard.css             # Układ pulpitu, statystyki i nawigacja podstron
│   ├── nav.css                   # Nawigacja i stopka
│   ├── style.css                 # Główny punkt wejściowy stylów
│   ├── tokens.css                # Zmienne projektowe i kolory
│   └── welcome.css               # Ekran startowy i kafelki
├── js/
│   ├── api.js                    # Obsługa JSONP i logowania
│   ├── app.js                    # Inicjalizacja zdarzeń DOM i nawigacji
│   ├── state.js                  # Globalny stan i konfiguracja
│   ├── sync.js                   # Kolejka synchronizacji w tle
│   ├── transactions.js           # Renderowanie tabel, statystyk, szybkie dodawanie i edycja
│   └── welcome.js                # Ekran powitalny i licznik blokady 15s
├── resources/
│   ├── GihHubPages_pocketPLUS.gs # Kod backendu Google Apps Script
│   └── PocketPLUS.xlsx           # Kopia robocza bazy arkuszy
└── index.html                    # Główny szkielet aplikacji
```