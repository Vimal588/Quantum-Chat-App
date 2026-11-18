# 🚀 QuantumChat: Complete Production Deployment Guide

This guide covers deploying the **Quantum-Resistant Chat Application** to production using Docker Compose, Cloud VPS (AWS EC2, DigitalOcean, GCP, Azure, Hetzner), or PaaS platforms (Railway, Render).

---

## 📌 Critical Production Requirement: HTTPS (SSL/TLS)
> [!IMPORTANT]
> Modern web browsers restrict access to the **Web Cryptography API** (`window.crypto.subtle`) and secure WebSockets (`wss://`) strictly to **Secure Contexts** (`https://` or `localhost`). In production, you **must** serve the application over HTTPS for client-side ML-KEM and AES-GCM operations to execute.

---

## 🏗️ Method 1: Cloud VPS with Docker Compose (Recommended)
*Best for: AWS EC2, DigitalOcean Droplet, Linode, Hetzner, Google Cloud Compute, Azure VM.*

### Minimum Recommended Server Specs
* **OS:** Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
* **RAM:** 2 GB minimum (4 GB recommended for building Java + Node.js)
* **vCPU:** 2 Cores
* **Disk:** 25 GB SSD

---

### Step 1: Connect to Your Cloud Server
```bash
ssh ubuntu@YOUR_SERVER_IP
```

---

### Step 2: Install Docker & Docker Compose
Run the following script to install the official Docker engine on Ubuntu:

```bash
# Update package index
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release git

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine & Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow running docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version && docker compose version
```

---

### Step 3: Clone Your Project
```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/quantum-chat-app.git
cd quantum-chat-app
```

---

### Step 4: Configure Production Environment (`.env.docker`)
Create or edit your production `.env.docker`:

```bash
nano .env.docker
```

Set strong passwords, your domain name, and a unique 256-bit JWT secret:

```ini
# Production Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=quantum_chat_db
DB_USERNAME=postgres
DB_PASSWORD=YourStrongDatabasePassword123!#

# Backend Security (Generate with: openssl rand -hex 32)
SERVER_PORT=8080
JWT_SECRET=c8e19b5c3e7289f64a1329c018274d8e901fa4852934092bcf10394857210948
JWT_EXPIRATION_MS=86400000
JWT_REFRESH_EXPIRATION_MS=604800000

# CORS Allowed Origins (Set to your actual domain)
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Frontend API & WebSocket URLs
VITE_API_BASE_URL=/api
VITE_WS_URL=wss://yourdomain.com/ws
```

---

### Step 5: Start the Application
```bash
docker compose --env-file .env.docker up --build -d
```

Check the status of your containers:
```bash
docker compose ps
```

View live logs:
```bash
docker compose logs -f
```

---

### Step 6: Enable Free SSL/HTTPS with Let's Encrypt & Certbot

#### Option A: Using Nginx on the Host as SSL Terminator (Recommended)
1. Install Nginx and Certbot on the host server:
   ```bash
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

2. Point your domain DNS **A Record** to `YOUR_SERVER_IP`.

3. Change the `frontend` port mapping in `docker-compose.yml` from `80:80` to `3000:80`:
   ```yaml
   frontend:
     ...
     ports:
       - "3000:80"
   ```
   Apply change: `docker compose up -d`

4. Create an Nginx site configuration on the host:
   ```bash
   sudo nano /etc/nginx/sites-available/quantumchat
   ```
   Add:
   ```nginx
   server {
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "Upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_read_timeout 86400s;
           proxy_send_timeout 86400s;
       }
   }
   ```

5. Enable the site and obtain your SSL certificate:
   ```bash
   sudo ln -s /etc/nginx/sites-available/quantumchat /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx

   # Obtain free SSL certificate with automatic auto-renewal
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

#### Option B: Cloudflare Free SSL & Proxy (Zero Setup)
1. In your Cloudflare Dashboard, add your domain.
2. Add an **A Record** pointing to `YOUR_SERVER_IP` with the Orange Cloud (Proxy) enabled.
3. In Cloudflare SSL/TLS settings, set encryption mode to **Full** or **Flexible**.
4. Cloudflare automatically provides and renews SSL/TLS for your domain.

---

## ☁️ Method 2: Platform-as-a-Service (PaaS) Deployment

### Deploying on Railway (Fastest Cloud Setup)
1. Go to [Railway.app](https://railway.app) and sign up with GitHub.
2. Click **New Project** $\to$ **Provision PostgreSQL**.
3. Click **New** $\to$ **GitHub Repo** $\to$ select your `quantum-chat-app` repository.
4. Add the **Backend Service**:
   - Root directory: `/backend`
   - Build using Dockerfile or Nixpacks.
   - Set environment variables referencing Railway's PostgreSQL:
     - `SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}`
     - `JWT_SECRET=your-random-256bit-secret`
5. Add the **Frontend Service**:
   - Root directory: `/frontend`
   - Build using Dockerfile.
   - Set environment variable: `VITE_API_BASE_URL=https://your-backend.up.railway.app/api`.
6. Click **Deploy**. Railway generates custom SSL domains for both services automatically!

### Deploying on Render
1. Go to [Render.com](https://render.com).
2. Create a **PostgreSQL Database** (Free tier available).
3. Create a **Web Service** for the backend using Docker (`backend/Dockerfile`).
4. Create a **Static Site** for the frontend:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Rewrite rule for SPA: `/* -> /index.html` (Rewrite).

---

## 🛡️ Production Security Checklist

- [ ] **Change Default Database Password:** Never use `quantum_secure_pass` or default passwords in production.
- [ ] **Cryptographic Random JWT Secret:** Generate a 64-character hex string:
  ```bash
  openssl rand -hex 32
  ```
- [ ] **Lock Down CORS:** Restrict `CORS_ALLOWED_ORIGINS` strictly to your production domain(s).
- [ ] **Firewall Ports:**
  ```bash
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow ssh
  sudo ufw allow http
  sudo ufw allow https
  sudo ufw enable
  ```
- [ ] **Database Backup:** Automate backups of the `quantum_chat_postgres_data` volume:
  ```bash
  docker exec -t quantum-chat-db pg_dumpall -c -U postgres > backup_$(date +%Y%m%d).sql
  ```

---

## 🔄 Updating Your Deployed App (CI/CD / Manual)
Whenever you push changes to your repository:
```bash
cd quantum-chat-app
git pull origin main
docker compose --env-file .env.docker up --build -d
```
Docker will rebuild only the updated layers and perform a zero-downtime rolling reload.
