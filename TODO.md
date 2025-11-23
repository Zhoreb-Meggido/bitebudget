# TODO - BiteBudget Improvements

## Medium Effort (1-3 uur)

### 1. Performance Optimalisatie - Memoization ✅
**Probleem:** Veel components re-renderen onnodig vaak.

**Taken:**
- [x] Audit components met React DevTools Profiler
- [x] Voeg `useMemo` toe voor filtered/sorted lijsten
- [x] Voeg `useCallback` toe voor event handlers in list items
- [ ] Overweeg `React.memo` voor pure components (optioneel)
- [ ] Test performance verbetering met Chrome DevTools (optioneel)

**Geïmplementeerd:**
- HeartRateChart: useMemo voor linePath, areaPath, yLabels, xLabels, zoneStats (680 samples)
- SleepStagesChart: useMemo voor sleepHours, timelineBars
- TrackingPage: useMemo voor last90Days, chartData, chartOptions
- CloudSyncSettings: useCallback voor alle 8 event handlers

**Bonus fix:** Auto-sync triggert nu ook bij app startup (niet alleen elke 5 min)

**Prioriteit:** Medium (merken vooral bij grote datasets)

**Effort:** ~2-3 uur ✅ Voltooid

---

### 2. Chart.js Configuratie Duplicatie
**Probleem:** ~650 lines code duplicatie in verschillende chart configuraties.

**Oplossing:**
- [ ] Extract common chart options naar shared config object
- [ ] Create reusable chart option builders
- [ ] Consolideer color schemes en styling
- [ ] Reduce duplicatie in plugin configuraties

**Voordeel:**
- Minder code om te maintainen
- Consistente styling across charts
- Makkelijker om chart settings aan te passen

**Effort:** ~2-3 uur

---

### 3. Internationalization (i18n) - Multi-language Support
**Feature:** Support voor meerdere talen (Engels/Nederlands) met react-i18next.

**Implementatie:**
- [ ] Install dependencies: `npm install react-i18next i18next`
- [ ] Setup i18n configuration met EN/NL resources
- [ ] Create folder structure:
  ```
  src/i18n/
    index.ts
    locales/
      en/common.json, journal.json, data.json, analyse.json, settings.json
      nl/common.json, journal.json, data.json, analyse.json, settings.json
  ```
- [ ] Create useTranslation wrapper hook
- [ ] Add language switcher in Settings page
- [ ] Extract strings geleidelijk per pagina:
  - [ ] Common strings (navigation, buttons, errors)
  - [ ] Journal page
  - [ ] Data page (products, templates, import/export)
  - [ ] Analyse page (all tabs)
  - [ ] Dashboard
  - [ ] Tracking
  - [ ] Settings

**Features:**
- Browser language detection (default: NL, fallback: EN)
- localStorage persistence voor taal keuze
- TypeScript support voor translation keys
- Interpolation voor dynamic values (bijv. "{{count}} calorieën")
- Pluralization support

**Voordeel:**
- App wordt toegankelijk voor internationale gebruikers
- Professioneler
- Makkelijk om later meer talen toe te voegen

**Effort:** ~4-6 uur (setup + geleidelijk strings extracten)

---

## Larger Features (4+ uur)

### 4. Health Connect Auto-Sync (Automated Daily Import) 🔵 Low Priority
**Feature:** Automatische dagelijkse sync van Health Connect backups vanaf Google Drive.

**Huidige implementatie:**
- ✅ health-connect-backup.service.ts (File System Access API)
- ✅ selectBackupFile() - Directe bestandsselectie
- ✅ selectBackupFromDirectory() - Map selecteren en zoeken
- ✅ extractDatabase() - ZIP uitpakken
- ✅ health-connect-import.service.ts - Parsing en import
- ✅ HealthConnectImportSection.tsx - UI met Windows mapped drive support

**Nog te implementeren:**
- [ ] Google Drive folder opslaan (persistent via IndexedDB)
- [ ] Lokale download folder selecteren en opslaan
- [ ] Auto-sync service met smart scheduling:
  - Trigger: Laatste sync was gisteren + huidige tijd na 18:00
  - Check bij app start/activation
  - Opslaan lastSyncDate in localStorage
- [ ] Automatisch proces:
  1. Check voor nieuwe backup in Google Drive folder
  2. Download naar lokale folder
  3. Parse en importeer Health Connect data
  4. Verwijder backup van Google Drive (cleanup)
  5. Update lastSyncDate
