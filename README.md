# BiteBudget (Voedseljournaal) v1.5.0

**Progressive Web App (PWA) voor food tracking - werkt volledig offline met cloud sync!**

Modern React + TypeScript food tracking app met OpenFoodFacts integratie en end-to-end encrypted Google Drive synchronisatie. Installeerbaar als native app op desktop en mobile - alle data lokaal met optionele cloud backup.

**🎉 Nieuw in v1.5.0:** Meal Templates, Garmin Integration & Smart Token Management!

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

## ✨ v1.4.0 - Data Management Page (Huidige Versie)

### **Nieuwe Data Page met 3 Tabs** 📊

#### **Geïntegreerd Data Beheer**
- ✅ **Producten & Porties Tab** - Complete CRUD interface voor producten en porties
- ✅ **Templates Tab** - Meal templates beheren met volledige edit functionaliteit
- ✅ **Import/Export Tab** - Data transport en cloud sync (bestaande functionaliteit)
- ✅ **Uniforme UI** - Emoji buttons (✏️ bewerken, 🗑️ verwijderen, ⭐ favoriet) overal
- ✅ **Zoek & Filter** - Per tab eigen search en filter opties

#### **Producten & Porties Beheer** 🍽️
- ✅ **Product Modal** - Volledig formulier met alle voedingswaarden
  - Naam, merk, calorieën, eiwit, vet, koolhydraten, suikers, vezels, natrium
  - Favoriet checkbox
- ✅ **Portie Modal** - Eenvoudig porties toevoegen/bewerken
  - Portienaam, gram, default checkbox
  - Automatische koppeling aan product
- ✅ **Inline Weergave** - Porties direct zichtbaar onder product
- ✅ **Default Portie** - ⭐ knop om standaard portie in te stellen
- ✅ **Search** - Zoek producten op naam
- ✅ **Filter** - "Alleen met porties" checkbox
- ✅ **Delete Confirmatie** - Bevestiging bij verwijderen

#### **Templates Beheer** ⭐
- ✅ **Template Edit Modal** - Volledig functionele template editor
  - Naam, categorie, favoriet checkbox
  - Dynamische items lijst
  - Product dropdown met ⭐ voor favorieten
  - Portie selectie (indien beschikbaar) met auto-fill
  - Handmatige gram input
  - Items toevoegen/verwijderen met 🗑️ knop
- ✅ **Auto-Selectie** - Default portie automatisch geselecteerd bij product keuze
- ✅ **Validatie** - Minimaal 1 item, alle velden verplicht
- ✅ **Template Cards** - Overzichtelijke weergave per categorie
  - Items lijst met gram en optionele portienaam
  - Usage statistieken (gebruikt X keer, laatst op datum)
- ✅ **Search & Filter** - Zoek op naam/categorie, filter op favorieten
- ✅ **Groepering** - Automatisch gegroepeerd per categorie

#### **UX Verbeteringen** 🎨
- ✅ **Consistente Buttons** - Uniforme emoji button stijl overal
  - ⭐ voor favoriet/default (hover effect)
  - ✏️ voor bewerken (hover scale-110 transition)
  - 🗑️ voor verwijderen (hover scale-110 transition)
- ✅ **Tooltips** - Alle buttons hebben title attributes
- ✅ **Responsive** - Optimaal op desktop en mobile
- ✅ **Tab Navigatie** - Makkelijk schakelen tussen Producten/Templates/Import-Export
- ✅ **Action Buttons** - "Nieuw product", "Nieuwe template", etc. prominent aanwezig

#### **Technical Implementation** 🔧
- ✅ **3 Modal Components** - ProductEditModal, PortionEditModal, TemplateEditModal
- ✅ **Reusable Components** - ProductsPortionsTab, TemplatesTab, ImportExportTab
- ✅ **Full CRUD** - Alle create/read/update/delete operaties geïmplementeerd
- ✅ **Hook Integration** - Gebruikt bestaande useProducts, usePortions, useTemplates hooks
- ✅ **Type Safety** - Volledig TypeScript typed
- ✅ **Cloud Sync Compatible** - Alle wijzigingen worden gesynchroniseerd

---

## ✨ v1.3.0 - Porties & Templates

### **Portie Templates** 🍽️

