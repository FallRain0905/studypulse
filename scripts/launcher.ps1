﻿param(
    [ValidateSet("Interactive", "Silent")]
    [string]$Mode = "Interactive"
)

$ErrorActionPreference = "SilentlyContinue"
$ProjectDir = Split-Path -Parent $PSScriptRoot
$Port = 5173
$Url = "http://127.0.0.1:$Port/"

function Test-PortOpen {
    param([int]$TargetPort)
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect("127.0.0.1", $TargetPort, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne(220, $false)
        if ($wait -and $client.Connected) {
            $client.EndConnect($iar)
            $client.Close()
            return $true
        }
        $client.Close()
        return $false
    } catch {
        return $false
    }
}

Set-Location -LiteralPath $ProjectDir

# 1. If already running, open browser immediately
if (Test-PortOpen -TargetPort $Port) {
    if ($Mode -eq "Interactive") {
        Write-Host ""
        Write-Host "  [PyPulse] 检测到本地复习平台已在运行，正在为你打开浏览器..." -ForegroundColor Green
        Write-Host "  地址: $Url" -ForegroundColor Cyan
        Write-Host ""
    }
    Start-Process $Url
    if ($Mode -eq "Interactive") {
        Start-Sleep -Seconds 2
    }
    exit 0
}

# 2. Ensure dependencies exist
if (-not (Test-Path (Join-Path $ProjectDir "node_modules"))) {
    if ($Mode -eq "Interactive") {
        Write-Host "  [PyPulse] 首次启动，正在自动安装前端依赖..." -ForegroundColor Yellow
    }
    & npm install
}

if ($Mode -eq "Silent") {
    # Start Vite silently in background
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "npm run dev" -WorkingDirectory $ProjectDir -WindowStyle Hidden
    for ($i = 0; $i -lt 80; $i++) {
        Start-Sleep -Milliseconds 250
        if (Test-PortOpen -TargetPort $Port) {
            Start-Process $Url
            exit 0
        }
    }
    # Fallback open
    Start-Process $Url
    exit 0
} else {
    Clear-Host
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "   PyPulse · Python 课程交互式复习平台 & Web Python IDE" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  工作目录: $ProjectDir" -ForegroundColor Gray
    Write-Host "  访问地址: $Url" -ForegroundColor Yellow
    Write-Host "  运行引擎: 本地 Python 3 + 实时 AST 语法检查" -ForegroundColor Gray
    Write-Host "  提示: 就绪后将自动弹出浏览器，关闭此窗口即可停止服务。" -ForegroundColor DarkGray
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""

    # Background waiter opens browser right when port 5173 is listening
    $waiter = "for(`$i=0;`$i -lt 80;`$i++){ Start-Sleep -Milliseconds 250; try{ `$c=New-Object System.Net.Sockets.TcpClient; `$r=`$c.BeginConnect('127.0.0.1',$Port,`$null,`$null); if(`$r.AsyncWaitHandle.WaitOne(200,`$false) -and `$c.Connected){ `$c.Close(); Start-Process '$Url'; break }; `$c.Close() }catch{} }"
    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile", "-WindowStyle", "Hidden", "-Command", $waiter

    & npm run dev
}
