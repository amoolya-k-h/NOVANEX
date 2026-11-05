# Remediated Dockerfile using official minimal Python slim image
FROM python:3.11-slim

# Create dedicated non-root application user
RUN groupadd -r appgroup && useradd -r -g appgroup -m appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN chown -R appuser:appgroup /app

# Switch to unprivileged user
USER appuser

# Expose only the required application port
EXPOSE 8000

CMD ["python", "src/app.py"]
