# connessione file mysql
import mysql.connector
import os

def get_mysql_connection():
    """
    Crea e ritorna una connessione MySQL
    
    Returns:
        mysql.connector.connection: Connessione al database
    
    Example:
        conn = get_mysql_connection()
        cursore = conn.cursor()
    """
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        auth_plugin='mysql_native_password'
    )
    return conn

if __name__ == "__main__":
    # Test MySQL
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT DATABASE()")
        db_name = cursor.fetchone()[0]
        print("✅ Connection successful!")
        print(f"✅ Connected to database: {db_name}")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"❌ MySQL connection failed: {e}")

# connessione file json
import firebase_admin
from firebase_admin import credentials, firestore

import os
import json
from dotenv import load_dotenv
from google.oauth2 import service_account


load_dotenv()

# Firebase/Firestore setup
credentials_json = os.getenv("GOOGLE_CREDENTIALS")
credentials_dict = json.loads(credentials_json)

cred = credentials.Certificate(credentials_dict)
firebase_admin.initialize_app(cred)

db = firestore.client()

print("Firebase connected successfully!")

# Now you can use both MySQL and Firestore
# conn.close()  # Close when done