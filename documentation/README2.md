# Setup Google Sheets Integration

## Configurazione Credenziali Google

Lo script `setup_raw_data.py` legge i dati da un Google Sheet e li importa in MySQL.

### Passi per ottenere le credenziali:

1. **Google Cloud Console** → https://console.cloud.google.com/
2. **Crea un nuovo progetto** (o usa uno esistente)
3. **Abilita le API:**
   - Google Sheets API
   - Google Drive API
4. **Crea un Service Account:**
   - Menu → "Service Accounts"
   - Crea un nuovo service account
   - Assegna il ruolo: "Editor"
5. **Scarica il JSON:**
   - Nel service account, vai a "Keys"
   - "Add Key" → "Create new key" → JSON
   - Scarica il file JSON

### Utilizzo del file:

**Opzione 1 (Consigliato):**
```bash
# Copia il JSON scaricato a:
SQL/credentials.json

# Poi esegui:
python SQL/setup_raw_data.py
```

**Opzione 2 (Non consigliato):**
Copia il contenuto JSON nel `.env`:
```env
GOOGLE_CREDENTIALS={"type":"service_account",...}
```

### File di Esempio:

Vedi `SQL/credentials.example.json` per la struttura corretta.

---

⚠️ **IMPORTANTE:** 
- Non committare `SQL/credentials.json` (è già in `.gitignore`)
- Non condividere il file JSON con altri
- Le credenziali contengono chiavi private!
