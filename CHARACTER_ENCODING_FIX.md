# Character Encoding Issue - DIAGNOSIS AND SOLUTION

## Problem
The translations in `src/i18n.js` for French, German, and Portuguese contain UTF-8 mojibake (character encoding corruption). Special characters display incorrectly in the UI.

## Examples of Corruption
- **French**: `SystÃ¨me` should be `Système`, `Ã‰toile` should be `Étoile`, `crÃ©ation` should be `création`
- **German**: `KuipergÃ¼rtel` should be `Kuipergürtel`, `fÃ¼r` should be `für`
- **Portuguese**: `descri Ã§Ã£o` should be `descrição`, `anÃ£o` should be `anão`, `criaÃ§Ã£o` should be `criação`
- **Dutch**: `AsteroÃ¯dengordel` should be `Asteroïdengordel`, `beÃ¯nvloedde` should be `beïnvloedde`

## Root Cause
The file `src/i18n.js` was saved with UTF-8 bytes but the special characters were double-encoded:
1. Original text had correct UTF-8 characters (é, è, ü, etc.)
2. File was saved/interpreted as Latin-1 (ISO-8859-1)
3. Those misinterpreted bytes were then re-encoded as UTF-8
4. Result: `é` (UTF-8: 0xC3 0xA9) → misread as two Latin-1 chars (Ã©) → re-encoded as UTF-8 → mojibake

## Solution Options

### Option 1: PowerShell Script Fix (Recommended)
Use the existing `fix-encoding.ps1` script with comprehensive replacements:

```powershell
cd 'C:\Users\bartm\OneDrive - Microsoft\Documents\Git Repos\Solar'
$content = [System.IO.File]::ReadAllText('src\i18n.js', [System.Text.Encoding]::UTF8)

# All known mappings
$fixes = @{
    # Common French/Portuguese/Spanish
    'Ã©' = 'é'; 'Ã¨' = 'è'; 'Ã ' = 'à'; 'Ã§' = 'ç'; 'Ã´' = 'ô'
    'Ã¢' = 'â'; 'Ãª' = 'ê'; 'Ã­' = 'í'; 'Ã³' = 'ó'; 'Ãº' = 'ú'
    'Ã¡' = 'á'; 'Ã£' = 'ã'; 'Ãµ' = 'õ'; 'Ã‰' = 'É'
    
    # German
    'Ã¼' = 'ü'; 'Ã¶' = 'ö'; 'Ã¤' = 'ä'
    
    # Dutch
    'Ã«' = 'ë'; 'Ã¯' = 'ï'
    
    # Spanish
    'Ã±' = 'ñ'
    
    # Symbols
    'Â°' = '°'; 'Â²' = '²'; 'Ã—' = '×'; 'Î¼' = 'μ'
}

foreach ($wrong in $fixes.Keys) {
    $content = $content.Replace($wrong, $fixes[$wrong])
}

[System.IO.File]::WriteAllText('src\i18n.js', $content, [System.Text.Encoding]::UTF8)
```

### Option 2: Manual Fix in Editor
1. Open `src/i18n.js` in VS Code
2. Use Find & Replace (Ctrl+H)
3. Replace each pattern individually (164 total mojibake patterns found)

### Option 3: Regenerate Translations
If corruption is extensive, consider regenerating translations from scratch using a translation tool/API that preserves UTF-8 encoding.

## Files Affected
- `src/i18n.js` - Lines 260-1632 (all non-English translations)
- Languages: Dutch (nl), French (fr), German (de), Spanish (es), Portuguese (pt)
- English (en) is unaffected (no special characters)

## Testing After Fix
1. Save fixed file with UTF-8 encoding (with BOM recommended)
2. Test in browser by selecting each language:
   - French: Check "Système", "Étoile", "planète", "création"
   - German: Check "für", "Kuipergürtel", "größer"
   - Portuguese: Check "anão", "descrição", "três"
   - Dutch: Check "Asteroïdengordel", "één"
   - Spanish: Check "año", "satélite", "Plutón"
3. Verify in info panels that all special characters display correctly
4. Update service worker version to push fixes to users

## Prevention
- Ensure VS Code is set to UTF-8 encoding: File → Preferences → Settings → Search "encoding" → Set to "utf8"
- Add to `.editorconfig`:
  ```ini
  [*.js]
  charset = utf-8
  ```
- Configure git to handle UTF-8:
  ```bash
  git config core.quotepath false
  git config i18n.commitEncoding utf-8
  git config i18n.logOutputEncoding utf-8
  ```

## Status
⚠️ **IN PROGRESS** - Encoding issue identified and documented. Fix script prepared but not yet applied successfully due to complexity of multi-level encoding corruption.

## Next Steps
1. Apply comprehensive PowerShell fix script
2. Verify all 6 languages display correctly
3. Commit fixed file
4. Bump service worker to v2.1.2 or v2.2.0
5. Deploy to both beta and main branches
