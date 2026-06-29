import { Calendar } from 'lucide-react'
import ComingSoon from '@/components/home/ComingSoon'

export default function MarketsCalendarPage() {
    return (
        <ComingSoon
            icon={Calendar}
            title="Calendar"
            description="AGMs, earnings releases and other key dates for MSE-listed companies."
        />
    )
}
