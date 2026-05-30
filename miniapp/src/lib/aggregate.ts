import type { DayGroup, MonthSummary, WorkRecord } from '@/lib/types'
import { monthLabel, parseYearMonth } from '@/lib/format'

export function getGrandTotal(records: WorkRecord[]) {
  return records.reduce((sum, record) => sum + record.quantity * record.unitPrice, 0)
}

export function getMonthSummaries(records: WorkRecord[]): MonthSummary[] {
  const months = new Map<string, MonthSummary>()

  for (const record of records) {
    const ym = parseYearMonth(record.workDate)
    const existing = months.get(ym) ?? {
      ym,
      label: monthLabel(ym),
      quantity: 0,
      total: 0
    }

    existing.quantity += record.quantity
    existing.total += record.quantity * record.unitPrice
    months.set(ym, existing)
  }

  return Array.from(months.values()).sort((a, b) => b.ym.localeCompare(a.ym))
}

export function getDayGroups(records: WorkRecord[]): DayGroup[] {
  const days = new Map<string, DayGroup>()

  for (const record of records) {
    const existing = days.get(record.workDate) ?? {
      date: record.workDate,
      day: Number(record.workDate.split('-')[2]),
      total: 0,
      records: []
    }

    existing.total += record.quantity * record.unitPrice
    existing.records.push(record)
    days.set(record.workDate, existing)
  }

  return Array.from(days.values())
    .map((group) => ({
      ...group,
      records: group.records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
}
