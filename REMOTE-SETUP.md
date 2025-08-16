# 🔗 Remote Development Setup

Complete guide for remote development with the Enterprise CRM system at https://cactoos.digital.

## 🎯 Development Stack Options

### Option 1: Windows + VSCode → VPS
```
💻 Windows + VSCode
        ↓ SSH Connection
🖥️ VPS Ubuntu (https://cactoos.digital)
        ↓ Docker
🐳 All microservices + hot reload
```

### Option 2: WSL2 + Docker → VPS  
```
💻 Windows + WSL2
        ↓ SSH to VPS
🖥️ VPS Ubuntu + Docker
        ↓ Remote containers
🐳 Development environment
```

## 🛠 Windows Development Workflow

### Prerequisites:
- **VSCode** with Remote-SSH extension
- **Windows Terminal** or **PowerShell**
- **SSH client** (built into Windows 10+)

### Setup SSH Connection:
```powershell
# Generate SSH key (if not exists)
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Copy key to VPS
scp ~/.ssh/id_rsa.pub root@178.63.69.38:~/.ssh/authorized_keys

# Connect to VPS
ssh root@178.63.69.38
```

### VSCode Remote Development:
1. **Install Extension**: Remote - SSH
2. **Add SSH Host**: `Ctrl+Shift+P` → "Remote-SSH: Add New SSH Host"
3. **Host**: `root@178.63.69.38`
4. **Connect**: `Ctrl+Shift+P` → "Remote-SSH: Connect to Host"
5. **Open Folder**: `/var/www/enterprise`

### File Editing Workflow:
```bash
# On VPS via VSCode Remote:
# 1. Edit files directly in VSCode
# 2. Changes auto-save to VPS
# 3. Hot reload triggers automatically
# 4. View results at https://cactoos.digital
```

## 🐳 Remote Docker Development

### Start Development Environment:
```bash
# Connect to VPS
ssh root@178.63.69.38
cd /var/www/enterprise

# Start all services with hot reload
docker compose -f docker-compose.dev.yml up -d

# Start HTTPS proxy
docker compose -f docker-compose.ssl.yml up -d nginx-ssl

# Verify services
curl https://cactoos.digital/api/health
```

### Monitor Development:
```bash
# Check service logs
docker logs enterprise-api-gateway-dev -f

# Monitor system resources  
htop

# View all containers
docker compose -f docker-compose.dev.yml ps
```

## 🔧 VSCode Extensions for Remote Development

### Essential Extensions:
```json
{
  "recommendations": [
    "ms-vscode-remote.remote-ssh",
    "ms-vscode-remote.remote-containers", 
    "ms-python.python",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.docker"
  ]
}
```

### Docker Development:
- **Docker Extension**: Container management in VSCode
- **Remote-Containers**: Develop inside containers
- **TypeScript**: Node.js service development
- **Python**: OCR service development

## 📊 Remote Monitoring Tools

### Production Monitoring:
- **Application**: https://cactoos.digital
- **pgAdmin**: http://178.63.69.38:5050 (Database)
- **Portainer**: http://178.63.69.38:9000 (Containers)

### Development Commands via SSH:
```bash
# System monitoring
htop                    # CPU, memory usage
docker stats           # Container resources
df -h                  # Disk usage

# Service management  
docker compose -f docker-compose.dev.yml restart api-gateway
docker logs enterprise-frontend-dev --tail 50

# SSL monitoring
certbot certificates   # Check SSL status
curl -I https://cactoos.digital | grep -i security
```

## 🚀 Hot Reload Remote Development

### File Change Workflow:
1. **Edit files** in VSCode (connected to VPS)
2. **Files save** automatically to VPS
3. **Docker detects** changes via volume mounts
4. **Services restart** automatically (2-3 seconds)
5. **View changes** at https://cactoos.digital

### Services with Hot Reload:
- ✅ **API Gateway** - `npx nest start --watch`
- ✅ **All microservices** - Automatic restart on changes
- ✅ **Frontend** - React dev server with hot reload
- ✅ **Database** - Persistent data across restarts

### Logs Monitoring:
```bash
# Watch service restart on file changes
docker logs enterprise-api-gateway-dev -f

# Expected output on file change:
# [Nest] Starting Nest application...
# [Nest] Application successfully started
```

## 🔒 Security for Remote Development

### SSH Security:
```bash
# Use SSH keys (not passwords)
# Disable root login (after setup)
# Use non-standard SSH port
# Enable UFW firewall
```

### VPS Security:
- ✅ **Firewall**: UFW with only necessary ports
- ✅ **SSL**: A+ grade HTTPS with HSTS
- ✅ **Rate Limiting**: API protection
- ✅ **Security Headers**: All configured

### Development Security:
```bash
# Development uses production-grade security:
# - Real SSL certificates (not self-signed)
# - Strong database passwords
# - JWT secrets 32+ characters
# - HTTPS for all communication
```

## 🌐 Network Configuration

### Port Forwarding (Optional):
If you need local access to specific services:

```bash
# Forward pgAdmin to local machine
ssh -L 5050:localhost:5050 root@178.63.69.38

# Forward Portainer to local machine  
ssh -L 9000:localhost:9000 root@178.63.69.38

# Access locally:
# http://localhost:5050 (pgAdmin)
# http://localhost:9000 (Portainer)
```

### Direct VPS Access:
```bash
# All services accessible directly via VPS IP:
# Application: https://cactoos.digital
# pgAdmin: http://178.63.69.38:5050
# Portainer: http://178.63.69.38:9000
```

## 🚨 Troubleshooting Remote Development

### SSH Connection Issues:
```bash
# Test SSH connection
ssh -v root@178.63.69.38

# Check SSH service on VPS
systemctl status ssh

# Reset SSH connection in VSCode
Ctrl+Shift+P → "Remote-SSH: Kill VS Code Server on Host"
```

### VSCode Remote Issues:
```bash
# Clear VSCode server cache
rm -rf ~/.vscode-server

# Restart VSCode connection
Ctrl+Shift+P → "Remote-SSH: Reload Window"
```

### Hot Reload Not Working:
```bash
# Check if volumes are mounted
docker inspect enterprise-api-gateway-dev | grep -A 10 "Mounts"

# Restart service to reload volumes
docker compose -f docker-compose.dev.yml restart api-gateway
```

### Performance Issues:
```bash
# Check VPS resources
htop
docker stats

# Check network latency
ping 178.63.69.38
```

## 📞 Remote Development Support

### Quick Commands:
```bash
# Start full development environment
ssh root@178.63.69.38 "cd /var/www/enterprise && docker compose -f docker-compose.dev.yml up -d && docker compose -f docker-compose.ssl.yml up -d nginx-ssl"

# Check everything is running
curl https://cactoos.digital/api/health

# Monitor all services
ssh root@178.63.69.38 "docker compose -f /var/www/enterprise/docker-compose.dev.yml ps"
```

### VSCode Workspace Configuration:
```json
{
  "folders": [
    {
      "path": "/var/www/enterprise"
    }
  ],
  "settings": {
    "terminal.integrated.defaultProfile.linux": "bash",
    "files.watcherExclude": {
      "**/node_modules/**": true,
      "**/.git/**": true,
      "**/dist/**": true
    }
  }
}
```

---

## 🎯 Remote Development Ready!

✅ **SSH connection** to production VPS  
✅ **VSCode Remote** development environment  
✅ **Hot reload** for all services  
✅ **Production HTTPS** during development  
✅ **Monitoring tools** accessible remotely  

**Develop remotely with full production environment at https://cactoos.digital!**