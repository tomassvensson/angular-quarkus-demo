# ------------------------------------------------------------------
#  Local Security Scan Script (PowerShell)
#  Runs Trivy FS scan and npm audit before pushing to GitHub
#  This is a local equivalent of the GitHub Actions security workflow.
# ------------------------------------------------------------------
$ErrorActionPreference = 'Continue'

$rootDir = Split-Path -Parent $PSScriptRoot

Write-Host "`n=== Local Security Scan ===`n" -ForegroundColor Yellow

$errors = 0

# ---- Trivy FS Scan ----
if (Get-Command trivy -ErrorAction SilentlyContinue) {
    Write-Host "[1/3] Running Trivy filesystem scan..." -ForegroundColor Yellow
    trivy fs $rootDir --config "$rootDir\trivy.yaml"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[1/3] Trivy scan found issues." -ForegroundColor Red
        $errors++
    } else {
        Write-Host "[1/3] Trivy scan passed." -ForegroundColor Green
    }
} else {
    Write-Host "[1/3] Trivy not installed - skipping." -ForegroundColor Yellow
    Write-Host "       Install: https://aquasecurity.github.io/trivy/"
}
Write-Host ""

# ---- npm audit ----
if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "[2/3] Running npm audit (frontend)..." -ForegroundColor Yellow
    Push-Location "$rootDir\frontend"
    npm audit --omit=dev 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[2/3] npm audit found vulnerabilities." -ForegroundColor Red
        $errors++
    } else {
        Write-Host "[2/3] npm audit passed." -ForegroundColor Green
    }
    Pop-Location
} else {
    Write-Host "[2/3] npm not found - skipping." -ForegroundColor Yellow
}
Write-Host ""

# ---- Maven dependency check ----
$mvnCmd = $null
if (Test-Path "$rootDir\backend\mvnw.cmd") {
    $mvnCmd = "$rootDir\backend\mvnw.cmd"
} elseif (Get-Command mvn -ErrorAction SilentlyContinue) {
    $mvnCmd = "mvn"
}

if ($mvnCmd) {
    Write-Host "[3/3] Running Maven dependency:analyze (backend)..." -ForegroundColor Yellow
    Push-Location "$rootDir\backend"
    & $mvnCmd dependency:analyze -q 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[3/3] Maven dependency:analyze had warnings (non-fatal)." -ForegroundColor Yellow
    } else {
        Write-Host "[3/3] Maven dependency analysis passed." -ForegroundColor Green
    }
    Pop-Location
} else {
    Write-Host "[3/3] Maven not found - skipping." -ForegroundColor Yellow
}
Write-Host ""

# ---- Summary ----
if ($errors -gt 0) {
    Write-Host "=== Security scan completed with $errors issue(s) ===" -ForegroundColor Red
    exit 1
} else {
    Write-Host "=== All security scans passed ===" -ForegroundColor Green
    exit 0
}
