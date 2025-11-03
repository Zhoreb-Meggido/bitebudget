# BiteBudget (Voedseljournaal) v1.1.0

**Progressive Web App (PWA) voor food tracking - werkt volledig offline met cloud sync!**

Modern React + TypeScript food tracking app met OpenFoodFacts integratie en end-to-end encrypted Google Drive synchronisatie. Installeerbaar als native app op desktop en mobile - alle data lokaal met optionele cloud backup.

---

## 🚀 Quick Start

### Development Server
```bash
npm install
npm run dev
# Server draait op: http://localhost:3000
```

### Production Build
```bash
npm run build
# Output in dist/:
#   - index.html (main app)
#   - assets/ (JS/CSS chunks)
#   - manifest.json (PWA manifest)
#   - sw.js (service worker)
#   - icon-*.png (app icons)
```

### PWA Deployment
1. Host de bestanden uit `dist/` op een HTTPS server (GitHub Pages, Netlify, Vercel, etc.)
2. Open de URL op je mobiel/desktop
3. Browser vraagt: "Install BiteBudget?" → Klik "Install"
4. App werkt nu volledig offline met camera en cloud sync!

---

## 📱 PWA Features

- ✅ **Installeerbaar** - "Add to Home Screen" op iOS/Android
- ✅ **Offline First** - Service Worker cachet alle assets
- ✅ **Camera Toegang** - Barcode scanner werkt in standalone mode
- ✅ **Auto-Updates** - Nieuwe versies worden automatisch gedetecteerd
- ✅ **Native Feel** - Standalone mode zonder browser UI
- ✅ **App Shortcuts** - Snelkoppelingen naar Vandaag en Producten
- ✅ **Cloud Sync** - End-to-end encrypted backup naar Google Drive

---

## ✨ v1.1.0 - Cloud Sync + Enhancements (Huidige Versie)

### **Nieuwe Features**

#### **Google Drive Sync** ☁️
- ✅ **End-to-End Encryption** - AES-GCM met PBKDF2 (100k iterations)
- ✅ **Automatische Synchronisatie** - Debounced uploads (30s) + periodic pulls (5 min)
- ✅ **Smart Merge** - Bidirectionale sync met timestamp-based conflict resolution
- ✅ **Complete Data** - Entries, Products, Weights, Settings
- ✅ **Persistent State** - Auto-sync blijft actief na app herstart
- ✅ **OAuth 2.0** - Veilige Google Drive authenticatie met restricted scope
- ✅ **Privacy First** - Alleen jij kunt je data lezen

#### **Dashboard Verbeteringen**
- ✅ **8 Metrics Tracking** - Calories, Protein, Carbs, Sugars, Fat, Saturated Fat, Fiber, Sodium
- ✅ **Gewichtsprojectie** - Wekelijkse voorspelling gebaseerd op calorietekort
- ✅ **Optimized Layout** - Chart bovenaan, metrics eronder

#### **Analyse Verbeteringen**
- ✅ **ISO Week Numbers** - Correcte weeknummering in kalender heatmap
- ✅ **Real Week Tracking** - Geen reversed numbering meer

#### **Technical Improvements**
- ✅ **Persistent Auto-Sync** - State survives page reload
- ✅ **Token Management** - OAuth tokens worden veilig opgeslagen
- ✅ **Token Expiry Warning** - Modal popup bij verlopen sessie met directe re-login optie
- ✅ **Runtime Token Detection** - Auto-sync detecteert verlopen tokens tijdens runtime (niet alleen bij opstarten)
- ✅ **Manual Refresh Button** - Quick sync knop in navigatie voor directe cloud pull
- ✅ **Cleanup on Disconnect** - Auto-sync wordt uitgeschakeld bij uitloggen
- ✅ **Safe Merge Operations** - Alle sync operaties gebruiken smart merge (geen data loss)

---

## ✅ v1.0.0 - PWA + OpenFoodFacts

