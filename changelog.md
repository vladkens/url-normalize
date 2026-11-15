# Changelog

## v2.4.0 – 2026-11-16

### Fixes

- Kept percent-escapes that change URL meaning: `%`, `&`, `+`, `;`, `=`, `#` and control chars in the query, `%25`, `%5C` and control chars in the path. Normalizing is now idempotent (#5)
- Kept the query as written: `?a` no longer becomes `?a=`, and invalid UTF-8 is not replaced. The query is still sorted, by decoded key, keeping the order of repeated keys
- Removed every empty query pair with `sortSearch: false` too (`?a=1&&b=2&&` gave `?a=1&b=2&`)
- Kept `#/redirect/` and `?next=/` as they are, kept `%5C` and `%09` in the path
- Accepted IPv6 hosts (`https://[2001:db8::1]`) and rejected relative paths like `/evil.com`
- `forceProtocol` drops the old default port (`https://example.com:80` → `http://example.com`)
- `filterSearch` sees every pair, it skipped some when removing them

### Security

- `forceProtocol`, `protocol: false` and `humanizeUrl` could take minutes on a crafted scheme like `a.+.+.+z://`
- `unicode: true` could rewrite the URL from a hostname with `$'` in it
- Long runs of dots in the hostname and `filterSearch` on long queries were quadratic
- `customProtocol` rejects `javascript:` and `vbscript:` URLs

### Maintenance

- Bundled `punycode`: no dependencies, no `DEP0040` warning from Node's deprecated builtin, under 2 KB brotli
- Fixed the readme: `port` defaults to `true`, 14 options, `index: false` strips any `index.*`
- Updated dev dependencies; tested on Node 22, 24 and 26
- Releases are published from CI with npm Trusted Publishing and provenance, with no npm token

**Full Changelog**: https://github.com/vladkens/url-normalize/compare/v2.3.0...v2.4.0

---

## v2.3.0 — 2026-03-13

- No user-visible changes. Migrated tooling to npm, tsx, and Node's native test runner.

[v2.2.0...v2.3.0](https://github.com/vladkens/url-normalize/compare/v2.2.0...v2.3.0)

---

## v2.2.0 — 2025-08-31

- Updated dependencies.

[v2.1.1...v2.2.0](https://github.com/vladkens/url-normalize/compare/v2.1.1...v2.2.0)

---

## v2.1.1 — 2024-11-09

- Published with npm provenance for improved supply chain transparency.

[v2.1.0...v2.1.1](https://github.com/vladkens/url-normalize/compare/v2.1.0...v2.1.1)

---

## v2.1.0 — 2024-10-13

- Updated and pinned dependencies.

[v2.0.0...v2.1.0](https://github.com/vladkens/url-normalize/compare/v2.0.0...v2.1.0)

---

## v2.0.0 — 2023-05-17

- Updated TypeScript interfaces to match `@types/node`, improving compatibility with modern Node.js type definitions.

[v1.4.0...v2.0.0](https://github.com/vladkens/url-normalize/compare/v1.4.0...v2.0.0)

---

## v1.4.0 — 2023-05-15

### Features

- Added `humanizeUrl` preset for producing clean, human-readable URLs.

[v1.3.0...v1.4.0](https://github.com/vladkens/url-normalize/compare/v1.3.0...v1.4.0)

---

## v1.3.0 — 2023-05-15

### Features

- Added support for filtering query parameters via a custom filter function.
- Added option to display the domain in Unicode (internationalized) form.

[v1.2.1...v1.3.0](https://github.com/vladkens/url-normalize/compare/v1.2.1...v1.3.0)

---

## v1.2.1 — 2023-05-14

### Bug Fixes

- Fixed output formatting issues.

[v1.2.0...v1.2.1](https://github.com/vladkens/url-normalize/compare/v1.2.0...v1.2.1)

---

## v1.2.0 — 2023-05-14

### Features

- Added more configuration options.

### Bug Fixes

- Fixed TypeScript types import.

[v1.1.1...v1.2.0](https://github.com/vladkens/url-normalize/compare/v1.1.1...v1.2.0)

---

## v1.1.1 — 2023-05-14

- No changes recorded.

[v1.1.0...v1.1.1](https://github.com/vladkens/url-normalize/compare/v1.1.0...v1.1.1)

---

## v1.1.0 — 2023-05-14

- Initial release.

[v1.1.0 history](https://github.com/vladkens/url-normalize/commits/v1.1.0)
