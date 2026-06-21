'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SimulatorClient({
    portfolio,
    holdings,
    counters,
    latestPrices,
    transactions,
    userId,
}: any) {
    const [tab, setTab] = useState<'portfolio' | 'invest' | 'history'>('portfolio')
    const [selectedCounter, setSelectedCounter] = useState('')
    const [shares, setShares] = useState('')
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const selectedPrice = selectedCounter ? latestPrices[parseInt(selectedCounter)] : 0
    const totalCost = selectedPrice && shares ? selectedPrice * parseInt(shares) : 0

    const portfolioValue = holdings.reduce((sum: number, h: any) => {
        const price = latestPrices[h.counter_id] ?? h.avg_buy_price
        return sum + price * h.shares
    }, 0)

    const totalValue = portfolioValue + Number(portfolio?.cash_balance ?? 0)
    const startValue = 1000000
    const gain = totalValue - startValue
    const gainPct = ((gain / startValue) * 100).toFixed(2)

    async function executeTrade() {
        if (!portfolio || !selectedCounter || !shares || parseInt(shares) <= 0) return
        setLoading(true)
        setMessage('')

        const counterId = parseInt(selectedCounter)
        const numShares = parseInt(shares)
        const price = latestPrices[counterId]
        const total = price * numShares

        if (tradeType === 'buy') {
            if (total > Number(portfolio.cash_balance)) {
                setMessage('Insufficient cash balance')
                setLoading(false)
                return
            }

            const existing = holdings.find((h: any) => h.counter_id === counterId)

            if (existing) {
                await supabase.from('sim_holdings').update({
                    shares: existing.shares + numShares,
                    avg_buy_price: ((existing.avg_buy_price * existing.shares) + total) / (existing.shares + numShares)
                }).eq('id', existing.id)
            } else {
                await supabase.from('sim_holdings').insert({
                    portfolio_id: portfolio.id,
                    counter_id: counterId,
                    shares: numShares,
                    avg_buy_price: price
                })
            }

            await supabase.from('sim_portfolios').update({
                cash_balance: Number(portfolio.cash_balance) - total
            }).eq('id', portfolio.id)

        } else {
            const existing = holdings.find((h: any) => h.counter_id === counterId)
            if (!existing || existing.shares < numShares) {
                setMessage('Insufficient shares')
                setLoading(false)
                return
            }

            if (existing.shares === numShares) {
                await supabase.from('sim_holdings').delete().eq('id', existing.id)
            } else {
                await supabase.from('sim_holdings').update({
                    shares: existing.shares - numShares
                }).eq('id', existing.id)
            }

            await supabase.from('sim_portfolios').update({
                cash_balance: Number(portfolio.cash_balance) + total
            }).eq('id', portfolio.id)
        }

        await supabase.from('sim_transactions').insert({
            portfolio_id: portfolio.id,
            counter_id: counterId,
            transaction_type: tradeType,
            shares: numShares,
            price_per_share: price,
            total_value: total
        })

        setMessage(`${tradeType === 'buy' ? 'Invested in' : 'Divested from'} ${numShares} shares successfully`)
        setShares('')
        setLoading(false)
        router.refresh()
    }

    async function resetPortfolio() {
        await supabase.from('sim_holdings').delete().eq('portfolio_id', portfolio.id)
        await supabase.from('sim_portfolios').update({ cash_balance: 1000000 }).eq('id', portfolio.id)
        await supabase.from('sim_transactions').delete().eq('portfolio_id', portfolio.id)
        router.refresh()
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-xl font-medium text-gray-900">Investment Simulator</h1>
                <p className="text-sm text-gray-500 mt-0.5">Practice with MK 1,000,000 — real MSE prices, no real money</p> 
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Portfolio value</p>
                    <p className="text-lg font-medium text-gray-900">MK {portfolioValue.toLocaleString()}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Cash balance</p>
                    <p className="text-lg font-medium text-gray-900">MK {Number(portfolio?.cash_balance ?? 0).toLocaleString()}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-400 mb-1">Total gain/loss</p>
                    <p className={`text-lg font-medium ${gain >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {gain >= 0 ? '+' : ''}MK {gain.toLocaleString()} ({gainPct}%)
                    </p>
                </div>
            </div>

            <div className="flex gap-2 mb-4">
                {(['portfolio', 'invest', 'history'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-amber-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === 'portfolio' && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {holdings.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400">
                            No holdings yet. Go to Trade tab to buy your first shares.
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Stock</th>
                                    <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Shares</th>
                                    <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Avg buy</th>
                                    <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Current</th>
                                    <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Value</th>
                                    <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((h: any) => {
                                    const current = latestPrices[h.counter_id] ?? h.avg_buy_price
                                    const value = current * h.shares
                                    const pl = (current - h.avg_buy_price) * h.shares
                                    return (
                                        <tr key={h.id} className="border-b border-gray-50">
                                            <td className="px-4 py-3 font-medium text-amber-600">{h.mse_counters?.symbol}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{h.shares}</td>
                                            <td className="px-4 py-3 text-right text-gray-500">MK {Number(h.avg_buy_price).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">MK {current.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">MK {value.toLocaleString()}</td>
                                            <td className={`px-4 py-3 text-right font-medium ${pl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {pl >= 0 ? '+' : ''}MK {pl.toLocaleString()}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === 'trade' && (
                <div className="bg-white border border-gray-200 rounded-xl p-5 max-w-md">
                    {message && (
                        <div className={`mb-4 text-sm px-3 py-2 rounded-lg ${message.includes('success') || message.includes('Bought') || message.includes('Sold') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                            {message}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTradeType('buy')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tradeType === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => setTradeType('sell')}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tradeType === 'sell' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                            >
                                Sell
                            </button>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Select stock</label>
                            <select
                                value={selectedCounter}
                                onChange={e => setSelectedCounter(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                            >
                                <option value="">Choose a counter</option>
                                {counters.filter((c: any) => latestPrices[c.id]).map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.symbol} — MK {latestPrices[c.id]?.toLocaleString()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600 block mb-1">Number of shares</label>
                            <input
                                type="number"
                                value={shares}
                                onChange={e => setShares(e.target.value)}
                                min="1"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
                                placeholder="e.g. 10"
                            />
                        </div>

                        {totalCost > 0 && (
                            <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-600">
                                Total {tradeType === 'buy' ? 'cost' : 'value'}: <span className="font-medium text-gray-900">MK {totalCost.toLocaleString()}</span>
                            </div>
                        )}

                        <button
                            onClick={executeTrade}
                            disabled={loading || !selectedCounter || !shares}
                            className={`w-full text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
                        >
                            {loading ? 'Processing...' : `${tradeType === 'buy' ? 'Invest' : 'Divest'} shares`}
                        </button>
                    </div>
                </div>
            )}

            {tab === 'history' && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {transactions.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400">No transactions yet.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Date</th>
                                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Stock</th>
                                    <th className="text-left px-4 py-3 text-xs text-gray-400 font-medium">Type</th>
                                    <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Shares</th>
                                    <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Price</th>
                                    <th className="text-right px-4 py-3 text-xs text-gray-400 font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t: any) => (
                                    <tr key={t.id} className="border-b border-gray-50">
                                        <td className="px-4 py-3 text-gray-400 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-medium text-amber-600">{t.mse_counters?.symbol}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.transaction_type === 'buy' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                {t.transaction_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-700">{t.shares}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">MK {Number(t.price_per_share).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right text-gray-700">MK {Number(t.total_value).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <button
                onClick={resetPortfolio}
                className="mt-4 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
                Reset portfolio and start over
            </button>
        </div>
    )
}