# Instrukcja uruchomienia — PacTrack Marketing

## Wymagania

- Node.js v18 lub nowszy
- npm v10 lub nowszy

## Instalacja zależności

```bash
cd /home/radek/Projects/hulboj/PacTrackMarketing
npm install
```

## Uruchomienie

### Tryb deweloperski (development)

```bash
npm run dev
```

Aplikacja będzie dostępna pod: `http://localhost:3000`

- Zmiany w kodzie są automatycznie odświeżane (Hot Module Replacement)
- Optymalne do pracy nad kodem
- Naciśnij `Ctrl + C` aby zatrzymać

### Tryb produkcyjny

```bash
npm run build
npm start
```

- Najpierw buduje zoptymalizowaną wersję
- Następnie uruchamia serwer produkcyjny
- Szybsze działanie, mniejsze zużycie pamięci

## Struktura projektu

```
PacTrackMarketing/
├── src/
│   ├── app/              # Strony Next.js
│   │   ├── [locale]/     # Lokalizowane strony (PL/EN)
│   │   ├── sitemap.ts    # Dynamiczny sitemap dla SEO
│   │   └── robots.ts     # robots.txt
│   ├── components/       # Komponenty React
│   ├── i18n/            # Konfiguracja i18n
│   ├── lib/             # Funkcje pomocnicze (parser bloga)
│   └── middleware.ts    # Middleware dla i18n
├── content/
│   └── blog/            # Wpisy bloga w Markdown
│       ├── pl/         # Polskie wpisy
│       └── en/         # Angielskie wpisy
├── messages/           # Pliki tłumaczeń
│   ├── pl.json
│   └── en.json
├── public/             # Pliki statyczne
├── package.json
└── next.config.mjs
```

## Dodawanie nowych wpisów na blogu

1. Utwórz nowy plik `.md` w `content/blog/{locale}/`
2. Dodaj frontmatter na początku pliku:

```markdown
---
title: "Tytuł wpisu"
description: "Krótki opis dla SEO"
date: "2025-01-15"
author: "Autor"
category: "Kategoria"
tags: ["tag1", "tag2"]
image: "/images/blog/zdjecie.jpg"
---

Treść wpisu...
```

3. Zapisz plik — zostanie automatycznie wykryty przez system

## SEO

Strona jest zoptymalizowana pod SEO:
- **Sitemap**: Automatycznie generowany na `/sitemap.xml`
- **Robots.txt**: Konfiguracja pod `/robots.txt`
- **Meta tagi**: Dynamiczne dla każdej strony
- **Open Graph**: Karty udostępniania na Facebook/LinkedIn
- **Twitter Cards**: Karty udostępniania na Twitter/X
- **Schema.org**: Strukturalne dane (Organization, Website, Article)
- **hreflang**: Tłumaczenia dla Google
- **Canonical URLs**: Unikanie duplikacji treści

## Lokalizacja (i18n)

- Dostępne języki: **Polski (PL)** i **Angielski (EN)**
- Przełącznik języka w nagłówku strony
- URL: `/` → polski, `/en` → angielski
- Tłumaczenia w plikach `messages/pl.json` i `messages/en.json`

## Dodawanie nowego języka

1. Utwórz `messages/{kod-jezyka}.json` z tłumaczeniami
2. Zaktualizuj `src/i18n/routing.ts`: dodaj do `locales`
3. Utwórz katalog `content/blog/{kod-jezyka}/` dla wpisów
4. Zaktualizuj `src/app/sitemap.ts`: dodaj nowy język

## Deployment

### Kubernetes (on-prem)

Deployment odbywa się na on-prem Kubernetes (kubeadm) za pomocą skryptu:

```bash
./docker/k8s_build_and_load_marketing.sh
```

**Skrypt automatycznie:**
1. Buduje Docker image z Next.js
2. Przesyła image na serwer 192.168.1.9
3. Ładuje image do containerd
4. Deployuje przez Helm na Kubernetes

**Routing:** Cloudflare Tunnel → NGINX Ingress → pactrack-marketing:3000

Szczegóły: `docs/KUBERNETES-SETUP.md`

## Ważne uwagi

### Zależności
- Wersja Node.js: v18.20.5 (aktualnie zainstalowana)
- Wersja npm: v10.8.2 (aktualnie zainstalowana)
- Istnieją ostrzeżenia o wulnerebility — możesz uruchomić `npm audit fix` (opcjonalnie)

### Zdjęcia
- Aktualnie używamy tagów `<img>` (Next.js ostrzega o tym)
- Dla optymalizacji można użyć komponentu `next/image` (wymaga konfiguracji)
- Zdjęcia powinny być w `public/images/`

### Blog
- Wpisy są statyczne (Markdown) — nie wymaga bazy danych
- Edycja: edytuj plik `.md` w Git, commit, deploy
- Można w przyszłości zmigrować na CMS (Contentful/Strapi) jeśli potrzebujesz panelu admina

### Domain routing
- **pactrack.pl** → Marketing site (ten projekt)
- **app.pactrack.pl** → Główna aplikacja (Angular + Spring Boot)
- Wymaga konfiguracji DNS i reverse proxy na serwerze

### Performance
- Strona generuje statyczne HTML (SSG) dla większości stron
- LCP (Largest Contentful Paint) powinien być < 2.5s
- Sprawdź w Google PageSpeed Insights po deployment

## Przydatne komendy

```bash
# Instalacja zależności
npm install

# Uruchomienie deweloperskie
npm run dev

# Budowa produkcyjna
npm run build

# Uruchomienie produkcyjne
npm start

# Linting
npm run lint

# Sprawdzenie vulnerabilities
npm audit
```

## Problemy i rozwiązania

### Port 3000 zajęty
```bash
# Użyj innego portu
PORT=3001 npm run dev
```

### Błędy TypeScript po npm install
```bash
# Usuń node_modules i zainstaluj ponownie
rm -rf node_modules package-lock.json
npm install
```

### Budowa się nie powiodła
```bash
# Wyczyść cache Next.js
rm -rf .next
npm run build
```

## Kontakt

W razie problemów:
- Sprawdź logi w terminalu
- Sprawdź `package.json` czy wersje zależności są poprawne
- Skontaktuj się z deweloperem

---

**Status**: Projekt gotowy do deployment
**Ostatnia aktualizacja**: 2025-01-17
