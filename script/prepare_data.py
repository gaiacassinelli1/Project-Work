"""
prepare_data.py – Pipeline unificata: pulizia dati + calcolo indici psicologici.

Uso in ogni notebook:
    import sys; sys.path.append('..')
    from script.prepare_data import get_prepared_data
    df = get_prepared_data()

La pulizia è delegata a pulizia.ipynb (eseguito via nbconvert).
Gli indici psicologici sono calcolati qui.
"""
import os
import sys
import subprocess

import pandas as pd
import numpy as np  # usato in _add_indices

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from script.connessioni import get_mysql_connection


# STEP 1 – Setup opzionale (Google Sheets → MySQL raw_data)

def _run_setup():
    script = os.path.join(ROOT, 'script', 'setup_raw_data.py')
    r = subprocess.run([sys.executable, script], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"[prepare_data] Warning setup: {r.stderr[:300]}")


# STEP 2 – Pulizia tramite pulizia.ipynb (nbconvert)

def _run_pulizia(verbose: bool):
    nb_path = os.path.join(ROOT, 'notebook', 'pulizia.ipynb')
    if verbose:
        print("[prepare_data] Esecuzione pulizia.ipynb...")
    r = subprocess.run(
        [sys.executable, '-m', 'nbconvert',
         '--to', 'notebook', '--execute',
         '--ExecutePreprocessor.timeout=600',
         nb_path],
        capture_output=True, text=True, cwd=ROOT
    )
    if r.returncode != 0:
        print(f"[prepare_data] Warning pulizia.ipynb: {r.stderr[:400]}")
    elif verbose:
        print("[prepare_data] pulizia.ipynb completato.")


def _load_clean() -> pd.DataFrame:
    conn = get_mysql_connection()
    df = pd.read_sql("SELECT * FROM clean_data", conn)
    conn.close()
    return df


# STEP 3 – Indici psicologici 

def _add_indices(df: pd.DataFrame) -> pd.DataFrame:
    # Indici principali
    df["ansia_prestazione"]     = df[["Item_1","Item_2","Item_3","Item_4","Item_6","Item_11","Item_20","Item_21"]].mean(axis=1, skipna=True)
    df["ansia_accademica"]      = df[["Item_7","Item_8","Item_9","Item_10"]].mean(axis=1, skipna=True)
    df["ansia_lavorativa"]      = df[["Item_12","Item_13","Item_14","Item_15"]].mean(axis=1, skipna=True)
    df["perfezionismo"]         = df[["Item_16","Item_17","Item_18","Item_19"]].mean(axis=1, skipna=False)
    df["impatto_ansia"]         = df[["Item_5","Item_22","Item_27","Item_28","Item_29"]].mean(axis=1, skipna=False)
    df["coping"]                = df[["Item_23","Item_24","Item_25","Item_26"]].mean(axis=1, skipna=False)

    # Ansia totale (alias usato in clustering)
    df["ansia"]       = df[["ansia_prestazione","ansia_accademica","ansia_lavorativa"]].mean(axis=1, skipna=False)

    # Indici derivati
    df["vulnerabilita"]         = (df["perfezionismo"] + df["ansia"]) / 2
    df["resilienza"]            = df["coping"] - df["ansia"]
    df["gap"]                   = df["Item_8"] - df["coping"]
    df["evitamento"]            = df[["Item_10","Item_15","Item_27","Item_28"]].mean(axis=1, skipna=False)
    df["intensita_sintomatica"] = df[["Item_20","Item_21","Item_22"]].mean(axis=1, skipna=False)

    return df


# API pubblica

def get_prepared_data(run_setup: bool = False, verbose: bool = True) -> pd.DataFrame:
    """
    Restituisce il DataFrame pulito con tutti gli indici psicologici calcolati.

    Args:
        run_setup: se True riesegue setup_raw_data.py (Google Sheets → MySQL raw_data).
                   Normalmente non necessario se il DB è già popolato.
        verbose:   stampa info di avanzamento.

    Returns:
        pd.DataFrame con dati puliti + indici psicologici.
    """
    if run_setup:
        if verbose:
            print("[prepare_data] Esecuzione setup_raw_data.py...")
        _run_setup()

    _run_pulizia(verbose)

    if verbose:
        print("[prepare_data] Caricamento clean_data dal DB...")
    df = _load_clean()
    if verbose:
        print(f"              clean_data: {df.shape[0]} righe, {df.shape[1]} colonne")

    df = _add_indices(df)
    if verbose:
        print(f"              indici calcolati. Colonne totali: {df.shape[1]}")

    return df

if __name__ == "__main__":
    df = get_prepared_data(verbose=True)
    idx_cols = ['ansia', 'coping', 'resilienza', 'evitamento', 'perfezionismo', 'gap']
    print("\nStatistiche indici principali:")
    print(df[idx_cols].describe().round(3))
