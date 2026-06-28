export default function AnalysisLoading() {
    return (
        <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 py-6 animate-pulse">
            <div className="h-7 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded mb-6" />

            <div className="flex gap-2 mb-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                <div>
                    <div className="h-64 bg-gray-200 rounded-xl mb-4" />
                    <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
                    <div className="h-7 w-3/4 bg-gray-200 rounded mb-3" />
                    <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-full bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded mb-6" />

                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-4 mb-4">
                            <div className="h-20 w-28 bg-gray-200 rounded-lg flex-shrink-0" />
                            <div className="flex-1">
                                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                                <div className="h-3 w-24 bg-gray-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>

                <div>
                    <div className="h-5 w-32 bg-gray-200 rounded mb-3" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between mb-3">
                            <div className="h-4 w-16 bg-gray-200 rounded" />
                            <div className="h-4 w-12 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}