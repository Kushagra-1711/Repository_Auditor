# ---- Build stage ----
FROM python:3.12-slim AS builder

WORKDIR /app

# Install dependencies into a virtual env for clean layer caching
COPY requirements.txt .
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# ---- Runtime stage ----
FROM python:3.12-slim

WORKDIR /app

# Copy the virtual environment from the build stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application source
COPY . .

# Railway injects PORT as an env var (default 8080)
ENV PORT=8080

EXPOSE ${PORT}

# Run uvicorn — $PORT is set by Railway at runtime
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
