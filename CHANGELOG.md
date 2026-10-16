# Changelog

All notable changes to Easy Image Shrink are documented here.

## [Unreleased]

## [0.1.0] - 2026-10-16

### Added
- Static, dependency-free client-side image resizing with drag-and-drop and file picker.
- Automatic single-image downloads and ZIP downloads for multiple images.
- Configurable maximum width (`w`, default 1920 pixels), quality (`q`, default `medium`) and output format (`format`, default `original`).
- Preservation of input formats (JPEG, PNG, WebP, SVG) by default; optional JPEG, PNG and WebP conversion.
- `-optimiert` suffix for downloaded images.
- SVG sanitization using an explicit element/attribute allowlist and input complexity limits.
- Chromium-based SVG security regression tests through GitHub Actions.
- English project documentation, contribution and security policies.

### Behavior
- Images are never upscaled or cropped.
- An output larger than its source is rejected, with guidance to adjust settings.
- Image processing runs locally in the browser; no image upload or backend is required.

### Known limitations
- Some complex SVG features (such as embedded images, CSS styles and animations) are intentionally removed.
- SVG in original mode remains vector-based, so pixel width/quality settings do not apply.
- Download policies and supported image encoders differ across browsers.
- Browser checks were manually reported for Firefox, Safari, Chrome and Edge; exact versions were not captured.

[0.1.0]: https://github.com/joachimdaub/easy-image-shrink/releases/tag/v0.1.0