### **Core Functionaliteit**
- ✅ **Journaal** - Dagelijkse maaltijd tracking met nutrition cards
- ✅ **Tracking** - Gewicht tracking met grafieken en geschiedenis
- ✅ **Dashboard** - Multi-metric visualisaties (8 metrics, 10 time ranges)
- ✅ **Analyse** - Week vergelijking, kalender heatmap, weekday trends
- ✅ **Data** - Import/Export met duplicaat-detectie, rapportage (TXT/PDF)
- ✅ **Instellingen** - Volledig configureerbare doelen en limieten

### **OpenFoodFacts Integration**
- ✅ **Barcode Scanner** - html5-qrcode camera integratie
- ✅ **Text Search** - OpenFoodFacts API v2 product zoeken
- ✅ **Auto-fill** - Nutritie data automatisch invullen
- ✅ **Product Metadata** - Nutri-score, brand, foto's
- ✅ **Source Tracking** - Visual badges (manual/barcode/search)
- ✅ **Carbohydrates & Sugars** - Complete macro tracking

### **UI/UX**
- ✅ Responsive design (desktop & mobile optimized)
- ✅ Adaptive navigatie (icon-only op mobiel)
- ✅ Touch-friendly buttons en controls
- ✅ Consistente page layouts
- ✅ Color-coded metrics en warnings

### **Data Management**
- ✅ IndexedDB met Dexie.js (4 tables)
- ✅ Smart import met duplicaat detectie
- ✅ Export opties (Full backup, entries, products, weights)
- ✅ Rapport generatie (TXT en PDF met grafieken)
- ✅ Timezone-safe date handling
- ✅ Cloud backup met encryption

---

## 🔮 v1.2.0 Roadmap (Future)

### **Export Improvements**
- [ ] PDF export met alle nieuwe metrics (koolhydraten, suikers, vet)
- [ ] Lijngrafiek per week in PDF export
- [ ] TXT export met koolhydraten en suikers
- [ ] Export feedback op mobiel (success melding + direct openen)
- [ ] PDF automatisch openen na export

### **Future Considerations**
- [ ] Photo attachments voor meals
- [ ] Recipe builder (meerdere producten → opslaan als nieuw product)
- [ ] Light/Dark theme toggle
- [ ] Internationalization (i18n - Engels)
- [ ] Device API integration (Garmin, Sacoma scale imports)
- [ ] Meal templates en favorites

---

## 📁 Project Structuur

```
src/
├── components/
│   ├── journal/
│   │   ├── JournalPage.tsx           ✅ Daily meal tracking
│   │   ├── AddMealModal.tsx          ✅ Add meals (3 methods)
│   │   ├── ProductsModal.tsx         ✅ Product CRUD
│   │   ├── BarcodeScanner.tsx        ✅ Camera barcode scanning
│   │   └── OpenFoodFactsSearch.tsx   ✅ Product search
│   ├── tracking/
│   │   └── TrackingPage.tsx          ✅ Weight tracking + charts
│   ├── dashboard/
│   │   └── DashboardPage.tsx         ✅ 8 metrics + projections
│   ├── analyse/
│   │   └── AnalysePage.tsx           ✅ Week comparison + heatmap
│   ├── data/
│   │   └── DataPage.tsx              ✅ Import/Export + Reports
│   ├── settings/
│   │   ├── SettingsPage.tsx          ✅ User preferences
│   │   └── CloudSyncSettings.tsx     ✅ Google Drive sync
│   └── TabNavigation.tsx             ✅ Responsive nav (6 tabs)
├── services/
│   ├── database.service.ts           ✅ Dexie DB initialization
│   ├── entries.service.ts            ✅ Meal entries CRUD
│   ├── products.service.ts           ✅ Products CRUD
│   ├── settings.service.ts           ✅ User settings
│   ├── weights.service.ts            ✅ Weight tracking CRUD
│   ├── openfoodfacts.service.ts      ✅ OFF API integration
│   ├── encryption.service.ts         ✅ AES-GCM encryption
│   ├── googledrive.service.ts        ✅ OAuth + Drive API
│   └── sync.service.ts               ✅ Sync orchestration
├── hooks/
│   ├── useDatabase.ts                ✅ DB connection hook
│   ├── useEntries.ts                 ✅ Entries with auto-sync
│   ├── useProducts.ts                ✅ Products state
│   ├── useSettings.ts                ✅ Settings state
│   └── useWeights.ts                 ✅ Weights with auto-sync
├── utils/
│   ├── date.utils.ts                 ✅ Date helpers (UTC-safe)
│   ├── download.utils.ts             ✅ File download
│   ├── calculations.ts               ✅ Nutrition calculations
│   └── export.utils.ts               ✅ TXT/PDF generation
├── types/
│   └── database.types.ts             ✅ TypeScript interfaces
└── main.tsx                          ✅ App entry point

public/
├── manifest.json                     ✅ PWA manifest
├── sw.js                             ✅ Service worker
└── icons/                            ✅ PWA icons (192x192, 512x512)
```

