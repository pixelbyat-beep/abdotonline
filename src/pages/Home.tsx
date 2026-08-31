import { Hero } from '@/components/storefront/Hero'
import { CategoryGrid } from '@/components/storefront/CategoryGrid'
import { BestSellers } from '@/components/storefront/BestSellers'
import { DealsSection } from '@/components/storefront/DealsSection'
import { TrustBadges } from '@/components/storefront/TrustBadges'

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryGrid />
      <BestSellers />
      <DealsSection />
      <TrustBadges />
    </>
  )
}
