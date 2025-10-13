# Comprehensive UTF-8 mojibake fix for i18n.js
$filePath = "src\i18n.js"

# Read file as UTF-8
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Fix all UTF-8 mojibake patterns
$replacements = @{
    'Ã©' = 'é'
    'Ã¨' = 'è'
    'Ã«' = 'ë'
    'Ã¯' = 'ï'
    'Ã´' = 'ô'
    'Ã¢' = 'â'
    'Ã ' = 'à'
    'Ã§' = 'ç'
    'Ã¶' = 'ö'
    'Ã¼' = 'ü'
    'Ã¤' = 'ä'
    'Ã±' = 'ñ'
    'Ã£' = 'ã'
    'Ãµ' = 'õ'
    'Ã­' = 'í'
    'Ã³' = 'ó'
    'Ãª' = 'ê'
    'Ã‰' = 'É'
    'Ã‚' = 'Â'
    'Ã—' = '×'
    'Î¼' = 'μ'
    'Â²' = '²'
    'Â°' = '°'
    'Ãº' = 'ú'
    'Ã¡' = 'á'
}

# Apply all replacements
foreach ($key in $replacements.Keys) {
    $content = $content -replace [regex]::Escape($key), $replacements[$key]
}

# Write back as UTF-8 with BOM
$utf8WithBom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText($filePath, $content, $utf8WithBom)

Write-Host "✓ Fixed all encoding issues in i18n.js"
Write-Host "✓ File saved with UTF-8 BOM encoding"