- [ ] Progress indicator tijdens auto-sync
- [ ] Toast notifications (succes/errors)
- [ ] Settings UI voor auto-sync configuratie:
  - Enable/disable auto-sync
  - Google Drive folder selecteren
  - Download folder selecteren
  - Laatste sync status tonen

**Edge cases:**
- App niet geopend vandaag → sync morgen na 18:00
- Meerdere keren openen na 18:00 → alleen eerste keer syncen
- Geen nieuwe backup → skip, log warning
- Permissions verlopen → hernieuw via UI

**Waarom 18:00?** Health Connect backup is dan gegarandeerd binnen (meestal begin van de middag beschikbaar).

**Implementatie files:**
- Nieuwe service: `health-connect-auto-sync.service.ts`
- Uitbreiden: `HealthConnectImportSection.tsx` (settings UI)
- IndexedDB schema voor persistent folder handles

**Effort:** ~6-8 uur

---

### 5. Body Battery Visualisatie Verbeteringen 🔵 Low Priority
**Feature:** Betere weergave van Garmin Body Battery data in trends.

**Note:** Health Connect bevat geen Body Battery data (Garmin proprietary).

**Mogelijke verbeteringen:**
- [ ] Historische trends over langere periode
- [ ] Correlatie met activiteiten en slaap
- [ ] Inzicht in recovery patterns
- [ ] Vergelijk verschillende tijdsperiodes

**Effort:** ~4-6 uur

---

### 6. Recipe Manager met Template Generator
**Feature:** Recepten beheren met ingrediënten, bereidingsstappen en automatische meal template generatie.

**Database Schema:**
```typescript
interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings: number; // Aantal porties
  prepTime?: number; // Bereidingstijd in minuten
  cookTime?: number; // Kooktijd in minuten
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags?: string[]; // bijv. "vegetarisch", "lunch", "snack"
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

interface RecipeIngredient {
  productId: string; // Link naar bestaand product
  portionId?: string; // Optioneel: specifieke portie
  amount: number; // Hoeveelheid (in gram of stuks)
  unit: 'gram' | 'piece'; // Eenheid
  notes?: string; // bijv. "in blokjes gesneden"
}

interface RecipeStep {
  order: number; // Volgorde
  instruction: string; // Bereidingsstap
  duration?: number; // Optioneel: tijd voor deze stap
}
```

**Features:**
- [ ] **Recipe CRUD**
  - Create/Read/Update/Delete recepten
  - Zoeken en filteren op naam/tags
  - Sorteer op naam, datum, bereidingstijd

- [ ] **Ingredient Management**
  - Selecteer producten uit bestaande database
  - Optioneel: specifieke portie selecteren
  - Hoeveelheid en eenheid (gram/stuks)
  - Notities per ingrediënt

- [ ] **Cooking Steps**
  - Geordende lijst van bereidingsstappen
  - Drag & drop voor volgorde aanpassen
  - Optioneel: tijdsduur per stap

- [ ] **Nutrition Calculator**
  - Automatisch totale nutritie berekenen uit ingrediënten
  - Per portie en totaal recept
  - Toon macros (calories, protein, carbs, fat, etc.)

- [ ] **Template Generator**
  - "Voeg toe als Template" knop op recept
  - Genereert MealTemplate met alle ingrediënten
  - Link tussen Recipe en Template bewaren
  - Update template wanneer recept wijzigt (optioneel)

- [ ] **Quick Add to Journal**
  - "Voeg toe aan Journaal" knop
  - Selecteer aantal porties (1x, 0.5x, 2x recept)
  - Voegt alle ingrediënten toe als maaltijd
  - Optioneel: sla op als nieuwe template

- [ ] **Recipe View/Print**
  - Leesbare weergave voor tijdens koken
  - Print-friendly layout
  - Afvink-lijst voor ingrediënten en stappen

**UI/UX:**
- Nieuwe tab in Data pagina: "📖 Recepten" (naast Products, Templates, Import/Export)
- Recipe card grid met foto placeholder, naam, porties, tijd
- Detail modal met tabs: Info | Ingrediënten | Bereiding | Nutritie
- Edit mode met drag & drop voor stappen

**Cloud Sync:**
- Volledige sync support voor recipes
- Soft delete met 14-day retention
- Merge conflict handling (newest wins)

**Voordelen:**
- Makkelijk bijhouden van favoriete recepten
- Accurate nutritie tracking voor zelfgemaakte gerechten
- Herbruikbare templates voor veelgebruikte recepten
- Overzicht van ingrediënten tijdens koken

