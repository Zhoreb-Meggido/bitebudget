# BiteBudget v1.13.0

**Progressive Web App (PWA) voor food tracking - werkt volledig offline met cloud sync!**

Modern React + TypeScript food tracking app met OpenFoodFacts integratie en end-to-end encrypted Google Drive synchronisatie. Installeerbaar als native app op desktop en mobile - alle data lokaal met optionele cloud backup.

**🎉 Nieuw in v1.13.0:** Steps Intraday Tracking - Volledige stappen tracking met Health Connect import, bar chart visualisatie en 👣 heatmap integratie!

**📜 [Volledige Versiegeschiedenis →](VERSION_HISTORY.md)**

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

## ✨ Current Features (v1.13.0)

### 📱 PWA Features
- ✅ **Installeerbaar** - "Add to Home Screen" op iOS/Android
- ✅ **Offline First** - Service Worker cachet alle assets
- ✅ **Camera Toegang** - Barcode scanner werkt in standalone mode
- ✅ **Auto-Updates** - Nieuwe versies automatisch gedetecteerd
- ✅ **Native Feel** - Standalone mode zonder browser UI
- ✅ **App Shortcuts** - Snelkoppelingen naar Vandaag en Producten
- ✅ **Cloud Sync** - End-to-end encrypted backup naar Google Drive

### 🚀 QuickActions System
- ✅ **Bottom Sheet Menu** - Hamburgermenu in footer met 4 snelle acties
- ✅ **Global Access** - Werkt vanuit elke pagina in de app
- ✅ **Maaltijd Toevoegen** - Schakel naar Journaal tab en open add meal modal
- ✅ **Product Toevoegen** - Open product creation modal
- ✅ **Product Scannen** - Direct barcode scanner openen
- ✅ **Product Zoeken** - Zoek in OpenFoodFacts database
- ✅ **Responsive Design** - Volledige breedte op mobiel, compacte box op desktop

### 📊 Food Tracking
- ✅ **Journaal** - Dagelijkse maaltijd tracking met nutrition cards
- ✅ **2-Step Add Meal Flow** - Product selectie → Meal details (v1.11+)
- ✅ **Meal Templates** - Opslaan en hergebruiken van veelgebruikte maaltijden
- ✅ **Quick Add** - One-click meal logging vanuit templates
- ✅ **Favorites** - Markeer producten en templates als favoriet
- ✅ **Portie Templates** - 50+ voorgedefinieerde porties (snee brood, kop melk, etc.)
- ✅ **8 Nutrition Metrics** - Calories, Protein, Carbs, Sugars, Fat, SatFat, Fiber, Sodium
- ✅ **Meal Type Classification** - Optioneel categoriseren als Ontbijt/Lunch/Diner/Snack
- ✅ **Intermittent Fasting Support** - IF window tracking met visuele indicator
- ✅ **Water Tracking** - Dagelijkse water consumptie tracking met quick-add interface

### 🔍 Product Management
- ✅ **OpenFoodFacts Integration** - 2+ miljoen producten database
- ✅ **Barcode Scanner** - Camera-based scanning (html5-qrcode)
- ✅ **Text Search** - Zoek producten op naam
- ✅ **Auto-fill Nutrition** - Nutritie data automatisch invullen
- ✅ **Product Database** - Lokale database met favorieten
- ✅ **Source Tracking** - Visual badges (manual/barcode/search)
- ✅ **Product Metadata** - Nutri-score, merk, foto's

### 📈 Activity & Health Tracking
- ✅ **Weight Tracking** - Gewicht grafieken en geschiedenis
- ✅ **Garmin Connect Import** - CSV import van daily activities
- ✅ **Activity Metrics** - Steps, calories, active minutes, resting HR
- ✅ **Steps Tracking** - Intraday steps visualization met bar chart (v1.13+)
- ✅ **Sleep Stages** - Detailed sleep analysis (Light, Deep, REM, Awake) - v1.10+
- ✅ **Heart Rate Visualization** - Intraday HR charts met zones (v1.7+)
- ✅ **HRV Tracking** - Heart Rate Variability monitoring (v1.6+)
- ✅ **Stress & Body Battery** - Garmin metrics import
- ✅ **Health Connect Import** - Import HR, Sleep & Steps from Android Health Connect

