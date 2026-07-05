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
import { getLearnLang, learnDict, pickText } from '@/lib/i18n/learn'
import LanguageToggle from '@/components/learn/LanguageToggle'

export default async function ModulePage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const supabase = await createClient()
    const lang = await getLearnLang()
    const t = learnDict[lang]

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect(`/login?redirect=/learn/${slug}`)
    }

    const { data: chapters } = await supabase
        .from('chapters')
        .select('id, slug, order_index, title, title_ny')
        .order('order_index', { ascending: true })

    const { data: modules } = await supabase
        .from('modules')
        .select('id, slug, order_index, lesson_order, chapter_id, title, description, content, quiz, widget_type, title_ny, description_ny, content_ny, quiz_ny')

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

    // Chichewa is only "on" for this lesson if the article body has actually
    // been translated. Title/description/quiz ride along with it — showing
    // a Chichewa title above an English-only body reads as broken, so we
    // fall back to English everywhere for this lesson until content_ny lands.
    const isTranslated = lang === 'ny' && !!currentModule.content_ny?.trim()
    const showUntranslatedNotice = lang === 'ny' && !isTranslated

    const displayTitle = isTranslated ? pickText(currentModule.title, currentModule.title_ny, lang) : currentModule.title
    const displayDescription = isTranslated ? pickText(currentModule.description ?? '', currentModule.description_ny, lang) : currentModule.description
    const displayContent = isTranslated ? (currentModule.content_ny || currentModule.content) : currentModule.content
    const displayQuiz = isTranslated && currentModule.quiz_ny ? currentModule.quiz_ny : currentModule.quiz
    const currentChapterTitle = currentChapter
        ? (isTranslated ? pickText(currentChapter.title, currentChapter.title_ny, lang) : currentChapter.title)
        : null

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

    const untranslatedNotice = showUntranslatedNotice && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-(--color-background-warning) px-4 py-3 text-sm text-(--color-text-secondary)">
            {t.notTranslatedNotice}
        </div>
    )

    return (
        <div className="min-h-screen bg-(--color-background-primary) px-4 py-12">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6 gap-3">
                    <Link href="/learn" className="text-sm text-(--color-text-secondary) hover:text-(--color-text-primary)">
                        {t.backToAllLessons}
                    </Link>
                    <LanguageToggle lang={lang} />
                </div>

                <p className="text-xs uppercase tracking-wide text-amber-600 font-medium mb-1">
                    {currentChapterTitle
                        ? t.lessonOf(currentChapterTitle, positionInChapter + 1, chapterModules.length)
                        : t.moduleOf(moduleIndex + 1, allModules.length)}
                </p>
                <h1 className="text-2xl font-medium text-(--color-text-primary) mb-2">{displayTitle}</h1>
                <p className="text-(--color-text-secondary) mb-6">{displayDescription}</p>

                {untranslatedNotice}

                {currentModule.widget_type === 'portfolio_simulator' ? (
                    <ModuleTabs
                        labels={t.tabsPortfolio}
                        tab1={
                            <div className="border border-(--color-border-tertiary) rounded-xl p-6 bbn-article-body">
                                <ReactMarkdown>
                                    {displayContent || t.contentComingSoon}
                                </ReactMarkdown>
                            </div>
                        }
                        tab2={<PortfolioSimulator />}
                        tab3={<DiversificationGuide />}
                    />
                ) : currentModule.widget_type === 'financial_statement_explorer' ? (
                    <ModuleTabs
                        labels={t.tabsFinancials}
                        tab1={
                            <div className="border border-(--color-border-tertiary) rounded-xl p-6 bbn-article-body">
                                <ReactMarkdown>
                                    {displayContent || t.contentComingSoon}
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
                        labels={t.tabsOrder}
                        tab1={
                            <div className="border border-(--color-border-tertiary) rounded-xl p-6 bbn-article-body">
                                <ReactMarkdown>
                                    {displayContent || t.contentComingSoon}
                                </ReactMarkdown>
                            </div>
                        }
                        tab2={<OrderSimulator />}
                        tab3={<SettlementJourney />}
                    />
                ) : (
                    <>
                        <div className="border border-(--color-border-tertiary) rounded-xl p-6 mb-8 bbn-article-body">
                            <ReactMarkdown>
                                {displayContent || t.contentComingSoon}
                            </ReactMarkdown>
                        </div>

                        <ModuleWidget widgetType={currentModule.widget_type} />
                    </>
                )}
                <ModuleCompletion
                    quiz={displayQuiz}
                    widgetType={currentModule.widget_type}
                    isCompleted={isCompleted}
                    markComplete={markComplete}
                    lang={lang}
                />

                <div className="flex justify-between mt-8 text-sm">
                    {prevModule ? (
                        <Link href={`/learn/${prevModule.slug}`} className="text-(--color-text-secondary) hover:text-(--color-text-primary)">
                            ← {pickText(prevModule.title, prevModule.title_ny, lang)}
                        </Link>
                    ) : <span />}
                    {nextModule ? (
                        <Link href={`/learn/${nextModule.slug}`} className="text-amber-600 hover:underline">
                            {pickText(nextModule.title, nextModule.title_ny, lang)} →
                        </Link>
                    ) : <span />}
                </div>
            </div>
        </div>
    )
}