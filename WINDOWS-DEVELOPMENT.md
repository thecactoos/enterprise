# 🛠️ Windows Development Workflow

**VSCode na Windows → Remote SSH → VPS Ubuntu + Portainer**

## 🎯 **Stack developmentu**

```
💻 Windows + VSCode
        ↓ SSH Connection (OpenSSH/PuTTY)
🖥️ VPS Ubuntu - kod i kontenery  
        ↓ Web interface
🐳 Portainer - zarządzanie Docker
📊 Grafana - monitoring
🗄️ pgAdmin - baza danych
```

## ⚡ **Quick Setup (10 minut)**

### 1️⃣ **Windows - przygotowanie SSH**

#### **Opcja A: OpenSSH (Windows 10/11 - REKOMENDOWANE)**
```powershell
# Otwórz PowerShell jako Administrator
# Sprawdź czy OpenSSH jest zainstalowany
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'

# Jeśli nie ma, zainstaluj:
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

#### **Opcja B: Git Bash (jeśli masz Git)**
```bash
# Git dla Windows zawiera SSH
# Używaj Git Bash zamiast PowerShell
```

### 2️⃣ **Generowanie kluczy SSH**
```powershell
# W PowerShell lub Git Bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Klucze zapisane w: C:\Users\YourUser\.ssh\
# - id_rsa (private key)
# - id_rsa.pub (public key)
```

### 3️⃣ **Kopiowanie klucza na VPS**
```powershell
# Opcja A: Automatycznie (jeśli ssh-copy-id działa)
ssh-copy-id user@your-vps-ip

# Opcja B: Ręcznie
# 1. Skopiuj zawartość C:\Users\YourUser\.ssh\id_rsa.pub
# 2. Na VPS:
mkdir -p ~/.ssh
echo "wklej-tutaj-zawartość-klucza" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 4️⃣ **VSCode na Windows - rozszerzenia**
```
Zainstaluj w VSCode:
✅ Remote - SSH
✅ Remote - SSH: Editing Configuration Files
✅ GitLens
✅ Docker (opcjonalnie)
✅ Git History
```

### 5️⃣ **SSH Config w Windows**
```powershell
# Utwórz plik: C:\Users\YourUser\.ssh\config
```

```
Host enterprise-vps
    HostName your-vps-ip
    User your-user
    Port 22
    IdentityFile C:\Users\YourUser\.ssh\id_rsa
    ForwardAgent yes
```

## 🔄 **Development Workflow Windows**

### **🌅 Rano - start pracy**

#### **1. Otwórz VSCode na Windows**
```powershell
# Otwórz VSCode
code .
```

#### **2. Połącz się z VPS**
```
W VSCode:
1. Ctrl+Shift+P
2. Wpisz: "Remote-SSH: Connect to Host"
3. Wybierz: enterprise-vps
4. Czekaj na połączenie...
5. File → Open Folder → /var/www/enterprise-crm
```

### **💻 Główny workflow**

#### **A. Edycja kodu (VSCode Remote)**
```
✅ Edytujesz kod jak lokalnie
✅ IntelliSense działa
✅ Git integration wbudowany
✅ Terminal bezpośrednio na VPS
✅ Hot reload automatyczny
```

#### **B. Zarządzanie Docker (Portainer)**
```
🌐 Otwórz: http://your-vps-ip:9000

Dashboard → Enterprise Stack:
✅ Status wszystkich kontenerów
✅ Restart serwisu jednym klikiem
✅ Logi w czasie rzeczywistym
✅ CPU/RAM usage każdego kontenera
```

#### **C. Monitoring (Grafana)**
```
📊 Otwórz: http://your-vps-ip:3010
Login: admin / devpassword123

Dashboards:
✅ System resources (CPU, RAM, Disk)
✅ Service availability  
✅ Custom metrics
```

#### **D. Baza danych (pgAdmin)**
```
🗄️ Otwórz: http://your-vps-ip:5050
Login: admin@enterprise.local / devpassword123

Functions:
✅ Browse database structure
✅ Run SQL queries
✅ View data
✅ Import/Export
```

## 🔧 **Praktyczny przykład - zmiana w API**

### **Scenariusz: Dodajesz nowy endpoint**

#### **1. Edit w VSCode Remote**
```javascript
// Edytujesz w VSCode: /api-gateway/src/app.controller.ts
@Get('/new-endpoint')
async getNewData() {
  return { message: 'Hello from new endpoint!' };
}
```

#### **2. Save & Hot Reload**
```
Ctrl+S → Hot reload automatyczny (nodemon)
```

