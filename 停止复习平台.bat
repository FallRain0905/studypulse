@echo off
title 停止 PyPulse 本地服务
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\stop.ps1"
