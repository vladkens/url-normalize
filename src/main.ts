import { toUnicode } from "punycode"

export type Options = {
  auth?: boolean
  customProtocol?: boolean
  defaultProtocol?: string
  filterSearch?: (key: string, value: string) => boolean
  forceProtocol?: string
  fragment?: boolean
  index?: boolean
  port?: boolean // default port always removed
  protocol?: boolean
  search?: boolean
  sortSearch?: boolean
  textFragment?: boolean
  unicode?: boolean
  www?: boolean
}

const DefaultOptions: Options = {
  auth: false,
  customProtocol: false,
  defaultProtocol: "https",
  fragment: true,
  index: true,
  port: true,
  protocol: true,
  search: true,
  sortSearch: true,
  textFragment: false,
  unicode: false,
  www: false,
}

const canFail = <T>(fn: () => T): T | null => {
  try {
    return fn()
  } catch {
    return null
  }
}

// decode percent-escapes for readability, but keep `keep` ones encoded, as they change url meaning
const decodeExcept = (val: string, keep: RegExp, decode: (x: string) => string) => {
  return val
    .split(keep)
    .map((x, i) => (i % 2 ? x.toUpperCase() : (canFail(() => decode(x)) ?? x))) // not utf-8 stays as is
    .join("")
}

// "\" in path is "/" for URL; "\t", "\n", "\r" are dropped by it, other controls are unreadable
const PathKeep = /(%25|%5C|%[01][0-9A-F]|%7F)/i
// "%", "&", "+", ";", "=", "#" split or end query params when decoded
const SearchKeep = /(%(?:25|26|2B|3B|3D|23)|%[01][0-9A-F]|%7F)/i
// code links, eg. "javascript://example.com/%0Aalert(1)"
const ScriptProtocols = ["javascript:", "vbscript:"]

// as servers read it: "a+b=%2b" -> ["a b", "+"]; "?" goes first, as the first one is dropped
const parsePair = (pair: string) => [...new URLSearchParams(`?${pair}`)][0]

export const urlNormalizeOrFail = (url: string, options?: Options): string => {
  options = { ...DefaultOptions, ...options }
  url = url.trim()

  // "/example.com" is a path, unlike protocol-relative "//example.com"
  if (/^\/(?!\/)/.test(url)) throw new Error("Relative URL")

  const protocolRegex = /^[a-z0-9.+-]*:\/\//i
  if (!protocolRegex.test(url)) {
    // allow: "example.com:80"
    // forbid: "data:abc", "mailto:user@example", "user:pass@example.com"
    if (/^[a-z0-9.+-]*:[^0-9]/i.test(url)) throw new Error("Unsupported protocol")
    url = `${options.defaultProtocol}://${url}`
  }

  const obj = new URL(url)

  const allowed = options.customProtocol
    ? !ScriptProtocols.includes(obj.protocol)
    : ["http:", "https:", `${options.defaultProtocol}:`].includes(obj.protocol)

  if (!allowed && !options.forceProtocol) throw new Error("Invalid protocol")

  // drops default port of new protocol, but can't switch special and custom ones, so done at the end
  if (options.forceProtocol) obj.protocol = options.forceProtocol

  // ".example.com." -> "example.com"; no regex, as /\.*$/ is quadratic on long runs of dots
  const host = obj.hostname
  let [start, end] = [0, host.length]
  while (host[start] === ".") start++
  while (end > start && host[end - 1] === ".") end--
  obj.hostname = host.slice(start, end)

  if (!options.www) {
    const parts = obj.hostname.split(".")
    if (parts.length === 3 && parts[0] === "www") obj.hostname = parts.slice(1).join(".")
  }

  // todo:
  // domain regex: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/i
  const parts = obj.hostname.split(".").filter((x) => x !== "")
  if (parts.length < 2 && !obj.hostname.startsWith("[")) throw new Error("Invalid domain") // ipv6

  if (!options.auth) {
    obj.username = ""
    obj.password = ""
  }

  if (!options.port) {
    obj.port = ""
  }

  // decodeURI keeps reserved chars encoded, except "%"
  obj.pathname = decodeExcept(obj.pathname, PathKeep, decodeURI)
  if (!options.index) {
    obj.pathname = obj.pathname.replace(/\/index\.[a-z0-9]+$/i, "/") // remove "index.html"
  }

  // remove multiple slash, but not ://
  obj.pathname = obj.pathname.replace(/(^|[^:])\/{2,}(?!\/)/g, "$1/")

  if (!options.search) {
    obj.search = ""
  } else {
    // raw pairs, as URLSearchParams re-encodes them: "?a" -> "?a=", "?a=b=c" -> "?a=b%3Dc"
    let pairs = obj.search.slice(1).replace(/%20/g, "+").split("&")
    pairs = pairs.filter((x) => x !== "") // "?a=1&&b=2&" -> "?a=1&b=2"

    const filter = options.filterSearch
    if (filter) pairs = pairs.filter((x) => filter(...parsePair(x)))

    if (options.sortSearch) {
      // by decoded keys, so "a%2b" and "a%2B" are same; stable, so same keys keep order
      const keys = pairs.map((x) => parsePair(x)[0])
      const order = keys
        .map((_, i) => i)
        .sort((a, b) => (keys[a] === keys[b] ? 0 : keys[a] < keys[b] ? -1 : 1))
      pairs = order.map((i) => decodeExcept(pairs[i], SearchKeep, decodeURIComponent))
    }

    // with "?", as setter drops first one of value: "??a" -> "?a"
    obj.search = pairs.length ? `?${pairs.join("&")}` : ""
  }

  if (!options.fragment) {
    obj.hash = ""
  } else {
    if (!options.textFragment) {
      obj.hash = obj.hash.replace(/#?:~:text.*?$/i, "")
    }
  }

  let res = obj.toString()
  if (!obj.search && !obj.hash && res.endsWith("/")) res = res.slice(0, -1)

  if (options.unicode) {
    // by position: hostname can be in auth too, and String.replace expands "$'" in it
    const at = obj.username || obj.password ? res.indexOf("@") + 1 : obj.protocol.length + 2
    res = res.slice(0, at) + toUnicode(obj.hostname) + res.slice(at + obj.hostname.length)
  }

  // by slicing: protocol in regex can be slow, eg. "a.+.+.+z://example.com"
  res = res.slice(obj.protocol.length + 2) // "https://"
  if (options.protocol) res = `${options.forceProtocol || obj.protocol.slice(0, -1)}://${res}`

  return res
}

export const urlNormalize = (url?: string | null, options?: Options): string | null => {
  return canFail(() => urlNormalizeOrFail(url ?? "", options))
}

export const createUrlNormalize = (baseOptions: Options) => {
  return (url: string, opts?: Options) => {
    return urlNormalize(url, { ...baseOptions, ...opts })
  }
}

export const extractDomainOrFail = (url: string): string => {
  const normalized = urlNormalizeOrFail(url)
  const obj = new URL(normalized)
  return obj.hostname
}

export const extractDomain = (url?: string | null): string | null => {
  return canFail(() => extractDomainOrFail(url ?? ""))
}

export const humanizeUrlOrFail = (url: string, options?: Options): string => {
  return urlNormalizeOrFail(url, { ...options, protocol: false })
}

export const humanizeUrl = (url?: string | null, options?: Options): string | null => {
  return canFail(() => humanizeUrlOrFail(url ?? "", options))
}