**Effort:** ~8-12 uur
- Database schema & migrations: ~1 uur
- Recipe CRUD service & hook: ~2 uur
- Recipe list & detail UI: ~3 uur
- Ingredient/step management UI: ~2 uur
- Template generator: ~1 uur
- Nutrition calculator: ~1 uur
- Cloud sync integration: ~2 uur

---

### 7. Lokale Barcode Database voor Custom Products
**Feature:** Eigen barcode registratie voor producten die niet in OpenFoodFacts staan.

**Probleem:**
- Niet alle producten (vooral lokale/regionale) staan in OpenFoodFacts
- Gebruiker moet producten handmatig invoeren na elke scan
- Geen hergebruik van eerder ingevoerde product data bij opnieuw scannen

**Database Schema:**
```typescript
interface BarcodeMapping {
  id: string;
  barcode: string; // EAN-13 of andere barcode
  productId: string; // Link naar bestaand Product
  source: 'manual' | 'openfoodfacts'; // Bron van de mapping
  verified: boolean; // User verified deze mapping
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}
```

**Features:**
- [ ] **Barcode Mapping Table**
  - Store barcode → product mappings lokaal in IndexedDB
  - Link barcodes aan bestaande producten in database
  - Track bron (manual vs OpenFoodFacts)

- [ ] **Scan Flow Enhancement**
  1. Scan barcode
  2. Check lokale database eerst
  3. Als gevonden: toon product direct
  4. Als niet gevonden: probeer OpenFoodFacts
  5. Als ook niet in OFF: toon "Product toevoegen" dialog
  6. Sla barcode mapping op na product aanmaken

- [ ] **Barcode Management UI**
  - Toon gekoppelde barcodes bij product detail
  - "Barcode toevoegen" knop op product edit screen
  - Manual barcode entry (voor producten zonder scanner)
  - "Barcode scannen" knop in product edit
  - Verwijder/edit barcode mappings
  - Toon bron indicator (🏠 lokaal | 🌍 OpenFoodFacts)

- [ ] **Product Creation from Scan**
  - Direct "Nieuw product" dialog na scan (als niet gevonden)
  - Barcode pre-filled in form
  - Auto-save barcode mapping na product create
  - Optie: "Probeer OpenFoodFacts opnieuw" knop

- [ ] **Barcode Lookup Table**
  - Overzicht van alle barcode mappings
  - Filter op bron (manual/OFF)
  - Zoek op barcode of product naam
  - Bulk import van barcode CSV (optioneel)

- [ ] **Cloud Sync**
  - Sync barcode mappings tussen apparaten
  - Merge conflicts (oudste mapping wint)
  - Soft delete met 14-day retention
  - Privacy: alleen eigen barcodes, niet publiek delen

**Edge Cases:**
- Barcode al gekoppeld aan ander product → waarschuwing, toestaan overschrijven
- Product verwijderd maar barcode bestaat → cleanup orphaned mappings
- OpenFoodFacts product later beschikbaar → suggestie om te upgraden
- Meerdere producten met zelfde barcode (variant) → keuze menu

**Voordelen:**
- Sneller producten toevoegen (scan → direct gevonden)
- Herbruikbaarheid van product data
- Minder handmatig typen
- Werkt offline (lokale database)
- Ideaal voor vaak gebruikte lokale producten

**Effort:** ~4-6 uur
- Database schema & migration: ~30 min
- Barcode mapping service & hook: ~1 uur
- Enhanced scan flow: ~1.5 uur
- Product edit UI (barcode section): ~1 uur
- Barcode lookup table: ~1 uur
- Cloud sync integration: ~1 uur

---

### 8. Meal Timing & Intermittent Fasting Support
**Feature:** Maaltijd categorieën en intermittent fasting window tracking.

**Database Schema:**
```typescript
// Extend JournalEntry
interface JournalEntry {
  // ... existing fields
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'; // Optioneel categoriseren
}

// Add to UserSettings
interface UserSettings {
  // ... existing fields
  intermittentFasting: boolean; // IF enabled/disabled
  ifWindowStart: string; // "12:00" (HH:mm format)
  ifWindowEnd: string; // "20:00" (HH:mm format)
}
```

**Features:**
- [ ] **Settings Toggle voor IF**
  - Enable/disable intermittent fasting
  - Set eating window start/end time (time pickers)
  - Visual representation van window (bijv. "12:00 - 20:00")