#### **Voorgedefinieerde Porties**
- ✅ **Default Portions Database** - 50+ voorgedefinieerde porties voor veelgebruikte producten
- ✅ **Meerdere Eenheden** - Grammen, ml, stuks, eetlepels (el), theelepels (tl)
- ✅ **Automatische Conversie** - 1 el = 15g, 1 tl = 5g, aanpasbaar per product
- ✅ **Product-Specifiek** - Bijv. "1 snee brood = 35g", "1 kop melk = 250ml"
- ✅ **User-Definable** - Voeg eigen porties toe, bewerk defaults

#### **Portie Selector in AddMealModal**
- ✅ **Dropdown per Product** - Kies portie of handmatige input
- ✅ **Quick-Fill** - Selecteer portie → grammen auto-ingevuld
- ✅ **Inline Add** - Nieuwe portie toevoegen zonder modal te sluiten
- ✅ **Persistent** - Porties worden gesynchroniseerd via cloud sync

**Voorbeelden:**
- Brood: "1 snee (35g)", "2 sneetjes (70g)"
- Melk: "1 kop (250ml)", "1 glas (200ml)"
- Whey: "1 scoop (30g)", "2 scoops (60g)"
- Eieren: "1 ei (60g)", "2 eieren (120g)"

---

### **Meal Templates** ⭐

#### **Template Systeem**
- ✅ **Opslaan als Template** - Sla veelgebruikte maaltijden op
- ✅ **6 Categorieën** - Ontbijt, Lunch, Diner, Snack, Shake, Anders
- ✅ **Nutritional Preview** - Totale calorieën en eiwit preview
- ✅ **Favorites** - Pin templates voor quick access
- ✅ **Recent Gebruikt** - Top 5 meest recente templates
- ✅ **Usage Tracking** - Populariteit tracking per template

#### **Templates Tab in AddMealModal**
- ✅ **3 Secties** - Recent gebruikt, Favorieten, Alle templates
- ✅ **Quick Load** - Klik template → producten auto-geladen
- ✅ **Edit & Delete** - Beheer templates inline
- ✅ **Search** - Zoek templates op naam
- ✅ **Cloud Sync** - Templates gesynchroniseerd tussen devices

**Use Cases:**
- "Ontbijt standaard" → Brood (70g) + Pindakaas (15g) + Banaan (120g)
- "Post-workout shake" → Whey (30g) + Melk (300ml) + Banaan (120g)
- "Lunch salade" → Kipfilet (150g) + Sla (100g) + Dressing (20ml)

---

### **Quick Add** ⚡

#### **Snelle Toegang tot Templates**
- ✅ **Quick Add Sectie** - Horizontaal scrollbare lijst met 5 meest recente templates
- ✅ **Directe Toegang** - Klik template → AddMealModal opent met vooringevulde producten
- ✅ **Aanpasbaar** - Hoeveelheden blijven volledig aanpasbaar voor flexibiliteit
- ✅ **Smart Positioning** - Tussen metrics en "Maaltijd toevoegen" knop op JournalPage

**Workflow:**
1. Klik template in Quick Add sectie
2. AddMealModal opent met products automatisch geladen
3. Pas hoeveelheden aan indien nodig
4. Voeg toe met 2 clicks!

---

### **Portions Management in ProductsModal** 🔧

#### **Beheer Porties per Product**
- ✅ **Porties Sectie** - Zichtbaar bij product bewerken
- ✅ **Lijst View** - Alle porties met naam, grammen, default badge
- ✅ **Set Default** - ⭐ knop om default portie in te stellen
- ✅ **Delete** - 🗑️ knop om portie te verwijderen
- ✅ **Inline Add** - "+ Nieuwe portie" opent modal met full form
- ✅ **Scroll Support** - Max-height met scroll voor veel porties

**Locatie:** Producten tab → Bewerk product → Scroll naar "Porties (optioneel)"

---

### **UX Improvements** 🎨

#### **Desktop Layout Optimizations**
- ✅ **Compacte Product Entries** - Naam, portie selector en gram input op 1 regel (desktop)
- ✅ **Meer Ruimte** - Selected products max-height 300px op desktop (was 200px)
- ✅ **Button Grootte** - "Maaltijd toevoegen" knop smaller op desktop (w-full sm:w-auto)
- ✅ **Brand Display** - Product brand in parentheses: "Rundertartaar (Albert Heijn)"

