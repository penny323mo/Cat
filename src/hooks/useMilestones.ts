import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Milestone } from '../types'

export function useMilestones(catId?: string) {
  return useQuery({
    queryKey: ['milestones', catId],
    enabled: !!catId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('milestone')
        .select('*')
        .eq('cat_id', catId!)
        .order('date', { ascending: false })
      if (error) throw error
      return data as Milestone[]
    },
  })
}

export function useAddMilestone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<Milestone, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('milestone')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['milestones', data.cat_id] }),
  })
}
