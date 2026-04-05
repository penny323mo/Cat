import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useCatStore } from '../stores/catStore'
import type { CatProfile } from '../types'

export function useCats() {
  const setCats = useCatStore((s) => s.setCats)

  return useQuery({
    queryKey: ['cats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cat_profile')
        .select('*')
        .order('created_at')
      if (error) throw error
      setCats(data as CatProfile[])
      return data as CatProfile[]
    },
  })
}

export function useCreateCat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<CatProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('cat_profile')
        .insert({ ...values, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cats'] }),
  })
}

export function useUpdateCat() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...values }: Partial<CatProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from('cat_profile')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cats'] }),
  })
}
