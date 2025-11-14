# BiteBudget (Voedseljournaal) v1.7.0

**Progressive Web App (PWA) voor food tracking - werkt volledig offline met cloud sync!**

Modern React + TypeScript food tracking app met OpenFoodFacts integratie en end-to-end encrypted Google Drive synchronisatie. Installeerbaar als native app op desktop en mobile - alle data lokaal met optionele cloud backup.

**🎉 Nieuw in v1.7.0:** Heart Rate Visualization - Intraday hartslag grafieken met zones, collapsible statistics panel en heatmap integratie!

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

## ✨ v1.7.0 - Heart Rate Visualization (Huidige Versie)

### **Intraday Heart Rate Charts** 💓

#### **Comprehensive HR Tracking**
- ✅ **Intraday Visualization** - ~680 heart rate measurements per day (every ~2 minutes)
- ✅ **Heart Rate Zones** - 5 colored zones based on max HR (Rust, Vet, Cardio, Anaërobe, Max)
- ✅ **Zone Statistics** - Time spent percentage and sample count per zone
- ✅ **Collapsible Panel** - Compact view (percentages only) or expanded (full details)
- ✅ **Responsive SVG Chart** - Scales to container width with fixed 300px height
- ✅ **Hand-Coded SVG** - No external charting library dependencies

#### **Activity Tab Integration** 📊
- ✅ **Resting HR Heatmap** - 8-week calendar showing resting heart rate (fitness indicator)
- ✅ **Color-Coded Fitness** - Green (≤55 bpm) to Red (>65 bpm) for quick visual assessment
- ✅ **Clickable Days** - Click any day with HR data to view detailed intraday chart
- ✅ **Heart Indicators** - 💓 icon on days with full intraday sample data
- ✅ **HR Stats Cards** - 2 new cards showing Ø Rust HR and Ø Max HR across all days

#### **Technical Implementation** 🔧
- ✅ **Database v9** - New heartRateSamples table with date as primary key
- ✅ **useHeartRateSamples Hook** - Custom hook for loading and managing HR samples
- ✅ **HeartRateChart Component** - SVG-based visualization with zones and statistics
- ✅ **Health Connect Ready** - Schema supports import from Health Connect API
- ✅ **TypeScript Types** - HeartRateSample and DayHeartRateSamples interfaces

#### **UX Features** 🎨
- ✅ **Zone Color Progression** - Purple → Blue → Green → Orange → Red (visual hierarchy)
- ✅ **Smooth Animations** - 300ms transitions for panel expand/collapse
- ✅ **Semi-Transparent Panel** - bg-white/95 with backdrop-blur for modern look
- ✅ **Minimal Space Usage** - Panel floats over chart when expanded (48px → 224px)
- ✅ **Mobile Optimized** - Responsive layout with full-width support

**Use Cases:**
- Track daily fitness level through resting HR trends
- Identify lifestyle impact (alcohol, sleep) on resting HR
- Analyze workout intensity and time spent in different HR zones
- Monitor recovery through HR patterns
- Visualize activity intensity distribution throughout the day

---

## ✨ v1.4.0 - Data Management Page

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

### **v1.6.2 - Mobile UX Improvements** (2025-01-11)

#### **Swipe Gestures for Tab Navigation** 👆
- ✅ **useSwipeTabs Hook** - Reusable hook for swipe gesture detection
- ✅ **Analyze Page Swipes** - Swipe left/right to navigate between Voeding, Activiteit, Balance, Trends tabs
- ✅ **Data Page Swipes** - Swipe left/right to navigate between Producten, Templates, Import/Export tabs
- ✅ **Conflict Prevention** - 50px minimum swipe distance prevents accidental tab switches
- ✅ **Vertical Scroll Friendly** - preventScrollOnSwipe: false allows vertical scrolling
- ✅ **Touch-Only** - Gestures only on mobile/tablet (trackMouse: false)
- ✅ **Passive Events** - Better scroll performance with passive touch events
- ✅ **react-swipeable Library** - Professional gesture detection with configurable thresholds

