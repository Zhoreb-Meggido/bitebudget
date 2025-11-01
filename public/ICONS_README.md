# PWA Icons Genereren

De app gebruikt momenteel placeholder icons. Voor een professionele PWA heb je echte PNG icons nodig.

## Optie 1: Online Icon Generator (Makkelijkst)

Gebruik een gratis online tool:

1. **PWA Asset Generator**: https://www.pwabuilder.com/imageGenerator
   - Upload `icon.svg` of een eigen ontwerp (512x512 PNG/SVG)
   - Download het gegenereerde pakket
   - Kopieer de bestanden naar `/public/`

2. **RealFaviconGenerator**: https://realfavicongenerator.net/
   - Upload je icon
   - Selecteer "iOS", "Android", "Windows"
   - Download en extract naar `/public/`

## Optie 2: Handmatig met ImageMagick

Als je ImageMagick geïnstalleerd hebt:

```bash
# In de /public folder
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png
```

## Optie 3: Eigen ontwerp maken

Maak een 512x512 PNG met je favoriete design tool:
- Figma (gratis)
- Canva (gratis)
- Adobe Illustrator
- Inkscape (gratis, open-source)

### Design tips:
- Gebruik een herkenbaar symbool (vork/lepel, apple, plate)
- Achtergrondkleur: `#3b82f6` (blauw, zoals de app theme)
- Icoon kleur: wit of contrast kleur
- Minimalistisch design (goed zichtbaar op klein formaat)
- Veilige zone: 80% van de canvas (20% margin voor maskable icons)

## Benodigde bestanden:

- `icon-192.png` - Voor Android homescreen
- `icon-512.png` - Voor splash screen en app store
- `icon.svg` (optioneel) - Voor toekomstige regeneratie

## Na generatie:

Vervang de placeholder bestanden in `/public/` met je nieuwe icons.

Geen wijzigingen nodig aan `manifest.json` - de bestandsnamen kloppen al!
