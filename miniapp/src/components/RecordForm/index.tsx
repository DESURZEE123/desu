import { useState, useMemo } from 'react'
import { View, Text, Input, Textarea, Button, PickerView, PickerViewColumn } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { formatMoney } from '@/lib/format'
import type { WorkRecordInput } from '@/lib/types'
import './index.scss'

interface RecordFormProps {
  initialValues: WorkRecordInput
  onSave: (input: WorkRecordInput) => Promise<void>
}

function buildDateColumns(selectedDate: string) {
  const [y, m, d] = selectedDate.split('-').map(Number)
  const now = new Date()
  const currentYear = now.getFullYear()

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const daysInMonth = new Date(y, m, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const yearIdx = years.indexOf(y)
  const monthIdx = months.indexOf(m)
  const dayIdx = days.indexOf(d)

  return {
    years,
    months,
    days,
    indices: [yearIdx >= 0 ? yearIdx : 0, monthIdx >= 0 ? monthIdx : 0, dayIdx >= 0 ? dayIdx : 0]
  }
}

export default function RecordForm({ initialValues, onSave }: RecordFormProps) {
  const [form, setForm] = useState<WorkRecordInput>(initialValues)
  const [saving, setSaving] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pickerValue, setPickerValue] = useState<number[]>(() => {
    return buildDateColumns(initialValues.workDate).indices
  })

  const dateColumns = useMemo(() => buildDateColumns(form.workDate), [form.workDate])

  const subtotal = useMemo(
    () => (Number(form.quantity) || 0) * (Number(form.unitPrice) || 0),
    [form.quantity, form.unitPrice]
  )

  function handlePickerChange(e: any) {
    const indices: number[] = e.detail.value
    setPickerValue(indices)
    const { years, months } = buildDateColumns(form.workDate)
    const y = years[indices[0]] ?? years[0]
    const m = months[indices[1]] ?? months[0]
    const daysInMonth = new Date(y, m, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const d = days[indices[2]] ?? days[0]
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    setForm((prev) => ({ ...prev, workDate: dateStr }))
  }

  async function handleSave() {
    if (!form.styleName.trim()) {
      Taro.showToast({ title: '请填写款式名称', icon: 'none' })
      return
    }
    if (!form.quantity || Number(form.quantity) <= 0) {
      Taro.showToast({ title: '件数必须大于 0', icon: 'none' })
      return
    }
    if (form.unitPrice === undefined || Number(form.unitPrice) < 0) {
      Taro.showToast({ title: '单价不能小于 0', icon: 'none' })
      return
    }

    setSaving(true)
    try {
      await onSave({
        workDate: form.workDate,
        styleName: form.styleName.trim(),
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice),
        note: form.note.trim()
      })
    } catch (err) {
      Taro.showToast({ title: String(err) || '保存失败', icon: 'error', duration: 2000 })
    } finally {
      setSaving(false)
    }
  }

  const { years, months, days } = dateColumns

  return (
    <View className='record-form'>
      {/* Date field */}
      <View className='form-field'>
        <Text className='form-label'>日期</Text>
        <View className='form-date-trigger' onClick={() => setShowDatePicker(true)}>
          <Text className='form-date-text'>{form.workDate}</Text>
          <Text className='form-date-icon'>📅</Text>
        </View>
      </View>

      {/* Date picker overlay */}
      {showDatePicker && (
        <View className='date-picker-overlay' onClick={() => setShowDatePicker(false)}>
          <View className='date-picker-panel' onClick={(e) => e.stopPropagation()}>
            <View className='date-picker-header'>
              <Text className='date-picker-cancel' onClick={() => setShowDatePicker(false)}>取消</Text>
              <Text className='date-picker-title'>选择日期</Text>
              <Text className='date-picker-confirm' onClick={() => setShowDatePicker(false)}>确定</Text>
            </View>
            <PickerView
              className='date-picker-view'
              value={pickerValue}
              onChange={handlePickerChange}
            >
              <PickerViewColumn>
                {years.map((y) => (
                  <View key={y} className='picker-item'><Text>{y}年</Text></View>
                ))}
              </PickerViewColumn>
              <PickerViewColumn>
                {months.map((m) => (
                  <View key={m} className='picker-item'><Text>{m}月</Text></View>
                ))}
              </PickerViewColumn>
              <PickerViewColumn>
                {days.map((d) => (
                  <View key={d} className='picker-item'><Text>{d}日</Text></View>
                ))}
              </PickerViewColumn>
            </PickerView>
          </View>
        </View>
      )}

      {/* Style name */}
      <View className='form-field'>
        <Text className='form-label'>款式名称</Text>
        <Input
          className='form-input'
          value={form.styleName}
          placeholder='请输入款式名称'
          onInput={(e) => setForm((prev) => ({ ...prev, styleName: e.detail.value }))}
        />
      </View>

      {/* Quantity */}
      <View className='form-field'>
        <Text className='form-label'>件数</Text>
        <Input
          className='form-input'
          type='digit'
          value={String(form.quantity || '')}
          placeholder='请输入件数'
          onInput={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.detail.value) || 0 }))}
        />
      </View>

      {/* Unit price */}
      <View className='form-field'>
        <Text className='form-label'>单价（元）</Text>
        <Input
          className='form-input'
          type='digit'
          value={String(form.unitPrice || '')}
          placeholder='请输入单价'
          onInput={(e) => setForm((prev) => ({ ...prev, unitPrice: Number(e.detail.value) || 0 }))}
        />
      </View>

      {/* Subtotal */}
      <View className='form-subtotal'>
        <Text className='form-subtotal-label'>小计</Text>
        <Text className='form-subtotal-value'>{formatMoney(subtotal)}</Text>
      </View>

      {/* Note */}
      <View className='form-field'>
        <Text className='form-label'>备注（选填）</Text>
        <Textarea
          className='form-textarea'
          value={form.note}
          placeholder='请输入备注'
          maxlength={200}
          onInput={(e) => setForm((prev) => ({ ...prev, note: e.detail.value }))}
        />
      </View>

      {/* Submit */}
      <View className='form-submit-wrap'>
        <Button className='form-submit-btn' onClick={handleSave} disabled={saving}>
          {saving ? '保存中...' : '保存'}
        </Button>
      </View>
    </View>
  )
}
