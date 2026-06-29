import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function AnalysisLoading() {
    return (
        <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 py-6">
            <Skeleton width={130} height={28} className="mb-2" />
            <Skeleton width={260} height={16} className="mb-6" />

            <div className="flex gap-2 mb-6">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} width={80} height={32} borderRadius={999} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <div>
                    <Skeleton height={256} borderRadius={12} className="mb-4" />
                    <Skeleton width={80} height={16} className="mb-3" />
                    <Skeleton height={28} width="75%" className="mb-3" />
                    <Skeleton count={3} className="mb-2" />

                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-4 mb-4">
                            <Skeleton width={112} height={80} borderRadius={8} />
                            <div className="flex-1">
                                <Skeleton height={20} width="75%" className="mb-2" />
                                <Skeleton width={96} height={12} />
                            </div>
                        </div>
                    ))}
                </div>

                <div>
                    <Skeleton width={130} height={20} className="mb-3" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between mb-3">
                            <Skeleton width={64} height={16} />
                            <Skeleton width={48} height={16} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}