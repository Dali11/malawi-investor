import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import ModuleCompletion from '@/components/modules/ModuleCompletion'
import { ModuleWidget } from '@/components/modules/ModuleWidget'
import ModuleTabs from '@/components/modules/ModuleTabs'
import OrderSimulator from '@/components/modules/OrderSimulator'
import SettlementJourney from '@/components/modules/SettlementJourney'
import ReactMarkdown from 'react-markdown'
import IncomeStatementExplorer from '@/components/modules/IncomeStatementExplorer'
import CompanyComparison from '@/components/modules/CompanyComparison'
import RedFlags from '@/components/modules/RedFlags'
import PortfolioSimulator from '@/components/modules/PortfolioSimulator'
import DiversificationGuide from '@/components/modules/DiversificationGuide'

export default async function ModulePage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect(`/login?redirect=/learn/${slug}`)
    }

    const { data: chapters } = await supabase
        .from('chapters')
        .select('id, slug, order_index, title')
        .order('order_index', { ascending: true })

    const { data: modules } = await supabase
        .from('modules')
        .select('id, slug, order_index, lesson_order, chapter_id, title, description, content, quiz, widget_type')

    const allChapters = chapters ?? []
    const chapterRank = new Map(allChapters.map((c, i) => [c.id, i]))

    // Same ordering as the /learn index: grouped by chapter order, then lesson_order
    // within the chapter. Falls back to the old order_index for any module that
    // isn't assigned to a chapter yet, so nothing disappears mid-migration.
    const allModules = [...(modules ?? [])].sort((a, b) => {
        const chapterA = chapterRank.get(a.chapter_id) ?? 999
        const chapterB = chapterRank.get(b.chapter_id) ?? 999
        if (chapterA !== chapterB) return chapterA - chapterB
        if (a.chapter_id && b.chapter_id) return (a.lesson_order ?? 0) - (b.lesson_order ?? 0)
        return (a.order_index ?? 0) - (b.order_index ?? 0)
    })

    const moduleIndex = allModules.findIndex(m => m.slug === slug)
    const currentModule = allModules[moduleIndex]

    if (!currentModule) {
        redirect('/learn')
    }

    const currentChapter = allChapters.find(c => c.id === currentModule.chapter_id)
    const chapterModules = allModules.filter(m => m.chapter_id === currentModule.chapter_id)
    const positionInChapter = chapterModules.findIndex(m => m.id === currentModule.id)

    const { data: progress } = await supabase
        .from('user_progress')
        .select('module_id')
        .eq('user_id', user.id)

    const completedModuleIds = new Set(progress?.map(p => p.module_id) ?? [])
    const isCompleted = completedModuleIds.has(currentModule.id)
    const nextModule = allModules[moduleIndex + 1]
    const prevModule = allModules[moduleIndex - 1]

    async function markComplete() {
        'use server'
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase
            .from('user_progress')
            .upsert({ user_id: user.id, module_id: currentModule.id })

        revalidatePath('/learn')
        revalidatePath(`/learn/${slug}`)
    }

    return (
        <div className="min-h-screen bg-white px-4 py-12">
            <div className="max-w-2xl mx-auto">
                <Link href="/learn" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
                    ← Back to all lessons
                </Link>

                <p className="text-xs uppercase tracking-wide text-amber-600 font-medium mb-1">
                    {currentChapter
                        ? `${currentChapter.title} · Lesson ${positionInChapter + 1} of ${chapterModules.length}`
                        : `Module ${moduleIndex + 1} of ${allModules.length}`}
                </p>
                <h1 className="text-2xl font-medium text-gray-900 mb-2">{currentModule.title}</h1>
                <p className="text-gray-500 mb-8">{currentModule.description}</p>

                {currentModule.widget_type === 'portfolio_simulator' ? (
                    <ModuleTabs
                        labels={[
                            '1. The idea',
                            '2. Try it',
                            '3. How much is enough',
                        ]}
                        tab1={
                            <div className="border border-gray-200 rounded-xl p-6 bbn-article-body">
                                <ReactMarkdown>
                                    {currentModule.content || 'Lesson content coming soon.'}
                                </ReactMarkdown>
                            </div>
                        }
                        tab2={<PortfolioSimulator />}
                        tab3={<DiversificationGuide />}
                    />
                ) : currentModule.widget_type === 'financial_statement_explorer' ? (
                    <ModuleTabs
                        labels={[
                            '1. Read a statement',
                            '2. Compare two companies',
                            '3. Red flags',
                        ]}
                        tab1={
                            <div className="border border-gray-200 rounded-xl p-6 bbn-article-body">
                                <ReactMarkdown>
                                    {currentModule.content || 'Lesson content coming soon.'}
                                </ReactMarkdown>
                                <div className="mt-4">
                                    <IncomeStatementExplorer />
                                </div>
                            </div>
                        }
                        tab2={<CompanyComparison />}
                        tab3={<RedFlags />}
                    />
                ) : currentModule.widget_type === 'order_simulator_tabs' ? (
                    <ModuleTabs
                        labels={[
                            '1. The basics',
                            '2. Try it',
                            '3. After you click buy',
                        ]}
                        tab1={
                            <div className="border border-gray-200 rounded-xl p-6 bbn-article-body">
                                <ReactMarkdown>
                                    {currentModule.content || 'Lesson content coming soon.'}
                                </ReactMarkdown>
                            </div>
                        }
                        tab2={<OrderSimulator />}
                        tab3={<SettlementJourney />}
                    />
                ) : (
                    <>
                        <div className="border border-gray-200 rounded-xl p-6 mb-8 bbn-article-body">
                            <ReactMarkdown>
                                {currentModule.content || 'Lesson content coming soon.'}
                            </ReactMarkdown>
                        </div>

                        <ModuleWidget widgetType={currentModule.widget_type} />
                    </>
                )}
                <ModuleCompletion
                    quiz={currentModule.quiz}
                    widgetType={currentModule.widget_type}
                    isCompleted={isCompleted}
                    markComplete={markComplete}
                />

                <div className="flex justify-between mt-8 text-sm">
                    {prevModule ? (
                        <Link href={`/learn/${prevModule.slug}`} className="text-gray-500 hover:text-gray-700">
                            ← {prevModule.title}
                        </Link>
                    ) : <span />}
                    {nextModule ? (
                        <Link href={`/learn/${nextModule.slug}`} className="text-amber-600 hover:underline">
                            {nextModule.title} →
                        </Link>
                    ) : <span />}
                </div>
            </div>
        </div>
    )
}