- [ ] **Meal Type Classification** (optioneel)
  - Dropdown bij maaltijd toevoegen: Ontbijt | Lunch | Diner | Snack
  - Default: geen categorisering (flexibel gebruik zoals nu)
  - Filter journaal op meal type

- [ ] **IF Window Indicator**
  - Visual indicator op journaal tijdlijn
  - Groene zone = binnen window
  - Rode zone = buiten window
  - Niet-strict: alleen informatief, geen blocking

- [ ] **IF Statistics**
  - Percentage dagen binnen window
  - Gemiddelde eating window duration
  - First/last meal times trends
  - Dashboard card met IF adherence

- [ ] **Meal Timing Analysis**
  - Heatmap: wanneer eet je meestal? (per uur van de dag)
  - Patterns: welke dagen eet je vroeger/later?
  - Correlatie met sleep/activiteit

**UI/UX:**
- Settings pagina: IF section met toggle en time pickers
- Journaal: optionele meal type badges
- Dashboard: IF adherence card (indien enabled)
- Analyse tab: nieuwe "Timing" chart met eating patterns

**Cloud Sync:**
- IF settings synced als onderdeel van UserSettings
- Meal type synced met journal entries

**Voordelen:**
- Inzicht in eating patterns
- Support voor IF zonder strict enforcement (flexibel)
- Bewustwording van meal timing
- Geen extra complexity als je IF niet gebruikt (opt-in)

**Effort:** ~3-4 uur
- Settings UI (IF toggle + time pickers): ~1 uur
- Meal type dropdown op add meal: ~30 min
- IF window visualization op journaal: ~1 uur
- Dashboard IF card: ~30 min
- Timing analysis chart: ~1 uur

---

### 9. Water Intake Tracking
**Feature:** Dagelijkse water consumptie bijhouden met quick-add interface.

**Database Schema:**
```typescript
interface WaterEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: number; // Exact tijd
  amount: number; // ml
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

// Add to UserSettings
interface UserSettings {
  // ... existing fields
  waterGoalMl: number; // Default: 2000ml
}
```

**Features:**
- [ ] **Quick Add Water**
  - QuickActions: "💧 Water" button
  - Preset buttons: 250ml | 500ml | 750ml | Custom
  - One-tap toevoegen (geen modal nodig)
  - Toast notification: "250ml toegevoegd ✓"

- [ ] **Daily Water Progress**
  - Dashboard card met circular progress
  - Total drunk today vs goal
  - Visual: 🟦🟦🟦⬜⬜ (8 glasses van 250ml)

- [ ] **Water History**
  - Journaal integratie: toon water entries per dag
  - Tracking tab: water heatmap (net als slaap/gewicht)
  - Analyse tab: water trends over tijd

- [ ] **Hydration Insights**
  - Correlatie met activiteit (meer sporten = meer drinken?)
  - Waarschuwing bij lage intake
  - Weather integration? (warm weer → meer drinken reminder)

**UI/UX:**
- QuickActions: 💧 Water knop (naast huidige 4)
- Quick-add modal: grote preset knoppen (makkelijk tijdens sporten)
- Dashboard: circular water progress indicator
- Journal: water entries tussen meals (met 💧 icon)

**Cloud Sync:**
- Full sync support voor water entries
- Soft delete met 14-day retention
- Merge newest wins

**Voordelen:**
- Eenvoudige tracking (cola zero, water, thee zonder calorieën)
- Inzicht in hydration patterns
- Motivation door daily goal
- Lichtgewicht feature (geen nutrition complexity)

**Effort:** ~3-4 uur
- Database schema & service: ~1 uur
- Quick-add UI in QuickActions: ~1 uur
- Dashboard water card: ~1 uur
- Journal integration & history: ~30 min
- Cloud sync: ~30 min

---

### 10. AI Photo Food Analysis (Future / Research)
**Feature:** Foto maken van maaltijd → AI schat nutritie → voeg toe aan journaal.

**Challenges:**
- ⚠️ **Cloud Sync Size:** Foto's zijn groot (500KB - 5MB per meal)
  - Oplossing: Compress images (max 800x800, 80% quality = ~100KB)
  - Optional: Store photos apart van sync (lokaal only, of aparte storage bucket)
  - Optional: Sync thumbnails only, full photos on-demand

