#!/usr/bin/env bash
set -e

echo "==================================================================="
echo "  QuantumChat: Starting Full-Stack Multi-Container Environment"
echo "==================================================================="

if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH."
    exit 1
fi

echo "[*] Building and starting containers..."
docker compose --env-file .env.docker up --build -d

echo ""
echo "==================================================================="
echo "  QuantumChat is running successfully!"
echo "==================================================================="
echo "  - Web Frontend:  http://localhost"
echo "  - Alternate URL: http://localhost:5173"
echo "  - REST API:      http://localhost:8080/api"
echo "  - PostgreSQL:    localhost:5432 (quantum_chat_db)"
echo "==================================================================="
echo ""
echo "View live logs: docker compose logs -f"
echo "Stop containers: ./docker-stop.sh"
