import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { FeedingLog } from '../types'

export function useFeedingLogs(catId?: string) {
  return useQuery({
    queryKey: ['feeding', catId],
    enabled: !!catId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feeding_log')
        .select('*')
        .eq('cat_id', catId!)
        .order('fed_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data as FeedingLog[]
    },
  })
}

export function useAddFeeding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<FeedingLog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('feeding_log')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['feeding', data.cat_id] }),
  })
}

export function useDeleteFeeding() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, catId }: { id: string; catId: string }) => {
      const { error } = await supabase.from('feeding_log').delete().eq('id', id)
      if (error) throw error
      return catId
    },
    onSuccess: (catId) => qc.invalidateQueries({ queryKey: ['feeding', catId] }),
  })
}
