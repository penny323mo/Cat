import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCatStore } from '../stores/catStore'
import { useCats, useCreateCat, useUpdateCat } from '../hooks/useCats'
import { supabase } from '../lib/supabase'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select, Textarea } from '../components/ui/Input'
import { formatCatAge, catAgeToHuman } from '../lib/utils'
import type { CatProfile } from '../types'

function CatForm({ initial, onSave, loading }: {
  initial?: Partial<CatProfile>
  onSave: (data: Partial<CatProfile>) => Promise<void>
  loading?: boolean
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    breed: initial?.breed ?? '',
    gender: initial?.gender ?? 'unknown',
    birthday: initial?.birthday ?? '',
    adopted_date: initial?.adopted_date ?? '',
    color: initial?.color ?? '',
    microchip_id: initial?.microchip_id ?? '',
    notes: initial?.notes ?? '',
    avatar_url: initial?.avatar_url ?? '',
    target_weight: initial?.target_weight ? String(initial.target_weight) : '',
  })
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('cat-media').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('cat-media').getPublicUrl(path)
      setForm((f) => ({ ...f, avatar_url: publicUrl }))
    }
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSave({
      name: form.name,
      breed: form.breed || undefined,
      gender: form.gender as CatProfile['gender'],
      birthday: form.birthday || undefined,
      adopted_date: form.adopted_date || undefined,
      color: form.color || undefined,
      microchip_id: form.microchip_id || undefined,
      notes: form.notes || undefined,
      avatar_url: form.avatar_url || undefined,
      target_weight: form.target_weight ? parseFloat(form.target_weight) : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <div
          className="w-24 h-24 rounded-full bg-[var(--cp-l)] flex items-center justify-center text-5xl overflow-hidden cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          {form.avatar_url ? <img src={form.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : '🐱'}
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-[var(--cp)]">
          {uploading ? '上傳中...' : '更換大頭照'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      </div>

      <Input label="貓咪名字 *" required placeholder="e.g. 豆豆" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      <Select label="性別" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as 'male' | 'female' | 'unknown' }))}>
        <option value="male">♂ 公</option>
        <option value="female">♀ 母</option>
        <option value="unknown">不詳</option>
      </Select>
      <Input label="品種（選填）" placeholder="e.g. 英國短毛貓" value={form.breed} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))} />
      <Input label="毛色（選填）" placeholder="e.g. 橙白" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
      <Input label="生日（選填）" type="date" value={form.birthday} onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))} />
      <Input label="到家日期（選填）" type="date" value={form.adopted_date} onChange={(e) => setForm((f) => ({ ...f, adopted_date: e.target.value }))} />
      <Input label="晶片號碼（選填）" value={form.microchip_id} onChange={(e) => setForm((f) => ({ ...f, microchip_id: e.target.value }))} />
      <Input label="目標體重 kg（選填）" type="number" step="0.1" placeholder="e.g. 4.5" value={form.target_weight} onChange={(e) => setForm((f) => ({ ...f, target_weight: e.target.value }))} />
      <Textarea label="備註（選填）" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      <Button type="submit" fullWidth loading={loading}>儲存</Button>
    </form>
  )
}

export function ProfilePage() {
  const { activeCatId, setActiveCatId } = useCatStore()
  const { data: cats } = useCats()
  const createCat = useCreateCat()
  const updateCat = useUpdateCat()
  const [showCreate, setShowCreate] = useState(false)
  const cat = (cats ?? []).find((c) => c.id === activeCatId)

  async function handleCreate(data: Partial<CatProfile>) {
    const result = await createCat.mutateAsync(data as Omit<CatProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
    setActiveCatId(result.id)
    setShowCreate(false)
  }

  async function handleUpdate(data: Partial<CatProfile>) {
    if (!activeCatId) return
    await updateCat.mutateAsync({ id: activeCatId, ...data })
  }

  return (
    <PageLayout>
      <Header title="貓咪檔案 🐱" right={
        <Button size="sm" variant="secondary" onClick={() => setShowCreate(true)}>+ 新貓咪</Button>
      } />

      <div className="px-4 py-4 space-y-4">
        {/* Cat switcher */}
        {cats && cats.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {cats.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCatId(c.id)}
                className={[
                  'flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-colors',
                  activeCatId === c.id ? 'bg-[var(--cp)] text-white' : 'bg-white text-[#4A4A4A]/70',
                ].join(' ')}
              >
                <span className="text-xl">
                  {c.avatar_url ? <img src={c.avatar_url} alt={c.name} className="w-8 h-8 rounded-full object-cover" /> : '🐱'}
                </span>
                <span className="text-xs">{c.name}</span>
              </button>
            ))}
          </div>
        )}

        {cat ? (
          <>
            {/* Summary card */}
            <Card className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[var(--cp-l)] flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
                {cat.avatar_url ? <img src={cat.avatar_url} alt={cat.name} className="w-full h-full object-cover" /> : '🐱'}
              </div>
              <div>
                <p className="font-bold text-xl text-[#4A4A4A]">{cat.name}</p>
                <p className="text-sm text-[#4A4A4A]/60">{formatCatAge(cat.birthday)}</p>
                {cat.birthday && <p className="text-xs text-[#4A4A4A]/40">{catAgeToHuman(cat.birthday)}</p>}
                {cat.breed && <p className="text-xs text-[#4A4A4A]/50">{cat.breed} · {cat.color}</p>}
              </div>
            </Card>

            {/* Edit form */}
            <Card>
              <p className="text-sm font-medium text-[#4A4A4A]/60 mb-3">編輯資料</p>
              <CatForm
                initial={cat}
                onSave={handleUpdate}
                loading={updateCat.isPending}
              />
            </Card>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🐱</p>
            <p className="text-[#4A4A4A]/50 mb-4">未有貓咪檔案</p>
            <Button onClick={() => setShowCreate(true)}>建立貓咪檔案</Button>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--cp)]/20">
              <h2 className="text-lg font-semibold text-[#4A4A4A]">新增貓咪</h2>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--cp-xl)]">✕</button>
            </div>
            <div className="p-4">
              <CatForm onSave={handleCreate} loading={createCat.isPending} />
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

export function NewProfilePage() {
  const navigate = useNavigate()
  const createCat = useCreateCat()
  const { setActiveCatId } = useCatStore()

  async function handleCreate(data: Partial<CatProfile>) {
    const result = await createCat.mutateAsync(data as Omit<CatProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>)
    setActiveCatId(result.id)
    navigate('/')
  }

  return (
    <PageLayout hideTabBar>
      <Header title="建立貓咪檔案 🐱" showBack />
      <div className="px-4 py-4">
        <CatForm onSave={handleCreate} loading={createCat.isPending} />
      </div>
    </PageLayout>
  )
}
