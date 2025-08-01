# Test Users - Dane logowania

## Użytkownicy testowi SuperParkiet CRM

### 1. Arek Orłowski (Administrator)
- **Email**: `a.orlowski@superparkiet.pl`
- **Hasło**: `SuperParkiet123`
- **Rola**: `admin`
- **Status**: `active`
- **ID**: `cedb2a5f-5cf8-426f-a64a-686d4eca476e`

### 2. Paulina Sowińska (Sales)
- **Email**: `p.sowinska@superparkiet.pl`
- **Hasło**: `SuperParkiet456`
- **Rola**: `sales`
- **Status**: `active`
- **ID**: `8192cb3a-0c60-4cf0-a7a2-65d464ae7edf`

### 3. Grzegorz Pol (Manager)
- **Email**: `g.pol@superparkiet.pl`
- **Hasło**: `SuperParkiet789`
- **Rola**: `manager`
- **Status**: `active`
- **ID**: `5ef5b2f2-18a7-404d-a3de-b50981f986e6`

---

## Użycie w testach

### Login endpoint test:
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "a.orlowski@superparkiet.pl",
    "password": "SuperParkiet123"
  }'
```

### Utworzone: 2025-07-26
### Environment: Development
### Database: PostgreSQL (localhost:5432)

**UWAGA**: To są dane testowe do developmentu. W produkcji użyj innych haseł!