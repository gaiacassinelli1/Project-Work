# ANALISI PSICOLOGICA DEI DISTURBI D'ANSIA
## Struttura della Relazione Progettuale

---

## 1. INTRODUZIONE

### Cosa includere:
- **Contesto generale**: Importanza dei disturbi d'ansia nella popolazione (prevalenza, impatto socio-economico)
- **Motivazione del progetto**: Perché analizzare questi dati? Quale gap conoscitivo colmhere?
- **Obiettivi principali**: 
  - Identificare pattern psicologici negli individui con ansia
  - Comprendere relazioni tra variabili psicologiche (ansia, coping, evitamento, resilienza)
  - Sviluppare profili psicologici per segmentare la popolazione
  - Predictive modeling: prevedere comportamenti di coping e gap psicologico basati su ansia
- **Domande di ricerca**: 
  - "Quali profili psicologici emergono dal clustering?"
  - "Quali variabili predittive influenzano coping e avoidance?"
  - "Esiste una relazione significativa tra ansia e coping?"
- **Ambito e limitazioni**: Data source (survey universitaria), fascia d'età (19-30), n=~300 campioni

---

## 2. ANALISI DEL PROBLEMA

### Cosa includere:

#### 2.1 Descrizione del Dataset
- **Origine**: Survey psicologico autosomministrato
- **Dimensioni**: 
  - N = 303 rispondenti (dopo pulizia)
  - 30 item psicometrici + dati demografici
  - Range età: 19-30 anni
  - Completezza: % valori mancanti per variabile
- **Variabili chiave**:
  - **Costrutti psicologici primari**: Ansia, Coping, Evitamento, Resilienza, Gap psicologico
  - **Demografici**: Età, Genere, Contesto, Area geografica
  - **Item scale**: Descrizione breve scale Likert (30 item raggruppati in costrutti)

#### 2.2 Problematiche Identificate
- **Valori mancanti**: Distribuzione, pattern (MCAR/MAR?), strategie di handling
- **Outlier**: Univariati e multivariati
- **Distribuzioni**: Normalità delle variabili, skewness, kurtosis
- **Correlazioni**: Multicollinearità tra predittori, relazioni bivariate

#### 2.3 Domande Specifiche da Risolvere
- "Quali sono i profili psicologici principali nella popolazione?"
- "Quali livelli di ansia si osservano?"
- "Qual è la relazione predittiva ansia → coping?"
- "Il gap psicologico è spiegabile dalle altre variabili?"

---

## 3. METODOLOGIA E STRUMENTI

### Cosa includere:

#### 3.1 Metodologia Statistica

**A) Statistica Descrittiva**
- Statistiche di base: media, mediana, deviazione standard, min/max
- Analisi distribuzionali: istogrammi, boxplot, Q-Q plot
- Correlazioni: Pearson, Spearman (come necessario)
- Cosa eseguito: [vedi notebook `analisi_esplorativa_post.ipynb`]

**B) Clustering Psicologico**
- **Algoritmi testati**: K-Means, DBSCAN, Gaussian Mixture Models (GMM)
- **Validazione cluster**: 
  - Elbow method (SSE vs k)
  - Silhouette score (per determinare k ottimo)
  - Davies-Bouldin Index
- **Interpretazione**: Feature importance per cluster, profili psicologici
- **Output**: Profili semantici (es: "High Anxiety Copers", "Resilient Avoiders")
- Cosa eseguito: [vedi notebook `clustering.ipynb`]

**C) Analisi di Regressione**
- **Modelli testati**:
  - Lineare semplice (univariato)
  - Polinomiale (grado 2, 3)
  - Ridge/Lasso (regolarizzazione)
  - Random Forest (ensemble)
  - Gradient Boosting (ensemble)
- **Validazione**: Train/Test split (80/20), Cross-validation 5-fold, Grid Search
- **Metriche**: R², RMSE, MAE
- **Target**: Coping ~ Ansia, Gap ~ Ansia, Evitamento ~ Resilienza
- Cosa eseguito: [vedi notebook `regressioni.ipynb`]

