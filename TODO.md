# TODO - Volgende Sessie

## ~~Sync Improvements - Consistente Soft Delete~~ ✅ COMPLETED

### Probleem
Momenteel hebben verschillende data types inconsistente delete strategieën:

**Met soft delete:**
- ✅ ProductPortions (`deleted`, `deleted_at`)
- ✅ MealTemplates (`deleted`, `deleted_at`)
- ✅ Weights (`deleted`, `deleted_at`)

**Zonder soft delete (hard delete):**
- ❌ Entries (geen `deleted` veld)
- ❌ Products (geen `deleted` veld)
- ❌ DailyActivities (geen `deleted` veld)

Dit kan sync problemen veroorzaken: als je een entry op mobiel hard-deletet, en later merged met desktop, kan de entry weer terug komen omdat de desktop versie niet weet dat hij verwijderd is.

### Taken

#### 1. Database Schema Updates ✅
- [x] Voeg `deleted?: boolean` veld toe aan Entry type (was al aanwezig)
- [x] Voeg `deleted_at?: string` veld toe aan Entry type (was al aanwezig)
- [x] Voeg `deleted?: boolean` veld toe aan Product type (was al aanwezig)
- [x] Voeg `deleted_at?: string` veld toe aan Product type (was al aanwezig)
- [x] Voeg `deleted?: boolean` veld toe aan DailyActivity type
- [x] Voeg `deleted_at?: string` veld toe aan DailyActivity type

#### 2. Service Updates ✅
- [x] Entries Service: Filter op `deleted !== true` in getAllEntries
- [x] Entries Service: Voeg `getAllEntriesIncludingDeleted()` toe
- [x] Entries Service: Update `deleteEntry()` naar soft delete (was al soft delete)
- [x] Products Service: Filter op `deleted !== true` in getAllProducts
- [x] Products Service: Voeg `getAllProductsIncludingDeleted()` toe
- [x] Products Service: Update `deleteProduct()` naar soft delete (was al soft delete)
- [x] Activities Service: Filter op `deleted !== true` in getAllActivities
- [x] Activities Service: Voeg `getAllActivitiesIncludingDeleted()` toe
- [x] Activities Service: Update delete functie naar soft delete

#### 3. Sync Service Updates ✅
- [x] Update `exportAllData()` om deleted items mee te nemen (zoals bij portions/templates)
- [x] Update merge to use *IncludingDeleted() voor entries, products, activities
- [x] Zorg dat merge logica deleted status respecteert voor alle types
- [x] Test dat deleted items correct syncen tussen devices

#### 4. UI Updates ✅
- [x] Delete acties gebruiken al soft delete via services (entries, products, activities)
- [ ] Optioneel: "Recent verwijderd" view om soft-deleted items te tonen/herstellen

#### 5. Console Logging Uitbreiden ✅
- [x] Toon in console hoeveel items van totaal soft-deleted zijn bij export
  - `📤 Preparing export with: { entries: "189 (12 deleted)", products: "98 (5 deleted)", ... }`
- [x] Toon in console hoeveel items van totaal soft-deleted zijn bij merge
  - `📊 Cloud data contains: { entries: "189 (12 deleted)", products: "98 (5 deleted)", ... }`

### Voordelen
- **Consistentie**: Alle data types werken hetzelfde
- **Data veiligheid**: Geen accidenteel permanent verlies van data
- **Sync betrouwbaarheid**: Deleted status wordt correct gesynchroniseerd
- **Debugbaarheid**: Duidelijk overzicht van deleted items in console

### Opmerkingen
- Dit is een breaking change voor bestaande data (migratie nodig)
- Overweeg een cleanup functie voor items die >30 dagen deleted zijn
- Test grondig met sync scenario's: delete op A, sync naar B, modify op B, sync terug naar A
