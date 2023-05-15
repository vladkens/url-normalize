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

export const urlNormalizeOrFail = (url: string, options?: Options): string => {
  options = { ...DefaultOptions, ...options }
  url = url.trim()

  const protocolRegex = /^[a-z0-9.+-]*:\/\//i
  if (!protocolRegex.test(url)) {
    // allow: "example.com:80"
    // forbid: "data:abc", "mailto:user@example", "user:pass@example.com"
    if (/^[a-z0-9.+-]*:[^0-9]/i.test(url)) throw new Error("Unsupported protocol")
    url = `${options.defaultProtocol}://${url}`
  }

  const obj = new URL(url)

  if (
    !options.customProtocol &&
    !["http:", "https:", `${options.defaultProtocol}:`].includes(obj.protocol) &&
    !options.forceProtocol // URL in nodejs not allow to change protocol, so do it on the end
  ) {
    throw new Error("Invalid protocol")
  }

  obj.hostname = obj.hostname.replace(/^\.*/, "") // ".example.com" -> "example.com"
  obj.hostname = obj.hostname.replace(/\.*$/, "") // "example.com." -> "example.com

  if (!options.www) {
    const parts = obj.hostname.split(".")
    if (parts.length === 3 && parts[0] === "www") obj.hostname = parts.slice(1).join(".")
  }

  // todo:
  // domain regex: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/i
  const parts = obj.hostname.split(".").filter((x) => x !== "")
  if (parts.length < 2) throw new Error("Invalid domain")

  if (!options.auth) {
    obj.username = ""
    obj.password = ""
  }

  if (!options.port) {
    obj.port = ""
  }

  canFail(() => (obj.pathname = decodeURI(obj.pathname)))
  if (!options.index) {
    obj.pathname = obj.pathname.replace(/\/index\.[a-z0-9]+$/i, "/") // remove "index.html"
  }

  // remove multiple slash, but not ://
  obj.pathname = obj.pathname.replace(/(^|[^:])\/{2,}(?!\/)/g, "$1/")

  if (!options.search) {
    obj.search = ""
  } else {
    obj.search = obj.search.replace(/&$/, "") // remove last "&"
    obj.search = obj.search.replace(/&{2,}/, "&") // replace multiple "&"
    obj.search = obj.search.replace(/%20/g, "+") // replace "%20" to "+"

    if (options.filterSearch) {
      const params = new URLSearchParams(obj.search)
      for (const [key, value] of params.entries()) {
        if (!options.filterSearch(key, value)) params.delete(key)
      }
      obj.search = params.toString()
    }

    if (options.sortSearch) {
      obj.searchParams.sort()
      canFail(() => (obj.search = decodeURIComponent(obj.searchParams.toString())))
    }
  }

  if (!options.fragment) {
    obj.hash = ""
  } else {
    if (!options.textFragment) {
      obj.hash = obj.hash.replace(/#?:~:text.*?$/i, "")
    }
  }

  let res = obj.toString()
  if (res.endsWith("/") && !res.endsWith("/#/")) res = res.slice(0, -1)

  let protocol = obj.protocol
  if (options.forceProtocol) {
    const regex = new RegExp(`^${obj.protocol}//`, "i")
    res = res.replace(regex, `${options.forceProtocol}://`)
    protocol = `${options.forceProtocol}:`
  }

  if (!options.protocol) {
    const regex = new RegExp(`^${protocol}//`, "i")
    res = res.replace(regex, "")
  }

  if (options.unicode) {
    const hostname = toUnicode(obj.hostname)
    res = res.replace(obj.hostname, hostname)
  }

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