---

## 🔧 Tech Stack

### Current (v1.1.0)
- **React 18** + **TypeScript 5**
- **Vite 5** - Build tool
- **Tailwind CSS 3** - Styling
- **Dexie.js 3.2** - IndexedDB wrapper
- **Chart.js 4.5** + **react-chartjs-2** - Visualizations
- **jsPDF 2.5** + **jspdf-autotable** - PDF generation
- **html5-qrcode** - Barcode scanning
- **Google Identity Services** - OAuth 2.0
- **Web Crypto API** - End-to-end encryption

---

## 📊 Database Schema

### IndexedDB (Dexie)

**Entries** (Maaltijden)
```typescript
{
  id: string;
  date: string;              // YYYY-MM-DD
  time: string;              // HH:MM
  name: string;
  products?: Array<{name: string, grams: number}>;
  calories: number;
  protein: number;
  carbohydrates: number;     // v1.0+
  sugars: number;            // v1.0+
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
  created_at: string;
  updated_at: string;
}
```

**Products** (Product Database)
```typescript
{
  id: string;
  name: string;
  ean?: string;                   // v1.0+ Barcode
  source: 'manual' | 'barcode' | 'search';  // v1.0+
  calories: number;               // per 100g
  protein: number;
  carbohydrates: number;          // v1.0+
  sugars: number;                 // v1.0+
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;                 // mg
  brand?: string;                 // v1.0+
  nutri_score?: string;           // v1.0+ (A-E)
  image_url?: string;             // v1.0+
  favorite: boolean;
  created_at: string;
  updated_at: string;
}
```

**Weights** (Gewicht Tracking)
```typescript
{
  id: string;
  date: string;              // YYYY-MM-DD
  weight: number;            // kg
  note?: string;
  created_at: string;
}
```

**Settings** (Gebruikersinstellingen)
```typescript
{
  key: 'user-settings';
  values: {
    caloriesRest: number;    // Rustdag calorie max
    caloriesSport: number;   // Sportdag calorie max
    proteinRest: number;     // Rustdag eiwit min (g)
    proteinSport: number;    // Sportdag eiwit min (g)
    saturatedFatMax: number; // Verzadigd vet max (g)
    fiberMin: number;        // Vezels min (g)
    sodiumMax: number;       // Natrium max (mg)
    targetWeight: number;    // Streefgewicht (kg)
  }
}
```

### Cloud Sync Data Format (v1.1.0)
```typescript
interface SyncData {
  version: '1.1';
  timestamp: string;
  entries: Entry[];
  products: Product[];
  weights: Weight[];          // v1.1+
  settings: UserSettings;     // v1.1+
}
```

**Encryption:** AES-GCM 256-bit
**Key Derivation:** PBKDF2 (100,000 iterations)
**Storage:** Google Drive (restricted scope: drive.file)

---

## ☁️ Cloud Sync Architecture

### Sync Flow

**Auto-Sync (Bidirectional Merge):**
1. User makes change → 30s debounce timer starts
2. Timer expires → Pull latest from cloud
3. Merge cloud changes with local (newest wins)
4. Upload merged data
5. Periodic pull every 5 minutes (when online)

**Manual Sync (Safe Merge):**
- Pull cloud changes first
- Merge with local (timestamp-based conflict resolution)
- Upload merged result
- **No data loss** - nieuwste items van beide kanten worden behouden

**Manual Pull (Safe Merge):**
- Download cloud backup
- Merge with local data (cloud has priority in conflicts)
- **No data loss** - beide kanten worden samengevoegd

