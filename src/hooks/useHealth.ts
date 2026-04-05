import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { VetRecord, Reminder } from '../types'

export function useVetRecords(catId?: string) {
  return useQuery({
    queryKey: ['vet', catId],
    enabled: !!catId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vet_record')
        .select('*')
        .eq('cat_id', catId!)
        .order('visit_date', { ascending: false })
      if (error) throw error
      return data as VetRecord[]
    },
  })
}

export function useAddVetRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<VetRecord, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('vet_record')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['vet', data.cat_id] }),
  })
}

export function useReminders(catId?: string) {
  return useQuery({
    queryKey: ['reminders', catId],
    enabled: !!catId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminder')
        .select('*')
        .eq('cat_id', catId!)
        .order('due_date')
      if (error) throw error
      return data as Reminder[]
    },
  })
}

export function useAddReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Omit<Reminder, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('reminder')
        .insert(values)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['reminders', data.cat_id] }),
  })
}

export function useToggleReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_done, catId }: { id: string; is_done: boolean; catId: string }) => {
      const { error } = await supabase.from('reminder').update({ is_done }).eq('id', id)
      if (error) throw error
      return catId
    },
    onSuccess: (catId) => qc.invalidateQueries({ queryKey: ['reminders', catId] }),
  })
}
