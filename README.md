# CRM System - Mikroserwisy

Kompleksowy system CRM oparty na architekturze mikroserwisów z wykorzystaniem Node.js (NestJS), React, Material UI i Python (FastAPI).

## Architektura

### Mikroserwisy:
- **API Gateway** (NestJS) - Port 3000 - Główny punkt wejścia, autoryzacja JWT
- **Users Service** (NestJS) - Port 3001 - Zarządzanie użytkownikami
- **Clients Service** (NestJS) - Port 3002 - Zarządzanie klientami
- **Notes Service** (NestJS) - Port 3003 - Zarządzanie notatkami
- **PDF Service** (Python/FastAPI) - Port 8000 - Analiza plików PDF
- **Frontend** (React + Material UI) - Port 3001 - Interfejs użytkownika

### Baza danych i cache:
- **PostgreSQL** - Port 5432 - Główna baza danych
- **Redis** - Port 6379 - Cache i kolejki

## Funkcjonalności

### API Gateway
- Autoryzacja JWT
- Routing do mikroserwisów
- Endpoint `/pdf/analyze` do analizy plików PDF
- CORS configuration

### Users Service
- Rejestracja i logowanie użytkowników
- Zarządzanie profilami użytkowników
- Hashowanie haseł (bcrypt)

### Clients Service
- CRUD operacje na klientach
- Zarządzanie danymi kontaktowymi
- Informacje o firmach

### Notes Service
- Tworzenie i zarządzanie notatkami
- Powiązanie notatek z klientami
- Oznaczanie ważnych notatek

### PDF Service
- Analiza plików PDF
- Ekstrakcja danych z faktur
- Rozpoznawanie numerów faktur, dat, kwot

### Frontend
- Nowoczesny interfejs Material UI
- Dashboard z statystykami
- Zarządzanie klientami i notatkami
- Upload i analiza plików PDF

## Uruchamianie

### Wymagania
- Docker i Docker Compose
- Node.js 18+ (dla development)
- Python 3.11+ (dla development)

### Uruchomienie wszystkich serwisów
```bash
# Sklonuj repozytorium
git clone <repository-url>
cd crm-enterprise

# Uruchom wszystkie kontenery
docker-compose up -d

# Sprawdź status
docker-compose ps
```

### Dostęp do aplikacji
- **Frontend**: http://localhost:3001
- **API Gateway**: http://localhost:3000
- **PDF Service**: http://localhost:8000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Pierwsze uruchomienie
1. Otwórz http://localhost:3001 w przeglądarce
2. Zarejestruj nowe konto użytkownika
3. Zaloguj się do systemu
4. Dodaj pierwszych klientów i notatki

## Development

### Uruchomienie pojedynczych serwisów

#### API Gateway
```bash
cd api-gateway
npm install
npm run start:dev
```

#### Users Service
```bash
cd users-service
npm install
npm run start:dev
```

#### Clients Service
```bash
cd clients-service
npm install
npm run start:dev
```

#### Notes Service
```bash
cd notes-service
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

## API Endpoints

### Autoryzacja
- `POST /auth/login` - Logowanie
- `POST /auth/register` - Rejestracja

### Użytkownicy
- `GET /users` - Lista użytkowników
- `GET /users/:id` - Szczegóły użytkownika
- `POST /users` - Tworzenie użytkownika
- `PUT /users/:id` - Aktualizacja użytkownika
- `DELETE /users/:id` - Usuwanie użytkownika

### Klienci
- `GET /clients` - Lista klientów
- `GET /clients/:id` - Szczegóły klienta
- `POST /clients` - Tworzenie klienta
- `PUT /clients/:id` - Aktualizacja klienta
- `DELETE /clients/:id` - Usuwanie klienta

### Notatki
- `GET /notes` - Lista notatek
- `GET /notes/:id` - Szczegóły notatki
- `GET /notes/client/:clientId` - Notatki klienta
- `POST /notes` - Tworzenie notatki
- `PUT /notes/:id` - Aktualizacja notatki
- `DELETE /notes/:id` - Usuwanie notatki

### PDF Analysis
- `POST /pdf/analyze` - Analiza pliku PDF

## Struktura bazy danych

### Tabela users
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- role (ENUM: admin, user)
- isActive (BOOLEAN)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)

### Tabela clients
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- phone (VARCHAR)
- company (VARCHAR)
- address (TEXT)
- notes (TEXT)
- isActive (BOOLEAN)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)

### Tabela notes
- id (UUID, PK)
- title (VARCHAR)
- content (TEXT)
- clientId (UUID, FK)
- userId (UUID, FK)
- isImportant (BOOLEAN)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)

## Bezpieczeństwo

- JWT tokens dla autoryzacji
- Hashowanie haseł z bcrypt
- CORS configuration
- Walidacja danych wejściowych
- Rate limiting (można dodać)

## Monitoring i Logi

```bash
# Logi wszystkich serwisów
docker-compose logs

# Logi konkretnego serwisu
docker-compose logs api-gateway
docker-compose logs users-service
docker-compose logs pdf-service
```

## Troubleshooting

### Problem z połączeniem do bazy danych
```bash
# Sprawdź status PostgreSQL
docker-compose ps postgres

# Restart bazy danych
docker-compose restart postgres
```

### Problem z Redis
```bash
# Sprawdź status Redis
docker-compose ps redis

# Restart Redis
docker-compose restart redis
```

### Problem z mikroserwisami
```bash
# Sprawdź logi
docker-compose logs <service-name>

# Restart serwisu
docker-compose restart <service-name>
```

## Rozszerzenia

### Możliwe ulepszenia:
- Dodanie RabbitMQ dla asynchronicznej komunikacji
- Implementacja WebSocket dla real-time updates
- Dodanie Elasticsearch dla wyszukiwania
- Implementacja systemu powiadomień
- Dodanie raportów i analityki
- Backup i restore bazy danych
- CI/CD pipeline
- Kubernetes deployment

## Licencja

MIT License 