# 🚀 Enterprise CRM - Kompletny Quick Start

**Wszystko co potrzebujesz żeby uruchomić pełne środowisko developerskie z monitoringiem i backupami na VPS.**

## 🎯 Co otrzymasz w 10 minut

### 📊 **Kompletny Stack**
- **PostgreSQL 15** + **pgAdmin 4** - zarządzanie bazą danych
- **Portainer** - GUI dla Dockera
- **Grafana + Prometheus** - monitoring i metryki
- **Redis** - cache i sesje
- **Wszystkie mikroservisy** - API Gateway, OCR, Services, Quotes
- **Automatyczne backupy** - codziennie o 2:00
- **Zabezpieczenia VPS** - firewall, fail2ban

### 🖥️ **Porty i dostęp**
```
🌐 API Gateway:    http://your-vps-ip:3000
🗄️ pgAdmin:       http://your-vps-ip:5050
🐳 Portainer:     http://your-vps-ip:9000
📊 Grafana:       http://your-vps-ip:3010
📈 Prometheus:    http://your-vps-ip:9090
🐘 PostgreSQL:    your-vps-ip:5432
🔍 OCR Service:   http://your-vps-ip:8000
```

## ⚡ **Szybkie uruchomienie (3 kroki)**

### 1️⃣ **Skopiuj kod na VPS**
```bash
# Zaloguj się na VPS
ssh root@your-vps-ip

# Utwórz katalog aplikacji
mkdir -p /var/www/enterprise-crm
cd /var/www/enterprise-crm

# Skopiuj pliki (lub użyj git clone)
# scp -r . root@your-vps-ip:/var/www/enterprise-crm/
```

### 🪟 **Windows Development Setup**
```powershell
# W PowerShell jako Administrator:
cd path\to\enterprise-crm
.\setup-windows-ssh.ps1 -VpsIP "your-vps-ip" -VpsUser "your-user" -Email "your-email@example.com"

# Zainstaluj VSCode extensions:
# - Remote - SSH
# - GitLens
# - Docker
```

### 2️⃣ **Uruchom aplikację**
```bash
# Uruchom środowisko developerskie
./dev-deploy.sh
```

### 3️⃣ **Zabezpiecz VPS (opcjonalnie)**
```bash
# Uruchom skrypt zabezpieczeń
sudo ./secure-vps.sh

# Ustaw automatyczne backupy
./setup-cron.sh
```

**🎉 GOTOWE! Twoja aplikacja działa!**

## 🔐 **Dane logowania**

### pgAdmin (http://your-vps-ip:5050)
- **Email**: `admin@enterprise.local`
- **Hasło**: `devpassword123`

### Grafana (http://your-vps-ip:3010)
- **User**: `admin`
- **Hasło**: `devpassword123`

### Portainer (http://your-vps-ip:9000)
- **Przy pierwszym uruchomieniu ustaw hasło administratora**

### PostgreSQL (your-vps-ip:5432)
- **Database**: `enterprise_crm`
- **User**: `postgres`
- **Hasło**: `devpassword123`

## 🛠️ **Przydatne komendy**

### Zarządzanie aplikacją
```bash
# Status kontenerów
docker-compose -f docker-compose.dev.yml ps

# Logi wszystkich serwisów
docker-compose -f docker-compose.dev.yml logs -f

# Restart serwisu
docker-compose -f docker-compose.dev.yml restart [service_name]

# Zatrzymaj wszystko
docker-compose -f docker-compose.dev.yml down

# Uruchom ponownie
./dev-deploy.sh
```

### Backup i restore
```bash
# Ręczny backup
./auto-backup.sh

# Lista backupów
ls -la /var/backups/enterprise-crm/

# Restore bazy danych
docker-compose -f docker-compose.dev.yml exec -T postgres psql \
  -U postgres -d enterprise_crm < backup.sql
```

### Monitoring i logi
```bash
# Status systemu
htop
df -h
free -h

# Logi bezpieczeństwa
tail -f /var/log/security-monitor.log
tail -f /var/log/fail2ban.log

# Logi backupów
tail -f /var/log/enterprise-crm-backup.log
```

## 📊 **Dashboardy i monitoring**

