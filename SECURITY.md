# Security Policy

## Reporting a vulnerability

Please **do not open a public issue** for an exploitable security vulnerability. Use GitHub's **Report a vulnerability** / private vulnerability reporting feature for this repository if it is enabled. If it is not enabled, ask the maintainer to enable private reporting without posting exploit details.

Please include affected versions, reproduction steps, potential impact, and suggested mitigations when available.

## Security model

Easy Image Shrink is a static web application. It does not transmit image data to a server for processing and has no authentication, upload endpoint, server-side image library, or database.

The browser still processes local image contents. SVG files are potentially complex and the included sanitizer is intentionally limited. Do not treat its output as security-reviewed sanitization suitable for unrestricted embedding on unrelated websites.

Static hosting does not provide access control: anyone with the URL can load the app. Use HTTPS and keep deployment dependencies up to date.
