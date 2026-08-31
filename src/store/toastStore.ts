import { create } from 'zustand'

export interface Toast {
  id: number
  message: string
  tone: 'success' | 'error' | 'info'
}

interface ToastState {
  toasts: Toast[]
  push: (message: string, tone?: Toast['tone']) => void
  dismiss: (id: number) => void
}

let counter = 0

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (message, tone = 'info') => {
    const id = ++counter
    set({ toasts: [...get().toasts, { id, message, tone }] })
    setTimeout(() => get().dismiss(id), 3500)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

export function toast(message: string, tone?: Toast['tone']) {
  useToastStore.getState().push(message, tone)
}
