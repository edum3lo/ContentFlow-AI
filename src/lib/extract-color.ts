/**
 * Extrai a cor principal (mais vibrante/presente) de uma imagem de logo.
 * Roda no navegador via canvas, a partir do próprio arquivo (sem CORS).
 * Ignora branco/preto/cinza para pegar a cor de marca real. Retorna hex ou null.
 */
export async function extractPrimaryColor(file: File): Promise<string | null> {
  try {
    const url = URL.createObjectURL(file)
    const img = await loadImage(url)
    URL.revokeObjectURL(url)

    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)

    type Bucket = { count: number; r: number; g: number; b: number; score: number }
    const buckets = new Map<string, Bucket>()

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]
      if (a < 128) continue // transparente

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const lum = (max + min) / 2
      const sat = max === 0 ? 0 : (max - min) / max

      if (lum > 240) continue // quase branco
      if (lum < 18) continue // quase preto
      if (sat < 0.12) continue // cinza sem cor

      const key = `${r >> 4},${g >> 4},${b >> 4}` // quantiza
      const cur = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0, score: 0 }
      cur.count++
      cur.r += r
      cur.g += g
      cur.b += b
      cur.score += 1 + sat * 3 // valoriza cores mais saturadas
      buckets.set(key, cur)
    }

    if (buckets.size === 0) return null

    let best: Bucket | null = null
    for (const v of buckets.values()) {
      if (!best || v.score > best.score) best = v
    }
    if (!best) return null

    return rgbToHex(
      Math.round(best.r / best.count),
      Math.round(best.g / best.count),
      Math.round(best.b / best.count)
    )
  } catch {
    return null
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}
