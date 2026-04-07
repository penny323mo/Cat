import { useState, useRef } from 'react'
import { format, differenceInDays } from 'date-fns'
import { useCatStore } from '../stores/catStore'
import { useVetRecords, useAddVetRecord, useReminders, useAddReminder, useToggleReminder } from '../hooks/useHealth'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { REMINDER_TYPE_LABELS } from '../lib/utils'
import type { Reminder } from '../types'

type Tab = 'reminders' | 'vet'

export function HealthPage() {
  const { activeCatId } = useCatStore()
  const { data: vetRecords } = useVetRecords(activeCatId ?? undefined)
  const { data: reminders } = useReminders(activeCatId ?? undefined)
  const addVet = useAddVetRecord()
  const addReminder = useAddReminder()
  const toggleReminder = useToggleReminder()
  const [tab, setTab] = useState<Tab>('reminders')
  const [showVetModal, setShowVetModal] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [vetForm, setVetForm] = useState({ visit_date: format(new Date(), 'yyyy-MM-dd'), vet_name: '', reason: '', diagnosis: '', treatment: '', cost: '', next_visit_date: '', notes: '' })
  const [reportFile, setReportFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [reminderForm, setReminderForm] = useState({ type: 'vaccine', title: '', due_date: format(new Date(), 'yyyy-MM-dd'), recurrence_days: '', notes: '' })

  async function handleVetSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeCatId) return
    await addVet.mutateAsync({
      cat_id: activeCatId,
      visit_date: vetForm.visit_date,
      vet_name: vetForm.vet_name || undefined,
      reason: vetForm.reason || undefined,
      diagnosis: vetForm.diagnosis || undefined,
      treatment: vetForm.treatment || undefined,
      cost: vetForm.cost ? parseFloat(vetForm.cost) : undefined,
      next_visit_date: vetForm.next_visit_date || undefined,
      notes: vetForm.notes || undefined,
      file: reportFile ?? undefined,
    })
    setShowVetModal(false)
    setVetForm({ visit_date: format(new Date(), 'yyyy-MM-dd'), vet_name: '', reason: '', diagnosis: '', treatment: '', cost: '', next_visit_date: '', notes: '' })
    setReportFile(null)
  }

  async function handleReminderSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeCatId) return
    await addReminder.mutateAsync({
      cat_id: activeCatId,
      type: reminderForm.type as Reminder['type'],
      title: reminderForm.title,
      due_date: reminderForm.due_date,
      is_done: false,
      recurrence_days: reminderForm.recurrence_days ? parseInt(reminderForm.recurrence_days) : undefined,
      notes: reminderForm.notes || undefined,
    })
    setShowReminderModal(false)
    setReminderForm({ type: 'vaccine', title: '', due_date: format(new Date(), 'yyyy-MM-dd'), recurrence_days: '', notes: '' })
  }

  const pendingReminders = (reminders ?? []).filter((r) => !r.is_done)
  const doneReminders = (reminders ?? []).filter((r) => r.is_done)

  return (
    <PageLayout>
      <Header
        title="健康醫療 💊"
        right={
          <Button size="sm" onClick={() => tab === 'reminders' ? setShowReminderModal(true) : setShowVetModal(true)}>
            + 新增
          </Button>
        }
      />

      {/* Tab */}
      <div className="flex gap-1 px-4 pt-4">
        {(['reminders', 'vet'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'flex-1 py-2 rounded-2xl text-sm font-medium transition-colors',
              tab === t ? 'bg-[#F4A9C0] text-white' : 'bg-white text-[#4A4A4A]/60',
            ].join(' ')}
          >
            {t === 'reminders' ? '⏰ 提醒' : '🏥 睇醫生'}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-3">
        {tab === 'reminders' && (
          <>
            {pendingReminders.length === 0 && doneReminders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">💊</p>
                <p className="text-[#4A4A4A]/50">未有提醒，快新增一個吧</p>
              </div>
            )}
            {pendingReminders.map((r) => {
              const days = differenceInDays(new Date(r.due_date), new Date())
              const urgent = days <= 3
              return (
                <Card key={r.id} className={urgent ? 'border-[#E57373]/40' : ''}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleReminder.mutate({ id: r.id, is_done: true, catId: r.cat_id })}
                      className="w-6 h-6 rounded-full border-2 border-[#F4A9C0] flex-shrink-0 hover:bg-[#F4A9C0]/20"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-[#4A4A4A]">{r.title}</p>
                      <p className="text-xs text-[#4A4A4A]/50">{REMINDER_TYPE_LABELS[r.type]} · {format(new Date(r.due_date), 'yyyy/MM/dd')}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${urgent ? 'bg-[#E57373]/10 text-[#E57373]' : 'bg-[#FFF5E6] text-[#FFB74D]'}`}>
                      {days < 0 ? `逾期 ${Math.abs(days)} 日` : days === 0 ? '今日' : `${days} 日`}
                    </span>
                  </div>
                </Card>
              )
            })}
            {doneReminders.length > 0 && (
              <>
                <p className="text-xs text-[#4A4A4A]/40 mt-4">已完成</p>
                {doneReminders.map((r) => (
                  <Card key={r.id} className="opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#8BC34A] flex items-center justify-center text-white text-xs flex-shrink-0">✓</div>
                      <div>
                        <p className="font-medium text-[#4A4A4A] line-through">{r.title}</p>
                        <p className="text-xs text-[#4A4A4A]/50">{format(new Date(r.due_date), 'yyyy/MM/dd')}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'vet' && (
          <>
            {(!vetRecords || vetRecords.length === 0) && (
              <div className="text-center py-12">
                <p className="text-4xl mb-2">🏥</p>
                <p className="text-[#4A4A4A]/50">未有睇醫生記錄</p>
              </div>
            )}
            {(vetRecords ?? []).map((rec) => (
              <Card key={rec.id}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-[#4A4A4A]">{rec.reason || '診症'}</p>
                  <p className="text-sm text-[#4A4A4A]/40">{format(new Date(rec.visit_date), 'yyyy/MM/dd')}</p>
                </div>
                {rec.vet_name && <p className="text-sm text-[#4A4A4A]/60">📍 {rec.vet_name}</p>}
                {rec.diagnosis && <p className="text-sm text-[#4A4A4A]/70 mt-1">診斷：{rec.diagnosis}</p>}
                {rec.treatment && <p className="text-sm text-[#4A4A4A]/70">治療：{rec.treatment}</p>}
                {rec.cost != null && <p className="text-sm text-[#4A4A4A]/60 mt-1">費用：HKD {rec.cost}</p>}
                {rec.next_visit_date && (
                  <p className="text-xs text-[#F4A9C0] mt-2">下次覆診：{format(new Date(rec.next_visit_date), 'yyyy/MM/dd')}</p>
                )}
                {rec.report_url && (
                  <a
                    href={rec.report_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-[#7EC8C8] hover:underline"
                  >
                    📄 查看體檢報告 PDF
                  </a>
                )}
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Vet Modal */}
      <Modal open={showVetModal} onClose={() => setShowVetModal(false)} title="新增睇醫生記錄">
        <form onSubmit={handleVetSubmit} className="space-y-3">
          <Input label="日期" type="date" required value={vetForm.visit_date} onChange={(e) => setVetForm((f) => ({ ...f, visit_date: e.target.value }))} />
          <Input label="診所名稱（選填）" value={vetForm.vet_name} onChange={(e) => setVetForm((f) => ({ ...f, vet_name: e.target.value }))} />
          <Input label="原因" placeholder="e.g. 年度健康檢查" value={vetForm.reason} onChange={(e) => setVetForm((f) => ({ ...f, reason: e.target.value }))} />
          <Input label="診斷（選填）" value={vetForm.diagnosis} onChange={(e) => setVetForm((f) => ({ ...f, diagnosis: e.target.value }))} />
          <Input label="治療（選填）" value={vetForm.treatment} onChange={(e) => setVetForm((f) => ({ ...f, treatment: e.target.value }))} />
          <Input label="費用 HKD（選填）" type="number" value={vetForm.cost} onChange={(e) => setVetForm((f) => ({ ...f, cost: e.target.value }))} />
          <Input label="下次覆診日期（選填）" type="date" value={vetForm.next_visit_date} onChange={(e) => setVetForm((f) => ({ ...f, next_visit_date: e.target.value }))} />
          <Textarea label="備註（選填）" rows={2} value={vetForm.notes} onChange={(e) => setVetForm((f) => ({ ...f, notes: e.target.value }))} />
          {/* PDF upload */}
          <div>
            <p className="text-sm font-medium text-[#4A4A4A] mb-1">體檢報告 PDF（選填）</p>
            <div
              className="border-2 border-dashed border-[#F4A9C0]/50 rounded-2xl p-4 text-center cursor-pointer hover:bg-[#FDDDE6]/30 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {reportFile ? (
                <p className="text-sm text-[#4A4A4A]">📄 {reportFile.name}</p>
              ) : (
                <p className="text-sm text-[#4A4A4A]/40">點擊上傳 PDF</p>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => setReportFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button type="submit" fullWidth loading={addVet.isPending}>儲存</Button>
        </form>
      </Modal>

      {/* Reminder Modal */}
      <Modal open={showReminderModal} onClose={() => setShowReminderModal(false)} title="新增提醒">
        <form onSubmit={handleReminderSubmit} className="space-y-3">
          <Select label="類型" value={reminderForm.type} onChange={(e) => setReminderForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="vaccine">💉 疫苗</option>
            <option value="deworming">🪱 驅蟲</option>
            <option value="vet_visit">🏥 覆診</option>
            <option value="custom">📝 自訂</option>
          </Select>
          <Input label="標題" required placeholder="e.g. 三聯疫苗補打" value={reminderForm.title} onChange={(e) => setReminderForm((f) => ({ ...f, title: e.target.value }))} />
          <Input label="到期日" type="date" required value={reminderForm.due_date} onChange={(e) => setReminderForm((f) => ({ ...f, due_date: e.target.value }))} />
          <Input label="重複間隔（日，選填）" type="number" placeholder="e.g. 365（每年）" value={reminderForm.recurrence_days} onChange={(e) => setReminderForm((f) => ({ ...f, recurrence_days: e.target.value }))} />
          <Textarea label="備註（選填）" rows={2} value={reminderForm.notes} onChange={(e) => setReminderForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" fullWidth loading={addReminder.isPending}>儲存</Button>
        </form>
      </Modal>
    </PageLayout>
  )
}
