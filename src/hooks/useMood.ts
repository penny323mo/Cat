import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { MoodLog } from '../types'

export function useMoodLogs(catId?: string) {
  return useQuery({
    queryKey: ['mood', catId],
    enabled: !!catId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_log')
        .select('*')
        .eq('cat_id', catId!)
        .order('logged_at', { ascending: false })
        .limit(90)
      if (error) throw error
      return data as MoodLog[]
    },
  })
}

export function useAddMood() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<MoodLog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('mood_log')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['mood', data.cat_id] }),
  })
}
