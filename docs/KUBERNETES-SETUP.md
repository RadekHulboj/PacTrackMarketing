# Kubernetes Setup — PacTrack Marketing

Instrukcja deploymentu PacTrack Marketing na on-prem Kubernetes (kubeadm).

---

## Architektura

```
Internet
    ↓
Cloudflare Edge (DNS + CDN + SSL)
    ↓
Cloudflare Tunnel (cloudflared na 192.168.1.9)
    ↓
NGINX Ingress Controller (localhost:80)
    ├─ pactrack.pl     → pactrack-marketing:3000 (namespace: pactrack-marketing)
    └─ app.pactrack.pl → frontend:80 / backend:8080 (namespace: parcel-tracking)
```

---

## Wymagania

- Docker (lokalnie, do budowania images)
- SSH do serwera 192.168.1.9
- Kubernetes (kubeadm) na serwerze
- Helm 3.x
- NGINX Ingress Controller zainstalowany w klastrze
- Cloudflare Tunnel skonfigurowany

---

## Szybki deploy (jeden skrypt)

```bash
cd /home/radek/Projects/hulboj/PacTrackMarketing
./docker/k8s_build_and_load_marketing.sh
```

Skrypt automatycznie:
1. Buduje Docker image (`pactrack-marketing:latest`)
2. Zapisuje jako tar i przesyła na serwer (SSH)
3. Ładuje do containerd (namespace k8s.io)
4. Deployuje przez Helm na Kubernetes

---

## Ręczny deploy (krok po kroku)

### 1. Budowanie Docker image

```bash
cd /home/radek/Projects/hulboj/PacTrackMarketing
docker build --no-cache -t pactrack-marketing:latest -f Dockerfile .
```

### 2. Przesłanie na serwer

```bash
docker save -o pactrack-marketing.tar pactrack-marketing:latest
scp pactrack-marketing.tar radek@192.168.1.9:/tmp/
```

### 3. Załadowanie do containerd

```bash
ssh radek@192.168.1.9
sudo ctr -n k8s.io images import /tmp/pactrack-marketing.tar
rm /tmp/pactrack-marketing.tar
```

### 4. Deploy przez Helm

```bash
helm upgrade --install pactrack-marketing helm/pactrack-marketing \
    -n pactrack-marketing \
    --create-namespace \
    -f helm/pactrack-marketing/values-preprod-kubeadm.yaml
```

### 5. Restart (po aktualizacji image)

```bash
kubectl rollout restart deployment/pactrack-marketing -n pactrack-marketing
kubectl rollout status deployment/pactrack-marketing -n pactrack-marketing --timeout=120s
```

---

## Helm Chart

```
helm/pactrack-marketing/
├── Chart.yaml
├── values.yaml                    # Domyślne wartości
├── values-preprod-kubeadm.yaml    # On-prem kubeadm
└── templates/
    ├── deployment.yaml
    ├── service.yaml
    ├── ingress.yaml
    ├── _helpers.tpl
    └── NOTES.txt
```

**Konfiguracja:**
- Namespace: `pactrack-marketing`
- Image: `pactrack-marketing:latest`
- Port: 3000 (Next.js standalone)
- Service: ClusterIP
- Ingress: NGINX, host: `pactrack.pl`
- TLS: wyłączone (SSL termination w Cloudflare)

---

## Cloudflare Tunnel

Po deploymencie na Kubernetes, zaktualizuj `/etc/cloudflared/config.yml` na serwerze:

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /home/radek/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: pactrack.pl
    service: http://localhost:80
  - hostname: app.pactrack.pl
    service: http://localhost:80
  - service: http_status:404
```

Obie domeny kierują na localhost:80 (NGINX Ingress), a Ingress rozróżnia je po nagłówku `Host`.

```bash
sudo systemctl restart cloudflared
```

---

## Weryfikacja

```bash
# Status podów
kubectl get pods -n pactrack-marketing

# Status deployment
kubectl get deployment -n pactrack-marketing

# Status ingress
kubectl get ingress -n pactrack-marketing

# Logi
kubectl logs -n pactrack-marketing -l app.kubernetes.io/name=pactrack-marketing -f

# Test z serwera
curl -H "Host: pactrack.pl" http://localhost:80
```

---

## Troubleshooting

### Pod nie startuje

```bash
kubectl describe pod -n pactrack-marketing -l app.kubernetes.io/name=pactrack-marketing
kubectl logs -n pactrack-marketing -l app.kubernetes.io/name=pactrack-marketing --previous
```

### Image not found

```bash
# Sprawdź czy image jest w containerd
ssh radek@192.168.1.9 'sudo ctr -n k8s.io images ls | grep pactrack-marketing'
```

### Ingress nie działa

```bash
# Sprawdź NGINX Ingress Controller
kubectl get pods -n ingress-nginx
kubectl get ingress -n pactrack-marketing
```

---

## Usunięcie

```bash
helm uninstall pactrack-marketing -n pactrack-marketing
kubectl delete namespace pactrack-marketing
```
