import { deepStrictEqual as equal, doesNotThrow, ok, strictEqual, throws } from "node:assert"
import { test } from "node:test"
import {
  Options,
  extractDomain,
  extractDomainOrFail,
  humanizeUrl,
  urlNormalize,
  urlNormalizeOrFail,
} from "./main"

const t = (url: string, exp: string | null, opts?: Options) => {
  return strictEqual(urlNormalize(url, opts), exp, `FAIL: ${url} -> ${exp}`)
}

test("should normalize domain", () => {
  const res = "https://example.com"

  t("https://example.com", res)
  t("http://example.com", "http://example.com")
  t("//example.com", res)
  t("example.com", res)
  t("www.example.com", res)
  t("WWW.example.com", res)

  t(" example.com", res)
  t("example.com ", res)
  t(" example.com ", res)

  t("EXAMPLE.COM", res)
  t("EXAMPLE.com", res)
  t("example.COM", res)
  t("HTTPS://example.com", res)

  t("example.com.", res)
  t(".example.com", res)
  t(".example.com.", res)
  t("..example.com..", res)
  t(".www.example.com", res)
  t(".www.example.com.", res)

  t("example.com/", res)
  t("example.com./", res)
  t("https://example.com/", res)
  t("//example.com/", res)

  t("example.com?", "https://example.com")
  t("example.com#", "https://example.com")

  t("example.com:443", res)
  t("http://example.com:80", "http://example.com")
  t("example.com:80", "https://example.com:80")
  t("example.com:8080", "https://example.com:8080")

  t("https://www.example.com", "https://example.com")
  t("http://www.example.com", "http://example.com")
  t("www.com", "https://www.com")
  t("www.www.example.com", "https://www.www.example.com")

  t("👻💥.ws", "https://xn--9q8huc.ws")
  t("xn--9q8huc.ws", "https://xn--9q8huc.ws")

  t("êxample.com", "https://xn--xample-hva.com")
  t("ebаy.com", "https://xn--eby-7cd.com")
  t("myfictionαlbank.com", "https://xn--myfictionlbank-o9j.com")
  t("日本語.jp", "https://xn--wgv71a119e.jp")
  t("пример.рф", "https://xn--e1afmkfd.xn--p1ai")
  t("中国.cn", "https://xn--fiqs8s.cn")
  t("παράδειγμα.ελ", "https://xn--hxajbheg2az3al.xn--qxam")
  t("مثال.مصر", "https://xn--mgbh0fb.xn--wgbh1c")
  t("उदाहरण.भारत", "https://xn--p1b6ci4b4b3a.xn--h2brj9c")

  t("xn--9q8huc.ws", "https://👻💥.ws", { unicode: true })
  t("https://xn--mgbh0fb.xn--wgbh1c", "https://مثال.مصر", { unicode: true })
  t("https://xn--eby-7cd.com", "https://ebаy.com", { unicode: true })

  t("", null)
})

