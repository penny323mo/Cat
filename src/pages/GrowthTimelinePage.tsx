import { useMemo } from 'react'
import { format, parseISO, compareAsc, startOfDay, endOfDay } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useCatStore } from '../stores/catStore'
import { useMilestones } from '../hooks/useMilestones'
import { useAllPhotos } from '../hooks/usePhotos'
import { useCats } from '../hooks/useCats'
import { useFeedingLogs } from '../hooks/useFeeding'
import { useWeightLogs } from '../hooks/useWeight'
import { useVetRecords } from '../hooks/useHealth'
import { useMoodLogs } from '../hooks/useMood'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { formatCatAge } from '../lib/utils'
import type { Photo, FeedingLog, WeightLog, VetRecord, MoodLog } from '../types'

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', playful: '🎉', sleepy: '😴', anxious: '😰', sick: '🤒', angry: '😾',
}
const FOOD_LABEL: Record<string, string> = {
  dry: '乾糧', wet: '濕糧', treat: '零食', other: '其他',
}

function pickPhotosInRange(photos: Photo[], from: Date, to: Date, count = 2): Photo[] {
  const inRange = photos.filter((p) => {
    const d = new Date(p.taken_at)
    return d >= from && d <= to
  })
  if (inRange.length <= count) return inRange
  const step = Math.floor(inRange.length / count)
  return Array.from({ length: count }, (_, i) => inRange[i * step])
}

function dateInRange(dateStr: string, from: Date, to: Date) {
  const d = new Date(dateStr)
  return d >= from && d <= to
}

interface ActivitySummaryProps {
  feedings: FeedingLog[]
  weights: WeightLog[]
  vets: VetRecord[]
  moods: MoodLog[]
}

function ActivitySummary({ feedings, weights, vets, moods }: ActivitySummaryProps) {
  const chips: { icon: string; label: string }[] = []

  // Feeding summary
  if (feedings.length > 0) {
    const counts: Record<string, number> = {}
    feedings.forEach((f) => { counts[f.food_type] = (counts[f.food_type] ?? 0) + 1 })
    const detail = Object.entries(counts)
      .map(([type, n]) => `${FOOD_LABEL[type] ?? type} ${n}`)
      .join(' / ')
    chips.push({ icon: '🍱', label: `餵食 ${feedings.length} 次 · ${detail}` })
  }

  // Weight summary
  if (weights.length > 0) {
    const first = weights[0].weight_kg
    const last = weights[weights.length - 1].weight_kg
    chips.push({
      icon: '⚖️',
      label: weights.length === 1 ? `體重 ${first} kg` : `體重 ${first} → ${last} kg`,
    })
  }

  // Vet visits
  vets.forEach((v) => {
    chips.push({ icon: '🏥', label: `看診：${v.reason ?? v.vet_name ?? '就診'}` })
  })

  // Mood summary
  if (moods.length > 0) {
    const moodStr = moods
      .slice(0, 4)
      .map((m) => MOOD_EMOJI[m.mood] ?? '🐱')
      .join('')
    chips.push({ icon: '', label: `${moodStr} 心情記錄 ${moods.length} 次` })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {chips.map((chip, i) => (
        <span key={i} className="inline-flex items-center gap-1 bg-[var(--cp-xl)] text-[#4A4A4A]/70 text-[11px] px-2.5 py-1 rounded-full">
          {chip.icon && <span>{chip.icon}</span>}
          {chip.label}
        </span>
      ))}
    </div>
  )
}

