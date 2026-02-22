# Wandr — start all services
# Run from TravelBlog root: .\start.ps1

Write-Host "`n🌍 Starting Wandr..." -ForegroundColor Cyan

# Kill any existing Node processes on these ports to avoid EADDRINUSE
$ports = @(5002, 5004, 5006)
foreach ($port in $ports) {
    $pids = (netstat -ano | Select-String ":$port\s") | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Select-Object -Unique
    foreach ($p in $pids) {
        if ($p -match '^\d+$' -and $p -ne '0') {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Milliseconds 500

# Start backend services in separate windows
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\content-service'; Write-Host '✅ Content Service' -ForegroundColor Green; node index.js"
Start-Sleep -Milliseconds 300
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\user-service'; Write-Host '✅ User Service' -ForegroundColor Green; node index.js"
Start-Sleep -Milliseconds 300
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\notification-service'; Write-Host '✅ Notification Service' -ForegroundColor Green; node index.js"
Start-Sleep -Milliseconds 300

# Start frontend in a separate window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; Write-Host '✅ Frontend' -ForegroundColor Green; npm start"

Write-Host "`n✅ All services launching in separate windows." -ForegroundColor Green
Write-Host "   Content Service  → http://localhost:5002" -ForegroundColor Gray
Write-Host "   User Service     → http://localhost:5004" -ForegroundColor Gray
Write-Host "   Notif Service    → http://localhost:5006" -ForegroundColor Gray
Write-Host "   Frontend         → http://localhost:3000" -ForegroundColor Gray
Write-Host "`n   Open http://localhost:3000 in your browser once ready.`n" -ForegroundColor Cyan
