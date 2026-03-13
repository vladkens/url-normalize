# url-normalize

<div align="center">

[<img src="https://badges.ws/npm/v/url-normalize" alt="version" />](https://npmjs.org/package/url-normalize)
[<img src="https://packagephobia.com/badge?p=url-normalize" alt="size" />](https://packagephobia.now.sh/result?p=url-normalize)
[<img src="https://badges.ws/npm/dm/url-normalize" alt="downloads" />](https://npmjs.org/package/url-normalize)
[<img src="https://badges.ws/github/license/vladkens/url-normalize" alt="license" />](https://github.com/vladkens/url-normalize/blob/main/LICENSE)

</div>

Turns any URL-like string into a clean, canonical `https://` URL — returns `null` if it can't.

- **Safe.** Returns `null` for invalid input — no try/catch needed.
- **Tiny.** 980 bytes (brotli). One dependency.
- **Smart defaults.** HTTPS, no `www`, sorted query params, stripped default ports — automatic.
- **Configurable.** 12 options to control every part of the URL.
- **International.** Unicode ↔ Punycode conversion in both directions.
- **Batteries included.** `extractDomain` and `humanizeUrl` utilities come with the package.

Works with bare domains (`example.com`), protocol-relative (`//example.com`), and messy real-world URLs. Compared to [normalize-url](https://github.com/sindresorhus/normalize-url): dual CJS + ESM exports, `null` return instead of throwing, and built-in domain/display utilities.

## Install

```sh
npm i url-normalize
```

## Usage

```typescript
import { urlNormalize } from "url-normalize"

urlNormalize("example.com")
// → "https://example.com"

urlNormalize("//www.example.com:443/../foo/bar?b=2&a=1#tag")
// → "https://example.com/foo/bar?a=1&b=2"

urlNormalize("👻💥.ws")
// → "https://xn--9q8huc.ws"

// Invalid input returns null — no exceptions
urlNormalize("example") // → null
urlNormalize("mailto:user@example.com") // → null
```

## Options

All options have sensible defaults. Pass an options object as the second argument.

### `defaultProtocol` (default: `"https"`)

Protocol to prepend when the URL has none. Preserves an existing protocol.

```typescript
urlNormalize("example.com", { defaultProtocol: "http" })
// → "http://example.com"

// Existing protocol is preserved
urlNormalize("https://example.com", { defaultProtocol: "http" })
// → "https://example.com"
```

### `protocol` (default: `true`)

Include or strip the protocol prefix.

```typescript
urlNormalize("https://example.com/foo?bar=baz", { protocol: false })
// → "example.com/foo?bar=baz"
```

### `www` (default: `false`)

Keep or remove the `www.` subdomain.

```typescript
urlNormalize("www.example.com") // → "https://example.com"
urlNormalize("www.example.com", { www: true }) // → "https://www.example.com"
```

### `auth` (default: `false`)

Keep or strip `user:pass@` credentials.

```typescript
urlNormalize("https://user:pass@example.com") // → "https://example.com"
urlNormalize("https://user:pass@example.com", { auth: true }) // → "https://user:pass@example.com"
```

### `port` (default: `false`)

Keep or strip port numbers. Default ports (80 for HTTP, 443 for HTTPS) are always removed.

```typescript
urlNormalize("https://example.com:8080", { port: true }) // → "https://example.com:8080"
urlNormalize("https://example.com:443", { port: true }) // → "https://example.com"
```

### `index` (default: `true`)

When `false`, strips `index.html` / `index.htm` from path endings.

```typescript
urlNormalize("example.com/foo/index.html") // → "https://example.com/foo/index.html"
urlNormalize("example.com/foo/index.html", { index: false }) // → "https://example.com/foo"
```

### `search` (default: `true`)

Keep or strip the query string.

```typescript
urlNormalize("example.com/?a=1&b=2", { search: false }) // → "https://example.com"
```

### `sortSearch` (default: `true`)

Sort query parameters alphabetically.

```typescript
urlNormalize("example.com/?b=2&a=1") // → "https://example.com/?a=1&b=2"
urlNormalize("example.com/?b=2&a=1", { sortSearch: false }) // → "https://example.com/?b=2&a=1"
```

### `filterSearch`

Keep only matching query parameters.

```typescript
urlNormalize("example.com/?c=3&b=2&a=1", { filterSearch: (k, v) => k === "a" || v === "3" })
// → "https://example.com/?a=1&c=3"
```

### `fragment` (default: `true`)

Keep or strip the URL hash fragment.

```typescript
urlNormalize("example.com/#foo") // → "https://example.com/#foo"
urlNormalize("example.com/#foo", { fragment: false }) // → "https://example.com"
```

### `textFragment` (default: `false`)

Keep or strip [text fragment](https://wicg.github.io/scroll-to-text-fragment/) anchors (`#:~:text=…`).

```typescript
urlNormalize("example.com/#:~:text=hello") // → "https://example.com"
urlNormalize("example.com/#:~:text=hello", { textFragment: true }) // → "https://example.com/#:~:text=hello"
```

### `customProtocol` (default: `false`)

Allow non-standard protocols like `tg://`, `ftps://`, etc.

```typescript
urlNormalize("tg://example.com") // → null
urlNormalize("tg://example.com", { customProtocol: true }) // → "tg://example.com"
```

### `forceProtocol`

Replace the protocol with a fixed value regardless of input.

```typescript
urlNormalize("https://example.com", { forceProtocol: "sftp" }) // → "sftp://example.com"
```

### `unicode` (default: `false`)

Return Unicode domain names instead of Punycode.

```typescript
urlNormalize("👻💥.ws", { unicode: true }) // → "https://👻💥.ws"
urlNormalize("https://xn--9q8huc.ws", { unicode: true }) // → "https://👻💥.ws"
```

## Advanced

### `createUrlNormalize`

Creates a reusable normalizer with preset options.

```typescript
import { createUrlNormalize } from "url-normalize"

const normalize = createUrlNormalize({ defaultProtocol: "http", fragment: false })

normalize("example.com/foo#tag") // → "http://example.com/foo"
```

### `urlNormalizeOrFail`

Throws instead of returning `null` on invalid input.

```typescript
import { urlNormalizeOrFail } from "url-normalize"

urlNormalizeOrFail("invalid") // throws
urlNormalizeOrFail("example.com") // → "https://example.com"
```

### `extractDomain` / `extractDomainOrFail`

Extracts the bare domain from any URL.

```typescript
import { extractDomain, extractDomainOrFail } from "url-normalize"

extractDomain("https://example.com:8080/?a=1&b=2#tag") // → "example.com"
extractDomain("invalid") // → null
extractDomainOrFail("invalid") // throws
```

### `humanizeUrl` / `humanizeUrlOrFail`

Strips the protocol for display-friendly URLs.

```typescript
import { humanizeUrl, humanizeUrlOrFail } from "url-normalize"

humanizeUrl("https://example.com/foo/bar") // → "example.com/foo/bar"
humanizeUrl("invalid") // → null
humanizeUrlOrFail("invalid") // throws
```

## Similar

- [sindresorhus/normalize-url](https://github.com/sindresorhus/normalize-url)
