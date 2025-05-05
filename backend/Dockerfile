# Wybór obrazu bazowego z Alpine (minimalny system)
FROM python:3.11-slim AS backend

# Ustalamy katalog roboczy wewnątrz kontenera
WORKDIR /app

# Kopiujemy plik requirements.txt i instalujemy zależności
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Kopiujemy pliki aplikacji do kontenera
COPY app.py /app/
COPY utils.py /app/

# Otwieramy port, na którym nasza aplikacja będzie nasłuchiwać
EXPOSE 4000

# Uruchamiamy aplikację FastAPI bezpośrednio w kontenerze
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "4000"]