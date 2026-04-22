# Script per creare la tabella raw_data e importare dati da Google Sheets

import os
from dotenv import load_dotenv
from datetime import datetime
from connessioni import get_mysql_connection, get_google_sheets_service

def converti_vuoto_in_null(valore):
    """Converte stringhe vuote o None in NULL"""
    if valore is None or valore == '':
        return None
    return valore

def converti_item(valore):
    """Converte Items: vuoti o '0' → None, altrimenti → int"""
    if valore is None or valore == '' or valore == '0':
        return None
    try:
        val_int = int(valore)
        # Se è 0, ritorna None (celle vuote in Google Sheets)
        return None if val_int == 0 else val_int
    except:
        return None

# Carica .env dalla root del progetto
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

# Connessione MySQL
conn = get_mysql_connection()
cursore = conn.cursor()

print("\nCreazione tabella raw_data...")

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
    Item_30             TEXT
)
"""

cursore.execute(query_crea_tabella)
conn.commit()
print("Tabella raw_data creata")

print("\nCredenziali caricate!")

try:
    servizio = get_google_sheets_service()
except Exception as e:
    print(f"Errore nel caricamento credenziali: {e}")
    exit()


print("\nConnessione a Google Sheets...")

ID_FOGLIO  = os.getenv("GOOGLE_SHEET_ID")
INTERVALLO = os.getenv("GOOGLE_SHEET_RANGE")

if not ID_FOGLIO or not INTERVALLO:
    print("Errore: GOOGLE_SHEET_ID o GOOGLE_SHEET_RANGE non configurati nel .env!")
    exit()

foglio = servizio.spreadsheets()

risultato = foglio.values().get(
    spreadsheetId=ID_FOGLIO,
    range=INTERVALLO
).execute()

righe = risultato.get('values', [])

if not righe:
    print("Errore: Nessun dato trovato nel foglio!")
    exit()

print(f"Trovate {len(righe) - 1} risposte")
print(f"Numero colonne: {len(righe[0])}")

# Chiudi la connessione iniziale prima di leggere dal foglio
cursore.close()
conn.close()

print("\nInizio importazione dati in raw_data...\n")

# Ricrea la connessione per l'inserimento
conn = get_mysql_connection()
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
            ts,                                           # timestamp
            converti_vuoto_in_null(riga_completa[37]),  # email_indirizzo
            converti_vuoto_in_null(riga_completa[38]),  # email_app
            converti_vuoto_in_null(riga_completa[1]),   # consenso
            converti_vuoto_in_null(riga_completa[2]),   # contesto
            converti_vuoto_in_null(riga_completa[3]),   # età
            converti_vuoto_in_null(riga_completa[4]),   # genere
            converti_vuoto_in_null(riga_completa[36]),  # area_geo
            converti_vuoto_in_null(riga_completa[5]),   # anni_esperienza
            converti_item(riga_completa[6]),             # Item_1
            converti_item(riga_completa[7]),             # Item_2
            converti_item(riga_completa[8]),             # Item_3
            converti_item(riga_completa[9]),             # Item_4
            converti_item(riga_completa[10]),            # Item_5
            converti_item(riga_completa[11]),            # Item_6
            converti_item(riga_completa[12]),            # Item_7
            converti_item(riga_completa[13]),            # Item_8
            converti_item(riga_completa[14]),            # Item_9
            converti_item(riga_completa[15]),            # Item_10
            converti_item(riga_completa[16]),            # Item_11
            converti_item(riga_completa[17]),            # Item_12
            converti_item(riga_completa[18]),            # Item_13
            converti_item(riga_completa[19]),            # Item_14
            converti_item(riga_completa[20]),            # Item_15
            converti_item(riga_completa[21]),            # Item_16
            converti_item(riga_completa[22]),            # Item_17
            converti_item(riga_completa[23]),            # Item_18
            converti_item(riga_completa[24]),            # Item_19
            converti_item(riga_completa[25]),            # Item_20
            converti_item(riga_completa[26]),            # Item_21
            converti_item(riga_completa[27]),            # Item_22
            converti_item(riga_completa[28]),            # Item_23
            converti_item(riga_completa[29]),            # Item_24
            converti_item(riga_completa[30]),            # Item_25
            converti_item(riga_completa[31]),            # Item_26
            converti_item(riga_completa[32]),            # Item_27
            converti_item(riga_completa[33]),            # Item_28
            converti_item(riga_completa[34]),            # Item_29
            converti_vuoto_in_null(riga_completa[35]),  # Item_30 (testo)
        )        

        cursore.execute(query_insert, dati)
        inserite += 1

        if inserite % 10 == 0:
            conn.commit()
            print(f"Salvate {inserite} righe...")

    except Exception as e:
        print(f"Riga {i} saltata: {e}")
        saltate += 1

conn.commit()
print(f"\nImportazione completata!")
print(f"   - Righe inserite: {inserite}")
print(f"   - Righe saltate: {saltate}")

cursore.close()
conn.close()

print("\nFine")
