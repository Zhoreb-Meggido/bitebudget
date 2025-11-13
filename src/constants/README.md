# Version Management

Dit bestand centraliseert alle versie-gerelateerde constanten in de applicatie.

## Versie Types

### 1. App Version (`APP_VERSION`)
- **Bron**: `package.json` → `version` field
- **Huidige waarde**: `1.6.4`
- **Gebruik**:
  - Service Worker versioning (cache invalidation)
  - "Over" pagina in de UI
  - Debug logging

**Wanneer verhogen:**
- Nieuwe features: verhoog minor version (1.6.4 → 1.7.0)
- Bugfixes: verhoog patch version (1.6.4 → 1.6.5)
- Breaking changes: verhoog major version (1.6.4 → 2.0.0)

### 2. Backup Schema Version (`BACKUP_SCHEMA_VERSION`)
- **Bron**: Dit bestand
- **Huidige waarde**: `1.5`
- **Gebruik**:
  - Export/import functionaliteit
  - Google Drive sync
  - Backward compatibility checks

**Wanneer verhogen:**
- Alleen bij DATA STRUCTUUR wijzigingen
- Nieuwe database tabellen toegevoegd
- Nieuwe velden aan bestaande tabellen
- Verwijderen van verplichte velden

## Version History

| Schema Version | App Version | Toegevoegd | Beschrijving |
|---------------|-------------|------------|--------------|
| 1.0 | 1.0.0 - 1.2.x | 2024-Q1 | Initial schema: entries, products, weights, settings |
| 1.3 | 1.3.0 - 1.4.x | 2024-Q2 | Added: productPortions, mealTemplates |
| 1.5 | 1.5.0+ | 2024-Q4 | Added: dailyActivities (Google Fit integration) |

## Gebruik in Code

### App Version tonen
```typescript
import { APP_VERSION } from '@/constants/versions';

console.log(`BiteBudget v${APP_VERSION}`);
```

### Backup Schema Version
```typescript
import { BACKUP_SCHEMA_VERSION } from '@/constants/versions';

const backup = {
  version: BACKUP_SCHEMA_VERSION.CURRENT,
  // ... data
};
```

### Feature Detection
```typescript
import { supportsFeature } from '@/constants/versions';

if (supportsFeature(backupData.version, 'activities')) {
  // Process activities data
}
```

## Backward Compatibility

De app ondersteunt het importeren van oude backup formaten:

- **v1.0 backups**: Entries, products, weights, settings
- **v1.3 backups**: + portions, templates
- **v1.5 backups**: + daily activities

Ontbrekende velden worden automatisch overgeslagen tijdens import.

## Veelgestelde Vragen

**Q: Moet ik beide versies verhogen?**
A: Nee!
- Verhoog `APP_VERSION` (in package.json) bij elke release
- Verhoog `BACKUP_SCHEMA_VERSION` alleen bij data structuur wijzigingen

**Q: Wat gebeurt er als iemand een oude backup probeert te importeren?**
A: De import detecteert de versie en voert een migratie uit. Ontbrekende velden worden genegeerd.

**Q: Kan ik een backup van versie 1.5 importeren in een app met versie 1.3?**
A: Nee, dat wordt geblokkeerd. De app zou de nieuwe velden niet herkennen.

## TODO

- [ ] App versie tonen in Settings → About sectie
- [ ] Backup versie validatie bij import (waarschuwing als versie nieuwer is)
- [ ] Migratie scripts voor oude schema versies
