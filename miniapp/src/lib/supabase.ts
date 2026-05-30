import Taro from '@tarojs/taro'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

declare const __SUPABASE_URL__: string
declare const __SUPABASE_ANON_KEY__: string

const SUPABASE_URL = __SUPABASE_URL__
const SUPABASE_ANON_KEY = __SUPABASE_ANON_KEY__

// wx.request wrapped as a fetch-compatible function
// 小程序没有 Headers / Response / fetch，全部手动模拟
function wxFetch(url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const urlStr = typeof url === 'string' ? url : url.toString()
    const method = (options.method as any) || 'GET'

    let data: any = undefined
    if (options.body) {
      try {
        data = JSON.parse(options.body as string)
      } catch {
        data = options.body
      }
    }

    const headers: Record<string, string> = {}
    if (options.headers && typeof options.headers === 'object') {
      Object.assign(headers, options.headers)
    }

    Taro.request({
      url: urlStr,
      method,
      data,
      header: headers,
      success(res) {
        const bodyStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
        const status = res.statusCode
        const resHeaders = res.header as Record<string, string>

        // 手动构造符合 fetch Response 接口的对象
        const mockResponse = {
          ok: status >= 200 && status < 300,
          status,
          headers: {
            get: (key: string) => resHeaders[key] ?? resHeaders[key.toLowerCase()] ?? null
          },
          json: () => Promise.resolve(typeof res.data === 'string' ? JSON.parse(res.data) : res.data),
          text: () => Promise.resolve(bodyStr),
          clone: function () { return this }
        }
        resolve(mockResponse as unknown as Response)
      },
      fail(err) {
        reject(new Error(err.errMsg || 'Request failed'))
      }
    })
  })
}

let _client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        fetch: wxFetch as typeof fetch
      },
      auth: {
        storage: {
          getItem: (key: string) => {
            try {
              return Taro.getStorageSync(key) || null
            } catch {
              return null
            }
          },
          setItem: (key: string, value: string) => {
            try {
              Taro.setStorageSync(key, value)
            } catch {}
          },
          removeItem: (key: string) => {
            try {
              Taro.removeStorageSync(key)
            } catch {}
          }
        },
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })

    // 强制禁用 realtime，避免 WebSocket 初始化
    // @ts-ignore
    _client.realtime = {
      channel: () => ({ subscribe: () => {}, unsubscribe: () => {} }),
      removeAllChannels: () => {},
      disconnect: () => {}
    }
  }
  return _client
}

export { SUPABASE_URL, SUPABASE_ANON_KEY }