export function GrowthTimelinePage() {
  const navigate = useNavigate()
  const { activeCatId } = useCatStore()
  const { data: cats } = useCats()
  const { data: milestones } = useMilestones(activeCatId ?? undefined)
  const { data: allPhotos } = useAllPhotos(activeCatId ?? undefined)
  const { data: allFeedings } = useFeedingLogs(activeCatId ?? undefined)
  const { data: allWeights } = useWeightLogs(activeCatId ?? undefined)
  const { data: allVets } = useVetRecords(activeCatId ?? undefined)
  const { data: allMoods } = useMoodLogs(activeCatId ?? undefined)
  const cat = (cats ?? []).find((c) => c.id === activeCatId)

  const segments = useMemo(() => {
    if (!milestones || !allPhotos) return []

    const sorted = [...milestones].sort((a, b) =>
      compareAsc(parseISO(a.date), parseISO(b.date))
    )

    const origin = cat?.adopted_date ?? sorted[0]?.date
    if (!origin) return []

    const points = [
      {
        date: origin,
        title: cat?.name ? `${cat.name} 到家 🏠` : '到家',
        isCat: true,
        desc: undefined as string | undefined,
        photo: undefined as string | undefined,
      },
      ...sorted.map((m) => ({
        date: m.date,
        title: m.title,
        isCat: false,
        desc: m.description,
        photo: m.photo_url,
      })),
    ]

    const usedPhotoIds = new Set<string>()
    return points.map((point, i) => {
      const from = startOfDay(new Date(point.date))
      const to = i + 1 < points.length
        ? endOfDay(new Date(points[i + 1].date))
        : new Date()

      // Only pick photos not already shown in a previous segment
      const available = allPhotos.filter((p) => !usedPhotoIds.has(p.id))
      const photos = pickPhotosInRange(available, from, to, 2)
      photos.forEach((p) => usedPhotoIds.add(p.id))

      const feedings = (allFeedings ?? []).filter((f) => dateInRange(f.fed_at, from, to))
      const weights = (allWeights ?? []).filter((w) => dateInRange(w.measured_at, from, to))
      const vets = (allVets ?? []).filter((v) => dateInRange(v.visit_date, from, to))
      const moods = (allMoods ?? []).filter((m) => dateInRange(m.logged_at, from, to))

      return { ...point, photos, feedings, weights, vets, moods }
    })
  }, [milestones, allPhotos, allFeedings, allWeights, allVets, allMoods, cat])

  return (
    <PageLayout>
      <Header title="成長時間線 🌱" showBack />

      <div className="px-4 py-4">
        {/* Cat hero */}
        {cat && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-full bg-[var(--cp-l)] overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl">
              {cat.avatar_url
                ? <img src={cat.avatar_url} alt={cat.name} className="w-full h-full object-cover" />
                : '🐱'}
            </div>
            <div>
              <p className="font-bold text-[#4A4A4A]">{cat.name}</p>
              <p className="text-xs text-[#4A4A4A]/50">{formatCatAge(cat.birthday)}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {segments.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-5xl">🌱</p>
            <p className="text-[#4A4A4A]/50">先記錄里程碑，時間線會自動生成</p>
            <p className="text-xs text-[#4A4A4A]/30">餵食、體重、看診、心情、相片都會自動出現</p>
            <div className="flex gap-2 justify-center mt-2">
              <Button size="sm" variant="secondary" onClick={() => navigate('/milestones')}>+ 里程碑</Button>
              <Button size="sm" onClick={() => navigate('/photos')}>+ 上傳相片</Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {segments.length > 0 && (
            <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-gradient-to-b from-[var(--cp)] to-[var(--ca)]/30" />
          )}

          <div className="space-y-8">
            {segments.map((seg, i) => (
              <div key={i} className="flex gap-4 items-start">
                {/* Node */}
                <div className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 z-10 border-2',
                  i === 0 ? 'bg-[var(--cp)] border-[var(--cp)] text-white' : 'bg-white border-[var(--cp)] text-[var(--cp)]',
                ].join(' ')}>
                  {i === 0 ? '🏠' : '🏆'}
                </div>

                <div className="flex-1 pb-2">
                  {/* Milestone info */}
                  <p className="font-semibold text-[#4A4A4A] text-sm">{seg.title}</p>
                  <p className="text-xs text-[#4A4A4A]/40">{format(parseISO(seg.date), 'yyyy年MM月dd日')}</p>
                  {seg.desc && <p className="text-xs text-[#4A4A4A]/60 mt-0.5">{seg.desc}</p>}

                  {/* Milestone photo */}
                  {seg.photo && (
                    <img src={seg.photo} alt={seg.title} className="w-full rounded-2xl object-cover max-h-40 mt-2" />
                  )}

                  {/* Activity summary from all data sources */}
                  <ActivitySummary
                    feedings={seg.feedings}
                    weights={seg.weights}
                    vets={seg.vets}
                    moods={seg.moods}
                  />

                  {/* Auto-picked photos */}
                  {seg.photos.length > 0 && (
                    <div className={`mt-2 ${seg.photos.length === 1 ? '' : 'grid grid-cols-2 gap-1.5'}`}>
                      {seg.photos.map((photo) => (
                        <div key={photo.id} className="rounded-xl overflow-hidden">
                          <img src={photo.url} alt={photo.caption ?? ''} className="w-full object-cover aspect-square" loading="lazy" />
                          {photo.caption && (
                            <p className="text-[10px] text-[#4A4A4A]/50 px-1 pt-0.5 truncate">{photo.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* "Now" cap */}
            {segments.length > 0 && (
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 rounded-full bg-[var(--ca)] flex items-center justify-center text-white text-sm flex-shrink-0 z-10">
                  ✨
                </div>
                <p className="text-sm font-medium text-[var(--ca)]">而家 · 繼續成長中</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
