# Architektura PacTrackMarketing - Transfer Wiedzy dla Architekta

Kompleksowy przewodnik techniczny wyjaśniający architekturę PacTrackMarketing, różnice względem Azure Static Web Apps, działanie Next.js w kontenerze Docker i Kubernetes, oraz szczegółowe porównanie Nginx vs Node.js server.

---

## Spis Treści

1. [Wprowadzenie](#wprowadzenie)
2. [Architektura Next.js](#architektura-nextjs)
3. [Docker Container](#docker-container)
4. [Nginx vs Node.js Server](#nginx-vs-nodejs-server)
5. [Architektura Kubernetes](#architektura-kubernetes)
6. [Cloudflare Tunnel](#cloudflare-tunnel)
7. [Porównanie z Azure Static Web Apps](#porównanie-z-azure-static-web-apps)
8. [Background Technologiczny](#background-technologiczny)
9. [Troubleshooting](#troubleshooting)

---

## Wprowadzenie

**PacTrackMarketing** to marketingowa landing page dla [pactrack.pl](https://pactrack.pl) - systemu śledzenia przesyłek dla e-commerce. Jest to aplikacja Next.js z:
- SEO-optimized (Server-Side Rendering)
- Wielojęzyczna (PL/EN) przez next-intl
- Blog oparty na Markdown
- Wdrożona na on-prem Kubernetes (kubeadm)

**Kluczowa różnica:** W przeciwieństwie do innych projektów które wrzucaliśmy na Azure Static Web Apps, ten projekt działa na Twoim własnym klastrze Kubernetes z pełną kontrolą nad infrastrukturą.

---

## Architektura Next.js

### Next.js 14+ Framework

Next.js to React framework z możliwościami:
- **SSR (Server-Side Rendering)** - renderowanie HTML na serwerze dla SEO
- **SSG (Static Site Generation)** - pre-renderowanie statycznych stron
- **API Routes** - backend endpoints w tym samym projekcie
- **File-based routing** - routing oparty na strukturze plików

### Tryb Standalone

W `next.config.mjs`:
```javascript
output: 'standalone'
```

**Co to oznacza?**
- Next.js generuje minimalny output potrzebny do uruchomienia aplikacji
- Zamiast pełnego `node_modules`, tylko niezbędne zależności
- Generuje `server.js` - samowystarczalny Node.js server
- Pozwala na mniejsze Docker images (~200MB zamiast ~1GB)

**Bez standalone:**
- Musiałbyś kopiować całe `node_modules` do kontenera
- Image byłby znacznie większy
- Wolniejszy build i deploy

**Z standalone:**
- Tylko `node_modules` potrzebne do runtime
- Mniejszy image, szybszy deploy
- Next.js automatycznie generuje `server.js`

### Struktura Projektu

```
src/
├── app/
│   ├── [locale]/          # Dynamiczne routing dla języków (pl/en)
│   │   ├── page.tsx       # Landing page (SSR)
│   │   ├── blog/          # Blog z Markdown
│   │   └── layout.tsx     # Layout dla locale
│   ├── sitemap.ts         # Dynamiczny sitemap.xml (SEO)
│   ├── robots.ts          # robots.txt (SEO)
│   └── globals.css        # Global styles
├── components/            # React components
├── i18n/                  # Konfiguracja i18n (next-intl)
├── lib/                   # Utilities (blog parser)
└── middleware.ts          # i18n middleware (routing języków)
content/
└── blog/                  # Markdown blog posts
    ├── pl/
    └── en/
messages/
├── pl.json                # Tłumaczenia PL
└── en.json                # Tłumaczenia EN
```

---

## Docker Container

### Multi-Stage Build

Dockerfile używa 3-stage build dla optymalizacji:

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
# Instalacja zależności (npm ci)

# Stage 2: Builder
FROM base AS builder
# Build Next.js (npm run build)

# Stage 3: Runner
FROM base AS runner
# Kopiowanie tylko .next/standalone i public/
# Uruchomienie: node server.js
```

**Dlaczego multi-stage?**
- **Stage deps** - instaluje zależności w czystym środowisku
- **Stage builder** - buduje aplikację (może być usunięty po)
- **Stage runner** - minimalny image z tylko tym co potrzebne do runtime

**Rozmiar image:**
- Bez multi-stage: ~1GB
- Z multi-stage: ~200MB
- Oszczędność: 80%

### Node.js Server w Kontenerze

W finalnym stage:
```dockerfile
CMD ["node", "server.js"]
```

**Co to jest `server.js`?**
- Generowany automatycznie przez Next.js w trybie standalone
- Jest to Node.js HTTP server obsługujący Next.js
- Nasłuchuje na porcie 3000 (ENV PORT=3000)
- Obsługuje SSR, API routes, static files

**Dlaczego Node.js, nie Nginx?**
- Next.js potrzebuje Node.js runtime do SSR
- Nginx może tylko serwować static files
- Node.js server jest wymagany do dynamicznego renderowania

---

## Nginx vs Node.js Server

### Porównanie Techniczne

| Cecha | Nginx | Node.js Server |
|-------|-------|----------------|
| **Typ** | Reverse proxy / Static file server | Application server |
| **Zastosowanie** | Routing, load balancing, static files | Dynamic applications, SSR, API |
| **Obsługa SSR** | ❌ Nie potrafi | ✅ Tak (Next.js) |
| **Static files** | ✅ Bardzo wydajny | ✅ Może, ale wolniejszy |
| **Routing** | ✅ Zaawansowany (regex, headers) | ✅ Podstawowy |
| **Load balancing** | ✅ Natywny | ❌ Potrzebuje zewnętrznego |
| **SSL termination** | ✅ Natywny | ✅ Może, ale nie dedykowany |
| **Wydajność static** | ⚡ Bardzo wysoka | 🐌 Wolniejsza |
| **Wydajność dynamic** | ❌ Nie obsługuje | ⚡ Wysoka (JS runtime) |
| **Pamięć** | 🟢 Niska | 🟡 Wyższa (V8 engine) |
| **Konfiguracja** | 🟡 Skomplikowana (nginx.conf) | 🟢 Prosta (JS/TS) |

### Kiedy Używać Nginx?

**✅ Idealny dla:**
- Static websites (HTML, CSS, JS, images)
- Reverse proxy dla wielu backendów
- Load balancing
- SSL termination
- Caching
- Rate limiting

**❌ Nie nadaje się do:**
- Server-Side Rendering (SSR)
- Dynamic applications wymagające JS runtime
- API routes z logiką biznesową

### Kiedy Używać Node.js Server?

**✅ Idealny dla:**
- Next.js applications (SSR, SSG, API routes)
- React applications z SSR
- API endpoints z logiką biznesową
- Real-time applications (WebSocket)
- Microservices

**❌ Nie nadaje się do:**
- Serwowania dużej ilości static files (użyj Nginx/CDN)
- Reverse proxy dla wielu backendów (użyj Nginx)
- Load balancing (użyj Nginx lub Kubernetes Service)

### Przykład Różnicy

**Nginx config:**
```nginx
server {
    listen 80;
    server_name example.com;
    
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
}
```
- Serwuje static files z `/var/www/html`
- Nie potrafi renderować React components

**Node.js (Next.js):**
```javascript
// server.js (generowany przez Next.js)
const { createServer } = require('http')
const next = require('next')

const app = next({ dev: false })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(3000)
})
```
- Renderuje React components na serwerze
- Obsługuje dynamic routes
- Obsługuje API routes

---

## Architektura Kubernetes

### Co Jest Używane w Twoim Kubernetes?

**OBA są używane - każdy do innej roli:**

```
Internet
    ↓
Cloudflare Edge (DNS + CDN + SSL)
    ↓
Cloudflare Tunnel (cloudflared na 192.168.1.9)
    ↓
NGINX Ingress Controller (Kubernetes)
    ├─ pactrack.pl → pactrack-marketing:3000 (Node.js Next.js)
    └─ app.pactrack.pl → frontend:80 / backend:8080
```

### 1. NGINX Ingress Controller

**Rola:** Reverse proxy i routing w klastrze Kubernetes

**Co robi:**
- Odbiera ruch z Cloudflare Tunnel (localhost:80)
- Rozróżnia domeny po nagłówku `Host`
- Routuje do odpowiednich Kubernetes Services
- Obsługuje virtual hosting (wiele domen na jednym IP)

**Konfiguracja:**
```yaml
# helm/pactrack-marketing/templates/ingress.yaml
ingress:
  enabled: true
  className: nginx  # NGINX Ingress Controller
  host: pactrack.pl
```

**Dlaczego NGINX Ingress?**
- Standard w Kubernetes dla ingress
- Zaawansowany routing (regex, headers)
- Load balancing
- Integracja z Kubernetes Services
- Darmowy i open-source

### 2. Node.js Next.js Server

**Rola:** Właściwa aplikacja Next.js

**Co robi:**
- Obsługuje SSR (Server-Side Rendering)
- Obsługuje API routes
- Serwuje static files (CSS, JS, images)
- Obsługuje i18n (PL/EN)
- Generuje dynamiczny content

**Konfiguracja:**
```yaml
# helm/pactrack-marketing/templates/deployment.yaml
containers:
  - name: marketing
    image: pactrack-marketing:latest
    ports:
      - containerPort: 3000  # Node.js Next.js server
    env:
      - name: PORT
        value: "3000"
      - name: HOSTNAME
        value: "0.0.0.0"
```

**Dlaczego Node.js?**
- Next.js wymaga Node.js runtime
- SSR wymaga JS engine (V8)
- API routes wymagają logiki biznesowej
- Dynamiczne generowanie contentu

### Jak Współpracują Ze Sobą?

**Flow żądania:**

1. **Użytkownik** otwiera `https://pactrack.pl`
2. **Cloudflare DNS** kieruje do Cloudflare Tunnel
3. **Cloudflare Tunnel** (cloudflared) przekazuje do NGINX Ingress (localhost:80)
4. **NGINX Ingress** sprawdza nagłówek `Host: pactrack.pl`
5. **NGINX Ingress** routuje do Service `pactrack-marketing:3000`
6. **Kubernetes Service** load-balance do Pod z Node.js Next.js
7. **Node.js Next.js** renderuje stronę (SSR) i zwraca HTML
8. **Response** wraca tą samą ścieżką do użytkownika

**Diagram:**

```
User Request: https://pactrack.pl
    ↓
Cloudflare (DNS + SSL)
    ↓
Cloudflare Tunnel (192.168.1.9)
    ↓
NGINX Ingress Controller (Kubernetes)
    Host: pactrack.pl
    ↓
Kubernetes Service: pactrack-marketing
    ↓
Pod: Node.js Next.js Server (port 3000)
    ↓
SSR → HTML Response
    ↓
NGINX Ingress → Cloudflare Tunnel → Cloudflare → User
```

### Dlaczego Używamy Obu?

**NGINX Ingress Controller:**
- ✅ Routing między wieloma aplikacjami (pactrack.pl, app.pactrack.pl)
- ✅ Virtual hosting (jedne IP, wiele domen)
- ✅ Load balancing
- ✅ Integracja z Kubernetes ecosystem
- ❌ Nie potrafi renderować Next.js (SSR)

**Node.js Next.js Server:**
- ✅ SSR dla Next.js
- ✅ API routes
- ✅ Dynamic content
- ✅ i18n
- ❌ Nie potrafi routować między aplikacjami

**Podsumowanie:**
- NGINX = "traffic cop" - kieruje ruch do odpowiedniej aplikacji
- Node.js = "application server" - obsługuje właściwą aplikację

---

## Cloudflare Tunnel

### Architektura

```
Internet
    ↓
Cloudflare Edge (DNS + CDN + SSL)
    ↓
Cloudflare Tunnel (cloudflared na 192.168.1.9)
    ├─ pactrack.pl → NGINX Ingress (localhost:80) → Next.js:3000
    └─ app.pactrack.pl → NGINX Ingress (localhost:80) → App:80
```

### Dlaczego Cloudflare Tunnel?

**Zalety:**
- ✅ Brak potrzeby publicznego IP dla serwera on-prem
- ✅ Automatyczne SSL certyfikaty (Cloudflare)
- ✅ DDoS protection (Cloudflare)
- ✅ CDN (caching static content)
- ✅ Jeden tunnel dla wielu domen
- ✅ Darmowy

**Alternatywa (bez Cloudflare Tunnel):**
- ❌ Potrzeba publicznego IP
- ❌ Otwarcie portów 80/443 na firewall
- ❌ Samodzielna konfiguracja SSL (Let's Encrypt)
- ❌ Brak DDoS protection
- ❌ Brak CDN

### Konfiguracja

```yaml
# /etc/cloudflared/config.yml
tunnel: <TUNNEL_ID>
credentials-file: /home/radek/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: pactrack.pl
    service: http://localhost:80  # NGINX Ingress
  - hostname: app.pactrack.pl
    service: http://localhost:80  # NGINX Ingress
  - service: http_status:404
```

**Obie domeny kierują na NGINX Ingress (localhost:80), który rozróżnia po nagłówku Host.**

---

## Porównanie z Azure Static Web Apps

### Azure Static Web Apps

**Cechy:**
- ✅ Automatyczne deploy z GitHub
- ✅ Darmowy SSL
- ✅ Global CDN
- ✅ Automatic scaling
- ✅ Prosta konfiguracja
- ❌ Tylko static sites (no SSR)
- ❌ Ograniczona kontrola nad infrastrukturą
- ❌ Vendor lock-in (Azure)
- ❌ Mniejsza elastyczność

**Kiedy używać:**
- Pure static websites (HTML/CSS/JS)
- Landing pages bez SSR
- Blogi oparte na SSG
- Proste projekty

### Kubernetes (On-Prem)

**Cechy:**
- ✅ Pełna kontrola nad infrastrukturą
- ✅ SSR (Next.js, React, Angular)
- ✅ API routes w tym samym projekcie
- ✅ Mikroserwisy
- ✅ Własne reguły firewall
- ✅ No vendor lock-in
- ❌ Więcej konfiguracji
- ❌ Wymaga knowledge o Kubernetes
- ❌ Wymaga utrzymania klastra

**Kiedy używać:**
- Aplikacje wymagające SSR
- Mikroserwisy
- Wymagania compliance (data on-prem)
- Pełna kontrola nad infrastrukturą
- Złożone architektury

### Dlaczego Kubernetes dla PacTrackMarketing?

1. **SSR wymagane** - Next.js potrzebuje Node.js runtime
2. **Full control** - pełna kontrola nad infrastrukturą
3. **Scalability** - łatwe skalowanie w przyszłości
4. **Mikroserwisy** - łatwe dodanie nowych usług
5. **No vendor lock-in** - możesz przenieść na inny provider
6. **On-prem** - dane na Twoim serwerze

---

## Background Technologiczny

### Node.js

**Czym jest:**
- JavaScript runtime oparty na V8 engine (Chrome)
- Asynchroniczny, event-driven
- Cross-platform (Windows, Linux, macOS)

**Dlaczego w Next.js:**
- React i Next.js są napisane w JavaScript/TypeScript
- SSR wymaga JS runtime (V8)
- API routes wymagają logiki biznesowej w JS

**Wady:**
- Single-threaded (ale event-driven)
- Wyższe zużycie pamięci niż statyczne serwery
- Nie nadaje się do CPU-intensive tasks

### Server-Side Rendering (SSR)

**Czym jest:**
- Renderowanie React components na serwerze
- Zwracanie gotowego HTML do przeglądarki
- JavaScript "hydrates" HTML w przeglądarce

**Zalety:**
- ✅ SEO (Google widzi content)
- ✅ Szybsze First Contentful Paint
- ✅ Lepsze UX na wolnych połączeniach

**Wady:**
- ❌ Wymaga Node.js server
- ❌ Wyższe zużycie CPU
- ❌ TTFB może być wolniejszy

### Static Site Generation (SSG)

**Czym jest:**
- Pre-renderowanie stron w build time
- Generowanie statycznych plików HTML
- Serwowanie jako static files

**Zalety:**
- ✅ Najszybsze wydajność
- ✅ Może być serwowane przez Nginx/CDN
- ✅ Najniższe zużycie CPU

**Wady:**
- ❌ Brak dynamic contentu
- ❌ Rebuild przy każdej zmianie contentu

**Next.js używa obu:**
- SSG dla statycznych stron (blog posts)
- SSR dla dynamic contentu (landing page z dynamicznymi danymi)

---

## Troubleshooting

### Pod nie startuje

```bash
# Sprawdź status podów
kubectl get pods -n pactrack-marketing

# Sprawdź logi
kubectl logs -n pactrack-marketing -l app.kubernetes.io/name=pactrack-marketing -f

# Sprawdź szczegóły podu
kubectl describe pod -n pactrack-marketing -l app.kubernetes.io/name=pactrack-marketing
```

### Image not found w containerd

```bash
# Sprawdź czy image jest w containerd
ssh radek@192.168.1.9 'sudo ctr -n k8s.io images ls | grep pactrack-marketing'

# Jeśli nie ma, załaduj ponownie
./docker/k8s_build_and_load_marketing.sh
```

### Ingress nie działa

```bash
# Sprawdź NGINX Ingress Controller
kubectl get pods -n ingress-nginx

# Sprawdź ingress
kubectl get ingress -n pactrack-marketing

# Sprawdź service
kubectl get svc -n pactrack-marketing

# Test z serwera
curl -H "Host: pactrack.pl" http://localhost:80
```

### Cloudflare Tunnel nie działa

```bash
# Sprawdź status cloudflared
ssh radek@192.168.1.9
sudo systemctl status cloudflared

# Sprawdź logi
sudo journalctl -u cloudflared -n 50

# Sprawdź konfigurację
sudo cloudflared tunnel ingress validate
```

### Build errors

```bash
# Sprawdź Docker build lokalnie
docker build --no-cache -t pactrack-marketing:latest -f Dockerfile .

# Sprawdź Next.js build
npm run build
```

---

## Podsumowanie

**Architektura PacTrackMarketing:**
- Next.js 14+ z SSR/SSG
- Docker container z Node.js server (tryb standalone)
- Kubernetes deployment przez Helm
- NGINX Ingress Controller dla routing
- Cloudflare Tunnel dla bezpiecznego dostępu

**Kluczowe różnice vs Azure Static Web Apps:**
- Pełna kontrola nad infrastrukturą
- SSR możliwe (Node.js runtime)
- Mikroserwisy możliwe
- On-prem deployment
- Więcej konfiguracji, ale więcej elastyczności

**Nginx vs Node.js:**
- NGINX = reverse proxy, routing, load balancing
- Node.js = application server, SSR, API routes
- W PacTrackMarketing używamy OBA: NGINX dla ingress, Node.js dla aplikacji

---

## Linki

- [Next.js Docs](https://nextjs.org/docs)
- [Docker Docs](https://docs.docker.com)
- [Kubernetes Docs](https://kubernetes.io/docs)
- [NGINX Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
