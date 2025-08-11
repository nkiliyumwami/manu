type Props = {
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
}

export function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const prevDisabled = page <= 1
  const nextDisabled = page >= pageCount
  return (
    <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
      <button className="button-secondary" disabled={prevDisabled} onClick={() => onPageChange(page - 1)}>Previous</button>
      <span className="text-[--muted]">Page {page} of {pageCount}</span>
      <button className="button-secondary" disabled={nextDisabled} onClick={() => onPageChange(page + 1)}>Next</button>
    </nav>
  )
}