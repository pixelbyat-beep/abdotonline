import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import type { ProductWithImages } from '@/types/domain'

const PRODUCT_SELECT = '*, product_images(*), categories(id, name, slug)'

export function useFeaturedProducts(limit = 4) {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'active')
        .eq('featured', true)
        .limit(limit)
      if (error) throw error
      return data as unknown as ProductWithImages[]
    },
  })
}

export function useDealsProducts(limit = 4) {
  return useQuery({
    queryKey: ['products', 'deals', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'active')
        .gt('discount_pct', 0)
        .order('discount_pct', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as unknown as ProductWithImages[]
    },
  })
}

export interface ProductListFilters {
  categorySlug?: string
  search?: string
  brands?: string[]
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'deals'
  page?: number
  pageSize?: number
}

export function useProductsList(filters: ProductListFilters) {
  const { categorySlug, search, brands, sort = 'newest', page = 1, pageSize = 12 } = filters

  return useQuery({
    queryKey: ['products', 'list', filters],
    queryFn: async () => {
      let query = supabase.from('products').select(PRODUCT_SELECT, { count: 'exact' }).eq('status', 'active')

      if (categorySlug) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).single()
        if (cat) query = query.eq('category_id', cat.id)
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,description.ilike.%${search}%`)
      }
      if (brands && brands.length > 0) {
        query = query.in('brand', brands)
      }
      if (sort === 'deals') query = query.gt('discount_pct', 0)

      switch (sort) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'rating':
          query = query.order('rating_avg', { ascending: false })
          break
        case 'deals':
          query = query.order('discount_pct', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data, error, count } = await query.range(from, to)
      if (error) throw error
      return { products: data as unknown as ProductWithImages[], total: count ?? 0 }
    },
  })
}

/** Distinct brand names available within a category (or the whole catalog), for the sidebar brand-filter facet. */
export function useProductBrands(categorySlug?: string) {
  return useQuery({
    queryKey: ['products', 'brands', categorySlug],
    queryFn: async () => {
      let query = supabase.from('products').select('brand').eq('status', 'active').not('brand', 'is', null)
      if (categorySlug) {
        const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).single()
        if (cat) query = query.eq('category_id', cat.id)
      }
      const { data, error } = await query
      if (error) throw error
      const unique = Array.from(new Set((data as { brand: string | null }[]).map((r) => r.brand).filter((b): b is string => !!b)))
      return unique.sort((a, b) => a.localeCompare(b))
    },
  })
}

export function useProductBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug!).single()
      if (error) throw error
      return data as unknown as ProductWithImages
    },
  })
}

export function useRelatedProducts(categoryId: string | undefined, excludeId: string | undefined) {
  return useQuery({
    queryKey: ['products', 'related', categoryId, excludeId],
    enabled: !!categoryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('status', 'active')
        .eq('category_id', categoryId!)
        .neq('id', excludeId ?? '')
        .limit(4)
      if (error) throw error
      return data as unknown as ProductWithImages[]
    },
  })
}
