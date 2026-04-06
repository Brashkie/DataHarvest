# cython: language_level=3
# cython: boundscheck=False
# cython: wraparound=False
import re
from urllib.parse import urljoin, urlparse

def extract_links(str html, str base_url) -> list:
    """Extrae todos los links de HTML"""
    cdef list links = []
    cdef list matches
    matches = re.findall(r'href=["\']([^"\']+)["\']', html)
    for match in matches:
        if match.startswith('http'):
            links.append(match)
        elif match.startswith('/'):
            links.append(urljoin(base_url, match))
    return list(set(links))

def is_valid_url(str url) -> bint:
    """Valida URL rápidamente"""
    cdef object parsed
    try:
        parsed = urlparse(url)
        return bool(parsed.scheme and parsed.netloc)
    except:
        return False

def extract_emails(str text) -> list:
    """Extrae emails de texto"""
    return re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)

def sanitize_filename(str name) -> str:
    """Sanitiza nombre de archivo"""
    return re.sub(r'[<>:"/\\|?*]', '_', name).strip()