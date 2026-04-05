import { useState } from 'react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { useCatStore } from '../stores/catStore'
import { useWeightLogs, useAddWeight } from '../hooks/useWeight'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'

export function WeightPage() {
  const { activeCatId } = useCatStore()
  const { data: weights, isLoading } = useWeightLogs(activeCatId ?? undefined)
  const addWeight = useAddWeight()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ weight_kg: '', measured_at: format(new Date(), 'yyyy-MM-dd'), notes: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeCatId || !form.weight_kg) return
    await addWeight.mutateAsync({
      cat_id: activeCatId,
      weight_kg: parseFloat(form.weight_kg),
      measured_at: form.measured_at,
      notes: form.notes || undefined,
    })
    setShowModal(false)
    setForm({ weight_kg: '', measured_at: format(new Date(), 'yyyy-MM-dd'), notes: '' })
  }

  const chartData = (weights ?? []).map((w) => ({
    date: format(new Date(w.measured_at), 'MM/dd'),
    weight: w.weight_kg,
  }))

  const latest = weights && weights.length > 0 ? weights[weights.length - 1] : null
  const prev = weights && weights.length > 1 ? weights[weights.length - 2] : null
  const diff = latest && prev ? (latest.weight_kg - prev.weight_kg).toFixed(2) : null

  return (
    <PageLayout>
      <Header title="體重追蹤 ⚖️" right={
        <Button size="sm" onClick={() => setShowModal(true)}>+ 記錄</Button>
      } />

      <div className="px-4 py-4 space-y-4">
        {/* Latest weight card */}
        {latest && (
          <Card className="text-center">
            <p className="text-xs text-[#4A4A4A]/50 mb-1">最新體重</p>
            <p className="text-4xl font-bold text-[#F4A9C0]">{latest.weight_kg} <span className="text-xl font-normal text-[#4A4A4A]">kg</span></p>
            <p className="text-xs text-[#4A4A4A]/40 mt-1">{format(new Date(latest.measured_at), 'yyyy年MM月dd日')}</p>
            {diff && (
              <p className={`text-sm mt-2 font-medium ${parseFloat(diff) > 0 ? 'text-[#E57373]' : parseFloat(diff) < 0 ? 'text-[#7EC8C8]' : 'text-[#4A4A4A]/40'}`}>
                {parseFloat(diff) > 0 ? '↑' : parseFloat(diff) < 0 ? '↓' : '→'} {Math.abs(parseFloat(diff))} kg 較上次
              </p>
            )}
          </Card>
        )}

        {/* Chart */}
        {chartData.length > 1 && (
          <Card>
            <p className="text-sm font-medium text-[#4A4A4A]/60 mb-3">體重趨勢</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F4A9C0/20" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4A4A4A80' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#4A4A4A80' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #F4A9C020', fontSize: 12 }}
                  formatter={(v) => [`${Number(v)} kg`, '體重']}
                />
                <ReferenceLine y={5} stroke="#8BC34A40" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="weight" stroke="#F4A9C0" strokeWidth={2} dot={{ fill: '#F4A9C0', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-[#4A4A4A]/30 mt-1 text-center">參考線：5kg（一般成貓正常範圍）</p>
          </Card>
        )}

        {/* History */}
        <div>
          <p className="text-sm font-medium text-[#4A4A4A]/50 mb-2">記錄歷史</p>
          {isLoading && <p className="text-center text-[#4A4A4A]/40 py-8">載入中...</p>}
          {!isLoading && (!weights || weights.length === 0) && (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">⚖️</p>
              <p className="text-[#4A4A4A]/50">未有體重記錄</p>
            </div>
          )}
          <div className="space-y-2">
            {[...(weights ?? [])].reverse().map((w) => (
              <Card key={w.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#4A4A4A]">{w.weight_kg} kg</p>
                  {w.notes && <p className="text-xs text-[#4A4A4A]/50">{w.notes}</p>}
                </div>
                <p className="text-sm text-[#4A4A4A]/40">{format(new Date(w.measured_at), 'yyyy/MM/dd')}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="記錄體重">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="體重（kg）" type="number" step="0.01" placeholder="e.g. 4.5" required value={form.weight_kg} onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))} />
          <Input label="日期" type="date" required value={form.measured_at} onChange={(e) => setForm((f) => ({ ...f, measured_at: e.target.value }))} />
          <Input label="備註（選填）" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" fullWidth loading={addWeight.isPending}>儲存</Button>
        </form>
      </Modal>
    </PageLayout>
  )
}
