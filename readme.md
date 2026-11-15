# url-normalize

<div align="center">

[<img src="https://badges.ws/npm/v/url-normalize" alt="version" />](https://npmjs.org/package/url-normalize)
[<img src="https://packagephobia.com/badge?p=url-normalize" alt="size" />](https://packagephobia.now.sh/result?p=url-normalize)
[<img src="https://badges.ws/npm/dm/url-normalize" alt="downloads" />](https://npmjs.org/package/url-normalize)
[<img src="https://badges.ws/github/license/vladkens/url-normalize" alt="license" />](https://github.com/vladkens/url-normalize/blob/main/LICENSE)

</div>

**One URL, one spelling.** Turns messy, user-typed URLs into a single canonical `https://` form, or `null` when the input is not a web URL. Zero dependencies, under 2 KB.

```typescript
import { urlNormalize } from "url-normalize"

urlNormalize("WWW.Example.com:443/blog/../about?utm_source=x&b=2&a=1#")
// → "https://example.com/about?a=1&b=2&utm_source=x"
```

## Why

The same page reaches you spelled a dozen ways. Store or compare them as they are and you get duplicates; normalize them first and they collapse into one key.

| Input                                                     | Output                          |
| --------------------------------------------------------- | ------------------------------- |
| `example.com`                                             | `https://example.com`           |
| `//www.example.com/`                                      | `https://example.com`           |
| `HTTPS://Example.com:443/a/../b`                          | `https://example.com/b`         |
| `example.com/?b=2&a=1`                                    | `https://example.com/?a=1&b=2`  |
| `пример.рф`                                               | `https://xn--e1afmkfd.xn--p1ai` |
| `example.com/#:~:text=hello`                              | `https://example.com`           |
| `example`, `mailto:hi@example.com`, `javascript:alert(1)` | `null`                          |

Good for deduplicating links in a database, cache and crawler keys, comparing user-submitted URLs, and showing clean links in a UI.

- **Never throws.** `null` for anything that is not a web URL; the `*OrFail` variants throw if you prefer.
- **Keeps the meaning.** Decodes escapes for readability, but keeps the ones that would change the URL (`%26`, `%2B`, `%3D`, `%23`, `%25`, …). Normalizing twice gives the same result.
- **Safe on hostile input.** Rejects `javascript:` and `vbscript:` links, runs in linear time on long or crafted strings.
- **Tiny.** Under 2 KB brotli, zero dependencies, CJS + ESM, TypeScript types.
- **International.** Punycode ↔ Unicode domains, both ways.
- **Batteries included.** `extractDomain`, `humanizeUrl` and preset normalizers.

## Install

```sh
npm i url-normalize
```

## Options

Pass an options object as the second argument. The defaults fit most cases.

| Option            | Default   | Effect                                                                                                  |
| ----------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `defaultProtocol` | `"https"` | Protocol added when the input has none; an existing one is kept                                         |
| `protocol`        | `true`    | `false` strips the protocol                                                                             |
| `www`             | `false`   | `true` keeps `www.`                                                                                     |
| `auth`            | `false`   | `true` keeps `user:pass@`                                                                               |
| `port`            | `true`    | `false` strips the port; 80 and 443 are always removed                                                  |
| `index`           | `true`    | `false` strips `index.html`, `index.php` and other `index.*` files                                      |
| `search`          | `true`    | `false` strips the query                                                                                |
| `sortSearch`      | `true`    | Sorts query params by key; repeated keys keep their order                                               |
| `filterSearch`    | –         | `(key, value) => boolean`, keeps only the matching query params                                         |
| `fragment`        | `true`    | `false` strips the `#hash`                                                                              |
| `textFragment`    | `false`   | `true` keeps [text fragments](https://wicg.github.io/scroll-to-text-fragment/) (`#:~:text=…`)           |
| `customProtocol`  | `false`   | `true` allows `tg://`, `ftps://` and other protocols; `javascript:` and `vbscript:` are always rejected |
| `forceProtocol`   | –         | Replaces the protocol, e.g. `"sftp"`                                                                    |
| `unicode`         | `false`   | `true` returns Unicode domains instead of Punycode                                                      |

```typescript
urlNormalize("example.com", { defaultProtocol: "http" }) // → "http://example.com"
urlNormalize("https://example.com/foo?bar=baz", { protocol: false }) // → "example.com/foo?bar=baz"
urlNormalize("www.example.com", { www: true }) // → "https://www.example.com"
urlNormalize("https://user:pass@example.com", { auth: true }) // → "https://user:pass@example.com"
urlNormalize("https://example.com:8080") // → "https://example.com:8080"
urlNormalize("https://example.com:8080", { port: false }) // → "https://example.com"
urlNormalize("example.com/foo/index.html", { index: false }) // → "https://example.com/foo"
urlNormalize("example.com/?a=1&b=2", { search: false }) // → "https://example.com"
urlNormalize("example.com/?b=2&a=1", { sortSearch: false }) // → "https://example.com/?b=2&a=1"
urlNormalize("example.com/?utm_source=x&id=1", { filterSearch: (k) => !k.startsWith("utm_") }) // → "https://example.com/?id=1"
urlNormalize("example.com/#foo", { fragment: false }) // → "https://example.com"
urlNormalize("example.com/#:~:text=hello", { textFragment: true }) // → "https://example.com/#:~:text=hello"
urlNormalize("tg://example.com", { customProtocol: true }) // → "tg://example.com"
urlNormalize("https://example.com", { forceProtocol: "sftp" }) // → "sftp://example.com"
urlNormalize("https://xn--9q8huc.ws", { unicode: true }) // → "https://👻💥.ws"
```

## More functions

```typescript
import { createUrlNormalize, extractDomain, humanizeUrl, urlNormalizeOrFail } from "url-normalize"

// a normalizer with preset options
const normalize = createUrlNormalize({ defaultProtocol: "http", fragment: false })
normalize("example.com/foo#tag") // → "http://example.com/foo"

// the bare domain
extractDomain("https://www.example.com:8080/?a=1#tag") // → "example.com"

// for display, without the protocol
humanizeUrl("https://example.com/foo/bar") // → "example.com/foo/bar"

// throws instead of returning null; extractDomainOrFail and humanizeUrlOrFail too
urlNormalizeOrFail("example") // throws
```

## Compared to normalize-url

[normalize-url](https://github.com/sindresorhus/normalize-url) is the popular choice and has more options. url-normalize is stricter about what counts as a URL and ships the helpers above:

|                       | url-normalize | normalize-url           |
| --------------------- | ------------- | ----------------------- |
| `example`             | `null`        | `"http://example"`      |
| `javascript:alert(1)` | `null`        | `"javascript:alert(1)"` |
| `example.com`         | `"https://…"` | `"http://…"`            |
| Domain and display    | built in      | –                       |

## License

[MIT](LICENSE)
