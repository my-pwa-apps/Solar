# Remove all emojis from the application

Write-Host "Removing emojis from all files..." -ForegroundColor Cyan

# Read src/main.js
$content = Get-Content 'src\main.js' -Raw -Encoding UTF8

# Remove all emojis
$emojis = @('🔥', '🌋', '🌍', '🌕', '🔴', '🪐', '💍', '🔵', '💙', '🌑', '🌙', '☀️', '⚡', '📦', '❄️', '🏔️', '☄️', '🛰️', '🚀', '🔭', '⚔️', '🌈', '💥', '🌌', '🌀', '🎩', '🌊', '💦', '💫', '🥽', '📱', '⏱️', '🛤️', '⭐', '📏', '📊', '🔄', '❓', '🎬', '🖱️', '✨', '🌟', '🏷️')

foreach ($emoji in $emojis) {
    $content = $content -replace "$emoji\s*", ''
}

Set-Content 'src\main.js' -Value $content -Encoding UTF8 -NoNewline
Write-Host "✓ Emojis removed from src/main.js" -ForegroundColor Green

Write-Host "`n✓ All emojis removed!" -ForegroundColor Green