### 📊 Analysis & Visualizations
- ✅ **Dashboard** - Multi-metric visualisaties (8 metrics, 10 time ranges)
- ✅ **Weight Projection** - Wekelijkse voorspelling op basis van calorietekort
- ✅ **Analyse Page** - 4 tabs: Voeding, Activiteit, Balance, Trends
- ✅ **Week Comparison** - Vergelijk voeding en activiteit per week
- ✅ **Kalender Heatmap** - 8-week visuele nutrition tracking
- ✅ **Aggregated Views** - Weekly/monthly summaries met CSV export (v1.8+)
- ✅ **Correlation Analysis** - Scatter plots met trend lijnen (v1.8.2+)
- ✅ **Weekday Trends** - Gemiddelden per dag van de week

### ☁️ Cloud Sync & Data Management
- ✅ **End-to-End Encryption** - AES-GCM 256-bit met PBKDF2
- ✅ **Automatic Sync** - 30s debounce uploads + 5 min periodic pulls
- ✅ **Smart Merge** - Bidirectional sync met timestamp-based conflict resolution
- ✅ **Soft Delete** - Deletion propagation tussen devices
- ✅ **OAuth 2.0** - Google Drive authenticatie (restricted scope)
- ✅ **Automatic Token Refresh** - Via Supabase Edge Functions (v1.6+)
- ✅ **Import/Export** - Full backup, entries, products, weights
- ✅ **CSV Export** - Excel-compatible exports
- ✅ **PDF Reports** - Detailed nutrition reports met grafieken
- ✅ **TXT Reports** - Simple text-based summaries

### 🎨 UX Features
- ✅ **Responsive Design** - Desktop & mobile optimized
- ✅ **Dark Mode** - (planned)
- ✅ **Swipe Gestures** - Navigate tabs met swipe left/right (v1.6.2+)
- ✅ **Touch-Friendly** - Optimized touch targets
- ✅ **Compact Layouts** - Maximum info density
- ✅ **Color-Coded Metrics** - Visual feedback voor goals
- ✅ **Tooltips** - Helpful hover information
- ✅ **Loading States** - Clear feedback tijdens data operations
- ✅ **Sub-Tab Persistence** - Remember active tab across refreshes (v1.12+)

---

## 📁 Project Structure

