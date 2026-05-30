import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/store/authStore'
import { useRecordsStore } from '@/store/recordsStore'
import AppHeader from '@/components/AppHeader'
import RecordForm from '@/components/RecordForm'
import type { WorkRecord, WorkRecordInput } from '@/lib/types'
import './index.scss'

export default function RecordEditPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { getById, update, remove } = useRecordsStore()
  const [record, setRecord] = useState<WorkRecord | null>(null)
  const [loading, setLoading] = useState(true)

  const params = Taro.getCurrentInstance().router?.params ?? {}
  const id = params.id as string

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      Taro.redirectTo({ url: '/pages/login/index' })
      return
    }
    if (isAuthenticated && id) {
      getById(id).then((r) => {
        setRecord(r)
        setLoading(false)
      })
    }
  }, [isAuthenticated, authLoading, id])

  async function handleSave(input: WorkRecordInput) {
    await update(id, input)
    Taro.showToast({ title: '保存成功', icon: 'success', duration: 1500 })
    setTimeout(() => Taro.navigateBack(), 1500)
  }

  function handleDelete() {
    Taro.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      confirmText: '删除',
      confirmColor: '#ba1a1a',
      success: async (res) => {
        if (res.confirm) {
          await remove(id)
          Taro.showToast({ title: '已删除', icon: 'success', duration: 1500 })
          setTimeout(() => Taro.navigateBack(), 1500)
        }
      }
    })
  }

  if (loading) {
    return (
      <View className='record-edit-page'>
        <AppHeader title='编辑记录' showBack />
        <View className='record-edit-loading'><Text>加载中...</Text></View>
      </View>
    )
  }

  if (!record) {
    return (
      <View className='record-edit-page'>
        <AppHeader title='编辑记录' showBack />
        <View className='record-edit-loading'><Text>记录不存在</Text></View>
      </View>
    )
  }

  return (
    <View className='record-edit-page'>
      <AppHeader title='编辑记录' showBack onDelete={handleDelete} />
      <RecordForm
        initialValues={{
          workDate: record.workDate,
          styleName: record.styleName,
          quantity: record.quantity,
          unitPrice: record.unitPrice,
          note: record.note
        }}
        onSave={handleSave}
      />
    </View>
  )
}
