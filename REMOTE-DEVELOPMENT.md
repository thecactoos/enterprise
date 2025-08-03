# 🛠️ Remote Development Workflow

**Kompletny przewodnik dla zdalnego developmentu Enterprise CRM z WSL + VSCode + VPS**

## 🎯 **Stack developmentu**

```
💻 WSL (Windows) + VSCode
        ↓ SSH Connection
🖥️ VPS (Ubuntu) - kod i kontenery
        ↓ Port forwarding
🐳 Portainer - zarządzanie Docker
📊 Grafana - monitoring
🗄️ pgAdmin - baza danych
```

## ⚡ **Quick Setup (5 minut)**

### 1️⃣ **VSCode na WSL - instalacja rozszerzeń**
```bash
# W VSCode zainstaluj rozszerzenia:
# - Remote - SSH
# - Remote - SSH: Editing Configuration Files  
# - GitLens
# - Docker (opcjonalnie)
```

### 2️⃣ **Konfiguracja SSH na WSL**
```bash
# W WSL terminal
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Skopiuj klucz na VPS
ssh-copy-id user@your-vps-ip

# Test połączenia
ssh user@your-vps-ip
```

### 3️⃣ **VSCode SSH Config**
```bash
# W WSL: ~/.ssh/config
Host enterprise-vps
    HostName your-vps-ip
    User your-user
    Port 22
    IdentityFile ~/.ssh/id_rsa
    ForwardAgent yes
```

## 🔄 **Development Workflow**

### **Typowy dzień pracy:**

#### 🌅 **1. Rano - przygotowanie środowiska**
```bash
# 1. Otwórz VSCode na WSL
code .

# 2. Połącz się z VPS
# Ctrl+Shift+P → "Remote-SSH: Connect to Host" → enterprise-vps

# 3. Otwórz projekt na VPS
# File → Open Folder → /var/www/enterprise-crm
```

#### 💻 **2. Development cycle**
```bash
# W VSCode Remote (na VPS):

# A. Edytujesz kod normalnie jak lokalnie
# - Pełny IntelliSense
# - Git integration  
# - Extensions działają

# B. Sprawdzasz co się dzieje w Portainer
# http://your-vps-ip:9000
# - Status kontenerów
# - Logi w czasie rzeczywistym

# C. Restartujesz serwisy po zmianach
# W Portainer: Container → Restart
# LUB w VSCode terminal:
docker-compose -f docker-compose.dev.yml restart api-gateway
```

#### 🔄 **3. Typowa zmiana w kodzie**
```bash
# Przykład: zmiana w API Gateway

# 1. Edytujesz plik w VSCode Remote
/var/www/enterprise-crm/api-gateway/src/app.module.ts

# 2. Zapisujesz (Ctrl+S) - hot reload działa automatycznie!

# 3. Testуjesz w przeglądarce
curl http://your-vps-ip:3000/health

# 4. Sprawdzasz logi w Portainer jeśli potrzeba
```

#### 📊 **4. Debugging i monitoring**
```bash
# A. Logi w czasie rzeczywistym
# Portainer → Container → Logs → Follow

# B. Metryki systemu  
# Grafana: http://your-vps-ip:3010

# C. Baza danych
# pgAdmin: http://your-vps-ip:5050

# D. VSCode terminal na VPS
docker-compose -f docker-compose.dev.yml logs -f [service]
```

#### 🚀 **5. Commit i deploy**
```bash
# W VSCode Remote (Git jest zintegrowany):

# 1. Stage changes
git add .

# 2. Commit 
git commit -m "feat: add new feature"

# 3. Push to repository
git push origin main

# 4. Restart services w Portainer jeśli potrzeba
```

## 🔧 **Hot Reload Configuration**

### **Włączone automatycznie dla:**
- **Node.js services** - nodemon w dev mode
- **React frontend** - webpack dev server (jak uruchomisz lokalnie)
- **Python OCR service** - uvicorn z --reload

### **Jeszcze lepszy hot reload:**
```bash
# Dodaj do docker-compose.dev.yml volume mapping:
volumes:
  - ./api-gateway:/app        # Code changes
  - /app/node_modules         # Keep node_modules in container
```

