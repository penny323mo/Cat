import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Photo, PhotoAlbum } from '../types'

// ── Albums ──────────────────────────────────────────────────────────────────

export function useAlbums(catId?: string) {
  return useQuery({
    queryKey: ['albums', catId],
    enabled: !!catId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photo_album')
        .select('*')
        .eq('cat_id', catId!)
        .order('created_at')
      if (error) throw error
      return data as PhotoAlbum[]
    },
  })
}

export function useCreateAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ catId, name }: { catId: string; name: string }) => {
      const { data, error } = await supabase
        .from('photo_album')
        .insert({ cat_id: catId, name })
        .select()
        .single()
      if (error) throw error
      return data as PhotoAlbum
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['albums', data.cat_id] }),
  })
}

export function useDeleteAlbum() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, catId }: { id: string; catId: string }) => {
      const { error } = await supabase.from('photo_album').delete().eq('id', id)
      if (error) throw error
      return catId
    },
    onSuccess: (catId) => qc.invalidateQueries({ queryKey: ['albums', catId] }),
  })
}

// ── Photos ───────────────────────────────────────────────────────────────────

export function usePhotos(catId?: string, albumId?: string | null) {
  return useQuery({
    queryKey: ['photos', catId, albumId],
    enabled: !!catId,
    queryFn: async () => {
      let q = supabase
        .from('photo')
        .select('*')
        .eq('cat_id', catId!)
        .order('taken_at', { ascending: false })
      if (albumId === null) {
        q = q.is('album_id', null)          // unorganised photos
      } else if (albumId) {
        q = q.eq('album_id', albumId)       // specific album
      }
      const { data, error } = await q
      if (error) throw error
      return data as Photo[]
    },
  })
}

export function useAddPhotoBatch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ files, catId, albumId }: { files: File[]; catId: string; albumId?: string }) => {
      const results = await Promise.all(
        files.map(async (file) => {
          const ext = file.name.split('.').pop()
          const path = `${catId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const { error: uploadError } = await supabase.storage.from('cat-media').upload(path, file)
          if (uploadError) throw uploadError
          const { data: { publicUrl } } = supabase.storage.from('cat-media').getPublicUrl(path)
          return { cat_id: catId, album_id: albumId ?? null, url: publicUrl, taken_at: new Date().toISOString() }
        })
      )
      const { data, error } = await supabase.from('photo').insert(results).select()
      if (error) throw error

      // Set first photo as album cover if album has none yet
      if (albumId && data?.length) {
        const { data: album } = await supabase.from('photo_album').select('cover_url').eq('id', albumId).single()
        if (!album?.cover_url) {
          await supabase.from('photo_album').update({ cover_url: data[0].url }).eq('id', albumId)
        }
      }
      return data
    },
    onSuccess: (_data, { catId, albumId }) => {
      qc.invalidateQueries({ queryKey: ['photos', catId] })
      if (albumId) qc.invalidateQueries({ queryKey: ['albums', catId] })
    },
  })
}

export function useDeletePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, catId }: { id: string; catId: string }) => {
      const { error } = await supabase.from('photo').delete().eq('id', id)
      if (error) throw error
      return catId
    },
    onSuccess: (catId) => qc.invalidateQueries({ queryKey: ['photos', catId] }),
  })
}