```
src/
├── components/
│   ├── journal/
│   │   ├── JournalPage.tsx           ✅ Daily meal tracking
│   │   └── AddMealModal.v2.tsx       ✅ 2-step add meal flow
│   ├── tracking/
│   │   └── TrackingPage.tsx          ✅ Weight tracking + charts
│   ├── dashboard/
│   │   └── DashboardPage.tsx         ✅ 8 metrics + projections
│   ├── analyse/
│   │   ├── AnalysePageWithTabs.tsx   ✅ 4-tab analysis page
│   │   ├── VoedingTab.tsx            ✅ Nutrition analysis
│   │   ├── ActiviteitTab.tsx         ✅ Activity tracking
│   │   ├── BalanceTab.tsx            ✅ Calorie balance
│   │   ├── TrendsTab.tsx             ✅ Multi-metric trends
│   │   └── OverzichtTab.tsx          ✅ Aggregated views (v1.8+)
│   ├── data/
│   │   ├── DataPage.tsx              ✅ Tab container (3 tabs)
│   │   ├── ProductsPortionsTab.tsx   ✅ Products & portions CRUD
│   │   ├── TemplatesTab.tsx          ✅ Templates CRUD
│   │   ├── ImportExportTab.tsx       ✅ Import/Export + Reports
│   │   ├── ProductEditModal.tsx      ✅ Product modal
│   │   ├── BarcodeScanner.tsx        ✅ Barcode scanning
│   │   └── OpenFoodFactsSearch.tsx   ✅ Product search
│   ├── settings/
│   │   ├── SettingsPage.tsx          ✅ User preferences
│   │   └── CloudSyncSettings.tsx     ✅ Google Drive sync
│   ├── shared/
│   │   ├── PortionModal.tsx          ✅ Portion add/edit
│   │   └── PeriodSelector.tsx        ✅ Dual-mode period selector
│   ├── QuickActions.tsx              ✅ Global bottom sheet menu (v1.12+)
│   ├── AppFooter.tsx                 ✅ Footer with QuickActions trigger (v1.12+)
│   └── TabNavigation.tsx             ✅ Responsive nav (6 tabs)
├── services/
│   ├── database.service.ts           ✅ Dexie DB (v12)
│   ├── entries.service.ts            ✅ Meal entries CRUD
│   ├── products.service.ts           ✅ Products CRUD
│   ├── portions.service.ts           ✅ Portions CRUD
│   ├── templates.service.ts          ✅ Templates CRUD
│   ├── settings.service.ts           ✅ User settings
│   ├── weights.service.ts            ✅ Weight tracking
│   ├── activities.service.ts         ✅ Daily activities
│   ├── heartrate.service.ts          ✅ HR samples (v1.7+)
│   ├── sleepstages.service.ts        ✅ Sleep stages (v1.10+)
│   ├── steps-samples.service.ts      ✅ Steps samples (v1.13+)
│   ├── aggregation.service.ts        ✅ Week/month aggregates (v1.8+)
│   ├── openfoodfacts.service.ts      ✅ OFF API integration
│   ├── encryption.service.ts         ✅ AES-GCM encryption
│   ├── googledrive.service.ts        ✅ OAuth + Drive API
│   └── sync.service.ts               ✅ Sync orchestration
├── hooks/
│   ├── useDatabase.ts                ✅ DB connection
│   ├── useEntries.ts                 ✅ Entries with auto-sync
│   ├── useProducts.ts                ✅ Products with auto-sync
│   ├── usePortions.ts                ✅ Portions with auto-sync
│   ├── useTemplates.ts               ✅ Templates with auto-sync
│   ├── useSettings.ts                ✅ Settings with auto-sync
│   ├── useWeights.ts                 ✅ Weights with auto-sync
│   ├── useActivities.ts              ✅ Activities with auto-sync
│   ├── useHeartRateSamples.ts        ✅ HR samples (v1.7+)
│   ├── useSleepStages.ts             ✅ Sleep stages (v1.10+)
│   ├── useStepsSamples.ts            ✅ Steps samples (v1.13+)
│   ├── useAggregates.ts              ✅ Aggregates (v1.8+)
│   ├── useDebounce.ts                ✅ Generic debounce
│   └── useSwipeTabs.ts               ✅ Swipe gestures (v1.6.2+)
├── contexts/
│   ├── ThemeContext.tsx              ✅ Dark mode support
│   └── ModalStateContext.tsx         ✅ Modal dirty state tracking
├── utils/
│   ├── date.utils.ts                 ✅ Date helpers (UTC-safe)
│   ├── download.utils.ts             ✅ File download
│   ├── calculations.ts               ✅ Nutrition calculations
│   ├── export.utils.ts               ✅ CSV/TXT generation
│   └── report.utils.ts               ✅ PDF generation
├── types/
│   └── database.types.ts             ✅ TypeScript interfaces
└── main.tsx                          ✅ App entry + OAuth handling

public/
├── manifest.json                     ✅ PWA manifest
├── sw.js                             ✅ Service worker
└── icons/                            ✅ PWA icons (192x192, 512x512)
```

---

## 🔧 Tech Stack

