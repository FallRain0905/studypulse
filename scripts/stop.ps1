﻿$Port = 5173
$conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $conns) {
    Write-Host "  [PyPulse] 当前端口 $Port 没有运行中的复习平台服务。" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    exit 0
}
$pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $pids) {
    try {
        Stop-Process -Id $procId -Force -ErrorAction Stop
        Write-Host "  [PyPulse] 已成功停止本地服务 (PID: $procId)" -ForegroundColor Green
    } catch {
        Write-Host "  [PyPulse] 停止 PID $procId 失败: $_" -ForegroundColor Red
    }
}
Start-Sleep -Seconds 2
