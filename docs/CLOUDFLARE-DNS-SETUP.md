# Cloudflare DNS - Setup Guide

Instrukcja konfiguracji DNS records w Cloudflare dla migracji domen: `pactrack.pl` (landing page) i `app.pactrack.pl` (główna aplikacja).

---

## Architektura DNS

```
pactrack.pl (CNAME) → <tunnel-id>.cfargotunnel.com → Cloudflare Tunnel → Kubernetes (marketing)
app.pactrack.pl (CNAME) → <tunnel-id>.cfargotunnel.com → Cloudflare Tunnel → Kubernetes (aplikacja)
```

---

## Wymagania

- Konto Cloudflare z domeną `pactrack.pl`
- Cloudflare Tunnel ID (z `CLOUDFLARE-TUNNEL-SETUP.md`)

---

## Krok 1: Pobranie Tunnel ID

### 1.1 Znajdź Tunnel ID

Na serwerze 192.168.1.9:
```bash
cloudflared tunnel list
```

Output:
```
ID                                   NAME              CREATED
<TUNNEL_ID>                          pactrack-tunnel   2024-xx-xx
```

**Skopiuj TUNNEL_ID - będzie potrzebny w DNS!**

Alternatywnie, sprawdź w pliku konfiguracji:
```bash
grep "tunnel:" /etc/cloudflared/config.yml
```

---

## Krok 2: Dodanie DNS Records w Cloudflare

### 2.1 Przejdź do Cloudflare Dashboard

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Wybierz domenę `pactrack.pl`
3. Przejdź do **DNS** → **Records**

### 2.2 Dodaj CNAME dla pactrack.pl (root domain)

**UWAGA:** Cloudflare pozwala na CNAME dla root domain (CNAME flattening).

Kliknij **Add record** i wypełnij:
- **Type:** CNAME
- **Name:** `@` (oznacza root domain: pactrack.pl)
- **Target:** `<TUNNEL_ID>.cfargotunnel.com` (zamień na rzeczywisty ID)
- **Proxy status:** ✅ Proxied (orange cloud) - WŁĄCZONE
- **TTL:** Auto

Kliknij **Save**.

**Przykład:**
```
Type: CNAME
Name: @
Target: 1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6.cfargotunnel.com
Proxy: Proxied (orange cloud)
```

### 2.3 Dodaj CNAME dla app.pactrack.pl

Kliknij **Add record** i wypełnij:
- **Type:** CNAME
- **Name:** `app`
- **Target:** `<TUNNEL_ID>.cfargotunnel.com` (ten sam co wyżej)
- **Proxy status:** ✅ Proxied (orange cloud) - WŁĄCZONE
- **TTL:** Auto

Kliknij **Save**.

**Przykład:**
```
Type: CNAME
Name: app
Target: 1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6.cfargotunnel.com
Proxy: Proxied (orange cloud)
```

---

## Krok 3: Weryfikacja DNS Records

### 3.1 Sprawdź DNS records w Cloudflare Dashboard

Powinny być widoczne 2 rekordy:
```
Type   Name    Content
CNAME  @       <tunnel-id>.cfargotunnel.com (Proxied)
CNAME  app     <tunnel-id>.cfargotunnel.com (Proxied)
```

### 3.2 Test DNS propagacji

```bash
# Test CNAME dla pactrack.pl
dig pactrack.pl CNAME +short

# Test CNAME dla app.pactrack.pl
dig app.pactrack.pl CNAME +short

# Test rozwiązywania DNS
nslookup pactrack.pl
```

**UWAGA:** Jeśli CNAME jest proxied (orange cloud), `dig` może nie pokazać `cfargotunnel.com` bezpośrednio - to normalne. Cloudflare zwraca swoje IP.

---

## Krok 4: Usunięcie starych DNS records (jeśli istnieją)

### 4.1 Sprawdź stare records

Jeśli wcześniej miałeś A/AAAA/CNAME records dla `pactrack.pl` lub `app.pactrack.pl`, usuń je:

1. W Cloudflare Dashboard → DNS → Records
2. Znajdź stare records (np. A record dla `pactrack.pl` → `192.168.1.9`)
3. Kliknij **Edit** → **Delete**

**UWAGA:** Nie usuwaj innych records (np. MX, SPF, DKIM dla email).

---

## Krok 5: Konfiguracja SSL/TLS

### 5.1 Sprawdź SSL/TLS mode