test("should normalize path", () => {
  t("example.com/", "https://example.com")
  t("example.com//", "https://example.com")
  t("example.com///", "https://example.com")
  t("example.com////", "https://example.com")
  t("example.com/./", "https://example.com")

  t("example.com/foo/", "https://example.com/foo")
  t("example.com/foo//", "https://example.com/foo")
  t("example.com/foo///", "https://example.com/foo")
  t("example.com/foo////", "https://example.com/foo")
  t("example.com/foo/./", "https://example.com/foo")
  t("example.com/foo/bar/../baz", "https://example.com/foo/baz")
  t("example.com/foo/bar/./baz", "https://example.com/foo/bar/baz")
  t("example.com/foo/bar/.//.//baz", "https://example.com/foo/bar/baz")
  t("example.com/foo/bar/.//baz", "https://example.com/foo/bar/baz")

  t("example.com/@user", "https://example.com/@user")
  t("example.com/%7Efoo", "https://example.com/~foo")
  t("example.com/a%2Fb", "https://example.com/a%2Fb")
  t("example.com/100%2541", "https://example.com/100%2541") // #5
  t("example.com/a%5Cb", "https://example.com/a%5Cb") // "\\" is "/" for URL
  t("example.com/a%09b%0A", "https://example.com/a%09b%0A") // dropped by URL when decoded
  t("example.com/a%C3/%E2%82%AC", "https://example.com/a%C3/%E2%82%AC") // not utf-8
  t("example.com/Foo/Bar", "https://example.com/Foo/Bar")

  t("example.com/https://google.com", "https://example.com/https://google.com")
  t("example.com/http://google.com", "https://example.com/http://google.com")
  t("example.com/https://google.com/foo//bar", "https://example.com/https://google.com/foo/bar")

  t("example.com/https:///a.com", "https://example.com/https://a.com")
  t("example.com/https:////a.com", "https://example.com/https://a.com")
  t("example.com/https://a.com/https://b.com", "https://example.com/https://a.com/https://b.com")
  t("example.com/https://a.com//https://b.com", "https://example.com/https://a.com/https://b.com")
  t("example.com/https:///a.com/https:///b.com", "https://example.com/https://a.com/https://b.com")

  t("example.com/git://example.com", "https://example.com/git://example.com")
  t("example.com/git://example.com//foo", "https://example.com/git://example.com/foo")
  t("example.com//foo/git://example.com", "https://example.com/foo/git://example.com")
  t("example.com/s3://example.com", "https://example.com/s3://example.com")
  t("example.com/s3://example.com//foo", "https://example.com/s3://example.com/foo")
  t("example.com//foo/s3://example.com", "https://example.com/foo/s3://example.com")

  t("example.com/a://example.com//foo", "https://example.com/a://example.com/foo")
  t("example.com/a+b://example.com//foo", "https://example.com/a+b://example.com/foo")
})

test("should normalize query params", () => {
  t("example.com/?", "https://example.com")
  t("example.com/?foo=bar", "https://example.com/?foo=bar")
  t("example.com/?foo=bar&", "https://example.com/?foo=bar")
  t("example.com/?foo=bar baz", "https://example.com/?foo=bar+baz")
  t("example.com/?b=bar&a=foo", "https://example.com/?a=foo&b=bar")
  t(`example.com?foo=bar*|<>:"`, "https://example.com/?foo=bar*|%3C%3E:%22")
  t("example.com/?url=https://example.com", "https://example.com/?url=https://example.com")
  t("example.com/?url=https%3A%2F%2Fexample.com", "https://example.com/?url=https://example.com")

  // keep escapes which change query meaning when decoded (#5)
  t("example.com/?q=R%26D", "https://example.com/?q=R%26D")
  t("example.com/?q=C%2B%2B", "https://example.com/?q=C%2B%2B")
  t("example.com/?a%3Db=1", "https://example.com/?a%3Db=1")
  t("example.com/?q=100%25", "https://example.com/?q=100%25")
  t("example.com/?q=a%23b", "https://example.com/?q=a%23b")
  t("example.com/?q=a%3Bb", "https://example.com/?q=a%3Bb")
  t("example.com/?q=a%0Ab", "https://example.com/?q=a%0Ab")

  // keep raw pairs, unlike URLSearchParams
  t("example.com/?b&a", "https://example.com/?a&b")
  t("example.com/index.php?/foo/bar", "https://example.com/index.php?/foo/bar")
  t("example.com/?token=abc==", "https://example.com/?token=abc==")
  t("example.com/?a=1;b=2", "https://example.com/?a=1;b=2")
  t("example.com/?kw=%C3%C0%CE%C4", "https://example.com/?kw=%C3%C0%CE%C4") // not utf-8
  t("example.com/??a=1", "https://example.com/??a=1")
  t("example.com/?a=1&&b=2&&", "https://example.com/?a=1&b=2")
  t("example.com/?b=1&a=2&b=0", "https://example.com/?a=2&b=1&b=0")
  t("example.com/?a%2bb=1&a%2Bb=0", "https://example.com/?a%2Bb=1&a%2Bb=0")
  t("example.com/?b=1&%61=2", "https://example.com/?a=2&b=1")
  t("example.com/?next=/", "https://example.com/?next=/")
})

