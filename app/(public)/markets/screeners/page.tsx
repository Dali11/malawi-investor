import { SlidersHorizontal } from 'lucide-react'
import ComingSoon from '@/components/home/ComingSoon'

export default function ScreenersPage() {
    return (
        <ComingSoon
            icon={SlidersHorizontal}
            title="Screeners"
            description="Filter MSE-listed stocks by sector, price, performance and other criteria you choose."
        />
    )
}
