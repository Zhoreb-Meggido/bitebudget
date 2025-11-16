# TODO - BiteBudget Improvements

## Quick Wins (30-60 min each)

### 1. Mobile Tables Overflow Fix
**Probleem:** Tables lopen over op mobiel, waardoor data niet goed zichtbaar is.

**Oplossing:**
- Voeg horizontal scroll toe voor tables op mobiel
- Gebruik `overflow-x-auto` wrapper om tables
- Overweeg alternatieve mobile layout (stacked cards ipv table)

**Effort:** ~30-45 minuten

---

### 2. Swipe Gestures voor Tab Navigatie
**Feature:** Swipe left/right om tussen tabs te navigeren op mobiel.

**Implementatie:**
- **Optie 1 (aanbevolen):** Gebruik `react-swipeable` library
  - `npm install react-swipeable`
  - Wrap tab content in `<Swipeable>` component
  - Detect left/right swipes en trigger tab change
  - Effort: ~30-45 minuten

- **Optie 2:** Custom touch event handlers
  - Implement touch start/move/end handlers
  - Calculate swipe direction en distance
  - Meer werk, meer controle
  - Effort: ~2-3 uur

**Voordeel:** Betere mobile UX, native app-achtig gevoel

**Effort:** 30-45 min (met library) | 2-3 uur (custom)

---

## Medium Effort (1-3 uur)

### 3. Performance Optimalisatie - Memoization
**Probleem:** Veel components re-renderen onnodig vaak.

**Taken:**
- [ ] Audit components met React DevTools Profiler
- [ ] Voeg `useMemo` toe voor filtered/sorted lijsten
- [ ] Voeg `useCallback` toe voor event handlers in list items
- [ ] Overweeg `React.memo` voor pure components
- [ ] Test performance verbetering met Chrome DevTools

**Prioriteit:** Medium (merken vooral bij grote datasets)

**Effort:** ~2-3 uur

---

### 4. Chart.js Configuratie Duplicatie
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

## Larger Features (4+ uur)

### 5. Body Battery Visualisatie Verbeteringen
**Feature:** Betere weergave van Garmin Body Battery data in trends.

**Mogelijke verbeteringen:**
- [ ] Historische trends over langere periode
- [ ] Correlatie met activiteiten en slaap
- [ ] Inzicht in recovery patterns
- [ ] Vergelijk verschillende tijdsperiodes

**Effort:** ~4-6 uur

---

### 6. Distance Tracking & Visualisatie
**Feature:** Betere weergave van afgelegde afstanden.

**Taken:**
- [ ] Distance per activity type (running, cycling, walking)
- [ ] Weekly/monthly totals
- [ ] Distance trends over tijd
- [ ] Goal tracking voor distance

**Effort:** ~4-6 uur

---

## Completed ✅

### Redesigned Analyse Overzicht Tab (v1.8.2) ✅
**Feature:** Complete redesign van de Overzicht tab met 3 krachtige charts voor aggregated data analyse.

**Implemented:**
- **Chart 1: Voeding Gemiddelden Over Tijd** 📊
  - Line chart met alle 8 nutrition metrics (Calories, Protein, Carbs, Sugars, Fat, SatFat, Fiber, Sodium)
  - Doellijnen voor metrics met targets (calories, protein, saturatedFat, fiber, sodium)
  - Multiple Y-axes voor verschillende schalen (grammen, kcal, mg)
  - Toggle buttons voor metric selectie
  - Week/Maand aggregatie selector

- **Chart 2: Activiteit Gemiddelden Over Tijd** 🏃
  - Line chart met 7 activity metrics (Steps, Active Cal, Total Cal, Intensity, Sleep, HR Rust, HR Max)
  - Multiple Y-axes (stappen, calorieën, hartslag bpm, minuten/uren)
  - Week/Maand aggregatie niveau
  - Toggle buttons voor metric selectie
  - Empty state voor ontbrekende activity data

