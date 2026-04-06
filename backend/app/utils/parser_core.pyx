# cython: language_level=3
# cython: boundscheck=False
# cython: wraparound=False
import re
from typing import List, Dict

def clean_text(str text) -> str:
    """Limpia texto scrapeado — más rápido que Python puro"""
    cdef str result
    result = re.sub(r'\s+', ' ', text)
    result = result.strip()
    return result

def extract_numbers(str text) -> list:
    """Extrae números de texto scrapeado"""
    cdef list results
    results = re.findall(r'-?\d+\.?\d*', text)
    return [float(n) for n in results]

def normalize_rows(list rows, list columns) -> list:
    """Normaliza filas scrapeadas eliminando nulls y espacios"""
    cdef list result = []
    cdef dict row
    cdef str col
    for row in rows:
        normalized = {}
        for col in columns:
            val = row.get(col, '')
            if isinstance(val, str):
                normalized[col] = val.strip() or None
            else:
                normalized[col] = val
        result.append(normalized)
    return result

def deduplicate_rows(list rows, str key_column) -> list:
    """Elimina duplicados por columna clave"""
    cdef set seen = set()
    cdef list result = []
    cdef dict row
    for row in rows:
        key = row.get(key_column)
        if key not in seen:
            seen.add(key)
            result.append(row)
    return result