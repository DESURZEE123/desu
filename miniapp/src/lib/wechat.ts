import Taro from '@tarojs/taro'
import { getSupabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

function wxLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    Taro.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code)
        } else {
          reject(new Error('wx.login failed: no code returned'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || 'wx.login failed'))
      }
    })
  })
}

export async function wechatLogin(): Promise<Session> {
  const code = await wxLogin()

  const response = await new Promise<any>((resolve, reject) => {
    Taro.request({
      url: `${SUPABASE_URL}/functions/v1/wechat-auth`,
      method: 'POST',
      data: { code },
      header: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(`Auth failed: ${JSON.stringify(res.data)}`))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || 'Auth request failed'))
      }
    })
  })

  const supabase = getSupabaseClient()
  const { data, error } = await supabase.auth.setSession({
    access_token: response.access_token,
    refresh_token: response.refresh_token
  })

  if (error) throw error
  if (!data.session) throw new Error('No session returned')

  return data.session
}