**To już masz skonfigurowane w docker-compose.dev.yml!**

## 🛠️ **Narzędzia w workflow**

### **VSCode Remote SSH - główne narzędzie**
- **Edycja kodu** jak lokalnie
- **Terminal** bezpośrednio na VPS
- **Git integration** - commit, push, pull
- **Extensions** działają normalnie
- **Port forwarding** - dostęp do serwisów

### **Portainer - zarządzanie Docker**
- **Dashboard** wszystkich kontenerów
- **Restart serwisów** jednym klikiem
- **Logi** w czasie rzeczywistym  
- **Resource usage** - CPU, RAM
- **Volume management**

### **Grafana - monitoring**
- **System metrics** - CPU, RAM, disk
- **Service health** - czy wszystko działa
- **Custom dashboards** - dla konkretnych metryk
- **Alerty** - gdy coś nie gra

### **pgAdmin - baza danych**
- **SQL queries** - testy, debugowanie
- **Database browser** - struktura tabel
- **Data visualization** - przegląd danych
- **Import/Export** - backup, restore

## 📱 **Mobile workflow** 

### **Z telefonu możesz:**
```bash
# 1. Portainer Mobile App
# - Restart kontenerów
# - Sprawdź status
# - Przejrzyj logi

# 2. Grafana Mobile
# - Monitoring w czasie rzeczywistym
# - Alerty push

# 3. SSH client (Termux/ConnectBot)
# - Quick fixes
# - Restart serwisów
```

## ⚡ **Pro Tips**

### **1. Multiple VSCode windows**
```bash
# Otwórz kilka okien VSCode:
# - Jedno na frontend (local WSL)  
# - Jedno na backend (remote VPS)
```

### **2. Port forwarding w VSCode**
```bash
# Ports tab w VSCode Remote
# Forward port 3000 → dostęp lokalny: localhost:3000
```

### **3. Git workflow**
```bash
# Używaj feature branches:
git checkout -b feature/new-awesome-feature
# ... zmiany ...
git push origin feature/new-awesome-feature
# Merge przez GitHub/GitLab PR
```

### **4. Quick commands**
```bash
# Dodaj do ~/.bashrc na VPS:
alias dr="docker-compose -f docker-compose.dev.yml restart"
alias dl="docker-compose -f docker-compose.dev.yml logs -f"
alias ds="docker-compose -f docker-compose.dev.yml ps"

# Restart API Gateway:
dr api-gateway

# Logi OCR service:  
dl ocr-service
```

## 🚨 **Troubleshooting**

### **Problem: VSCode nie łączy się z VPS**
```bash
# 1. Test SSH connection
ssh user@your-vps-ip

# 2. Check SSH config
cat ~/.ssh/config

# 3. Regenerate SSH keys if needed
ssh-keygen -t rsa -b 4096
ssh-copy-id user@your-vps-ip
```

### **Problem: Hot reload nie działa**
```bash
# 1. Check volume mounting
docker-compose -f docker-compose.dev.yml config

# 2. Restart container
docker-compose -f docker-compose.dev.yml restart [service]

# 3. Check file permissions
ls -la /var/www/enterprise-crm/
```

### **Problem: Portainer nie ładuje się**
```bash
# 1. Check container status  
docker ps | grep portainer

# 2. Check logs
docker logs enterprise-portainer

# 3. Restart Portainer
docker-compose -f docker-compose.dev.yml restart portainer
```

## 🎯 **Summary - Twój workflow**

```
🌅 RANO:
VSCode → Remote SSH → Open project folder

💻 DEVELOPMENT:
Edit code → Auto save → Hot reload → Test in browser

🐛 DEBUGGING:  
Portainer logs → Grafana metrics → pgAdmin queries

🚀 DEPLOY:
Git commit → Git push → Portainer restart

📊 MONITORING:
Grafana dashboards → Portainer status → System health
```

**🎉 To jest najbardziej efektywny sposób na remote development dla Twojego stacku!**

Wszystko działa jak lokalnie, ale z mocą VPS i profesjonalnym monitoringiem.