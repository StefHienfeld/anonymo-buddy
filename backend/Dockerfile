FROM python:3.10-slim

WORKDIR /app

# Installeer dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Download de spacy link uit requirements is soms niet genoeg voor presidio, 
# dus we linken het expliciet voor zekerheid
RUN python -m spacy download nl_core_news_lg

COPY . .

# Start de server op poort 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

