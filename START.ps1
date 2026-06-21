# NirmalMandi — One-click local startup
# All 11 backend services + AI service + admin + web
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "   NirmalMandi — Starting Local Dev Stack      " -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Ports:" -ForegroundColor DarkGray
Write-Host "    3001 auth  | 3002 inventory  | 3003 order" -ForegroundColor DarkGray
Write-Host "    3004 search | 3005 payment   | 3006 notification" -ForegroundColor DarkGray
Write-Host "    3007 logistics | 3008 analytics | 3009 dispute | 3011 invoice" -ForegroundColor DarkGray
Write-Host "    8000 ai-service" -ForegroundColor DarkGray
Write-Host "    3000 admin | 3010 web" -ForegroundColor DarkGray
Write-Host ""

$services = @(
  @{ name = "auth-service";         dir = "packages\auth-service";         port = 3001; color = "Cyan"    },
  @{ name = "inventory-service";    dir = "packages\inventory-service";     port = 3002; color = "Magenta" },
  @{ name = "order-service";        dir = "packages\order-service";         port = 3003; color = "Yellow"  },
  @{ name = "search-service";       dir = "packages\search-service";        port = 3004; color = "DarkCyan" },
  @{ name = "payment-service";      dir = "packages\payment-service";       port = 3005; color = "Green"   },
  @{ name = "notification-service"; dir = "packages\notification-service";  port = 3006; color = "Blue"    },
  @{ name = "logistics-service";    dir = "packages\logistics-service";     port = 3007; color = "DarkYellow" },
  @{ name = "analytics-service";    dir = "packages\analytics-service";     port = 3008; color = "White"   },
  @{ name = "dispute-service";      dir = "packages\dispute-service";       port = 3009; color = "Red"     },
  @{ name = "invoice-service";      dir = "packages\invoice-service";       port = 3011; color = "DarkGreen" }
)

foreach ($svc in $services) {
  $svcPath = Join-Path $root $svc.dir
  $script = "Set-Location '$svcPath'; npm run dev"
  Start-Process powershell -ArgumentList "-NoExit", "-Command", $script
  Write-Host "  + $($svc.name) :$($svc.port)" -ForegroundColor $svc.color
  Start-Sleep -Milliseconds 500
}

# AI service (Python)
Write-Host "  + ai-service :8000" -ForegroundColor DarkMagenta
$aiPath = Join-Path $root "ai-service"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$aiPath'; uvicorn app.main:app --reload --port 8000"
Start-Sleep -Milliseconds 500

# Frontend apps
Write-Host ""
Write-Host "  + admin (Next.js) :3000" -ForegroundColor White
$adminPath = Join-Path $root "admin"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$adminPath'; npm run dev"
Start-Sleep -Milliseconds 500

Write-Host "  + web (Next.js) :3010" -ForegroundColor White
$webPath = Join-Path $root "web"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$webPath'; npm run dev"

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  All 13 services starting — wait ~30 seconds  " -ForegroundColor Green
Write-Host ""
Write-Host "  Admin:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Web:    http://localhost:3010" -ForegroundColor Cyan
Write-Host ""
Write-Host "  First-time: run migrations on Neon first!" -ForegroundColor Yellow
Write-Host "  See: RAILWAY_DEPLOY.md for instructions"   -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Green
