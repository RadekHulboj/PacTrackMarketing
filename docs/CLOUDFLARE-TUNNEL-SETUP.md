# Cloudflare Tunnel - Setup Guide

Instrukcja instalacji i konfiguracji Cloudflare Tunnel na Ubuntu Server 192.168.1.9 dla routingu ruchu do `pactrack.pl` (Azure SWA) i `app.pactrack.pl` (Kubernetes).

---

## Architektura

```
Internet
    ↓
Cloudflare Edge (DNS + CDN + SSL)
    ↓
Cloudflare Tunnel (cloudflared na 192.168.1.9)
    ├─ pactrack.pl → Azure Static Web Apps
    └─ app.pactrack.pl → Kubernetes Ingress (localhost:80)
```

**Korzyści:**
- ✅ Brak potrzeby publicznego IP dla serwera on-prem
- ✅ Automatyczne SSL certyfikaty (Cloudflare)
- ✅ DDoS protection (Cloudflare)
- ✅ Jeden tunnel dla obu domen

---

## Wymagania

- Ubuntu Server 192.168.1.9 (on-prem)
- Konto Cloudflare z domeną `pactrack.pl`
- Dostęp SSH do serwera
- Kubernetes działa na porcie 80 (NGINX Ingress)

---

## Krok 1: Instalacja cloudflared

### 1.1 Pobranie i instalacja

SSH do serwera:
```bash
ssh radek@192.168.1.9
```

Pobierz i zainstaluj cloudflared:
```bash
# Pobierz najnowszą wersję
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64

# Nadaj uprawnienia
chmod +x cloudflared-linux-amd64

# Przenieś do /usr/local/bin
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Weryfikacja
cloudflared --version
```

Oczekiwany output:
```
cloudflared version 2024.x.x (built ...)
```

---

## Krok 2: Autentykacja z Cloudflare

### 2.1 Login do Cloudflare

```bash
cloudflared tunnel login
```

**Co się stanie:**
1. Otworzy się przeglądarka (lub dostaniesz URL do otwarcia)
2. Zaloguj się do Cloudflare
3. Wybierz domenę `pactrack.pl`
4. Kliknij "Authorize"

Cloudflared zapisze certyfikat w `~/.cloudflared/cert.pem`.

### 2.2 Weryfikacja certyfikatu

```bash
ls -la ~/.cloudflared/
```

Powinien być plik `cert.pem` (~2-3 KB).

---

## Krok 3: Stworzenie Tunnel

### 3.1 Stwórz tunnel

```bash
cloudflared tunnel create pactrack-tunnel
```

Output:
```
Tunnel credentials written to /home/radek/.cloudflared/<TUNNEL_ID>.json
Created tunnel pactrack-tunnel with id <TUNNEL_ID>
```

**Zapisz TUNNEL_ID - będzie potrzebny w konfiguracji!**

### 3.2 Lista tunnels

```bash
cloudflared tunnel list
```

Powinien być widoczny `pactrack-tunnel`.

---

## Krok 4: Konfiguracja Tunnel

### 4.1 Stwórz katalog konfiguracji

```bash
sudo mkdir -p /etc/cloudflared
```

### 4.2 Stwórz plik konfiguracji

**WAŻNE:** Zamień `<TUNNEL_ID>` na rzeczywisty ID z Kroku 3.1!

```bash
sudo nano /etc/cloudflared/config.yml
```

Wklej (zamień `<TUNNEL_ID>` i `<AZURE_SWA_URL>`):
```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/radek/.cloudflared/<TUNNEL_ID>.json

# Routing rules
ingress:
  # pactrack.pl → Azure Static Web Apps
  - hostname: pactrack.pl
    service: https://pactrack-landing.azurestaticapps.net
    originRequest:
      noTLSVerify: false
  
  # app.pactrack.pl → Kubernetes Ingress
  - hostname: app.pactrack.pl
    service: http://localhost:80
    originRequest:
      noTLSVerify: true
  
  # Catch-all (404)
  - service: http_status:404
```

**Wyjaśnienie:**
- `pactrack.pl` → proxy do Azure SWA (HTTPS)
- `app.pactrack.pl` → proxy do Kubernetes NGINX Ingress (HTTP localhost:80)
- Catch-all → zwraca 404 dla nieznanych domen

### 4.3 Skopiuj credentials file

```bash
sudo cp /home/radek/.cloudflared/<TUNNEL_ID>.json /etc/cloudflared/
sudo chown root:root /etc/cloudflared/<TUNNEL_ID>.json
sudo chmod 600 /etc/cloudflared/<TUNNEL_ID>.json
```

### 4.4 Weryfikacja konfiguracji

```bash
sudo cloudflared tunnel ingress validate
```

Oczekiwany output:
```
Validating rules from /etc/cloudflared/config.yml
OK
```

---

## Krok 5: Test Tunnel (przed systemd)

### 5.1 Test ręczny

```bash
cloudflared tunnel --config /etc/cloudflared/config.yml run pactrack-tunnel
```

Powinno pokazać:
```
INF Connection registered connIndex=0 location=WAW
INF Connection registered connIndex=1 location=FRA
```

**Zostaw terminal otwarty i przetestuj w nowej sesji SSH.**

