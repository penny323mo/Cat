import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useCatStore } from '../stores/catStore'
import { useExpenses, useAddExpense, useDeleteExpense } from '../hooks/useExpenses'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input, Select } from '../components/ui/Input'
import { EXPENSE_CATEGORY_LABELS, EXPENSE_CATEGORY_EMOJIS } from '../lib/utils'
import type { ExpenseCategory } from '../types'

const CATEGORY_COLORS: Record<string, string> = {
  food: 'var(--cp)',
  medical: '#E57373',
  toy: 'var(--ca)',
  grooming: '#FFB74D',
  other: '#8BC34A',
}

type Period = 'month' | 'year'

export function ExpensePage() {
  const { activeCatId } = useCatStore()
  const { data: expenses } = useExpenses(activeCatId ?? undefined)
  const addExpense = useAddExpense()
  const deleteExpense = useDeleteExpense()
  const [showModal, setShowModal] = useState(false)
  const [period, setPeriod] = useState<Period>('month')
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), category: 'food', amount: '', description: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!activeCatId || !form.amount) return
    await addExpense.mutateAsync({
      cat_id: activeCatId,
      date: form.date,
      category: form.category as ExpenseCategory,
      amount: parseFloat(form.amount),
      description: form.description || undefined,
    })
    setShowModal(false)
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), category: 'food', amount: '', description: '' })
  }

  const now = new Date()
  const filteredExpenses = (expenses ?? []).filter((e) => {
    const d = new Date(e.date)
    if (period === 'month') return d >= startOfMonth(now) && d <= endOfMonth(now)
    return d >= startOfYear(now) && d <= endOfYear(now)
  })

  const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  const byCategory = filteredExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount
    return acc
  }, {})

  const pieData = Object.entries(byCategory).map(([cat, amount]) => ({
    name: EXPENSE_CATEGORY_LABELS[cat],
    value: amount,
    cat,
  }))

  return (
    <PageLayout>
      <Header title="開支記錄 💰" right={
        <Button size="sm" onClick={() => setShowModal(true)}>+ 新增</Button>
      } />

      <div className="px-4 py-4 space-y-4">
        {/* Period toggle */}
        <div className="flex gap-1">
          {(['month', 'year'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                'flex-1 py-2 rounded-2xl text-sm font-medium transition-colors',
                period === p ? 'bg-[var(--cp)] text-white' : 'bg-white text-[#4A4A4A]/60',
              ].join(' ')}
            >
              {p === 'month' ? '本月' : '本年'}
            </button>
          ))}
        </div>

        {/* Total */}
        <Card className="text-center">
          <p className="text-xs text-[#4A4A4A]/50">{period === 'month' ? format(now, 'yyyy年MM月') : format(now, 'yyyy年')} 總開支</p>
          <p className="text-3xl font-bold text-[var(--cp)] mt-1">HKD {total.toFixed(0)}</p>
        </Card>

        {/* Pie chart */}
        {pieData.length > 0 && (
          <Card>
            <p className="text-sm font-medium text-[#4A4A4A]/60 mb-2">分類統計</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.cat} fill={CATEGORY_COLORS[entry.cat]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`HKD ${Number(v).toFixed(0)}`, '']} />
                <Legend formatter={(name) => name} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Expense list */}
        {filteredExpenses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">💰</p>
            <p className="text-[#4A4A4A]/50">未有開支記錄</p>
          </div>
        )}
        <div className="space-y-2">
          {filteredExpenses.map((exp) => (
            <Card key={exp.id} className="flex items-center gap-3">
              <span className="text-2xl">{EXPENSE_CATEGORY_EMOJIS[exp.category]}</span>
              <div className="flex-1">
                <p className="font-medium text-[#4A4A4A]">
                  {EXPENSE_CATEGORY_LABELS[exp.category]}
                  {exp.description && <span className="text-[#4A4A4A]/50 font-normal"> · {exp.description}</span>}
                </p>
                <p className="text-xs text-[#4A4A4A]/40">{format(new Date(exp.date), 'MM月dd日')}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[#4A4A4A]">HKD {exp.amount}</p>
                <button
                  onClick={() => deleteExpense.mutate({ id: exp.id, catId: exp.cat_id })}
                  className="text-[#4A4A4A]/20 hover:text-[#E57373] text-sm"
                >
                  ✕
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="新增開支">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Select label="分類" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            <option value="food">🍱 食物</option>
            <option value="medical">💊 醫療</option>
            <option value="toy">🎾 玩具</option>
            <option value="grooming">✂️ 美容</option>
            <option value="other">📦 其他</option>
          </Select>
          <Input label="金額（HKD）" type="number" step="0.01" required placeholder="e.g. 120" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
          <Input label="日期" type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          <Input label="描述（選填）" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Button type="submit" fullWidth loading={addExpense.isPending}>儲存</Button>
        </form>
      </Modal>
    </PageLayout>
  )
}