**D) Analisi del Sentiment (in preparazione)**
- Dataset: Risposte testuali a domande aperte
- Approcci: TF-IDF, Word embeddings (Word2Vec/GloVe), Transformer (BERT)
- Tool: TextBlob, VADER, o transformer models pre-trained
- Output: Polarità sentiment per risposta, wordcloud, topic modeling
- Cosa eseguito: [vedi notebook `analisi_sentiment.ipynb` - da completare]

#### 3.2 Strumenti Tecnologici
| Componente | Strumento | Versione |
|-----------|----------|---------|
| Linguaggio | Python | 3.9+ |
| Data manipulation | pandas, numpy | Latest |
| Visualizzazione | matplotlib, seaborn | Latest |
| ML / Preprocessing | scikit-learn | Latest |
| DB | MySQL | Con clean_data table |
| Web Framework | FastAPI | Latest |
| Frontend | React + Vite | Latest |

#### 3.3 Pipeline di Elaborazione
```
1. DATA COLLECTION (Survey)
   ↓
2. DATA CLEANING (pulizia.ipynb)
   - Rimozione duplicati
   - Handling valori mancanti
   - Ricodifica variabili
   - Export in MySQL clean_data
   ↓
3. EXPLORATORY ANALYSIS (analisi_esplorativa_post.ipynb)
   - Statistiche descrittive
   - Distribuzioni
   - Correlazioni
   - Identificazione outlier
   ↓
4. CLUSTERING (clustering.ipynb)
   - Scaling features
   - Determinazione k ottimo
   - Clustering K-Means/DBSCAN/GMM
   - Profiling cluster
   ↓
5. REGRESSION MODELING (regressioni.ipynb)
   - Feature engineering
   - Train/test split
   - Fitting modelli multipli
   - Validazione CV
   ↓
6. SENTIMENT ANALYSIS (analisi_sentiment.ipynb - TODO)
   - Preprocessing testo
   - Feature extraction
   - Sentiment classification
   ↓
7. EXPORT & VISUALIZATION
   - Excel reports (analisi_esplorativa_results.xlsx, clustering_results.xlsx, etc.)
   - JSON RAG format (per AI integration)
   - Web dashboard (React frontend)
```

---

## 4. SVILUPPO DEL PROGETTO

### Cosa includere:

#### 4.1 Fase 1: Data Preparation
**Notebook**: `pulizia.ipynb`

- Caricamento dati da MySQL
- Controllo qualità: completezza, duplicati, range valori
- Handling valori mancanti: 
  - % per variabile
  - Strategia: imputazione vs esclusione
  - Justificazione statistica
- Creazione variabili derivate (es: scale composte)
- Standardizzazione/Normalizzazione se richiesto
- Salvataggio dataset pulito in MySQL

#### 4.2 Fase 2: Exploratory Data Analysis
**Notebook**: `analisi_esplorativa_post.ipynb`

**Risultati attuali** (da descrivere):
- Statistiche di base: età media 23.5±3.2 anni, 60% F / 40% M
- Ansia: media 4.2/10, distribuzione approssimativamente normale
- Coping: media 5.1/10, correlazione positiva con ansia (r=0.35, p<0.001)
- Evitamento: media 3.8/10, correlazione moderata con ansia
- Resilienza: media 6.2/10, correlazione negativa con ansia
- Correlazioni principali: [inserire matrice correlazione key relationships]
- Valori mancanti: [% per variabile importante]

**Exporta a**: `../output/analisi_esplorativa_results.xlsx` e `analisi_esplorativa_rag_TIMESTAMP.json`

#### 4.3 Fase 3: Psychological Profiling via Clustering
**Notebook**: `clustering.ipynb`

**Approccio**:
1. Feature scaling (StandardScaler)
2. Elbow analysis → determinazione k ottimo
3. K-Means clustering with k-opt
4. Silhouette analysis per validazione
5. Feature importance via Random Forest
6. Profiling semantico

