"""
🔐 Authentication Service
Centralizza la logica di registrazione e login.
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.models.models import User, Fish, FishState, SeaState
from app.auth.hashing import hash_password, verify_password
from app.auth.tokens import create_access_token


# Dimensioni di default per i pesci
DEFAULT_DIMENSIONS = ["studio", "lavoro", "benessere"]


def register_user(
    email: str,
    password: str,
    locale: str,
    db: Session,
) -> dict:
    """
    Registra un nuovo utente e crea i dati iniziali (pesci e mare).
    
    Args:
        email: Email dell'utente
        password: Password in chiaro (sarà hashata)
        locale: Locale (es. 'it')
        db: Sessione database
        
    Returns:
        Dict con access_token, token_type, user_id, email
        
    Raises:
        HTTPException: Se email già registrata (400) o errore database (500)
    """
    try:
        print(f"[REGISTER] Inizio registrazione: {email}")
        
        # Verifica se email esiste già
        existing = db.execute(
            select(User).where(User.email == email)
        ).scalars().first()
        
        if existing:
            print(f"[REGISTER] Email già esiste: {email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email già registrata. Accedi con il tuo account.",
            )
        
        # Crea l'utente
        user = User(
            email=email,
            hashed_password=hash_password(password),
            locale=locale,
        )
        db.add(user)
        db.flush()  # Ottieni user.id
        print(f"[REGISTER] User creato: {user.id}")
        
        # Crea i 3 pesci iniziali con loro stati
        for dimension in DEFAULT_DIMENSIONS:
            print(f"[REGISTER] Creando pesce: {dimension}")
            fish = Fish(user_id=user.id, dimension=dimension)
            db.add(fish)
            db.flush()  # Assicurati che il fish ha un ID
            
            # Crea lo stato del pesce
            fish_state = FishState(fish_id=fish.id)
            db.add(fish_state)
            print(f"[REGISTER] Pesce e stato creati: {fish.id}")
        
        # Crea lo stato del mare
        print(f"[REGISTER] Creando sea_state per user_id: {user.id}")
        sea_state = SeaState(
            user_id=user.id,
            visual_params={"light": 0.4, "wave_speed": 0.5, "particles": False},
        )
        db.add(sea_state)
        print(f"[REGISTER] SeaState aggiunto")
        
        # Commit di tutti i dati
        db.commit()
        db.refresh(user)
        print(f"[REGISTER] Commit completato")
        
        # Genera il token
        token = create_access_token({"email": user.email})
        print(f"[REGISTER] Token creato")
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
        }
        
    except HTTPException as e:
        # Re-raise HTTPException
        print(f"[REGISTER] HTTPException: {str(e)}")
        raise
    except IntegrityError as e:
        db.rollback()
        print(f"[REGISTER] IntegrityError: {str(e)}")
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email già registrata.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Errore di validazione dei dati.",
        )
    except SQLAlchemyError as e:
        db.rollback()
        print(f"[REGISTER] SQLAlchemyError: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nel database durante la registrazione.",
        )
    except Exception as e:
        db.rollback()
        print(f"[REGISTER] Unexpected error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno durante la registrazione.",
        )


def login_user(
    email: str,
    password: str,
    db: Session,
) -> dict:
    """
    Autentica un utente e genera un JWT token.
    
    Args:
        email: Email dell'utente
        password: Password in chiaro
        db: Sessione database
        
    Returns:
        Dict con access_token, token_type, user_id, email
        
    Raises:
        HTTPException: Se credenziali non valide (401) o errore database (500)
    """
    try:
        print(f"[LOGIN] Inizio: {email}")
        
        # Trova l'utente
        stmt = select(User).where(User.email == email)
        user = db.execute(stmt).scalars().first()
        
        # Verifica password
        if not user or not verify_password(password, user.hashed_password):
            print(f"[LOGIN] Credenziali non valide: {email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o password non valide.",
            )
        
        print(f"[LOGIN] Login riuscito: {email}")
        
        # Genera il token
        token = create_access_token({"email": user.email})
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
        }
        
    except HTTPException:
        # Re-raise HTTPException
        raise
    except SQLAlchemyError as e:
        print(f"[ERROR] Database error in login_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nel database durante il login.",
        )
    except Exception as e:
        print(f"[ERROR] Unexpected error in login_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno durante il login.",
        )
