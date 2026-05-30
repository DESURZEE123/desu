import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { formatMoney } from '@/lib/format'
import { useRecordsStore } from '@/store/recordsStore'
import type { DayGroup as DayGroupType } from '@/lib/types'
import './index.scss'

interface DayGroupProps {
  group: DayGroupType
  onEdit: (id: string) => void
}

export default function DayGroup({ group, onEdit }: DayGroupProps) {
  const { remove } = useRecordsStore()

  function handleDelete(id: string) {
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      confirmText: '删除',
      confirmColor: '#ba1a1a',
      success: async (res) => {
        if (res.confirm) {
          await remove(id)
          Taro.showToast({ title: '已删除', icon: 'success', duration: 1500 })
        }
      }
    })
  }

  return (
    <View className='day-group'>
      <View className='day-group-header'>
        <Text className='day-group-day'>{group.day} 日</Text>
        <Text className='day-group-total'>{formatMoney(group.total)}</Text>
      </View>
      <View className='day-group-records'>
        {group.records.map((record) => (
          <View key={record.id} className='record-item'>
            <View className='record-item-main'>
              <Text className='record-item-style'>{record.styleName}</Text>
              <Text className='record-item-detail'>
                {record.quantity} 件 × {formatMoney(record.unitPrice)}
              </Text>
              {record.note ? (
                <Text className='record-item-note'>{record.note}</Text>
              ) : null}
            </View>
            <View className='record-item-right'>
              <Text className='record-item-subtotal'>
                {formatMoney(record.quantity * record.unitPrice)}
              </Text>
              <View className='record-item-actions'>
                <View className='record-item-btn' onClick={() => onEdit(record.id)}>
                  <Text className='record-item-btn-text'>编辑</Text>
                </View>
                <View
                  className='record-item-btn record-item-btn--danger'
                  onClick={() => handleDelete(record.id)}
                >
                  <Text className='record-item-btn-text record-item-btn-text--danger'>删除</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}
