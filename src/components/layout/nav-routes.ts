import {
  LayoutDashboard,
  FileText,
  Package,
  Images,
  CalendarDays,
  Palette,
} from 'lucide-react'

/** Itens de navegação compartilhados entre a Sidebar (desktop) e o MobileNav. */
export const navRoutes = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Catálogos', icon: FileText, href: '/dashboard/catalogs' },
  { label: 'Produtos', icon: Package, href: '/dashboard/products' },
  { label: 'Conteúdos', icon: Images, href: '/dashboard/contents' },
  { label: 'Calendário', icon: CalendarDays, href: '/dashboard/calendar' },
  { label: 'Marca', icon: Palette, href: '/dashboard/settings' },
] as const

/** Marca uma rota como ativa (exata para o dashboard, prefixo para o resto). */
export function isRouteActive(pathname: string, href: string): boolean {
  return href === '/dashboard'
    ? pathname === href
    : pathname.startsWith(href)
}
