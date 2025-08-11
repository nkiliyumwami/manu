import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Sun, Moon, Menu } from 'lucide-react'
import { NotificationBell } from './components/NotificationBell'
import { ToastContainer } from './components/ToastContainer'
import { PnLChart, EquityCurveChart, WinRateChart } from './components/Charts'

function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState(
    document.documentElement.getAttribute('data-theme') || 'light'
  )
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('tp-theme', theme)
  }, [theme])
  return [theme, () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))]
}

function TopNav() {
  const [theme, toggle] = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b bg-[--card]">
      <div className="container-app flex h-14 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button className="lg:hidden button-ghost p-2" aria-label="Open sidebar" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="h-6 w-6 rounded bg-[--color-primary]"></span>
            TradePilot
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button className="button-ghost p-2" aria-label="Toggle theme" onClick={toggle}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="button-ghost p-2" aria-label="Notifications">
            <NotificationBell />
          </button>
        </div>
      </div>
      {/* Mobile drawer */}
      {open && (
        <div className="modal-backdrop lg:hidden" onClick={() => setOpen(false)}>
          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </header>
  )
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const link = (
    to: string,
    label: string,
    end?: boolean,
  ) => (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `block rounded-md px-3 py-2 text-sm ${isActive ? 'bg-[--color-primary] text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}`
      }
    >
      {label}
    </NavLink>
  )

  return (
    <nav className="space-y-1">
      {link('/', 'Dashboard', true)}
      {link('/strategies', 'Strategies')}
      {link('/trades', 'Trades')}
      {link('/settings', 'Settings')}
      {link('/logs', 'Logs')}
      {link('/help', 'Help')}
    </nav>
  )
}

function PageHeader({ title, crumbs }: { title: string; crumbs?: { label: string; to?: string }[] }) {
  const location = useLocation()
  return (
    <div className="mb-4 border-b pb-3">
      <nav aria-label="Breadcrumb" className="mb-2 text-[length:--text-2xs] text-[--muted]">
        <ol className="flex items-center gap-1">
          {(crumbs ?? []).map((c, i) => (
            <li key={i} className="flex items-center gap-1">
              {c.to ? <Link to={c.to} className="hover:underline">{c.label}</Link> : <span>{c.label}</span>}
              <span aria-hidden="true">/</span>
            </li>
          ))}
          <li><span>{location.pathname === '/' ? 'Dashboard' : ''}</span></li>
        </ol>
      </nav>
      <div className="flex items-center justify-between">
        <h1 className="text-[length:--text-xl] font-semibold">{title}</h1>
        <div className="hidden sm:flex items-center gap-2">
          <button className="button-primary">Start Strategy</button>
          <button className="button-secondary">Stop Strategy</button>
        </div>
      </div>
    </div>
  )
}

// Page stubs
function Dashboard() {
  const labels = Array.from({ length: 12 }, (_, i) => `M${i + 1}`)
  const seriesUp = { labels, data: labels.map((_, i) => 1000 + i * 120 + Math.random() * 80) }
  const seriesPnL = { labels, data: labels.map(() => Math.round((Math.random() - 0.2) * 500)) }
  const seriesWin = { labels, data: labels.map(() => Math.round(50 + Math.random() * 40)) }

  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" crumbs={[{ label: 'Home', to: '/' }]} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="card p-4">
          <div className="mb-2 text-sm text-[--muted]">P&L</div>
          <PnLChart series={seriesPnL} />
        </div>
        <div className="card p-4">
          <div className="mb-2 text-sm text-[--muted]">Equity Curve</div>
          <EquityCurveChart series={seriesUp} />
        </div>
        <div className="card p-4">
          <div className="mb-2 text-sm text-[--muted]">Win Rate</div>
          <WinRateChart series={seriesWin} />
        </div>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b font-medium">Recent Trades</div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Symbol</th>
                <th className="p-3">Side</th>
                <th className="p-3">Price</th>
                <th className="p-3">PnL</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3,4,5,6,7,8].map((i) => (
                <tr key={i} className="hover:bg.black/5 dark:hover:bg.white/5">
                  <td className="p-3">2025-08-10 12:3{i}</td>
                  <td className="p-3">BTCUSDT</td>
                  <td className="p-3"><span className="badge-success">LONG</span></td>
                  <td className="p-3">$63,12{i}</td>
                  <td className="p-3">+${i*12}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Strategies() {
  return (
    <div>
      <PageHeader title="Strategies" crumbs={[{ label: 'Home', to: '/' }, { label: 'Strategies' }]} />
      <div className="empty">
        <div className="text-[length:--text-lg] font-medium">No strategies yet</div>
        <div className="text-sm">Create a strategy to begin automated trading.</div>
        <button className="button-primary">New Strategy</button>
      </div>
    </div>
  )
}

function Trades() {
  return (
    <div>
      <PageHeader title="Trades" crumbs={[{ label: 'Home', to: '/' }, { label: 'Trades' }]} />
      <div className="card p-4">Trades table goes here</div>
    </div>
  )
}

function Settings() {
  return (
    <div>
      <PageHeader title="Settings" crumbs={[{ label: 'Home', to: '/' }, { label: 'Settings' }]} />
      <div className="card p-4 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Webhook URL</label>
          <input className="input" placeholder="https://n8n.example/webhook/123" />
          <div className="input-help">n8n webhook endpoint to trigger strategy actions.</div>
        </div>
        <div>
          <label className="block text-sm mb-1">API Key</label>
          <input className="input" type="password" placeholder="••••••" />
        </div>
        <button className="button-primary">Save</button>
      </div>
    </div>
  )
}

function Logs() {
  return (
    <div>
      <PageHeader title="Logs" crumbs={[{ label: 'Home', to: '/' }, { label: 'Logs' }]} />
      <div className="card p-4">Streaming logs placeholder</div>
    </div>
  )
}

function Help() {
  return (
    <div>
      <PageHeader title="Help" crumbs={[{ label: 'Home', to: '/' }, { label: 'Help' }]} />
      <div className="prose prose-invert max-w-none">
        <p>Use TradePilot to control your n8n-powered trading bot. Start/Stop strategies, monitor P&amp;L, and review trades.</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div>
      <TopNav />
      <ToastContainer />
      <div className="container-app main-grid mt-4">
        <aside className="sidebar">
          <Sidebar />
        </aside>
        <main className="min-h-[60vh] pb-24">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/strategies" element={<Strategies />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
      </div>
      <div className="mobile-cta">
        <div className="flex items-center gap-2">
          <button className="button-primary flex-1">Start Strategy</button>
          <button className="button-secondary flex-1">Stop</button>
        </div>
      </div>
    </div>
  )
}
