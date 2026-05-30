// Polyfill Headers for @supabase/supabase-js (小程序没有 Headers 类)
if (typeof Headers === 'undefined') {
  (globalThis as any).Headers = class Headers {
    private headers: Record<string, string> = {}
    constructor(init?: Record<string, string>) {
      if (init) Object.assign(this.headers, init)
    }
    get(key: string) {
      return this.headers[key] ?? this.headers[key.toLowerCase()] ?? null
    }
    set(key: string, value: string) {
      this.headers[key] = value
    }
    append(key: string, value: string) {
      this.headers[key] = value
    }
    delete(key: string) {
      delete this.headers[key]
    }
    has(key: string) {
      return key in this.headers || key.toLowerCase() in this.headers
    }
    forEach(callback: (value: string, key: string) => void) {
      Object.entries(this.headers).forEach(([k, v]) => callback(v, k))
    }
  }
}

// Polyfill WebSocket (小程序不需要 realtime，提供空实现避免报错)
if (typeof WebSocket === 'undefined') {
  (globalThis as any).WebSocket = class WebSocket {
    constructor() {
      throw new Error('WebSocket not supported in mini-program')
    }
  }
}

// Polyfill URL (小程序没有 URL 类)
if (typeof URL === 'undefined') {
  (globalThis as any).URL = class URL {
    href: string
    origin: string
    protocol: string
    host: string
    hostname: string
    port: string
    pathname: string
    search: string
    hash: string

    constructor(url: string, base?: string) {
      console.log('URL constructor called:', { url, base })

      if (base) {
        // 简单拼接
        if (url.startsWith('/')) {
          const baseUrl = new (globalThis as any).URL(base)
          url = baseUrl.origin + url
        } else if (!url.match(/^https?:\/\//)) {
          url = base.replace(/\/$/, '') + '/' + url
        }
      }

      if (!url || !url.match(/^https?:\/\//)) {
        console.error('Invalid URL:', url)
        throw new TypeError('Invalid URL')
      }

      this.href = url
      const match = url.match(/^(https?:)\/\/([^/:?#]+)(:\d+)?([^?#]*)(\?[^#]*)?(#.*)?$/)
      if (!match) {
        console.error('URL parse failed:', url)
        throw new TypeError('Invalid URL')
      }

      this.protocol = match[1]
      this.hostname = match[2]
      this.port = match[3] ? match[3].slice(1) : ''
      this.host = this.hostname + (this.port ? ':' + this.port : '')
      this.origin = this.protocol + '//' + this.host
      this.pathname = match[4] || '/'
      this.search = match[5] || ''
      this.hash = match[6] || ''
    }

    toString() {
      return this.href
    }
  }
}

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
