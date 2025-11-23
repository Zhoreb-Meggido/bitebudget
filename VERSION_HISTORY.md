# Version History - BiteBudget

Complete changelog van alle releases met feature details en bugfixes.

---

## 📋 Detailed Changelog

### **v1.13.0 - Steps Intraday Tracking** (2025-01-23)

#### **Steps Tracking System** 👣
- ✅ **Intraday Steps Data** - Complete steps tracking infrastructure
  - Database v12 with stepsSamples table
  - StepsSample interface (timestamp + count)
  - DayStepsSamples with aggregations (total, max, count)
  - 75-day retention policy (consistent with HR/Sleep)
- ✅ **Health Connect Integration** - Import steps from Health Connect
  - extractAndStoreAllStepsSamples() - Batch import
  - extractAndStoreStepsSamplesForDay() - Single day import
  - Parse steps_record_table from Health Connect SQLite
- ✅ **StepsChart Visualization** - Bar chart showing intraday steps
  - Time-based X-axis (00:00 to 23:59)
  - Step count Y-axis with dynamic scaling
  - Skip zero-value bars for cleaner visualization
  - Collapsible statistics panel with hourly breakdown
- ✅ **Activity Tab Integration** - 👣 indicator in heatmap
  - Click days to view detailed intraday chart
  - Shows total steps, max steps, sample count
  - Hourly statistics: active hours, avg per hour, most active time
- ✅ **Cloud Sync Support** - Full backup integration
  - Backup schema v1.11 (includes HR, Sleep, Steps)
  - Soft delete pattern with deleted flag
  - Smart merge strategy (newest wins)
  - Auto cleanup of old data (75-day retention)

#### **UX Improvements** 🎯
- ✅ **HealthConnect Preview** - Extended import preview
  - Show counts for HR samples, sleep stages, and steps samples
  - Preview available for both direct DB upload and ZIP import
  - Better visibility before importing data
- ✅ **Period Selection** - Unified across analysis tabs
  - Exclude "today" from all datasets (incomplete data)
  - Replace toggle buttons with dropdown selectors
  - Consistent UX across Balance, Trends, and Overzicht tabs
  - All date ranges end at "yesterday" instead of "today"

#### **Technical Changes** 🔧
- ✅ **Database Migration** - v11 → v12
  - Added stepsSamples table (date, sampleCount indices)
  - Consistent schema with heartRateSamples and sleepStages
- ✅ **Type Safety** - TypeScript interfaces for steps data
- ✅ **Service Layer** - steps-samples.service.ts with full CRUD
- ✅ **React Hook** - useStepsSamples for data management
- ✅ **Constants** - Updated BACKUP_SCHEMA_VERSION to 1.11
- ✅ **Bug Fix** - Fixed Health Connect import typo (epochDayToDate → epochDaysToDate)

### **v1.12.0 - QuickActions Bottom Sheet** (2025-01-22)

#### **Global QuickActions System** 🚀
- ✅ **Bottom Sheet Menu** - Modern slide-up menu vanuit footer
  - Hamburger button in footer (links uitgelijnd op desktop)
  - 4 snelle acties: Maaltijd toevoegen, Product toevoegen, Product scannen, Product zoeken
  - Mooi gecentreerd op mobiel, max-width op desktop
  - Opent precies boven footer (52px vanaf onderkant)
- ✅ **Global Modals** - Modals werken vanaf elke pagina
  - AddMealModalV2 - Maaltijd toevoegen met tab switch
  - ProductEditModal - Nieuw product aanmaken
  - BarcodeScanner - Barcode scannen
  - OpenFoodFactsSearch - Product zoeken in OFF database
- ✅ **Footer Improvements** - Responsive layout optimalisaties
  - Hamburger button spans 2 rijen op mobiel
  - Spacer voor perfecte centering
  - Compact design met alle info zichtbaar
- ✅ **Code Cleanup** - FAB verwijderd, scanners verplaatst naar data folder

### **v1.11.0 - Add Meal Flow Redesigned** (2025-01-22)

#### **2-Step Add Meal Flow** 🍽️
- ✅ **Step 1: Product Selectie** - Dedicated product selection step
  - Search & filter interface
  - Product list with nutrition preview
  - Favorite products highlighted
- ✅ **Step 2: Meal Details** - Confirm and adjust portions
  - Selected products overview
  - Portion adjustment
  - Meal name and time
- ✅ **Better UX** - Cleaner separation of concerns
  - Less overwhelming interface
  - Clear progress indication
  - Easy to modify selections

### **v1.10.0 - Sleep Stages Tracking** (2025-01-20)

