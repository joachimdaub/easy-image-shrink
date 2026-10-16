# Contributing

Thank you for considering a contribution to Easy Image Shrink.

## Before opening a pull request

- Open an issue for substantial changes so the scope can be discussed.
- Keep the project small: vanilla HTML, CSS and JavaScript; no backend, database, dependencies, or build system unless there is a compelling reason.
- Keep issue reports, pull requests, commit messages, and documentation in English. The customer-facing UI currently uses German.
- Do not include real customer images, personal information, credentials, or access tokens in issues or test fixtures.

## Development

Serve the repository with a static web server, such as `python3 -m http.server 8080`. Validate JavaScript with `node --check assets/app.js`.

Manually verify drag-and-drop, single-file downloads, multiple-file ZIP downloads, original-format preservation, transparency, filename suffixes, width limits and rejection of files that become larger. Test on multiple browsers where possible, especially Safari.

## Pull requests

Explain what changed, why, how it was tested, and any browser compatibility implications. Small, focused pull requests are preferred.

By contributing, you agree that your changes are distributed under the repository's MIT license.
