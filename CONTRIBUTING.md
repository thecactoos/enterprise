# Contributing to SPS Enterprise

Dziękujemy za zainteresowanie projektem SPS Enterprise! Oto jak możesz przyczynić się do rozwoju projektu.

## 🚀 Jak zacząć

### Wymagania
- Node.js 18+
- Python 3.11+
- Docker i Docker Compose
- Git

### Konfiguracja środowiska deweloperskiego

1. **Sklonuj repozytorium**
```bash
git clone https://github.com/your-username/sps-enterprise.git
cd sps-enterprise
```

2. **Uruchom wszystkie serwisy**
```bash
docker-compose up -d
```

3. **Sprawdź czy wszystko działa**
```bash
# Frontend
curl http://localhost:3001

# API Gateway
curl http://localhost:3000

# PDF Service
curl http://localhost:8000
```

## 🔧 Development

### Struktura projektu
```
sps-enterprise/
├── api-gateway/          # API Gateway (NestJS)
├── users-service/        # Users Microservice (NestJS)
├── clients-service/      # Clients Microservice (NestJS)
├── notes-service/        # Notes Microservice (NestJS)
├── products-service/     # Products Microservice (NestJS)
├── pdf-service/          # PDF Service (Python/FastAPI)
├── frontend/             # React Frontend
├── database/             # Database schemas
└── docs/                 # Documentation
```

### Uruchamianie pojedynczych serwisów

#### API Gateway
```bash
cd api-gateway
npm install
npm run start:dev
```

#### Products Service
```bash
cd products-service
npm install
npm run start:dev
```

#### PDF Service
```bash
cd pdf-service
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## 📝 Proces kontrybucji

### 1. Utwórz Issue
Przed rozpoczęciem pracy, utwórz issue opisujący problem lub funkcjonalność.

### 2. Utwórz Branch
```bash
git checkout -b feature/your-feature-name
# lub
git checkout -b fix/your-bug-fix
```

### 3. Rozwijaj funkcjonalność
- Pisz czytelny kod
- Dodawaj testy
- Aktualizuj dokumentację
- Używaj konwencji commitów

### 4. Commity
Używaj konwencji [Conventional Commits](https://www.conventionalcommits.org/):
```bash
feat: add new product search functionality
fix: resolve authentication issue
docs: update API documentation
style: format code according to style guide
refactor: restructure products service
test: add unit tests for user service
chore: update dependencies
```

### 5. Push i Pull Request
```bash
git push origin feature/your-feature-name
```

Następnie utwórz Pull Request na GitHub.

## 🧪 Testy

### Uruchamianie testów
```bash
# API Gateway
cd api-gateway
npm test

# Products Service
cd products-service
npm test

# Frontend
cd frontend
npm test
```

### Testy E2E
```bash
# Uruchom wszystkie serwisy
docker-compose up -d

# Uruchom testy E2E
npm run test:e2e
```

## 📚 Dokumentacja

### Aktualizacja dokumentacji
- README.md - główna dokumentacja
- API docs - automatycznie generowane przez Swagger
- Inline comments - dokumentacja kodu

### Swagger Documentation
- API Gateway: http://localhost:3000/api/docs
- Products Service: http://localhost:3004/api/docs
- PDF Service: http://localhost:8000/docs

## 🐛 Raportowanie błędów

### Szablon Issue
```markdown
**Opis błędu**
Krótki opis problemu

**Kroki do reprodukcji**
1. Przejdź do '...'
2. Kliknij '....'
3. Przewiń do '....'
4. Zobacz błąd

**Oczekiwane zachowanie**
Co powinno się stać

**Screenshots**
Jeśli dotyczy

**Środowisko**
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 91]
- Version: [e.g. 1.0.0]

**Dodatkowe informacje**
Wszystko co może pomóc
```

## ✅ Code Review

### Checklista przed PR
- [ ] Kod kompiluje się bez błędów
- [ ] Testy przechodzą
- [ ] Dokumentacja zaktualizowana
- [ ] Nie ma console.log/console.error
- [ ] Kod jest czytelny i dobrze sformatowany
- [ ] Dodałem odpowiednie komentarze
- [ ] Sprawdziłem czy nie ma duplikacji kodu

## 🎯 Style Guide

### JavaScript/TypeScript
- Używaj ESLint i Prettier
- Preferuj const/let nad var
- Używaj async/await nad promises
- Dodawaj typy TypeScript

### Python
- Używaj Black do formatowania
- Używaj Flake8 do lintingu
- Dodawaj type hints
- Używaj docstrings

### Git
- Pisz czytelne commity
- Używaj conventional commits
- Nie commituj node_modules/
- Nie commituj .env files

## 🤝 Kontakt

- **Issues**: [GitHub Issues](https://github.com/your-username/sps-enterprise/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/sps-enterprise/discussions)

## 📄 Licencja

Przez kontrybucję do tego projektu, zgadzasz się że twój wkład będzie licencjonowany pod MIT License. 