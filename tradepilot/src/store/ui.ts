import { create } from 'zustand'

type Toast = { id: string; title: string; description?: string; type?: 'default' | 'success' | 'warning' | 'danger' }

type UiState = {
  toasts: Toast[]
  notifyCount: number
  addToast: (t: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  setNotify: (n: number) => void
}

export const useUi = create<UiState>((set) => ({
  toasts: [],
  notifyCount: 0,
  addToast: (t) => set((s) => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), ...t }] })),
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
  clearToasts: () => set({ toasts: [] }),
  setNotify: (n) => set({ notifyCount: n }),
}))