FROM python:3.11-slim

WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y \
    gcc g++ libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

# Dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Playwright
RUN pip install playwright && playwright install chromium --with-deps

COPY . .

# Crear directorios necesarios
RUN mkdir -p data/scraped data/uploads exports logs

EXPOSE 5000

CMD ["python", "run.py"]