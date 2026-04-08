import { useState } from 'react'
import { useCatStore } from '../stores/catStore'
import { useCats } from '../hooks/useCats'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { NEW_CAT_TIPS, CAT_TIPS_RANDOM } from '../data/tips'
import { VACCINE_SCHEDULE } from '../data/vaccine-schedule'
import { differenceInDays } from 'date-fns'

const CHECKLIST = [
  { item: '購買貓砂盆（建議1貓1盆+多1個）', category: '必需品' },
  { item: '準備貓砂（豆腐砂或礦石砂）', category: '必需品' },
  { item: '購買食物碗和水碗（建議陶瓷或不鏽鋼）', category: '必需品' },
  { item: '購買貓窩或貓床', category: '必需品' },
  { item: '購備貓糧（先用原來品牌，慢慢換）', category: '必需品' },
  { item: '藏好家中電線、繩索', category: '安全' },
  { item: '確認家中植物安全（百合花有毒！）', category: '安全' },
  { item: '裝好窗戶防貓網', category: '安全' },
  { item: '收起細小物品（橡皮筋、針等）', category: '安全' },
  { item: '預約獸醫做首次健康檢查', category: '健康' },
  { item: '了解附近24小時獸醫診所', category: '健康' },
  { item: '購備急救用品（體溫計等）', category: '健康' },
  { item: '購買逗貓棒和玩具', category: '娛樂' },
  { item: '準備貓抓板', category: '娛樂' },
  { item: '安裝貓跳台或層架', category: '娛樂' },
]

const FAQS = [
  { q: '貓咪多久要洗澡？', a: '一般貓咪每 4-6 週洗一次已足夠。短毛貓可以更少，長毛貓可能需要更頻繁。大多數貓咪不喜歡洗澡，可用濕毛巾擦拭代替。' },
  { q: '貓咪每天應該吃多少？', a: '成貓每日大約需要 20-25 kcal/kg 體重。一隻 4kg 的貓每日需要約 240 kcal。乾糧約每 100g 有 350-400 kcal，可參考包裝建議量並根據貓咪狀況調整。' },
  { q: '貓咪嘔吐是否正常？', a: '偶爾嘔毛球（每週一兩次）係正常的。如果頻繁嘔吐、嘔血、或伴隨食慾不振，應儘快求醫。' },
  { q: '如何訓練貓咪用貓砂盆？', a: '幼貓通常本能地會用砂盆。放牠到砂盆裡讓牠探索，保持砂盆清潔（每天至少撿一次），避免放在食水附近。' },
  { q: '貓咪可以吃人類食物嗎？', a: '部分人類食物對貓咪有毒，包括：洋蔥、大蒜、葡萄、朱古力、咖啡因、酒精、木糖醇等。魚和雞肉可以適量作零食，但不能代替主糧。' },
  { q: '何時需要絕育？', a: '建議在 5-6 個月大時絕育。絕育可以防止意外懷孕、減少某些癌症風險、以及改善一些行為問題（如噴尿）。' },
]

type Tab = 'tips' | 'checklist' | 'faq' | 'vaccine'

