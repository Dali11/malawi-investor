import { LayoutDashboard } from 'lucide-react'
import ComingSoon from '@/components/home/ComingSoon'

export default function MarketOverviewPage() {
    return (
        <ComingSoon
            icon={LayoutDashboard}
            title="Market Overview"
            description="A single snapshot of how the MSE is doing today — top movers, volume and sector performance."
        />
    )
}
