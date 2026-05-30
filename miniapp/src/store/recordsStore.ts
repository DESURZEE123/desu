import { create } from 'zustand'
import type { WorkRecord, WorkRecordInput } from '@/lib/types'
import {
  listRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  normalizeRecordInput
} from '@/lib/records'

interface RecordsState {
  records: WorkRecord[]
  isLoading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  getById: (id: string) => Promise<WorkRecord | null>
  create: (input: Partial<WorkRecordInput>) => Promise<WorkRecord>
  update: (id: string, input: Partial<WorkRecordInput>) => Promise<WorkRecord>
  remove: (id: string) => Promise<void>
}

export const useRecordsStore = create<RecordsState>((set, get) => ({
  records: [],
  isLoading: false,
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const records = await listRecords()
      set({ records, isLoading: false })
    } catch (err) {
      set({ error: String(err), isLoading: false })
      throw err
    }
  },

  getById: async (id: string) => {
    const cached = get().records.find((r) => r.id === id)
    if (cached) return cached
    return getRecordById(id)
  },

  create: async (input: Partial<WorkRecordInput>) => {
    const normalized = normalizeRecordInput(input)
    const record = await createRecord(normalized)
    set((state) => ({ records: [record, ...state.records] }))
    return record
  },

  update: async (id: string, input: Partial<WorkRecordInput>) => {
    const normalized = normalizeRecordInput(input)
    const record = await updateRecord(id, normalized)
    set((state) => ({
      records: state.records.map((r) => (r.id === id ? record : r))
    }))
    return record
  },

  remove: async (id: string) => {
    await deleteRecord(id)
    set((state) => ({
      records: state.records.filter((r) => r.id !== id)
    }))
  }
}))
