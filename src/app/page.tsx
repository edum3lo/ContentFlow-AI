import Link from "next/link";
import { LandingMobileMenu } from "@/components/landing-mobile-menu";
import {
  ArrowRight,
  Sparkles,
  FileText,
  ScanText,
  CheckCircle2,
  LayoutGrid,
  Wand2,
  CalendarClock,
  Images,
  Download,
  ShieldCheck,
  Quote,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const features = [
  {
    icon: ScanText,
    title: "OCR + IA de leitura",
    desc: "Lê PDFs, listas de preço e fotos e extrai nome, categoria, marca e preço de cada produto automaticamente.",
  },
  {
    icon: Wand2,
    title: "Gerador de conteúdo",
    desc: "Cria posts, stories, carrosséis, legendas, hashtags e CTAs prontos a partir dos seus produtos.",
  },
  {
    icon: LayoutGrid,
    title: "Templates profissionais",
    desc: "Artes em estilos Premium, Minimalista, Moderno e Corporativo — sem precisar abrir um editor.",
  },
  {
    icon: CalendarClock,
    title: "Calendário de conteúdo",
    desc: "Planos de 7, 15, 30 ou 60 dias misturando produtos, promoções, benefícios e depoimentos.",
  },
  {
    icon: Images,
    title: "Banco de produtos",
    desc: "Tudo o que você envia vira um catálogo organizado e reutilizável, com imagens e histórico.",
  },
  {
    icon: Download,
    title: "Exportação rápida",
    desc: "Baixe a arte pronta em PNG ou JPG e publique no Instagram, TikTok, Facebook ou WhatsApp.",
  },
];

const steps = [
  {
    n: "01",
    title: "Envie o material",
    desc: "Catálogo em PDF, lista de preços ou fotos dos produtos. Do jeito que o fornecedor mandou.",
  },
  {
    n: "02",
    title: "A IA organiza",
    desc: "Extraímos e estruturamos cada produto: nome, categoria, preço e descrição.",
  },
  {
    n: "03",
    title: "Você revisa",
    desc: "Confirme, corrija ou edite. Nada é publicado sem a sua aprovação.",
  },
  {
    n: "04",
    title: "Gere e publique",
    desc: "Conteúdo pronto em minutos, com texto e arte. É só baixar e postar.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="flex-1">
        <Hero />
        <Audience />
        <Problem />
        <Steps />
        <Features />
        <FinalCta />
      </main>

      <SiteFooter />
    </div>
  );
}

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="text-lg font-semibold tracking-tight font-heading">
        ContentFlow<span className="text-primary"> AI</span>
      </span>
    </Link>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-foreground">
            Como funciona
          </a>
          <a href="#recursos" className="transition-colors hover:text-foreground">
            Recursos
          </a>
          <a href="#publico" className="transition-colors hover:text-foreground">
            Para quem é
          </a>
        </nav>
        {/* CTAs desktop */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Entrar
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Começar grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {/* Menu mobile (hambúrguer) */}
        <LandingMobileMenu />
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      <div className="pointer-events-none absolute inset-0 glow-primary opacity-50 animate-pulse-slow" />
      <div className="pointer-events-none absolute inset-0 glow-secondary opacity-30 translate-x-1/2 translate-y-1/3" />
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28 z-10">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Do catálogo ao post em minutos
          </span>

          <h1 className="mt-8 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Catálogos viram{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              conteúdo pronto
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Envie um PDF, uma lista de preços ou fotos dos seus produtos. A
            ContentFlow AI lê, organiza e gera posts, stories, legendas e
            hashtags — sem você precisar entender de design ou marketing.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Criar minha conta
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              Ver como funciona
            </a>
          </div>

          <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Você aprova antes de publicar
            </span>
            <span className="hidden items-center gap-1.5 sm:inline-flex">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Sem conhecimento técnico
            </span>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="grid gap-4 sm:grid-cols-[0.85fr_1.15fr] sm:items-center relative z-10">
        {/* Input: lista de preços crua */}
        <div className="glass-panel rounded-2xl p-5 animate-float-delayed relative -right-4 top-8 z-0">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <FileText className="h-4 w-4 text-primary" />
            lista-precos.pdf
          </div>
          <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            <div className="flex justify-between border-b border-white/5 pb-2"><p>Produto Premium</p> <p className="text-foreground">R$189</p></div>
            <div className="flex justify-between border-b border-white/5 pb-2"><p>Kit Especial</p> <p className="text-foreground">R$249</p></div>
            <div className="flex justify-between border-b border-white/5 pb-2"><p>Linha Essencial</p> <p className="text-foreground">R$99</p></div>
            <p className="opacity-50 mt-2">Carregando mais...</p>
          </div>
        </div>

        {/* Output: post gerado */}
        <div className="glass-panel rounded-2xl shadow-2xl animate-float relative z-10 border border-primary/20 overflow-hidden">
          <div className="aspect-[4/5] overflow-hidden bg-gradient-to-br from-primary/80 via-primary to-accent p-6 text-primary-foreground relative">
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            <div className="flex h-full flex-col justify-between relative z-10">
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-bold tracking-widest backdrop-blur-md shadow-sm border border-white/10 uppercase">
                <Sparkles className="h-3 w-3" />
                Destaque
              </span>
              <div>
                <div className="w-16 h-1.5 rounded-full bg-accent mb-4"></div>
                <p className="text-4xl font-bold leading-tight font-heading tracking-tight drop-shadow-md">
                  A inovação <br />
                  que você buscava
                </p>
                <div className="mt-8">
                  <p className="text-2xl font-bold">Produto Premium</p>
                  <p className="text-base opacity-90 font-medium mt-1">a partir de <span className="text-3xl font-extrabold text-background ml-1">R$ 189</span></p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-3 p-5 bg-card/80 backdrop-blur-md">
            <p className="text-sm leading-relaxed text-muted-foreground font-medium">
              Disponibilidade imediata e entrega para todo o Brasil. Chame no
              direct e garanta o seu. ✨
            </p>
            <p className="text-[12px] font-bold text-primary tracking-wide">
              #novidade #oferta #promoção
            </p>
          </div>
        </div>
      </div>

      <div className="absolute left-[35%] top-1/2 -translate-y-1/2 rounded-full glass-panel p-3 shadow-xl z-20 animate-pulse-slow">
        <Wand2 className="h-5 w-5 text-accent" />
      </div>
    </div>
  );
}