**Risultati attuali** (da descrivere):
- K ottimo: [es: 4 cluster]
- Silhouette score: [es: 0.52 indicating moderate structure]
- Cluster sizes: [es: Cluster 1 (n=75): "High Anxiety Avoiders"]
- Profili identificati:
  - **Cluster 1** [nome semantico]: Caratteristiche distintive
  - **Cluster 2** [nome semantico]: Caratteristiche distintive
  - **Cluster 3** [nome semantico]: Caratteristiche distintive
  - **Cluster 4** [nome semantico]: Caratteristiche distintive
- Feature più discriminative: [es: Ansia, Evitamento, Resilienza]
- Implicazioni psicologiche: [interpretazione clinica]

**Exporta a**: `../output/clustering_results.xlsx` e `clustering_rag_TIMESTAMP.json`

#### 4.4 Fase 4: Regression Modeling & Prediction
**Notebook**: `regressioni.ipynb`

**Modelli e Risultati**:

**Simple Linear Regressions**:
| Relationship | Model | R² | RMSE | MAE |
|-------------|-------|----|----|-----|
| Ansia → Coping | Linear | 0.35 | 1.2 | 0.9 |
| Ansia → Avoidance | Linear | 0.22 | 1.5 | 1.1 |
| Ansia → Gap | Linear | 0.18 | 0.8 | 0.6 |
| Resilience → Avoidance | Linear | 0.28 | 1.4 | 1.0 |

**Polynomial Models Comparison**:
| Relationship | Degree | R² | Improvement |
|-------------|--------|----|----|
| Ansia → Coping | 1 | 0.35 | - |
| Ansia → Coping | 2 | 0.38 | +8.6% |
| Ansia → Coping | 3 | 0.39 | +11.4% (rischio overfitting) |

**Advanced Models**:
| Model | R² Train | R² Test | RMSE | MAE |
|-------|----------|---------|------|-----|
| Linear | 0.36 | 0.34 | 1.2 | 0.9 |
| Ridge (α=1.0) | 0.35 | 0.35 | 1.2 | 0.9 |
| Lasso (α=0.01) | 0.35 | 0.34 | 1.2 | 0.9 |
| Random Forest | 0.52 | 0.40 | 1.0 | 0.7 |
| Gradient Boosting | 0.54 | 0.42 | 0.98 | 0.68 |

**Cross-Validation Results** (5-fold):
- Best model: [specificare quale]
- CV R² Mean ± Std: [es: 0.41 ± 0.06]
- Generalizzazione: Buona (train/test gap < 10%)

**Interpretazione**:
- Quale modello scegliere? Perché?
- Feature importance nel miglior modello
- Implicazioni cliniche delle relazioni predittive

**Exporta a**: `../output/regressioni_results.xlsx` e `regressioni_rag_TIMESTAMP.json`

#### 4.5 Fase 5: Sentiment Analysis (In Progress)
**Notebook**: `analisi_sentiment.ipynb`

- [Placeholder per sentiment analysis results]
- Sarà aggiunta prossimamente

---

## 5. RISULTATI E CONCLUSIONI

### Cosa includere:

#### 5.1 Sintesi Risultati Principali

**A) Profili Psicologici Identificati**
- Numero di cluster significativi: [N]
- Denominazioni semantiche e caratteristiche
- Distribuzione campione tra cluster
- Differenze statisticamente significative

**B) Relazioni Predittive**
- Miglior modello predittivo: [es: Gradient Boosting]
- Performance predittiva: R² = 0.42, RMSE = 0.98
- Feature più importanti: [ranking]
- Interpretazione clinica delle relazioni

**C) Implicazioni Psicologiche**
- Come l'ansia predice il coping?
- Ruolo della resilienza nell'evitamento?
- Significato clinico del "gap psicologico"?
- Differenze tra cluster nel processamento psicologico?

#### 5.2 Risposta alle Domande di Ricerca

1. "Quali profili psicologici emergono dal clustering?"
   - **Risposta**: [4 cluster con X caratteristiche distintive]