### Conflict Resolution

**Entries:** Composite key (date + time + name), newest `updated_at` wins
**Products:** Add new only, preserve local customizations
**Weights:** By date, newest `created_at` wins
**Settings:** Cloud always wins (no timestamps yet)

### Security

- **End-to-End Encrypted** - Google cannot read your data
- **OAuth 2.0** - Restricted scope (drive.file only)
- **No Server** - Direct client-to-Drive communication
- **Password-Based** - Use same password on all devices

---

## 🚢 Deployment

### GitHub Pages (Recommended)
```bash
npm run build
# Push dist/ to gh-pages branch
# Enable GitHub Pages in repo settings
```

### Features
- **HTTPS by default** - Required for PWA
- **Fast CDN** - Global edge network
- **Free hosting** - For public repos
- **Auto deploy** - Via GitHub Actions

### Browser Support
- ✅ Chrome/Edge 90+ (recommended)
- ✅ Firefox 88+
- ✅ Safari 14+ (iOS/macOS)
- ✅ Android browsers (Chrome, Samsung Internet)

**Note:** Camera access requires HTTPS or localhost

---

## 🔒 Privacy & Security

### Data Storage
- **Local First** - All data in IndexedDB (browser storage)
- **Optional Cloud** - Opt-in encrypted backup
- **No Analytics** - Zero tracking
- **No Cookies** - Pure client-side app

### Cloud Sync Security
- **AES-GCM 256-bit** encryption
- **PBKDF2** key derivation (100k iterations)
- **Google Drive restricted scope** - Only app-created files
- **OAuth 2.0** - Secure authentication
- **Your password = your encryption key** - We never see it

---

## 🐛 Known Issues

### Non-Critical
- HMR Fast Refresh warnings in dev mode (doesn't affect functionality)
- OAuth tokens expire after 1 hour (app toont automatisch popup met re-login optie)

### Fixed in v1.1.0
- ✅ Auto-sync state persistence
- ✅ ISO week numbers in heatmap
- ✅ Duplicate dashboard cards removed
- ✅ Settings sync included
- ✅ Manual sync/restore data loss risk - nu safe merge

### Fixed in v1.0.0
- ✅ OpenFoodFacts integration
- ✅ PWA offline support
- ✅ Barcode scanning

### Fixed in v0.9.0
- ✅ Heatmap timezone shifts
- ✅ Import duplicates
- ✅ Page width inconsistencies
- ✅ Mobile navigation overflow

---

## 📝 Version History

### v1.1.0 (November 2024) - Current
**Cloud Sync + Enhancements**
- ✅ End-to-end encrypted Google Drive sync
- ✅ Automatic bidirectional merge
- ✅ Persistent auto-sync state
- ✅ Safe merge for all sync operations (no data loss)
- ✅ Token expiry warning with one-click re-login
- ✅ Runtime token expiry detection (niet alleen bij opstarten)
- ✅ Manual refresh button voor quick sync
- ✅ Weights & settings in sync data
- ✅ 8 metrics dashboard with projections
- ✅ ISO week numbers in heatmap
- ✅ Optimized dashboard layout

### v1.0.0 (November 2024)
**PWA + OpenFoodFacts**
- ✅ Progressive Web App with offline support
- ✅ Barcode scanner integration
- ✅ OpenFoodFacts product database
- ✅ Carbohydrates & sugars tracking
- ✅ Service worker for caching
- ✅ Installable on all platforms

### v0.9.0 (October 2024)
**Feature Complete**
- ✅ All 6 tabs implemented
- ✅ Responsive mobile design
- ✅ Report generation (TXT/PDF)
- ✅ Smart import with dedup
- ✅ Multi-axis charts

---

## 🤝 Contributing

This is a personal project, but ideas and feedback are welcome!

### Feature Requests
Open an issue or discussion about:
- Export improvements
- New chart types
- Additional integrations
- UI/UX enhancements

---

## 📄 License

Personal project - All rights reserved

---

**Last Updated:** November 3, 2024
**Status:** v1.1.0 - Cloud Sync Active
**Next:** Export improvements (PDF/TXT enhancements)
