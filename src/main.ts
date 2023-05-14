import { toUnicode } from "punycode"

export type Options = {
  allowCustomProtocol?: boolean
  defaultProtocol?: string
  filterQueryParams?: (key: string, value: string) => boolean
  forceProtocol?: string
  keepAuth?: boolean
  keepDirectoryIndex?: boolean
  keepHash?: boolean
  keepPort?: boolean // default port always removed
  keepProtocol?: boolean
  keepQueryParams?: boolean
  keepTextFragment?: boolean
  keepWWW?: boolean
  sortQueryParams?: boolean
  unicodeDomain?: boolean
}

const DefaultOptions: Options = {
  allowCustomProtocol: false,
  defaultProtocol: "https",
  keepAuth: false,
  keepDirectoryIndex: true,
  keepHash: true,
  keepPort: true,
  keepProtocol: true,
  keepQueryParams: true,
  keepTextFragment: false,
  keepWWW: false,
  sortQueryParams: true,
  unicodeDomain: false,
}

const canFail = (fn: () => void) => {
  try {
    fn()
  } catch {}
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
    !options.allowCustomProtocol &&
    !["http:", "https:", `${options.defaultProtocol}:`].includes(obj.protocol) &&
    !options.forceProtocol // URL in nodejs not allow to change protocol, so do it on the end
  ) {
    throw new Error("Invalid protocol")
  }

  obj.hostname = obj.hostname.replace(/^\.*/, "") // ".example.com" -> "example.com"
  obj.hostname = obj.hostname.replace(/\.*$/, "") // "example.com." -> "example.com

  if (!options.keepWWW) {
    const parts = obj.hostname.split(".")
    if (parts.length === 3 && parts[0] === "www") obj.hostname = parts.slice(1).join(".")
  }

  // todo:
  // domain regex: /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/i
  const parts = obj.hostname.split(".").filter((x) => x !== "")
  if (parts.length < 2) throw new Error("Invalid domain")

  if (!options.keepAuth) {
    obj.username = ""
    obj.password = ""
  }

  if (!options.keepPort) {
    obj.port = ""
  }

  canFail(() => (obj.pathname = decodeURI(obj.pathname)))
  if (!options.keepDirectoryIndex) {
    obj.pathname = obj.pathname.replace(/\/index\.[a-z0-9]+$/i, "/") // remove "index.html"
  }

  // remove multiple slash, but not ://
  obj.pathname = obj.pathname.replace(/(^|[^:])\/{2,}(?!\/)/g, "$1/")

  if (!options.keepQueryParams) {
    obj.search = ""
  } else {
    obj.search = obj.search.replace(/&$/, "") // remove last "&"
    obj.search = obj.search.replace(/&{2,}/, "&") // replace multiple "&"
    obj.search = obj.search.replace(/%20/g, "+") // replace "%20" to "+"

    if (options.filterQueryParams) {
      const params = new URLSearchParams(obj.search)
      for (const [key, value] of params.entries()) {
        if (!options.filterQueryParams(key, value)) params.delete(key)
      }
      obj.search = params.toString()
    }

    if (options.sortQueryParams) {
      obj.searchParams.sort()
      canFail(() => (obj.search = decodeURIComponent(obj.searchParams.toString())))
    }
  }

  if (!options.keepHash) {
    obj.hash = ""
  } else {
    if (!options.keepTextFragment) {
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

  if (!options.keepProtocol) {
    const regex = new RegExp(`^${protocol}//`, "i")
    res = res.replace(regex, "")
  }

  if (options.unicodeDomain) {
    const hostname = toUnicode(obj.hostname)
    res = res.replace(obj.hostname, hostname)
  }

  return res
}

export const urlNormalize = (url?: string | null, options?: Options): string | null => {
  try {
    return urlNormalizeOrFail(url ?? "", options)
  } catch {
    return null
  }
}

export const extractDomainOrFail = (url: string): string => {
  const normalized = urlNormalizeOrFail(url)
  const obj = new URL(normalized)
  return obj.hostname
}

export const extractDomain = (url?: string | null): string | null => {
  try {
    return extractDomainOrFail(url ?? "")
  } catch {
    return null
  }
}

export const createUrlNormalize = (baseOptions: Options) => {
  return (url: string, opts?: Options) => {
    return urlNormalize(url, { ...baseOptions, ...opts })
  }
}
