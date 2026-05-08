"""
Logger strutturato per l'autenticazione.
Usa il modulo logging di Python per registrare eventi in modo professionale.
"""
import logging
import logging.handlers
import os
from datetime import datetime


def setup_auth_logger(name: str = "mare_calmo.auth") -> logging.Logger:
    """
    Configura un logger strutturato per l'autenticazione.
    
    Args:
        name: Nome del logger (es. "mare_calmo.auth")
        
    Returns:
        Logger configurato
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    
    # Crea directory logs se non esiste
    logs_dir = os.path.join(os.path.dirname(__file__), "../../logs")
    os.makedirs(logs_dir, exist_ok=True)
    
    # File handler con rotazione
    log_file = os.path.join(logs_dir, "auth.log")
    file_handler = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5
    )
    file_handler.setLevel(logging.DEBUG)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    
    # Formatter
    formatter = logging.Formatter(
        fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)
    
    # Aggiungi handler se non già presenti
    if not logger.handlers:
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
    
    return logger


# Logger singleton
logger = setup_auth_logger()
