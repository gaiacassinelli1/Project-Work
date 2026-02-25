# 🔐 Modulo Autenticazione - Guida

## Struttura

```
app/auth/
├── __init__.py         # Package initialization
├── security.py        # Hash password, JWT token
├── auth.py            # Servizio autenticazione (novo)
└── dependencies.py    # Dependency injection per FastAPI
```

## Flusso di Autenticazione

### 1. Registrazione (`POST /api/auth/register`)
```
email + password
    ↓
app.auth.auth.register_user()
    ↓
Hash password (bcrypt)
Crea User + 3 Fish + SeaState
    ↓
JWT token
```

### 2. Login (`POST /api/auth/login`)
```
email + password
    ↓
app.auth.auth.login_user()
    ↓
Verifica credenziali
    ↓
JWT token
```

### 3. Accesso Protetto
```
Authorization: Bearer <token>
    ↓
app.auth.dependencies.get_current_user()
    ↓
Verifica token, ottiene User
    ↓
Usa User nelle rotte
```

## File Principali

### `security.py`
- `hash_password()`: Hash bcrypt
- `verify_password()`: Verifica password
- `create_access_token()`: Genera JWT (24h)
- `verify_token()`: Valida JWT

**Miglioramenti:**
- Type hints completi
- Better error handling
- Documentazione dettagliata

### `auth.py` (Nuovo)
- `register_user()`: Registrazione con setup iniziale
- `login_user()`: Autenticazione e token generation

**Perché:**
- Centralizza la logica di business
- Riusabile in più endpoint
- Più facile da testare e maintainer

### `dependencies.py`
- `get_current_user()`: Dependency per rotte protette

**Miglioramenti:**
- `HTTPAuthCredentials` type hint corretto
- Validation completa del token
- Messaggi di errore chiari

## Migrazione dalla Vecchia Struttura

Le rotte (`app/routes/api.py`) ora usano il servizio centralizzato:

**Prima:**
```python
@router.post("/auth/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    # 50+ righe di logica inline
```

**Dopo:**
```python
@router.post("/auth/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    result = register_user(data.email, data.password, data.locale, db)
    return AuthResponse(**result)
```

## Errori Comuni Risolti

1. **`AttributeError: 'NoneType' object has no attribute 'credentials'`**
   - Causa: Type hint mancante per `credentials`
   - Soluzione: Aggiunto `HTTPAuthCredentials` type

2. **`Token non valido` ma il token è buono**
   - Causa: Messaggi di errore vaghi nei fallback
   - Soluzione: Migliorati i messaggi di debug

3. **Logica di autenticazione sparsa**
   - Causa: Precedentemente inline nelle rotte
   - Soluzione: Centralizzata in `auth.py`

## Testing

### Registrazione
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","locale":"it"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Accesso Protetto
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <token>"
```

## Prossimi Passi

- [ ] Refresh token (long-lived sessions)
- [ ] Password reset via email
- [ ] 2FA (optional)
- [ ] Rate limiting su auth endpoints
