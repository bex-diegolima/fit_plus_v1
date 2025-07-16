@echo off
taskkill /F /IM node.exe > nul 2>&1
npx kill-port 5005 5006 5007 5008 5009 > nul 2>&1
timeout 1 > nul
start npm start