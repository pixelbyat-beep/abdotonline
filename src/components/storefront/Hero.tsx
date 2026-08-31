import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function Hero() {
  return (
    <section className="relative min-h-[520px] overflow-hidden border-b border-border bg-bg-main md:min-h-[600px]">
      <div className="pointer-events-none absolute inset-0">
        <img src="/hero/homeblack.png" alt="" className="hidden h-full w-full object-cover dark:block" />
        <img src="/hero/homewhite.png" alt="" className="block h-full w-full object-cover dark:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg-main from-5% via-bg-main/60 via-45% to-transparent to-80%" />
      </div>

      <div className="relative mx-auto flex h-full min-h-[520px] max-w-7xl items-center px-4 py-16 md:min-h-[600px] md:px-6 md:py-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold tracking-wide text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            GENUINE SOFTWARE
          </span>
          <h1 className="mt-5 text-3xl font-bold leading-tight text-text-primary md:text-5xl">
            Trusted Software.
            <br />
            Delivered Your Way.
          </h1>
          <p className="mt-4 max-w-lg text-sm text-text-secondary md:text-base">
            Genuine software, secure payments and fast delivery for your digital needs.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/listing" className="w-full sm:w-auto">
              <Button size="lg" pill glow fullWidth className="sm:w-auto">
                Shop Software
              </Button>
            </Link>
            <Link to="/listing?filter=deals" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" pill fullWidth className="sm:w-auto">
                Explore Deals
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
