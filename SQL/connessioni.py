# connessione file mysql
from dotenv import load_dotenv
import mysql.connector
import os
import json
from googleapiclient.discovery import build
from google.oauth2 import service_account

# Carica .env dalla root del progetto
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

def get_mysql_connection():
    
    #Crea e ritorna una connessione MySQL

    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        auth_plugin='mysql_native_password'
    )
    return conn

def get_google_sheets_service():
    """Carica credenziali Google e ritorna il servizio Google Sheets"""
    
    # Prova a leggere da file credentials.json prima di .env
    credentials_file = os.path.join(os.path.dirname(__file__), 'analisi-ansia-dcecdb75c868.json')
    
    if os.path.exists(credentials_file):
        # Leggi da file
        with open(credentials_file, 'r') as f:
            credenziali_dict = json.load(f)
    else:
        # Prova da .env
        credenziali_json = os.getenv("GOOGLE_CREDENTIALS")
        if not credenziali_json:
            raise ValueError("GOOGLE_CREDENTIALS non configurato nel .env!")
        try:
            credenziali_dict = json.loads(credenziali_json)
        except json.JSONDecodeError:
            raise ValueError("GOOGLE_CREDENTIALS non è un JSON valido!")
    
    if 'private_key' not in credenziali_dict:
        raise ValueError("'private_key' non trovato nelle credenziali!")
    
    # Prepara private_key (gestisce il formato \n)
    credenziali_dict['private_key'] = credenziali_dict['private_key'].replace('\\n', '\n')
    
    # Carica scopes da .env (separati da virgola)
    scopes_str = os.getenv("GOOGLE_SCOPES", "https://www.googleapis.com/auth/spreadsheets.readonly")
    scopes = [scope.strip() for scope in scopes_str.split(',')]
    
    # Crea le credenziali
    credenziali = service_account.Credentials.from_service_account_info(
        credenziali_dict,
        scopes=scopes
    )
    
    # Ritorna il servizio Google Sheets
    return build('sheets', 'v4', credentials=credenziali)

if __name__ == "__main__":
    # Test MySQL
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT DATABASE()")
        db_name = cursor.fetchone()[0]
        print("Connection successful!")
        print(f"Connected to database: {db_name}")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"MySQL connection failed: {e}")
"""
# connessione file json
import firebase_admin
from firebase_admin import credentials, firestore

import os
import json
from dotenv import load_dotenv
from google.oauth2 import service_account



# Firebase/Firestore setup
credentials_json = os.getenv("GOOGLE_CREDENTIALS")
credentials_dict = json.loads(credentials_json)

cred = credentials.Certificate(credentials_dict)
firebase_admin.initialize_app(cred)

db = firestore.client()

print("Firebase connected successfully!")

# Now you can use both MySQL and Firestore
# conn.close()  # Close when done
"""