#### **Detailed Sleep Analysis** 😴
- ✅ **Sleep Stage Import** - Extract detailed sleep stages from Health Connect
- ✅ **Stage Breakdown** - Light Sleep, Deep Sleep, REM Sleep, Awake time
- ✅ **Timeline Visualization** - Color-coded timeline showing all sleep phases
- ✅ **Summary Statistics** - Total sleep, light, deep, REM, and awake hours per night
- ✅ **Interactive Chart** - Click on sleep days to view detailed stage breakdown
- ✅ **Database v11** - New sleepStages table with date as primary key
- ✅ **useSleepStages Hook** - Custom hook for loading and managing sleep data
- ✅ **Cloud Sync Support** - Full sync integration with smart merge

### **v1.8.2 - Redesigned Analyse Overzicht Tab** (2025-11-15)

#### **3 Powerful Charts voor Aggregated Data** 📊
- ✅ **Chart 1: Voeding Gemiddelden** - 8 metrics met doellijnen
- ✅ **Chart 2: Activiteit Gemiddelden** - 7 activity metrics
- ✅ **Chart 3: Correlatie Analyse** - Scatter plot met trend lijn
- ✅ **Week/Maand Aggregatie** - Flexibele aggregatie selector
- ✅ **Cross-Metric Analysis** - Combineer nutrition én activity metrics
- ✅ **Statistische Feedback** - Correlatie coëfficiënt met visuele kleurcodering

### **v1.8.1 - Journal Date Navigation** (2025-11-15)

#### **Compact Date Navigation** 📅
- ✅ **Angle Bracket Buttons** - Clean `‹ date ›` layout
- ✅ **Removed "Vandaag" Button** - Cleaner interface
- ✅ **Perfect Responsiveness** - No layout shifts on mobile
- ✅ **Fixed Button Widths** - Consistent sizing across screens

### **v1.8.0 - Weekly/Monthly Aggregates** (2025-11-15)

#### **Comprehensive Aggregate Analysis** 📊
- ✅ **Week View** - Detailed weekly nutrition and activity summaries
- ✅ **Month View** - Monthly summaries with week breakdown
- ✅ **Comparison View** - Side-by-side period analysis
- ✅ **CSV Export** - Export weekly and monthly data
- ✅ **aggregation.service.ts** - Business logic for aggregations
- ✅ **New "Overzicht" Tab** - In Analyse page

### **v1.7.1 - OAuth & HR Sync Improvements** (2025-01-15)

#### **Heart Rate Samples Cloud Sync** 💓
- ✅ **Cloud Backup Support** - HR samples included in sync (75-day retention)
- ✅ **Soft-Delete Pattern** - Consistent with other data types
- ✅ **Smart Merge** - Newest timestamp wins strategy
- ✅ **Automatic Cleanup** - Remove HR data older than 75 days
- ✅ **Database v10** - Added updated_at index to weights

#### **Enhanced OAuth Debugging** 🔐
- ✅ **Extended Refresh Window** - Up to 7 days after expiry
- ✅ **Better Error Logging** - Detailed logging for all failures
- ✅ **UserId Tracking** - Detect userId changes
- ✅ **Edge Function Improvements** - Better error handling

### **v1.7.0 - Heart Rate Visualization** (2025-11-15)

#### **Intraday Heart Rate Charts** 💓
- ✅ **Intraday Visualization** - ~680 HR measurements per day
- ✅ **Heart Rate Zones** - 5 colored zones based on max HR
- ✅ **Zone Statistics** - Time spent percentage per zone
- ✅ **Collapsible Panel** - Compact/expanded views
- ✅ **Resting HR Heatmap** - 8-week calendar integration
- ✅ **Clickable Days** - View detailed intraday charts
- ✅ **Database v9** - heartRateSamples table
- ✅ **useHeartRateSamples Hook** - Custom data management

### **v1.6.2 - Mobile UX Improvements** (2025-01-11)

#### **Swipe Gestures** 👆
- ✅ **useSwipeTabs Hook** - Reusable swipe gesture detection
- ✅ **Analyze Page Swipes** - Navigate between tabs
- ✅ **Data Page Swipes** - Navigate between tabs
- ✅ **Conflict Prevention** - 50px minimum swipe distance
- ✅ **react-swipeable Library** - Professional gesture detection

#### **Mobile Table Fixes** 📱
- ✅ **ProductsPortionsTab** - Horizontal scroll for nutrition info
- ✅ **TrendsTab Chart** - Overflow-x-auto for wide charts
- ✅ **Consistent Pattern** - All data displays follow same pattern

### **v1.6.1 - Critical Sync Bugfixes** (2025-01-11)

