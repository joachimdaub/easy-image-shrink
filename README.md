# Easy Image Shrink

Eine minimale, selbst hostbare Bildverkleinerung für Kunden. **Keine Bild-Uploads:** Alles wird im Browser verarbeitet. PHP prüft lediglich den Zugriffstoken.

## Funktionen

- Bilder per Drag & Drop oder Dateiauswahl hinzufügen – **Verarbeitung und Download starten automatisch**
- Ein Bild → Download im Originalformat (standardmäßig); mehrere Bilder → ZIP-Datei
- Breite in Pixeln (`w=1200`) und Qualität (`q=high|medium|low`) über URL **oder direkt im Formular**
- Seitenverhältnis bleibt erhalten; kleine Bilder werden nicht hochskaliert; **kein Zuschnitt**
- Ausgabeformat optional über `format=original|webp|jpg|png`; Standard `original` (JPG bleibt JPG, PNG bleibt PNG, WebP bleibt WebP)
- JPEG/WebP werden mit der gewählten Qualität kodiert; PNG wird über Canvas neu kodiert (die Qualitätsstufe beeinflusst PNG nicht).
- SVG bleibt mit `format=original` SVG (Vektorformat, keine Pixelbreitenbegrenzung); bei explizitem Rasterformat wird es konvertiert. Aktive Inhalte und externe Verweise werden aus Sicherheitsgründen entfernt. SVG-Animationen und CSS-basierte SVG-Designs werden nicht vollständig unterstützt.
- Kein Framework, keine Datenbank, keine externen Bibliotheken, kein Build-Schritt, kein CDN
- Server benötigt nur PHP 7.4+ zum Prüfen des Tokens; Browser benötigt aktuelle Canvas-, Blob- und Download-Unterstützung

## Installation (Shared Hosting / PHP-Webspace)

1. Projektdateien in einen eigenen Ordner auf dem Webspace kopieren.
2. `config.example.php` nach `config.local.php` kopieren.
3. In `config.local.php` einen eigenen, zufällig erzeugten Token eintragen (mindestens 24 Zeichen):
   ```sh
   php -r "echo bin2hex(random_bytes(24)), PHP_EOL;"
   ```
   Ohne PHP-CLI kannst du einen sicheren Passwortmanager zur Erzeugung von 48 zufälligen Hex-Zeichen verwenden.
4. URL mit dem Token aufrufen:
   `https://bilder.example.de/?token=DEIN_TOKEN&w=1200&q=medium`
5. Die Seite **nur über HTTPS** anbieten.

**Wichtig:** `config.local.php` darf nicht in ein öffentliches Git-Repository übernommen werden. `.gitignore` schließt sie aus. Bei Standard-PHP-Hosting wird die Datei nicht als Quelltext ausgegeben. Wenn dein Hosting PHP-Dateien als Downloads ausliefert, ist es unsicher und nicht geeignet.

### URL-Parameter

| Parameter | Werte | Standard |
|---|---|---|
| `token` | Geheimer Token aus `config.local.php` | erforderlich |
| `w` | Ganze Zahl 320–4000 | `1200` |
| `q` | `high`, `medium`, `low` | `medium` |
| `format` | `original`, `webp`, `jpg`, `png` | `original` |

Die Qualität verwendet Canvas-Encoderwerte 0,92 / 0,82 / 0,68 für JPEG/WebP (bei PNG nicht wirksam). Das ist **visuell verlustbehaftete** Komprimierung, nicht pixelgenau verlustfrei. Breite und Qualität sind in der Oberfläche anpassbar; die URL wird entsprechend aktualisiert.

## Einschränkungen

- Das PHP-Gate schützt den Seitenaufruf, **nicht** die öffentlich erreichbaren statischen JS-/CSS-Dateien. Die enthalten aber keine Geheimnisse oder Bilddaten.
- Wer den Token-Link besitzt, kann die Seite öffnen. Token können in Browser-Verlauf, Logfiles und bei unsachgemäßer Weitergabe auftauchen. `Referrer-Policy: no-referrer` verhindert den Token-Versand als Referrer. Bei Bedarf Token ändern.
- Kein serverseitiger Bild-Upload und keine Speicherung auf dem Webspace.
- Maximal 50 Dateien je Durchlauf, 40 MB je Datei und 80 Millionen Pixel je Quellbild (Speicherschutz; auf schwachen Geräten können geringere Grenzen nötig sein).
- ZIP nutzt die STORE-Methode (ohne zusätzliche ZIP-Komprimierung).
- Je nach Browser kann ein automatisch ausgelöster Download blockiert sein; dann ist ein manueller Downloadlink verfügbar.
- Manche Handybilder enthalten Metadaten wie EXIF-Ausrichtung. Moderne Browser berücksichtigen sie meist beim Dekodieren; bei exotischen Formaten/Browsern bitte prüfen.
- Der Browser kodiert neu. Schon stark optimierte Bilder können dadurch *größer* werden; eine garantierte Größenreduktion gibt es nicht.
- Metadaten wie GPS/EXIF werden beim Neuzeichnen über Canvas normalerweise entfernt.

## Lokal testen

```sh
cp config.example.php config.local.php
# Token in config.local.php ersetzen
php -S 127.0.0.1:8080
# http://127.0.0.1:8080/?token=DEIN_TOKEN
```

PHP: `php -l index.php` / JS: `node --check assets/app.js`.

## Sicherheit und Lizenz

Minimaler PHP-Gate via `hash_equals` und HTTP-Sicherheitsheadern; keine Sessions, Cookies, Uploads oder POST-Requests erforderlich. Die lokale Bildverarbeitung erfolgt ohne Netzwerkzugriffe. MIT-Lizenz, siehe [LICENSE](LICENSE).
