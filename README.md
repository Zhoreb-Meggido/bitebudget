# BiteBudget (Voedseljournaal) v0.9.0

**Modern React + TypeScript food tracking app met single-file deployment**

Standalone voedingstracking app voor desktop en mobile browsers - geen server vereist, alle data lokaal.

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
# Output: dist/bitebudget.html (single file - 1.26 MB, alles inline)
```

---

## ✅ v0.9.0 - Feature Complete (Huidige Versie)

### **Core Functionaliteit**
- ✅ **Journaal** - Dagelijkse maaltijd tracking met nutrition cards
- ✅ **Tracking** - Gewicht tracking met grafieken en geschiedenis
- ✅ **Dashboard** - Multi-metric visualisaties (6 metrics, 10 time ranges)
- ✅ **Analyse** - Week vergelijking, kalender heatmap, weekday trends
- ✅ **Data** - Import/Export met duplicaat-detectie, rapportage (TXT/PDF)
- ✅ **Instellingen** - Volledig configureerbare doelen en limieten

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

### **Technical Features**
- ✅ Single-file deployment (vite-plugin-singlefile)
- ✅ All metrics met multi-axis charts
- ✅ Custom hooks voor state management
- ✅ Service pattern met singletons
- ✅ TypeScript strict mode
- ✅ Tailwind CSS v3

---

## 🔮 v1.0.0 Roadmap - OpenFoodFacts Integration

### **Phase 1: OpenFoodFacts Integration** (Game Changer - IN PROGRESS)
- [ ] **Barcode Scanner**
  - Camera access voor mobiele devices
  - QuaggaJS of ZXing voor barcode detection
  - Direct product lookup via EAN
- [ ] **Text Search**
  - OpenFoodFacts API v2 integratie
  - Zoeken op product naam
  - Auto-fill nutritie data
- [ ] **Product Type Update**
  - EAN/barcode veld toevoegen
  - OpenFoodFacts metadata (nutri-score, foto's)
  - Source tracking (manual/barcode/search)

### **Product Schema v2.0**
```typescript
interface Product {
  // Existing
  id: string;
  name: string;
  calories: number;  // per 100g
  protein: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
  favorite: boolean;
  created_at: string;
  updated_at: string;

  // New in v2.0
  ean?: string;                    // Barcode/EAN-13
  source: 'manual' | 'barcode' | 'search';
  openfoodfacts_id?: string;       // OFF product code
  nutri_score?: string;            // A-E rating
  image_url?: string;              // Product foto
  brand?: string;                  // Merk
  last_synced?: string;            // Voor updates from OFF
}
```

### **Phase 2: SQLite Migration** (Deprioritized - Browser support issues)
- [ ] **Note:** SQLite migration postponed due to limited mobile browser support
- [ ] File System Access API not yet available on Android/iOS
- [ ] Will revisit when browser support improves or native app wrapper is considered
- [ ] Current IndexedDB + JSON export/import works well for portability

### **Future Considerations (v1.1+)**
- [ ] Improved JSON sync (timestamps, conflict detection, delta sync)
- [ ] PWA features (offline caching, install prompt)
- [ ] Photo attachments voor meals
- [ ] Recipe builder (meerdere producten → opslaan als nieuw product)
- [ ] Light/Dark theme toggle
- [ ] Internationalization (i18n - Engels)
- [ ] Device API integration (Garmin, Sacoma scale imports)

---

## 📁 Project Structuur

```
src/
├── components/
│   ├── journal/
│   │   ├── JournalPage.tsx           ✅ Daily meal tracking
│   │   ├── AddMealModal.tsx          ✅ Add meals (3 methods)
│   │   └── ProductsModal.tsx         ✅ Product CRUD
│   ├── tracking/
│   │   └── TrackingPage.tsx          ✅ Weight tracking + charts
│   ├── dashboard/
│   │   └── DashboardPage.tsx         ✅ Multi-metric visualizations
│   ├── analyse/
│   │   └── AnalysePage.tsx           ✅ Week comparison + heatmap + trends
│   ├── data/
│   │   └── DataPage.tsx              ✅ Import/Export + Reports
│   ├── settings/
│   │   └── SettingsPage.tsx          ✅ User preferences
│   └── TabNavigation.tsx             ✅ Responsive nav (6 tabs)
├── services/
│   ├── database.service.ts           ✅ Dexie DB initialization
│   ├── entries.service.ts            ✅ Meal entries CRUD (w/ dedup)
│   ├── products.service.ts           ✅ Products CRUD (w/ smart merge)
│   ├── settings.service.ts           ✅ User settings
│   └── weights.service.ts            ✅ Weight tracking CRUD (w/ dedup)
├── hooks/
│   ├── useDatabase.ts                ✅ DB connection hook
│   ├── useEntries.ts                 ✅ Entries state management
│   ├── useProducts.ts                ✅ Products state management
│   ├── useSettings.ts                ✅ Settings state management
│   └── useWeights.ts                 ✅ Weights state management
├── utils/
│   ├── date.utils.ts                 ✅ Date helpers (UTC-safe)
│   ├── download.utils.ts             ✅ File download helpers
│   ├── calculations.ts               ✅ Nutrition calculations
│   └── report.utils.ts               ✅ TXT/PDF generation
├── types/
│   └── database.types.ts             ✅ All TypeScript interfaces
└── main.tsx                          ✅ App entry point