#### **Navigation & Layout**
- ✅ **Tab Naam** - "📅 Maaltijden" (was "Vandaag") - accurater bij andere datums
- ✅ **Metrics Grid** - 2x4 grid ook op mobiel voor betere space utilization
- ✅ **Scroll Fixes** - Productenlijst en alle secties correct scrollbaar
- ✅ **Dropdown Reset** - Portie dropdown reset naar "Handmatig" na toevoegen

#### **Template Features**
- ✅ **Save When Editing** - "Opslaan als template" ook bij maaltijd bewerken (niet alleen nieuw)
- ✅ **Controlled Dropdown** - Portion selector blijft niet hangen op "+Nieuwe portie"

---

### **Technical Implementation** 🔧
- ✅ **Database v7** - Nieuwe tables: productPortions, mealTemplates
- ✅ **Services** - portions.service.ts, templates.service.ts
- ✅ **Hooks** - usePortions, useTemplates met auto-sync
- ✅ **Cloud Sync v1.3** - Portions & templates in backup data
- ✅ **Soft Delete** - Deletion propagation via sync
- ✅ **Smart Merge** - Timestamp-based conflict resolution
- ✅ **Default Portions** - 50+ voorgedefinieerde porties voor veelgebruikte producten
- ✅ **Package Rename** - Package naam: bitebudget (was voedseljournaal-app)

---

## ✨ v1.2.1 - Cloud Sync Fixes + Mobile UX

### **Cloud Sync Fixes** ☁️🔧

#### **Complete Auto-Sync Coverage**
- ✅ **Products Auto-Sync** - Products now trigger auto-sync on add/update/delete/toggle favorite
- ✅ **Settings Auto-Sync** - Settings now trigger auto-sync on update/save/reset
- ✅ **Fixed Merge Strategy** - Products now sync all updates (not just deletions)
- ✅ **Consistent Behavior** - All data types (entries, weights, products, settings) sync with 30s debounce

#### **Automatic Sync on Login & Reconnect** 🔄
- ✅ **Sync After Login** - Automatically pulls and syncs data after Google Drive login (when auto-sync enabled)
- ✅ **Sync on Reconnect** - Automatically syncs local changes when cloud becomes available again
- ✅ **Prevents Data Loss** - Local items added while offline are now automatically uploaded when connection restores
- ✅ **Smart Detection** - Only triggers when auto-sync is enabled and password is stored
- ✅ **Bidirectional Merge** - Pulls cloud changes first, then uploads local changes

**Impact:** Cloud sync nu 100% compleet - alle wijzigingen worden automatisch gesynchroniseerd tussen devices, zelfs na offline periodes!

### **Mobile UX Improvements** 📱✨

#### **Tab Navigation on Journal Page**
- ✅ **Dual Tabs** - "📅 Vandaag" and "📦 Producten"
- ✅ **Inline Product Management** - No separate modal, direct access via tab
- ✅ **Cleaner Navigation** - Removed redundant "Producten beheren" button

#### **AddMealModal Enhancements**
- ✅ **Sticky Action Button** - Always visible at bottom (no scrolling to submit!)
- ✅ **Compact Product Badges** - Inline chips with gram inputs instead of large boxes
- ✅ **More Space for Products List** - Removed max-height restriction for better scrolling
- ✅ **Placeholders > Default Values** - Easier to input small values (no backspace issues)
- ✅ **Auto-Select on Focus** - Text automatically selected for faster editing
- ✅ **Optimized Input Width** - Gram inputs sized to fit 3 digits without overlap

#### **ProductsModal Improvements**
- ✅ **Inline Mode Support** - Can render as tab content or modal
- ✅ **Placeholders in All Fields** - No more default value issues
- ✅ **Icon-Only Buttons** - Cleaner edit/delete buttons without backgrounds
- ✅ **Hover Animations** - Scale effect for better touch feedback

**Impact:**
- 🚀 Much less scrolling on mobile when adding meals with many products
- 🚀 Faster product management (no modal switching)
- 🚀 Easier to input values < 100 (no default value conflicts)
- 🚀 Cleaner, more organized navigation

---

## ✨ v1.1.0 - Cloud Sync + Enhancements

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

## 📋 Changelog

### **v1.5.0 - Templates, Integrations & Smart Sync** (2025-01-09)

