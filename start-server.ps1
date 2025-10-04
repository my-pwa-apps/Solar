# Simple HTTP Server for Space Explorer
# Run this script to start a local web server

$port = 8080
$url = "http://localhost:$port"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  🌌 Space Explorer Local Server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting server at: $url" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Change to script directory
Set-Location $PSScriptRoot

# Create and start HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("$url/")
$listener.Start()

Write-Host "✓ Server is running!" -ForegroundColor Green
Write-Host "✓ Opening browser..." -ForegroundColor Green
Write-Host ""

# Open browser
Start-Sleep -Seconds 1
Start-Process $url

# MIME type mapping
$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
    '.md'   = 'text/markdown'
}

try {
    while ($listener.IsListening) {
        # Get request
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Get requested path
        $path = $request.Url.LocalPath
        if ($path -eq '/') {
            $path = '/index.html'
        }
        
        # Remove leading slash and construct full path
        $relativePath = $path.TrimStart('/')
        $fullPath = Join-Path $PSScriptRoot $relativePath
        
        # Log request
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] " -NoNewline -ForegroundColor DarkGray
        Write-Host "$($request.HttpMethod) " -NoNewline -ForegroundColor White
        Write-Host "$path" -ForegroundColor Cyan
        
        # Check if file exists
        if (Test-Path $fullPath -PathType Leaf) {
            try {
                # Read file
                $content = [System.IO.File]::ReadAllBytes($fullPath)
                
                # Get file extension and set MIME type
                $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
                $contentType = if ($mimeTypes.ContainsKey($ext)) {
                    $mimeTypes[$ext]
                } else {
                    'application/octet-stream'
                }
                
                # Set response
                $response.ContentType = $contentType
                $response.ContentLength64 = $content.Length
                $response.StatusCode = 200
                
                # Add CORS headers for local development
                $response.AddHeader('Access-Control-Allow-Origin', '*')
                $response.AddHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                $response.AddHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
                
                # Write response
                $response.OutputStream.Write($content, 0, $content.Length)
                
                Write-Host "         → 200 OK ($($content.Length) bytes)" -ForegroundColor Green
            }
            catch {
                Write-Host "         → ERROR: $_" -ForegroundColor Red
                $response.StatusCode = 500
            }
        }
        else {
            # File not found
            $response.StatusCode = 404
            $html = @"
<!DOCTYPE html>
<html>
<head><title>404 Not Found</title></head>
<body>
    <h1>404 - File Not Found</h1>
    <p>The requested file was not found: $path</p>
    <p><a href="/">Return to Home</a></p>
</body>
</html>
"@
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($html)
            $response.ContentType = 'text/html; charset=utf-8'
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
            
            Write-Host "         → 404 Not Found" -ForegroundColor Yellow
        }
        
        # Close response
        $response.Close()
    }
}
finally {
    # Cleanup
    $listener.Stop()
    $listener.Close()
    Write-Host ""
    Write-Host "Server stopped." -ForegroundColor Yellow
}
