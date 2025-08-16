# MCP Troubleshooting Guide

## Problem: MCP nie działa po restarcie Claude Desktop

### Status diagnostyki ✅
- ✅ Konfiguracja MCP istnieje i jest poprawna
- ✅ Wszystkie pakiety MCP są zainstalowane globalnie  
- ✅ Składnia JSON jest prawidłowa
- ✅ Wszystkie serwery działają poprawnie indywidualnie
- ✅ PostgreSQL database jest dostępne
- ✅ Enterprise agents server odpowiada

### Lokalizacje config file
Konfiguracja została umieszczona w dwóch lokalizacjach:
1. `~/.config/Claude/claude_desktop_config.json` (Linux standard)
2. `~/.claude/claude_desktop_config.json` (alternatywna)

### Możliwe przyczyny problemu

#### 1. **Claude Desktop nie odnajduje config file**
**Rozwiązanie**: Sprawdź dokładną lokalizację dla twojego systemu:
- Linux: `~/.config/Claude/claude_desktop_config.json`
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

#### 2. **Prawa dostępu**
**Rozwiązanie**:
```bash
chmod 644 ~/.config/Claude/claude_desktop_config.json
chown $USER:$USER ~/.config/Claude/claude_desktop_config.json
```

#### 3. **Claude Desktop cache**
**Rozwiązanie**: Wyczyść cache Claude Desktop:
- Zamknij Claude Desktop całkowicie
- Usuń folder cache (lokalizacja zależna od systemu)
- Uruchom ponownie Claude Desktop

#### 4. **Uprawnienia do wykonywania node/npx**
**Rozwiązanie**: Sprawdź czy Claude Desktop ma dostęp do node/npx:
```bash
which node
which npx
# Upewnij się, że ścieżki są dostępne dla Claude Desktop
```

#### 5. **Sieciowe/firewall problemy**
**Rozwiązanie**: Sprawdź czy Claude Desktop może łączyć się z localhost:5432

### Testy diagnostyczne

#### Test 1: Sprawdź aktualną konfigurację
```bash
cat ~/.config/Claude/claude_desktop_config.json
```

#### Test 2: Przetestuj serwery indywidualnie
```bash
npx -y @modelcontextprotocol/server-memory
npx -y @modelcontextprotocol/server-filesystem /var/www/enterprise
node /var/www/enterprise/.claude/agents-server.js
```

#### Test 3: Sprawdź database connection
```bash
psql postgresql://postgres:devpassword123@localhost:5432/enterprise_crm -c "SELECT 1;"
```

### Konfiguracja MCP Servers

Aktualnie skonfigurowane serwery:
- **filesystem**: Operacje na plikach w /var/www/enterprise
- **memory**: Persistent knowledge storage
- **sequential-thinking**: Structured problem solving
- **everything**: Comprehensive tooling
- **postgres**: Database operations
- **enterprise-agents**: Backend Architect, Frontend Developer, Code Reviewer, Test Automator

### Następne kroki

1. **Sprawdź logi Claude Desktop** (jeśli dostępne)
2. **Spróbuj minimalnej konfiguracji** z tylko jednym serwerem
3. **Przetestuj na innej instalacji Claude Desktop**
4. **Zgłoś problem do Anthropic** jeśli wszystko inne działa

### Minimal Config Test
Utwórz minimalną konfigurację do testu:
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

## Ostateczne rozwiązanie

Jeśli nic nie działa, możliwe że:
1. **Claude Code w terminalu** może nie obsługiwać MCP tak jak Claude Desktop
2. **Wersja Claude** może być niekompatybilna
3. **System operacyjny** może wymagać innej konfiguracji

**Sprawdź:** czy używasz Claude Desktop (GUI) czy Claude Code (CLI)?