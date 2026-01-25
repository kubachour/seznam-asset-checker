# Seznam Creative Validator

Nástroj pro validaci a export reklamních bannerů pro Seznam reklamní systémy (SOS, Onegar, Sklik, Adform, HP Exclusive).

## Hlavní funkce

### 📤 Nahrávání souborů
- **Drag & drop**: Přetažení obrázků, složek nebo ZIP archivů
- **Rekurzivní procházení**: Automatické prohledání všech podsložek
- **Podporované formáty**: JPG, PNG, GIF
- **Barevný prostor**: Detekce a validace RGB/CMYK

### ✅ Validace
- **Automatická kontrola**: Rozměry, velikost souborů, barevný prostor
- **Inteligentní přiřazení**: Detekce systému podle struktury složek
- **Tier rozdělení**: Automatická kategorizace LOW/HIGH tier
- **Podpora Zboží.cz**: Speciální pravidla pro zbožové kampaně

### 🔗 Generování UTM URL
- **Seznam tagging standard**: Automatická normalizace (diakritika, mezery)
- **UTM parametry**: utm_source, utm_medium, utm_campaign, utm_content, utm_term
- **Zbozi kampaně**: Speciální pravidla pro pozici, datum a službu
- **Náhled URL**: Živý náhled generovaných URL v kroku 3

### 📦 Export
- **Jednotlivé balíčky**: Export pro každý systém/tier zvlášť
- **Hromadný export**: Stažení všech systémů najednou v jednom ZIP
- **Přejmenování souborů**: Automatické přejmenování podle kampaně a systému
- **XLS soubory**: Export s URL, UTM parametry a metadaty pro každý systém

### ⚙️ Konfigurace
- **Kampaň a content**: Globální nastavení pro všechny bannery
- **Datum rozsah**: Pro HIGH tier zbožové kampaně
- **Individuální úpravy**: Formát, služba a ukotvení pro každý banner
- **Tooltips**: Podrobné informace o pravidlech pojmenování

## Použití

### 1. Nahrání bannerů (Krok 1)
Přetáhněte bannery, složky nebo ZIP soubory do upload zóny. Nástroj automaticky:
- Rozbalí ZIP archivy
- Prohledá všechny podsložky
- Analyzuje rozměry a velikosti
- Zkontroluje barevný prostor

### 2. Výsledek validace (Krok 2)
Zobrazí kompatibilní systémy pro každý banner s detaily:
- Počet validních bannerů
- Počet kampaňových assetů
- Seznam všech formátů
- Tooltips s podporovanými formáty

### 3. Nastavení exportu (Krok 3)
Vyplňte globální parametry:
- Název kampaně
- Content (základní název kreativy)
- Landing page URL
- Zbozi toggle (volitelné) + datum rozsah

### 4. Výběr systémů (Krok 4)
Vyberte systémy a bannery pro export:
- Zaškrtněte požadované systémy
- Vyberte konkrétní bannery (nebo všechny)
- Náhled počtu assetů

### 5. Export (Krok 5)
Stáhněte balíčky:
- **Jednotlivé**: Každý systém/tier zvlášť
- **Všechny najednou**: Jeden ZIP se všemi systémy ve složkách
- Každý balíček obsahuje přejmenované bannery + export.xlsx

## Zbozi.cz kampaně

Pro kampaně na Zboží.cz zaškrtněte toggle v kroku 3. Systém aplikuje speciální pravidla:

**LOW tier:**
- `utm_campaign`: zbozi_low_{rok}
- `utm_content`: kampan-content-rozmery (vše pomlčky)
- `utm_term`: pozice (wallpaper, skyscraper...)

**HIGH tier:**
- `utm_campaign`: kampan_sluzba_pozice_datum
- `utm_content`: kampan-content-rozmery (vše pomlčky)
- `utm_term`: sluzba_pozice

## Vývoj

Čistá JavaScript aplikace bez build procesu. Pro lokální spuštění:

```bash
python3 -m http.server 8000
# nebo
npx serve
```

Poté otevřete http://localhost:8000

## Technologie

- Vanilla JavaScript (ES6+)
- HTML5 File APIs (drag-and-drop, file reading)
- JSZip (vytváření ZIP archivů)
- SheetJS (generování XLS souborů)
- CSS3 (responzivní design)

## Verzování

Aplikace používá sémantické verzování `v1.0.X` kde X se inkrementuje s každým commitem. Aktuální verze je zobrazena v patičce aplikace.
