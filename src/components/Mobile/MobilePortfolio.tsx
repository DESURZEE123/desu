import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AiAgentLink } from '../AiAgentLink'
import { Icon } from '../Icon'
import { lifePreviewPhotos } from '../../data/album'
import {
  education,
  experiences,
  profile,
  projects,
  skills,
} from '../../data/profile'
import { prototypes } from '../../data/prototypes'

const BOTTOM_NAV: { id: string; icon: string; label: string }[] = [
  { id: 'home', icon: 'home', label: '首页' },
  { id: 'skills', icon: 'bolt', label: '技能' },
  { id: 'projects', icon: 'description', label: '项目' },
  { id: 'life', icon: 'camera', label: '生活' },
  { id: 'contact', icon: 'mail', label: '联系' },
]

const COVER_IMG = '/photo.jpg'

export function MobilePortfolio() {
  const [activeNav, setActiveNav] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    setActiveNav(id)
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (!el) return
    window.scrollTo({ top: el.offsetTop - 64, behavior: 'smooth' })
  }

  return (
    <div className="min-h-[max(884px,100dvh)] overflow-x-hidden bg-[#eef1f6] font-body-md text-on-background">
      {/* Top bar */}
      <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between bg-white/95 px-4 shadow-[0_1px_0_rgba(27,43,58,0.06)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => scrollTo('home')}
          className="flex items-center gap-2"
          aria-label="回到首页"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
            王
          </span>
          <span className="font-headline-md text-[16px] font-bold text-primary">
            {profile.nameEn}
          </span>
        </button>

        <div className="flex items-center gap-0.5">
          <a
            href="https://chat.lulmuio.cn/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container-low"
            aria-label="AI Agent"
          >
            <Icon name="smart_toy" />
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container-low"
            aria-label="邮箱"
          >
            <Icon name="mail" />
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant active:bg-surface-container-low"
            aria-label="打开菜单"
          >
            <Icon name="apps" />
          </button>
        </div>
      </header>

      {/* Side drawer */}
      <div
        className={`fixed inset-0 z-[60] ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          className={`absolute right-0 top-0 flex h-full w-[82%] max-w-[340px] flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Profile header */}
          <div className="relative shrink-0">
            <div className="h-28 overflow-hidden">
              <img src={COVER_IMG} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 h-28 bg-gradient-to-t from-primary/50 to-transparent" />
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white"
              aria-label="关闭菜单"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
            <div className="relative -mt-10 px-5 pb-4">
              <div className="mb-3 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-primary text-3xl font-bold text-white shadow-md">
                  王
                </div>
              </div>
              <div className="mb-3 text-center">
                <p className="text-lg font-bold text-primary">{profile.name}</p>
                <p className="mt-0.5 text-sm text-on-surface-variant">{profile.roleLine}</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-xs text-outline">
                  <Icon name="location_on" className="text-[14px]" />
                  {profile.location}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-5 px-5 pb-8">
            {/* Intro */}
            <section>
              {/* <h3 className="mb-2 text-xs font-semibold tracking-wide text-outline">个人介绍</h3> */}
              <p className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-3 text-sm leading-relaxed text-on-surface-variant">
                {profile.intro}
              </p>
              {/* <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Icon name="person_pin" className="text-[16px] text-secondary" />
                  {profile.roleLine}
                </div>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Icon name="cake" className="text-[16px] text-secondary" />
                  {profile.birth}
                </div>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <Icon name="school" className="text-[16px] text-secondary" />
                  {profile.major}
                </div>
              </div> */}
            </section>

            {/* Pages */}
            <section>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-outline">页面</h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/prototype"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-outline-variant/50 bg-white px-3 py-3.5 text-center text-sm font-medium text-on-surface transition-colors active:bg-surface-container-low"
                >
                  产品原型
                </Link>
                <Link
                  to="/album"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl border border-outline-variant/50 bg-white px-3 py-3.5 text-center text-sm font-medium text-on-surface transition-colors active:bg-surface-container-low"
                >
                  相册
                </Link>
              </div>
            </section>

            <AiAgentLink variant="banner" />
          </div>
        </aside>
      </div>

      <main className="pb-24 pt-14">
        <section
          id="home"
          className="relative flex flex-col gap-6 overflow-hidden px-margin-mobile py-8"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-secondary-container/20 blur-3xl" />
          <div className="z-10 mt-4">
            <span className="mb-2 inline-block rounded-sm bg-primary-container px-3 py-1 font-label-md text-[12px] text-white">
              Product Manager Portfolio
            </span>
            <h2 className="mb-2 font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {profile.greeting || `你好，我是${profile.name}`}
            </h2>
            <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
              一名做 ToB SaaS 的产品经理。
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-primary-container bg-primary text-2xl font-bold text-white">
              王
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-[18px] text-on-surface">{profile.name}</span>
              <span className="font-body-md text-body-md font-semibold text-secondary">
                {profile.roleLine}
              </span>
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex flex-wrap gap-2">
                  <span className="flex items-center gap-1 text-[12px] text-outline">
                    <Icon name="calendar_today" className="text-[14px]" />
                    {profile.birth}
                  </span>
                  <span className="flex items-center gap-1 text-[12px] text-outline">
                    <Icon name="location_on" className="text-[14px]" />
                    {profile.location}
                  </span>
                </div>
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-1 text-[12px] text-outline"
                >
                  <Icon name="mail" className="text-[14px]" />
                  {profile.email}
                </a>
                <a
                  href={`tel:${profile.phoneTel}`}
                  className="flex items-center gap-1 text-[12px] text-outline"
                >
                  <Icon name="call" className="text-[14px]" />
                  {profile.phone}
                </a>
              </div>
            </div>
          </div>
          <AiAgentLink variant="banner" />
        </section>

        <section id="skills" className="px-margin-mobile py-6">
          <h3 className="mb-4 flex items-center gap-2 font-headline-md text-[20px] text-on-surface">
            <Icon name="bolt" className="text-primary" /> 核心竞争力
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {skills.map((skill, index) => (
              <div
                key={skill.title}
                className={`flex flex-col gap-2 rounded-xl border border-outline-variant/30 p-4 ${
                  index === 0
                    ? 'col-span-2 bg-surface-container-highest'
                    : index === 3
                      ? 'col-span-2 flex-row items-center justify-between bg-surface-container'
                      : 'bg-white'
                }`}
              >
                {index === 3 ? (
                  <>
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface">{skill.title}</span>
                      <p className="text-body-sm text-on-surface-variant">{skill.desc}</p>
                    </div>
                    <Icon name={skill.icon} className="shrink-0 text-4xl text-outline" />
                  </>
                ) : (
                  <>
                    <Icon
                      name={skill.icon}
                      className={index === 0 ? 'text-3xl text-primary' : 'text-secondary'}
                    />
                    <span className="font-bold text-on-surface">
                      {index === 0 ? `${skill.title} (B端SaaS)` : skill.title}
                    </span>
                    <p className="text-body-sm text-on-surface-variant">{skill.desc}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section id="experience" className="px-margin-mobile py-6">
          <h3 className="mb-4 flex items-center gap-2 font-headline-md text-[20px] text-on-surface">
            <Icon name="work" className="text-primary" /> 职业履历
          </h3>
          <div className="relative flex flex-col gap-6 before:absolute before:bottom-4 before:left-[11px] before:top-4 before:w-[2px] before:bg-outline-variant/30 before:content-['']">
            {experiences.map((exp) => (
              <div key={exp.company} className="relative flex gap-4">
                <div
                  className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    exp.current
                      ? 'bg-primary shadow-lg shadow-primary/20'
                      : 'bg-outline-variant'
                  }`}
                >
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                <div className="flex flex-col pb-4">
                  <span
                    className={`text-[12px] font-bold ${
                      exp.current ? 'text-primary' : 'text-outline'
                    }`}
                  >
                    {exp.period}
                  </span>
                  <span className="text-body-lg font-bold text-on-surface">{exp.company}</span>
                  <span className="text-body-md text-on-surface-variant">{exp.title}</span>
                  <p className="mt-2 text-body-sm leading-relaxed text-outline">
                    {exp.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="prototypes" className="px-margin-mobile py-6">
          <div className="mb-4 flex items-end justify-between">
            <h3 className="flex items-center gap-2 font-headline-md text-[20px] text-on-surface">
              <Icon name="draw" className="text-primary" /> 产品原型
            </h3>
            <Link to="/prototype" className="text-[12px] font-medium text-primary">
              查看全部 →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {prototypes.map((item) => (
              <Link
                key={item.id}
                to="/prototype"
                className="flex items-stretch gap-3 rounded-xl border border-outline-variant/20 bg-white p-3"
              >
                <div className="h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-surface-container">
                  <img
                    src={item.cover}
                    alt={item.title}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
                  <h4 className="text-body-md font-bold leading-tight text-on-surface">
                    {item.title}
                  </h4>
                  <p className="line-clamp-2 text-[12px] leading-relaxed text-on-surface-variant">
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="projects" className="bg-white/60 px-margin-mobile py-6">
          <h3 className="mb-4 flex items-center gap-2 font-headline-md text-[20px] text-on-surface">
            <Icon name="assignment" className="text-primary" /> 核心项目
          </h3>
          <div className="flex flex-col gap-6">
            {projects.map((project) => (
              <div
                key={project.title}
                className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm"
              >
                <div className={`flex h-32 items-center justify-center ${project.iconBg}`}>
                  <Icon name={project.icon} className={`text-5xl ${project.iconColor}`} />
                </div>
                <div className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4 className="text-body-lg font-bold leading-tight text-on-surface">
                      {project.title}
                    </h4>
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${project.badgeClass}`}
                    >
                      {project.badgeMobile}
                    </span>
                  </div>
                  <p className="mb-3 text-body-sm text-on-surface-variant">{project.summary}</p>
                  <ul className="flex list-disc flex-col gap-1 pl-4 text-body-sm text-on-surface-variant">
                    {project.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-surface-container px-2 py-1 text-[12px] text-on-surface-variant"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="life" className="px-margin-mobile py-6">
          <div className="mb-4 flex items-end justify-between">
            <h3 className="flex items-center gap-2 font-headline-md text-[20px] text-on-surface">
              <Icon name="favorite" className="text-primary" /> 生活瞬间
            </h3>
            <Link to="/album" className="text-[12px] font-medium text-primary">
              查看相册 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {lifePreviewPhotos.map((photo) => (
              <Link
                key={photo.id}
                to="/album"
                className="block overflow-hidden rounded-xl border border-outline-variant/20 bg-white"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="h-full w-full object-cover"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="education" className="px-margin-mobile py-6">
          <div className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-container/10">
                <Icon name="school" className="text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-on-surface">{education.school}</span>
                <span className="text-[12px] text-on-surface-variant">
                  {education.major} · {education.period}
                </span>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {education.certificates.map((cert) => (
                <span
                  key={cert}
                  className="rounded-sm border border-primary/10 bg-primary/5 px-3 py-1 text-[12px] font-bold text-primary"
                >
                  {cert}
                </span>
              ))}
            </div>
            <hr className="mb-4 border-outline-variant/30" />
            <p className="font-body-md text-[14px] italic leading-relaxed text-on-surface-variant">
              &quot;{profile.quote}&quot;
            </p>
          </div>
        </section>

        <footer
          id="contact"
          className="flex flex-col gap-6 border-t border-outline-variant/30 bg-white px-margin-mobile py-8"
        >
          <div className="flex flex-col gap-2">
            <h3 className="font-headline-md text-[20px] text-on-surface">保持联系</h3>
            <p className="text-body-md text-on-surface-variant">
              如果你对我的经历感兴趣，或者有合作机会，欢迎随时沟通。
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3"
              href={`mailto:${profile.email}`}
            >
              <Icon name="mail" className="rounded-lg bg-primary-container/10 p-2 text-primary" />
              <span className="font-medium text-on-surface-variant">{profile.email}</span>
            </a>
            <a
              className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-3"
              href={`tel:${profile.phoneTel}`}
            >
              <Icon name="call" className="rounded-lg bg-primary-container/10 p-2 text-primary" />
              <span className="font-medium text-on-surface-variant">{profile.phone}</span>
            </a>
          </div>
          <div className="mt-4">
            <span className="text-[12px] text-outline">
              © 2026 {profile.name}. Built with Product Thinking & Professional Excellence.
            </span>
          </div>
        </footer>
      </main>

      <nav className="pb-safe fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-outline-variant/30 bg-white px-2 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {BOTTOM_NAV.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault()
              scrollTo(item.id)
            }}
            className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
              activeNav === item.id ? 'text-primary' : 'text-outline-variant'
            }`}
          >
            <Icon name={item.icon} fill={activeNav === item.id && item.id === 'home'} />
            <span className="font-label-md text-[12px]">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  )
}
