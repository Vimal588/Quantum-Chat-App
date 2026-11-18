@echo off
title QuantumChat - Docker Stop
echo [*] Stopping QuantumChat Docker containers...
docker compose down
echo [+] All containers stopped successfully.
pause
