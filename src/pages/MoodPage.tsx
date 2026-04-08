import { useState } from 'react'
import { format, isToday, isYesterday, startOfMonth, eachDayOfInterval, endOfMonth, getDay } from 'date-fns'
import { useCatStore } from '../stores/catStore'
import { useMoodLogs, useAddMood } from '../hooks/useMood'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Textarea } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import { MOOD_LABELS, MOOD_EMOJIS } from '../lib/utils'
import type { MoodType, MoodLog } from '../types'

const MOODS: MoodType[] = ['happy', 'playful', 'sleepy', 'anxious', 'sick', 'angry']

function dateLabel(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return '今日'
  if (isYesterday(d)) return '昨日'
  return format(d, 'MM月dd日')
}

function groupByDate(logs: MoodLog[]) {
  const groups: Record<string, MoodLog[]> = {}
  for (const log of logs) {
    const key = format(new Date(log.logged_at), 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = []
    groups[key].push(log)
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

export function MoodPage() {
  const { activeCatId } = useCatStore()
  const { data: moods } = useMoodLogs(activeCatId ?? undefined)
  const addMood = useAddMood()
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [energy, setEnergy] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [note, setNote] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeCatId || !selectedMood) return
    await addMood.mutateAsync({
      cat_id: activeCatId,
      logged_at: new Date().toISOString(),
      mood: selectedMood,
      energy_level: energy,
      note: note || undefined,
    })
    toast('心情已記錄')
    setShowModal(false)
    setSelectedMood(null)
    setEnergy(3)
    setNote('')
  }

  // Monthly heatmap
  const now = new Date()
  const monthDays = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) })
  const moodByDate: Record<string, MoodType> = {}
  for (const m of moods ?? []) {
    const key = format(new Date(m.logged_at), 'yyyy-MM-dd')
    if (!moodByDate[key]) moodByDate[key] = m.mood
  }

  const grouped = groupByDate(moods ?? [])

  return (
    <PageLayout>
      <Header title="心情日記 😸" right={
        <Button size="sm" onClick={() => setShowModal(true)}>+ 記錄</Button>
      } />

      <div className="px-4 py-4 space-y-4">
        {/* Monthly heatmap */}
        <Card>
          <p className="text-sm font-medium text-[#4A4A4A]/60 mb-3">{format(now, 'yyyy年MM月')} 心情月曆</p>
          <div className="grid grid-cols-7 gap-1">
            {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
              <div key={d} className="text-center text-xs text-[#4A4A4A]/30">{d}</div>
            ))}
            {/* Monday-start offset: Mon=0 … Sun=6 */}
            {Array.from({ length: (getDay(monthDays[0]) + 6) % 7 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {monthDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const mood = moodByDate[key]
              return (
                <div key={key} className="aspect-square flex items-center justify-center rounded-xl text-base" title={mood ? MOOD_LABELS[mood] : undefined}>
                  {mood ? MOOD_EMOJIS[mood] : <span className="text-[#4A4A4A]/10 text-xs">{format(day, 'd')}</span>}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Timeline */}
        {grouped.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">😸</p>
            <p className="text-[#4A4A4A]/50">記錄貓咪今日心情吧</p>
          </div>
        )}
        {grouped.map(([date, logs]) => (
          <div key={date}>
            <p className="text-sm font-medium text-[#4A4A4A]/50 mb-2">{dateLabel(date)}</p>
            <div className="space-y-2">
              {logs.map((log) => (
                <Card key={log.id} className="flex items-center gap-3">
                  <span className="text-3xl">{MOOD_EMOJIS[log.mood]}</span>
                  <div className="flex-1">
                    <p className="font-medium text-[#4A4A4A]">{MOOD_LABELS[log.mood]}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={`text-xs ${i < log.energy_level ? 'text-[#FFB74D]' : 'text-[#4A4A4A]/20'}`}>⚡</span>
                      ))}
                      <span className="text-xs text-[#4A4A4A]/40 ml-1">{format(new Date(log.logged_at), 'HH:mm')}</span>
                    </div>
                    {log.note && <p className="text-xs text-[#4A4A4A]/60 mt-0.5">{log.note}</p>}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="記錄心情">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm font-medium text-[#4A4A4A] mb-2">今日心情</p>
            <div className="grid grid-cols-3 gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setSelectedMood(mood)}
                  className={[
                    'py-3 rounded-2xl flex flex-col items-center gap-1 transition-all border-2',
                    selectedMood === mood ? 'border-[var(--cp)] bg-[var(--cp-l)]' : 'border-transparent bg-[var(--cp-xl)]',
                  ].join(' ')}
                >
                  <span className="text-2xl">{MOOD_EMOJIS[mood]}</span>
                  <span className="text-xs text-[#4A4A4A]">{MOOD_LABELS[mood]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[#4A4A4A] mb-2">活力等級</p>
            <div className="flex gap-2">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEnergy(n)}
                  className={[
                    'flex-1 py-2 rounded-2xl text-sm font-medium transition-all',
                    energy >= n ? 'bg-[#FFB74D] text-white' : 'bg-[var(--cp-xl)] text-[#4A4A4A]/40',
                  ].join(' ')}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <Textarea label="備註（選填）" rows={2} placeholder="今日發生咩事？" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit" fullWidth loading={addMood.isPending} disabled={!selectedMood}>儲存</Button>
        </form>
      </Modal>
    </PageLayout>
  )
}