- ⚠️ **Free AI API's:** Beperkt beschikbaar
  - OpenAI Vision API: $0.01 per image (niet gratis)
  - Google Cloud Vision: €1.50 per 1000 images (eerst 1000 gratis)
  - Gemini Flash 2.0: Gratis tier beschikbaar (15 RPM)
  - Clarifai Food Recognition: Beperkte gratis tier

**Mogelijk Approach (Future):**
1. Foto maken met camera
2. Compress & store lokaal (IndexedDB)
3. Optional: Send naar Gemini Flash API (gratis tier)
4. AI returns estimated ingredients/portions
5. User review & edit voor accuracy
6. Save naar journaal

**Note:** Dit is complex en kostbaar. Better approach:
- Start met foto's lokaal opslaan (geen AI)
- Foto's als visuele referentie (niet voor analyse)
- Later overwegen: AI integration als budget/API beschikbaar

**Priority:** 🔵 Low / Research fase

**Effort:** ~12-20 uur (full implementation met AI)
- Photo capture & compression: ~2 uur
- Local storage optimization: ~2 uur
- AI API integration (Gemini): ~4 uur
- Result parsing & UI: ~4 uur
- Cloud storage strategy: ~4 uur
- Testing & refinement: ~4 uur

---

### 11. Distance Tracking & Visualisatie 🔵 Low Priority
**Feature:** Betere weergave van afgelegde afstanden.

**Taken:**
- [ ] Distance per activity type (running, cycling, walking)
- [ ] Weekly/monthly totals
- [ ] Distance trends over tijd
- [ ] Goal tracking voor distance

**Effort:** ~4-6 uur

---

## Recent Improvements (v1.13.0) ✅

### Steps Intraday Tracking ✅
**Feature:** Complete steps tracking system with Health Connect import and visualization.

**Implemented:**
- Database v12 with stepsSamples table (date, sampleCount indices)
- DayStepsSamples and StepsSample TypeScript interfaces
- steps-samples.service.ts with full CRUD operations
- useStepsSamples React hook for data management
- Health Connect import: extractAndStoreAllStepsSamples(), extractAndStoreStepsSamplesForDay()
- StepsChart component with bar chart visualization
- Activity tab integration with 👣 heatmap indicator
- Collapsible statistics panel (total steps, active hours, avg per hour, most active hour)
- Cloud sync support with backup schema v1.11
- Soft delete pattern with 75-day retention
- Fixed Health Connect import bug (epochDayToDate → epochDaysToDate typo)

**UX Improvements:**
- HealthConnect preview extended (show HR, Sleep, Steps counts)
- Period selection unified across Balance/Trends/Overzicht tabs
- Exclude "today" from all date ranges (incomplete data)
- Replace toggle buttons with dropdown selectors

**Impact:** Complete intraday steps tracking infrastructure following the same pattern as HR and Sleep data!

**Effort:** ~4-5 uur

---

## Recent Improvements (v1.12.0) ✅

### QuickActions Bottom Sheet & Code Cleanup ✅
**Feature:** Global bottom sheet menu accessible from any page via footer hamburger button.

**Implemented:**
- Android Material Design style bottom sheet
- 4 quick actions: Maaltijd toevoegen, Product toevoegen, Barcode scannen, Product zoeken
- Responsive positioning (desktop: aligned with app container, mobile: full width)
- Toggle behavior (opens at 52px above footer for easy closing)
- Removed old FAB (FloatingActionButton) code
- Moved BarcodeScanner & OpenFoodFactsSearch to data/ folder
- Refactored documentation (VERSION_HISTORY.md split from README.md)

**Impact:** Much cleaner UX than the old FAB! Bottom sheet pattern fits better with app design.

---

### BarcodeScanner Camera Selection Improvements ✅
**Feature:** Smart camera selection with localStorage persistence.

**Implemented:**
- Camera preference saved to localStorage (`bitebudget_preferred_camera`)
- Smart selection priority:
  1. Previously saved camera (if still available)
  2. Back camera (mobile preference)
  3. First available camera
- Auto-start behavior:
  - Single camera: starts immediately
  - Saved preference exists: auto-starts with saved camera
  - First time + multiple cameras: shows selector
- "🔄 Camera" button to switch cameras mid-scan
- State reset on modal close to prevent bugs

**Impact:** Scanner starts instantly on subsequent uses, much faster workflow!

---

### Sub-Tab Persistence ✅
**Feature:** Remember active sub-tab across page refreshes.

**Implemented:**
- Data page tabs saved to `voedseljournaal_data_tab`
  - Tabs: Producten & Porties | Templates | Import/Export
