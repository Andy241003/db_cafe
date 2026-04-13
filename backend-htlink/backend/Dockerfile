FROM python:3.10

ENV PYTHONUNBUFFERED=1

WORKDIR /app/

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

ENV PYTHONPATH=/app

COPY ./scripts /app/scripts
COPY ./alembic.ini /app/

RUN chmod +x /app/scripts/prestart.sh /app/scripts/start.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1

CMD ["bash", "scripts/start.sh"]
