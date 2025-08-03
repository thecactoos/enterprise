# 🛠️ Enterprise CRM - Development Setup Guide

Konfiguracja środowiska developerskiego z PostgreSQL i pgAdmin na VPS.

## 🎯 Co otrzymasz

- **PostgreSQL 15** - baza danych z pełnymi danymi testowymi
- **pgAdmin 4** - graficzny interfejs do zarządzania bazą danych
- **Redis** - cache i sesje
- **Wszystkie mikroservisy** - z hot reload i debugowaniem
- **Nginx** - reverse proxy dla API
- **Automatyczne konfiguracje** - gotowe połączenia i ustawienia

## 🚀 Szybki Start

### 1. Skopiuj kod na VPS
```bash
# Skopiuj pliki na serwer
scp -r . user@your-vps-ip:/var/www/enterprise-crm/
# lub użyj git clone

cd /var/www/enterprise-crm
```

### 2. Uruchom środowisko developerskie
```bash
# Uruchom skrypt developerski
./dev-deploy.sh
```

### 3. Dostęp do serwisów
- **pgAdmin**: http://your-vps-ip:5050
  - Email: `admin@enterprise.local`
  - Hasło: `devpassword123`
- **API Gateway**: http://your-vps-ip:3000
- **PostgreSQL**: `your-vps-ip:5432`

## 📊 pgAdmin - Zarządzanie bazą danych

### Automatyczne połączenie
pgAdmin automatycznie łączy się z bazą danych:
- **Serwer**: `Enterprise CRM Database`
- **Host**: `postgres` (wewnętrzna nazwa kontenera)
- **Port**: `5432`
- **Database**: `enterprise_crm`
- **Username**: `postgres`
- **Password**: `devpassword123`

### Przydatne zapytania SQL

#### Sprawdź wszystkie tabele
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

#### Statystyki kontaktów
```sql
SELECT 
    status,
    COUNT(*) as count,
    AVG("estimatedValue") as avg_value
FROM leads 
GROUP BY status;
```

#### Aktywność użytkowników
```sql
SELECT * FROM user_activity;
```

## 🔧 Konfiguracja serwisów

### Porty i adresy
```
PostgreSQL: your-vps-ip:5432
pgAdmin:    your-vps-ip:5050
Redis:      your-vps-ip:6379
API Gateway: your-vps-ip:3000
OCR Service: your-vps-ip:8000
Services API: your-vps-ip:3001
Quotes API:   your-vps-ip:3002
```

### Zmienne środowiskowe (.env.dev)
```bash
# Database
POSTGRES_DB=enterprise_crm
POSTGRES_USER=postgres
POSTGRES_PASSWORD=devpassword123

# pgAdmin
PGADMIN_EMAIL=admin@enterprise.local
PGADMIN_PASSWORD=devpassword123

# JWT
JWT_SECRET=dev-jwt-secret-key-32-characters-long

# Redis
REDIS_PASSWORD=devredis123
```

## 💻 Frontend Development

### Lokalne uruchomienie frontendu
```bash
cd frontend
npm install
npm start
```

### Konfiguracja API URL
W `frontend/.env`:
```bash
REACT_APP_API_BASE_URL=http://your-vps-ip:3000
```

## 🗄️ Zarządzanie bazą danych

### Backup bazy danych
```bash
# Utwórz backup
docker-compose -f docker-compose.dev.yml exec postgres pg_dump \
  -U postgres -d enterprise_crm --clean --if-exists > backup.sql
```

### Restore bazy danych
```bash
# Przywróć z backupu
docker-compose -f docker-compose.dev.yml exec -T postgres psql \
  -U postgres -d enterprise_crm < backup.sql
```

### Reset bazy danych
```bash
# Zatrzymaj, usuń dane i uruchom ponownie
docker-compose -f docker-compose.dev.yml down -v
./dev-deploy.sh
```

## 🔍 Debugging i monitorowanie

### Logi serwisów
```bash
# Wszystkie logi
docker-compose -f docker-compose.dev.yml logs -f

# Logi konkretnego serwisu
docker-compose -f docker-compose.dev.yml logs -f postgres
docker-compose -f docker-compose.dev.yml logs -f api-gateway
docker-compose -f docker-compose.dev.yml logs -f ocr-service
```

### Status kontenerów
```bash
docker-compose -f docker-compose.dev.yml ps
```

### Ressources usage
```bash
docker stats
```

## 🛠️ Przydatne komendy

### Restart serwisu
```bash
docker-compose -f docker-compose.dev.yml restart [service_name]
```

### Rebuild serwisu
```bash
docker-compose -f docker-compose.dev.yml build --no-cache [service_name]
docker-compose -f docker-compose.dev.yml up -d [service_name]
```

### Połączenie z bazą przez terminal
```bash
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d enterprise_crm
```

### Dodanie nowego użytkownika testowego
```sql
INSERT INTO users ("firstName", "lastName", email, "passwordHash", role, status) 
VALUES ('Jan', 'Testowy', 'jan@test.pl', '$2a$10$example_hash', 'sales', 'active');
```

## 🔒 Bezpieczeństwo Development

⚠️ **UWAGI BEZPIECZEŃSTWA**:
- Hasła są proste dla development - **ZMIEŃ je na produkcji**
- Porty są otwarte - użyj firewalla na VPS
- Debug mode jest włączony - wyłącz na produkcji

### Podstawowe zabezpieczenie VPS
```bash
# Firewall
sudo ufw allow 22    # SSH
sudo ufw allow 5050  # pgAdmin
sudo ufw allow 3000  # API Gateway
sudo ufw --force enable

# Zmiana portu SSH (opcjonalnie)
sudo nano /etc/ssh/sshd_config
# Port 2222
sudo systemctl restart ssh
```

## 📈 Rekomendacje dodatkowe

### 1. Monitoring
Rozważ dodanie:
- **Portainer** - GUI dla Dockera
- **Grafana + Prometheus** - monitoring i metryki
- **ELK Stack** - centralne logi

### 2. Backup automatyczny
```bash
# Dodaj do crona (codziennie o 2:00)
0 2 * * * cd /var/www/enterprise-crm && ./backup.sh
```

### 3. SSL dla pgAdmin (opcjonalnie)
```bash
# Nginx proxy dla pgAdmin z SSL
# Dodaj do nginx/dev.conf:
location /pgadmin/ {
    proxy_pass http://pgadmin:80/;
    # ... inne ustawienia
}
```

## 🆘 Troubleshooting

### Problem: pgAdmin nie może połączyć się z bazą
```bash
# Sprawdź status bazy
docker-compose -f docker-compose.dev.yml exec postgres pg_isready -U postgres

# Sprawdź logi
docker-compose -f docker-compose.dev.yml logs postgres
```

### Problem: Frontend nie może połączyć się z API
```bash
# Sprawdź API Gateway
curl http://your-vps-ip:3000/health

# Sprawdź konfigurację CORS w API Gateway
```

### Problem: OCR Service nie działa
```bash
# Sprawdź logi OCR
docker-compose -f docker-compose.dev.yml logs ocr-service

# Test OCR endpoint
curl http://your-vps-ip:8000/health
```

---

**🎉 Twoje środowisko developerskie jest gotowe!**

Zaloguj się do pgAdmin na http://your-vps-ip:5050 i zarządzaj swoją bazą danych PostgreSQL w wygodny sposób!