import { Rocket } from 'lucide-react'
import ComingSoon from '@/components/home/ComingSoon'

export default function IposPage() {
    return (
        <ComingSoon
            icon={Rocket}
            title="IPOs"
            description="Upcoming and past initial public offerings on the Malawi Stock Exchange."
        />
    )
}
