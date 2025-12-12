@echo off
echo [WRAPPER] Starting at %date% %time% >> c:\projects\kanban\MCP\wrapper.log
echo [WRAPPER] CWD: %cd% >> c:\projects\kanban\MCP\wrapper.log
echo [WRAPPER] Node path check: >> c:\projects\kanban\MCP\wrapper.log
where node >> c:\projects\kanban\MCP\wrapper.log 2>&1

echo [WRAPPER] Launching Node... >> c:\projects\kanban\MCP\wrapper.log
node c:\projects\kanban\MCP\dist\index.js
echo [WRAPPER] Node finished with code %errorlevel% >> c:\projects\kanban\MCP\wrapper.log