test("should normalize hash", () => {
  t("example.com/#", "https://example.com")
  t("example.com/#foo", "https://example.com/#foo")
  t("example.com/foo/#", "https://example.com/foo")
  t("example.com/foo/#bar", "https://example.com/foo/#bar")
  t("example.com/#/", "https://example.com/#/") // e.g. for hash-router
  t("example.com/#/foo", "https://example.com/#/foo")
  t("example.com/#/foo?bar=1", "https://example.com/#/foo?bar=1")
  t("example.com/#/foo?b=1&a=2", "https://example.com/#/foo?b=1&a=2")
  t("example.com/#/foo/", "https://example.com/#/foo/")
  t("example.com/?a=1#/", "https://example.com/?a=1#/")
})

test("should allow custom options", () => {
  // defaultProtocol
  t("example.com", "http://example.com", { defaultProtocol: "http" })
  t("http://example.com", "http://example.com", { defaultProtocol: "http" })
  t("https://example.com", "https://example.com", { defaultProtocol: "http" })
  t("example.com", "https://example.com", { defaultProtocol: "https" })
  t("example.com", "ftp://example.com", { defaultProtocol: "ftp" })
  t("http://example.com", "http://example.com", { defaultProtocol: "ftp" })
  t("abc://example.com", null, { defaultProtocol: "http" })

  // customProtocol
  t(`abc://example.com`, `abc://example.com`, { customProtocol: true })
  t(`abc://example.com`, null, { customProtocol: false })
  t(`abc://www.example.com/`, `abc://example.com`, { customProtocol: true })
  t(`abc://www.example.com/foo/bar`, `abc://example.com/foo/bar`, { customProtocol: true })
  t(`abc://www.example.com/foo/bar`, null, { customProtocol: false })
  t(`abc://www.example.com/foo/bar`, null, { customProtocol: false })
  t(`abc://www.example.com/foo/bar`, null, { customProtocol: false })

  // protocol
  t("https://example.com", "https://example.com", { protocol: true })
  t("https://example.com", "example.com", { protocol: false })
  t("https://example.com/abc", "example.com/abc", { protocol: false })
  t("https://example.com:80/abc", "example.com:80/abc", { protocol: false })
  t("https://example.com/foo?bar=baz", "example.com/foo?bar=baz", { protocol: false })
  t("abc://example.com:80/abc", "example.com:80/abc", { protocol: false, customProtocol: true })
  t("abc://example.com:80/abc", null, { protocol: false, customProtocol: false })

  // forceProtocol
  t("https://example.com", "http://example.com", { forceProtocol: "http" })
  t("https://example.com", "https://example.com", { forceProtocol: "https" })
  t("https://example.com", "abc://example.com", { forceProtocol: "abc" })
  t("https://example.com", "example.com", { forceProtocol: "abc", protocol: false })
  t("https://example.com", "sftp://example.com", { forceProtocol: "sftp" })
  t("tg://example.com", "we://example.com", { forceProtocol: "we" })
  t("https://example.com:80", "http://example.com", { forceProtocol: "http" })
  t("http://example.com:443/a", "https://example.com/a", { forceProtocol: "https" })

  // www
  t("www.example.com", "https://www.example.com", { www: true })
  t("www.example.com", "https://example.com", { www: false })
  t("http://www.example.com", "http://www.example.com", { www: true })

  // auth
  t("https://user:pass@example.com", "https://example.com", { auth: false })
  t("https://user:pass@example.com", "https://user:pass@example.com", { auth: true })
  t("https://:pass@example.com", "https://:pass@example.com", { auth: true })
  t("https://user:@example.com", "https://user@example.com", { auth: true })
  t("https://:@example.com", "https://example.com", { auth: true })
  t("http://user:@example.com", "http://user@example.com", { auth: true })

  // port
  t("http://example.com:80", "http://example.com", { port: false })
  t("http://example.com:80", "http://example.com", { port: true })
  t("https://example.com:443", "https://example.com", { port: false })
  t("https://example.com:443", "https://example.com", { port: true })
  t("https://example.com:80", "https://example.com:80", { port: true })
  t("https://example.com:8080", "https://example.com:8080", { port: true })
  t("example.com:80", "https://example.com:80", { port: true })
  t("example.com:1234", "https://example.com:1234", { port: true })
  t("example.com:1234", "https://example.com", { port: false })

  // index
  t("example.com/index.html", "https://example.com/index.html")
  t("example.com/index.html", "https://example.com", { index: false })
  t("example.com/foo/index.html", "https://example.com/foo/index.html")
  t("example.com/foo/index.html", "https://example.com/foo", { index: false })

  t("example.com/foo/index", "https://example.com/foo/index", { index: false })
  t("example.com/foo/index.", "https://example.com/foo/index.", { index: false })
  t("example.com/foo/index.htm", "https://example.com/foo", { index: false })

  // search
  t("example.com/?foo=bar", "https://example.com", { search: false })
  t("example.com/?foo=bar", "https://example.com/?foo=bar", { search: true })
  t("example.com/?foo=bar&", "https://example.com/?foo=bar", { search: true })

  // sortSearch
  t("example.com/?b=1&a=2", "https://example.com/?a=2&b=1", { sortSearch: true })
  t("example.com/?b=1&a=2", "https://example.com/?b=1&a=2", { sortSearch: false })
  t("example.com/?b=1&a=2", "https://example.com/?a=2&b=1", { sortSearch: true })
  t("example.com/?b=1&a=2", "https://example.com/?b=1&a=2", { sortSearch: false })

  // fragment
  t("example.com/#foo", "https://example.com", { fragment: false })
  t("example.com/#foo", "https://example.com/#foo", { fragment: true })

  // textFragment
  t("example.com/#:~:text=hello", "https://example.com", { textFragment: false })
  t("example.com/#:~:text=hello", "https://example.com/#:~:text=hello", { textFragment: true })
  t("example.com/#:~:text=he%20wo", "https://example.com/#:~:text=he%20wo", { textFragment: true })

  // filterSearch
  t("example.com/?b=2&a=1", "https://example.com/?a=1", { filterSearch: (k, v) => k === "a" })
  t("example.com/?c=3&b=2&a=1", "https://example.com/?a=1&c=3", {
    filterSearch: (k, v) => k === "a" || v === "3",
  })
  t("example.com/?a=1&b=2&c=3&d=4", "https://example.com", { filterSearch: () => false })
  t("example.com/?b=x%3Dy&a&c=1", "https://example.com/?b=x%3Dy&a", {
    filterSearch: (k) => k !== "c",
    sortSearch: false,
  })
  t("example.com/?a=b+c&a=b%2Bc", "https://example.com/?a=b%2Bc", {
    filterSearch: (k, v) => v === "b+c",
  })

  // unicode
  t("https://xn--9q8huc.ws:pw@xn--9q8huc.ws", "https://xn--9q8huc.ws:pw@👻💥.ws", {
    unicode: true,
    auth: true,
  })
  t("https://evil.com$'.good.com/x", "https://evil.com$'.good.com/x", { unicode: true })
})

