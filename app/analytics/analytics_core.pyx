# cython: language_level=3
# cython: boundscheck=False
# cython: wraparound=False
# cython: cdivision=True
import numpy as np
cimport numpy as np

def fast_mean(np.ndarray[np.float64_t, ndim=1] arr) -> double:
    """Media aritmética optimizada"""
    cdef int n = arr.shape[0]
    cdef double total = 0.0
    cdef int i
    if n == 0:
        return 0.0
    for i in range(n):
        total += arr[i]
    return total / n

def fast_std(np.ndarray[np.float64_t, ndim=1] arr) -> double:
    """Desviación estándar optimizada"""
    cdef int n = arr.shape[0]
    cdef double mean = fast_mean(arr)
    cdef double variance = 0.0
    cdef int i
    if n == 0:
        return 0.0
    for i in range(n):
        variance += (arr[i] - mean) ** 2
    return (variance / n) ** 0.5

def count_missing(list rows, str column) -> int:
    """Cuenta valores nulos en una columna"""
    cdef int count = 0
    cdef dict row
    for row in rows:
        val = row.get(column)
        if val is None or val == '' or val != val:
            count += 1
    return count

def fast_value_counts(list values) -> dict:
    """Cuenta frecuencias de valores"""
    cdef dict counts = {}
    for val in values:
        if val in counts:
            counts[val] += 1
        else:
            counts[val] = 1
    return counts