1. W Cloudflare Dashboard → SSL/TLS
2. Upewnij się że **SSL/TLS encryption mode** jest ustawiony na:
   - **Full** (zalecane) - szyfrowanie Cloudflare ↔ origin
   - **Full (strict)** - wymaga ważnego certyfikatu na origin

**Dla Cloudflare Tunnel zalecamy: Full**

### 5.2 Włącz Always Use HTTPS

1. W Cloudflare Dashboard → SSL/TLS → Edge Certificates
2. Włącz **Always Use HTTPS** - przekierowanie HTTP → HTTPS

### 5.3 Włącz Automatic HTTPS Rewrites

1. W Cloudflare Dashboard → SSL/TLS → Edge Certificates
2. Włącz **Automatic HTTPS Rewrites**

---

## Krok 6: Test końcowy

### 6.1 Test z przeglądarki

Otwórz w przeglądarce:
- `https://pactrack.pl` - powinien pokazać landing page (Kubernetes marketing)
- `https://app.pactrack.pl` - powinien pokazać główną aplikację (Kubernetes)

### 6.2 Test z curl

```bash
# Test pactrack.pl (Kubernetes marketing)
curl -I https://pactrack.pl

# Oczekiwany output:
# HTTP/2 200
# server: cloudflare
# ...

# Test app.pactrack.pl (Kubernetes)
curl -I https://app.pactrack.pl

# Oczekiwany output:
# HTTP/2 200
# server: cloudflare
# ...
```

### 6.3 Test SSL certyfikatu

```bash
# Sprawdź certyfikat SSL
openssl s_client -connect pactrack.pl:443 -servername pactrack.pl < /dev/null 2>/dev/null | openssl x509 -noout -issuer -dates

# Oczekiwany output:
# issuer=C = US, O = Cloudflare, Inc., CN = Cloudflare Inc ECC CA-3
# notBefore=...
# notAfter=...
```

---

## Troubleshooting

### Błąd: "DNS_PROBE_FINISHED_NXDOMAIN"

**Przyczyna:** DNS nie propagował się lub CNAME jest niepoprawny.

**Rozwiązanie:**
```bash
# Sprawdź DNS
dig pactrack.pl +short
dig app.pactrack.pl +short

# Poczekaj 5-10 minut i spróbuj ponownie
```

### Błąd: "ERR_TOO_MANY_REDIRECTS"

**Przyczyna:** SSL/TLS mode w Cloudflare jest ustawiony na "Flexible" zamiast "Full".

**Rozwiązanie:**
1. Cloudflare Dashboard → SSL/TLS
2. Zmień na **Full** lub **Full (strict)**

### Błąd: "522 Connection timed out"

**Przyczyna:** Cloudflare Tunnel nie działa lub nie może połączyć się z origin.

**Rozwiązanie:**
```bash
# Sprawdź status cloudflared na serwerze
ssh radek@192.168.1.9
sudo systemctl status cloudflared

# Sprawdź logi
sudo journalctl -u cloudflared -n 50
```

---

## Rollback (przywrócenie starych DNS)

Jeśli coś pójdzie nie tak, możesz przywrócić stare DNS:

1. W Cloudflare Dashboard → DNS → Records
2. Usuń CNAME records dla `pactrack.pl` i `app.pactrack.pl`
3. Dodaj stare A/CNAME records (jeśli miałeś backup)

**Przykład rollback:**
```
Type: A
Name: @
Content: 192.168.1.9 (lub stare IP)
Proxy: Proxied
```

---

## Koszty

**Cloudflare DNS jest DARMOWY** dla:
- Nieograniczona liczba DNS records
- Nieograniczona liczba zapytań DNS
- DDoS protection
- SSL certyfikaty

---

## Następne kroki

Po skonfigurowaniu DNS:
1. ✅ Przetestuj obie domeny w przeglądarce
2. ✅ Deploy marketing: `./docker/k8s_build_and_load_marketing.sh`
3. ✅ Przetestuj integrację Allegro (redirect URI: `app.pactrack.pl`)

---

## Linki

- [Cloudflare DNS Docs](https://developers.cloudflare.com/dns/)
- [CNAME Flattening](https://developers.cloudflare.com/dns/cname-flattening/)
- [SSL/TLS Modes](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/)
- [Cloudflare Tunnel DNS](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/routing-to-tunnel/dns/)
