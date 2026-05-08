# 🌊 Mare Calmo - Backend

**API Backend per app di supporto all'ansia da prestazione**

App con metafora visiva non competitiva, gamification soft e raccolta dati longitudinali.

---

## Quick Start

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\Activate.ps1 on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API sarà disponibile su `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Architettura

```
[ React Frontend ]         ← Client
        ↓ REST API
[ FastAPI Backend ]        ← Logica + Algoritmi
        ↓
[ SQLAlchemy ORM ]
        ↓
[ SQLite Database ]        ← Persistenza
        ↓
[ Analytics Service ]      ← Insights (MongoDB optional)
```

---

## Struttura Progetto

```
backend/
├── app/
│   ├── main.py                  # FastAPI app + CORS + routes
│   ├── schemas.py               # Pydantic models (request/response)
│   ├── simulate.py              # Simulazione 30 giorni di dati
│   │
│   ├── auth/                    # ✨ Modulo autenticazione ristrutturato
│   │   ├── security.py          # Hash, JWT tokens, verification
│   │   ├── auth.py              # Logica registrazione + login (nuovo)
│   │   ├── dependencies.py      # Dependency injection (@Depends)
│   │   └── README.md            # Guida dettagliata autenticazione
│   │
│   ├── db/
│   │   ├── database.py          # SQLAlchemy SQLite config
│   │   └── mongodb.py           # MongoDB optional
│   │
│   ├── models/
│   │   └── models.py            # SQLAlchemy models
│   │
│   ├── routes/
│   │   └── api.py               # Endpoints REST
│   │
│   └── services/
│       ├── growth.py            # Algoritmo crescita pesci
│       ├── sea_state.py         # Algoritmo stato mare
│       ├── export.py            # Export JSON + MongoDB
│       └── analytics.py         # Insights
│
├── requirements.txt             # Python dependencies
├── mare_calmo.db               # SQLite database
└── .env                         # Environment variables
```

---

## API Endpoints

### Autenticazione 🔐

| Metodo | Endpoint                          | Auth | Descrizione |
|--------|-----------------------------------|------|-------------|
| POST   | `/api/auth/register`              | ❌   | Registra nuovo utente + setup fish |
| POST   | `/api/auth/login`                 | ❌   | Login e generazione JWT token (24h) |
| GET    | `/api/auth/me`                    | ✅   | Info utente autenticato |

### Game State 🎮

| Metodo | Endpoint                          | Auth | Descrizione |
|--------|-----------------------------------|------|-------------|
| POST   | `/api/events`                     | ✅   | Registra evento (immutabile) |
| GET    | `/api/user/{user_id}/sea-state`   | ✅   | Stato mare calcolato |
| GET    | `/api/user/{user_id}/fish`        | ✅   | Stato pesci (discretizzato) |
| POST   | `/api/user/{user_id}/compute-state` | ✅ | Ricalcola pesci + mare |

### Analytics & Export 📊

| Metodo | Endpoint                          | Auth | Descrizione |
|--------|-----------------------------------|------|-------------|
| GET    | `/api/user/{user_id}/export-data` | ✅   | Export JSON (backup completo) |
| POST   | `/api/user/{user_id}/export-mongodb` | ✅ | Export + sync MongoDB |
| GET    | `/api/user/{user_id}/analytics`   | ✅   | Analytics da MongoDB |

✅ = Richiede JWT token in `Authorization: Bearer <token>`

---

## Autenticazione 🔐

### Flusso

1. **Registrazione** → JWT token + Fish setup + SeaState
2. **Login** → JWT token
3. **Rotte Protette** → Verifica token in `Authorization: Bearer <token>`

### Modulo Auth (Ristrutturato)

Il modulo autenticazione è stato completamente ristrutturato:

**Componenti:**
- `security.py` - Hash password, JWT tokens, verification
- `auth.py` - **NUOVO** - Logica centralizzata di registrazione/login
- `dependencies.py` - Dependency FastAPI per proteggere route

**Miglioramenti recenti:**
- ✅ Type hint corretto per `HTTPAuthCredentials`
- ✅ Logica centralizzata in `accounts.auth.py`
- ✅ Messaggi di errore chiari
- ✅ Validazione token robusta

**Per dettagli:** Vedi [app/auth/README.md](app/auth/README.md)

---

## Modelli Dati 📋

### User
```python
id: UUID (str)
email: str (unique, indexed)
hashed_password: str (bcrypt)
created_at: datetime
locale: str (e.g., 'it')
onboarding_completed: bool
```

### Event (Immutabile)
```python
id: UUID (str)
user_id: FK → User
event_type: str ("check_in" | "micro_action" | "reflection")
metadata_json: dict
created_at: datetime (indexed)
```

### Fish
```python
id: UUID (str)
user_id: FK → User (indexed)
dimension: str ("studio" | "lavoro" | "benessere")
created_at: datetime
```

### FishState (Derivato, ricalcolabile)
```python
fish_id: PK → Fish
growth_level: float [0.0 → 1.0]
visual_stage: str ("small" | "medium" | "large")
last_computed: datetime
```

### SeaState (Derivato, ricalcolabile)
```python
user_id: PK → User
sea_state_score: float [0.0 → 1.0]
sea_state_label: str
visual_params: dict
last_computed: datetime
```

---

## Algoritmi 🧮

### Crescita Pesci

Ogni pesce tiene un `growth_level` [0.0 → 1.0] basato su:
- Numero eventi per dimensione
- Tempo trascorso
- Frequenza di interazione

**Visual stage cambia a intervalli discreti:**
- 0.0 → 0.33: `small` 🐠
- 0.33 → 0.66: `medium` 🐟
- 0.66 → 1.0: `large` 🐳

### Stato Mare

`sea_state_score` = media `growth_level` dei 3 pesci

**Label:**
- score < 0.25: "tempestoso" 🌪️
- 0.25 → 0.5: "agitato" 🌊
- 0.5 → 0.75: "mosso" 〰️
- score >= 0.75: "calmo" 🧘

---

## Environment Variables

```env
# JWT signing key (required for production)
SECRET_KEY=your-secret-key-here

