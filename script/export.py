"""
EXPORT DA MYSQL A EXCEL PER POWER BI
=====================================
Script per esportare dati da MySQL e creare un Excel strutturato
con tutti i dati necessari per la dashboard

Uso: python export_powerbi.py
Output: /output/PowerBI_Dashboard_Data.xlsx
"""

import pandas as pd
import numpy as np
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# ============================================================================
# CONFIGURAZIONE CONNESSIONE MYSQL
# ============================================================================

DB_CONFIG = {
    'host': 'localhost',
    'database': 'project_work',
    'user': 'root',
    'password': 'Gaia123'
}

# ============================================================================
# FUNZIONE CONNESSIONE
# ============================================================================

def connect_to_db():
    """Connessione a MySQL"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print("Connesso a MySQL")
            return connection
    except Error as e:
        print(f"Errore connessione: {e}")
        return None

# ============================================================================
# CARICAMENTO DATI
# ============================================================================

def load_data():
    """Carica i dati cleanati da MySQL"""
    connection = connect_to_db()
    
    if not connection:
        return None
    
    try:
        # Query principale: dati cleanati
        query = "SELECT * FROM clean_data"
        df = pd.read_sql(query, connection)
        print(f"Dati caricati: {df.shape[0]} righe × {df.shape[1]} colonne")
        
        return df
        
    except Error as e:
        print(f"Errore query: {e}")
        return None
    finally:
        connection.close()

# ============================================================================
# PREPARAZIONE DATI PER POWER BI
# ============================================================================

def prepare_data_for_powerbi(df):
    """
    Prepara i dati e crea i diversi sheet per Power BI
    Ritorna un dizionario di DataFrame
    """
        
    output_dfs = {}
    
    # =========================================================================
    # SHEET 1: DATI GREZZI (con tutte le variabili)
    # =========================================================================
    print("\n1. Preparazione dati grezzi...")
    
    # Assicurati che le colonne siano in minuscolo per coerenza
    df.columns = df.columns.str.lower()
    
    output_dfs['DatiGrezzi'] = df.copy()
    print(f"   ✓ {df.shape[0]} record")
    
    # =========================================================================
    # SHEET 2: STATISTICHE DESCRITTIVE
    # =========================================================================
    print("\n2. Preparazione statistiche descrittive...")
    
    # Identifica colonne numeriche
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    # Statistiche di base
    stats_data = []
    for col in numeric_cols:
        if col not in ['id', 'respondent_id']:  # Escludi ID
            stats_data.append({
                'Variabile': col,
                'Media': df[col].mean(),
                'Mediana': df[col].median(),
                'SD': df[col].std(),
                'Min': df[col].min(),
                'Max': df[col].max(),
                'Q1': df[col].quantile(0.25),
                'Q3': df[col].quantile(0.75),
                'ValoriMancanti': df[col].isna().sum(),
                'N': df[col].count()
            })
    
    df_stats = pd.DataFrame(stats_data)
    output_dfs['StatisticheDescrittive'] = df_stats
    print(f"   ✓ {len(df_stats)} variabili descritte")
    
    # =========================================================================
    # SHEET 3: DATI STRATIFICATI PER GENERE
    # =========================================================================
    print("\n3. Preparazione dati per genere...")
    
    gender_col = [col for col in df.columns if 'genere' in col.lower()][0] if any('genere' in col.lower() for col in df.columns) else None
    
    if gender_col:
        genere_data = []
        for var in numeric_cols:
            if var not in ['id', 'respondent_id']:
                for gen in df[gender_col].dropna().unique():
                    subset = df[df[gender_col] == gen][var].dropna()
                    if len(subset) > 0:
                        genere_data.append({
                            'Variabile': var,
                            'Genere': gen,
                            'Media': subset.mean(),
                            'SD': subset.std(),
                            'N': len(subset)
                        })
        
        df_genere = pd.DataFrame(genere_data)
        output_dfs['StratificazioneGenere'] = df_genere
        print(f"   ✓ Dati stratificati per {df_genere['Genere'].nunique()} categorie")
    
    # =========================================================================
    # SHEET 4: DATI STRATIFICATI PER AREA GEOGRAFICA
    # =========================================================================
    print("\n4. Preparazione dati per area geografica...")
    
    geo_col = [col for col in df.columns if 'area' in col.lower() or 'macro' in col.lower()][0] if any('area' in col.lower() for col in df.columns) else None
    
    if geo_col:
        geo_data = []
        for var in numeric_cols:
            if var not in ['id', 'respondent_id']:
                for area in df[geo_col].dropna().unique():
                    subset = df[df[geo_col] == area][var].dropna()
                    if len(subset) > 0:
                        geo_data.append({
                            'Variabile': var,
                            'Area': area,
                            'Media': subset.mean(),
                            'SD': subset.std(),
                            'N': len(subset)
                        })
        
        df_geo = pd.DataFrame(geo_data)
        output_dfs['StratificazioneGeografica'] = df_geo
        print(f"   ✓ Dati stratificati per {df_geo['Area'].nunique()} aree")
    
    # =========================================================================
    # SHEET 5: MATRICE CORRELAZIONI
    # =========================================================================
    print("\n5. Preparazione matrice correlazioni...")
    
    # Correlazioni tra variabili psicologiche
    psych_vars = [col for col in numeric_cols if col not in ['id', 'respondent_id', 'eta', 'age']]
    
    if len(psych_vars) > 1:
        corr_matrix = df[psych_vars].corr()
        # Trasforma in formato lungo per Power BI
        corr_long = []
        for i, col1 in enumerate(corr_matrix.columns):
            for j, col2 in enumerate(corr_matrix.columns):
                if i < j:  # Evita duplicati
                    corr_long.append({
                        'Variabile1': col1,
                        'Variabile2': col2,
                        'Correlazione': corr_matrix.iloc[i, j]
                    })
        
        df_corr = pd.DataFrame(corr_long).sort_values('Correlazione', key=abs, ascending=False)
        output_dfs['Correlazioni'] = df_corr
        print(f"   ✓ Matrice {len(psych_vars)}×{len(psych_vars)} calcolata")
    
    # =========================================================================
    # SHEET 6: PROFILI DEMOGRAFICI
    # =========================================================================
    print("\n6. Preparazione profili demografici...")
    
    # Combina genere e area geografica
    demo_data = []
    if gender_col and geo_col:
        for var in numeric_cols:
            if var not in ['id', 'respondent_id']:
                for gen in df[gender_col].dropna().unique():
                    for area in df[geo_col].dropna().unique():
                        subset = df[(df[gender_col] == gen) & (df[geo_col] == area)][var].dropna()
                        if len(subset) > 0:
                            demo_data.append({
                                'Variabile': var,
                                'Genere': gen,
                                'Area': area,
                                'Media': subset.mean(),
                                'SD': subset.std(),
                                'N': len(subset)
                            })
        
        df_demo = pd.DataFrame(demo_data)
        output_dfs['ProfiliDemografici'] = df_demo
        print(f" {len(df_demo)} profili creati")
    
    # =========================================================================
    # SHEET 7: DISTRIBUZIONE FASCE D'ETÀ
    # =========================================================================
    print("\n7. Preparazione distribuzione per fascia d'età...")
    
    # Identifica colonna età
    age_col = [col for col in df.columns if 'eta' in col.lower() or 'age' in col.lower()][0] if any('eta' in col.lower() or 'age' in col.lower() for col in df.columns) else None
    
    if age_col:
        # Crea fasce d'età
        df_temp = df.copy()
        df_temp['FasciaEta'] = pd.cut(df_temp[age_col], bins=[18, 21, 24, 27, 31], labels=['19-21', '22-24', '25-27', '28-30'], right=False)
        
        eta_data = []
        for var in numeric_cols:
            if var not in ['id', 'respondent_id', age_col]:
                for fascia in ['19-21', '22-24', '25-27', '28-30']:
                    subset = df_temp[df_temp['FasciaEta'] == fascia][var].dropna()
                    if len(subset) > 0:
                        eta_data.append({
                            'Variabile': var,
                            'FasciaEta': fascia,
                            'Media': subset.mean(),
                            'SD': subset.std(),
                            'N': len(subset)
                        })
        
        df_eta = pd.DataFrame(eta_data)
        output_dfs['DistribuzioneEta'] = df_eta
        print(f"   ✓ Fasce d'età elaborate")
    
    # =========================================================================
    # SHEET 8: METADATA E INFORMAZIONI
    # =========================================================================
    print("\n8. Preparazione metadata...")
    
    metadata = pd.DataFrame([{
        'Metrica': 'N Totale Rispondenti',
        'Valore': len(df)
    }, {
        'Metrica': 'N Variabili',
        'Valore': df.shape[1]
    }, {
        'Metrica': 'Data Export',
        'Valore': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }, {
        'Metrica': 'Intervallo Età',
        'Valore': f"{df[age_col].min():.0f} - {df[age_col].max():.0f}" if age_col else 'N/A'
    }, {
        'Metrica': 'Completezza Dati',
        'Valore': f"{(1 - df.isna().sum().sum() / (df.shape[0] * df.shape[1])) * 100:.1f}%"
    }])
    
    output_dfs['Metadata'] = metadata
    print(f"   ✓ Metadata creato")
    
    return output_dfs

# ============================================================================
# SALVATAGGIO EXCEL
# ============================================================================

def save_to_excel(output_dfs, filename='PowerBI_Dashboard_Data.xlsx'):
    """Salva tutti i DataFrame in un unico file Excel con multiple sheet"""
    
    filepath = f'../output/{filename}'
    
    try:
        with pd.ExcelWriter(filepath, engine='openpyxl') as writer:
            for i, (sheet_name, df) in enumerate(output_dfs.items(), 1):
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                print(f"{i}. {sheet_name:<30} - {df.shape[0]} righe × {df.shape[1]} colonne ✓")
        
        print(f"\nFile salvato: {filepath}")
        return filepath
        
    except Exception as e:
        print(f"Errore salvataggio: {e}")
        return None

# ============================================================================
# MAIN
# ============================================================================

def main():
    
    # Carica dati
    df = load_data()
    
    if df is None:
        print("\nErrore caricamento dati. Interrompi.")
        return
    
    # Prepara dati
    output_dfs = prepare_data_for_powerbi(df)
    
    # Salva Excel
    filepath = save_to_excel(output_dfs)
    
    if filepath:
        print("Fine dell'operazione")

    else:
        print("\nOperazione fallita")

if __name__ == "__main__":
    main()