function Audience() {
  const items = [
    "Revendedores de perfumes",
    "Cosméticos",
    "Suplementos",
    "Peptídeos",
    "Pequenos e-commerces",
  ];
  return (
    <section id="publico" className="border-y border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Feito para quem vende todos os dias e não tem tempo de criar post
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-foreground/70">
          {items.map((i) => (
            <span key={i}>{i}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            O material chega bagunçado. <br className="hidden sm:block" />O post
            precisa sair pronto.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Pequenos negócios recebem produtos em catálogos PDF, prints de
            preços e fotos soltas de fornecedores. Nada disso está pronto para
            publicar — e organizar, escrever legenda, escolher hashtag e criar
            arte consome o dia inteiro.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            A ContentFlow AI tira esse trabalho das suas costas e transforma
            qualquer material em conteúdo profissional.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <QuoteCard
            text="Tudo isso exige tempo, conhecimento e consistência."
            className="sm:col-span-2"
          />
          {[
            "Organizar produtos",
            "Criar artes",
            "Escrever legendas",
            "Escolher hashtags",
          ].map((t) => (
            <div
              key={t}
              className="rounded-xl border border-border bg-card p-5 text-sm font-medium"
            >
              <span className="text-muted-foreground line-through decoration-primary/60 decoration-2">
                {t}
              </span>
              <span className="mt-2 block text-xs text-primary">
                feito pela IA
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuoteCard({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-primary/20 bg-primary/5 p-5 ${className}`}
    >
      <Quote className="h-5 w-5 text-primary" />
      <p className="mt-2 text-base font-medium leading-relaxed">{text}</p>
    </div>
  );
}

function Steps() {
  return (
    <section id="como-funciona" className="border-y border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <span className="text-sm font-semibold text-primary">
            Como funciona
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Quatro passos do upload ao post
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="relative glass-panel rounded-2xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-primary/30 group"
            >
              <span className="text-4xl font-extrabold text-white/5 font-heading absolute top-4 right-4 transition-colors group-hover:text-primary/10">
                {s.n}
              </span>
              <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground/90">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-medium">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="recursos" className="mx-auto max-w-6xl px-6 py-20">
      <div className="max-w-2xl">
        <span className="text-sm font-semibold text-primary">Recursos</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Tudo que você precisa para nunca mais ficar sem post
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Da leitura do catálogo à arte final, em uma única plataforma.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="group glass-panel rounded-2xl p-8 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_0_30px_-5px_rgba(109,40,217,0.3)]"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground shadow-inner">
              <f.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground/90">{f.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-medium">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-8 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 glow-primary opacity-70" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Pare de criar post manualmente
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Comece agora: envie um catálogo e veja a IA gerar semanas de
            conteúdo em poucos minutos.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Começar grátis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
        <Logo />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ContentFlow AI — Dev by Eduardo Melo
        </p>
      </div>
    </footer>
  );
}