test("custom protocol", () => {
  t(`abc://example.com`, `abc://example.com`, { customProtocol: true })
  t(`abc://www.example.com/`, `abc://example.com`, { customProtocol: true })
  t(`abc://www.example.com/foo/bar`, `abc://example.com/foo/bar`, { customProtocol: true })
  t(`abc://user:password@example.com`, `abc://example.com`, { customProtocol: true })

  t(`foo+bar://example.com`, `foo+bar://example.com`, { customProtocol: true })
  t(`foo-bar://example.com`, `foo-bar://example.com`, { customProtocol: true })
  t(`foo.bar://example.com`, `foo.bar://example.com`, { customProtocol: true })

  // run code on click
  t(`javascript://example.com/%0Aalert(1)`, null, { customProtocol: true })
  t(`vbscript://example.com`, null, { customProtocol: true })

  // t(`weixin://dl/chat?mao`, ``, { customProtocol: true })
  // t(`weixin://dl/chat?mao&dzedun`, ``, { customProtocol: true })
})

test("unhappy path", () => {
  t("", null)
  t("example", null)
  t(".com", null)
  t("www.", null)
  t(":80", null)
  t("example:80", null)
  t(".com:80", null)
  t("https://", null)
  t("https://example", null)
  t("https://.com", null)
  t("https://www.", null)
  t("https://www.:80", null)

  t("https://https://example.com", null)

  t("foo.example.com", "https://foo.example.com")
  t("foo%20example.com", null)
  t("foo example.com", null)

  // can't say for sure "user:" is protocol or username
  t("user:pass@example.com", null, { auth: false })
  t("user:pass@example.com", null, { auth: true })
  t(":pass@example.com", null, { auth: true })
  t("user:@example.com", null, { auth: true })
  t(":@example.com", null, { auth: true })

  // https://en.wikipedia.org/wiki/List_of_URI_schemes
  t("data:", null)
  t("data:asdasdasdasdasd", null)
  t("tel:1234", null)
  t("mailto:user@example.com", null)

  t("localhost", null) // todo: add specil case for localhost?
  t("127.0.0.1", "https://127.0.0.1") // todo: add specil case to be http://127.0.0.1?
  t("[::1]", "https://[::1]")
  t("https://[2001:db8::1]:8443/foo", "https://[2001:db8::1]:8443/foo")

  // path, not protocol-relative url
  t("/example.com", null)
  t("/", null)
})

