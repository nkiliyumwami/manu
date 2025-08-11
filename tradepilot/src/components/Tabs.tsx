import { useState } from 'react'
import type { ReactNode } from 'react'

export function Tabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id)
  return (
    <div>
      <div role="tablist" aria-label="Tabs" className="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={active === t.id} className="tab" onClick={() => setActive(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-3">
        {tabs.map((t) => (
          <div key={t.id} role="tabpanel" hidden={active !== t.id}>
            {t.content}
          </div>
        ))}
      </div>
    </div>
  )
}