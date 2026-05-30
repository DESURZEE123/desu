import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { User } from '@supabase/supabase-js'
import { getSupabaseClient } from '@/lib/supabase'

const AUTO_EMAIL = 'zhaoping@qq.com'
const AUTO_PASSWORD = '123456'

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async () => {
    set({ isLoading: true })
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.auth.signInWithPassword({
        email: AUTO_EMAIL,
        password: AUTO_PASSWORD
      })
      if (error) throw error
      set({ user: data.user, isAuthenticated: true, isLoading: false })
    } catch (err) {
      console.error('login error:', err)
      set({ isLoading: false })
      throw err
    }
  },

  logout: async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    set({ user: null, isAuthenticated: false })
    Taro.redirectTo({ url: '/pages/login/index' })
  },

  restoreSession: async () => {
    set({ isLoading: true })
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        set({ user: data.session.user, isAuthenticated: true, isLoading: false })
      } else {
        // 没有 session 就自动登录
        await useAuthStore.getState().login()
      }
    } catch {
      set({ isLoading: false })
    }
  }
}))
