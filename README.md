# Easy Image Shrink

Eine minimale, selbst hostbare Bildverkleinerung für Kunden. **Keine Bild-Uploads:** Alles wird im Browser verarbeitet. Die Anwendung besteht ausschließlich aus HTML, CSS und JavaScript – ohne Serververarbeitung.

## Funktionen

- Bilder per Drag & Drop oder Dateiauswahl hinzufügen – **Verarbeitung und Download starten automatisch**
- Ein Bild → Download im Originalformat (standardmäßig); mehrere Bilder → ZIP-Datei
- Breite in Pixeln (`w=1200`) und Qualität (`q=high|medium|low`) über URL **oder direkt im Formular**
- Seitenverhältnis bleibt erhalten; kleine Bilder werden nicht hochskaliert; **kein Zuschnitt**
- Ausgabeformat optional über `format=original|webp|jpg|png`; Standard `original` (JPG bleibt JPG, PNG bleibt PNG, WebP bleibt WebP)
- JPEG/WebP werden mit der gewählten Qualität kodiert; PNG wird über Canvas neu kodiert (die Qualitätsstufe beeinflusst PNG nicht).
- SVG bleibt mit `format=original` SVG (Vektorformat, keine Pixelbreitenbegrenzung); bei explizitem Rasterformat wird es konvertiert. Aktive Inhalte und externe Verweise werden aus Sicherheitsgründen entfernt. SVG-Animationen und CSS-basierte SVG-Designs werden nicht vollständig unterstützt.
- Kein Framework, keine Datenbank, keine externen Bibliotheken, kein Build-Schritt, kein CDN
- Kein PHP erforderlich; Browser benötigt aktuelle Canvas-, Blob- und Download-Unterstützung

## Installation

1. Repository-Inhalt auf einen beliebigen statischen Webspace kopieren oder über GitHub Pages ausliefern.
2. `index.html` im Browser aufrufen, zum Beispiel:
   `https://bilder.example.de/?w=1200&q=medium`
3. HTTPS ist für öffentliches Hosting empfehlenswert.

Es gibt keine Zugangsbeschränkung. Die Dateien können öffentlich aufgerufen werden, aber Bilder werden ausschließlich lokal im Browser verarbeitet.

### URL-Parameter

| Parameter | Werte | Standard |
|---|---|---|
| `w` | Ganze Zahl 320–4000 | `1200` |
| `q` | `high`, `medium`, `low` | `medium` |
| `format` | `original`, `webp`, `jpg`, `png` | `original` |

Die Qualität verwendet Canvas-Encoderwerte 0,92 / 0,82 / 0,68 für JPEG/WebP (bei PNG nicht wirksam). Das ist **visuell verlustbehaftete** Komprimierung, nicht pixelgenau verlustfrei. Breite und Qualität sind in der Oberfläche anpassbar; die URL wird entsprechend aktualisiert.

## Einschränkungen

- Kein serverseitiger Bild-Upload und keine Speicherung auf dem Webspace.
- Maximal 50 Dateien je Durchlauf, 40 MB je Datei und 80 Millionen Pixel je Quellbild (Speicherschutz; auf schwachen Geräten können geringere Grenzen nötig sein).
- ZIP nutzt die STORE-Methode (ohne zusätzliche ZIP-Komprimierung).
- Je nach Browser kann ein automatisch ausgelöster Download blockiert sein; dann ist ein manueller Downloadlink verfügbar.
- Manche Handybilder enthalten Metadaten wie EXIF-Ausrichtung. Moderne Browser berücksichtigen sie meist beim Dekodieren; bei exotischen Formaten/Browsern bitte prüfen.
- Der Browser kodiert neu. Schon stark optimierte Bilder können dadurch *größer* werden; eine garantierte Größenreduktion gibt es nicht.
- Metadaten wie GPS/EXIF werden beim Neuzeichnen über Canvas normalerweise entfernt.

## Lokal testen

```sh
python -m http.server 8080
# http://127.0.0.1:8080/?w=1200&q=medium
```

Alternativ `index.html` direkt im Browser öffnen. JS-Syntax: `node --check assets/app.js`.

## Sicherheit und Lizenz

Keine Sessions, Cookies, Uploads oder POST-Requests. Die lokale Bildverarbeitung benötigt keine Netzwerkzugriffe. MIT-Lizenz, siehe [LICENSE](LICENSE).
