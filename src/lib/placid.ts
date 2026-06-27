// Integração com o Placid (https://placid.app) — renderiza a arte a partir de um
// template que VOCÊ desenha no editor deles, preenchendo as camadas dinâmicas.
// Texto sempre perfeito (é renderizado, não gerado por IA).

const PLACID_API = 'https://api.placid.app/api/rest/images'

export type PlacidLayers = Record<
  string,
  { text: string } | { image: string }
>

type PlacidJob = {
  id?: string | number
  status?: string
  image_url?: string | null
  polling_url?: string
}

/**
 * Cria o render no Placid e aguarda finalizar. Retorna a URL da imagem pronta,
 * ou null se algo falhar (a arte cai no template padrão — fallback seguro).
 */
export async function renderPlacidImage(opts: {
  apiToken: string
  templateUuid: string
  layers: PlacidLayers
}): Promise<string | null> {
  const { apiToken, templateUuid, layers } = opts
  try {
    const res = await fetch(PLACID_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ template_uuid: templateUuid, layers }),
    })
    if (!res.ok) {
      console.error('Placid POST falhou:', res.status, await res.text().catch(() => ''))
      return null
    }

    let job = (await res.json()) as PlacidJob

    // O Placid processa de forma assíncrona — fazemos polling até finalizar.
    const deadline = Date.now() + 50_000
    while (job.status !== 'finished' && Date.now() < deadline) {
      if (job.status === 'error') {
        console.error('Placid job com erro:', job)
        return null
      }
      await new Promise((r) => setTimeout(r, 1500))
      const pollUrl = job.polling_url || `${PLACID_API}/${job.id}`
      const pr = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${apiToken}` },
      })
      if (!pr.ok) {
        console.error('Placid polling falhou:', pr.status)
        return null
      }
      job = (await pr.json()) as PlacidJob
    }

    return job.status === 'finished' ? job.image_url ?? null : null
  } catch (e) {
    console.error('Placid erro:', e)
    return null
  }
}