#### **Mobile Table Overflow Fixes** 📱
- ✅ **ProductsPortionsTab** - Nutrition info gets horizontal scroll wrapper
  - overflow-x-auto with whitespace-nowrap prevents text overflow
  - Long nutrition summaries scroll horizontally on narrow screens
- ✅ **TrendsTab Chart** - Chart container gets overflow-x-auto
  - min-w-[320px] prevents chart squashing on small screens
  - Multiple Y-axes remain readable when many metrics selected
- ✅ **Consistent Pattern** - All data displays follow same overflow handling pattern

#### **Technical Implementation** 🔧
- ✅ **react-swipeable@7.0.2** - Added to dependencies
- ✅ **useSwipeTabs Hook** - Generic hook for any tab-based component
- ✅ **Configurable Thresholds** - minSwipeDistance and minSwipeVelocity parameters
- ✅ **Version Bump** - 1.6.1 → 1.6.2 for PWA cache management

**Impact:** Native app-like swipe navigation + geen overflow issues op mobiel - perfecte mobile experience!

---

### **v1.6.1 - Critical Sync Bugfixes & Search Performance** (2025-01-11)

#### **Critical Sync Bugfixes** 🔧
- ✅ **Duplicate Entries Fixed** - ID preservation during sync prevents duplicate meals
  - Problem: entriesService.addEntry() always generated new IDs, discarding cloud IDs
  - Solution: Use db.entries.add() directly to preserve cloud IDs
  - Impact: No more duplicate entries when editing meal time after sync
- ✅ **Cleanup Bug Fixed** - Soft-deleted items cleanup now works properly
  - Problem: cleanupOldDeletedItems() used getAllEntries() instead of getAllEntriesIncludingDeleted()
  - Solution: Use *IncludingDeleted() methods to find items marked as deleted
  - Impact: 14-day tombstone cleanup now removes old deleted items correctly
- ✅ **OAuth Popup on Idle Fixed** - Token refresh attempts before showing popup
  - Problem: Browser throttles timers when tab inactive → 50-min auto-refresh doesn't run
  - Solution: Added tryAutoRefreshOnStartup() and ensureValidToken() before sync
  - Impact: No more unexpected OAuth popups when returning to app after idle
- ✅ **Infinite Update Loop Fixed** - Cloud timestamps now preserved during sync
  - Problem: updateEntry/Product/Weight() always set updated_at: now(), creating infinite loops
  - Solution: Use db.*.update() directly with destructured cloudData to preserve timestamps
  - Impact: No more 200+ items updating on every sync

#### **Search Performance - Debouncing** ⚡
- ✅ **useDebounce Hook** - Generic debounce hook with 300ms default delay
- ✅ **AddMealModal** - Product and template search debounced
- ✅ **ProductsPortionsTab** - Search query debounced
- ✅ **TemplatesTab** - Search query debounced
- ✅ **Reduced Filtering** - useMemo dependencies use debounced values
- ✅ **Better Performance** - Less re-renders during typing

#### **Technical Details** 🔧
- ✅ **ID Preservation** - db.*.add(cloudItem) instead of service methods
- ✅ **Timestamp Preservation** - db.*.update(id, cloudData) without spreading id
- ✅ **Auto-Refresh Logic** - tryAutoRefreshOnStartup() checks token expiry on app start
- ✅ **Pre-Sync Token Check** - ensureValidToken() before each sync attempt
- ✅ **Cleanup Methods** - getAllEntriesIncludingDeleted(), getAllProductsIncludingDeleted()

**Impact:** Rock-solid sync reliability - no more duplicates, cleanups work, tokens refresh silently, and infinite loops eliminated!

---

### **v1.6.0 - Automatic OAuth Token Refresh** (2025-01-10)

