import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { useCatStore } from '../stores/catStore'
import { useAlbums, useCreateAlbum, useDeleteAlbum, usePhotos, useAddPhotoBatch, useDeletePhoto } from '../hooks/usePhotos'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import type { PhotoAlbum } from '../types'

// ── Upload Modal (shared) ────────────────────────────────────────────────────

function UploadModal({
  open,
  onClose,
  catId,
  albumId,
  albums,
}: {
  open: boolean
  onClose: () => void
  catId: string
  albumId?: string          // pre-selected album (when opened from inside album)
  albums: PhotoAlbum[]
}) {
  const addBatch = useAddPhotoBatch()
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [captions, setCaptions] = useState<string[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState(albumId ?? '')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    if (!picked.length) return
    setFiles(picked)
    setPreviews(picked.map((f) => URL.createObjectURL(f)))
    setCaptions(picked.map(() => ''))
  }

  function removePreview(i: number) {
    setFiles((p) => p.filter((_, idx) => idx !== i))
    setPreviews((p) => p.filter((_, idx) => idx !== i))
    setCaptions((p) => p.filter((_, idx) => idx !== i))
  }

  function updateCaption(i: number, val: string) {
    setCaptions((p) => p.map((c, idx) => idx === i ? val : c))
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!files.length) return
    await addBatch.mutateAsync({ files, catId, albumId: selectedAlbum || undefined, captions })
    setFiles([]); setPreviews([]); setCaptions([]); setSelectedAlbum(albumId ?? '')
    onClose()
  }

  function handleClose() {
    setFiles([]); setPreviews([]); setCaptions([]); setSelectedAlbum(albumId ?? '')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="上傳相片">
      <form onSubmit={handleUpload} className="space-y-3">
        {/* Album picker */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#4A4A4A]">加入相簿（選填）</label>
          <select
            value={selectedAlbum}
            onChange={(e) => setSelectedAlbum(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-[#F4A9C0]/30 bg-white text-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-[#F4A9C0]"
          >
            <option value="">不加入相簿</option>
            {albums.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-[#F4A9C0]/50 rounded-2xl p-5 text-center cursor-pointer hover:bg-[#FDDDE6]/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {previews.length === 0 ? (
            <>
              <p className="text-3xl mb-1">📷</p>
              <p className="text-sm text-[#4A4A4A]/50">點擊選擇相片</p>
              <p className="text-xs text-[#4A4A4A]/30 mt-1">可一次選取多張</p>
            </>
          ) : (
            <p className="text-sm text-[#F4A9C0] font-medium">已選 {files.length} 張 · 點擊重新選擇</p>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

        {/* Preview grid with per-photo captions */}
        {previews.length > 0 && (
          <div className="space-y-2">
            {previews.map((src, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePreview(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 text-white text-[10px] flex items-center justify-center"
                  >✕</button>
                </div>
                <input
                  type="text"
                  placeholder="備注（選填）"
                  value={captions[i] ?? ''}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-2xl border border-[#F4A9C0]/30 bg-white text-sm text-[#4A4A4A] focus:outline-none focus:ring-2 focus:ring-[#F4A9C0] placeholder:text-[#4A4A4A]/30"
                />
              </div>
            ))}
          </div>
        )}

        <Button type="submit" fullWidth loading={addBatch.isPending} disabled={!files.length}>
          {addBatch.isPending ? '上傳中...' : `上傳${files.length ? ` ${files.length} 張` : ''}`}
        </Button>
      </form>
    </Modal>
  )
}

// ── Album view (photos inside one album) ────────────────────────────────────

function AlbumView({
  album,
  catId,
  albums,
  onBack,
}: {
  album: PhotoAlbum
  catId: string
  albums: PhotoAlbum[]
  onBack: () => void
}) {
  const { data: photos } = usePhotos(catId, album.id)
  const deletePhoto = useDeletePhoto()
  const deleteAlbum = useDeleteAlbum()
  const [showUpload, setShowUpload] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const selectedPhoto = (photos ?? []).find((p) => p.id === selected)

  async function handleDeleteAlbum() {
    if (!confirm(`刪除相簿「${album.name}」？相片不會刪除，會移到未分類。`)) return
    await deleteAlbum.mutateAsync({ id: album.id, catId })
    onBack()
  }

  return (
    <>
      <Header
        title={album.name}
        showBack
        right={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowUpload(true)}>+ 上傳</Button>
            <button onClick={handleDeleteAlbum} className="text-[#4A4A4A]/30 hover:text-[#E57373] px-2">🗑</button>
          </div>
        }
      />

      <div className="px-4 py-4">
        {(!photos || photos.length === 0) && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🖼️</p>
            <p className="text-[#4A4A4A]/50 mb-3">相簿係空嘅</p>
            <Button size="sm" onClick={() => setShowUpload(true)}>上傳相片</Button>
          </div>
        )}
        <div className="columns-2 gap-3 space-y-3">
          {(photos ?? []).map((photo) => (
            <div
              key={photo.id}
              className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelected(photo.id)}
            >
              <img src={photo.url} alt="" className="w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} catId={catId} albumId={album.id} albums={albums} />

      {/* Fullscreen viewer */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="max-w-sm w-full px-4" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt="" className="w-full rounded-2xl object-contain max-h-[70vh]" />
            <p className="text-white/50 text-center text-xs mt-2">{format(new Date(selectedPhoto.taken_at), 'yyyy年MM月dd日 HH:mm')}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="ghost" fullWidth onClick={() => setSelected(null)} className="text-white border border-white/20">關閉</Button>
              <Button variant="danger" fullWidth onClick={() => { deletePhoto.mutate({ id: selectedPhoto.id, catId }); setSelected(null) }}>刪除</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Main Photo Page ──────────────────────────────────────────────────────────

export function PhotoPage() {
  const { activeCatId } = useCatStore()
  const { data: albums } = useAlbums(activeCatId ?? undefined)
  const { data: allPhotos, isLoading } = usePhotos(activeCatId ?? undefined)   // all photos for count
  const { data: unorganised } = usePhotos(activeCatId ?? undefined, null)      // no album_id
  const createAlbum = useCreateAlbum()
  const deletePhoto = useDeletePhoto()

  const [openAlbum, setOpenAlbum] = useState<PhotoAlbum | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [showNewAlbum, setShowNewAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const selectedPhoto = (unorganised ?? []).find((p) => p.id === selected)

  async function handleCreateAlbum(e: React.FormEvent) {
    e.preventDefault()
    if (!activeCatId || !newAlbumName.trim()) return
    await createAlbum.mutateAsync({ catId: activeCatId, name: newAlbumName.trim() })
    setNewAlbumName('')
    setShowNewAlbum(false)
  }

  // Show album detail view
  if (openAlbum && activeCatId) {
    return (
      <PageLayout>
        <AlbumView
          album={openAlbum}
          catId={activeCatId}
          albums={albums ?? []}
          onBack={() => setOpenAlbum(null)}
        />
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <Header
        title="相簿 📷"
        right={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowNewAlbum(true)}>＋ 相簿</Button>
            <Button size="sm" onClick={() => setShowUpload(true)}>＋ 上傳</Button>
          </div>
        }
      />

      <div className="px-4 py-4 space-y-5">
        {/* Albums section */}
        {(albums ?? []).length > 0 && (
          <div>
            <p className="text-sm font-medium text-[#4A4A4A]/50 mb-2">相簿</p>
            <div className="grid grid-cols-2 gap-3">
              {(albums ?? []).map((album) => {
                const count = (allPhotos ?? []).filter((p) => p.album_id === album.id).length
                return (
                  <Card
                    key={album.id}
                    padding={false}
                    className="cursor-pointer overflow-hidden hover:shadow-md transition-shadow"
                    onClick={() => setOpenAlbum(album)}
                  >
                    <div className="aspect-square bg-[#FDDDE6]/50 overflow-hidden">
                      {album.cover_url ? (
                        <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🖼️</div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="font-medium text-sm text-[#4A4A4A] truncate">{album.name}</p>
                      <p className="text-xs text-[#4A4A4A]/40">{count} 張</p>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Unorganised photos */}
        <div>
          {(unorganised ?? []).length > 0 && (
            <p className="text-sm font-medium text-[#4A4A4A]/50 mb-2">未分類相片</p>
          )}
          {isLoading && <p className="text-center text-[#4A4A4A]/40 py-8">載入中...</p>}
          {!isLoading && (!allPhotos || allPhotos.length === 0) && (albums ?? []).length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">📷</p>
              <p className="text-[#4A4A4A]/50">上傳第一張貓咪相片</p>
            </div>
          )}
          <div className="columns-2 gap-3 space-y-3">
            {(unorganised ?? []).map((photo) => (
              <div
                key={photo.id}
                className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setSelected(photo.id)}
              >
                <img src={photo.url} alt="" className="w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload modal */}
      {activeCatId && (
        <UploadModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          catId={activeCatId}
          albums={albums ?? []}
        />
      )}

      {/* New album modal */}
      <Modal open={showNewAlbum} onClose={() => setShowNewAlbum(false)} title="建立新相簿">
        <form onSubmit={handleCreateAlbum} className="space-y-3">
          <Input
            label="相簿名稱"
            required
            placeholder="e.g. 2025 成長記錄"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
          />
          <Button type="submit" fullWidth loading={createAlbum.isPending}>建立</Button>
        </form>
      </Modal>

      {/* Fullscreen viewer (unorganised) */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="max-w-sm w-full px-4" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt="" className="w-full rounded-2xl object-contain max-h-[70vh]" />
            <p className="text-white/50 text-center text-xs mt-2">{format(new Date(selectedPhoto.taken_at), 'yyyy年MM月dd日 HH:mm')}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="ghost" fullWidth onClick={() => setSelected(null)} className="text-white border border-white/20">關閉</Button>
              <Button variant="danger" fullWidth onClick={() => { deletePhoto.mutate({ id: selectedPhoto.id, catId: selectedPhoto.cat_id }); setSelected(null) }}>刪除</Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
