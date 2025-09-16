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

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
