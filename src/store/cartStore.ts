import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartLine } from '@/types/domain'

export interface AppliedCoupon {
  code: string
  type: 'percent' | 'fixed'
  value: number
}

interface CartState {
  items: CartLine[]
  coupon: AppliedCoupon | null
  addItem: (item: CartLine) => void
  removeItem: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  clear: () => void
  replaceAll: (items: CartLine[]) => void
  setCoupon: (coupon: AppliedCoupon | null) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,
      setCoupon: (coupon) => set({ coupon }),
      addItem: (item) => {
        const existing = get().items.find((i) => i.productId === item.productId)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId ? { ...i, qty: Math.min(i.qty + item.qty, i.stockQty || 99) } : i,
            ),
          })
        } else {
          set({ items: [...get().items, item] })
        }
      },
      removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      setQty: (productId, qty) =>
        set({
          items:
            qty <= 0
              ? get().items.filter((i) => i.productId !== productId)
              : get().items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
        }),
      clear: () => set({ items: [], coupon: null }),
      replaceAll: (items) => set({ items }),
    }),
    { name: 'abdotstore-cart' },
  ),
)

export function cartSubtotal(items: CartLine[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0)
}

export function cartCount(items: CartLine[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0)
}
