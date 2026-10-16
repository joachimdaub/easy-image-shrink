# Easy Image Shrink v0.1.0

The first public beta of **Easy Image Shrink**: a tiny, self-hostable image resizer that works entirely in your browser.

Drop one or more images, resize them automatically, and download the result — as a single image or a ZIP archive. Images never leave your device.

### Highlights
- Zero dependencies, no framework, backend, database or build process
- Works on basic static hosting and can be deployed to GitHub Pages
- Optional URL settings: `w=1920`, `q=medium`, `format=original`
- Keeps the original image format unless conversion is explicitly requested
- Never upscales images and rejects output files larger than their originals
- Hardened SVG parsing with restrictive allowlists and automated security regression tests
- Manual functionality checks reported for Firefox, Safari, Chrome and Edge

### Installation
Download the source archive and upload `index.html` and `assets/` to a static web host. See [README.md](../README.md) for the full guide.

### Limitations
The user interface is currently in German. Certain SVG effects, CSS, external references and animations are intentionally unsupported. Browser codec and download support varies by platform.

### Feedback
Report reproducible bugs or enhancement requests through GitHub Issues. Please follow [SECURITY.md](../SECURITY.md) for vulnerability reports.

### License
MIT.
