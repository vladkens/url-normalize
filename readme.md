# url-normalize

<div align="center">
  <a href="https://npmjs.org/package/url-normalize">
    <img src="https://badgen.net/npm/v/url-normalize" alt="version" />
  </a>
  <a href="https://github.com/vladkens/url-normalize/actions">
    <img src="https://github.com/vladkens/url-normalize/workflows/test/badge.svg" alt="test status" />
  </a>
  <a href="https://packagephobia.now.sh/result?p=url-normalize">
    <img src="https://badgen.net/packagephobia/publish/url-normalize" alt="size" />
  </a>
  <!-- <a href="https://npmjs.org/package/url-normalize">
    <img src="https://badgen.net/npm/dm/url-normalize" alt="downloads" />
  </a> -->
  <a href="https://github.com/vladkens/url-normalize/blob/main/LICENSE">
    <img src="https://badgen.net/github/license/vladkens/url-normalize" alt="license" />
  </a>
</div>

**Normalize URLs** to a standardized form. **HTTPS** by default, flexible configuration, custom protocols, **domain extraction**, **humazing URL**, and **punycode** support. Both CJS & ESM modules available.

### Install

```sh
npm install url-normalize
```

### Usage

```typescript
import { urlNormalize } from "url-normalize"

urlNormalize("example.com")
// -> "https://example.com"

urlNormalize("//www.example.com:443/../foo/bar?b=2&a=1#tag")
// -> "https://example.com/foo/bar?a=1&b=2#tag"

// all invalid urls is null
urlNormalize("example")
// -> null

urlNormalize("data:content/type;base64,abc")
// -> null

urlNormalize("tel:+123456789")
// -> null

urlNormalize("mailto:user@example.com")
// -> null
```

### Configuration

#### defaultProtocol `(default: https)`

Default supported protocols are: `http`, `https`

```typescript
urlNormalize("example.com", { defaultProtocol: "http" })
// -> "http://example.com"

urlNormalize("example.com", { defaultProtocol: "ftps" })
// -> ftps://example.com

// BUT keeps original protocol if it in url
urlNormalize("https://example.com", { defaultProtocol: "http" })
// -> "https://example.com"
```

#### keepProtocol `(default: true)`

```typescript
urlNormalize("https://example.com")
// -> "https://example.com"

urlNormalize("https://example.com", { keepProtocol: false })
// -> "example.com"

urlNormalize("https://example.com/foo?bar=baz", { keepProtocol: false })
// -> "example.com/foo?bar=baz"
```

#### keepWWW `(default: false)`

```typescript
urlNormalize("www.example.com")
// -> "https://example.com"

urlNormalize("www.example.com", { keepWWW: true })
// -> "https://www.example.com"
```

#### keepAuth `(default: false)`

```typescript
urlNormalize("https://user:pass@example.com")
// -> "https://example.com"

urlNormalize("https://user:pass@example.com", { keepAuth: true })
// -> "https://user:pass@example.com"
```

#### keepPort `(default: false)`

```typescript
urlNormalize("https://example.com:8080")
// -> "https://example.com"

urlNormalize("https://example.com:8080", { keepPort: true })
// -> "https://example.com:8080"

// BUT for HTTP - 80 & HTTPS - 443 always without port
urlNormalize("https://example.com:443", { keepPort: true })
// -> "https://example.com"
```

#### keepDirectoryIndex `(default: true)`

```typescript
urlNormalize("example.com/index.html")
// -> "https://example.com/index.html"

urlNormalize("example.com/index.html", { keepDirectoryIndex: false })
// -> "https://example.com"
```

#### keepQueryParams `(default: true)`

```typescript
urlNormalize("example.com/?a=1&b=2")
// -> "https://example.com/?a=1&b=2"

urlNormalize("example.com/?a=1&b=2", { keepQueryParams: false })
// -> "https://example.com"
```

#### sortQueryParams `(default: true)`

```typescript
urlNormalize("example.com/?b=2&b=1")
// -> "https://example.com/?a=1&b=2"

urlNormalize("example.com/?b=2&b=1", { sortQueryParams: false })
// -> "https://example.com/?b=2&b=1"
```

### filterQueryParams

```typescript
urlNormalize("example.com/?c=3&b=2&a=1", { filterQueryParams: (k, v) => k === "a" || v === "3" })
// -> https://example.com/?a=1&c=3
```

#### keepHash `(default: true)`

```typescript
urlNormalize("example.com/#foo")
// -> "https://example.com/#foo"

urlNormalize("example.com/?b=2&b=1", { keepHash: false })
// -> "https://example.com"
```

### keepTextFragment `(default: false)`

```typescript
urlNormalize("example.com/#:~:text=hello")
// -> "https://example.com"

urlNormalize("example.com/?b=2&b=1", { keepTextFragment: true })
// -> "https://example.com/#:~:text=hello"
```

### allowCustomProtocol `(default: false)`

```typescript
urlNormalize("ftps://example.com")
// -> null

urlNormalize("tg://example.com")
// -> null

urlNormalize("ftps://example.com", { allowCustomProtocol: true })
// -> "ftps://example.com"

urlNormalize("tg://example.com", { allowCustomProtocol: true })
// -> "tg://example.com"
```

#### forceProtocol

```typescript
urlNormalize("https://example.com", { forceProtocol: "sftp" })
// -> "sftp://example.com"

urlNormalize("tg://example.com", { forceProtocol: "we" })
// -> "we://example.com"
```

#### unicodeDomain `(default: false)`

```typescript
urlNormalize("👻💥.ws")
// -> "https://xn--9q8huc.ws"

urlNormalize("👻💥.ws", { unicodeDomain: true })
// -> "https://👻💥.ws"

urlNormalize("https://xn--9q8huc.ws", { unicodeDomain: true })
// -> "https://👻💥.ws"
```

### Advanced

#### urlNormalizeOrFail

```typescript
import { urlNormalize, urlNormalizeOrFail } from "url-normalize"

urlNormalize("invalid")
// -> null

urlNormalizeOrFail("invalid")
// throws Error
```

#### extractDomain

```typescript
import { extractDomain, extractDomainOrFail } from "url-normalize"

extractDomain("https://example.com:8080/?a=1&b=2#tag")
// -> "example.com"

extractDomain("invalid")
// -> null

extractDomainOrFail("invalid")
// throws Error
```

#### createUrlNormalize

```typescript
import { createUrlNormalize } from "url-normalize"

const urlNormalize = createUrlNormalize({
  defaultProtocol: "http",
  keepHash: false,
})

urlNormalize("example.com/foo#tag")
// -> "http://example.com/foo"
```

#### humanizeUrl

```typescript
import { humanizeUrl } from "url-normalize"

humanizeUrl("https://example.com/foo/bar")
// -> example.com/foo/bar
```

### Similar projects

- [sindresorhus/normalize-url](https://github.com/sindresorhus/normalize-url)