#### **Meal Templates & Favorites** ⭐
- ✅ **Template System** - Save frequently used meals as reusable templates
- ✅ **Quick Add** - One-click meal logging from templates
- ✅ **Favorites** - Mark templates as favorites for quick access
- ✅ **Recent Templates** - Auto-track last 5 used templates
- ✅ **Category Support** - Organize templates by meal type (breakfast, lunch, etc.)
- ✅ **Usage Tracking** - Automatic tracking of template usage with timestamps
- ✅ **Template Management** - Full CRUD operations in Data page Templates tab

#### **Garmin Connect Integration** 📊
- ✅ **CSV Import** - Import daily activities from Garmin Connect CSV exports
- ✅ **Activity Tracking** - Track steps, distance, calories, and active minutes
- ✅ **Data Validation** - Smart parsing with error handling
- ✅ **Duplicate Detection** - Prevents importing same data twice
- ✅ **Export Support** - Activities included in data export/import

#### **Analyze Page Improvements** 📈
- ✅ **Heatmap Calendar** - Visual nutrition tracking with color-coded goals
  - Added carbohydrates, sugars, and fat metrics to dropdown
  - 0g values show as gray (no data) instead of green
  - Dynamic protein calculation based on current weight (0.83g/kg)
  - Fiber threshold adjusted to 28g (more realistic than 35g)
  - Overall score: 75% threshold (6/8 goals = green)
- ✅ **Smart Scoring** - Protein zones: <80% red, 80-120% yellow, >120% green
- ✅ **Tooltips** - Show actual metric values on hover
- ✅ **Weight Integration** - Uses most recent weight from tracking

#### **Smart Token Management** 🔐
- ✅ **Proactive Warnings** - Modal appears 10 minutes before token expiry
- ✅ **Auto-Refresh on Return** - Automatically refreshes token when returning to app
- ✅ **Visibility-Aware** - Only shows warnings when app is actively used
- ✅ **Page Visibility API** - Detects when user returns after idle period
- ✅ **No Interruptions** - Handles multi-hour idle sessions gracefully
- ✅ **Manual Refresh** - User-initiated refresh via modal button

#### **Sync Service Fixes** 🔄
- ✅ **Duplicate Barcode Fix** - Products now merged by name AND EAN
- ✅ **Entry Conflict Resolution** - ID-based lookup prevents duplicate entries
- ✅ **Time Edit Support** - Changing entry time after sync no longer creates duplicates
- ✅ **Graceful Error Handling** - Try-catch for failed additions during merge

#### **Code Cleanup** 🧹
- ✅ **Removed Unused Files** - Deleted AnalysePage.tsx and ProductsModal.tsx
- ✅ **Import Analysis** - Verified removal via grep-based dependency check

#### **Documentation** 📝
- ✅ **Future Optimizations** - Added section on gzip compression and data archiving
- ✅ **Data Projections** - Documented 10-year growth estimates (13 MB uncompressed)

---

## 🎨 v1.4.0 - Data Management Complete (2025-01-06)

### **New Features**

#### **Soft Delete Implementation** 🗑️
- ✅ **Deletion Propagation** - Deleted items now sync properly between devices
- ✅ **Soft Delete Pattern** - Records marked as deleted instead of permanent removal
- ✅ **Bidirectional Sync** - Deletions propagate from local to cloud and vice versa
- ✅ **Data Integrity** - No more duplicate items after deletion
- ✅ **Timestamp Tracking** - `deleted_at` field for deletion history

#### **PDF Export Enhancements** 📄

**Consolidated PDF Generator**
- ✅ **Unified System** - Merged two separate generators into one
- ✅ **No Duplication** - Eliminated code inconsistencies
- ✅ **All 8 Metrics** - Complete nutrition tracking in all exports

**Visual Improvements**
- ✅ **6 Metric Cards** - Optimized single-row layout
  - Calories, Protein, Sugars, Saturated Fat, Fiber, Sodium
  - 28mm width, size 14 font for readability
  - Perfect margin alignment
- ✅ **2x2 Graph Grid** - Replaced single graph with 4 paired graphs
  - Koolhydraten & Suikers (g)
  - Vet & Verzadigd vet (g)
  - Vezels & Eiwit (g)
  - Calorieën & Natrium (kcal/mg)
  - Absolute Y-axis values (auto-scaled)
  - 85mm width per graph, perfectly aligned
