# ===================================================================
# QuantumChat: PostgreSQL Launch & Verification Script
# ===================================================================
param(
    [string]$DbPassword = "Vimal@2006",
    [string]$DbUser = "postgres",
    [string]$DbName = "quantum_chat_db",
    [int]$DbPort = 5432
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " QuantumChat: Connecting to Local PostgreSQL (Port $DbPort)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check if port is open
$tcpCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port $DbPort -WarningAction SilentlyContinue
if (-not $tcpCheck.TcpTestSucceeded) {
    Write-Host "`n[!] PostgreSQL server is not running on port $DbPort." -ForegroundColor Yellow
    Write-Host "[*] Attempting to start 'postgresql-x64-18' service..." -ForegroundColor Yellow
    
    try {
        Start-Service -Name "postgresql-x64-18" -ErrorAction Stop
        Write-Host "[+] Service 'postgresql-x64-18' started successfully!" -ForegroundColor Green
    } catch {
        Write-Host "`n[!] Could not start service automatically due to Windows permissions." -ForegroundColor Red
        Write-Host "    Please open PowerShell as Administrator and run:" -ForegroundColor Yellow
        Write-Host "    net start postgresql-x64-18" -ForegroundColor White
        Write-Host "    OR open 'services.msc' and start 'postgresql-x64-18 - PostgreSQL Server 18'." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "[+] PostgreSQL is active and listening on port $DbPort." -ForegroundColor Green
}

# 2. Set environment variables for the session
$env:DB_HOST = "localhost"
$env:DB_PORT = "$DbPort"
$env:DB_NAME = "$DbName"
$env:DB_USERNAME = "$DbUser"
$env:DB_PASSWORD = "$DbPassword"
$env:PGPASSWORD = "$DbPassword"

# 3. Check / Create database using PostgreSQL CLI if available
$psqlPath = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (Test-Path $psqlPath) {
    Write-Host "`n[*] Verifying database '$DbName' exists..." -ForegroundColor Cyan
    $dbCheckCmd = "& '$psqlPath' -U '$DbUser' -h localhost -p $DbPort -lqt"
    $dbList = Invoke-Expression $dbCheckCmd 2>$null
    if ($dbList -notmatch "\b$DbName\b") {
        Write-Host "[*] Creating database '$DbName'..." -ForegroundColor Yellow
        & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U "$DbUser" -h localhost -p $DbPort "$DbName"
        Write-Host "[+] Database '$DbName' created successfully!" -ForegroundColor Green
    } else {
        Write-Host "[+] Database '$DbName' already exists." -ForegroundColor Green
    }
}

# 4. Launch Spring Boot with PostgreSQL configuration (Standard profile, NOT dev-h2)
Write-Host "`n[*] Starting Spring Boot Backend with PostgreSQL..." -ForegroundColor Cyan
Write-Host "    Datasource URL: jdbc:postgresql://localhost:$DbPort/$DbName" -ForegroundColor Gray
Write-Host "    Database User:  $DbUser" -ForegroundColor Gray
Write-Host "----------------------------------------------------------`n" -ForegroundColor DarkGray

# Run Spring Boot (without dev-h2 profile)
mvn spring-boot:run
