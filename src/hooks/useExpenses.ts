import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Expense } from '../types'

export function useExpenses(catId?: string) {
  return useQuery({
    queryKey: ['expenses', catId],
    enabled: !!catId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expense')
        .select('*')
        .eq('cat_id', catId!)
        .order('date', { ascending: false })
      if (error) throw error
      return data as Expense[]
    },
  })
}

export function useAddExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<Expense, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('expense')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['expenses', data.cat_id] }),
  })
}

export function useDeleteExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, catId }: { id: string; catId: string }) => {
      const { error } = await supabase.from('expense').delete().eq('id', id)
      if (error) throw error
      return catId
    },
    onSuccess: (catId) => qc.invalidateQueries({ queryKey: ['expenses', catId] }),
  })
}
