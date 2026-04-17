import os
from dotenv import load_dotenv
import mysql.connector

# Load .env
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

print("DB_HOST:", os.getenv("DB_HOST"))
print("DB_USER:", os.getenv("DB_USER"))
print("DB_PASSWORD:", repr(os.getenv("DB_PASSWORD")))
print("DB_NAME:", os.getenv("DB_NAME"))

try:
    conn = mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        auth_plugin='mysql_native_password'
    )
    print("Connection successful")
    conn.close()
except Exception as e:
    print("Error:", e)