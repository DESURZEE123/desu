import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { useAuthStore } from '@/store/authStore'
import './app.scss'

function App({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((s) => s.restoreSession)

  useEffect(() => {
    restoreSession()
  }, [])

  return <>{children}</>
}

export default App