### Frontend
- **React 18** + **TypeScript 5**
- **Vite 5** - Build tool
- **Tailwind CSS 3** - Styling

### Data & Storage
- **Dexie.js 3.2** - IndexedDB wrapper
- **IndexedDB** - Local-first storage
- **Google Drive API** - Cloud backup

### Visualizations
- **Chart.js 4.5** + **react-chartjs-2** - Charts
- **Hand-coded SVG** - Heart rate charts

### Integrations
- **html5-qrcode** - Barcode scanning
- **OpenFoodFacts API** - Product database
- **Google Identity Services** - OAuth 2.0
- **Supabase 2.81** - OAuth token management

### Utilities
- **jsPDF 2.5** + **jspdf-autotable** - PDF generation
- **react-swipeable 7.0** - Touch gestures
- **Web Crypto API** - End-to-end encryption

---

## 📊 Database Schema

### IndexedDB Tables (Dexie v12)

**entries** - Maaltijden
```typescript
{
  id: string;
  date: string;              // YYYY-MM-DD
  time: string;              // HH:MM
  name: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'; // IF support
  products?: Array<{name: string, grams: number}>;
  calories: number;
  protein: number;
  carbohydrates: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
  created_at: string;
  updated_at: string;
  deleted?: boolean;
  deleted_at?: string;
}
```

**products** - Product Database
```typescript
{
  id: string;
  name: string;
  ean?: string;                               // Barcode
  source: 'manual' | 'barcode' | 'search';
  calories: number;                           // per 100g
  protein: number;
  carbohydrates: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  fiber: number;
  sodium: number;
  brand?: string;
  nutri_score?: string;                       // A-E
  image_url?: string;
  favorite: boolean;
  created_at: string;
  updated_at: string;
  deleted?: boolean;
  deleted_at?: string;
}
```

**productPortions** - Portie Templates
```typescript
{
  id: string;
  productName: string;
  name: string;                               // "1 snee", "1 kop"
  grams: number;
  isDefault: boolean;
  created_at: string;
}
```

**mealTemplates** - Meal Templates
```typescript
{
  id: string;
  name: string;
  category: string;                           // Ontbijt, Lunch, Diner, etc.
  items: Array<{
    productName: string;
    grams: number;
    portionName?: string;
  }>;
  favorite: boolean;
  lastUsed?: string;
  usageCount: number;
  created_at: string;
  updated_at: string;
}
```

**weights** - Gewicht Tracking
```typescript
{
  id: string;
  date: string;              // YYYY-MM-DD
  weight: number;            // kg
  note?: string;
  created_at: string;
  updated_at: string;
  deleted?: boolean;
  deleted_at?: string;
}
```

**dailyActivities** - Fitness Tracking
```typescript
{
  id: string;
  date: string;              // YYYY-MM-DD (primary key)
  totalCalories: number;
  activeCalories: number;
  restingCalories: number;
  steps: number;
  intensityMinutes?: number;
  distanceMeters?: number;
  floorsClimbed?: number;
  heartRateResting?: number;
  heartRateMax?: number;
  stressLevel?: number;
  bodyBattery?: number;
  sleepSeconds?: number;
  hrvOvernight?: number;
  hrv7DayAvg?: number;
  activities?: FitnessActivity[];
  created_at: string;
  updated_at: string;
  deleted?: boolean;
  deleted_at?: string;
}
```

**heartRateSamples** - Intraday HR Data (v1.7+)
```typescript
{
  date: string;                    // Primary key: YYYY-MM-DD
  samples: HeartRateSample[];      // ~680 intraday samples
  sampleCount: number;
  minBpm: number;
  maxBpm: number;
  avgBpm: number;
  created_at: string;
  updated_at: string;
  deleted?: boolean;
}
```

**sleepStages** - Sleep Stage Data (v1.10+)
```typescript
{
  date: string;                    // Primary key: YYYY-MM-DD
  stages: SleepStage[];            // Array of sleep stages
  totalSleepSeconds: number;
  lightSleepSeconds: number;
  deepSleepSeconds: number;
  remSleepSeconds: number;
  awakeSeconds: number;
  created_at: string;
  updated_at: string;
  deleted?: boolean;
}
```

