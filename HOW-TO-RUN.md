# 🚀 How to Run the Space Explorer

## ✅ Fixed Path Issues

All file paths have been corrected to use **relative paths** (`./ instead of /`).

---

## 📂 Three Ways to Open the Application

### Method 1: Simple HTTP Server (Recommended)

#### Using Node.js (if installed):
```powershell
cd "c:\Users\bartm\OneDrive - Microsoft\Documents\Git Repos\Solar"
npx http-server -p 8080 -c-1
```
Then open: `http://localhost:8080`

#### Using Python 3 (if installed):
```powershell
cd "c:\Users\bartm\OneDrive - Microsoft\Documents\Git Repos\Solar"
python -m http.server 8080
```
Then open: `http://localhost:8080`

#### Using VS Code:
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

---

### Method 2: Direct File Open (May Have CORS Issues)

**Windows:**
1. Navigate to: `c:\Users\bartm\OneDrive - Microsoft\Documents\Git Repos\Solar`
2. Double-click `index.html`
3. Opens in default browser

**Note:** Some browsers block ES6 modules from `file://` protocol. If you see errors, use Method 1 instead.

---

### Method 3: Chrome with Disabled Security (For Testing Only)

**Windows PowerShell:**
```powershell
# Close all Chrome instances first!
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --allow-file-access-from-files --disable-web-security --user-data-dir="c:\temp\chrome_dev" "c:\Users\bartm\OneDrive - Microsoft\Documents\Git Repos\Solar\index.html"
```

⚠️ **Warning:** Only use this for local testing. Never browse the web with these flags!

---

## 🔧 What Was Fixed

### Before (Broken):
```html
<link rel="stylesheet" href="/src/styles/main.css">     ❌
<script type="module" src="/src/main.js"></script>     ❌
```

### After (Working):
```html
<link rel="stylesheet" href="./src/styles/main.css">   ✅
<script type="module" src="./src/main.js"></script>    ✅
<link rel="icon" href="data:image/svg+xml,...">        ✅ (inline favicon)
```

---

## 📋 Files Status

✅ **index.html** - Fixed paths
✅ **src/main.js** - Enhanced with hyperrealistic visuals
✅ **src/styles/main.css** - Exists
✅ **src/styles/ui.css** - Exists
✅ **favicon** - Now using inline SVG (no 404)

---

## 🎯 Quick Test

### Option A: Simple File Open
```powershell
# Just double-click index.html
start "c:\Users\bartm\OneDrive - Microsoft\Documents\Git Repos\Solar\index.html"
```

### Option B: Use Node.js
```powershell
cd "c:\Users\bartm\OneDrive - Microsoft\Documents\Git Repos\Solar"
npx http-server -p 8080 -c-1
```

---

## 🐛 Troubleshooting

### If you still see 404 errors:
1. **Check browser console** (F12)
2. **Verify file structure**:
   ```
   Solar/
   ├── index.html
   └── src/
       ├── main.js
       └── styles/
           ├── main.css
           └── ui.css
   ```
3. **Hard refresh**: Ctrl+Shift+R (clears cache)

### If Three.js doesn't load:
- Check internet connection (uses CDN)
- Try different browser
- Check console for CDN errors

### If modules don't work:
- Use HTTP server (Method 1) instead of file://
- Ensure browser supports ES6 modules (Chrome, Firefox, Edge)

---

## ✨ Expected Result

When working correctly, you should see:
1. **Loading screen** with progress
2. **3D Solar System** with:
   - Realistic Sun with corona
   - Earth with clouds and blue oceans
   - Jupiter with Great Red Spot
   - Saturn with beautiful rings
   - All planets with proper colors
3. **Interactive controls**:
   - Mouse to rotate view
   - Click objects to focus
   - Space Explorer panel on right

---

## 🎮 Controls Reminder

- **Left Click + Drag**: Rotate camera
- **Right Click + Drag**: Pan camera
- **Scroll**: Zoom in/out
- **Click Object**: Focus and track
- **Reset View Button**: Return to overview

---

**Now try opening it! The path issues are fixed.** 🎉
