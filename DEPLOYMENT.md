# MentorOS Pro - Deployment Guide

This guide covers deploying MentorOS Pro to production environments.

---

## 📋 Prerequisites

### Frontend
- **Node.js 20+** and **npm 10+**
- **Vite 6+** for building

### Backend
- **Python 3.11+** and **pip**
- **PostgreSQL 15+** (production) / **SQLite** (development)
- **Ollama** for local AI inference
- **Redis** (optional, for caching/sessions)

### Infrastructure
- **Docker** & **Docker Compose** (recommended)
- **Nginx** or **Caddy** for reverse proxy
- **SSL certificates** (Let's Encrypt recommended)

---

## 🏗 Frontend Deployment

### 1. Build for Production

```bash
cd frontend
npm ci                    # Clean install dependencies
npm run build            # TypeScript compile + Vite build
```

Output will be in `frontend/dist/`

### 2. Environment Variables

Create `.env.production`:

```env
VITE_API_URL=https://api.yourdomain.com/api/v1
```

### 3. Serve with Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    root /var/www/mentoros/frontend/dist;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # SPA routing - fallback to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Docker Deployment (Frontend)

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🐍 Backend Deployment

### 1. Environment Variables

Create `.env.production`:

```env
# Security
SECRET_KEY=your-super-secret-key-min-32-chars-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mentoros

# AI
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=smollm2:1.7b

# CORS
CORS_ORIGINS=https://yourdomain.com

# Optional
SEED_DEMO_DATA=false
LOG_LEVEL=INFO
```

### 2. Database Setup

```bash
# Run migrations
cd backend
alembic upgrade head

# Or create tables directly (if not using Alembic)
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 3. Run with Gunicorn

```bash
cd backend
pip install gunicorn uvicorn
gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
```

### 4. Docker Deployment (Backend)

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run migrations and start
CMD alembic upgrade head && \
    gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000
```

---

## 🐳 Docker Compose (Full Stack)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: mentoros
      POSTGRES_USER: mentoros
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mentoros"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://mentoros:${POSTGRES_PASSWORD}@postgres:5432/mentoros
      OLLAMA_HOST: http://ollama:11434
      SECRET_KEY: ${SECRET_KEY}
      CORS_ORIGINS: https://${DOMAIN}
    depends_on:
      postgres:
        condition: service_healthy
      ollama:
        condition: service_started
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "80:80"
      - "443:443"

volumes:
  postgres_data:
  redis_data:
  ollama_data:
```

### Deploy with Docker Compose

```bash
# Set environment variables
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export SECRET_KEY=$(openssl rand -base64 32)
export DOMAIN=yourdomain.com

# Pull Ollama model
docker compose run --rm ollama ollama pull smollm2:1.7b

# Start services
docker compose up -d

# View logs
docker compose logs -f
```

---

## ☁️ Cloud Deployment Options

### Vercel (Frontend) + Railway/Render (Backend)

1. **Frontend on Vercel:**
   - Connect GitHub repo
   - Set Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Add environment variable: `VITE_API_URL`

2. **Backend on Railway/Render:**
   - Connect GitHub repo
   - Set Root Directory: `backend`
   - Add PostgreSQL database
   - Add environment variables
   - Set start command: `gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`

### AWS ECS/Fargate

```json
// task-definition.json
{
  "family": "mentoros",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/mentoros-backend:latest",
      "portMappings": [{"containerPort": 8000, "protocol": "tcp"}],
      "environment": [
        {"name": "DATABASE_URL", "value": "postgresql://..."},
        {"name": "SECRET_KEY", "value": "..."},
        {"name": "OLLAMA_HOST", "value": "http://ollama:11434"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mentoros",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    },
    {
      "name": "frontend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/mentoros-frontend:latest",
      "portMappings": [{"containerPort": 80, "protocol": "tcp"}],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mentoros",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "frontend"
        }
      }
    }
  ]
}
```

---

## 🔒 Security Checklist

### Before Going Live

- [ ] **Strong SECRET_KEY** (32+ chars, randomly generated)
- [ ] **HTTPS enforced** everywhere
- [ ] **CORS_ORIGINS** restricted to your domain only
- [ ] **Database passwords** rotated and stored securely
- [ ] **Rate limiting** enabled on API endpoints
- [ ] **CSP headers** configured
- [ ] **Security headers** (HSTS, X-Frame-Options, etc.)
- [ ] **Dependency scanning** (npm audit, pip-audit)
- [ ] **Secrets not in code** (use env vars / secret managers)
- [ ] **Backup strategy** for PostgreSQL
- [ ] **Monitoring & alerting** configured

### SSL/TLS

```bash
# Let's Encrypt with Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 📊 Monitoring & Observability

### Health Checks

```python
# backend/app/routers/health.py
@router.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@router.get("/health/db")
async def db_health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"database": "connected"}

@router.get("/health/ai")
async def ai_health():
    # Check Ollama connectivity
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{settings.OLLAMA_HOST}/api/tags")
        return {"ollama": "connected" if resp.status_code == 200 else "disconnected"}
```

### Logging

```python
# backend/app/main.py
import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
```

### Metrics (Prometheus)

```python
# Add to requirements.txt
prometheus-client

# backend/app/main.py
from prometheus_client import Counter, Histogram, generate_latest
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP Requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP Request Latency', ['method', 'endpoint'])
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd frontend && npm ci && npm run lint && npm run test:run
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: cd backend && pip install -r requirements.txt && python -m pytest tests/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build frontend
        run: cd frontend && npm ci && npm run build
      - name: Build backend
        run: cd backend && docker build -t mentoros-backend .
      - name: Push to registry
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: your-registry/mentoros-backend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /opt/mentoros
            docker compose pull
            docker compose up -d
```

---

## 📦 Backup & Recovery

### Database Backup

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/mentoros"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# PostgreSQL backup
docker exec mentoros_postgres pg_dump -U mentoros mentoros | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://your-bucket/mentoros-backups/
```

### Restore

```bash
# Restore from backup
gunzip -c db_20261102_120000.sql.gz | docker exec -i mentoros_postgres psql -U mentoros mentoros
```

---

## 🚀 Quick Deploy Commands

### Development
```bash
# From project root
python run_all.py
```

### Production (Docker)
```bash
# One-time setup
export POSTGRES_PASSWORD=$(openssl rand -base64 32)
export SECRET_KEY=$(openssl rand -base64 32)
export DOMAIN=yourdomain.com

docker compose run --rm ollama ollama pull smollm2:1.7b
docker compose up -d

# Update
docker compose pull
docker compose up -d
```

### Production (Manual)
```bash
# Frontend
cd frontend && npm ci && npm run build
# Copy dist/ to nginx

# Backend
cd backend && pip install -r requirements.txt
alembic upgrade head
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

---

## 🆘 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Check `CORS_ORIGINS` matches frontend domain exactly |
| WebSocket failures | Ensure nginx proxy passes `Upgrade` header |
| Ollama not responding | Check GPU memory, try smaller model |
| DB connection refused | Verify PostgreSQL is running, check DATABASE_URL |
| Static files 404 | Ensure `try_files $uri $uri/ /index.html` in nginx |
| Build fails | Run `npm ci` and `pip install -r requirements.txt` fresh |

### Logs

```bash
# Docker
docker compose logs -f backend
docker compose logs -f frontend

# Systemd
journalctl -u mentoros-backend -f
journalctl -u nginx -f
```

---

## 📞 Support

- **Documentation**: [GitHub Wiki](https://github.com/your-org/mentoros/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/mentoros/issues)
- **Email**: support@mentoros.dev

---

*Last updated: November 2026*