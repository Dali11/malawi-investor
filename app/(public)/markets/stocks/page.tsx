import { TrendingUp } from 'lucide-react'
import ComingSoon from '@/components/home/ComingSoon'

export default function StocksPage() {
    return (
        <ComingSoon
            icon={TrendingUp}
            title="Stocks"
            description="Browse every company listed on the MSE with live prices, charts and fundamentals. We're building this out next."
        />
    )
}
