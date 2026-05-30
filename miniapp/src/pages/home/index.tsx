import { useEffect, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/store/authStore'
import { useRecordsStore } from '@/store/recordsStore'
import { getGrandTotal, getMonthSummaries } from '@/lib/aggregate'
import { formatMoney } from '@/lib/format'
import AppHeader from '@/components/AppHeader'
import MonthCard from '@/components/MonthCard'
import './index.scss'

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAuthStore()
  const { records, isLoading, fetchAll } = useRecordsStore()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }, [isAuthenticated, authLoading])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAll()
    }
  }, [isAuthenticated])

  const grandTotal = useMemo(() => getGrandTotal(records), [records])
  const months = useMemo(() => getMonthSummaries(records), [records])

  function handleAdd() {
    Taro.navigateTo({ url: '/pages/record-new/index' })
  }

  function handleMonthTap(ym: string) {
    Taro.navigateTo({ url: `/pages/month-detail/index?ym=${ym}` })
  }

  if (authLoading) {
    return (
      <View className='home-page'>
        <View className='home-loading'><Text>加载中...</Text></View>
      </View>
    )
  }

  return (
    <View className='home-page'>
      <AppHeader title='工作记录' onAdd={handleAdd} onLogout={logout} />

      <View className='home-total-card'>
        <Text className='home-total-label'>累计收入</Text>
        <Text className='home-total-amount'>{formatMoney(grandTotal)}</Text>
      </View>

      {isLoading ? (
        <View className='home-loading'><Text>加载中...</Text></View>
      ) : months.length === 0 ? (
        <View className='home-empty'>
          <Text className='home-empty-text'>暂无记录</Text>
          <Text className='home-empty-hint'>点击右上角 + 添加第一条记录</Text>
        </View>
      ) : (
        <View className='home-month-list'>
          {months.map((month) => (
            <MonthCard key={month.ym} month={month} onTap={() => handleMonthTap(month.ym)} />
          ))}
        </View>
      )}
    </View>
  )
}
