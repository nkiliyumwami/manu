import { useMemo } from 'react'

export function usePagination<T>(items: T[], page: number, pageSize: number) {
  return useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const pageItems = items.slice(start, end)
    return { items: pageItems, total: items.length }
  }, [items, page, pageSize])
}