#### **Automatic Token Refresh via Supabase** 🔄
- ✅ **Authorization Code Flow** - Upgraded from Implicit Flow to get refresh tokens
- ✅ **Supabase Edge Functions** - Server-side OAuth token management
- ✅ **Automatic Refresh** - Tokens automatically renewed every 50 minutes
- ✅ **Zero User Interaction** - No more manual "token expired" popups!
- ✅ **Android PWA Compatible** - Works perfectly in Android WebView
- ✅ **Encrypted Storage** - Refresh tokens stored encrypted (AES-256-GCM)
- ✅ **Fallback Support** - Falls back to manual refresh if Supabase unavailable

#### **Garmin OAuth Infrastructure** 📊
- ✅ **OAuth 2.0 PKCE** - Authorization Code Flow for Garmin Connect
- ✅ **Edge Functions Ready** - garmin-oauth-init and garmin-oauth-refresh deployed
- ✅ **3-Month Tokens** - Garmin tokens valid for 90 days (vs 1 hour for Google)
- ✅ **Future-Ready** - Infrastructure prepared for automatic Garmin data sync

#### **HRV Tracking & CSV Import Improvements** 💓
- ✅ **HRV Metrics** - Track Heart Rate Variability for recovery monitoring
  - Overnight HRV measurement (ms)
  - 7-day HRV average (ms)
  - HRV Status CSV import from Garmin Connect
- ✅ **Enhanced CSV Import** - Better support for Garmin export formats
  - 2-column Resting Heart Rate CSV support (date + resting HR)
  - Tab-separated format detection for copy-paste from Garmin website
  - "bpm" and "ms" suffix stripping for cleaner data
  - Month abbreviation date parsing ("Nov 11" → 2025-11-11)
  - Automatic year inference based on current date
- ✅ **Trends View Updates** - HRV metrics replace Distance
  - Distance metric removed (no CSV available from Garmin)
  - HRV Overnight card and chart added
  - HRV 7-day average visualization
  - Shared Y-axis scale for HRV metrics
  - Average HRV stats card on dashboard

#### **Backend Integration** 🔧
- ✅ **Supabase Client** - @supabase/supabase-js@2.81.0 integration
- ✅ **Database Migration** - oauth_tokens table with RLS security
- ✅ **Browser Fingerprinting** - User identification without login
- ✅ **CORS Support** - Cross-origin request handling
- ✅ **Environment Config** - .env.example with all required variables

#### **Technical Improvements** 🚀
- ✅ **OAuth Callback Handler** - Seamless authorization code exchange in main.tsx
- ✅ **Dual OAuth Flows** - Automatic (Authorization Code) + Manual (Implicit) fallback
- ✅ **Settings Integration** - autoRefreshOAuth option in UserSettings
- ✅ **Supabase Config** - config.toml for Edge Functions deployment
- ✅ **Documentation** - Complete setup guide in OAUTH_SETUP.md

#### **Setup Requirements** ⚙️
To enable automatic refresh:
1. Create Supabase project (free tier sufficient)
2. Deploy Edge Functions (`npx supabase functions deploy`)
3. Set environment secrets (encryption key, Google OAuth credentials)
4. Configure .env file with Supabase URL and keys

**Impact:** Google Drive sync now works seamlessly without interruptions - perfect for long sessions and Android PWA users!

---

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
- ✅ **Activity Tracking** - Track steps, calories, active minutes, resting heart rate, stress, sleep, Body Battery, HRV (v1.6+)
- ✅ **Data Validation** - Smart parsing with error handling and format detection
- ✅ **Duplicate Detection** - Prevents importing same data twice
- ✅ **Copy-Paste Support** - Tab-separated format for data not available as CSV (v1.6+)
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
│   ├── useWeights.ts                 ✅ Weights with auto-sync
│   ├── useDebounce.ts                ✅ Generic debounce hook (v1.6.1+)
│   └── useSwipeTabs.ts               ✅ Swipe gesture navigation (v1.6.2+)
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

