'''
import os
from dotenv import load_dotenv
import mysql.connector
load_dotenv()
conn = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME")
)'''

import os
from dotenv import load_dotenv
import mysql.connector

load_dotenv()

conn = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
    auth_plugin='mysql_native_password'  # Add this line
)

print("Connection successful!")
cursor = conn.cursor()
cursor.execute("SELECT DATABASE();")
print("Connected to database:", cursor.fetchone()[0])
cursor.close()
conn.close()
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