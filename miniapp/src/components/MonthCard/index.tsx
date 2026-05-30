import { View, Text } from '@tarojs/components'
import { formatMoney } from '@/lib/format'
import type { MonthSummary } from '@/lib/types'
import './index.scss'

interface MonthCardProps {
  month: MonthSummary
  onTap: () => void
}

export default function MonthCard({ month, onTap }: MonthCardProps) {
  return (
    <View className='month-card' onClick={onTap}>
      <View className='month-card-left'>
        <Text className='month-card-label'>{month.label}</Text>
        <Text className='month-card-quantity'>{month.quantity} 件</Text>
      </View>
      <View className='month-card-right'>
        <Text className='month-card-total'>{formatMoney(month.total)}</Text>
        <Text className='month-card-arrow'>›</Text>
      </View>
    </View>
  )
}