### Current (v1.6.2)
- **React 18** + **TypeScript 5**
- **Vite 5** - Build tool
- **Tailwind CSS 3** - Styling
- **Dexie.js 3.2** - IndexedDB wrapper
- **Chart.js 4.5** + **react-chartjs-2** - Visualizations
- **jsPDF 2.5** + **jspdf-autotable** - PDF generation
- **html5-qrcode** - Barcode scanning
- **react-swipeable 7.0** - Touch gesture detection
- **Supabase 2.81** - Backend for OAuth token management
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

**DailyActivity** (Fitness Tracking - v1.5+)
```typescript
{
  id: string;
  date: string;              // YYYY-MM-DD
  totalCalories: number;     // Totaal verbruik (kcal)
  activeCalories: number;    // Actieve calorieën (kcal)
  restingCalories: number;   // BMR/rustcalorieën (kcal)
  steps: number;             // Aantal stappen
  intensityMinutes?: number; // Actieve minuten
  distanceMeters?: number;   // Totale afstand in meters
  floorsClimbed?: number;    // Verdiepingen
  heartRateResting?: number; // Rusthartslag (bpm)
  heartRateMax?: number;     // Max hartslag (bpm)
  stressLevel?: number;      // Stress (0-100)
  bodyBattery?: number;      // Body Battery (0-100, Garmin-specific)
  sleepSeconds?: number;     // Slaapduur in seconden
  hrvOvernight?: number;     // v1.6+ HRV Overnight meting (ms)
  hrv7DayAvg?: number;       // v1.6+ HRV 7-day average (ms)
  activities?: FitnessActivity[]; // Specifieke workouts
  created_at: string;
  updated_at: string;
  deleted?: boolean;         // Soft delete flag
  deleted_at?: string;       // Deletion timestamp
}
```