**stepsSamples** - Intraday Steps Data (v1.13+)
```typescript
{
  date: string;                    // Primary key: YYYY-MM-DD
  samples: StepsSample[];          // Array of intraday steps samples
  sampleCount: number;
  totalSteps: number;
  maxSteps: number;                // Max steps in single sample
  created_at: string;
  updated_at: string;
  deleted?: boolean;
}
```

**settings** - User Settings
```typescript
{
  key: 'user-settings';
  values: {
    caloriesRest: number;
    caloriesSport: number;
    proteinRest: number;
    proteinSport: number;
    saturatedFatMax: number;
    fiberMin: number;
    sodiumMax: number;
    targetWeight: number;
    waterGoalMl: number;                    // Water tracking goal (v1.11+)
    intermittentFasting: boolean;           // IF enabled (v1.12+)
    ifWindowStart: string;                  // IF eating window start (v1.12+)
    ifWindowEnd: string;                    // IF eating window end (v1.12+)
  }
}
```

**waterEntries** - Water Tracking (v1.11+)
```typescript
{
  id: string;
  date: string;              // YYYY-MM-DD
  timestamp: number;         // Exact time
  amount: number;            // ml
  created_at: string;
  updated_at: string;
  deleted?: boolean;
  deleted_at?: string;
}
```

---

## ☁️ Cloud Sync Architecture

### Sync Strategy
- **Auto-Sync**: 30s debounced uploads + 5 min periodic pulls
- **Smart Merge**: Bidirectional sync met timestamp-based conflict resolution
- **Soft Delete**: Deletion propagation tussen devices
- **Conflict Resolution**: Newest `updated_at` timestamp wins

### Security
- **End-to-End Encrypted** - AES-GCM 256-bit
- **PBKDF2 Key Derivation** - 100,000 iterations
- **OAuth 2.0** - Google Drive restricted scope (drive.file only)
- **Automatic Token Refresh** - Via Supabase Edge Functions (zero user interaction)

### Data Format
```typescript
interface SyncData {
  version: '1.11';
  timestamp: string;
  entries: Entry[];
  products: Product[];
  weights: Weight[];
  settings: UserSettings;
  portions: ProductPortion[];
  templates: MealTemplate[];
  activities: DailyActivity[];
  heartRateSamples: DayHeartRateSamples[];  // v1.7+
  sleepStages: DaySleepStages[];             // v1.10+
  stepsSamples: DayStepsSamples[];           // v1.13+
}
```

---

## 🚢 Deployment

### GitHub Pages (Recommended)
```bash
npm run build
# Push dist/ to gh-pages branch
# Enable GitHub Pages in repo settings
```

### Features
- ✅ HTTPS by default (required for PWA)
- ✅ Fast CDN (global edge network)
- ✅ Free hosting (public repos)
- ✅ Auto deploy (via GitHub Actions)

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

### All Major Issues Fixed! ✅
See [VERSION_HISTORY.md](VERSION_HISTORY.md) for complete bugfix history.

---

## 📝 Future Considerations

- [ ] Photo attachments voor meals
- [ ] Recipe builder (meerdere producten → nieuw product)
- [ ] Light/Dark theme toggle (infrastructure in place)
- [ ] Internationalization (i18n - Engels)
- [ ] Garmin API direct integration (OAuth infrastructure ready)
- [ ] Data archiving (voor 10+ jaar data)
- [ ] gzip compression (voor kleinere sync files)
- [ ] Incremental sync (delta updates)

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

**Current Version:** v1.13.0 (January 23, 2025)
**Status:** Stable - Steps Intraday Tracking met Health Connect import
**Next:** TBD

**📜 [Complete Version History →](VERSION_HISTORY.md)**
