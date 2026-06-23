import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { getSymbol, type PriceMover } from '@/types/home'
import MseIndexChart from './MseIndexChart'



export function MarketSnapshot({ movers }: { movers: PriceMover[] }) {
  if (movers.length === 0) return null

  return (
    <div className="overflow-hidden rounded-(--border-radius-lg) border-[0.5px] border-(--color-border-tertiary) bg-(--color-background-primary) shadow-(--shadow-card)">
      <div className="border-b-[0.5px] border-(--color-border-tertiary) px-4 py-2.5">
        <p className="text-xs font-bold tracking-wider text-(--color-text-tertiary) uppercase">Market snapshot</p>
      </div>
      <div>
        {movers.map((p, i) => {
          const symbol = getSymbol(p.mse_counters)
          const pct = Number(p.change_pct)
          const isUp = pct > 0
          const textVar = isUp ? 'var(--color-text-success)' : 'var(--color-text-danger)'

          return (
            <Link
              key={i}
              href={`/mse/${symbol?.toLowerCase()}`}
              className={`flex items-center justify-between gap-3 px-4 py-2.5 no-underline transition-colors hover:bg-(--color-background-secondary) ${
                i < movers.length - 1 ? 'border-b-[0.5px] border-(--color-border-tertiary)' : ''
              }`}
            >
              <span className="text-sm font-semibold text-(--color-text-primary)">{symbol}</span>
              <span className="font-(family-name:--font-mono) text-sm text-(--color-text-secondary)">
                {Number(p.price).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="flex items-center gap-1 text-sm font-medium" style={{ color: textVar }}>
                {isUp ? <TrendingUp size={13} aria-hidden="true" /> : <TrendingDown size={13} aria-hidden="true" />}
                {isUp ? '+' : ''}
                {pct.toFixed(2)}%
              </span>
            </Link>
          )
        })}
      </div>
      <MseIndexChart />
    </div>
  )
}