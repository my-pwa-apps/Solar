@echo off
REM Simple Batch Script to Run Local HTTP Server using PowerShell
REM Place this file in the Solar folder and double-click it

echo Starting Local Web Server...
echo.
echo Your Space Explorer will open at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server when done
echo.

cd /d "%~dp0"

powershell -Command "& { $listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:8080/'); $listener.Start(); Write-Host 'Server started at http://localhost:8080' -ForegroundColor Green; Write-Host 'Opening browser...' -ForegroundColor Green; Start-Process 'http://localhost:8080'; while ($listener.IsListening) { $context = $listener.GetContext(); $request = $context.Request; $response = $context.Response; $path = $request.Url.LocalPath; if ($path -eq '/') { $path = '/index.html' }; $fullPath = Join-Path $PWD.Path $path.TrimStart('/'); Write-Host \"Request: $path\" -ForegroundColor Cyan; if (Test-Path $fullPath -PathType Leaf) { $content = [System.IO.File]::ReadAllBytes($fullPath); $ext = [System.IO.Path]::GetExtension($fullPath).ToLower(); $mimeTypes = @{ '.html'='text/html'; '.css'='text/css'; '.js'='application/javascript'; '.json'='application/json'; '.png'='image/png'; '.jpg'='image/jpeg'; '.gif'='image/gif'; '.svg'='image/svg+xml' }; $response.ContentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }; $response.ContentLength64 = $content.Length; $response.OutputStream.Write($content, 0, $content.Length); } else { $response.StatusCode = 404; $html = '<h1>404 Not Found</h1>'; $buffer = [System.Text.Encoding]::UTF8.GetBytes($html); $response.OutputStream.Write($buffer, 0, $buffer.Length); }; $response.Close(); }; $listener.Stop(); }"

pause
