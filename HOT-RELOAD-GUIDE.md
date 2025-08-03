# 🔥 Hot Reload - Jak to działa

**Kompletny przewodnik hot reload dla Enterprise CRM na czystym Ubuntu VPS**

## 🎯 **Jak hot reload jest zaimplementowany**

### **Volume mapping w docker-compose.dev.yml:**

#### **Node.js Services (API Gateway, Services, Quotes):**
```yaml
volumes:
  - ./api-gateway:/app          # Kod z VPS → kontener
  - /app/node_modules           # node_modules zostają w kontenerze
```

#### **Python OCR Service:**
```yaml
volumes:
  - ./ocr-service:/app          # Kod z VPS → kontener
  - ocr_dev_uploads:/app/uploads # Pliki OCR persistentne
```

### **Development mode w Dockerfile:**
- **Node.js**: `nodemon` automatycznie restartuje przy zmianie plików
- **Python**: `uvicorn --reload` restartuje przy zmianie .py
- **Frontend**: `webpack-dev-server` (jeśli uruchomisz lokalnie)

## 🛠️ **Setup na czystym Ubuntu VPS**

### **1. Przygotowanie VPS (czyste Ubuntu)**

#### **Update systemu:**
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim htop
```

#### **Instalacja Docker:**
```bash
# Usuń stare wersje
sudo apt remove docker docker-engine docker.io containerd runc

# Instalacja Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Dodaj użytkownika do grupy docker
sudo usermod -aG docker $USER
newgrp docker

# Test instalacji
docker --version
```

#### **Instalacja Docker Compose:**
```bash
# Instalacja najnowszej wersji
# Docker Compose jest teraz plugin
# Zainstalowane automatycznie z Docker

# Test instalacji
docker compose version
```

### **2. Upload kodu na VPS**

#### **Opcja A: Git clone (REKOMENDOWANE)**
```bash
# Utwórz katalog
sudo mkdir -p /var/www/enterprise-crm
sudo chown $USER:$USER /var/www/enterprise-crm
cd /var/www/enterprise-crm

# Clone repository
git clone https://github.com/your-username/enterprise-crm.git .
```

#### **Opcja B: SCP z Windows**
```powershell
# Z Windows PowerShell:
scp -r C:\path\to\enterprise-crm\* user@your-vps-ip:/var/www/enterprise-crm/
```

#### **Opcja C: VSCode Remote SSH (po połączeniu)**
```
1. Połącz się VSCode Remote SSH
2. File → Open Folder → /var/www/enterprise-crm
3. Skopiuj pliki przez VSCode
```

### **3. Uruchomienie z hot reload**

#### **Podstawowe uruchomienie:**
```bash
cd /var/www/enterprise-crm

# Uruchom development environment
./dev-deploy.sh
```

#### **Manual startup (jeśli skrypt nie działa):**
```bash
# Skopiuj environment variables
cp .env.dev.example .env.dev

# Build i start
export DOCKER_BUILDKIT=0
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
```

## 🔥 **Test hot reload**

### **Test 1: Node.js Service (API Gateway)**
```bash
# 1. W VSCode Remote edytuj:
/var/www/enterprise-crm/api-gateway/src/app.controller.ts

# Dodaj nowy endpoint:
@Get('/test-hot-reload')
getTestHotReload() {
  return { message: 'Hot reload works!', timestamp: new Date() };
}

# 2. Zapisz plik (Ctrl+S)

# 3. Sprawdź logi w Portainer lub terminal:
docker compose -f docker-compose.dev.yml logs -f api-gateway

# Powinno być:
# [nodemon] restarting due to changes...
# [nodemon] starting `node dist/main.js`

# 4. Test w przeglądarce:
curl http://your-vps-ip:3000/test-hot-reload
```

### **Test 2: Python OCR Service**
```bash
# 1. Edytuj w VSCode Remote:
/var/www/enterprise-crm/ocr-service/app/main.py

# Dodaj endpoint:
@app.get("/test-reload")
async def test_reload():
    return {"message": "Python hot reload works!", "timestamp": datetime.now()}

# 2. Zapisz plik

# 3. Sprawdź logi:
docker compose -f docker-compose.dev.yml logs -f ocr-service

# Powinno być:
# INFO: Will watch for changes in these directories: ['/app']
# INFO: Uvicorn running on http://0.0.0.0:8000

