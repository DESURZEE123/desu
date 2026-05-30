import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface AppHeaderProps {
  title: string
  showBack?: boolean
  onAdd?: () => void
  onLogout?: () => void
  onDelete?: () => void
}

export default function AppHeader({ title, showBack, onAdd, onLogout, onDelete }: AppHeaderProps) {
  const statusBarHeight = Taro.getSystemInfoSync().statusBarHeight ?? 20

  return (
    <View className='app-header' style={{ paddingTop: `${statusBarHeight}px` }}>
      <View className='app-header-inner'>
        <View className='app-header-left'>
          {showBack && (
            <View className='app-header-btn' onClick={() => Taro.navigateBack()}>
              <Text className='app-header-btn-text'>‹</Text>
            </View>
          )}
        </View>

        <Text className='app-header-title'>{title}</Text>

        <View className='app-header-right'>
          {onDelete && (
            <View className='app-header-btn app-header-btn--danger' onClick={onDelete}>
              <Text className='app-header-btn-text'>删除</Text>
            </View>
          )}
          {onAdd && (
            <View className='app-header-btn' onClick={onAdd}>
              <Text className='app-header-btn-text app-header-btn-text--large'>+</Text>
            </View>
          )}
          {onLogout && (
            <View className='app-header-btn' onClick={onLogout}>
              <Text className='app-header-btn-text app-header-btn-text--small'>退出</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
