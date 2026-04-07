import { useCats } from '../hooks/useCats'
import { useFeedingLogs, useAddFeeding } from '../hooks/useFeeding'
import { useToast } from '../components/ui/Toast'
import { useWeightLogs } from '../hooks/useWeight'
import { useReminders } from '../hooks/useHealth'
import { useMoodLogs } from '../hooks/useMood'
import { useRecentPhotos } from '../hooks/usePhotos'
import { useCatStore } from '../stores/catStore'
import { PageLayout } from '../components/layout/PageLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { formatCatAge, catAgeToHuman, MOOD_EMOJIS, MOOD_LABELS, REMINDER_TYPE_LABELS } from '../lib/utils'
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns'
import { NEW_CAT_TIPS } from '../data/tips'
import { useNavigate } from 'react-router-dom'

function NoCat() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
      <div className="text-6xl">🐱</div>
      <h2 className="text-xl font-bold text-[#4A4A4A]">歡迎使用貓咪日記！</h2>
      <p className="text-[#4A4A4A]/60">先建立你嘅貓咪檔案</p>
      <Button onClick={() => navigate('/profile/new')}>建立貓咪檔案</Button>
    </div>
  )
}

export function DashboardPage() {
  const { activeCatId, getActiveCat } = useCatStore()
  const { data: cats, isLoading } = useCats()
  const cat = getActiveCat()

  const { data: feedings } = useFeedingLogs(activeCatId ?? undefined)
  const { data: weights } = useWeightLogs(activeCatId ?? undefined)
  const { data: reminders } = useReminders(activeCatId ?? undefined)
  const { data: moods } = useMoodLogs(activeCatId ?? undefined)
  const { data: recentPhotos } = useRecentPhotos(activeCatId ?? undefined, 20)
  const addFeeding = useAddFeeding()
  const { toast } = useToast()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin text-3xl">🐾</div>
        </div>
      </PageLayout>
    )
  }

  if (!cats?.length || !cat) return <PageLayout><NoCat /></PageLayout>

  // Today's feedings
  const todayFeedings = (feedings ?? []).filter((f) => isToday(new Date(f.fed_at)))

  // Latest weight
  const latestWeight = weights && weights.length > 0 ? weights[weights.length - 1] : null
  const prevWeight = weights && weights.length > 1 ? weights[weights.length - 2] : null
  const weightTrend = latestWeight && prevWeight
    ? latestWeight.weight_kg > prevWeight.weight_kg ? '↑' : latestWeight.weight_kg < prevWeight.weight_kg ? '↓' : '→'
    : null

  // Upcoming reminders
  const upcomingReminders = (reminders ?? [])
    .filter((r) => !r.is_done)
    .filter((r) => differenceInDays(new Date(r.due_date), new Date()) <= 7)
    .slice(0, 3)

  // Today's mood
  const todayMood = (moods ?? []).find((m) => isToday(new Date(m.logged_at)))

  // Tip of the day
  const adoptedDate = cat.adopted_date ? new Date(cat.adopted_date) : null
  const daysOwned = adoptedDate ? differenceInDays(new Date(), adoptedDate) : 0
  const tipIndex = Math.min(daysOwned, NEW_CAT_TIPS.length - 1)
  const tip = NEW_CAT_TIPS[tipIndex]

  async function quickFeed(foodType: 'dry' | 'wet' | 'treat') {
    if (!activeCatId) return
    await addFeeding.mutateAsync({
      cat_id: activeCatId,
      fed_at: new Date().toISOString(),
      food_type: foodType,
    })
    const labels = { dry: '乾糧', wet: '濕糧', treat: '零食' }
    toast(`已記錄 ${labels[foodType]}`)
  }

  return (
    <PageLayout>
      {/* Cat Header */}
      <div className="px-4 pt-6 pb-2">
        <div className="flex items-center gap-4">
          <div
            className="w-20 h-20 rounded-full bg-[#FDDDE6] flex items-center justify-center text-4xl overflow-hidden cursor-pointer flex-shrink-0"
            onClick={() => navigate('/profile')}
          >
            {cat.avatar_url ? (
              <img src={cat.avatar_url} alt={cat.name} className="w-full h-full object-cover" />
            ) : '🐱'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[#4A4A4A]">{cat.name}</h1>
            <p className="text-[#4A4A4A]/60 text-sm">{formatCatAge(cat.birthday)}</p>
            {cat.birthday && <p className="text-[#4A4A4A]/40 text-xs">{catAgeToHuman(cat.birthday)}</p>}
          </div>
        </div>

        {/* Multi-cat switcher */}
        {cats && cats.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            {cats.map((c) => {
              const active = c.id === activeCatId
              return (
                <button
                  key={c.id}
                  onClick={() => useCatStore.getState().setActiveCatId(c.id)}
                  className={[
                    'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                    active ? 'bg-[#F4A9C0] text-white' : 'bg-[#FFF5E6] text-[#4A4A4A]/70 hover:bg-[#FDDDE6]',
                  ].join(' ')}
                >
                  {c.avatar_url
                    ? <img src={c.avatar_url} alt={c.name} className="w-4 h-4 rounded-full object-cover" />
                    : <span className="text-sm">🐱</span>
                  }
                  {c.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="px-4 space-y-3 pb-4">
        {/* Quick Feed */}
        <Card>
          <p className="text-sm font-medium text-[#4A4A4A]/60 mb-3">
            今日餵食 · {todayFeedings.length} 餐
          </p>
          <div className="flex gap-2">
            {(['dry', 'wet', 'treat'] as const).map((type) => {
              const labels = { dry: '🌾 乾糧', wet: '🥫 濕糧', treat: '🍪 零食' }
              return (
                <button
                  key={type}
                  onClick={() => quickFeed(type)}
                  disabled={addFeeding.isPending}
                  className="flex-1 py-2 rounded-2xl bg-[#FFF5E6] text-sm font-medium text-[#4A4A4A] hover:bg-[#FDDDE6] active:scale-95 transition-all"
                >
                  {labels[type]}
                </button>
              )
            })}
          </div>
          {todayFeedings.length > 0 && (
            <div className="mt-2 flex gap-1 flex-wrap">
              {todayFeedings.map((f) => (
                <span key={f.id} className="text-xs bg-[#F4A9C0]/20 text-[#4A4A4A]/70 px-2 py-0.5 rounded-full">
                  {format(new Date(f.fed_at), 'HH:mm')} {f.food_type === 'dry' ? '乾' : f.food_type === 'wet' ? '濕' : '零'}
                </span>
              ))}
            </div>
          )}
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="cursor-pointer" onClick={() => navigate('/weight')}>
            <p className="text-xs text-[#4A4A4A]/50">最近體重</p>
            {latestWeight ? (
              <p className="text-2xl font-bold text-[#4A4A4A] mt-1">
                {latestWeight.weight_kg} <span className="text-sm font-normal">kg</span>
                {weightTrend && <span className={weightTrend === '↑' ? 'text-[#E57373]' : weightTrend === '↓' ? 'text-[#7EC8C8]' : 'text-[#4A4A4A]/40'}> {weightTrend}</span>}
              </p>
            ) : (
              <p className="text-[#4A4A4A]/40 mt-1 text-sm">未有記錄</p>
            )}
          </Card>

          <Card className="cursor-pointer" onClick={() => navigate('/mood')}>
            <p className="text-xs text-[#4A4A4A]/50">今日心情</p>
            {todayMood ? (
              <p className="text-2xl mt-1">
                {MOOD_EMOJIS[todayMood.mood]} <span className="text-sm text-[#4A4A4A]">{MOOD_LABELS[todayMood.mood]}</span>
              </p>
            ) : (
              <p className="text-[#4A4A4A]/40 mt-1 text-sm">記錄今日心情</p>
            )}
          </Card>
        </div>

        {/* Reminders */}
        {upcomingReminders.length > 0 && (
          <Card>
            <p className="text-sm font-medium text-[#4A4A4A]/60 mb-2">即將到期提醒 ⏰</p>
            <div className="space-y-2">
              {upcomingReminders.map((r) => {
                const days = differenceInDays(new Date(r.due_date), new Date())
                const urgency = days <= 1 ? 'text-[#E57373]' : days <= 3 ? 'text-[#FFB74D]' : 'text-[#4A4A4A]/60'
                return (
                  <div key={r.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#4A4A4A]">{r.title}</p>
                      <p className="text-xs text-[#4A4A4A]/50">{REMINDER_TYPE_LABELS[r.type]}</p>
                    </div>
                    <p className={`text-xs font-medium ${urgency}`}>
                      {isToday(new Date(r.due_date)) ? '今日' : isTomorrow(new Date(r.due_date)) ? '明日' : `${days} 日後`}
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* Tip */}
        <Card className="bg-[#FFF5E6] border-[#FFB74D]/30">
          <p className="text-xs text-[#FFB74D] font-medium mb-1">🌟 新手貼士 · 第 {daysOwned + 1} 日</p>
          <p className="text-sm text-[#4A4A4A]">{tip}</p>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { to: '/weight', icon: '⚖️', label: '體重' },
            { to: '/health', icon: '💊', label: '健康' },
            { to: '/milestones', icon: '🏆', label: '里程碑' },
            { to: '/expenses', icon: '💰', label: '開支' },
          ].map((item) => (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-white border border-[#F4A9C0]/20 hover:bg-[#FDDDE6]/50 active:scale-95 transition-all"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-[#4A4A4A]/70">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Photo wall */}
        {recentPhotos && recentPhotos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-[#4A4A4A]/50">📸 相片回憶</p>
              <button onClick={() => navigate('/photos')} className="text-xs text-[#F4A9C0]">查看全部 ›</button>
            </div>
            <div className="columns-3 gap-1.5 space-y-1.5">
              {recentPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="break-inside-avoid rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => navigate('/photos')}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ''}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