# 4. Test:
curl http://your-vps-ip:8000/test-reload
```

## 🐛 **Troubleshooting hot reload**

### **Problem: Hot reload nie działa**

#### **1. Sprawdź volume mounting:**
```bash
# Sprawdź czy volumes są prawidłowo zamountowane
docker inspect enterprise-api-gateway-dev | grep -A 10 "Mounts"

# Powinno być:
# "Source": "/var/www/enterprise-crm/api-gateway",
# "Destination": "/app",
```

#### **2. Sprawdź permissions:**
```bash
# Sprawdź właściciela plików
ls -la /var/www/enterprise-crm/

# Jeśli potrzeba, zmień właściciela:
sudo chown -R $USER:$USER /var/www/enterprise-crm/
```

#### **3. Sprawdź czy nodemon/uvicorn jest w dev mode:**
```bash
# Node.js - sprawdź package.json:
cat api-gateway/package.json | grep -A 5 '"scripts"'

# Powinno być:
# "start:dev": "nodemon",
# "start:debug": "nodemon --config nodemon-debug.json",

# Python - sprawdź Dockerfile:
cat ocr-service/Dockerfile | grep uvicorn

# Powinno być:
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

#### **4. Restart kontenera:**
```bash
# Restart pojedynczy serwis
docker compose -f docker-compose.dev.yml restart api-gateway

# Restart wszystkich
docker compose -f docker-compose.dev.yml restart
```

### **Problem: Zmiany nie są widoczne**

#### **1. Force rebuild:**
```bash
# Rebuild bez cache
docker compose -f docker-compose.dev.yml build --no-cache api-gateway
docker compose -f docker-compose.dev.yml up -d api-gateway
```

#### **2. Sprawdź logi:**
```bash
# Szukaj błędów kompilacji
docker compose -f docker-compose.dev.yml logs api-gateway | grep -i error
```

#### **3. Sprawdź czy plik jest w kontenerze:**
```bash
# Wejdź do kontenera i sprawdź
docker exec -it enterprise-api-gateway-dev bash
ls -la /app/src/
cat /app/src/app.controller.ts
```

## ⚡ **Optymalizacja hot reload**

### **1. Exclude node_modules z watchingu:**
```yaml
# W docker-compose.dev.yml już jest:
volumes:
  - ./api-gateway:/app
  - /app/node_modules    # Exclude node_modules
```

### **2. Zwiększ limit inotify (Linux):**
```bash
# Dodaj do /etc/sysctl.conf:
echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### **3. Use .dockerignore:**
```bash
# W każdym serwisie utwórz .dockerignore:
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.vscode
```

## 📊 **Monitoring hot reload**

### **W Portainer:**
1. **Containers** → Click na container
2. **Logs** → Enable "Auto-refresh" 
3. **Stats** → Monitor CPU/RAM usage podczas reload

### **W terminal:**
```bash
# Monitoring zmian plików
watch -n 1 'ls -la /var/www/enterprise-crm/api-gateway/src/'

# Monitoring kontenerów
watch -n 2 'docker stats --no-stream'

# Tail logs wszystkich serwisów
docker compose -f docker-compose.dev.yml logs -f
```

## 🎯 **Best Practices**

### **1. Szybki development cycle:**
```
1. Edit w VSCode Remote → Auto save (Ctrl+S)
2. Watch logs w Portainer → Auto refresh
3. Test w browser → Refresh (F5)
4. Repeat
```

### **2. Multi-monitor setup:**
```
🖥️ Monitor 1: VSCode Remote
🖥️ Monitor 2: Browser (Portainer + App testing)
📱 Phone: Portainer Mobile (status monitoring)
```

### **3. Git workflow z hot reload:**
```bash
# Feature branch development
git checkout -b feature/awesome-feature

# Edit → Save → Test cycle
# (Hot reload automatyczny)

# Commit gdy feature gotowe
git add .
git commit -m "feat: awesome feature"
git push origin feature/awesome-feature
```

## 🎉 **Summary**

**Hot reload działa automatycznie dzięki:**
- ✅ **Volume mapping** - kod z VPS mapowany do kontenerów
- ✅ **Nodemon** - auto-restart Node.js przy zmianach
- ✅ **Uvicorn --reload** - auto-restart Python przy zmianach  
- ✅ **Development Dockerfiles** - optymalizacja pod development

**Na czystym Ubuntu potrzebujesz tylko:**
1. **Docker + Docker Compose** - instalacja
2. **Kod na VPS** - git clone lub scp
3. **./dev-deploy.sh** - uruchomienie

**Hot reload będzie działał out-of-the-box!** 🔥