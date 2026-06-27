import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import ReactMarkdown from 'react-markdown'
import ModuleCompletion from '@/components/modules/ModuleCompletion'
import { ModuleWidget } from '@/components/modules/ModuleWidget'

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

    const { data: modules } = await supabase
        .from('modules')
        .select('id, slug, order_index, title, description, content, quiz, widget_type')
        .order('order_index', { ascending: true })

    const allModules = modules ?? []
    const moduleIndex = allModules.findIndex(m => m.slug === slug)
    const currentModule = allModules[moduleIndex]

    if (!currentModule) {
        redirect('/learn')
    }

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
                    ← Back to all modules
                </Link>

                <p className="text-xs uppercase tracking-wide text-amber-600 font-medium mb-1">
                    Module {moduleIndex + 1} of {allModules.length}
                </p>
                <h1 className="text-2xl font-medium text-gray-900 mb-2">{currentModule.title}</h1>
                <p className="text-gray-500 mb-8">{currentModule.description}</p>

                <div className="border border-gray-200 rounded-xl p-6 mb-8 bbn-article-body">
                    <ReactMarkdown>{currentModule.content || 'Lesson content coming soon.'}</ReactMarkdown>
                </div>

                <ModuleWidget widgetType={currentModule.widget_type} />

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