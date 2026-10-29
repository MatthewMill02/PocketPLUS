# PocketPLUS (wersja 1.0.1)

Prosta i przejrzysta aplikacja internetowa do rejestrowania i zarządzania codziennym budżetem, wydatkami, długami oraz subskrypcjami.

## Stos technologiczny
- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript (ES6+), modułowa struktura plików.
- **Hosting**: GitHub Pages.
- **Baza danych & Backend**: Arkusze Google (Google Spreadsheets) za pośrednictwem skryptu Google Apps Script udostępniającego API przez protokół JSONP.
- **Autoryzacja**: Hasło dostępu konfigurowane we właściwościach skryptu Google Apps Script (`Script Properties`).

## Główne funkcjonalności
- **Ekran powitalny z kafelkami profili**:
  - Dostęp do bazy danych przez kafelki profili:
    - **Matthew**: baza transakcji (wydatki, zyski, oszczędności).
    - **Marco**: baza długów (fioletowy filtr wizualny).
    - **Manhattan**: baza subskrypcji (czerwony filtr wizualny).
  - Pozostałe kafelki pełnią rolę atrap – ich kliknięcie nakłada 15-sekundową blokadę czasową na aplikację.
- **Pasek nawigacyjny podstron**:
  - Trzy duże, wyśrodkowane przyciski na górze ekranu danych umożliwiające natychmiastowe przełączanie między bazami: **Transakcje**, **Długi** i **Subskrypcje**.
- **Widok Transakcji**:
  - Tabela z wyszukiwaniem po nazwie, filtrowaniem po kategoriach i sortowaniem.
  - Podział kolumnowy z lewym panelem statystyk (stan konta, poduszka finansowa, bilanse z ostatnich miesięcy).
  - Formularz szybkiego dodawania transakcji pod tabelą na komputerach oraz w wyskakującym okienku na telefonach.
- **Widok Długów (w pełni odrębny od transakcji)**:
  - Pola rekordu: osoba (z podpowiedziami istniejących osób w bazie), nazwa, charakter długu ("Dług u mnie" / "Dług u osoby"), kwota, opcjonalna data pożyczki oraz opcjonalna data spłaty.
  - Automatyczne nadawanie unikalnego `id` oraz pola `update`, które odświeża się do bieżącej daty przy tworzeniu oraz przy każdej edycji.
  - Boczny panel podsumowań długów: zliczanie kwot w dwóch kategoriach ("Dłużni u mnie" oraz "Moje długi") wyłącznie dla niespłaconych pozycji (brak daty spłaty).
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
│   ├── charts-tables.css         # Stylizacja tabeli i formularzy
│   ├── dashboard.css             # Układ pulpitu, statystyki i nawigacja podstron
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