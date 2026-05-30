import Taro from '@tarojs/taro'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.TARO_APP_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.TARO_APP_SUPABASE_ANON_KEY || ''

// wx.request wrapped as a fetch-compatible function
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
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value
        })
      } else {
        Object.assign(headers, options.headers)
      }
    }

    Taro.request({
      url: urlStr,
      method,
      data,
      header: headers,
      success(res) {
        const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data)
        resolve(
          new Response(body, {
            status: res.statusCode,
            headers: res.header as Record<string, string>
          })
        )
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
  }
  return _client
}

export { SUPABASE_URL, SUPABASE_ANON_KEY }
