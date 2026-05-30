import { useEffect, useState } from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/store/authStore'
import './index.scss'

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuthStore()
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      Taro.redirectTo({ url: '/pages/home/index' })
    }
  }, [isAuthenticated])

  async function handleLogin() {
    setLogging(true)
    try {
      await login()
      Taro.redirectTo({ url: '/pages/home/index' })
    } catch (err) {
      Taro.showToast({ title: '登录失败，请重试', icon: 'error', duration: 2000 })
    } finally {
      setLogging(false)
    }
  }

  if (isLoading) {
    return (
      <View className='login-page'>
        <View className='login-loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='login-page'>
      <View className='login-card'>
        <View className='login-icon'>📋</View>
        <Text className='login-title'>工作记录</Text>
        <Text className='login-subtitle'>记录每日工作，追踪收入明细</Text>
        <Button
          className='login-btn'
          openType='getPhoneNumber'
          onClick={handleLogin}
          disabled={logging}
        >
          {logging ? '登录中...' : '微信一键登录'}
        </Button>
      </View>
    </View>
  )
}
