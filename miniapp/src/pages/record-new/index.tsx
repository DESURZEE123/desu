import { useEffect } from 'react'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/store/authStore'
import { useRecordsStore } from '@/store/recordsStore'
import { todayISODate } from '@/lib/format'
import AppHeader from '@/components/AppHeader'
import RecordForm from '@/components/RecordForm'
import type { WorkRecordInput } from '@/lib/types'
import './index.scss'

export default function RecordNewPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { create } = useRecordsStore()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }, [isAuthenticated, authLoading])

  async function handleSave(input: WorkRecordInput) {
    await create(input)
    Taro.showToast({ title: '保存成功', icon: 'success', duration: 1500 })
    setTimeout(() => Taro.navigateBack(), 1500)
  }

  return (
    <View className='record-new-page'>
      <AppHeader title='新增记录' showBack />
      <RecordForm
        initialValues={{ workDate: todayISODate(), styleName: '', quantity: 0, unitPrice: 0, note: '' }}
        onSave={handleSave}
      />
    </View>
  )
}
