import { useState } from 'react'
import { AiAgentLink } from '../AiAgentLink'
import { Icon } from '../Icon'
import {
  education,
  experiences,
  profile,
  projects,
  skills,
} from '../../data/profile'

const BOTTOM_NAV: { id: string; icon: string; label: string }[] = [
  { id: 'home', icon: 'home', label: '首页' },
  { id: 'skills', icon: 'bolt', label: '技能' },
  { id: 'projects', icon: 'description', label: '项目' },
  { id: 'life', icon: 'camera', label: '生活' },
  { id: 'contact', icon: 'mail', label: '联系' },
]

export function MobilePortfolio() {
  const [hobbyTab, setHobbyTab] = useState<'photography' | 'sports'>('photography')
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
    <div className="min-h-[max(884px,100dvh)] overflow-x-hidden bg-background font-body-md text-on-background">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant/30 bg-surface/90 px-margin-mobile backdrop-blur-md">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-primary-container/10 active:scale-95"
          aria-label="菜单"
        >
          <Icon name="menu" className="text-primary" />
        </button>
        <h1 className="font-headline-md text-[20px] font-bold tracking-tight text-primary">
          WANG YIYANG
        </h1>
        <a
          href="https://chat.lulmuio.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[12px] font-semibold text-white transition-all active:scale-95"
          aria-label="AI Agent，新窗口打开"
        >
          <Icon name="smart_toy" className="text-[18px]" />
          AI Agent
        </a>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 pt-16" onClick={() => setMenuOpen(false)}>
          <div
            className="mx-margin-mobile mt-2 rounded-xl border border-outline-variant/30 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { id: 'home', label: '首页' },
              { id: 'skills', label: '核心竞争力' },
              { id: 'experience', label: '职业履历' },
              { id: 'projects', label: '核心项目' },
              { id: 'prototypes', label: '产品原型' },
              { id: 'life', label: '生活瞬间' },
              { id: 'education', label: '教育背景' },
              { id: 'contact', label: '联系方式' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className="block w-full rounded-lg px-3 py-3 text-left font-medium text-on-surface hover:bg-surface-container-low"
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </button>
            ))}
            <div className="mt-2 border-t border-outline-variant/30 pt-3">
              <AiAgentLink variant="banner" />
            </div>
          </div>
        </div>
      )}

      <main className="pb-24 pt-16">
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
              {profile.greeting}
            </h2>
            <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
              我是{profile.name}，一名做 ToB SaaS 的产品经理。
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-primary-container bg-primary text-2xl font-bold text-white">
              王
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-[18px] text-on-surface">{profile.name}</span>
              <span className="font-body-md text-body-md font-semibold text-secondary">
                {profile.roleLine}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="flex items-center gap-1 text-[12px] text-outline">
                  <Icon name="calendar_today" className="text-[14px]" />
                  {profile.birth}
                </span>
                <span className="flex items-center gap-1 text-[12px] text-outline">
                  <Icon name="location_on" className="text-[14px]" />
                  {profile.location}
                </span>
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
                      : 'bg-surface-container-low'
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
                      className={
                        index === 0 ? 'text-3xl text-primary' : 'text-secondary'
                      }
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
                  <span className="text-body-lg font-bold text-on-surface">
                    {exp.companyShort}
                  </span>
                  <span className="text-body-md text-on-surface-variant">{exp.title}</span>
                  <p className="mt-2 text-body-sm leading-relaxed text-outline">
                    {exp.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" className="bg-surface-container-low px-margin-mobile py-6">
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

        <section id="prototypes" className="px-margin-mobile py-6">
          <div className="mb-4 flex items-end justify-between">
            <h3 className="flex items-center gap-2 font-headline-md text-[20px] text-on-surface">
              <Icon name="draw" className="text-primary" /> 产品原型
            </h3>
            <span className="text-[12px] text-outline">* 已脱敏处理</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['线索流转', '后台看板', '工作流', '表单留资', '用户画像', 'AI Agent'].map(
              (label) => (
                <div
                  key={label}
                  className="flex aspect-square items-center justify-center rounded-lg border border-outline-variant/20 bg-surface-container-highest"
                >
                  <span className="px-1 text-center text-[12px] text-on-surface-variant">
                    {label}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>

        <section id="life" className="px-margin-mobile py-6">
          <h3 className="mb-4 flex items-center gap-2 font-headline-md text-[20px] text-on-surface">
            <Icon name="favorite" className="text-primary" /> 生活瞬间
          </h3>
          <div className="mb-4 flex gap-6 border-b border-outline-variant/30">
            <button
              type="button"
              className={`pb-2 font-bold ${
                hobbyTab === 'photography' ? 'active-tab' : 'text-on-surface-variant'
              }`}
              onClick={() => setHobbyTab('photography')}
            >
              摄影 Photography
            </button>
            <button
              type="button"
              className={`pb-2 font-bold ${
                hobbyTab === 'sports' ? 'active-tab' : 'text-on-surface-variant'
              }`}
              onClick={() => setHobbyTab('sports')}
            >
              运动 Sports
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(hobbyTab === 'photography' ? ['街拍', '日落'] : ['篮球', '跑步']).map((label) => (
              <div
                key={label}
                className="flex h-48 items-center justify-center rounded-xl border border-outline-variant/20 bg-surface-container-highest"
              >
                <span className="text-on-surface-variant">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="education" className="bg-surface-container-low px-margin-mobile py-6">
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
          className="flex flex-col gap-6 border-t border-outline-variant/30 bg-surface-container-low px-margin-mobile py-8"
        >
          <div className="flex flex-col gap-2">
            <h3 className="font-headline-md text-[20px] text-on-surface">保持联系</h3>
            <p className="text-body-md text-on-surface-variant">
              如果你对我的经历感兴趣，或者有合作机会，欢迎随时沟通。
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-white p-3"
              href={`mailto:${profile.email}`}
            >
              <Icon
                name="mail"
                className="rounded-lg bg-primary-container/10 p-2 text-primary"
              />
              <span className="font-medium text-on-surface-variant">{profile.email}</span>
            </a>
            <a
              className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-white p-3"
              href={`tel:${profile.phoneTel}`}
            >
              <Icon
                name="call"
                className="rounded-lg bg-primary-container/10 p-2 text-primary"
              />
              <span className="font-medium text-on-surface-variant">{profile.phone}</span>
            </a>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[12px] text-outline">© 2026 {profile.name}. Built with Product Thinking & Professional Excellence.</span>
          </div>
        </footer>
      </main>

      <nav className="pb-safe fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-outline-variant/30 bg-surface px-2 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        {BOTTOM_NAV.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault()
              scrollTo(item.id)
            }}
            className={`flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
              activeNav === item.id ? 'text-primary' : 'text-outline-variant hover:text-primary'
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