- **Chart 3: Correlatie Analyse** 📈
  - Scatter plot voor geaggregeerde data
  - Cross-metric analyse (nutrition + activity metrics combineerbaar)
  - Trend lijn met lineaire regressie
  - Correlatie coëfficiënt berekening
  - Visuele feedback (✅ sterke / ⚠️ matige / ❌ zwakke correlatie)
  - Positief/negatief relatie indicatie

**Features:**
- Aggregatie level selector (Per Week / Per Maand)
- Periode selector (4/8/12 weken, 6/12 maanden)
- Responsive design (mobile + desktop)
- Loading states
- Empty states met informatieve berichten
- Consistent design met andere tabs

**Impact:** Krachtige inzichten in langetermijn patronen en correlaties tussen voeding en activiteit!

**Effort:** ~3 uur

---

### Journal Date Navigation Improvement (v1.8.1) ✅
**Feature:** Compact date navigation with angle bracket buttons.

**Implemented:**
- Compact layout: `[ ‹ ] [ date input ] [ › ]` (was spread-out with 3 separate buttons)
- Unicode angle brackets (‹ ›) for clean, minimal appearance
- Removed "Vandaag" button for simpler interface
- Fixed button width (w-12) prevents layout shifts
- Date input with flex-1 and min-w-0 for responsive sizing
- max-w-sm container prevents excessive width on desktop
- Perfect mobile responsiveness without jumping or overflow
- Centered button text with flexbox (items-center justify-center)
- Larger text size (text-xl) for better symbol visibility

**Impact:** Cleaner, more compact UI that works perfectly on all screen sizes!

**Effort:** ~15 minuten

---

### Weekly/Monthly Aggregate Views (v1.8.0) ✅
**Feature:** Comprehensive weekly and monthly overview of nutrition and activity data.

**Implemented:**
- **Phase 1: Foundation**
  - TypeScript types for aggregates (WeekAggregate, MonthAggregate)
  - aggregation.service.ts with week/month calculation logic
  - useAggregates hook with memoization
  - New "Overzicht" tab in Analyse page

- **Phase 2: Week View**
  - WeekAggregateCard with rich nutrition & activity metrics
  - All macros + micronutrients display
  - Calorie adherence visualization (progress bar, color coding)
  - Sort toggle (newest/oldest first)
  - Mobile responsive layouts

- **Phase 3: Month View**
  - calculateMonthlyAggregates service function
  - MonthAggregateCard with monthly summaries
  - Best/worst week indicators based on adherence
  - Collapsible weekly breakdown per month
  - Gradient backgrounds for visual hierarchy

- **Phase 4: Comparison & Export**
  - ComparisonView with side-by-side period analysis
  - Period split (first half vs second half)
  - Change metrics with percentage calculations
  - CSV export for weekly aggregates
  - CSV export for monthly aggregates
  - Export button in header

**Features:**
- Period selector (4/8/12 weeks, 6/12 months)
- Tab navigation (Week/Month/Compare)
- Empty states with helpful messaging
- Settings integration for calorie targets
- Full mobile responsiveness
- Performance optimized with React.memo/useMemo
- Side-by-side period comparison
- CSV export functionality

**Effort:** ~7 uur (all phases complete)

### Sleep Stages Tracking & Visualization (v1.10.0) ✅
**Feature:** Comprehensive sleep tracking with detailed sleep stage analysis from Health Connect.

**Implemented:**
- **Database & Types**
  - SleepStageType enum (AWAKE, LIGHT, DEEP, REM, etc.)
  - DaySleepStages interface with stage breakdown
  - Database schema v11 with sleepStages table
  - Soft delete support with 75-day retention policy

- **Data Import**
  - Extract sleep stages from Health Connect sleep_stages_table
  - Read sleep session data from sleep_session_record_table
  - Automatic calculation of light/deep/REM/awake duration
  - Cleanup of old sleep stages (75-day retention)

