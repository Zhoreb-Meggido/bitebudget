# PWA Deployment Guide

BiteBudget is een Progressive Web App die **HTTPS vereist** voor volledige functionaliteit (camera toegang, service worker, etc.).

## Quick Deploy Opties

### Optie 1: GitHub Pages (Aanbevolen - Gratis & Simpel)

1. **Push naar GitHub:**
   ```bash
   git init  # als nog niet gedaan
   git add .
   git commit -m "v1.0.0 - PWA ready"
   git branch -M main
   git remote add origin https://github.com/[username]/bitebudget.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Ga naar je repository op GitHub
   - Settings → Pages
   - Source: "Deploy from a branch"
   - Branch: `main` → folder: `/dist`
   - Save

3. **App is live op:** `https://[username].github.io/bitebudget/bitebudget.html`

4. **PWA Installeren:**
   - Open de URL op je mobiel
   - Chrome vraagt: "Install BiteBudget?"
   - Klik "Install" → App staat nu op je homescreen
   - Werkt volledig offline!

---

### Optie 2: Netlify Drop (Instant - Gratis)

1. Ga naar: https://app.netlify.com/drop
2. Sleep de hele `/dist` folder naar de browser
3. Done! Live binnen 30 seconden
4. Custom domain optioneel (bijv. `bitebudget.netlify.app`)

---

### Optie 3: Vercel (CLI - Voor developers)

```bash
npm install -g vercel
vercel login
cd dist
vercel --prod
```

---

### Optie 4: Cloudflare Pages

1. Ga naar https://pages.cloudflare.com
2. Connect Git repository
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy!

---

## Na Deployment

### PWA Installatie Checken

Open je deployed app in Chrome DevTools (F12):

1. **Application tab** → Manifest
   - ✅ Manifest should load without errors
   - ✅ Icons should be visible

2. **Application tab** → Service Workers
   - ✅ Should show "activated and is running"
   - ✅ Update on reload enabled

3. **Lighthouse tab** → Run audit → Progressive Web App
   - Target: 90+ score

### Test Installatie

**Desktop (Chrome):**
- URL balk → Install icon (+)
- Of: Menu → "Install BiteBudget..."

**Mobile (Chrome):**
- Menu → "Add to Home Screen"
- Of: Automatische install prompt na 30 seconden

**iOS (Safari):**
- Share button → "Add to Home Screen"
- ⚠️ Beperkte PWA support (geen service worker)

---

## Updates Deployen

### Workflow:
1. Maak wijzigingen in code
2. `npm run build`
3. Push naar GitHub / Upload naar Netlify
4. Service Worker detecteert update automatisch
5. Gebruikers krijgen update prompt

### Versie Bump:
Update `CACHE_NAME` in `public/sw.js`:
```javascript
const CACHE_NAME = 'bitebudget-v1.0.1'; // Increment version
```

---

## Troubleshooting

### Camera werkt niet
- ✅ Check: App draait op **HTTPS** (niet HTTP)
- ✅ Check: Browser permissions (chrome://settings/content/camera)
- ✅ Check: Device heeft camera

### Service Worker registreert niet
- ✅ Check: HTTPS enabled
- ✅ Check: Console for errors (F12)
- ✅ Clear cache: DevTools → Application → Clear storage

### Manifest errors
- ✅ Check: `manifest.json` is accessible via URL
- ✅ Check: Icons bestaan (icon-192.png, icon-512.png)
- ✅ Validate: https://manifest-validator.appspot.com/

### App niet installeerbaar
- ✅ Check: Lighthouse PWA audit score
- ✅ Check: Manifest + Service Worker beide actief
- ✅ Chrome: `chrome://flags` → Enable "Desktop PWAs"

---

## Data Migratie (van oude content:// versie)

Als je al data hebt in de oude file-based versie:

1. Open oude app
2. Data tab → Export → Full Backup
3. Sla JSON op
4. Open nieuwe PWA versie
5. Data tab → Import → Upload JSON
6. ✅ Alle data gemigreerd!

**Let op:** IndexedDB is per origin (URL). `file://` en `https://` zijn verschillende origins.

---

## Custom Domain (Optioneel)

### GitHub Pages:
1. Repository settings → Pages → Custom domain
2. Add CNAME: `food.example.com`
3. Enable "Enforce HTTPS"

### Netlify:
1. Site settings → Domain management
2. Add custom domain
3. Automatische HTTPS via Let's Encrypt

---

## Productie Checklist

- [ ] Icons gegenereerd (192x192 en 512x512)
- [ ] Manifest getest in browser
- [ ] Service Worker actief
- [ ] HTTPS deployment
- [ ] Camera permissions werken
- [ ] Offline mode getest
- [ ] Lighthouse PWA score 90+
- [ ] Installatie getest op mobiel
- [ ] Data backup gemaakt
- [ ] Update flow getest

---

**Veel succes met de deployment! 🚀**

Vragen? Check de docs:
- MDN PWA Guide: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps
- web.dev PWA: https://web.dev/progressive-web-apps/
