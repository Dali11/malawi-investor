export default function ArticleLoading() {
    return (
        <div className="mx-auto max-w-3xl px-2 sm:px-4 lg:px-6 py-6 animate-pulse">
            <div className="h-4 w-20 bg-gray-200 rounded mb-6" />

            <div className="h-8 w-full bg-gray-200 rounded mb-2" />
            <div className="h-8 w-2/3 bg-gray-200 rounded mb-4" />

            <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 bg-gray-200 rounded-full" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>

            <div className="h-72 bg-gray-200 rounded-xl mb-6" />

            <div className="space-y-3">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${85 + (i % 3) * 5}%` }} />
                ))}
            </div>
        </div>
    )
}