#### **Sync Reliability** 🔧
- ✅ **Duplicate Entries Fixed** - ID preservation during sync
- ✅ **Cleanup Bug Fixed** - getAllEntriesIncludingDeleted()
- ✅ **OAuth Popup Fixed** - tryAutoRefreshOnStartup()
- ✅ **Infinite Loop Fixed** - Preserve cloud timestamps

#### **Search Performance** ⚡
- ✅ **useDebounce Hook** - 300ms delay
- ✅ **Reduced Filtering** - Less re-renders during typing

### **v1.6.0 - Automatic OAuth Refresh** (2025-01-10)

#### **Automatic Token Refresh** 🔄
- ✅ **Authorization Code Flow** - Upgrade from Implicit Flow
- ✅ **Supabase Edge Functions** - Server-side OAuth management
- ✅ **Automatic Refresh** - Every 50 minutes
- ✅ **Zero User Interaction** - No manual popups
- ✅ **Android PWA Compatible** - Works in Android WebView
- ✅ **Encrypted Storage** - AES-256-GCM for refresh tokens

#### **HRV Tracking** 💓
- ✅ **HRV Metrics** - Overnight HRV and 7-day average
- ✅ **Enhanced CSV Import** - Better Garmin format support
- ✅ **Trends View Updates** - HRV metrics replace Distance

### **v1.5.0 - Templates & Integrations** (2025-01-09)

#### **Meal Templates** ⭐
- ✅ **Template System** - Save frequently used meals
- ✅ **Quick Add** - One-click meal logging
- ✅ **Favorites** - Mark templates for quick access
- ✅ **Recent Templates** - Auto-track last 5 used
- ✅ **Category Support** - Organize by meal type
- ✅ **Template Management** - Full CRUD in Data page

#### **Garmin Connect Integration** 📊
- ✅ **CSV Import** - Import daily activities
- ✅ **Activity Tracking** - Steps, calories, HR, stress, sleep, Body Battery
- ✅ **Data Validation** - Smart parsing with error handling
- ✅ **Duplicate Detection** - Prevents re-importing

#### **Smart Token Management** 🔐
- ✅ **Proactive Warnings** - Modal 10 min before expiry
- ✅ **Auto-Refresh on Return** - When returning to app
- ✅ **Visibility-Aware** - Only shows when app is active

### **v1.4.0 - Data Management Page** (2025-01-06)

#### **New Data Page** 📊
- ✅ **3 Tabs** - Producten & Porties, Templates, Import/Export
- ✅ **Full CRUD Modals** - ProductEditModal, PortionModal, TemplateEditModal
- ✅ **Inline Portie View** - Porties directly under product
- ✅ **Uniforme UI** - Emoji buttons (⭐✏️🗑️) everywhere

#### **Soft Delete** 🗑️
- ✅ **Deletion Propagation** - Sync deletions between devices
- ✅ **Soft Delete Pattern** - Records marked as deleted
- ✅ **Bidirectional Sync** - Deletions propagate both ways
- ✅ **Timestamp Tracking** - deleted_at field

#### **PDF Export Enhancements** 📄
- ✅ **Consolidated Generator** - Merged two generators
- ✅ **6 Metric Cards** - Optimized layout
- ✅ **2x2 Graph Grid** - 4 paired graphs
- ✅ **Monthly Reports** - Multi-month selection

### **v1.3.0 - Porties & Templates** (2025-01-05)

#### **Portie Templates** 🍽️
- ✅ **Default Portions Database** - 50+ voorgedefinieerde porties
- ✅ **Multiple Units** - Grammen, ml, stuks, eetlepels, theelepels
- ✅ **Automatic Conversion** - 1 el = 15g, 1 tl = 5g
- ✅ **User-Definable** - Add custom portions

#### **Meal Templates** ⭐
- ✅ **Template System** - Save frequently used meals
- ✅ **6 Categories** - Ontbijt, Lunch, Diner, Snack, Shake, Anders
- ✅ **Nutritional Preview** - Total calories and protein
- ✅ **Usage Tracking** - Popularity tracking

#### **Quick Add** ⚡
- ✅ **Quick Add Section** - Horizontal scrollable list
- ✅ **Direct Access** - Click template → AddMealModal opens
- ✅ **Smart Positioning** - Between metrics and "Maaltijd toevoegen"

### **v1.2.1 - Cloud Sync Fixes** (2024-12-30)

#### **Cloud Sync Coverage** ☁️
- ✅ **Products Auto-Sync** - All product operations trigger sync
- ✅ **Settings Auto-Sync** - Settings changes trigger sync
- ✅ **Fixed Merge Strategy** - Products sync all updates
- ✅ **Sync on Login** - Auto pull/sync after login
- ✅ **Sync on Reconnect** - Auto sync when cloud available

