import { useMemo } from 'react'
import { format, parseISO, compareAsc } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useCatStore } from '../stores/catStore'
import { useMilestones } from '../hooks/useMilestones'
import { useAllPhotos } from '../hooks/usePhotos'
import { useCats } from '../hooks/useCats'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { formatCatAge } from '../lib/utils'
import type { Photo } from '../types'

function pickPhotosInRange(photos: Photo[], from: string, to: string | null, count = 2): Photo[] {
  const fromDate = parseISO(from)
  const toDate = to ? parseISO(to) : new Date()
  const inRange = photos.filter((p) => {
    const d = new Date(p.taken_at)
    return d >= fromDate && d <= toDate
  })
  if (inRange.length <= count) return inRange
  // Pick evenly spaced
  const step = Math.floor(inRange.length / count)
  return Array.from({ length: count }, (_, i) => inRange[i * step])
}

export function GrowthTimelinePage() {
  const navigate = useNavigate()
  const { activeCatId } = useCatStore()
  const { data: cats } = useCats()
  const { data: milestones } = useMilestones(activeCatId ?? undefined)
  const { data: allPhotos } = useAllPhotos(activeCatId ?? undefined)
  const cat = (cats ?? []).find((c) => c.id === activeCatId)

  // Build timeline segments: [adoptedDate/firstMilestone … each milestone … now]
  const segments = useMemo(() => {
    if (!milestones || !allPhotos) return []

    const sorted = [...milestones].sort((a, b) =>
      compareAsc(parseISO(a.date), parseISO(b.date))
    )

    // Use adopted_date or earliest milestone as origin
    const origin = cat?.adopted_date ?? sorted[0]?.date
    if (!origin) return []

    const points = [
      { date: origin, title: cat?.name ? `${cat.name} 到家 🏠` : '到家', isCat: true, desc: undefined as string | undefined, photo: undefined as string | undefined },
      ...sorted.map((m) => ({ date: m.date, title: m.title, isCat: false, desc: m.description, photo: m.photo_url })),
    ]

    return points.map((point, i) => {
      const nextDate = points[i + 1]?.date ?? null
      const photos = pickPhotosInRange(allPhotos, point.date, nextDate, 2)
      return { ...point, photos }
    })
  }, [milestones, allPhotos, cat])

  return (
    <PageLayout>
      <Header title="成長時間線 🌱" showBack />

      <div className="px-4 py-4">
        {/* Cat hero */}
        {cat && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-full bg-[#FDDDE6] overflow-hidden flex-shrink-0 flex items-center justify-center text-3xl">
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
            <p className="text-[#4A4A4A]/50">先記錄里程碑，再上傳相片</p>
            <p className="text-xs text-[#4A4A4A]/30">時間線會根據你的里程碑同相片自動生成</p>
            <div className="flex gap-2 justify-center mt-2">
              <Button size="sm" variant="secondary" onClick={() => navigate('/milestones')}>+ 里程碑</Button>
              <Button size="sm" onClick={() => navigate('/photos')}>+ 上傳相片</Button>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          {segments.length > 0 && (
            <div className="absolute left-4 top-4 bottom-0 w-0.5 bg-gradient-to-b from-[#F4A9C0] to-[#7EC8C8]/30" />
          )}

          <div className="space-y-8">
            {segments.map((seg, i) => (
              <div key={i} className="flex gap-4 items-start">
                {/* Node */}
                <div className={[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 z-10 border-2',
                  i === 0 ? 'bg-[#F4A9C0] border-[#F4A9C0] text-white' : 'bg-white border-[#F4A9C0] text-[#F4A9C0]',
                ].join(' ')}>
                  {i === 0 ? '🏠' : '🏆'}
                </div>

                <div className="flex-1 pb-2">
                  {/* Milestone info */}
                  <div className="mb-2">
                    <p className="font-semibold text-[#4A4A4A] text-sm">{seg.title}</p>
                    <p className="text-xs text-[#4A4A4A]/40">{format(parseISO(seg.date), 'yyyy年MM月dd日')}</p>
                    {seg.desc && <p className="text-xs text-[#4A4A4A]/60 mt-0.5">{seg.desc}</p>}
                  </div>

                  {/* Milestone photo */}
                  {seg.photo && (
                    <img src={seg.photo} alt={seg.title} className="w-full rounded-2xl object-cover max-h-40 mb-2" />
                  )}

                  {/* Auto-picked photos from this period */}
                  {seg.photos.length > 0 && (
                    <div className={seg.photos.length === 1 ? '' : 'grid grid-cols-2 gap-1.5'}>
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

                  {/* No photos hint */}
                  {seg.photos.length === 0 && !seg.photo && (
                    <div
                      className="rounded-xl border-2 border-dashed border-[#F4A9C0]/20 h-16 flex items-center justify-center cursor-pointer hover:bg-[#FDDDE6]/20 transition-colors"
                      onClick={() => navigate('/photos')}
                    >
                      <p className="text-xs text-[#4A4A4A]/30">+ 上傳這時期嘅相片</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* "Now" cap */}
            {segments.length > 0 && (
              <div className="flex gap-4 items-center">
                <div className="w-8 h-8 rounded-full bg-[#7EC8C8] flex items-center justify-center text-white text-sm flex-shrink-0 z-10">
                  ✨
                </div>
                <p className="text-sm font-medium text-[#7EC8C8]">而家 · 繼續成長中</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
