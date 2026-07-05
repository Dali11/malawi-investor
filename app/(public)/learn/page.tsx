import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getLearnLang, learnDict, pickText } from '@/lib/i18n/learn'
import LanguageToggle from '@/components/learn/LanguageToggle'

export default async function LearnPage() {
  const supabase = await createClient()
  const lang = await getLearnLang()
  const t = learnDict[lang]

  const { data: { user } } = await supabase.auth.getUser()

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, slug, order_index, title, description, title_ny, description_ny')
    .order('order_index', { ascending: true })

  const { data: modules } = await supabase
    .from('modules')
    .select('id, slug, order_index, lesson_order, chapter_id, title, description, title_ny, description_ny')
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
        <div className="flex justify-between items-start mb-10 gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-600 font-medium mb-1">
              {t.eyebrow}
            </p>
            <h1 className="text-2xl font-medium text-(--color-text-primary)">{t.learnTheMse}</h1>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <LanguageToggle lang={lang} />
            {user && (
              <p className="text-sm text-(--color-text-secondary) text-right">
                {t.lessonsCompleted(completedCount, allModules.length)}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-10">
          {allChapters.map((chapter) => {
            const chapterModules = allModules
              .filter(m => m.chapter_id === chapter.id)
              .sort((a, b) => (a.lesson_order ?? 0) - (b.lesson_order ?? 0))

            if (chapterModules.length === 0) return null

            const chapterTitle = pickText(chapter.title, chapter.title_ny, lang)
            const chapterDescription = pickText(chapter.description ?? '', chapter.description_ny, lang)

            return (
              <div key={chapter.id}>
                <div className="mb-3">
                  <h2 className="text-base font-medium text-(--color-text-primary)">{chapterTitle}</h2>
                  {chapterDescription && (
                    <p className="text-sm text-(--color-text-secondary)">{chapterDescription}</p>
                  )}
                </div>

                <div className="space-y-3">
                  {chapterModules.map((module, i) => {
                    const isCompleted = completedModuleIds.has(module.id)
                    const isNext = module.id === nextModuleId
                    const moduleTitle = pickText(module.title, module.title_ny, lang)
                    const moduleDescription = pickText(module.description ?? '', module.description_ny, lang)

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
                              {i + 1}. {moduleTitle}
                            </p>
                            <p className="text-sm text-(--color-text-secondary)">{moduleDescription}</p>
                          </div>
                          {isCompleted && (
                            <span className="text-xs text-amber-600 font-medium flex-shrink-0 ml-3">
                              {t.done}
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