- ✅ **Week Overview Table** - Daily totals for all metrics
- ✅ **Meals Appendix** - Separate page with complete meal details (10 columns)
- ✅ **Proper Spacing** - 10mm gap between elements

**Monthly Reports**
- ✅ **Month Selector** - Last 18 months with checkboxes
- ✅ **Multi-Month PDFs** - Generate reports spanning multiple months
- ✅ **Automatic Format** - Detects standard vs monthly report format
- ✅ **28 Days Default** - Changed from 30 to 28 days (4 complete weeks)

#### **CSV Export** 📊
- ✅ **Excel-Compatible** - UTF-8 BOM, CRLF line endings
- ✅ **Flat Structure** - One row per meal
- ✅ **All 8 Metrics** - Complete nutrition data in columns
- ✅ **Header Row** - Date, Weekday, Time, Meal Name, + all metrics

#### **Period Selector Component** 🎯
- ✅ **Dual Mode** - Dashboard mode (viewing) vs Export mode
- ✅ **Dashboard Options** - 7/14/28/90 days, All, Custom date range
- ✅ **Export Options** - 7/14/28 days, Custom months with checkbox selection
- ✅ **Reusable** - Shared component across Dashboard, Analyse, and Data pages

#### **Dashboard Improvements** 📈
- ✅ **Dual Period Selectors**
  - Viewing selector (controls charts/cards)
  - Export selector (independent for exports)
- ✅ **Export Section** - Dedicated card at bottom with PDF/CSV/TXT buttons
- ✅ **Fixed Weight Projection** - Corrected sign (deficit = loss, surplus = gain)
- ✅ **Flexible Workflow** - View 90 days, export 14 days

#### **Bug Fixes** 🐛
- ✅ **Backward Compatibility** - Added `|| 0` fallbacks for undefined metrics
- ✅ **NaN Errors Fixed** - Coordinate validation before jsPDF calls
- ✅ **Single-Day Graphs** - Handles single-day data without crashing
- ✅ **CSV/TXT Export** - Fixed undefined property errors

#### **Technical Improvements**
- ✅ **Extended Database Schema** - Added `deleted` and `deleted_at` fields
- ✅ **Smart Merge Enhancement** - Sync handles deletion conflicts
- ✅ **UI Filtering** - Deleted items automatically hidden
- ✅ **Conflict Resolution** - Newest timestamp wins
- ✅ **Automatic Cleanup** - Old deleted items (>14 days) permanently removed

### **Future Considerations**
- [ ] Photo attachments voor meals
- [ ] Recipe builder (meerdere producten → opslaan als nieuw product)
- [ ] Light/Dark theme toggle
- [ ] Internationalization (i18n - Engels)
- [ ] Device API integration (Garmin, Sacoma scale imports)
- [x] Meal templates en favorites *(completed in v1.5.0)*

### **Future Performance Optimizations (v2.x)**

As data grows over time, these optimizations will maintain performance and manageability:

**Current Metrics (7 weeks of data):**
- Encrypted sync file: 178 KB
- Daily growth rate: ~3.6 KB/day
- 10-year projection: ~13 MB uncompressed

**Planned Optimizations:**
- [ ] **gzip Compression** - Compress sync data before upload/download
  - Expected reduction: 60-80% file size
  - Impact: 13 MB → 3-5 MB for 10 years of data
  - Implementation: Web Compression Streams API

- [ ] **Data Archiving** - Archive data older than 1 year
  - Keep locally in IndexedDB (read-only access)
  - Exclude from cloud sync to reduce file size
  - On-demand loading for historical analysis

- [ ] **Incremental Sync** - Only sync changed data (delta updates)
  - Reduces bandwidth and sync time
  - Faster conflict resolution

---

## 📁 Project Structuur

