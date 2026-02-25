"""
📊 Export & Analytics Module — Genera JSON e insights

Esporta dati utente in formato JSON per analytics e backup.
Opzionalmente sincronizza con MongoDB.
"""
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.models import Event, User, Fish, FishState, SeaState
from app.db.mongodb import upload_user_analytics, get_user_insights


def calculate_event_stats(events: list[Event]) -> dict:
    """Calcola statistiche aggregate degli eventi."""
    if not events:
        return {
            "total_events": 0,
            "avg_anxiety": 0,
            "dimensions_breakdown": {},
        }
    
    anxiety_values = []
    dimensions = {}
    
    for event in events:
        metadata = event.metadata_json or {}
        
        # Ansia
        if "anxiety" in metadata:
            anxiety_values.append(metadata["anxiety"])
        
        # Dimensioni
        dim = metadata.get("dimension")
        if dim:
            dimensions[dim] = dimensions.get(dim, 0) + 1
    
    avg_anxiety = sum(anxiety_values) / len(anxiety_values) if anxiety_values else 0
    
    return {
        "total_events": len(events),
        "avg_anxiety": round(avg_anxiety, 2),
        "dimensions_breakdown": dimensions,
        "anxiety_samples": len(anxiety_values),
    }


def export_user_data(db: Session, user_id: str) -> dict:
    """
    Esporta tutti i dati dell'utente in formato JSON.
    
    Struttura:
    {
        "user": {...},
        "events": [...],
        "game_state": {...},
        "summary": {...},
        "export_date": "...",
    }
    """
    # Fetch user
    user = db.get(User, user_id)
    if not user:
        return {"error": "User not found"}
    
    # Fetch events
    events = db.execute(
        select(Event).where(Event.user_id == user_id).order_by(Event.created_at)
    ).scalars().all()
    
    # Fetch fish state
    fish = db.execute(
        select(Fish).where(Fish.user_id == user_id)
    ).scalars().all()
    
    # Fetch sea state
    sea_state = db.get(SeaState, user_id)
    
    # Build events list
    events_list = []
    for event in events:
        events_list.append({
            "id": event.id,
            "type": event.event_type,
            "timestamp": event.created_at.isoformat(),
            "metadata": event.metadata_json or {},
        })
    
    # Build fish state
    fish_state_list = []
    for f in fish:
        state = db.get(FishState, f.id)
        fish_state_list.append({
            "dimension": f.dimension,
            "growth_level": state.growth_level if state else 0.0,
            "visual_stage": state.visual_stage if state else "small",
        })
    
    # Summary stats
    stats = calculate_event_stats(events)
    
    # Export document
    export_data = {
        "user": {
            "id": user.id,
            "email": user.email,
            "created_at": user.created_at.isoformat(),
            "locale": user.locale,
        },
        "events": events_list,
        "game_state": {
            "fish": fish_state_list,
            "sea_state": {
                "label": sea_state.sea_state_label if sea_state else "neutro",
                "score": sea_state.sea_state_score if sea_state else 0.0,
            }
        },
        "summary": stats,
        "export_date": datetime.now(timezone.utc).isoformat(),
        "version": "1.0",
    }
    
    return export_data


def sync_to_mongodb(db: Session, user_id: str) -> dict:
    """
    Esporta dati e sincronizza con MongoDB (se disponibile).
    """
    export_data = export_user_data(db, user_id)
    
    if "error" in export_data:
        return export_data
    
    # Prepara dati per MongoDB
    user_doc = export_data["user"]
    events_for_mongo = export_data["events"]
    summary = export_data["summary"]
    
    # Upload a MongoDB
    result = upload_user_analytics(
        user_id=user_id,
        email=user_doc["email"],
        events_data=events_for_mongo,
        summary=summary,
    )
    
    return {
        "exported": True,
        "export_data": export_data,
        "mongodb_result": result,
    }


def get_user_analytics(user_id: str) -> dict:
    """
    Recupera analytics e insights per un utente da MongoDB.
    """
    insights = get_user_insights(user_id)
    
    if not insights:
        return {"error": "No analytics available"}
    
    return insights
