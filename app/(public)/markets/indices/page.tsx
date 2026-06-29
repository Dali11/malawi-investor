import { BarChart3 } from 'lucide-react'
import ComingSoon from '@/components/home/ComingSoon'

export default function IndicesPage() {
    return (
        <ComingSoon
            icon={BarChart3}
            title="Indices"
            description="Track the MASI and sector indices over time, with breakdowns of what's driving the moves."
        />
    )
}
