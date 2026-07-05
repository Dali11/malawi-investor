import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function LearnPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, slug, order_index, title, description')
    .order('order_index', { ascending: true })

  const { data: modules } = await supabase
    .from('modules')
    .select('id, slug, order_index, lesson_order, chapter_id, title, description')
    .order('order_index', { ascending: true })

  let completedModuleIds = new Set<string>()
  if (user && modules) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('module_id')
      .eq('user_id', user.id)

    completedModuleIds = new Set(progress?.map(p => p.module_id) ?? [])
  }

  const allChapters = chapters ?? []
  const allModules = modules ?? []
  const completedCount = allModules.filter(m => completedModuleIds.has(m.id)).length

  // Global "next up" is still the first incomplete lesson in overall order,
  // soft-gating only, nothing is actually locked.
  const nextModuleId = allModules.find(m => !completedModuleIds.has(m.id))?.id

  return (
    <div className="min-h-screen bg-(--color-background-primary) px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-600 font-medium mb-1">
              Malawi Investor
            </p>
            <h1 className="text-2xl font-medium text-(--color-text-primary)">Learn the MSE</h1>
          </div>
          {user && (
            <p className="text-sm text-(--color-text-secondary)">
              {completedCount} of {allModules.length} lessons completed
            </p>
          )}
        </div>

        <div className="space-y-10">
          {allChapters.map((chapter) => {
            const chapterModules = allModules
              .filter(m => m.chapter_id === chapter.id)
              .sort((a, b) => (a.lesson_order ?? 0) - (b.lesson_order ?? 0))

            if (chapterModules.length === 0) return null

            return (
              <div key={chapter.id}>
                <div className="mb-3">
                  <h2 className="text-base font-medium text-(--color-text-primary)">{chapter.title}</h2>
                  {chapter.description && (
                    <p className="text-sm text-(--color-text-secondary)">{chapter.description}</p>
                  )}
                </div>

                <div className="space-y-3">
                  {chapterModules.map((module, i) => {
                    const isCompleted = completedModuleIds.has(module.id)
                    const isNext = module.id === nextModuleId

                    return (
                      <Link
                        key={module.id}
                        href={`/learn/${module.slug}`}
                        className={`block border rounded-xl p-4 transition-colors ${isNext
                          ? 'border-amber-400 bg-(--color-background-warning)'
                          : 'border-(--color-border-tertiary) bg-(--color-background-primary) hover:border-(--color-border-secondary)'
                          } ${!isCompleted && !isNext ? 'opacity-60' : ''}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-(--color-text-primary) mb-1">
                              {i + 1}. {module.title}
                            </p>
                            <p className="text-sm text-(--color-text-secondary)">{module.description}</p>
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
            )
          })}
        </div>
      </div>
    </div>
  )
}