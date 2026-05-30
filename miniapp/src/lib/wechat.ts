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
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
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

  // setSession 内部会再发一次网络请求验证 token，在小程序里可能失败
  // 直接用 Taro.request 拿到的 token 手动设置 storage，然后让 supabase 从 storage 读取
  const supabase = getSupabaseClient()

  // 先把 token 存到 storage，再调用 setSession
  const sessionData = {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    expires_at: response.expires_at,
    token_type: 'bearer',
    user: response.user
  }

  // 直接写入 supabase 的 storage key
  Taro.setStorageSync('sb-xgzrznwwhhrqvbhdrfet-auth-token', JSON.stringify(sessionData))

  const { data, error } = await supabase.auth.setSession({
    access_token: response.access_token,
    refresh_token: response.refresh_token
  })

  if (error) {
    console.error('setSession error:', error)
    throw error
  }
  if (!data.session) throw new Error('No session returned')

  return data.session
}
