import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

export default function ArticleLoading() {
    return (
        <>
            <Skeleton width={80} height={16} className="mb-6" />

            <Skeleton height={32} className="mb-2" />
            <Skeleton height={32} width="65%" className="mb-4" />

            <div className="flex items-center gap-2 mb-6">
                <Skeleton circle width={32} height={32} />
                <Skeleton width={130} height={16} />
            </div>

            <Skeleton height={288} borderRadius={12} className="mb-6" />

            <Skeleton count={8} className="mb-3" />
        </>
    )
}