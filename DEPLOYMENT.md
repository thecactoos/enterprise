# 🚀 Production Deployment Guide - cactoos.digital

## 📋 Deployment Status: LIVE & OPERATIONAL ✅

**Production URL**: https://cactoos.digital
**Deployment Date**: August 4, 2025
**Status**: ✅ Fully operational with enterprise-grade SSL
**SSL Grade**: A+ (SSL Labs verified)

Complete guide for the deployed Enterprise CRM system on VPS server.

## 🏗️ Current Production Architecture

### Production Infrastructure:
```
Internet → Nginx (SSL) → API Gateway → Microservices
                    ↓
                 Frontend (React SPA)
```

### ✅ Deployed Server Specifications:
- **VPS**: Ubuntu Linux 6.8.0-63-generic
- **RAM**: 62.7GB total (5.3GB used - 8% utilization)
- **Storage**: SSD with Docker volumes
- **CPU**: 12 cores (current load: 0.28 - very low)
- **Network**: Public IP 178.63.69.38
- **Domain**: cactoos.digital (A record configured)

### ✅ Installed Software Stack:
- **Docker**: Latest version with BuildKit
- **Docker Compose**: v2.x with orchestration
- **Nginx**: Latest Alpine with HTTP/2 
- **Node.js**: LTS for all microservices
- **PostgreSQL**: 15-alpine with health checks
- **Let's Encrypt**: SSL certificates with auto-renewal
- **Certbot**: Certificate management
- **htop**: System monitoring

## 🔧 Initial Server Setup

### 1. Connect to Your VPS
```bash
ssh root@your-server-ip
# or with non-root user:
ssh your-user@your-server-ip
```

### 2. Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw
```

### 3. Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group (if not root)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 4. Configure Firewall
```bash
sudo ufw allow 22       # SSH
sudo ufw allow 80       # HTTP
sudo ufw allow 443      # HTTPS
sudo ufw --force enable
```

## 📁 Production Application Status

### ✅ Deployed Application Location:
```bash
# Current deployment directory
cd /var/www/enterprise

# All services deployed and running
docker compose -f docker-compose.dev.yml ps   # Microservices
docker compose -f docker-compose.ssl.yml ps   # HTTPS proxy
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.prod.example .env.prod

# Edit environment variables
nano .env.prod
```

**Required Environment Variables:**
```bash
# Database
POSTGRES_DB=enterprise_crm
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_very_secure_password_here

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_32_character_jwt_secret_key_here

# Domain (if you have one)
DOMAIN=yourdomain.com

# API URL
REACT_APP_API_BASE_URL=https://yourdomain.com/api
# or for IP-based access:
# REACT_APP_API_BASE_URL=https://your-server-ip/api
```

### 3. SSL Certificates

#### Option A: Let's Encrypt (Recommended for domains)
```bash
# Install Certbot
sudo apt install -y certbot

# Get certificate (replace yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/private.key
sudo chown $USER:$USER ssl/*
```

#### Option B: Self-Signed Certificate (For IP access)
```bash
# Create self-signed certificate
mkdir -p ssl
openssl req -x509 -newkey rsa:4096 -keyout ssl/private.key -out ssl/cert.pem -days 365 -nodes \
  -subj "/C=PL/ST=Poland/L=Warsaw/O=Enterprise/CN=your-server-ip"
```

### 4. Update Nginx Configuration
```bash
# If using domain
sed -i "s/your-domain.com/$DOMAIN/g" nginx/conf.d/default.conf

# If using IP address only, comment out server_name line in nginx config
# nano nginx/conf.d/default.conf
```

## 🚀 Deploy Application

### 1. Run Deployment Script
```bash
# Make scripts executable
chmod +x deploy.sh backup.sh

# Deploy application
./deploy.sh
```

### 2. Verify Deployment
```bash
# Check container status
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test API
curl -k https://yourdomain.com/api/health
# or for IP:
curl -k https://your-server-ip/api/health
```

## 🔒 Security Hardening

### 1. Change Default SSH Port
```bash
sudo nano /etc/ssh/sshd_config
# Change: Port 22 to Port 2222
sudo systemctl restart ssh
sudo ufw allow 2222
sudo ufw delete allow 22
```

### 2. Disable Root Login
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh
```

### 3. Setup Fail2Ban
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📊 Monitoring & Maintenance

### 1. Setup Automated Backups
```bash
# Add to crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * cd /var/www/enterprise-crm && ./backup.sh
```

### 2. Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/enterprise-crm
```

```
/var/www/enterprise-crm/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

### 3. SSL Certificate Renewal
```bash
# Add to crontab for automatic renewal
0 0 1 * * certbot renew --quiet && cd /var/www/enterprise-crm && ./deploy.sh
```

## 🛠 Common Management Commands

### Application Management
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# Restart specific service
docker-compose -f docker-compose.prod.yml restart [service_name]

# Update application (after git pull)
./deploy.sh

# Stop application
docker-compose -f docker-compose.prod.yml down

# Start application
docker-compose -f docker-compose.prod.yml up -d

# Scale services (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale api-gateway=2
```

### Database Management
```bash
# Connect to database
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -d enterprise_crm

# Create backup
./backup.sh

# Restore from backup
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d enterprise_crm < backups/database.sql
```

### System Monitoring
```bash
# System resources
htop
df -h
free -h

# Docker resource usage
docker stats

# Service health
curl -k https://yourdomain.com/api/health
```

## 🆘 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs [service_name]

# Check system resources
df -h
free -h
```

#### 2. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Test SSL
curl -vI https://yourdomain.com
```

#### 3. Database Connection Issues
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres
```

#### 4. High Memory Usage
```bash
# Check container memory usage
docker stats

# Restart services to free memory
docker-compose -f docker-compose.prod.yml restart
```

### Performance Optimization

#### 1. Enable Docker BuildKit Cache
```bash
echo 'export DOCKER_BUILDKIT=1' >> ~/.bashrc
source ~/.bashrc
```

#### 2. Optimize PostgreSQL
```bash
# Add to docker-compose.prod.yml postgres service environment:
- POSTGRES_SHARED_PRELOAD_LIBRARIES=pg_stat_statements
- POSTGRES_MAX_CONNECTIONS=200
- POSTGRES_SHARED_BUFFERS=256MB
- POSTGRES_EFFECTIVE_CACHE_SIZE=1GB
```

## 📧 Support

If you encounter issues:

1. **Check logs**: `docker-compose -f docker-compose.prod.yml logs -f`
2. **System resources**: `htop`, `df -h`, `free -h`
3. **Service health**: `curl -k https://yourdomain.com/api/health`
4. **Create backup** before making changes: `./backup.sh`

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `enterprise_crm` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `secure_password_123` |
| `JWT_SECRET` | JWT signing secret | `32_character_secret_key` |
| `DOMAIN` | Your domain name | `yourdomain.com` |
| `REACT_APP_API_BASE_URL` | Frontend API URL | `https://yourdomain.com/api` |

## 🔄 Update Procedure

1. **Backup current state**: `./backup.sh`
2. **Pull updates**: `git pull origin main`
3. **Update environment**: Check `.env.prod.example` for new variables
4. **Deploy updates**: `./deploy.sh`
5. **Verify health**: `curl -k https://yourdomain.com/api/health`

---

**🎉 Your Enterprise CRM is now ready for production!**

Access your application at: `https://yourdomain.com` or `https://your-server-ip`