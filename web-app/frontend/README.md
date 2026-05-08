# Mare Calmo — Frontend React

App di supporto all'ansia da prestazione basata su una metafora marina con meccaniche di gamification soft.

## Setup

### 1. Installa le dipendenze

```bash
npm install
```

### 2. Avvia il server di sviluppo

```bash
npm run dev
```

L'app sarà disponibile su **http://localhost:5173**

### 3. Assicurati che il backend sia in esecuzione

Il backend deve essere disponibile su `http://localhost:8000`

Apri un altro terminal e esegui:

```bash
cd ../backend
uvicorn app.main:app --reload --port 8000
```

## Architettura

- **React 18** + **Vite** per lo sviluppo
- **CSS-in-JS** (inline styles)
- **SVG** per le illustrazioni animate (pesce, mare, isola)
- Comunicazione con backend tramite API REST

## Pagine

1. **Onboarding** — Introduzione alla metafora
2. **Sea Page** — Visualizzazione del mare con i pesci in movimento
3. **Island Page** — Check-in e domande sulla salute emotiva
4. **Support Page** — Feedback personalizzato con strategie di coping
5. **Progress Page** — Track della crescita e statistiche

## Build

```bash
npm run build
```

I file prodotti saranno in `dist/`

## Preview (in produzione)

```bash
npm run preview
```

## Note

- Il tema si alterna tra "notte" e "alba" con il pulsante in alto a destra
- I dati vengono gestiti nello stato locale (React Context non è usato, ma può essere aggiunto)
- Il backend manda i dati del controllo ansia dell'utente, il frontend si incarica di tutti i calcoli e le animazioni