dist/
└── bitebudget.html                   ✅ Single-file production build
```

---

## 🔧 Tech Stack

### Current (v0.9.0)
- **React 18** + **TypeScript 5**
- **Vite 5** - Build tool
- **Tailwind CSS 3** - Styling
- **Dexie.js 3.2** - IndexedDB wrapper
- **Chart.js 4.5** + **react-chartjs-2** - Visualizations
- **jsPDF 2.5** + **jspdf-autotable** - PDF generation
- **vite-plugin-singlefile** - Single HTML deployment

### Planned (v1.0.0)
- **sql.js-httpvfs** or **wa-sqlite** - SQLite in browser
- **OpenFoodFacts API v2** - Product database
- **QuaggaJS** or **ZXing** - Barcode scanning
- **Workbox** - PWA/offline support

---

## 📊 Database Schema

### Current: IndexedDB (Dexie)

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
  calories: number;          // per 100g
  protein: number;           // per 100g
  fat: number;               // per 100g
  saturatedFat: number;      // per 100g
  fiber: number;             // per 100g
  sodium: number;            // per 100g (mg)
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

---

## 🎯 OpenFoodFacts API Integration Plan

### API Endpoints
```typescript
// Barcode lookup
GET https://world.openfoodfacts.org/api/v2/product/{ean}.json

// Text search
GET https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&json=true

// Headers
{
  'User-Agent': 'BiteBudget - Food Tracking App - Version 1.0'
}
```

### Response Mapping
```typescript
interface OpenFoodFactsProduct {
  code: string;              // EAN
  product_name: string;
  brands?: string;
  nutriments: {
    energy_kcal_100g: number;
    proteins_100g: number;
    fat_100g: number;
    'saturated-fat_100g': number;
    fiber_100g: number;
    sodium_100g: number;      // gram! (convert to mg)
  };
  nutriscore_grade?: string;  // a-e
  image_url?: string;
}

// Conversion helper
function offToProduct(off: OpenFoodFactsProduct): Product {
  return {
    name: off.product_name,
    ean: off.code,
    brand: off.brands,
    calories: off.nutriments.energy_kcal_100g,
    protein: off.nutriments.proteins_100g,
    fat: off.nutriments.fat_100g,
    saturatedFat: off.nutriments['saturated-fat_100g'],
    fiber: off.nutriments.fiber_100g,
    sodium: off.nutriments.sodium_100g * 1000, // g → mg
    nutri_score: off.nutriscore_grade,
    image_url: off.image_url,
    source: 'barcode',
    openfoodfacts_id: off.code,
    favorite: false,
    // ... timestamps
  };
}
```

### UX Flow
1. **Scan Barcode** → Lookup EAN → Auto-fill product
2. **Search by Name** → Select from results → Auto-fill product
3. **Manual Entry** → Fallback option (always available)

### Smart Features
- Cache OFF responses (reduce API calls)
- Update button for synced products
- Highlight when OFF data is newer
- Merge conflicts: user wins vs. OFF wins option

---

## 🚢 Deployment

### Standalone HTML File
```bash
npm run build
# Output: dist/bitebudget.html (1.26 MB, gzipped: 395 KB)
```

### Features
- **No server required** - Open HTML file directly
- **Offline capable** - All assets inline
- **Cross-platform** - Windows, Android browsers
- **Privacy-first** - All data stays local (IndexedDB)

### Browser Support
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (iOS/macOS)
- ✅ Android browsers

---

## 🐛 Known Issues

### Non-Critical
- HMR Fast Refresh warnings in dev mode (doesn't affect functionality)
- Port auto-increment on conflicts (3000 → 3001 → 3002)

### Fixed in v0.9.0
- ✅ Heatmap timezone shifts (UTC-safe parsing)
- ✅ Import duplicates (smart dedup logic)
- ✅ Page width inconsistencies (all max-w-7xl)
- ✅ Mobile navigation overflow (icon-only on small screens)

---

## 📝 Version History

### v0.9.0 (Current - October 2024)
**Feature Complete - Ready for Public v1.0**
- ✅ All 6 tabs implemented and polished
- ✅ Full responsive + adaptive mobile design
- ✅ Report generation (TXT/PDF)
- ✅ Smart import with duplicate detection
- ✅ Multi-axis charts with all metrics
- ✅ Single-file build → `bitebudget.html`

### v3.4 (October 2024)
- ✅ Journal component complete
- ✅ Database layer (Dexie + services)
- ✅ Custom hooks for state management

### v1.0 (Legacy)
- Original single-file monolith (`voedseljournaal-app.html`)
- 4000+ lines of inline HTML/CSS/JS

---

## 🤝 Contributing

This is a personal project, but ideas and feedback are welcome!

### Roadmap Input
Have ideas for v1.0? Open an issue or discussion about:
- SQLite migration approaches
- Barcode scanner libraries
- OpenFoodFacts integration UX
- PWA features

---

## 📄 License

Personal project - All rights reserved

---

**Last Updated:** October 31, 2024
**Status:** v0.9.0 Feature Complete - Starting v1.0
**Next:** OpenFoodFacts integration (barcode scanner + product database)
