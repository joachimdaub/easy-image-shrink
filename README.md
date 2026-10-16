# Easy Image Shrink

A tiny, self-hostable browser-based image resizer for non-technical users. Drop images onto the page and downloads start automatically. **Images never leave the device.**

No backend, database, framework, third-party dependencies, build step, or CDN.

## Features

- Drag and drop or select images; conversion starts immediately
- One successful image: direct download; multiple successful images: one ZIP
- Defaults: maximum width **1920 px**, quality **medium**, output format **original**
- Preserve aspect ratio; **never upscale** smaller images; no cropping
- Reject outputs larger than their source file and suggest reducing width or quality
- Keep original format (JPEG, PNG, WebP, SVG) by default, or choose JPEG/PNG/WebP output
- Append `-optimiert` to filenames (e.g. `photo-optimiert.jpg`)
- Editable controls with URL parameter support; no uploads or data storage
- Simple ZIP writer with no dependencies

## Quick start

Copy `index.html` and the `assets/` folder to any static web host, including basic/free hosting.

Open `https://your-site.example/?w=1920&q=medium`.

For local testing:

```sh
python3 -m http.server 8080
# Visit http://localhost:8080/
```

You can also open `index.html` directly in a modern browser. The user interface is currently in German.

## Configuration

All URL parameters are optional. Controls on the page also let users change these settings.

| Parameter | Allowed values | Default |
| --- | --- | --- |
| `w` | Integer 320–4000 (maximum width in pixels) | `1920` |
| `q` | `high`, `medium`, `low` | `medium` |
| `format` | `original`, `jpg`, `png`, `webp` | `original` |

Example: `https://your-site.example/?w=1200&q=high&format=webp`

JPEG and WebP use browser Canvas quality settings 0.92 / 0.82 / 0.68. These are **lossy** encodings, not mathematically lossless. Canvas PNG output ignores the quality setting. A file larger than its source is rejected, not downloaded.

## Supported formats and caveats

| Input | Default output | Notes |
| --- | --- | --- |
| JPEG | JPEG | Re-encoded; embedded metadata is typically removed |
| PNG | PNG | Lossless Canvas output, but file size may grow |
| WebP | WebP | Encoding depends on browser support |
| SVG | SVG | Sanitized vector content; width/quality do not apply in original mode |

Explicit `format=jpg|png|webp` rasterizes SVG. The SVG sanitizer deliberately removes active and external content and may alter complex artwork; **do not rely on it as a general-purpose SVG sanitizer for untrusted distribution**. SVG animations and some CSS-based designs are not preserved.

Other limitations:

- Up to 50 files per batch, 40 MiB per file, and 80 million source pixels
- Browser memory, Canvas dimensions, format encoders, and automatic download policies vary (particularly on mobile Safari)
- If an encoder cannot produce the requested format, conversion fails with a message instead of silently changing formats
- Automatic downloads may be blocked; manual links remain available
- ZIP files use STORE (no additional ZIP compression)
- For raster files, re-encoding generally strips EXIF/GPS metadata; test orientation handling on your target browsers
- SVG original-mode output can become larger due to sanitization; in that case the output is rejected
- No guarantee of size reduction for already optimized images

## Privacy and security

Image pixels are processed locally by browser APIs; the app does not upload images or call a remote image optimization service. There are no authentication tokens, cookies, accounts, or backend. Hosting requests for the static application files still appear in normal hosting logs. Serve it over HTTPS.

See [SECURITY.md](SECURITY.md) for vulnerability reports and [CONTRIBUTING.md](CONTRIBUTING.md) for contributions.

## Development

There is no package manager or build process. Run:

```sh
node --check assets/app.js
```

Please test changes in current Chromium, Firefox, and Safari browsers, including single and ZIP downloads. Browser behavior has not been comprehensively verified across platforms yet.

## Manual testing status

The maintainer has confirmed successful multiple-image uploads and processing in Firefox and Safari, including automatic downloads in Safari. Exact browser versions and operating systems were not recorded. These are manual checks, not an automated cross-browser test suite.

Chrome/Edge verification and a dedicated security review of SVG handling remain outstanding.

## License

[MIT](LICENSE).
