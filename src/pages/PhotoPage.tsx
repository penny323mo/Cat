import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { useCatStore } from '../stores/catStore'
import { usePhotos, useAddPhotoBatch, useDeletePhoto } from '../hooks/usePhotos'
import { PageLayout } from '../components/layout/PageLayout'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'

export function PhotoPage() {
  const { activeCatId } = useCatStore()
  const { data: photos, isLoading } = usePhotos(activeCatId ?? undefined)
  const addPhotoBatch = useAddPhotoBatch()
  const deletePhoto = useDeletePhoto()
  const [showModal, setShowModal] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? [])
    if (!picked.length) return
    setFiles(picked)
    setPreviews(picked.map((f) => URL.createObjectURL(f)))
  }

  function removePreview(i: number) {
    setFiles((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!activeCatId || !files.length) return
    await addPhotoBatch.mutateAsync({ files, catId: activeCatId })
    setShowModal(false)
    setFiles([])
    setPreviews([])
  }

  const selectedPhoto = (photos ?? []).find((p) => p.id === selected)

  return (
    <PageLayout>
      <Header title="相簿 📷" right={
        <Button size="sm" onClick={() => setShowModal(true)}>+ 上傳</Button>
      } />

      <div className="px-4 py-4">
        {isLoading && <p className="text-center text-[#4A4A4A]/40 py-8">載入中...</p>}
        {!isLoading && (!photos || photos.length === 0) && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📷</p>
            <p className="text-[#4A4A4A]/50">上傳第一張貓咪相片</p>
          </div>
        )}

        {/* Masonry grid */}
        <div className="columns-2 gap-3 space-y-3">
          {(photos ?? []).map((photo) => (
            <div
              key={photo.id}
              className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelected(photo.id)}
            >
              <img src={photo.url} alt={photo.caption ?? ''} className="w-full object-cover" loading="lazy" />
              {photo.caption && (
                <div className="bg-white px-3 py-2">
                  <p className="text-xs text-[#4A4A4A]/70">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upload modal — supports multi-select */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setFiles([]); setPreviews([]) }} title="上傳相片">
        <form onSubmit={handleUpload} className="space-y-3">
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
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />

          {/* Preview grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePreview(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button type="submit" fullWidth loading={addPhotoBatch.isPending} disabled={!files.length}>
            {addPhotoBatch.isPending ? `上傳中...` : `上傳 ${files.length ? `${files.length} 張` : ''}`}
          </Button>
        </form>
      </Modal>

      {/* Photo viewer */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="max-w-sm w-full px-4" onClick={(e) => e.stopPropagation()}>
            <img src={selectedPhoto.url} alt={selectedPhoto.caption ?? ''} className="w-full rounded-2xl object-contain max-h-[70vh]" />
            {selectedPhoto.caption && <p className="text-white text-center mt-3">{selectedPhoto.caption}</p>}
            <p className="text-white/50 text-center text-xs mt-1">{format(new Date(selectedPhoto.taken_at), 'yyyy年MM月dd日 HH:mm')}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="ghost" fullWidth onClick={() => setSelected(null)} className="text-white border border-white/20">關閉</Button>
              <Button
                variant="danger"
                fullWidth
                onClick={() => {
                  deletePhoto.mutate({ id: selectedPhoto.id, catId: selectedPhoto.cat_id })
                  setSelected(null)
                }}
              >
                刪除
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
