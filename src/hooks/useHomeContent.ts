import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface HomeContent {
  hero: {
    enabled: boolean
    badge: string
    title: string
    subtitle: string
    primaryLabel: string
    primaryLink: string
    secondaryEnabled: boolean
    secondaryLabel: string
    secondaryLink: string
    imageLight: string
    imageDark: string
  }
  categories: {
    enabled: boolean
    title: string
    subtitle: string
    hiddenIds: string[]
  }
  trending: {
    enabled: boolean
    title: string
    limit: number
    /** Hand-picked products, in display order. Empty = automatically show products flagged as featured. */
    productIds: string[]
  }
  deals: {
    enabled: boolean
    title: string
    subtitle: string
    buttonLabel: string
    limit: number
    /** Hand-picked products, in display order. Empty = automatically show the biggest discounts. */
    productIds: string[]
  }
}

export const HOME_CONTENT_KEY = 'home_content'

export const HOME_DEFAULTS: HomeContent = {
  hero: {
    enabled: true,
    badge: 'GENUINE SOFTWARE',
    title: 'Trusted Software.\nDelivered Your Way.',
    subtitle: 'Genuine software, secure payments and fast delivery for your digital needs.',
    primaryLabel: 'Shop Software',
    primaryLink: '/listing',
    secondaryEnabled: true,
    secondaryLabel: 'Explore Deals',
    secondaryLink: '/listing?filter=deals',
    imageLight: '/hero/homewhite.png',
    imageDark: '/hero/homeblack.png',
  },
  categories: {
    enabled: true,
    title: 'Browse Categories',
    subtitle: 'Find the exact tools you need.',
    hiddenIds: [],
  },
  trending: { enabled: true, title: 'Trending Software', limit: 4, productIds: [] },
  deals: {
    enabled: true,
    title: 'Software Deals',
    subtitle: 'Upgrade your digital experience without overspending.',
    buttonLabel: 'View All Deals',
    limit: 4,
    productIds: [],
  },
}

/** Merge saved JSON over the defaults section by section so a missing/partial value never breaks the page. */
export function parseHomeContent(raw: string | null | undefined): HomeContent {
  let saved: Partial<Record<keyof HomeContent, unknown>> = {}
  if (raw) {
    try {
      saved = JSON.parse(raw) ?? {}
    } catch {
      saved = {}
    }
  }
  const merge = <K extends keyof HomeContent>(key: K): HomeContent[K] => ({
    ...HOME_DEFAULTS[key],
    ...((saved[key] as object | undefined) ?? {}),
  })
  return {
    hero: merge('hero'),
    categories: merge('categories'),
    trending: merge('trending'),
    deals: merge('deals'),
  }
}

export function useHomeContent() {
  return useQuery({
    queryKey: ['home-content'],
    queryFn: async (): Promise<HomeContent> => {
      const { data, error } = await supabase.from('settings').select('value').eq('key', HOME_CONTENT_KEY).maybeSingle()
      if (error) throw error
      return parseHomeContent(data?.value)
    },
    staleTime: 60 * 1000,
    placeholderData: HOME_DEFAULTS,
  })
}

export function useSaveHomeContent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (content: HomeContent) => {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: HOME_CONTENT_KEY, value: JSON.stringify(content) }, { onConflict: 'key' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['home-content'] }),
  })
}
