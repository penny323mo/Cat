import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { WeightLog } from '../types'

export function useWeightLogs(catId?: string) {
  return useQuery({
    queryKey: ['weight', catId],
    enabled: !!catId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weight_log')
        .select('*')
        .eq('cat_id', catId!)
        .order('measured_at', { ascending: true })
      if (error) throw error
      return data as WeightLog[]
    },
  })
}

export function useAddWeight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<WeightLog, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('weight_log')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['weight', data.cat_id] }),
  })
}
