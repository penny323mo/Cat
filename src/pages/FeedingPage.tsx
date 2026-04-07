import { useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { useCatStore } from '../stores/catStore'
import { useFeedingLogs, useAddFeeding, useDeleteFeeding } from '../hooks/useFeeding'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Select, Textarea } from '../components/ui/Input'
import { FOOD_TYPE_LABELS } from '../lib/utils'
import type { FeedingLog } from '../types'

const FOOD_ICONS: Record<string, string> = {
  dry: '🌾', wet: '🥫', treat: '🍪', other: '🍽️',
}

function groupByDate(logs: FeedingLog[]) {
  const groups: Record<string, FeedingLog[]> = {}
  for (const log of logs) {
    const key = format(new Date(log.fed_at), 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = []
    groups[key].push(log)
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

function dateLabel(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return '今日'
  if (isYesterday(d)) return '昨日'
  return format(d, 'MM月dd日')
}

export function FeedingPage() {
  const { activeCatId } = useCatStore()
  const { data: feedings, isLoading } = useFeedingLogs(activeCatId ?? undefined)
  const addFeeding = useAddFeeding()
  const deleteFeeding = useDeleteFeeding()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ food_type: 'dry', food_brand: '', amount_g: '', notes: '', fed_at: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeCatId) return
    await addFeeding.mutateAsync({
      cat_id: activeCatId,
      fed_at: form.fed_at ? new Date(form.fed_at).toISOString() : new Date().toISOString(),
      food_type: form.food_type as FeedingLog['food_type'],
      food_brand: form.food_brand || undefined,
      amount_g: form.amount_g ? parseFloat(form.amount_g) : undefined,
      notes: form.notes || undefined,
    })
    setShowModal(false)
    setForm({ food_type: 'dry', food_brand: '', amount_g: '', notes: '', fed_at: '' })
  }

  const grouped = groupByDate(feedings ?? [])

  return (
    <PageLayout>
      <Header title="餵食記錄 🍱" right={
        <Button size="sm" onClick={() => setShowModal(true)}>+ 新增</Button>
      } />

      <div className="px-4 py-4 space-y-4">
        {isLoading && <p className="text-center text-[#4A4A4A]/40">載入中...</p>}
        {!isLoading && grouped.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🍱</p>
            <p className="text-[#4A4A4A]/50">未有餵食記錄</p>
          </div>
        )}
        {grouped.map(([date, logs]) => (
          <div key={date}>
            <p className="text-sm font-medium text-[#4A4A4A]/50 mb-2">{dateLabel(date)}</p>
            <div className="space-y-2">
              {logs.map((log) => (
                <Card key={log.id} className="flex items-center gap-3">
                  <span className="text-2xl">{FOOD_ICONS[log.food_type]}</span>
                  <div className="flex-1">
                    <p className="font-medium text-[#4A4A4A]">
                      {FOOD_TYPE_LABELS[log.food_type]}
                      {log.food_brand && <span className="text-[#4A4A4A]/50 font-normal"> · {log.food_brand}</span>}
                    </p>
                    <p className="text-xs text-[#4A4A4A]/40">
                      {format(new Date(log.fed_at), 'HH:mm')}
                      {log.amount_g && ` · ${log.amount_g}g`}
                    </p>
                    {log.notes && <p className="text-xs text-[#4A4A4A]/50 mt-0.5">{log.notes}</p>}
                  </div>
                  <button
                    onClick={() => deleteFeeding.mutate({ id: log.id, catId: log.cat_id })}
                    className="text-[#4A4A4A]/20 hover:text-[#E57373] text-sm"
                  >
                    ✕
                  </button>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="新增餵食記錄">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select label="食物類型" value={form.food_type} onChange={(e) => setForm((f) => ({ ...f, food_type: e.target.value }))}>
            <option value="dry">🌾 乾糧</option>
            <option value="wet">🥫 濕糧</option>
            <option value="treat">🍪 零食</option>
            <option value="other">🍽️ 其他</option>
          </Select>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#4A4A4A]">品牌（選填）</label>
            <input
              list="brand-options"
              placeholder="選擇或輸入品牌"
              value={form.food_brand}
              onChange={(e) => setForm((f) => ({ ...f, food_brand: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-2xl border border-[#F4A9C0]/30 bg-white text-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-[#F4A9C0] focus:border-transparent placeholder:text-[#4A4A4A]/40"
            />
            <datalist id="brand-options">
              <option value="Royal Canin" />
              <option value="Acana" />
              <option value="Orijen" />
              <option value="Animonda" />
            </datalist>
          </div>
          <Input label="份量（克，選填）" type="number" placeholder="e.g. 50" value={form.amount_g} onChange={(e) => setForm((f) => ({ ...f, amount_g: e.target.value }))} />
          <Input label="時間（選填）" type="datetime-local" value={form.fed_at} onChange={(e) => setForm((f) => ({ ...f, fed_at: e.target.value }))} />
          <Textarea label="備註（選填）" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" fullWidth loading={addFeeding.isPending}>儲存</Button>
        </form>
      </Modal>
    </PageLayout>
  )
}
