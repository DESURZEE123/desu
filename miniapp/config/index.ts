import { defineConfig } from '@tarojs/cli'
import path from 'path'
import fs from 'fs'

// Load .env file manually — no process.env in mini-program runtime
function loadEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return {}
  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf-8')
      .split('\n')
      .filter((l) => l.trim() && !l.startsWith('#'))
      .map((l) => l.split('=').map((s) => s.trim()) as [string, string])
  )
}

const env = loadEnv()

export default defineConfig({
  projectName: 'desu-miniapp',
  date: '2026-05-30',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: ['@tarojs/plugin-platform-weapp'],
  alias: {
    '@': path.resolve(__dirname, '..', 'src')
  },
  defineConstants: {
    __SUPABASE_URL__: JSON.stringify(env.SUPABASE_URL || ''),
    __SUPABASE_ANON_KEY__: JSON.stringify(env.SUPABASE_ANON_KEY || '')
  },
  copy: {
    patterns: [],
    options: {}
  },
  framework: 'react',
  compiler: 'webpack5',
  cache: {
    enable: false
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {}
      },
      url: {
        enable: true,
        config: {
          limit: 1024
        }
      },
      cssModules: {
        enable: false
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      autoprefixer: {
        enable: true,
        config: {}
      },
      cssModules: {
        enable: false
      }
    }
  }
})
