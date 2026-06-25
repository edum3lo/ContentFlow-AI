'use client'

import { useMemo, useState, useTransition } from 'react'
import {
  Check,
  Pencil,
  Trash2,
  X,
  Loader2,
  RotateCcw,
  CheckCheck,
  Ban,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  updateProduct,
  setProductStatus,
  deleteProduct,
  approveAllPending,
} from '@/app/dashboard/products/actions'

type Status = 'review' | 'approved' | 'rejected'

type Product = {
  id: string
  name: string
  category: string
  brand: string | null
  price: number
  confidence_score: number | null
  status: Status
}

type Filter = 'all' | 'review' | 'approved' | 'rejected'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    price
  )

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'review', label: 'Para revisar' },
  { value: 'approved', label: 'Aprovados' },
  { value: 'rejected', label: 'Rejeitados' },
]

export function ProductsTable({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', category: '', price: '', brand: '' })
  const [error, setError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const counts = useMemo(
    () => ({
      all: products.length,
      review: products.filter((p) => p.status === 'review').length,
      approved: products.filter((p) => p.status === 'approved').length,
      rejected: products.filter((p) => p.status === 'rejected').length,
    }),
    [products]
  )

  const visible = useMemo(
    () => (filter === 'all' ? products : products.filter((p) => p.status === filter)),
    [products, filter]
  )

  const startEdit = (p: Product) => {
    setError(null)
    setEditingId(p.id)
    setForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      brand: p.brand ?? '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setError(null)
  }

  const run = (
    id: string,
    fn: () => Promise<{ success: true } | { error: string }>
  ) => {
    setError(null)
    setPendingId(id)
    startTransition(async () => {
      const res = await fn()
      if ('error' in res) {
        setError(res.error)
      } else if (editingId === id) {
        setEditingId(null)
      }
      setPendingId(null)
    })
  }

  const saveEdit = (id: string) => {
    const price = parseFloat(form.price.replace(',', '.'))
    run(id, () =>
      updateProduct(id, {
        name: form.name,
        category: form.category,
        price,
        brand: form.brand || null,
      })
    )
  }

  const busy = (id: string) => isPending && pendingId === id

  return (
    <div className="space-y-4">
      {/* Filtros + ação em massa */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                filter === f.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              {f.label}
              <span className="text-xs text-muted-foreground">
                {counts[f.value]}
              </span>
            </button>
          ))}
        </div>

        {counts.review > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => run('__all__', () => approveAllPending())}
          >
            {busy('__all__') ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Aprovar pendentes ({counts.review})
          </Button>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="hidden sm:table-cell">Confiança</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum produto nesta visão.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((p) => {
                const editing = editingId === p.id
                return (
                  <TableRow key={p.id}>
                    {editing ? (
                      <>
                        <TableCell>
                          <Input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="h-8"
                            placeholder="Nome"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className="h-8"
                            placeholder="Categoria"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            className="h-8 w-24"
                            inputMode="decimal"
                            placeholder="0.00"
                          />
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <ConfidenceBadge score={p.confidence_score} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <IconBtn
                              label="Salvar"
                              onClick={() => saveEdit(p.id)}
                              loading={busy(p.id)}
                              variant="primary"
                            >
                              <Check className="h-4 w-4" />
                            </IconBtn>
                            <IconBtn label="Cancelar" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </IconBtn>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.category}
                        </TableCell>
                        <TableCell>{formatPrice(Number(p.price))}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <ConfidenceBadge score={p.confidence_score} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {p.status !== 'approved' && (
                              <IconBtn
                                label="Aprovar"
                                onClick={() => run(p.id, () => setProductStatus(p.id, 'approved'))}
                                loading={busy(p.id)}
                                variant="success"
                              >
                                <Check className="h-4 w-4" />
                              </IconBtn>
                            )}
                            {p.status === 'approved' && (
                              <IconBtn
                                label="Reabrir"
                                onClick={() => run(p.id, () => setProductStatus(p.id, 'review'))}
                                loading={busy(p.id)}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </IconBtn>
                            )}
                            {p.status !== 'rejected' && (
                              <IconBtn
                                label="Rejeitar"
                                onClick={() => run(p.id, () => setProductStatus(p.id, 'rejected'))}
                                loading={busy(p.id)}
                              >
                                <Ban className="h-4 w-4" />
                              </IconBtn>
                            )}
                            <IconBtn label="Editar" onClick={() => startEdit(p)}>
                              <Pencil className="h-4 w-4" />
                            </IconBtn>
                            <IconBtn
                              label="Excluir"
                              onClick={() => {
                                if (confirm(`Excluir "${p.name}"?`)) {
                                  run(p.id, () => deleteProduct(p.id))
                                }
                              }}
                              loading={busy(p.id)}
                              variant="danger"
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconBtn>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  loading,
  variant = 'default',
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  loading?: boolean
  variant?: 'default' | 'primary' | 'success' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors disabled:opacity-50',
        variant === 'default' && 'hover:bg-muted hover:text-foreground',
        variant === 'primary' && 'bg-primary text-primary-foreground hover:bg-primary/90',
        variant === 'success' && 'hover:bg-emerald-500/10 hover:text-emerald-600',
        variant === 'danger' && 'hover:bg-destructive/10 hover:text-destructive'
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  )
}

function StatusBadge({ status }: { status: Status }) {
  if (status === 'approved') {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
        Aprovado
      </Badge>
    )
  }
  if (status === 'rejected') {
    return <Badge variant="destructive">Rejeitado</Badge>
  }
  return <Badge variant="secondary">Revisar</Badge>
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score == null) {
    return <span className="text-xs text-muted-foreground">N/A</span>
  }
  const pct = Math.round(score * 100)
  return (
    <Badge variant={score > 0.8 ? 'outline' : 'destructive'}>{pct}%</Badge>
  )
}
