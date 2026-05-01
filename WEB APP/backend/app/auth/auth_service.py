"""
Authentication Service
Centralizza la logica di registrazione e login.
Migliorato con validazione input, logging, e error handling robusto.
"""
from typing import Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.models.models import User, Fish, FishState, SeaState
from .auth_hashing import hash_password, verify_password
from .auth_tokens import create_access_token
from .auth_logger import logger
from .auth_config import AuthConfig


# Dimensioni di default per i pesci
DEFAULT_FISH_DIMENSIONS = ["studio", "lavoro", "benessere"]


class AuthenticationError(Exception):
    """Eccezione personalizzata per errori di autenticazione."""
    pass


class UserAlreadyExistsError(AuthenticationError):
    """Eccezione per utente già registrato."""
    pass


class InvalidCredentialsError(AuthenticationError):
    """Eccezione per credenziali non valide."""
    pass


def validate_email(email: str) -> bool:
    """
    Valida il formato di un'email.
    
    Args:
        email: Email da validare
        
    Returns:
        True se valida, False altrimenti
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password: str) -> tuple[bool, str]:
    """
    Valida la password secondo le politiche di sicurezza.
    
    Args:
        password: Password da validare
        
    Returns:
        Tuple (is_valid, error_message)
    """
    if not password:
        return False, "Password non può essere vuota"
    
    if len(password) < AuthConfig.PASSWORD_MIN_LENGTH:
        return False, f"Password deve essere lunga almeno {AuthConfig.PASSWORD_MIN_LENGTH} caratteri"
    
    # Opzionale: richiedere complessità
    # has_upper = any(c.isupper() for c in password)
    # has_lower = any(c.islower() for c in password)
    # has_digit = any(c.isdigit() for c in password)
    # if not (has_upper and has_lower and has_digit):
    #     return False, "Password deve contenere maiuscole, minuscole e numeri"
    
    return True, ""


def register_user(
    email: str,
    password: str,
    locale: str = "it",
    db: Session = None,
) -> Dict[str, Any]:
    """
    Registra un nuovo utente e crea i dati iniziali (pesci e mare).
    
    Args:
        email: Email dell'utente
        password: Password in chiaro (sarà hashata)
        locale: Locale (es. 'it', 'en')
        db: Sessione database
        
    Returns:
        Dict con access_token, token_type, user_id, email
        
    Raises:
        UserAlreadyExistsError: Se email già registrata
        AuthenticationError: Se errori di validazione o database
    """
    logger.info(f"Inizio registrazione utente: {email}")
    
    # Validazione input
    if not email or not email.strip():
        logger.warning("Email vuota fornita")
        raise AuthenticationError("Email è richiesta")
    
    email = email.strip().lower()
    
    if not validate_email(email):
        logger.warning(f"Email non valida: {email}")
        raise AuthenticationError("Email non valida")
    
    is_valid_pwd, pwd_error = validate_password(password)
    if not is_valid_pwd:
        logger.warning(f"Password non valida per {email}: {pwd_error}")
        raise AuthenticationError(pwd_error)
    
    try:
        # Verifica se email esiste già
        existing_user = db.execute(
            select(User).where(User.email == email)
        ).scalars().first()
        
        if existing_user:
            logger.warning(f"Email già registrata: {email}")
            raise UserAlreadyExistsError("Email già registrata")
        
        # Crea l'utente
        user = User(
            email=email,
            hashed_password=hash_password(password),
            locale=locale,
        )
        db.add(user)
        db.flush()  # Ottieni user.id senza commit
        logger.info(f"User creato: {user.id} ({email})")
        
        # Crea i 3 pesci iniziali
        for dimension in DEFAULT_FISH_DIMENSIONS:
            try:
                fish = Fish(user_id=user.id, dimension=dimension)
                db.add(fish)
                db.flush()
                
                # Crea lo stato del pesce
                fish_state = FishState(fish_id=fish.id)
                db.add(fish_state)
                logger.debug(f"Fish creato: {fish.id} (dimensione: {dimension})")
            except Exception as e:
                logger.error(f"Errore nella creazione del pesce {dimension}: {str(e)}")
                db.rollback()
                raise AuthenticationError(f"Errore nella creazione dei dati iniziali")
        
        # Crea lo stato del mare
        try:
            sea_state = SeaState(
                user_id=user.id,
                sea_state_label="neutro",
                sea_state_score=0.0,
                visual_params={
                    "light": 0.4,
                    "wave_speed": 0.5,
                    "particles": False
                },
            )
            db.add(sea_state)
            logger.debug(f"SeaState creato per user_id: {user.id}")
        except Exception as e:
            logger.error(f"Errore nella creazione del sea_state: {str(e)}")
            db.rollback()
            raise AuthenticationError("Errore nella creazione dello stato del mare")
        
        # Commit di tutti i dati
        db.commit()
        db.refresh(user)
        logger.info(f"Registrazione completata: {email}")
        
        # Genera il token
        token = create_access_token({"email": user.email})
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
        }
        
    except UserAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata. Accedi con il tuo account.",
        )
    except AuthenticationError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except IntegrityError as e:
        db.rollback()
        logger.error(f"IntegrityError durante registrazione: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Errore di validazione dei dati. Email potrebbe già essere registrata.",
        )
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error durante registrazione: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nel database durante la registrazione.",
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Errore inaspettato durante registrazione: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno durante la registrazione.",
        )


def login_user(
    email: str,
    password: str,
    db: Session = None,
) -> Dict[str, Any]:
    """
    Autentica un utente e genera un JWT token.
    
    Args:
        email: Email dell'utente
        password: Password in chiaro
        db: Sessione database
        
    Returns:
        Dict con access_token, token_type, user_id, email
        
    Raises:
        InvalidCredentialsError: Se credenziali non valide
        AuthenticationError: Se errori di database
    """
    logger.info(f"Inizio login: {email}")
    
    # Validazione input
    if not email or not email.strip():
        logger.warning("Email vuota fornita nel login")
        raise AuthenticationError("Email è richiesta")
    
    email = email.strip().lower()
    
    if not password:
        logger.warning(f"Password vuota fornita nel login per: {email}")
        raise AuthenticationError("Password è richiesta")
    
    try:
        # Trova l'utente
        stmt = select(User).where(User.email == email)
        user = db.execute(stmt).scalars().first()
        
        # Verifica password
        if not user or not verify_password(password, user.hashed_password):
            logger.warning(f"Login fallito - credenziali non valide per: {email}")
            raise InvalidCredentialsError("Email o password non valide")
        
        logger.info(f"Login completato: {email}")
        
        # Genera il token
        token = create_access_token({"email": user.email})
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user.id,
            "email": user.email,
        }
        
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o password non valide.",
        )
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except SQLAlchemyError as e:
        logger.error(f"Database error durante login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore nel database durante il login.",
        )
    except Exception as e:
        logger.error(f"Errore inaspettato durante login: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore interno durante il login.",
        )
