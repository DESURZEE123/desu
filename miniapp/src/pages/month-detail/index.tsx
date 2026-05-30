import { useEffect, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/store/authStore'
import { useRecordsStore } from '@/store/recordsStore'
import { getDayGroups, getGrandTotal } from '@/lib/aggregate'
import { formatMoney, monthLabel } from '@/lib/format'
import AppHeader from '@/components/AppHeader'
import DayGroup from '@/components/DayGroup'
import './index.scss'

export default function MonthDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { records, isLoading, fetchAll } = useRecordsStore()

  const params = Taro.getCurrentInstance().router?.params ?? {}
  const ym = params.ym as string

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      Taro.redirectTo({ url: '/pages/login/index' })
      return
    }
    if (isAuthenticated && records.length === 0) {
      fetchAll()
    }
  }, [isAuthenticated, authLoading])

  const monthRecords = useMemo(
    () => records.filter((r) => r.workDate.startsWith(ym)),
    [records, ym]
  )

  const dayGroups = useMemo(() => getDayGroups(monthRecords), [monthRecords])
  const total = useMemo(() => getGrandTotal(monthRecords), [monthRecords])

  function handleAdd() {
    Taro.navigateTo({ url: '/pages/record-new/index' })
  }

  function handleEdit(id: string) {
    Taro.navigateTo({ url: `/pages/record-edit/index?id=${id}` })
  }

  return (
    <View className='month-detail-page'>
      <AppHeader title={ym ? monthLabel(ym) : '月度明细'} showBack onAdd={handleAdd} />

      <View className='month-detail-total'>
        <Text className='month-detail-total-label'>本月收入</Text>
        <Text className='month-detail-total-amount'>{formatMoney(total)}</Text>
      </View>

      {isLoading ? (
        <View className='month-detail-loading'><Text>加载中...</Text></View>
      ) : dayGroups.length === 0 ? (
        <View className='month-detail-empty'>
          <Text className='month-detail-empty-text'>本月暂无记录</Text>
        </View>
      ) : (
        <View className='month-detail-list'>
          {dayGroups.map((group) => (
            <DayGroup key={group.date} group={group} onEdit={handleEdit} />
          ))}
        </View>
      )}
    </View>
  )
}