export function GuidePage() {
  const { activeCatId } = useCatStore()
  const { data: cats } = useCats()
  const [tab, setTab] = useState<Tab>('tips')
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const cat = (cats ?? []).find((c) => c.id === activeCatId)
  const adoptedDate = cat?.adopted_date ? new Date(cat.adopted_date) : null
  const daysOwned = adoptedDate ? differenceInDays(new Date(), adoptedDate) : 0
  const tipIndex = Math.min(daysOwned, NEW_CAT_TIPS.length - 1)

  const toggleCheck = (i: number) => {
    const next = new Set(checked)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    setChecked(next)
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'tips', label: '🌟 貼士' },
    { key: 'checklist', label: '✅ 清單' },
    { key: 'faq', label: '❓ FAQ' },
    { key: 'vaccine', label: '💉 疫苗' },
  ]

  return (
    <PageLayout>
      <Header title="新手指南 📖" />

      <div className="flex gap-1 px-4 pt-4 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              'flex-shrink-0 px-3 py-2 rounded-2xl text-sm font-medium transition-colors',
              tab === t.key ? 'bg-[var(--cp)] text-white' : 'bg-white text-[#4A4A4A]/60',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 space-y-3">
        {tab === 'tips' && (
          <>
            {adoptedDate && (
              <Card className="bg-[var(--cp-xl)] border-[#FFB74D]/30">
                <p className="text-xs text-[#FFB74D] font-medium mb-1">今日貼士 · 第 {daysOwned + 1} 日</p>
                <p className="text-sm text-[#4A4A4A]">{NEW_CAT_TIPS[tipIndex]}</p>
              </Card>
            )}
            <p className="text-sm font-medium text-[#4A4A4A]/60">30 日新手養貓貼士</p>
            {NEW_CAT_TIPS.map((tip, i) => (
              <Card key={i} className={i === tipIndex ? 'border-[var(--cp)]' : ''}>
                <p className="text-xs text-[#4A4A4A]/40 mb-1">第 {i + 1} 日</p>
                <p className="text-sm text-[#4A4A4A]">{tip}</p>
              </Card>
            ))}
            <p className="text-sm font-medium text-[#4A4A4A]/60 mt-2">其他養貓知識</p>
            {CAT_TIPS_RANDOM.map((tip, i) => (
              <Card key={i}>
                <p className="text-sm text-[#4A4A4A]">💡 {tip}</p>
              </Card>
            ))}
          </>
        )}

        {tab === 'checklist' && (
          <>
            <p className="text-sm text-[#4A4A4A]/60">新貓到家準備清單（{checked.size}/{CHECKLIST.length}）</p>
            <div className="w-full bg-[var(--cp)]/20 rounded-full h-2">
              <div
                className="bg-[var(--cp)] h-2 rounded-full transition-all"
                style={{ width: `${(checked.size / CHECKLIST.length) * 100}%` }}
              />
            </div>
            {['必需品', '安全', '健康', '娛樂'].map((cat) => (
              <div key={cat}>
                <p className="text-xs font-medium text-[#4A4A4A]/40 mb-2">{cat}</p>
                {CHECKLIST.filter((c) => c.category === cat).map((c, i) => {
                  const globalIdx = CHECKLIST.indexOf(c)
                  return (
                    <button
                      key={i}
                      onClick={() => toggleCheck(globalIdx)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border border-[var(--cp)]/20 mb-2 text-left hover:bg-[var(--cp-xl)] transition-colors"
                    >
                      <div className={[
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                        checked.has(globalIdx) ? 'bg-[#8BC34A] border-[#8BC34A]' : 'border-[var(--cp)]',
                      ].join(' ')}>
                        {checked.has(globalIdx) && <span className="text-white text-xs">✓</span>}
                      </div>
                      <p className={['text-sm', checked.has(globalIdx) ? 'line-through text-[#4A4A4A]/40' : 'text-[#4A4A4A]'].join(' ')}>{c.item}</p>
                    </button>
                  )
                })}
              </div>
            ))}
          </>
        )}

        {tab === 'faq' && (
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <Card key={i} padding={false}>
                <button
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                >
                  <p className="font-medium text-[#4A4A4A] pr-2">{faq.q}</p>
                  <span className={['text-[var(--cp)] transition-transform', expandedFaq === i ? 'rotate-180' : ''].join(' ')}>▾</span>
                </button>
                {expandedFaq === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-[#4A4A4A]/70">{faq.a}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {tab === 'vaccine' && (
          <div className="space-y-3">
            <p className="text-sm text-[#4A4A4A]/60">建議疫苗及驅蟲時間表（請諮詢獸醫確認）</p>
            {VACCINE_SCHEDULE.map((v, i) => (
              <Card key={i}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{v.type === 'vaccine' ? '💉' : '🪱'}</span>
                  <div>
                    <p className="font-medium text-[#4A4A4A]">{v.title}</p>
                    <p className="text-xs text-[#4A4A4A]/50 mt-0.5">{v.description}</p>
                    <div className="flex gap-3 mt-1">
                      <p className="text-xs text-[#4A4A4A]/40">首次：{v.firstAt}</p>
                      <p className="text-xs text-[#4A4A4A]/40">每 {v.recurrenceDays} 日重複</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