- Analyse page tabs saved to `voedseljournaal_analyse_tab`
  - Tabs: Voeding | Activiteit | Balance | Trends | Overzicht

**Impact:** No more jumping back to first tab after refresh!

---

## Completed Features Archive

<details>
<summary>Click to view older completed features (v1.0.0 - v1.11.0)</summary>

### Redesigned Analyse Overzicht Tab (v1.8.2) ✅
**Feature:** Complete redesign van de Overzicht tab met 3 krachtige charts voor aggregated data analyse.

**Implemented:**
- **Chart 1: Voeding Gemiddelden Over Tijd** 📊
  - Line chart met alle 8 nutrition metrics
  - Doellijnen voor metrics met targets
  - Multiple Y-axes voor verschillende schalen
  - Toggle buttons voor metric selectie

- **Chart 2: Activiteit Gemiddelden Over Tijd** 🏃
  - Line chart met 7 activity metrics
  - Multiple Y-axes (stappen, calorieën, hartslag, minuten/uren)
  - Week/Maand aggregatie niveau

- **Chart 3: Correlatie Analyse** 📈
  - Scatter plot voor geaggregeerde data
  - Cross-metric analyse (nutrition + activity combineerbaar)
  - Trend lijn met lineaire regressie
  - Correlatie coëfficiënt berekening

**Effort:** ~3 uur

---

### Journal Date Navigation Improvement (v1.8.1) ✅
**Feature:** Compact date navigation with angle bracket buttons.

**Implemented:**
- Compact layout: `[ ‹ ] [ date input ] [ › ]`
- Unicode angle brackets for clean appearance
- Responsive sizing with fixed button widths

**Effort:** ~15 minuten

---

### Weekly/Monthly Aggregate Views (v1.8.0) ✅
**Feature:** Comprehensive weekly and monthly overview of nutrition and activity data.

**Implemented:**
- WeekAggregateCard with rich nutrition & activity metrics
- MonthAggregateCard with monthly summaries
- ComparisonView with side-by-side period analysis
- CSV export for weekly/monthly aggregates
- Period selector (4/8/12 weeks, 6/12 months)

**Effort:** ~7 uur

---

### Sleep Stages Tracking & Visualization (v1.10.0) ✅
**Feature:** Comprehensive sleep tracking with detailed sleep stage analysis from Health Connect.

**Implemented:**
- Database schema with sleep stages table
- Health Connect sleep data import
- SleepStagesChart with color-coded timeline
- Sleep stages overview table (last 30 nights)
- Activity tab integration with clickable heatmap
- Full cloud sync support

**Effort:** ~4 uur

---

### Heart Rate Visualization (v1.7.0) ✅
- Intraday heart rate chart with ~680 samples per day
- Heart rate zone visualization with colored backgrounds
- Collapsible statistics panel
- Resting HR heatmap integration
- Database schema v9 with heartRateSamples table

---

### Other Completed Features ✅
- OAuth & Heart Rate Sync Improvements (v1.7.1)
- CloudSync Settings Fix (v1.6.8)
- Sync Improvements - Critical Bugfixes (v1.6.1)
- Search Performance - Debouncing (v1.6.1)
- Soft Delete Implementation (v1.6.0)
- Swipe Gestures voor Tab Navigatie

</details>

---

## Backlog / Future Ideas

### Code Quality
- [ ] **Version Consolidation - Remove Legacy Migration Code**
  - Consolideer huidige versie, verwijder support voor oude formaten
  - Settings migratie: Verwijder alle caloriesRest/caloriesSport migratie code
  - SyncData interface: Maak productPortions, mealTemplates, dailyActivities verplicht (verwijder `?`)
  - Verwijder alle backward compatibility checks in sync/import functies
  - Vereenvoudig BACKUP_SCHEMA_VERSION tot alleen CURRENT
  - **Voordeel:** Schonere code, minder complexity, makkelijker onderhoud
- [ ] TypeScript strict mode improvements
- [ ] Unit tests voor critical business logic
- [ ] E2E tests voor sync scenarios

### Features
- [ ] Barcode scanner improvements (betere database lookups)
- [ ] Meal photo's opslaan en tonen
- [ ] Recipe calculator (bereken nutrition voor hele recepten)
- [ ] Social features (delen van templates/recepten)

### Infrastructure
- [ ] Progressive loading voor grote datasets
- [ ] Offline queue voor sync operations
- [ ] Background sync met Service Worker
- [ ] Compression voor sync payloads
