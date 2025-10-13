# Fix UTF-8 encoding corruption in i18n.js
# Read the file as Latin-1 (which will interpret the UTF-8 bytes correctly)
# Then write it back as UTF-8

$filePath = "src\i18n.js"

# Read as Latin-1 (ISO-8859-1) which will properly decode the UTF-8 bytes  
$bytes = [System.IO.File]::ReadAllBytes($filePath)
$content = [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetString($bytes)

# Now write back with proper UTF-8 encoding with BOM
$utf8WithBom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($filePath, $content, $utf8WithBom)

Write-Host "Encoding fixed! File now properly saved as UTF-8 with BOM."