### Grafana - Metryki systemu
- **URL**: http://your-vps-ip:3010
- **Dostępność serwisów** - czy wszystko działa
- **Wykorzystanie CPU/RAM** - wydajność systemu
- **Można dodać własne dashboardy**

### Prometheus - Surowe metryki  
- **URL**: http://your-vps-ip:9090
- **Surowe dane** dla zaawansowanych użytkowników
- **Queries** dla custom metryk

### Portainer - Zarządzanie Docker
- **URL**: http://your-vps-ip:9000
- **Graficzny interfejs** do zarządzania kontenerami
- **Logi, statystyki, restart** - wszystko z przeglądarki

## 🔥 **Najczęściej używane funkcje**

### 1. **Sprawdź status wszystkich serwisów**
```bash
curl http://your-vps-ip:3000/health
# lub w Portainer: Containers -> Quick actions
```

### 2. **Restart jeśli coś nie działa**
```bash
./dev-deploy.sh
# lub w Portainer: Container -> Restart
```

### 3. **Sprawdź logi błędów**
```bash
docker-compose -f docker-compose.dev.yml logs api-gateway
docker-compose -f docker-compose.dev.yml logs postgres
# lub w Portainer: Container -> Logs
```

### 4. **Backup przed zmianami**
```bash
./auto-backup.sh
# Backupy w: /var/backups/enterprise-crm/
```

## 🆘 **Rozwiązywanie problemów**

### Problem: Kontenery nie startują
```bash
# Sprawdź logi
docker-compose -f docker-compose.dev.yml logs

# Sprawdź zasoby systemu
df -h  # Miejsce na dysku
free -h  # RAM
```

### Problem: Nie można połączyć się z bazą
```bash
# Test połączenia
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres

# Restart bazy
docker-compose -f docker-compose.dev.yml restart postgres
```

### Problem: Frontend nie łączy się z API
```bash
# Sprawdź API Gateway
curl http://your-vps-ip:3000/health

# Sprawdź konfigurację CORS w API Gateway
docker-compose -f docker-compose.dev.yml logs api-gateway
```

### Problem: OCR nie działa
```bash
# Test OCR
curl http://your-vps-ip:8000/health

# Logi OCR Service
docker-compose -f docker-compose.dev.yml logs ocr-service
```

## 🔒 **Bezpieczeństwo**

### Co robi skrypt `secure-vps.sh`:
- ✅ **UFW Firewall** - blokuje niepotrzebne porty
- ✅ **Fail2Ban** - banuje boty próbujące się włamać
- ✅ **Automatyczne aktualizacje** bezpieczeństwa
- ✅ **Monitoring logów** - wykrywa podejrzane aktywności
- ⚠️ **Zmień domyślne hasła** na produkcji!

### Dodatkowe rekomendacje:
```bash
# 1. Zmień port SSH z 22 na inny
sudo nano /etc/ssh/sshd_config
# Port 2222

# 2. Wyłącz logowanie rootem
# PermitRootLogin no

# 3. Użyj kluczy SSH zamiast haseł
# PasswordAuthentication no
```

## 📈 **Następne kroki**

### Przygotowanie do produkcji:
1. **Zmień wszystkie hasła** w .env.prod
2. **Ustaw SSL certyfikaty** (Let's Encrypt)
3. **Skonfiguruj domain** i DNS
4. **Użyj docker-compose.prod.yml** zamiast dev
5. **Włącz HTTPS** w nginx

### Rozwój aplikacji:
1. **Frontend lokalnie**: `cd frontend && npm start`
2. **Hot reload** dla backend services
3. **Debugowanie** przez porty bezpośrednie
4. **Testy** przez Playwright w Grafana

---

## 🎉 **Gratulacje!**

Masz teraz **kompletne środowisko developerskie** z:
- ✅ Bazą danych PostgreSQL + pgAdmin
- ✅ Monitoringiem Grafana + Prometheus  
- ✅ Zarządzaniem Docker przez Portainer
- ✅ Automatycznymi backupami
- ✅ Zabezpieczonym VPS
- ✅ Wszystkimi mikroservisami

**Możesz teraz rozwijać swoją aplikację Enterprise CRM!** 🚀