test("should be fast on long input", () => {
  const st = performance.now()
  const pairs = Array.from({ length: 5e4 }, (_, i) => `k${i}=v`).join("&")

  t(
    `a${".+".repeat(10)}z://example.com/${"x".repeat(30)}`,
    "https://example.com/" + "x".repeat(30),
    {
      forceProtocol: "https",
    },
  )
  urlNormalize(`https://a${".".repeat(1e5)}b.com`)
  urlNormalize(`https://example.com/?${pairs}`, { filterSearch: (k) => k.endsWith("1") })

  ok(performance.now() - st < 1000)
})

test("should throw on fail", () => {
  throws(() => urlNormalizeOrFail(""))
  throws(() => urlNormalizeOrFail("example"))
  throws(() => urlNormalizeOrFail(".com"))

  doesNotThrow(() => urlNormalizeOrFail("example.com"))
  doesNotThrow(() => urlNormalizeOrFail("example.com:80"))
})

test("should extract domain", () => {
  const t = (url: string, exp: string | null) => strictEqual(extractDomain(url), exp)

  t("https://example.com", "example.com")
  t("https://example.com/", "example.com")
  t("https://example.com/?", "example.com")
  t("https://example.com/#", "example.com")
  t("https://example.com:80", "example.com")
  t("https://user:@example.com", "example.com")
  t("https://example.com?", "example.com")
  t("https://example.com#", "example.com")
  t("https://example.com/foo", "example.com")

  t("user@example.com", "example.com")
  t("user:@example.com", null) // todo: should allow or not?
})

test("should throws on extract domain fail", () => {
  throws(() => extractDomainOrFail(""))
  throws(() => extractDomainOrFail("example"))
  throws(() => extractDomainOrFail(".com"))

  doesNotThrow(() => extractDomainOrFail("example.com"))
  doesNotThrow(() => extractDomainOrFail("example.com:80"))
})

test("should humanizeUrl", () => {
  const t = (url: string, exp: string | null) =>
    strictEqual(humanizeUrl(url), exp, `FAIL: ${url} -> ${exp}`)

  t("https://example.com", "example.com")
  t("https://www.example.com/", "example.com")
  t("https://example.com/?", "example.com")
  t("https://example.com:80", "example.com:80")
  t("https://user:@example.com", "example.com")
  t("https://example.com?", "example.com")
  t("https://example.com#", "example.com")
  t("https://example.com/foo", "example.com/foo")
  t("https://example.com/foo/?b=2&a=1", "example.com/foo/?a=1&b=2")
  t("https://example.com/foo/#tag", "example.com/foo/#tag")
  t("example.com:443/foo/index.html?a=2&a=1#tag", "example.com/foo/index.html?a=2&a=1#tag")
})
