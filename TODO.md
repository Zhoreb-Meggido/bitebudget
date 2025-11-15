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

### 7. Weekly/Monthly Aggregate Views
**Feature:** Overzicht van nutrition en activity data per week/maand.

**Taken:**
- [ ] Week view met dagelijkse gemiddelden
- [ ] Month view met weekly trends
- [ ] Vergelijking tussen weken/maanden
- [ ] Export functionaliteit voor aggregates

**Voordeel:** Beter inzicht in lange termijn trends

**Effort:** ~6-8 uur

---

## Completed ✅

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
