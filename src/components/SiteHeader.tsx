import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { profile } from '../data/profile'

const HOME_NAV = [
  { id: 'home', label: '首页' },
  { id: 'experience', label: '职业履历' },
  { id: 'projects', label: '核心项目' },
] as const

type Props = {
  activeSection?: string
  onScrollTo?: (id: string) => void
}

export function SiteHeader({ activeSection = 'home', onScrollTo }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const isAlbum = location.pathname === '/album'
  const isPrototype = location.pathname === '/prototype'
  const isSubPage = isAlbum || isPrototype

  const goHomeSection = (id: string) => {
    if (location.pathname !== '/') {
      navigate(`/#${id}`)
      return
    }
    onScrollTo?.(id)
  }

  return (
    <header className="site-header sticky top-0 z-50 border-b border-outline-variant/20 bg-[#eef1f6]/85 backdrop-blur-md">
      <div className="site-header__inner mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-6 lg:px-10">
        <Link
          to="/"
          className="site-header__brand flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            王
          </span>
          <span className="site-header__brand-name font-headline-md text-[17px] font-bold text-primary">
            {profile.nameEn}
          </span>
        </Link>

        <nav className="site-header__nav flex items-center gap-1 rounded-full bg-white px-2 py-1.5 shadow-[0_4px_20px_rgba(27,43,58,0.06)]">
          {HOME_NAV.map((item) => {
            const active = !isSubPage && activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => goHomeSection(item.id)}
                className={`rounded-full px-4 py-1.5 text-sm transition-all ${
                  active
                    ? 'bg-secondary-container/40 font-semibold text-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {item.label}
              </button>
            )
          })}
          <Link
            to="/prototype"
            className={`rounded-full px-4 py-1.5 text-sm transition-all ${
              isPrototype
                ? 'bg-secondary-container/40 font-semibold text-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            产品原型
          </Link>
          <Link
            to="/album"
            className={`rounded-full px-4 py-1.5 text-sm transition-all ${
              isAlbum
                ? 'bg-secondary-container/40 font-semibold text-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            相册
          </Link>
        </nav>

        <div className="site-header__actions flex items-center gap-1">
          <a
            href="https://chat.lulmuio.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-white hover:text-primary"
            aria-label="AI Agent"
            title="AI Agent"
          >
            <Icon name="smart_toy" />
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-white hover:text-primary"
            aria-label="邮箱"
            title={profile.email}
          >
            <Icon name="mail" />
          </a>
          <a
            href={`tel:${profile.phoneTel}`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-white hover:text-primary"
            aria-label="电话"
            title={profile.phone}
          >
            <Icon name="call" />
          </a>
        </div>
      </div>
    </header>
  )
}
