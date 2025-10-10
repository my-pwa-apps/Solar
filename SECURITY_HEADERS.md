# Security Headers Configuration for Space Explorer PWA

This document provides recommended security headers for deploying Space Explorer to production.

## 🛡️ Recommended Headers

### For GitHub Pages (via _headers file or netlify.toml)

```
/*
  # Security Headers
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(self), xr-spatial-tracking=(self)
  
  # Content Security Policy
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://cdn.jsdelivr.net; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';
  
  # HTTPS Enforcement
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Service Worker
/sw.js
  Cache-Control: public, max-age=0, must-revalidate
  Service-Worker-Allowed: /

# Static Assets
/src/*
  Cache-Control: public, max-age=31536000, immutable

/icons/*
  Cache-Control: public, max-age=31536000, immutable

/screenshots/*
  Cache-Control: public, max-age=31536000, immutable

# Manifest
/manifest.json
  Cache-Control: public, max-age=86400
  Content-Type: application/manifest+json
```

## 📦 Netlify Configuration

Create a `netlify.toml` file in your root directory:

```toml
[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(self), xr-spatial-tracking=(self)"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://cdn.jsdelivr.net; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    Service-Worker-Allowed = "/"

[[headers]]
  for = "/src/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/icons/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/manifest.json"
  [headers.values]
    Cache-Control = "public, max-age=86400"
    Content-Type = "application/manifest+json"
```

## 🚀 Vercel Configuration

Create a `vercel.json` file in your root directory:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(self), xr-spatial-tracking=(self)"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://cdn.jsdelivr.net; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains; preload"
        }
      ]
    },
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/src/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/icons/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400"
        },
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

## 🌐 GitHub Pages Configuration

GitHub Pages doesn't support custom headers directly. Use these alternatives:

### Option 1: Use Cloudflare (Recommended)
1. Point your custom domain to Cloudflare
2. Configure headers in Cloudflare Page Rules

### Option 2: Meta Tags (Limited)
Some security features can be added via meta tags (already included in index.html):
- `<meta http-equiv="X-UA-Compatible" content="IE=edge">`
- `<meta name="referrer" content="strict-origin-when-cross-origin">`

### Option 3: Use Netlify/Vercel Instead
Deploy to Netlify or Vercel for full header control (see configs above).

## 📋 Header Explanations

### X-Frame-Options: DENY
Prevents clickjacking by disallowing the page from being embedded in iframes.

### X-Content-Type-Options: nosniff
Prevents MIME type sniffing, forcing browsers to respect declared content types.

### X-XSS-Protection: 1; mode=block
Enables browser XSS filtering (legacy support for older browsers).

### Referrer-Policy: strict-origin-when-cross-origin
Controls how much referrer information is shared with cross-origin requests.

### Permissions-Policy
Controls which browser features the site can use:
- Denies: geolocation, microphone, camera, payment, USB, magnetometer, gyroscope
- Allows (self): accelerometer, xr-spatial-tracking (for VR/AR)

### Content-Security-Policy
Restricts resource loading to prevent XSS attacks:
- `default-src 'self'`: Only load resources from same origin by default
- `script-src 'self' 'unsafe-inline' cdn`: Allow scripts from self and CDN
- `style-src 'self' 'unsafe-inline'`: Allow inline styles (for Three.js)
- `img-src 'self' data: blob:`: Allow images from self and data URIs
- `worker-src 'self'`: Allow service workers from same origin

### Strict-Transport-Security (HSTS)
Forces HTTPS connections for 1 year, including subdomains.

## 🔒 Additional Security Best Practices

1. **HTTPS Only**: Always serve over HTTPS (required for PWA)
2. **Subresource Integrity (SRI)**: Consider adding SRI hashes to CDN scripts
3. **Regular Updates**: Keep Three.js and dependencies updated
4. **Security Audits**: Run periodic security audits with:
   - Google Lighthouse
   - OWASP ZAP
   - Mozilla Observatory
5. **Rate Limiting**: Implement on server side if you add APIs
6. **CORS**: Configure properly if adding external API calls

## 📊 Testing Your Security Headers

After deployment, test your security headers:

1. **SecurityHeaders.com**: https://securityheaders.com/
2. **Mozilla Observatory**: https://observatory.mozilla.org/
3. **Chrome DevTools**: Network tab → Response Headers
4. **Lighthouse**: Run PWA and Security audits

## 🎯 Expected Security Scores

With these headers properly configured:
- SecurityHeaders.com: A+ rating
- Mozilla Observatory: A+ rating
- Lighthouse Security: 100/100

## ⚠️ Important Notes

- **'unsafe-inline'** is used for styles/scripts due to Three.js requirements
- To remove 'unsafe-inline', you'd need to refactor all inline styles/scripts
- XR permissions (accelerometer, xr-spatial-tracking) are required for VR/AR
- Test thoroughly after implementing CSP - it may break functionality if too strict