**HeartRateSamples** (Intraday HR Data - v1.7+)
```typescript
{
  date: string;                    // Primary key: YYYY-MM-DD
  samples: HeartRateSample[];      // Array of ~680 intraday samples
  sampleCount: number;             // Number of samples
  minBpm: number;                  // Minimum BPM for the day
  maxBpm: number;                  // Maximum BPM for the day
  avgBpm: number;                  // Average BPM for the day
  created_at: string;              // ISO timestamp
  updated_at: string;              // ISO timestamp
  deleted?: boolean;               // Soft delete flag
}

interface HeartRateSample {
  timestamp: number;               // Unix timestamp (milliseconds)
  bpm: number;                     // Heart rate in beats per minute
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

### Fixed in v1.6.2
- ✅ Mobile table overflow - nutrition info and charts now scroll horizontally
- ✅ Missing swipe navigation - added native app-like swipe gestures for tabs

### Fixed in v1.6.1
- ✅ Duplicate entries after sync when meal time edited - ID preservation now prevents this
- ✅ Soft-deleted items cleanup not working - now uses *IncludingDeleted() methods
- ✅ OAuth popup appearing when app idle - automatic refresh attempts before showing popup
- ✅ Infinite update loop (200+ items updating every sync) - timestamps now preserved
- ✅ Search performance - debouncing reduces filtering operations during typing

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

### v1.7.0 (January 2025) - Current
**Heart Rate Visualization - Intraday Charts with Zones & Statistics**
- ✅ Intraday heart rate visualization with ~680 samples per day
- ✅ Heart rate zones with colored backgrounds (5 zones based on max HR)
- ✅ Collapsible statistics panel (compact/expanded views)
- ✅ Resting HR heatmap integration (8-week calendar)
- ✅ Clickable heatmap days to show detailed intraday charts
- ✅ Heart indicators (💓) on days with intraday sample data
- ✅ 2 new HR stats cards (Ø Rust HR, Ø Max HR)
- ✅ Responsive SVG chart with dynamic width scaling
- ✅ Database v9 with heartRateSamples table
- ✅ useHeartRateSamples hook and HeartRateChart component
- ✅ TypeScript type definitions (HeartRateSample, DayHeartRateSamples)

### v1.6.2 (January 2025)
**Mobile UX Improvements - Swipe Gestures & Table Overflow Fixes**
- ✅ Swipe left/right to navigate between tabs (Analyze & Data pages)
- ✅ useSwipeTabs hook with conflict prevention (50px min distance)
- ✅ Mobile table overflow fixes (ProductsPortionsTab, TrendsTab)
- ✅ react-swipeable library integration
- ✅ Native app-like navigation experience

### v1.6.1 (January 2025)
**Critical Sync Bugfixes & Search Performance**
- ✅ Fixed duplicate entries bug (ID preservation during sync)
- ✅ Fixed soft-deleted items cleanup (getAllEntriesIncludingDeleted)
- ✅ Fixed OAuth popup on idle (auto-refresh on startup)
- ✅ Fixed infinite update loop (preserve cloud timestamps)
- ✅ Search debouncing (useDebounce hook, 300ms delay)

### v1.6.0 (January 2025)
**Automatic OAuth Token Refresh + HRV Tracking**
- ✅ Authorization Code Flow with Supabase Edge Functions
- ✅ Automatic token refresh every 50 minutes
- ✅ HRV tracking (overnight + 7-day average)
- ✅ Enhanced CSV import with Garmin format support
- ✅ Zero user interaction for token management

### v1.5.0 (January 2025)
**Templates, Integrations & Smart Sync**
- ✅ Meal templates with favorites and quick add
- ✅ Garmin Connect CSV import
- ✅ Smart token management with proactive warnings
- ✅ Sync service fixes (duplicate barcode, entry conflicts)

### v1.4.0 (January 2025)
**Data Management Page**
- ✅ Data page met 3 tabs (Producten & Porties, Templates, Import/Export)
- ✅ Full CRUD modals voor producten, porties en templates
- ✅ Inline portie weergave en default portie support
- ✅ Uniforme emoji button stijl (⭐✏️🗑️)

### v1.3.0 (January 2025)
**Porties & Templates**
- ✅ Portie templates database (50+ producten)
- ✅ Meal templates met categorieën en favorites
- ✅ Quick add sectie voor snelle maaltijd logging
- ✅ Cloud sync v1.3 met portions/templates support

### v1.2.1 (January 2025)
**Cloud Sync Fixes & Mobile UX**
- ✅ Auto-sync voor products en settings
- ✅ Offline changes sync bij reconnect
- ✅ Tab navigatie op Journal Page
- ✅ AddMealModal sticky footer en compact badges

### v1.2.0 (November 2024)
**PDF Reporting & Dashboard**
- ✅ Consolidated PDF generator met 2x2 graph grid
- ✅ Monthly reports met multi-month selectie
- ✅ CSV export met alle 8 metrics
- ✅ Dual period selectors

### v1.1.0 (November 2024)
**Cloud Sync Launch**
- ✅ End-to-end encrypted Google Drive sync
- ✅ Automatic bidirectional merge
- ✅ 8 metrics dashboard met projecties
- ✅ Safe merge (no data loss)

### v1.0.0 (November 2024)
**PWA + OpenFoodFacts**
- ✅ Progressive Web App met offline support
- ✅ Barcode scanner + OpenFoodFacts integratie
- ✅ Installeerbaar op alle platforms

### v0.9.0 (October 2024)
**Initial Release**
- ✅ 6 tabs (Journal, Tracking, Dashboard, Analyse, Data, Settings)
- ✅ Responsive mobile design
- ✅ PDF/TXT reports

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

**Last Updated:** January 14, 2025
**Status:** v1.7.0 - Heart Rate Visualization (Intraday Charts with Zones & Statistics)
**Next:** Performance optimizations (memoization) & Chart.js config deduplication
