#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Skrypt: Budowanie Docker image PacTrack Marketing i deploy na Kubernetes
#
# Użycie:  ./docker/k8s_build_and_load_marketing.sh
# Uruchamiać z katalogu głównego projektu: PacTrackMarketing/
#
# Co robi:
#   1. Buduje Docker image (Next.js standalone)
#   2. Zapisuje jako tar
#   3. Przesyła na serwer (SSH)
#   4. Ładuje do containerd (k8s.io namespace)
#   5. Deployuje przez Helm
###############################################################################

# ======================== KONFIGURACJA ========================
REMOTE_USER="radek"
REMOTE_HOST="192.168.1.9"
REMOTE_SSH="${REMOTE_USER}@${REMOTE_HOST}"
REMOTE_DIR="/tmp/pactrack-marketing-images"

# SSH ControlMaster
SSH_CONTROL_PATH="/tmp/ssh-marketing-${REMOTE_HOST}"

# Obrazy
MARKETING_IMAGE="pactrack-marketing:latest"

# Pliki tar
TAR_DIR="./docker/k8s-images"
MARKETING_TAR="${TAR_DIR}/pactrack-marketing.tar"

# Helm
HELM_CHART="helm/pactrack-marketing"
HELM_RELEASE="pactrack-marketing"
HELM_NAMESPACE="pactrack-marketing"
HELM_VALUES="helm/pactrack-marketing/values-preprod-kubeadm.yaml"

# ======================== FUNKCJE ========================
info()  { echo -e "\n\033[1;34m==>\033[0m \033[1m$*\033[0m"; }
ok()    { echo -e "\033[1;32m    ✔ $*\033[0m"; }
err()   { echo -e "\033[1;31m    ✘ $*\033[0m" >&2; }

ssh_cmd() {
    ssh -o ControlPath="${SSH_CONTROL_PATH}" "$@"
}

scp_cmd() {
    scp -o ControlPath="${SSH_CONTROL_PATH}" "$@"
}

start_ssh_master() {
    info "Otwieranie połączenia SSH do ${REMOTE_SSH} (ControlMaster)..."
    echo "    Podaj hasło SSH (tylko raz):"
    ssh -M -f -N \
        -o ControlPath="${SSH_CONTROL_PATH}" \
        -o ControlPersist=600 \
        -o ConnectTimeout=10 \
        "${REMOTE_SSH}"
    ok "Połączenie SSH otwarte (ControlMaster)"
}

stop_ssh_master() {
    info "Zamykanie połączenia SSH ControlMaster..."
    ssh -o ControlPath="${SSH_CONTROL_PATH}" -O exit "${REMOTE_SSH}" 2>/dev/null || true
    ok "Połączenie zamknięte"
}

check_prereqs() {
    info "Sprawdzam wymagania lokalne..."
    command -v docker >/dev/null 2>&1 || { err "Docker nie jest zainstalowany lokalnie!"; exit 1; }
    command -v ssh    >/dev/null 2>&1 || { err "SSH nie jest dostępny!"; exit 1; }
    command -v scp    >/dev/null 2>&1 || { err "SCP nie jest dostępny!"; exit 1; }
    ok "Docker, SSH, SCP — OK"
}

check_remote() {
    info "Sprawdzam narzędzia na serwerze..."
    ssh_cmd "${REMOTE_SSH}" 'echo "[remote] ctr:    $(command -v ctr || echo MISSING)"'
    ssh_cmd "${REMOTE_SSH}" 'echo "[remote] containerd: $(systemctl is-active containerd 2>/dev/null || echo inactive)"'
    ssh_cmd "${REMOTE_SSH}" 'echo "[remote] kubelet:    $(systemctl is-active kubelet 2>/dev/null || echo inactive)"'
    ok "Narzędzia sprawdzone"
}

build_image() {
    mkdir -p "${TAR_DIR}"

    info "Budowanie marketing image: ${MARKETING_IMAGE}"
    docker build --no-cache -t "${MARKETING_IMAGE}" -f Dockerfile .
    ok "Marketing image zbudowany"
}

save_image() {
    info "Zapisywanie image do pliku tar..."
    docker save -o "${MARKETING_TAR}" "${MARKETING_IMAGE}"
    ok "Marketing → ${MARKETING_TAR}"
    echo ""
    ls -lh "${MARKETING_TAR}"
}

transfer_image() {
    info "Tworzenie katalogu na serwerze: ${REMOTE_DIR}"
    ssh_cmd "${REMOTE_SSH}" "mkdir -p ${REMOTE_DIR}"

    info "Przesyłanie image na ${REMOTE_SSH}:${REMOTE_DIR}/ ..."
    scp_cmd "${MARKETING_TAR}" "${REMOTE_SSH}:${REMOTE_DIR}/"
    ok "Image przesłany"
}

load_image_on_server() {
    info "Ładowanie image do containerd (k8s.io namespace) na serwerze..."
    echo "    UWAGA: Zostaniesz poproszony o hasło sudo NA SERWERZE."
    echo ""

    ssh_cmd -tt "${REMOTE_SSH}" '
        set -e
        REMOTE_DIR="/tmp/pactrack-marketing-images"

        echo "[remote] Importowanie obrazu do containerd (namespace k8s.io)..."

        echo "==> Ładowanie pactrack-marketing..."
        sudo ctr -n k8s.io images import ${REMOTE_DIR}/pactrack-marketing.tar
        echo "    ✔ pactrack-marketing załadowany"

        echo ""
        echo "==> Lista images w containerd (k8s.io):"
        sudo ctr -n k8s.io images ls | grep -E "pactrack-marketing" || true

        echo ""
        echo "==> Sprzątanie plików tar na serwerze..."
        rm -rf ${REMOTE_DIR}
        echo "    ✔ Pliki tar usunięte z serwera"
    '

    ok "Image załadowany na serwerze!"
}

deploy_and_restart() {
    info "Deployowanie i restart aplikacji..."
    echo ""

    echo "==> Ustawianie KUBECONFIG..."
    export KUBECONFIG=~/.kube/config

    echo "==> Upgrade Helm chart..."
    helm upgrade --install "${HELM_RELEASE}" "${HELM_CHART}" \
        -n "${HELM_NAMESPACE}" \
        --create-namespace \
        -f "${HELM_VALUES}"

    echo "==> Restart deployment..."
    kubectl rollout restart deployment/${HELM_RELEASE} -n "${HELM_NAMESPACE}"

    echo "==> Czekanie na rollout..."
    kubectl rollout status deployment/${HELM_RELEASE} -n "${HELM_NAMESPACE}" --timeout=120s

    ok "Aplikacja zdeployowana i zrestartowana!"
}

cleanup_local() {
    info "Sprzątanie lokalnych plików tar..."
    rm -rf "${TAR_DIR}"
    ok "Lokalne pliki tar usunięte"
}

# ======================== MAIN ========================
main() {
    echo "============================================================"
    echo "  PacTrack Marketing — Build & Load Image to Ubuntu Server"
    echo "  Serwer: ${REMOTE_SSH}"
    echo "============================================================"

    check_prereqs
    start_ssh_master
    check_remote
    build_image
    save_image
    transfer_image
    load_image_on_server
    stop_ssh_master
    deploy_and_restart
    cleanup_local

    echo ""
    info "GOTOWE! Image jest na serwerze ${REMOTE_HOST} i aplikacja została zdeployowana."
    echo ""
    echo "  Marketing site: https://pactrack.pl"
    echo "  Namespace:      ${HELM_NAMESPACE}"
    echo ""
}

main "$@"
