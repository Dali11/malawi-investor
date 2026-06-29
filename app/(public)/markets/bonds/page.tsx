import { Landmark } from 'lucide-react'
import ComingSoon from '@/components/home/ComingSoon'

export default function BondsPage() {
    return (
        <ComingSoon
            icon={Landmark}
            title="Bonds"
            description="Treasury and corporate bond listings, yields and maturities for Malawi's fixed income market."
        />
    )
}
