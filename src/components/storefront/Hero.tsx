import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useHomeContent } from '@/hooks/useHomeContent'
import { publicImageUrl } from '@/lib/supabaseClient'

export function Hero() {
  const { data } = useHomeContent()
  const hero = data!.hero
  if (!hero.enabled) return null

  const titleLines = hero.title.split('\n')

  return (
    <section className="relative min-h-[520px] overflow-hidden border-b border-border bg-bg-main md:min-h-[600px]">
      <div className="pointer-events-none absolute inset-0">
        <img src={publicImageUrl(hero.imageDark)} alt="" className="hidden h-full w-full object-cover dark:block" />
        <img src={publicImageUrl(hero.imageLight)} alt="" className="block h-full w-full object-cover dark:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-main from-5% via-bg-main/60 via-45% to-transparent to-80%" />
      </div>

      <div className="relative mx-auto flex h-full min-h-[520px] max-w-7xl items-center px-4 py-16 md:min-h-[600px] md:px-6 md:py-28">
        <div className="max-w-2xl">
          {hero.badge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold tracking-wide text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {hero.badge}
            </span>
          )}
          <h1 className="mt-5 text-3xl font-bold leading-tight text-text-primary md:text-5xl">
            {titleLines.map((line, i) => (
              <span key={i}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
          {hero.subtitle && <p className="mt-4 max-w-lg text-sm text-text-secondary md:text-base">{hero.subtitle}</p>}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {hero.primaryLabel && (
              <Link to={hero.primaryLink || '/listing'} className="w-full sm:w-auto">
                <Button size="lg" pill glow fullWidth className="sm:w-auto">
                  {hero.primaryLabel}
                </Button>
              </Link>
            )}
            {hero.secondaryEnabled && hero.secondaryLabel && (
              <Link to={hero.secondaryLink || '/listing'} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" pill fullWidth className="sm:w-auto">
                  {hero.secondaryLabel}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
