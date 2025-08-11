type Props = { kind?: 'success' | 'warning' | 'danger' | 'default'; children: React.ReactNode }
export function Badge({ kind = 'default', children }: Props) {
  const base = 'badge'
  const map: Record<string, string> = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    default: 'bg-black/10 dark:bg-white/10',
  }
  return <span className={`${base} ${map[kind]}`}>{children}</span>
}