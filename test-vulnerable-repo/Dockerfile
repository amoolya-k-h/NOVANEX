# Using old insecure base image
FROM ubuntu:18.04

# Running as root (security issue)
USER root

# Installing packages without pinning versions
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    wget \
    netcat

WORKDIR /app

COPY requirements.txt .
RUN pip3 install -r requirements.txt

COPY . .

# Exposing too many ports
EXPOSE 8000 8080 5432 6379 3306

# Running as root
CMD ["python3", "src/app.py"]
