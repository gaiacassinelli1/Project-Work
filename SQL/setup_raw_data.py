# setup_raw_data.py
# Script per creare la tabella raw_data e importare dati da Google Sheets

import os
import json
import mysql.connector
from dotenv import load_dotenv
from googleapiclient.discovery import build
from google.oauth2 import service_account
from datetime import datetime

# ========================================
# 1. CONFIGURAZIONE
# ========================================

load_dotenv()

# Connessione MySQL
conn = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
    auth_plugin='mysql_native_password'
)
cursore = conn.cursor()
print("✅ Connesso al database MySQL!")

# ========================================
# 2. CREA TABELLA RAW_DATA
# ========================================

print("\n📋 Creazione tabella raw_data...")

# Elimina tabella esistente
cursore.execute("DROP TABLE IF EXISTS raw_data")

# Crea tabella con TUTTE le colonne
query_crea_tabella = """
CREATE TABLE raw_data (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    timestamp           DATETIME NOT NULL,
    email_indirizzo     VARCHAR(255),
    email_app           VARCHAR(255),
    consenso            VARCHAR(50),
    contesto            VARCHAR(255),
    età                 VARCHAR(50),
    genere              VARCHAR(50),
    area_geo            VARCHAR(100),
    anni_esperienza     VARCHAR(50),
    Item_1              INT,
    Item_2              INT,
    Item_3              INT,
    Item_4              INT,
    Item_5              INT,
    Item_6              INT,
    Item_7              INT,
    Item_8              INT,
    Item_9              INT,
    Item_10             INT,
    Item_11             INT,
    Item_12             INT,
    Item_13             INT,
    Item_14             INT,
    Item_15             INT,
    Item_16             INT,
    Item_17             INT,
    Item_18             INT,
    Item_19             INT,
    Item_20             INT,
    Item_21             INT,
    Item_22             INT,
    Item_23             INT,
    Item_24             INT,
    Item_25             INT,
    Item_26             INT,
    Item_27             INT,
    Item_28             INT,
    Item_29             INT,
    Item_30             TEXT,
    UNIQUE KEY unique_response (timestamp, email_indirizzo, email_app)
)
"""

cursore.execute(query_crea_tabella)
conn.commit()
print("✅ Tabella raw_data creata!")

cursore.close()
conn.close()

# ========================================
# 3. CARICA CREDENZIALI GOOGLE
# ========================================

print("\n🔑 Caricamento credenziali Google...")

credenziali_json = os.getenv("GOOGLE_CREDENTIALS")
credenziali_dict = json.loads(credenziali_json)
credenziali_dict['private_key'] = credenziali_dict['private_key'].replace('\\n', '\n')

SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

credenziali = service_account.Credentials.from_service_account_info(
    credenziali_dict,
    scopes=SCOPES
)
print("✅ Credenziali caricate!")

# ========================================
# 4. LEGGI GOOGLE SHEET
# ========================================

print("\n📡 Connessione a Google Sheets...")

ID_FOGLIO  = '14XJF4TtNgnHv_uuJeUcWAjipOYs5-hPYbslC4xXyqwQ'
INTERVALLO = 'Risposte del modulo 1!A:AM'

servizio = build('sheets', 'v4', credentials=credenziali)
foglio   = servizio.spreadsheets()

risultato = foglio.values().get(
    spreadsheetId=ID_FOGLIO,
    range=INTERVALLO
).execute()

righe = risultato.get('values', [])

if not righe:
    print("❌ Nessun dato trovato nel foglio!")
    exit()

print(f"✅ Trovate {len(righe) - 1} risposte")
print(f"📋 Numero colonne: {len(righe[0])}")

# ========================================
# 5. INSERISCI DATI IN RAW_DATA
# ========================================

print("\n📥 Inizio importazione dati in raw_data...\n")

# Riconnette al database
conn = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
    auth_plugin='mysql_native_password'
)
cursore = conn.cursor()

query_insert = """
INSERT IGNORE INTO raw_data (
    timestamp, email_indirizzo, email_app, consenso, contesto, età, genere, area_geo, anni_esperienza,
    Item_1, Item_2, Item_3, Item_4, Item_5, Item_6, Item_7,
    Item_8, Item_9, Item_10, Item_11, Item_12, Item_13, Item_14,
    Item_15, Item_16, Item_17, Item_18, Item_19, Item_20, Item_21,
    Item_22, Item_23, Item_24, Item_25, Item_26, Item_27, Item_28,
    Item_29, Item_30
) VALUES (
    %s, %s, %s, %s, %s, %s, %s, %s, %s,
    %s, %s, %s, %s, %s, %s, %s,
    %s, %s, %s, %s, %s, %s, %s,
    %s, %s, %s, %s, %s, %s, %s,
    %s, %s, %s, %s, %s, %s, %s,
    %s, %s
)
"""

inserite = 0
saltate  = 0

for i, riga in enumerate(righe[1:], start=2):
    try:
        riga_completa = riga + [None] * (39 - len(riga))

        # Converte timestamp
        try:
            ts = datetime.strptime(riga_completa[0], '%d/%m/%Y %H:%M:%S')
        except:
            try:
                ts = datetime.strptime(riga_completa[0], '%d/%m/%Y %H.%M.%S')
            except:
                ts = None

        dati = (
            ts,                   # timestamp
            riga_completa[37],    # email_indirizzo
            riga_completa[38],    # email_app
            riga_completa[1],     # consenso
            riga_completa[2],     # contesto
            riga_completa[3],     # età
            riga_completa[4],     # genere
            riga_completa[36],    # area_geo ✅ SPOSTATO QUI
            riga_completa[5],     # anni_esperienza
            riga_completa[6],     # Item_1
            riga_completa[7],     # Item_2
            riga_completa[8],     # Item_3
            riga_completa[9],     # Item_4
            riga_completa[10],    # Item_5
            riga_completa[11],    # Item_6
            riga_completa[12],    # Item_7
            riga_completa[13],    # Item_8
            riga_completa[14],    # Item_9
            riga_completa[15],    # Item_10
            riga_completa[16],    # Item_11
            riga_completa[17],    # Item_12
            riga_completa[18],    # Item_13
            riga_completa[19],    # Item_14
            riga_completa[20],    # Item_15
            riga_completa[21],    # Item_16
            riga_completa[22],    # Item_17
            riga_completa[23],    # Item_18
            riga_completa[24],    # Item_19
            riga_completa[25],    # Item_20
            riga_completa[26],    # Item_21
            riga_completa[27],    # Item_22
            riga_completa[28],    # Item_23
            riga_completa[29],    # Item_24
            riga_completa[30],    # Item_25
            riga_completa[31],    # Item_26
            riga_completa[32],    # Item_27
            riga_completa[33],    # Item_28
            riga_completa[34],    # Item_29
            riga_completa[35],    # Item_30 (testo libero)
        )

        cursore.execute(query_insert, dati)
        inserite += 1

        if inserite % 10 == 0:
            conn.commit()
            print(f"💾 Salvate {inserite} righe...")

    except Exception as e:
        print(f"⚠️ Riga {i} saltata: {e}")
        saltate += 1

conn.commit()
print(f"\n✅ Importazione completata!")
print(f"   - Righe inserite: {inserite}")
print(f"   - Righe saltate: {saltate}")

cursore.close()
conn.close()

print("\n🎉 Script completato con successo!")