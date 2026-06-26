'use client'

import { useState, useEffect } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { Download, Loader2, Palette, X, CheckSquare, Square, Share } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { GeneratedContent } from './content-card'

const ART_TEMPLATES = [
  { key: 'moderno', label: 'Moderno' },
  { key: 'premium', label: 'Premium' },
  { key: 'minimalista', label: 'Minimalista' },
  { key: 'corporativo', label: 'Corporativo' },
]

export function BulkExport({ contents }: { contents: GeneratedContent[] }) {
  const [open, setOpen] = useState(false)
  const [template, setTemplate] = useState('moderno')
  const [format, setFormat] = useState<'post' | 'story'>('story')
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [zipping, setZipping] = useState(false)

  // Limite de arquivos no compartilhamento nativo: iOS/Android costumam
  // recusar/silenciar share sheets com muitos arquivos.
  const MAX_SHARE = 20

  // Desabilita o scroll do body quando o modal abrir.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (contents.length === 0) return null

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleAll = () => {
    if (selectedIds.size === contents.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(contents.map(c => c.id)))
  }

  const handleExport = async () => {
    if (selectedIds.size === 0) return

    const canUseShare =
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function'

    // Cap só vale para o compartilhamento nativo (celular). No desktop cai no ZIP.
    if (canUseShare && selectedIds.size > MAX_SHARE) {
      alert(
        `Para salvar direto no celular, selecione até ${MAX_SHARE} por vez. (Você selecionou ${selectedIds.size}.)`
      )
      return
    }

    setExporting(true)
    setProgress(0)
    setZipping(false)

    try {
      const filesToShare: File[] = []
      let count = 0

      for (const id of selectedIds) {
        const content = contents.find((c) => c.id === id)
        if (!content) continue

        const url = `/api/contents/${id}/art?template=${template}&format=${format}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Falha ao baixar arte')

        const blob = await res.blob()
        const safeName = (content.product?.name || content.title)
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()
          .substring(0, 30)

        filesToShare.push(
          new File([blob], `${safeName}-${id.substring(0, 4)}.png`, {
            type: 'image/png',
          })
        )
        count++
        setProgress(count)
      }

      // Tenta usar a Web Share API nativa do celular (iOS/Android)
      if (canUseShare && navigator.canShare({ files: filesToShare })) {
        try {
          await navigator.share({ files: filesToShare, title: 'Artes Prontas' })
          setOpen(false)
          return
        } catch (shareErr) {
          // AbortError = usuário fechou a telinha de compartilhar (normal).
          if ((shareErr as Error)?.name !== 'AbortError') {
            throw shareErr
          }
          return
        }
      }

      // Fallback para JSZip (computador ou navegadores sem suporte a share)
      setZipping(true)
      const zip = new JSZip()
      const folder = zip.folder(`ContentFlow-Artes-${format}`)
      filesToShare.forEach((f) => folder?.file(f.name, f))
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, `Artes-ContentFlow-${Date.now()}.zip`)
      setOpen(false)
    } catch (err) {
      console.error('Erro ao exportar:', err)
      alert('Erro ao exportar artes. Tente novamente com um número menor.')
    } finally {
      setExporting(false)
      setProgress(0)
      setZipping(false)
    }
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Galeria de Exportação
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize, selecione e baixe suas artes em lote para postar.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedIds(new Set(contents.map((c) => c.id)))
              setOpen(true)
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Abrir Galeria ({contents.length})
          </Button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in zoom-in-95 duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 shrink-0">
            <div>
              <h2 className="text-lg font-semibold">Selecionar Artes</h2>
              <p className="text-sm text-muted-foreground">{selectedIds.size} de {contents.length} selecionadas</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} disabled={exporting}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Filtros Fixos */}
          <div className="border-b border-border bg-muted/20 p-4 shrink-0 space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estilo Visual</p>
              <div className="flex flex-wrap gap-2">
                {ART_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.key}
                    onClick={() => setTemplate(tpl.key)}
                    disabled={exporting}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
                      template === tpl.key
                        ? 'bg-foreground border-foreground text-background shadow-sm'
                        : 'bg-card border-border text-foreground hover:bg-muted'
                    )}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Formato</p>
              <div className="flex flex-wrap gap-2">
                {(['post', 'story'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    disabled={exporting}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-medium transition-colors border',
                      format === f
                        ? 'bg-foreground border-foreground text-background shadow-sm'
                        : 'bg-card border-border text-foreground hover:bg-muted'
                    )}
                  >
                    {f === 'post' ? 'Quadrado (Feed 1:1)' : 'Vertical (TikTok 9:16)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid de Imagens */}
          <div className="flex-1 overflow-y-auto p-4 bg-muted/10 pb-32">
            <div className={cn("grid gap-4", format === 'post' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4')}>
              {contents.map(content => {
                const selected = selectedIds.has(content.id)
                // A URL da imagem muda dinamicamente conforme os botões são clicados
                const imgUrl = `/api/contents/${content.id}/art?template=${template}&format=${format}`
                
                return (
                  <div 
                    key={content.id} 
                    onClick={() => !exporting && toggleSelect(content.id)}
                    className={cn(
                      "relative group cursor-pointer overflow-hidden rounded-xl border-2 transition-all",
                      selected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-border"
                    )}
                  >
                    <div className="aspect-auto w-full bg-muted flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={imgUrl} 
                        alt="Preview" 
                        loading="lazy"
                        className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    </div>
                    
                    {/* Checkbox overlay */}
                    <div className="absolute top-2 right-2 z-10">
                      {selected ? (
                        <div className="bg-primary text-primary-foreground rounded-md p-1 shadow-sm">
                          <CheckSquare className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="bg-background/80 backdrop-blur-sm text-muted-foreground rounded-md p-1 shadow-sm opacity-80">
                          <Square className="h-5 w-5" />
                        </div>
                      )}
                    </div>

                    {/* Rótulo inferior */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
                      <p className="text-xs font-medium text-white line-clamp-1">
                        {content.product?.name || content.title}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="fixed bottom-0 inset-x-0 border-t border-border bg-background/80 backdrop-blur-xl p-4 safe-area-bottom">
            <div className="mx-auto max-w-lg flex items-center justify-between gap-4">
              <Button 
                variant="ghost" 
                onClick={toggleAll}
                disabled={exporting}
                className="hidden sm:inline-flex"
              >
                {selectedIds.size === contents.length ? 'Desmarcar Tudo' : 'Selecionar Tudo'}
              </Button>
              
              <Button 
                size="lg"
                className="w-full font-semibold shadow-lg"
                onClick={handleExport}
                disabled={selectedIds.size === 0 || exporting}
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {zipping ? 'Compactando ZIP...' : `Baixando ${progress} de ${selectedIds.size}...`}
                  </>
                ) : (
                  <>
                    <Share className="mr-2 h-5 w-5 sm:hidden" />
                    <Download className="mr-2 h-5 w-5 hidden sm:block" />
                    Salvar {selectedIds.size} {selectedIds.size === 1 ? 'Arte' : 'Artes'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
