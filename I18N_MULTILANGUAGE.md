# Multi-Language Support (i18n) - English & Dutch

## Overview
Space Explorer now supports both **English (en)** and **Dutch (nl)** languages. The app automatically detects the user's browser/OS language preference and displays the appropriate translation.

## How It Works

### 1. Automatic Language Detection
When the app loads, it:
1. Checks URL parameter `?lang=nl` or `?lang=en` (highest priority)
2. Falls back to browser language setting (`navigator.language`)
3. Defaults to English if language is not Dutch

### 2. Dynamic Manifest Loading
The correct manifest file is loaded based on detected language:
- **English users**: `manifest.json`
- **Dutch users**: `manifest.nl.json`

This ensures:
- Correct app name in installation prompts
- Translated descriptions
- Localized shortcuts

### 3. UI Translation
All user-visible text is translated via `src/i18n.js`:
- Navigation labels
- Planet/moon names
- Control buttons
- Help text
- Loading messages
- Error messages

## Supported Languages

### English (en) - Default
- Manifest: `manifest.json`
- URL: No parameter needed or `?lang=en`
- Locale: `en-US`

### Dutch (nl)
- Manifest: `manifest.nl.json`
- URL: `?lang=nl`
- Locale: `nl-NL`

## Testing Different Languages

### Test Dutch Version
```
https://my-pwa-apps.github.io/Solar/?lang=nl
```

### Test English Version
```
https://my-pwa-apps.github.io/Solar/?lang=en
```

### Test Auto-Detection
```
https://my-pwa-apps.github.io/Solar/
```
Will use browser's language preference.

## File Structure

```
Solar/
├── manifest.json           # English manifest
├── manifest.nl.json        # Dutch manifest (Nederlands)
├── index.html             # Detects language, loads correct manifest
└── src/
    └── i18n.js           # Translation strings and logic
```

## Translation Files

### manifest.json (English)
```json
{
  "name": "Space Explorer - Interactive 3D Solar System",
  "short_name": "Space Explorer",
  "description": "Explore our Solar System in stunning 3D...",
  "lang": "en-US"
}
```

### manifest.nl.json (Dutch)
```json
{
  "name": "Ruimte Verkenner - Interactief 3D Zonnestelsel",
  "short_name": "Ruimte Verkenner",
  "description": "Verken ons Zonnestelsel in verbluffende 3D...",
  "lang": "nl-NL"
}
```

### src/i18n.js
Contains translation objects:
```javascript
const translations = {
    en: {
        appTitle: "🚀 Space Explorer",
        earth: "🌍 Earth",
        // ... more translations
    },
    nl: {
        appTitle: "🚀 Ruimte Verkenner",
        earth: "🌍 Aarde",
        // ... more translations
    }
};
```

## Adding More Languages

To add a new language (e.g., German):

### 1. Create New Manifest
```bash
cp manifest.json manifest.de.json
```

Edit `manifest.de.json`:
- Translate `name`, `short_name`, `description`
- Change `lang` to `"de-DE"`
- Update `start_url` to include `?lang=de`
- Translate shortcuts and screenshot labels

### 2. Add Translations to i18n.js
Add a new language object:
```javascript
const translations = {
    en: { /* ... */ },
    nl: { /* ... */ },
    de: {
        appTitle: "🚀 Weltraum Explorer",
        earth: "🌍 Erde",
        // ... more translations
    }
};
```

### 3. Update Language Detection
In `index.html`, add German to the detection logic:
```javascript
if (langCode === 'nl') {
    // Dutch
} else if (langCode === 'de') {
    document.documentElement.lang = 'de';
    const manifestLink = document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = './manifest.de.json';
    document.head.appendChild(manifestLink);
} else {
    // English (default)
}
```

### 4. Update Open Graph
Add alternate locale:
```html
<meta property="og:locale:alternate" content="de_DE">
```

## Dutch Translations Reference

### Planet Names (Planeet Namen)
- Mercury → Mercurius
- Venus → Venus (same)
- Earth → Aarde
- Mars → Mars (same)
- Jupiter → Jupiter (same)
- Saturn → Saturnus
- Uranus → Uranus (same)
- Neptune → Neptunus

### UI Terms (UI Termen)
- Speed → Snelheid
- Paused → Gepauzeerd
- Loading → Laden
- Help → Hulp
- Orbits → Banen
- Constellations → Sterrenbeelden
- Scale → Schaal
- Labels → Labels
- Reset → Resetten
- Enter VR → VR Starten
- Enter AR → AR Starten

### System Terms (Systeem Termen)
- Solar System → Zonnestelsel
- Spacecraft → Ruimtevaartuig
- Satellite → Satelliet
- Moon → Maan
- Star → Ster
- Galaxy → Sterrenstelsel
- Nebula → Nevel

## Browser Language Settings

### How Users Can Test
Users can change their browser language to see different versions:

**Chrome/Edge:**
1. Settings → Languages
2. Add language (e.g., Nederlands)
3. Move to top of list
4. Restart browser

**Firefox:**
1. Settings → General → Language
2. Choose language
3. Restart browser

**Safari:**
1. System Preferences → Language & Region
2. Add preferred language
3. Restart Safari

## PWA Installation

When users install the PWA:
- **Dutch OS/Browser**: Sees "Ruimte Verkenner" in app list
- **English OS/Browser**: Sees "Space Explorer" in app list

The app maintains this language preference after installation.

## SEO Benefits

Multi-language support improves:
- **Discoverability**: Search engines index both versions
- **User Experience**: Users see content in their language
- **Engagement**: Higher usage from non-English speakers
- **Accessibility**: Broader audience reach

## Language Persistence

The app remembers language choice through:
1. **URL Parameter**: `?lang=nl` persists in PWA
2. **Browser Language**: Detected on each visit
3. **No Cookies**: Uses standard browser APIs

## Future Enhancements

Potential additions:
- [ ] French (Français)
- [ ] German (Deutsch)
- [ ] Spanish (Español)
- [ ] Language switcher UI button
- [ ] localStorage preference saving
- [ ] Planet description translations
- [ ] Astronomical data translations

## Testing Checklist

- [x] English manifest loads correctly
- [x] Dutch manifest loads correctly
- [x] URL parameter `?lang=nl` forces Dutch
- [x] URL parameter `?lang=en` forces English
- [x] Auto-detection works based on browser language
- [x] Planet names translated
- [x] UI buttons translated
- [x] Help text translated
- [x] Loading messages translated
- [x] PWA installation shows correct name
- [x] Shortcuts translated
- [x] Meta tags updated

## Technical Notes

### Language Code Format
- Browser returns: `"nl-NL"` or `"en-US"` (with region)
- We extract: `"nl"` or `"en"` (language only)
- Matches ISO 639-1 standard

### Manifest Selection
- Happens in `<head>` before page render
- Uses JavaScript to dynamically create `<link>` tag
- No page flicker or FOUC (Flash of Unstyled Content)

### Performance
- Both manifests are small (~10KB each)
- Translation object is ~5KB
- No impact on load time
- Translations cached by service worker

## Support

For language-specific issues:
1. Check browser console for language detection logs
2. Verify correct manifest is loaded (DevTools → Application → Manifest)
3. Test with `?lang=` parameter to override detection
4. Clear cache and service worker if issues persist

## Credits

Translations:
- English: Original
- Dutch (Nederlands): Native translation

---

**Made with** ❤️ **and** ☕ **by Space Explorer Team**