# MongoDB (optional, for analytics)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=mare_calmo
```

Se non impostati, usano defaults (development mode).

---

## Testing API

### Registrazione
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123","locale":"it"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"pass123"}'

# Salva il token per richieste successive
TOKEN="<token_dall_output_sopra>"
```

### Accesso Protetto
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Stato Mare
```bash
USER_ID="<user_id_from_login>"
curl -X GET "http://localhost:8000/api/user/$USER_ID/sea-state" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Development

```bash
# Installare dipendenze
pip install -r requirements.txt

# Run server con auto-reload
uvicorn app.main:app --reload --port 8000

# Simulare 30 giorni di dati
python -c "from app.simulate import simulate_30_days; simulate_30_days('<user_id>')"
```

---

## Production Checklist

- [ ] Cambiare `SECRET_KEY` in `.env`
- [ ] Configurare MongoDB per analytics
- [ ] Settare `allow_origins` in CORS (non `["*"]`)
- [ ] Aggiungere HTTPS
- [ ] Database backup strategy
- [ ] Monitoring + logging
- [ ] Rate limiting su auth endpoints
- [ ] Database size optimization

---

## Stack Tecnologico

| Layer       | Tecnologia      | Note |
|-------------|-----------------|------|
| Framework   | FastAPI         | Async-ready, type-safe |
| ORM         | SQLAlchemy 2.0  | Modern, flexible |
| Database    | SQLite          | Dev; PostgreSQL per prod |
| Auth        | JWT + bcrypt    | Secure, standard |
| Analytics   | MongoDB (opt)   | NoSQL per dati longitudinali |
| Validation  | Pydantic        | Request/response models |

---

## Disclaimer

❗ Questa app non sostituisce un professionista della salute mentale.
Non diagnostica, non prescrive, non cura.
Se senti di aver bisogno di supporto, parlane con qualcuno di cui ti fidi.
