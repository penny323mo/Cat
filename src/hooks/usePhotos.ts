import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Photo } from '../types'

export function usePhotos(catId?: string) {
  return useQuery({
    queryKey: ['photos', catId],
    enabled: !!catId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photo')
        .select('*')
        .eq('cat_id', catId!)
        .order('taken_at', { ascending: false })
      if (error) throw error
      return data as Photo[]
    },
  })
}

export function useAddPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ file, catId, caption }: { file: File; catId: string; caption?: string }) => {
      const ext = file.name.split('.').pop()
      const path = `${catId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('cat-media')
        .upload(path, file)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('cat-media')
        .getPublicUrl(path)

      const { data, error } = await supabase
        .from('photo')
        .insert({ cat_id: catId, url: publicUrl, caption, taken_at: new Date().toISOString() })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['photos', data.cat_id] }),
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
