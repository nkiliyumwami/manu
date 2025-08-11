import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: 'var(--muted)' } },
    y: { grid: { color: 'color-mix(in oklab, var(--fg) 10%, transparent)' }, ticks: { color: 'var(--muted)' } },
  },
}

type Series = { labels: string[]; data: number[] }

export function PnLChart({ series }: { series: Series }) {
  const data = {
    labels: series.labels,
    datasets: [
      { data: series.data, borderColor: 'var(--color-success)', backgroundColor: 'color-mix(in oklab, var(--color-success) 15%, transparent)', fill: true, tension: 0.3 }
    ],
  }
  return <div style={{ height: 160 }}><Line data={data} options={baseOptions as any} /></div>
}

export function EquityCurveChart({ series }: { series: Series }) {
  const data = {
    labels: series.labels,
    datasets: [
      { data: series.data, borderColor: 'var(--color-primary)', backgroundColor: 'color-mix(in oklab, var(--color-primary) 15%, transparent)', fill: true, tension: 0.3 }
    ],
  }
  return <div style={{ height: 160 }}><Line data={data} options={baseOptions as any} /></div>
}

export function WinRateChart({ series }: { series: Series }) {
  const data = {
    labels: series.labels,
    datasets: [
      { data: series.data, borderColor: 'var(--color-warning)', backgroundColor: 'color-mix(in oklab, var(--color-warning) 15%, transparent)', fill: true, tension: 0.3 }
    ],
  }
  return <div style={{ height: 160 }}><Line data={data} options={baseOptions as any} /></div>
}