// One-off: rasterize the SVG mark into the PNG sizes the manifest needs.
// Uses sharp (dev-only). Safe to re-run.
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pub = join(here, '..', 'public')
const svg = readFileSync(join(pub, 'favicon.svg'))

const teal = { r: 14, g: 124, b: 107, alpha: 1 }

async function render(size, out, { maskable = false } = {}) {
  const pad = maskable ? Math.round(size * 0.14) : 0
  const inner = size - pad * 2
  const glyph = await sharp(svg).resize(inner, inner).png().toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: maskable ? teal : { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: glyph, top: pad, left: pad }])
    .png()
    .toFile(join(pub, out))
  console.log('wrote', out)
}

await render(192, 'pwa-192.png')
await render(512, 'pwa-512.png')
await render(512, 'pwa-512-maskable.png', { maskable: true })
await render(180, 'apple-touch-icon.png', { maskable: true })
