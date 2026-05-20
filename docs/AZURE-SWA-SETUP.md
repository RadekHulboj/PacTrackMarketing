# Azure Static Web Apps - Setup Guide

Instrukcja ręcznego stworzenia Azure Static Web Apps dla PacTrack Marketing Landing Page.

---

## Krok 1: Stworzenie Resource Group

### Opcja A: Azure Portal

1. Przejdź do [Azure Portal](https://portal.azure.com)
2. Kliknij "Resource groups" → "Create"
3. Wypełnij:
   - **Subscription:** Twoja subskrypcja
   - **Resource group:** `rg-pactrack-marketing`
   - **Region:** `West Europe`
4. Kliknij "Review + create" → "Create"

### Opcja B: Azure CLI

```bash
az login

az group create \
  --name rg-pactrack-marketing \
  --location westeurope

# Weryfikacja
az group show --name rg-pactrack-marketing
```

---

## Krok 2: Stworzenie Azure Static Web Apps

### Opcja A: Azure Portal (zalecane dla pierwszego razu)

1. W Azure Portal kliknij "Create a resource"
2. Wyszukaj "Static Web App" → kliknij "Create"
3. Wypełnij formularz:

**Basics:**
- **Subscription:** Twoja subskrypcja
- **Resource Group:** `rg-pactrack-marketing`
- **Name:** `pactrack-landing` (musi być unikalna globalnie)
- **Plan type:** Free (0 PLN/miesiąc) lub Standard ($9/miesiąc)
- **Region for Azure Functions API:** West Europe 2
- **Source:** Other

**Deployment details:**
- **Source:** Other (GitLab CI będzie deployował)
- Pozostaw puste - nie łączymy z GitHub/GitLab teraz

4. Kliknij "Review + create" → "Create"
5. Poczekaj 1-2 minuty na deployment

### Opcja B: Azure CLI

```bash
az staticwebapp create \
  --name pactrack-landing \
  --resource-group rg-pactrack-marketing \
  --location westeurope \
  --sku Free

# Weryfikacja
az staticwebapp show \
  --name pactrack-landing \
  --resource-group rg-pactrack-marketing
```

---

## Krok 3: Pobranie Deployment Token

**Deployment token jest potrzebny dla GitLab CI do deployowania.**

### Opcja A: Azure Portal

1. Przejdź do utworzonego Static Web App: `pactrack-landing`
2. W menu po lewej kliknij "Overview"
3. Kliknij "Manage deployment token"
4. Skopiuj token (będzie widoczny tylko raz!)

### Opcja B: Azure CLI

```bash
az staticwebapp secrets list \
  --name pactrack-landing \
  --resource-group rg-pactrack-marketing \
  --query "properties.apiKey" -o tsv
```

**Zapisz token bezpiecznie - będzie potrzebny w GitLab CI!**

---

## Krok 4: Konfiguracja GitLab CI Variables

1. Przejdź do GitLab: `PacTrackMarketing` → Settings → CI/CD → Variables
2. Dodaj zmienną:
   - **Key:** `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - **Value:** (token z Kroku 3)
   - **Type:** Variable
   - **Flags:** 
     - ✅ Protect variable (tylko protected branches)
     - ✅ Mask variable (ukryj w logach)
     - ❌ Expand variable reference

3. Kliknij "Add variable"

---

## Krok 5: Konfiguracja Custom Domain (pactrack.pl)

### 5.1 Dodanie domeny w Azure SWA

1. W Azure Portal → Static Web App → Custom domains
2. Kliknij "Add" → "Custom domain on other DNS"
3. Wpisz: `pactrack.pl`
4. Kliknij "Next"

Azure wygeneruje TXT verification record:
```
Type: TXT
Name: asuid.pactrack.pl
Value: <VERIFICATION_TOKEN>
```

**Skopiuj ten token - będzie potrzebny w Cloudflare DNS!**

### 5.2 Dodanie TXT record w Cloudflare

1. Przejdź do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Wybierz domenę `pactrack.pl`
3. Przejdź do DNS → Records
4. Kliknij "Add record"
5. Wypełnij:
   - **Type:** TXT
   - **Name:** `asuid`
   - **Content:** `<VERIFICATION_TOKEN z Azure>`
   - **Proxy status:** DNS only (grey cloud)
   - **TTL:** Auto
6. Kliknij "Save"

### 5.3 Weryfikacja domeny w Azure

1. Wróć do Azure Portal → Static Web App → Custom domains
2. Kliknij "Validate" obok `pactrack.pl`
3. Poczekaj 1-5 minut na propagację DNS
4. Jeśli weryfikacja się powiedzie, domena będzie aktywna

**UWAGA:** Nie musisz dodawać CNAME do Azure - routing będzie przez Cloudflare Tunnel!

---

## Krok 6: Test Deployment

### 6.1 Pierwszy deploy przez GitLab CI

1. Commit i push do branch `main` lub `develop`
2. GitLab CI automatycznie uruchomi pipeline
3. Sprawdź logi w GitLab: CI/CD → Pipelines
4. Po sukcesie, aplikacja będzie dostępna na:
   - Default URL: `https://pactrack-landing.azurestaticapps.net`
   - Custom domain: `https://pactrack.pl` (po konfiguracji Cloudflare Tunnel)

### 6.2 Weryfikacja

```bash
# Test default URL
curl -I https://pactrack-landing.azurestaticapps.net

# Test custom domain (po Cloudflare Tunnel)
curl -I https://pactrack.pl
```

---

## Krok 7: Konfiguracja Build Settings (opcjonalne)

Jeśli Azure SWA nie buduje się poprawnie, możesz skonfigurować build settings:

1. Azure Portal → Static Web App → Configuration
2. Kliknij "Application settings"
3. Dodaj:
   - `NEXT_TELEMETRY_DISABLED` = `1`
   - `NODE_VERSION` = `18`

---

## Troubleshooting

### Błąd: "Deployment token is invalid"

**Przyczyna:** Token wygasł lub został zresetowany.

**Rozwiązanie:**
1. Wygeneruj nowy token w Azure Portal
2. Zaktualizuj zmienną `AZURE_STATIC_WEB_APPS_API_TOKEN` w GitLab CI

### Błąd: "Custom domain validation failed"

**Przyczyna:** TXT record nie propagował się lub jest niepoprawny.

**Rozwiązanie:**
```bash
# Sprawdź czy TXT record jest widoczny
dig TXT asuid.pactrack.pl +short

# Poczekaj 5-10 minut i spróbuj ponownie
```

### Błąd: "Build failed - npm ERR!"

**Przyczyna:** Brak zależności lub błąd w kodzie.

**Rozwiązanie:**
1. Sprawdź logi GitLab CI
2. Przetestuj build lokalnie: `npm run build`
3. Upewnij się że `package-lock.json` jest w repo

---

## Koszty Azure Static Web Apps

| Plan | Cena | Limity |
|------|------|--------|
| **Free** | 0 PLN/miesiąc | 100 GB bandwidth, 0.5 GB storage |
| **Standard** | ~$9/miesiąc | 100 GB bandwidth (potem $0.20/GB), 0.5 GB storage |

**Dla landing page wystarczy plan Free.**

---

## Następne kroki

Po skonfigurowaniu Azure SWA:
1. ✅ Skonfiguruj Cloudflare Tunnel (patrz: `CLOUDFLARE-TUNNEL-SETUP.md`)
2. ✅ Dodaj DNS records w Cloudflare (patrz: `CLOUDFLARE-DNS-SETUP.md`)
3. ✅ Przetestuj routing `pactrack.pl` → Azure SWA

---

## Linki

- [Azure Static Web Apps Docs](https://learn.microsoft.com/en-us/azure/static-web-apps/)
- [Next.js on Azure SWA](https://learn.microsoft.com/en-us/azure/static-web-apps/deploy-nextjs-hybrid)
- [Custom domains](https://learn.microsoft.com/en-us/azure/static-web-apps/custom-domain)
