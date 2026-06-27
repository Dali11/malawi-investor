import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LearnPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: modules } = await supabase
    .from('modules')
    .select('id, slug, order_index, title, description')
    .order('order_index', { ascending: true })

  let completedModuleIds = new Set<string>()
  if (user && modules) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('module_id')
      .eq('user_id', user.id)

    completedModuleIds = new Set(progress?.map(p => p.module_id) ?? [])
  }

  const allModules = modules ?? []
  const completedCount = allModules.filter(m => completedModuleIds.has(m.id)).length

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-600 font-medium mb-1">
              BBN Investment Academy
            </p>
            <h1 className="text-2xl font-medium text-gray-900">Learn the MSE</h1>
          </div>
          {user && (
            <p className="text-sm text-gray-500">
              {completedCount} of {allModules.length} modules completed
            </p>
          )}
        </div>

        <div className="space-y-3">
          {allModules.map((module, i) => {
            const isCompleted = completedModuleIds.has(module.id)
            const isNext = !isCompleted && (i === 0 || completedModuleIds.has(allModules[i - 1].id))

            return (
              <Link
                key={module.id}
                href={`/learn/${module.slug}`}
                className={`block border rounded-xl p-4 transition-colors ${isNext
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  } ${!isCompleted && !isNext ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {i + 1}. {module.title}
                    </p>
                    <p className="text-sm text-gray-500">{module.description}</p>
                  </div>
                  {isCompleted && (
                    <span className="text-xs text-amber-600 font-medium flex-shrink-0 ml-3">
                      Done
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}