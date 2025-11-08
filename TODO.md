# TODO - Volgende Sessie

## Sync Improvements - Consistente Soft Delete

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

#### 1. Database Schema Updates
- [ ] Voeg `deleted?: boolean` veld toe aan Entry type
- [ ] Voeg `deleted_at?: string` veld toe aan Entry type
- [ ] Voeg `deleted?: boolean` veld toe aan Product type
- [ ] Voeg `deleted_at?: string` veld toe aan Product type
- [ ] Voeg `deleted?: boolean` veld toe aan DailyActivity type
- [ ] Voeg `deleted_at?: string` veld toe aan DailyActivity type

#### 2. Service Updates
- [ ] Entries Service: Filter op `deleted !== true` in getAllEntries
- [ ] Entries Service: Voeg `getAllEntriesIncludingDeleted()` toe
- [ ] Entries Service: Update `deleteEntry()` naar soft delete
- [ ] Products Service: Filter op `deleted !== true` in getAllProducts
- [ ] Products Service: Voeg `getAllProductsIncludingDeleted()` toe
- [ ] Products Service: Update `deleteProduct()` naar soft delete
- [ ] Activities Service: Filter op `deleted !== true` in getAllActivities
- [ ] Activities Service: Voeg `getAllActivitiesIncludingDeleted()` toe
- [ ] Activities Service: Update delete functie naar soft delete

#### 3. Sync Service Updates
- [ ] Update `exportAllData()` om deleted items mee te nemen (zoals bij portions/templates)
- [ ] Zorg dat merge logica deleted status respecteert voor alle types
- [ ] Test dat deleted items correct syncen tussen devices

#### 4. UI Updates
- [ ] Update delete acties voor entries naar soft delete
- [ ] Update delete acties voor products naar soft delete
- [ ] Update delete acties voor activities naar soft delete
- [ ] Optioneel: "Recent verwijderd" view om soft-deleted items te tonen/herstellen

#### 5. Console Logging Uitbreiden
- [ ] Toon in console hoeveel items van totaal soft-deleted zijn bij merge
  - Bijvoorbeeld: `📊 Cloud data contains: { entries: 189 (12 deleted), products: 98 (5 deleted), ... }`
- [ ] Toon in merge summary hoeveel deleted items zijn gemerged
  - Bijvoorbeeld: `✅ Entries: 0 added, 0 updated, 189 skipped (12 soft-deleted)`

### Voordelen
- **Consistentie**: Alle data types werken hetzelfde
- **Data veiligheid**: Geen accidenteel permanent verlies van data
- **Sync betrouwbaarheid**: Deleted status wordt correct gesynchroniseerd
- **Debugbaarheid**: Duidelijk overzicht van deleted items in console

### Opmerkingen
- Dit is een breaking change voor bestaande data (migratie nodig)
- Overweeg een cleanup functie voor items die >30 dagen deleted zijn
- Test grondig met sync scenario's: delete op A, sync naar B, modify op B, sync terug naar A
