# SMARTFARM AI — DEPLOYMENT SPECIFICATION

---

## 1. Deployment Topology

SmartFarm AI is designed as a modular full-stack application deployable on cloud platforms (e.g. Vercel, AWS ECS, Railway, Render, or Dockerized VPS).

```
+------------------------------------------------------------------+
|                          CDN / EDGE LAYER                        |
|             Cloudflare / Vercel Edge (SSL / DDoS / Static)       |
+--------------------------------+---------------------------------+
                                 |
                                 v
+------------------------------------------------------------------+
|                     APPLICATION SERVER RUNTIME                   |
|           Next.js 14 Server Engine (Node.js v24 environment)     |
+--------------------------------+---------------------------------+
                                 |
           +---------------------+---------------------+
           |                                           |
           v                                           v
+-----------------------+                   +----------------------+
|   DATABASE ENGINE     |                   |  FILE OBJECT STORE   |
| PostgreSQL + pgvector |                   | AWS S3 / Local Disk  |
+-----------------------+                   +----------------------+
```

---

## 2. Environment Variables Checklist (`.env.example`)

```env
# Application
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL="file:./dev.db"

# Authentication & JWT
JWT_SECRET=super-secret-jwt-key-change-in-production
SESSION_SECRET=super-secret-session-key

# External Providers
WEATHER_PROVIDER=demo # options: open-meteo, demo
WEATHER_API_KEY=
MARKET_PROVIDER=demo  # options: agmarknet, demo
MARKET_API_KEY=

# AI Provider
AI_PROVIDER=mock      # options: openai, anthropic, gemini, mock
AI_API_KEY=

# Storage Configuration
STORAGE_DISK=local    # options: local, s3
```