#### **Mobile UX** 📱
- ✅ **Tab Navigation** - "📅 Vandaag" and "📦 Producten"
- ✅ **Sticky Action Button** - Always visible at bottom
- ✅ **Compact Product Badges** - Inline chips with gram inputs
- ✅ **Placeholders > Defaults** - Easier value input

### **v1.2.0 - PDF Reporting** (2024-12-28)

#### **PDF Improvements** 📄
- ✅ **Consolidated Generator** - Single PDF generator
- ✅ **2x2 Graph Grid** - 4 paired graphs
- ✅ **Week Overview Table** - Daily totals
- ✅ **Meals Appendix** - Separate page with details

#### **CSV Export** 📊
- ✅ **Excel-Compatible** - UTF-8 BOM, CRLF
- ✅ **All 8 Metrics** - Complete nutrition data

#### **Period Selector** 🎯
- ✅ **Dual Mode** - Dashboard vs Export mode
- ✅ **Reusable Component** - Shared across pages

### **v1.1.0 - Cloud Sync Launch** (2024-12-20)

#### **Google Drive Sync** ☁️
- ✅ **End-to-End Encryption** - AES-GCM 256-bit
- ✅ **Automatic Sync** - 30s debounce + 5 min pulls
- ✅ **Smart Merge** - Timestamp-based conflict resolution
- ✅ **Complete Data** - Entries, Products, Weights, Settings
- ✅ **OAuth 2.0** - Restricted drive.file scope

#### **Dashboard Improvements** 📊
- ✅ **8 Metrics Tracking** - All nutrition metrics
- ✅ **Weight Projection** - Weekly prediction
- ✅ **Optimized Layout** - Chart top, metrics below

### **v1.0.0 - PWA + OpenFoodFacts** (2024-12-15)

#### **Core Functionality** ✅
- ✅ **Journaal** - Daily meal tracking
- ✅ **Tracking** - Weight graphs and history
- ✅ **Dashboard** - Multi-metric visualizations
- ✅ **Analyse** - Week comparison, heatmap, trends
- ✅ **Data** - Import/Export, reporting
- ✅ **Settings** - Configurable goals and limits

#### **OpenFoodFacts** 🔍
- ✅ **Barcode Scanner** - html5-qrcode camera
- ✅ **Text Search** - OFF API v2 product search
- ✅ **Auto-fill** - Nutrition data
- ✅ **Product Metadata** - Nutri-score, brand, photos

### **v0.9.0 - Initial Release** (2024-12-01)

#### **Foundation** 🏗️
- ✅ **6 Tabs** - Journal, Tracking, Dashboard, Analyse, Data, Settings
- ✅ **Responsive Design** - Mobile & desktop optimized
- ✅ **PDF/TXT Reports** - Export functionality
- ✅ **IndexedDB** - Dexie.js integration

---

## 📝 Version Summary

| Version | Date | Key Features |
|---------|------|--------------|
| v1.13.0 | 2025-01-23 | Steps Intraday Tracking, HealthConnect Preview, Period Selection UX |
| v1.12.0 | 2025-01-22 | QuickActions Bottom Sheet, Global modals |
| v1.11.0 | 2025-01-22 | Add Meal Flow Redesigned (2-step) |
| v1.10.0 | 2025-01-20 | Sleep Stages Tracking & Visualization |
| v1.8.2 | 2025-11-15 | Redesigned Analyse Overzicht (3 charts) |
| v1.8.1 | 2025-11-15 | Compact Date Navigation |
| v1.8.0 | 2025-11-15 | Weekly/Monthly Aggregates |
| v1.7.1 | 2025-01-15 | HR Cloud Sync, OAuth Debugging |
| v1.7.0 | 2025-11-15 | Heart Rate Visualization |
| v1.6.2 | 2025-01-11 | Swipe Gestures, Mobile UX |
| v1.6.1 | 2025-01-11 | Critical Sync Bugfixes |
| v1.6.0 | 2025-01-10 | Automatic OAuth Refresh, HRV |
| v1.5.0 | 2025-01-09 | Templates, Garmin Integration |
| v1.4.0 | 2025-01-06 | Data Management Page |
| v1.3.0 | 2025-01-05 | Porties & Templates |
| v1.2.1 | 2024-12-30 | Cloud Sync Fixes, Mobile UX |
| v1.2.0 | 2024-12-28 | PDF Reporting Improvements |
| v1.1.0 | 2024-12-20 | Cloud Sync Launch |
| v1.0.0 | 2024-12-15 | PWA + OpenFoodFacts |
| v0.9.0 | 2024-12-01 | Initial Release |

---

**Last Updated:** January 23, 2025
**Current Version:** v1.13.0
