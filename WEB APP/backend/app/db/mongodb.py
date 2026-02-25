"""
🗄️ MongoDB Integration — Analytics & Data Export

Optional MongoDB connection per analytics e insights.
Se MongoDB non è disponibile, il sistema funziona comunque (fallback).
"""
from pymongo import MongoClient, errors
from datetime import datetime, timezone
import os

# MongoDB connection (opzionale)
MONGODB_URL = os.getenv("MONGODB_URL", None)  # Configura da env var
mongo_client = None
mongo_db = None

def init_mongodb():
    """Inizializza MongoDB connection (opzionale)."""
    global mongo_client, mongo_db
    if not MONGODB_URL:
        print("⚠️  MongoDB non configurato. Analytics skipped.")
        return False
    
    try:
        mongo_client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        mongo_client.admin.command('ping')
        mongo_db = mongo_client['mare_calmo']
        print("✅ MongoDB connesso")
        return True
    except errors.ServerSelectionTimeoutError:
        print("⚠️  MongoDB non disponibile. Analytics offline.")
        mongo_client = None
        mongo_db = None
        return False
    except Exception as e:
        print(f"⚠️  MongoDB error: {e}")
        mongo_client = None
        mongo_db = None
        return False

def upload_user_analytics(user_id: str, email: str, events_data: list, summary: dict):
    """
    Salva i dati di analisi su MongoDB per insights futuri.
    
    Args:
        user_id: ID dell'utente
        email: Email dell'utente
        events_data: Lista di eventi (check-in)
        summary: Statistiche aggregate
    """
    if not mongo_db:
        return {"skipped": True, "reason": "MongoDB not available"}
    
    try:
        collection = mongo_db['user_analytics']
        
        doc = {
            "user_id": user_id,
            "email": email,
            "events": events_data,
            "summary": summary,
            "uploaded_at": datetime.now(timezone.utc),
            "version": "1.0",
        }
        
        # Upsert: se esiste, aggiorna; altrimenti crea
        result = collection.update_one(
            {"user_id": user_id},
            {"$set": doc},
            upsert=True
        )
        
        return {
            "success": True,
            "upserted" if result.upserted_id else "updated": True,
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_user_insights(user_id: str) -> dict | None:
    """
    Recupera insights e trend per un utente da MongoDB.
    
    Returns:
        Dict con insights, o None se non disponibile
    """
    if not mongo_db:
        return None
    
    try:
        collection = mongo_db['user_analytics']
        doc = collection.find_one({"user_id": user_id})
        
        if not doc:
            return None
        
        # Analisi semplici
        events = doc.get('events', [])
        
        # Trend ansia (ultimi 7 eventi)
        recent_events = events[-7:] if events else []
        anxiety_values = [e.get('anxiety', 0) for e in recent_events]
        
        if len(anxiety_values) > 1:
            anxiety_trend = anxiety_values[-1] - anxiety_values[0]  # + = peggio, - = meglio
        else:
            anxiety_trend = 0
        
        # Correlazioni per dimensione
        dimensions = {}
        for event in events:
            dim = event.get('dimension')
            anx = event.get('anxiety', 0)
            if dim:
                if dim not in dimensions:
                    dimensions[dim] = []
                dimensions[dim].append(anx)
        
        # Media ansia per dimensione
        correlations = {}
        for dim, anxieties in dimensions.items():
            correlations[dim] = round(sum(anxieties) / len(anxieties), 2)
        
        return {
            "user_id": user_id,
            "total_events": len(events),
            "anxiety_trend": anxiety_trend,  # negativo = migliore
            "anxiety_recent_avg": round(sum(anxiety_values) / len(anxiety_values), 2) if anxiety_values else None,
            "dimension_anxiety": correlations,
            "last_updated": doc.get('uploaded_at'),
        }
    except Exception as e:
        print(f"Error fetching insights: {e}")
        return None
