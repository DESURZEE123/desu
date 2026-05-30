import { getSupabaseClient } from '@/lib/supabase'
import { nextMonthStart } from '@/lib/format'
import type { WorkRecord, WorkRecordInput, WorkRecordRow } from '@/lib/types'

function mapRecord(row: WorkRecordRow): WorkRecord {
  return {
    id: row.id,
    workDate: row.work_date,
    styleName: row.style_name,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    note: row.note ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function normalizeRecordInput(input: Partial<WorkRecordInput>): WorkRecordInput {
  const workDate = String(input.workDate ?? '').trim()
  const styleName = String(input.styleName ?? '').trim()
  const quantity = Number(input.quantity)
  const unitPrice = Number(input.unitPrice)
  const note = String(input.note ?? '').trim()

  if (!workDate || !styleName || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
    throw new Error('请填写日期、款式、件数和单价。')
  }
  if (quantity <= 0) throw new Error('件数必须大于 0。')
  if (unitPrice < 0) throw new Error('单价不能小于 0。')

  return { workDate, styleName, quantity, unitPrice, note }
}

async function getAuthContext() {
  const supabase = getSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('未登录')
  return { supabase, user }
}

export async function listRecords(): Promise<WorkRecord[]> {
  const { supabase, user } = await getAuthContext()
  const { data, error } = await supabase
    .from('work_records')
    .select('*')
    .eq('user_id', user.id)
    .order('work_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as WorkRecordRow[]).map(mapRecord)
}

export async function listRecordsByMonth(ym: string): Promise<WorkRecord[]> {
  const { supabase, user } = await getAuthContext()
  const [year, month] = ym.split('-')
  const start = `${year}-${month}-01`
  const end = nextMonthStart(ym)

  const { data, error } = await supabase
    .from('work_records')
    .select('*')
    .eq('user_id', user.id)
    .gte('work_date', start)
    .lt('work_date', end)
    .order('work_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return ((data ?? []) as WorkRecordRow[]).map(mapRecord)
}

export async function getRecordById(id: string): Promise<WorkRecord | null> {
  const { supabase, user } = await getAuthContext()
  const { data, error } = await supabase
    .from('work_records')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapRecord(data as WorkRecordRow) : null
}

export async function createRecord(input: WorkRecordInput): Promise<WorkRecord> {
  const { supabase, user } = await getAuthContext()
  const { data, error } = await supabase
    .from('work_records')
    .insert({
      user_id: user.id,
      work_date: input.workDate,
      style_name: input.styleName,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      note: input.note
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapRecord(data as WorkRecordRow)
}

export async function updateRecord(id: string, input: WorkRecordInput): Promise<WorkRecord> {
  const { supabase, user } = await getAuthContext()
  const { data, error } = await supabase
    .from('work_records')
    .update({
      work_date: input.workDate,
      style_name: input.styleName,
      quantity: input.quantity,
      unit_price: input.unitPrice,
      note: input.note
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapRecord(data as WorkRecordRow)
}

export async function deleteRecord(id: string): Promise<void> {
  const { supabase, user } = await getAuthContext()
  const { error } = await supabase
    .from('work_records')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
}
