import { useUi } from '../store/ui'
import { X } from 'lucide-react'

export function ToastContainer() {
  const { toasts, removeToast } = useUi()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-[60] mx-auto flex max-w-md flex-col gap-2 p-4">
      {toasts.map((t) => (
        <div key={t.id} role="status" className={`toast ${t.type ? `border-${t.type}` : ''} pointer-events-auto`}> 
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="font-medium">{t.title}</div>
              {t.description && <div className="text-sm text-[--muted]">{t.description}</div>}
            </div>
            <button className="button-ghost p-1" aria-label="Dismiss" onClick={() => removeToast(t.id)}>
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}