### 5.2 Test routingu

W nowej sesji SSH:
```bash
# Test app.pactrack.pl → Kubernetes
curl -H "Host: app.pactrack.pl" http://localhost:80

# Test pactrack.pl → Azure SWA (wymaga DNS)
# (na razie nie zadziała - DNS będzie w następnym kroku)
```

Jeśli Kubernetes zwraca odpowiedź - routing działa!

**Zatrzymaj tunnel:** Ctrl+C w pierwszym terminalu.

---

## Krok 6: Instalacja jako systemd service

### 6.1 Instalacja service

```bash
sudo cloudflared service install
```

Output:
```
systemd service installed successfully
```

### 6.2 Start service

```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### 6.3 Weryfikacja statusu

```bash
sudo systemctl status cloudflared
```

Oczekiwany output:
```
● cloudflared.service - cloudflared
     Loaded: loaded (/etc/systemd/system/cloudflared.service; enabled)
     Active: active (running) since ...
```

### 6.4 Sprawdź logi

```bash
sudo journalctl -u cloudflared -f
```

Powinno pokazać:
```
INF Connection registered connIndex=0 location=WAW
INF Connection registered connIndex=1 location=FRA
```

**Ctrl+C aby wyjść z logów.**

---

## Krok 7: Konfiguracja DNS w Cloudflare

**UWAGA:** Ten krok jest opisany szczegółowo w `CLOUDFLARE-DNS-SETUP.md`.

Krótko:
1. Przejdź do Cloudflare Dashboard → DNS
2. Dodaj CNAME records:
   - `pactrack.pl` → `<TUNNEL_ID>.cfargotunnel.com`
   - `app.pactrack.pl` → `<TUNNEL_ID>.cfargotunnel.com`
3. Dodaj TXT record dla Azure SWA verification

---

## Krok 8: Test końcowy

### 8.1 Test z internetu

```bash
# Test app.pactrack.pl (Kubernetes)
curl -I https://app.pactrack.pl

# Test pactrack.pl (Azure SWA)
curl -I https://pactrack.pl
```

### 8.2 Test SSL

```bash
# Sprawdź certyfikat SSL
openssl s_client -connect app.pactrack.pl:443 -servername app.pactrack.pl < /dev/null 2>/dev/null | openssl x509 -noout -text | grep "Issuer"
```

Powinno pokazać: `Issuer: C = US, O = Cloudflare, Inc.`

---

## Troubleshooting

### Błąd: "tunnel credentials file not found"

**Przyczyna:** Credentials file nie jest w `/etc/cloudflared/`.

**Rozwiązanie:**
```bash
sudo cp ~/.cloudflared/<TUNNEL_ID>.json /etc/cloudflared/
sudo chmod 600 /etc/cloudflared/<TUNNEL_ID>.json
```

### Błąd: "connection refused" do localhost:80

**Przyczyna:** Kubernetes Ingress nie działa na porcie 80.

**Rozwiązanie:**
```bash
# Sprawdź czy NGINX Ingress działa
kubectl get svc -n ingress-nginx

# Powinno być:
# ingress-nginx-controller   NodePort   10.x.x.x   <none>   80:xxxxx/TCP,443:xxxxx/TCP
```

### Błąd: "no such tunnel"

**Przyczyna:** Tunnel ID w config.yml nie zgadza się z rzeczywistym.

**Rozwiązanie:**
```bash
# Sprawdź listę tunnels
cloudflared tunnel list

# Zaktualizuj config.yml z poprawnym TUNNEL_ID
```

### Tunnel nie startuje po reboot

**Rozwiązanie:**
```bash
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

---

## Zarządzanie Tunnel

### Restart tunnel

```bash
sudo systemctl restart cloudflared
```

### Stop tunnel

```bash
sudo systemctl stop cloudflared
```

### Logi w czasie rzeczywistym

```bash
sudo journalctl -u cloudflared -f
```

### Zmiana konfiguracji

1. Edytuj `/etc/cloudflared/config.yml`
2. Zwaliduj: `sudo cloudflared tunnel ingress validate`
3. Restart: `sudo systemctl restart cloudflared`

---

## Usunięcie Tunnel (rollback)

```bash
# Stop service
sudo systemctl stop cloudflared
sudo systemctl disable cloudflared

# Usuń service
sudo cloudflared service uninstall

# Usuń tunnel z Cloudflare
cloudflared tunnel delete pactrack-tunnel

# Usuń pliki
sudo rm -rf /etc/cloudflared
rm -rf ~/.cloudflared
```

---

## Koszty

**Cloudflare Tunnel jest DARMOWY** - nie ma żadnych opłat za:
- Bandwidth (nieograniczony transfer)
- Liczba tunnels
- Liczba domen

---

## Następne kroki

Po skonfigurowaniu Cloudflare Tunnel:
1. ✅ Dodaj DNS records w Cloudflare (patrz: `CLOUDFLARE-DNS-SETUP.md`)
2. ✅ Przetestuj routing dla obu domen
3. ✅ Upgrade Helm chart dla `app.pactrack.pl`

---

## Linki

- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Tunnel Configuration](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/)
- [Ingress Rules](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/local-management/ingress/)
