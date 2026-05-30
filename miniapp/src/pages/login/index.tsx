import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/store/authStore'
import './index.scss'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      Taro.redirectTo({ url: '/pages/home/index' })
    } else if (!isLoading) {
      // 自动登录
      login().then(() => {
        Taro.redirectTo({ url: '/pages/home/index' })
      }).catch((err) => {
        Taro.showToast({ title: '登录失败，请重试', icon: 'error', duration: 2000 })
      })
    }
  }, [isAuthenticated, isLoading])

  return (
    <View className='login-page'>
      <View className='login-card'>
        <View className='login-icon'>📋</View>
        <Text className='login-title'>工作记录</Text>
        <Text className='login-subtitle'>自动登录中...</Text>
      </View>
    </View>
  )
}