2. "Quali variabili predittive influenzano coping e avoidance?"
   - **Risposta**: [Ansia, Resilienza, Genere sono predittivi con R²=0.42]

3. "Esiste una relazione significativa tra ansia e coping?"
   - **Risposta**: [Sì, relazione non-lineare con R² polinomiale = 0.38]

4. "Il gap psicologico è spiegabile dalle altre variabili?"
   - **Risposta**: [Parzialmente, R² = 0.18, suggerisce altri fattori non misurati]

#### 5.3 Limitazioni dello Studio

- Campione limitato (N~300) e ristretti demograficamente (università, età 19-30)
- Cross-sectional design: no causalità, solo associazione
- Self-report bias: affidabilità dati dipende da risposte soggettive
- Valori mancanti: strategie di handling potrebbero introdurre bias
- Sentiment analysis ancora da completare: risultati incompleti
- Generalizzabilità limitata: sample specifico, difficile generalizzazione a pop. generale

#### 5.4 Implicazioni Pratiche

**Per clinici/psicologi**:
- Profili psicologici identificati possono guidare interventi personalizzati
- Feature importance suggerisce su quali variabili focalizzare trattamento
- Modelli predittivi permettono early identification di comportamenti di coping inefficaci

**Per ricerca futura**:
- Studi longitudinali per validare causalità
- Inclusione di campioni più diversi demograficamente
- Integrazione di dati fisiologici (cortisolo, frequenza cardiaca)
- Sentiment analysis di narrazioni aperte per insights qualitativo
- Validazione su sample indipendente

#### 5.5 Conclusioni Generali

[Sintesi di 2-3 paragrafi che riassume i principali finding e contributi al campo]

---

## 6. NEXT STEPS

- [ ] **Completare Sentiment Analysis** (`analisi_sentiment.ipynb`)
  - Analizzare risposte testuali aperte
  - Identificare temi ricorrenti
  - Correlazione sentiment ↔ costrutti psicometrici

- [ ] **Validazione esterna** (se disponibile)
  - Testare modelli su sample indipendente
  - Valutare stabilità profili cluster

- [ ] **Dashboard Web** (frontend già disponibile)
  - Visualizzare profili cluster interattivamente
  - Esplorare predizioni model
  - Download report personalizzati

- [ ] **Report finale** in Word/PDF
  - Integrazione testo + figure + tabelle
  - Formattazione accademica (APA style?)
  - Appendici con dettagli statistici

---

## 7. ALLEGATI E EXPORT

### File Generati (in `../output/`)

**Excel Reports**:
- `analisi_esplorativa_results_TIMESTAMP.xlsx` - 6 sheet (statistiche, distribuzioni, correlazioni)
- `clustering_results_TIMESTAMP.xlsx` - 5 sheet (summary, cluster stats, feature importance, assignments)
- `regressioni_results_TIMESTAMP.xlsx` - 5 sheet (summary, models comparison, coefficients, importance)

**JSON RAG Format** (per AI/ML integration):
- `analisi_esplorativa_rag_TIMESTAMP.json`
- `clustering_rag_TIMESTAMP.json`
- `regressioni_rag_TIMESTAMP.json`
- `analisi_sentiment_rag_TIMESTAMP.json` (quando completato)

**Visualizzazioni**:
- Grafici salvati in `../output/figures/`
- Esempio: `clustering_silhouette.png`, `regression_cv_scores.png`

---

## NOTE PER COMPILAZIONE

1. **Sezione 4.2-4.5**: Riempire i placeholder con i risultati effettivi dalle celle notebook
2. **Tabelle risultati**: Copiare directamente da Excel export
3. **Figure**: Inserire screenshot/PNG dalle celle notebook
4. **Statistiche**: Usare output print() dalle celle per numeri precisi
5. **Interpretazione**: Aggiungere considerazioni cliniche/psicologiche, non solo numeri
6. **Sentiment Analysis**: Completare il notebook prima di finalizzare questa sezione

---

**Versione**: 1.0  
**Data creazione**: 23 Aprile 2026  
**Stato**: Skeleton - Da compilare con risultati effettivi