- **Visualization Components**
  - useSleepStages hook for data management
  - SleepStagesChart component with:
    - Color-coded timeline of sleep phases
    - Summary stats (total, light, deep, REM, awake hours)
    - Interactive timeline with stage breakdown
  - Sleep stages overview table with:
    - Last 30 nights with detailed breakdown
    - Visual bar chart showing stage distribution
    - Sortable by date (most recent first)

- **Activity Tab Integration**
  - Sleep metric heatmap with 😴 indicator for nights with data
  - Clickable days to view detailed sleep stages
  - Collapsible sleep stages overview table
  - Sleep nights counter in stats cards

- **Cloud Sync**
  - Full sync support for sleep stages
  - Smart merge with timestamp comparison
  - Soft delete cleanup (>14 days)
  - Export/import in cloud backups

**Impact:** Deep insights into sleep quality with detailed stage analysis (light/deep/REM/awake breakdown)!

**Effort:** ~4 uur

### OAuth & Heart Rate Sync Improvements (v1.7.1) ✅
- [x] Heart rate samples cloud sync with 75-day retention
- [x] Soft-delete pattern for HR samples (consistent with other data)
- [x] Smart merge strategy ("newest timestamp wins")
- [x] Automatic cleanup after Health Connect import
- [x] Enhanced OAuth debugging with detailed error logging
- [x] Extended auto-refresh window (24h → 7 days after expiry)
- [x] UserId tracking for troubleshooting refresh token issues
- [x] Better Supabase Edge Function error handling
- [x] Database v10 with updated_at index on weights

### Heart Rate Visualization (v1.7.0) ✅
- [x] Intraday heart rate chart with ~680 samples per day
- [x] Heart rate zone visualization with colored backgrounds
- [x] Collapsible statistics panel showing time spent per zone
- [x] Responsive SVG chart that scales to container width
- [x] Resting HR heatmap integration (fitness indicator)
- [x] Clickable heatmap days to show detailed intraday chart
- [x] Heart indicator (💓) on days with intraday samples
- [x] 2 new HR stats cards (Ø Rust HR, Ø Max HR)
- [x] Database schema v9 with heartRateSamples table
- [x] useHeartRateSamples hook for data management
- [x] HeartRateChart component with zones and statistics

### CloudSync Settings Fix (v1.6.8) ✅
- [x] Fix settings merge logic to use timestamps instead of format check
- [x] Settings updates from other devices no longer get lost during sync
- [x] Added settingsUpdatedAt field to SyncData for proper timestamp comparison

### Sync Improvements - Critical Bugfixes (v1.6.1) ✅
- [x] Fix duplicate entries bug when meal time is edited after sync
- [x] Fix soft-deleted items cleanup (getAllEntriesIncludingDeleted)
- [x] Fix OAuth popup appearing when idle (auto-refresh on startup)
- [x] Fix infinite update loop (preserve cloud timestamps)

### Search Performance - Debouncing (v1.6.1) ✅
- [x] Implement useDebounce hook (300ms delay)
- [x] Apply debouncing to AddMealModal search
- [x] Apply debouncing to ProductsPortionsTab search
- [x] Apply debouncing to TemplatesTab search

### Soft Delete Implementation (v1.6.0) ✅
- [x] Consistent soft delete for all data types
- [x] 14-day tombstone retention for cross-device sync
- [x] Cleanup function for old deleted items

---

## Backlog / Future Ideas

### Code Quality
- [ ] **Version Consolidation - Remove Legacy Migration Code**
  - Consolideer huidige versie, verwijder support voor oude formaten
  - Settings migratie: Verwijder alle caloriesRest/caloriesSport migratie code
  - SyncData interface: Maak productPortions, mealTemplates, dailyActivities verplicht (verwijder `?`)
  - Verwijder alle backward compatibility checks in sync/import functies
  - Vereenvoudig BACKUP_SCHEMA_VERSION tot alleen CURRENT
  - **Let op:** Eerst testen dat huidige data nog importeerbaar is na export
  - **Voordeel:** Schonere code, minder complexity, makkelijker onderhoud
  - **Risico:** Laag (alleen 1 gebruiker, geen oude backups die nog geïmporteerd moeten)
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
