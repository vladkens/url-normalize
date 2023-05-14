import { humanizeUrl, urlNormalize } from "./src/main"

const bench = (name: string, count: number, fn: () => void) => {
  const st = Date.now()
  for (let i = 0; i < count; ++i) fn()
  const dt = Date.now() - st
  console.log(`${name} x ${count} = ${dt / 1000}s (${dt / count}ms per it)`)
}

const main = () => {
  bench("urlNormalize – simple", 1e5, () => {
    urlNormalize("https://www.google.com")
  })

  bench("urlNormalize – harder", 1e5, () => {
    urlNormalize("://www.example.com/foo//bar/../baz?b=2&a=1#tag")
  })

  bench("urlNormalize – replace protocol", 1e5, () => {
    urlNormalize("www.example.com/foo//bar/../baz?b=2&a=1#tag", { forceProtocol: "sftp" })
  })

  bench("humanizeUrl – simple", 1e5, () => {
    humanizeUrl("https://www.google.com")
  })
}

main()