```
src/
├── components/
│   ├── journal/
│   │   ├── JournalPage.tsx           ✅ Daily meal tracking + tab navigation
│   │   ├── AddMealModal.tsx          ✅ Add meals (sticky footer, compact badges)
│   │   ├── ProductsModal.tsx         ✅ Product CRUD (modal + inline mode)
│   │   ├── BarcodeScanner.tsx        ✅ Camera barcode scanning
│   │   └── OpenFoodFactsSearch.tsx   ✅ Product search
│   ├── tracking/
│   │   └── TrackingPage.tsx          ✅ Weight tracking + charts
│   ├── dashboard/
│   │   └── DashboardPage.tsx         ✅ 8 metrics + dual selectors
│   ├── analyse/
│   │   └── AnalysePage.tsx           ✅ Week comparison + heatmap
│   ├── data/
│   │   ├── DataPage.tsx              ✅ Tab container (3 tabs)
│   │   ├── ProductsPortionsTab.tsx   ✅ Products & portions CRUD
│   │   ├── TemplatesTab.tsx          ✅ Templates CRUD
│   │   ├── ImportExportTab.tsx       ✅ Import/Export + Reports
│   │   ├── ProductEditModal.tsx      ✅ Product add/edit modal
│   │   ├── PortionEditModal.tsx      ✅ Portion add/edit modal
│   │   └── TemplateEditModal.tsx     ✅ Template add/edit modal
│   ├── settings/
│   │   ├── SettingsPage.tsx          ✅ User preferences
│   │   └── CloudSyncSettings.tsx     ✅ Google Drive sync
│   ├── shared/
│   │   └── PeriodSelector.tsx        ✅ Dual-mode period selector
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
│   ├── useProducts.ts                ✅ Products with auto-sync (v1.2.1+)
│   ├── usePortions.ts                ✅ Portions with auto-sync (v1.3+)
│   ├── useTemplates.ts               ✅ Templates with auto-sync (v1.3+)
│   ├── useSettings.ts                ✅ Settings with auto-sync (v1.2.1+)
│   └── useWeights.ts                 ✅ Weights with auto-sync
├── utils/
│   ├── date.utils.ts                 ✅ Date helpers (UTC-safe)
│   ├── download.utils.ts             ✅ File download
│   ├── calculations.ts               ✅ Nutrition calculations
│   ├── export.utils.ts               ✅ CSV/TXT generation
│   └── report.utils.ts               ✅ PDF generation (unified)
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
  deleted?: boolean;         // v1.2+ Soft delete flag
  deleted_at?: string;       // v1.2+ Deletion timestamp
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
  deleted?: boolean;              // v1.2+ Soft delete flag
  deleted_at?: string;            // v1.2+ Deletion timestamp
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
  deleted?: boolean;         // v1.2+ Soft delete flag
  deleted_at?: string;       // v1.2+ Deletion timestamp
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

### Cloud Sync Data Format (v1.2.0)
```typescript
interface SyncData {
  version: '1.2';            // Bumped for soft delete support
  timestamp: string;
  entries: Entry[];          // Includes deleted items with deleted flag
  products: Product[];       // Includes deleted items with deleted flag
  weights: Weight[];         // Includes deleted items with deleted flag (v1.1+)
  settings: UserSettings;    // v1.1+
}
```

**Encryption:** AES-GCM 256-bit
**Key Derivation:** PBKDF2 (100,000 iterations)
**Storage:** Google Drive (restricted scope: drive.file)

**Note:** Soft deleted items (v1.2+) are included in sync data to propagate deletions across devices. UI filters them out automatically.

---

## ☁️ Cloud Sync Architecture

### Sync Flow

**Auto-Sync (Bidirectional Merge):**
1. User makes change → 30s debounce timer starts
2. Timer expires → Pull latest from cloud
3. Merge cloud changes with local (newest wins)
4. Upload merged data
5. Periodic pull every 5 minutes (when online)

**Login/Reconnect Sync (v1.2.1+):**
1. User logs in to Google Drive
2. If auto-sync is enabled and password is stored:
   - Pull newer data from cloud (pullIfNewer)
   - Merge cloud changes with local data
   - Upload local changes to cloud (syncToCloud)
3. Same logic triggers when cloud becomes available after offline period
4. Prevents data loss from offline changes

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

**Entries:** Composite key (date + time + name), newest `updated_at` wins (including deletions - v1.2+)
**Products:** By name, newest `updated_at` wins for all changes including updates and deletions (v1.2.1+)
**Weights:** By date, newest `created_at` or `deleted_at` wins (including deletions - v1.2+)
**Settings:** Cloud always wins (no timestamps yet)

**Deletion Propagation (v1.2+):**
- Deleted items remain in database with `deleted: true` flag
- Deletions sync across devices using timestamp comparison
- UI automatically filters out deleted items
- Newest timestamp wins for delete vs update conflicts
- Old deleted items (>14 days) are permanently removed during sync to keep database clean

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

### Fixed in v1.2.1
- ✅ Products not syncing automatically - now triggers auto-sync
- ✅ Settings not syncing automatically - now triggers auto-sync
- ✅ Products merge only syncing deletions - now syncs all updates
- ✅ Desync after offline periods - automatic sync on login and reconnect
- ✅ Local changes lost when cloud unavailable - now syncs when connection restores
- ✅ Mobile scrolling issues when adding meals with many products
- ✅ Input fields too small for 3-digit values
- ✅ Default values making it hard to input small numbers

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

### v1.4.0 (January 2025) - Current
**Data Management Page - Complete Controle over je Data**
- ✅ Nieuwe Data page met 3 tabs (Producten & Porties, Templates, Import/Export)
- ✅ ProductEditModal - Volledig formulier voor product CRUD
- ✅ PortionEditModal - Eenvoudig porties toevoegen/bewerken
- ✅ TemplateEditModal - Dynamische template editor met product/portie selectie
- ✅ Inline portie weergave per product
- ✅ Template edit met auto-selectie van default porties
- ✅ Uniforme emoji button stijl (⭐✏️🗑️) overal
- ✅ Search & filter per tab
- ✅ Delete confirmaties
- ✅ Tooltips op alle buttons
- ✅ Settings page gefocust op Cloud Sync en App configuratie

### v1.3.0 (January 2025)
**Porties & Templates - Snellere Maaltijd Tracking**
- ✅ Portie templates with default portions database (50+ products)
- ✅ Multiple unit support (g, ml, stuks, el, tl)
- ✅ Portion selector dropdown in AddMealModal
- ✅ Meal templates system with categories
- ✅ Templates tab with recent/favorites/all sections
- ✅ Quick load templates to products tab
- ✅ Cloud sync v1.3 with portions and templates
- ✅ Database v7 with productPortions and mealTemplates tables
- ✅ Auto-sync for portions and templates
- ✅ Soft delete propagation for portions and templates

### v1.2.1 (January 2025)
**Cloud Sync Fixes & Mobile UX Improvements**
- ✅ Products auto-sync on all operations (add/update/delete/favorite)
- ✅ Settings auto-sync on all operations (update/save/reset)
- ✅ Fixed products merge strategy (now syncs all updates, not just deletions)
- ✅ Automatic sync after Google Drive login (when auto-sync enabled)
- ✅ Automatic sync on cloud reconnect in loadCloudInfo
- ✅ Local changes made while offline now sync when connection restores
- ✅ Bidirectional merge on login/reconnect (pull then push)
- ✅ Tab navigation on Journal Page (Vandaag / Producten)
- ✅ Inline product management (no separate modal)
- ✅ AddMealModal sticky action button (always visible)
- ✅ Compact product badges with inline gram inputs
- ✅ Removed height restriction on products list
- ✅ Placeholders instead of default values (easier small value input)
- ✅ Auto-select text on focus for faster editing
- ✅ Optimized input width for 3-digit values
- ✅ Icon-only edit/delete buttons with hover animations

### v1.2.0 (November 2024)
**Advanced PDF Reporting & Dashboard Improvements**
- ✅ Soft delete with deletion propagation across devices
- ✅ Consolidated PDF generator (merged 2 into 1)
- ✅ 2x2 graph grid with absolute Y-axis values
- ✅ 6 metric cards in optimized single-row layout
- ✅ Week overview table in PDF reports
- ✅ Monthly reports with multi-month selection
- ✅ CSV export with all 8 metrics
- ✅ Dual period selectors (viewing vs exporting)
- ✅ Dashboard export section
- ✅ Fixed weight projection sign
- ✅ Backward compatibility for undefined metrics
- ✅ NaN errors fixed in graph rendering

### v1.1.0 (November 2024)
**Cloud Sync + Enhancements**
- ✅ End-to-end encrypted Google Drive sync
- ✅ Automatic bidirectional merge
- ✅ Persistent auto-sync state
- ✅ Safe merge for all sync operations (no data loss)
- ✅ Token expiry warning with one-click re-login
- ✅ Runtime token expiry detection
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

**Last Updated:** January 9, 2025
**Status:** v1.5.0 - Templates, Integrations & Smart Sync
**Next:** Photo attachments & Recipe builder