#### **3. Test w przeglądarce Windows**
```
http://your-vps-ip:3000/new-endpoint
```

#### **4. Check logs w Portainer** 
```
Portainer → Containers → api-gateway → Logs → Follow
```

#### **5. Commit w VSCode**
```
Git tab → Stage changes → Commit → Push
```

## 🔧 **Windows-specific tips**

### **1. Multiple tools otwarcie**
```
🖥️ Monitor 1: VSCode Remote
🖥️ Monitor 2: Portainer + Grafana + pgAdmin w Chrome
📱 Phone: Portainer Mobile (monitoring w drodze)
```

### **2. Git workflow**
```powershell
# W VSCode Remote terminal:
git checkout -b feature/new-feature
# ... edycja kodu ...
git add .
git commit -m "feat: add awesome feature"
git push origin feature/new-feature
```

### **3. Quick restart services**
```powershell
# W VSCode Remote terminal:
cd /var/www/enterprise-crm

# Restart pojedynczy serwis
docker-compose -f docker-compose.dev.yml restart api-gateway

# Restart wszystkich serwisów
docker-compose -f docker-compose.dev.yml restart

# Status
docker-compose -f docker-compose.dev.yml ps
```

### **4. Windows Terminal (opcjonalnie)**
```powershell
# Zainstaluj Windows Terminal ze Store
# Dodaj profil SSH:
{
    "name": "Enterprise VPS",
    "commandline": "ssh enterprise-vps",
    "icon": "🖥️"
}
```

## 🌐 **Browser bookmarks**

### **Zapisz w Chrome/Edge:**
```
📁 Enterprise CRM Development/
  ├── 🌐 API Gateway: http://your-vps-ip:3000
  ├── 🗄️ pgAdmin: http://your-vps-ip:5050  
  ├── 🐳 Portainer: http://your-vps-ip:9000
  ├── 📊 Grafana: http://your-vps-ip:3010
  ├── 📈 Prometheus: http://your-vps-ip:9090
  └── 🔍 OCR Service: http://your-vps-ip:8000
```

## 📱 **Mobile development**

### **Portainer Mobile App**
```
📱 Android/iOS: "Portainer" 
Server: http://your-vps-ip:9000
Username: admin
Password: [set during first login]

Features:
✅ Restart containers
✅ View logs  
✅ Check status
✅ Resource usage
✅ Push notifications
```

## 🚨 **Troubleshooting Windows**

### **Problem: SSH connection failed**
```powershell
# Test manual connection
ssh -v user@your-vps-ip

# Check SSH service on Windows
Get-Service ssh-agent
Start-Service ssh-agent

# Re-generate keys if needed
ssh-keygen -t rsa -b 4096 -f C:\Users\YourUser\.ssh\id_rsa
```

### **Problem: VSCode Remote nie łączy**
```
1. Check SSH config file syntax
2. Try connecting via terminal first
3. Check firewall on Windows
4. Restart VSCode
5. Remove and re-add remote host
```

### **Problem: Port forwarding**
```powershell
# Manual port forward for testing
ssh -L 3000:localhost:3000 user@your-vps-ip

# Now access: http://localhost:3000
```

### **Problem: Git credentials**
```powershell
# Configure Git on VPS (first time)
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"

# Use VSCode Git integration or terminal
```

## 🎯 **Optimal Windows Setup**

### **Desktop layout:**
```
🖥️ Primary Monitor:
  └── VSCode Remote (full screen)

🖥️ Secondary Monitor:  
  ├── Chrome tabs:
  │   ├── Portainer
  │   ├── Grafana  
  │   └── pgAdmin
  └── Windows Terminal (VPS SSH)

📱 Phone:
  └── Portainer Mobile (monitoring)
```

### **Keyboard shortcuts:**
```
Ctrl+Shift+P → VSCode command palette
Ctrl+` → Toggle VSCode terminal
Alt+Tab → Switch between apps
Win+Tab → Virtual desktops
```

## 🎉 **Summary - Twój Windows workflow**

```
🌅 START:
VSCode → Remote SSH → enterprise-vps

💻 DEVELOP:  
Edit code → Ctrl+S → Hot reload → Test in browser

🐛 DEBUG:
Portainer → Logs | Grafana → Metrics | pgAdmin → Queries

🚀 DEPLOY:
VSCode Git → Commit → Push → Portainer restart

📊 MONITOR:
Browser tabs → Portainer + Grafana + pgAdmin
Mobile → Portainer app
```

**🎯 Perfect setup dla Windows development z pełną kontrolą nad VPS!**