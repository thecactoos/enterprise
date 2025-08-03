# Windows SSH Setup Script for Enterprise CRM
# Run this in PowerShell as Administrator

param(
    [Parameter(Mandatory=$true)]
    [string]$VpsIP,
    
    [Parameter(Mandatory=$true)]
    [string]$VpsUser,
    
    [string]$VpsPort = "22",
    
    [string]$Email = "user@example.com"
)

Write-Host "🚀 Setting up SSH for Enterprise CRM development..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Install OpenSSH Client if not available
Write-Host "📦 Checking OpenSSH Client..." -ForegroundColor Blue
$openssh = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Client*'
if ($openssh.State -ne "Installed") {
    Write-Host "Installing OpenSSH Client..." -ForegroundColor Yellow
    Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
} else {
    Write-Host "✅ OpenSSH Client already installed" -ForegroundColor Green
}

# Start SSH Agent service
Write-Host "🔧 Configuring SSH Agent..." -ForegroundColor Blue
Set-Service ssh-agent -StartupType Automatic
Start-Service ssh-agent

# Create .ssh directory
$sshDir = "$env:USERPROFILE\.ssh"
if (!(Test-Path $sshDir)) {
    Write-Host "📁 Creating SSH directory..." -ForegroundColor Blue
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
}

# Generate SSH key if not exists
$privateKey = "$sshDir\id_rsa"
$publicKey = "$sshDir\id_rsa.pub"

if (!(Test-Path $privateKey)) {
    Write-Host "🔑 Generating SSH key pair..." -ForegroundColor Blue
    ssh-keygen -t rsa -b 4096 -C $Email -f $privateKey -N '""'
} else {
    Write-Host "✅ SSH key already exists" -ForegroundColor Green
}

# Create SSH config
$configFile = "$sshDir\config"
$configContent = @"
Host enterprise-vps
    HostName $VpsIP
    User $VpsUser
    Port $VpsPort
    IdentityFile $privateKey
    ForwardAgent yes
    ServerAliveInterval 60
    ServerAliveCountMax 3

Host $VpsIP
    User $VpsUser
    Port $VpsPort
    IdentityFile $privateKey
    ForwardAgent yes
"@

Write-Host "⚙️ Creating SSH config..." -ForegroundColor Blue
$configContent | Out-File -FilePath $configFile -Encoding UTF8

# Add SSH key to agent
Write-Host "🔐 Adding SSH key to agent..." -ForegroundColor Blue
ssh-add $privateKey

# Display public key for manual copying
Write-Host ""
Write-Host "🔑 Your SSH Public Key:" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow
Get-Content $publicKey
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""

# Instructions for VPS setup
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Copy the SSH public key above" -ForegroundColor White
Write-Host "2. Connect to your VPS and run:" -ForegroundColor White
Write-Host "   mkdir -p ~/.ssh" -ForegroundColor Gray
Write-Host "   echo 'PASTE_YOUR_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor Gray
Write-Host "   chmod 700 ~/.ssh" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test connection:" -ForegroundColor White
Write-Host "   ssh enterprise-vps" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Or use automatic setup:" -ForegroundColor White
Write-Host "   ssh-copy-id $VpsUser@$VpsIP" -ForegroundColor Gray
Write-Host ""

# Test connection
Write-Host "🔍 Testing SSH connection..." -ForegroundColor Blue
$testConnection = Read-Host "Do you want to test the connection now? (y/n)"
if ($testConnection -eq "y" -or $testConnection -eq "Y") {
    Write-Host "Testing connection to $VpsIP..." -ForegroundColor Yellow
    ssh -o ConnectTimeout=10 -o BatchMode=yes enterprise-vps "echo 'SSH connection successful!'"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SSH connection successful!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ SSH connection failed. Please check:" -ForegroundColor Yellow
        Write-Host "  - VPS IP address: $VpsIP" -ForegroundColor Gray
        Write-Host "  - Username: $VpsUser" -ForegroundColor Gray
        Write-Host "  - Port: $VpsPort" -ForegroundColor Gray
        Write-Host "  - SSH key is added to VPS ~/.ssh/authorized_keys" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🎉 SSH setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📁 SSH files location:" -ForegroundColor Cyan
Write-Host "  Config: $configFile" -ForegroundColor Gray
Write-Host "  Private key: $privateKey" -ForegroundColor Gray
Write-Host "  Public key: $publicKey" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Next: Install VSCode extensions:" -ForegroundColor Cyan
Write-Host "  - Remote - SSH" -ForegroundColor Gray
Write-Host "  - Remote - SSH: Editing Configuration Files" -ForegroundColor Gray
Write-Host "  - GitLens" -ForegroundColor Gray
Write-Host ""
Write-Host "💻 Connect to VPS in VSCode:" -ForegroundColor Cyan
Write-Host "  1. Ctrl+Shift+P" -ForegroundColor Gray
Write-Host "  2. 'Remote-SSH: Connect to Host'" -ForegroundColor Gray
Write-Host "  3. Select 'enterprise-vps'" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Bookmark these URLs:" -ForegroundColor Cyan
Write-Host "  Portainer:  http://$VpsIP:9000" -ForegroundColor Gray
Write-Host "  pgAdmin:    http://$VpsIP:5050" -ForegroundColor Gray
Write-Host "  Grafana:    http://$VpsIP:3010" -ForegroundColor Gray
Write-Host "  API:        http://$VpsIP:3000" -ForegroundColor Gray