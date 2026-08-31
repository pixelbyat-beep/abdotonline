import { ShieldCheck, MailCheck, Truck, Lock, Headphones } from 'lucide-react'

const badges = [
  { icon: ShieldCheck, label: '100% Genuine', sub: 'Authentic software licenses.' },
  { icon: MailCheck, label: 'Instant Email', sub: 'Delivery within minutes.' },
  { icon: Truck, label: 'Fast Courier', sub: 'Reliable physical shipping.' },
  { icon: Lock, label: 'Secure Payment', sub: '256-bit SSL encryption.' },
  { icon: Headphones, label: '24/7 Support', sub: 'Expert technical assistance.' },
]

export function TrustBadges() {
  return (
    <section className="border-t border-border/60 bg-bg-main py-10">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:grid-cols-3 md:grid-cols-5 md:px-6">
        {badges.map(({ icon: Icon, label, sub }) => (
          <div key={label} className="group flex flex-col items-center gap-2.5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-bg-card transition-all group-hover:bg-accent/10 group-hover:shadow-[0_0_20px_rgba(25,217,242,0.2)]">
              <Icon size={26} className="text-accent" />
            </div>
            <h4 className="text-xs font-semibold text-text-primary">{label}</h4>
            <p className="hidden text-[11px] text-text-secondary sm:block">{sub}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
