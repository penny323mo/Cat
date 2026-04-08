import { useState } from 'react'
import { format } from 'date-fns'
import { useCatStore } from '../stores/catStore'
import { useMilestones, useAddMilestone } from '../hooks/useMilestones'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Textarea } from '../components/ui/Input'
import { SUGGESTED_MILESTONES } from '../data/milestones'

export function MilestonePage() {
  const { activeCatId } = useCatStore()
  const { data: milestones } = useMilestones(activeCatId ?? undefined)
  const addMilestone = useAddMilestone()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeCatId) return
    await addMilestone.mutateAsync({
      cat_id: activeCatId,
      title: form.title,
      date: form.date,
      description: form.description || undefined,
    })
    setShowModal(false)
    setForm({ title: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' })
  }

  function useSuggested(s: { title: string; description: string }) {
    setForm((f) => ({ ...f, title: s.title, description: s.description }))
    setShowModal(true)
  }

  return (
    <PageLayout>
      <Header title="里程碑 🏆" right={
        <Button size="sm" onClick={() => setShowModal(true)}>+ 新增</Button>
      } />

      <div className="px-4 py-4 space-y-4">
        {(!milestones || milestones.length === 0) && (
          <>
            <div className="text-center py-8">
              <p className="text-4xl mb-2">🏆</p>
              <p className="text-[#4A4A4A]/50 mb-4">記錄貓咪嘅重要時刻</p>
            </div>
            <p className="text-sm font-medium text-[#4A4A4A]/50">建議里程碑</p>
            <div className="space-y-2">
              {SUGGESTED_MILESTONES.map((s) => (
                <button
                  key={s.title}
                  onClick={() => useSuggested(s)}
                  className="w-full text-left p-3 rounded-2xl bg-white border border-[var(--cp)]/20 hover:bg-[var(--cp-l)]/50 transition-colors"
                >
                  <p className="text-sm font-medium text-[#4A4A4A]">{s.title}</p>
                  <p className="text-xs text-[#4A4A4A]/50">{s.description}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Timeline */}
        {milestones && milestones.length > 0 && (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[var(--cp)]/30" />
            <div className="space-y-4">
              {milestones.map((m) => (
                <div key={m.id} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-[var(--cp)] flex items-center justify-center text-white text-lg flex-shrink-0 z-10">
                    🏆
                  </div>
                  <Card className="flex-1">
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-[#4A4A4A]">{m.title}</p>
                      <p className="text-xs text-[#4A4A4A]/40">{format(new Date(m.date), 'yyyy/MM/dd')}</p>
                    </div>
                    {m.description && <p className="text-sm text-[#4A4A4A]/60 mt-1">{m.description}</p>}
                    {m.photo_url && (
                      <img src={m.photo_url} alt={m.title} className="mt-2 rounded-2xl w-full object-cover max-h-48" />
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="新增里程碑">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="里程碑標題" required placeholder="e.g. 第一次用貓砂盆 🚽" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="日期" type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <Textarea label="描述（選填）" rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Button type="submit" fullWidth loading={addMilestone.isPending}>儲存</Button>
        </form>
      </Modal>
    </PageLayout>
  )
}
