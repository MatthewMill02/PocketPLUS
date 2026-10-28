# PocketPLUS

Prosta i przejrzysta aplikacja internetowa do rejestrowania i zarządzania codziennym budżetem, wydatkami oraz oszczędnościami.

## Stos technologiczny
- **Frontend**: HTML5, Vanilla CSS, Vanilla JavaScript (ES6+), modułowa struktura plików.
- **Hosting**: GitHub Pages.
- **Baza danych & Backend**: Arkusze Google (Google Spreadsheets) za pośrednictwem skryptu Google Apps Script udostępniającego API przez protokół JSONP.
- **Autoryzacja**: Hasło dostępu konfigurowane we właściwościach skryptu Google Apps Script (`Script Properties`).

## Główne funkcjonalności
- **Ekran powitalny z zabezpieczeniem**:
  - Dostęp do bazy danych przez kafelek profilu Matthew.
  - Pozostałe kafelki pełnią rolę atrap – ich kliknięcie nakłada 15-sekundową blokadę czasową na aplikację.
- **Widok tabeli transakcji**:
  - Przejrzysta tabela z 40% kryciem/transparentnością tła (`rgba(26, 30, 36, 0.4)`).
  - Wyszukiwanie transakcji po nazwie, filtrowanie według kategorii/typu oraz elastyczne sortowanie (po dacie, kwocie i nazwie).
  - Paginacja danych.
- **Szybkie dodawanie transakcji (zawsze pod paginacją)**:
  - Formularz wprowadzania danych z automatycznym nadawaniem kolejnego ID oraz bieżącej daty.
  - Przełącznik charakteru transakcji: Wydatek `(-)` lub Zysk `(+)`.
  - Opcja oznaczania i wprowadzania kwoty oszczędności.
- **Optimistic UI & Synchronizacja w tle**:
  - Wprowadzone lub usunięte wpisy natychmiast pojawiają się w interfejsie użytkownika.
  - Zmiany są kolejkowane i asynchronicznie synchronizowane z arkuszem w chmurze po autoryzacji hasłem.
- **Tryb offline & domyślne dane**:
  - W przypadku braku logowania lub braku połączenia ładowany jest zestaw domyślnych danych startowych z pliku `assets/default_transactions.csv`.

## Struktura projektu
```text
PocketPLUS/
├── assets/
│   ├── default_transactions.csv  # Domyślne dane startowe transakcji
│   ├── Matthew.PNG               # Awatar profilu
│   ├── icon.png                  # Ikona aplikacji i kafelki zabezpieczenia
│   └── ...
├── css/
│   ├── base.css
│   ├── charts-tables.css         # Stylizacja tabeli i formularza szybkiego dodawania
│   ├── dashboard.css             # Układ pulpitu
│   ├── style.css                 # Główny punkt wejściowy stylów
│   ├── tokens.css                # Zmienne projektowe i kolory
│   └── welcome.css               # Ekran startowy i kafelki
├── js/
│   ├── api.js                    # Obsługa JSONP i logowania
│   ├── app.js                    # Inicjalizacja zdarzeń DOM
│   ├── state.js                  # Globalny stan i konfiguracja
│   ├── sync.js                   # Kolejka synchronizacji w tle
│   ├── transactions.js           # Renderowanie tabeli, filtry, szybkie dodawanie
│   └── welcome.js                # Ekran powitalny i licznik blokady 15s
├── resources/
│   ├── GihHubPages_pocketPLUS.gs # Kod backendu Google Apps Script
│   └── PocketPLUS.xlsx           # Kopia robocza bazy arkuszy
└── index.html                    # Główny szkielet aplikacji
```