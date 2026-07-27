import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AiAgentLink } from '../AiAgentLink'
import { Icon } from '../Icon'
import { SiteHeader } from '../SiteHeader'
import {
  education,
  experiences,
  profile,
  projects,
  skills,
} from '../../data/profile'

const NAV_ITEMS = [
  { id: 'home', label: '首页' },
  { id: 'skills', label: '核心竞争力' },
  { id: 'experience', label: '职业履历' },
  { id: 'prototypes', label: '产品原型' },
  { id: 'projects', label: '核心项目' },
  { id: 'life', label: '生活瞬间' },
  { id: 'education', label: '教育背景' },
  { id: 'contact', label: '联系方式' },
] as const

const DESKTOP_SKILL_ICONS = ['strategy', 'design_services', 'psychology', 'groups']

const COVER_IMG = '/photo.jpg'
const HEADER_OFFSET = 80

export function DesktopPortfolio() {
  const location = useLocation()
  const [activeNav, setActiveNav] = useState('home')
  const clickingRef = useRef(false)

  const scrollTo = (id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    clickingRef.current = true
    setActiveNav(id)
    window.scrollTo({ top: target.offsetTop - HEADER_OFFSET, behavior: 'smooth' })
    window.setTimeout(() => {
      clickingRef.current = false
    }, 700)
  }

  useEffect(() => {
    const hash = location.hash.replace('#', '')
    if (!hash) return
    const timer = window.setTimeout(() => {
      const target = document.getElementById(hash)
      if (!target) return
      clickingRef.current = true
      setActiveNav(hash)
      window.scrollTo({ top: target.offsetTop - HEADER_OFFSET, behavior: 'smooth' })
      window.setTimeout(() => {
        clickingRef.current = false
      }, 700)
    }, 50)
    return () => window.clearTimeout(timer)
  }, [location.hash])

  useEffect(() => {
    const sectionIds = NAV_ITEMS.map((item) => item.id)
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (clickingRef.current) return
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) {
          setActiveNav(visible[0].target.id)
        }
      },
      {
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0, 0.1, 0.25, 0.5],
      },
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-[#eef1f6] font-body-md text-body-md text-on-surface selection:bg-primary/10">
      <SiteHeader activeSection={activeNav} onScrollTo={scrollTo} />

      <div className="mx-auto flex max-w-[1280px] gap-6 px-6 py-8 lg:px-10">
        {/* Left sidebar */}
        <aside className="flex w-[280px] shrink-0 flex-col gap-5 self-start">
          {/* Profile card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(27,43,58,0.06)]">
            <div className="relative h-28 overflow-hidden">
              <img
                src={COVER_IMG}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
            <div className="relative px-5 pb-5 pt-0">
              <div className="-mt-10 mb-3 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-primary text-3xl font-bold text-white shadow-md">
                  王
                </div>
              </div>
              <div className="mb-4 text-center">
                <h1 className="font-headline-md text-xl font-bold text-primary">
                  {profile.name}
                </h1>
              </div>

              <div className="mb-4 space-y-2.5 border-y border-outline-variant/30 py-4">
                <div className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                  <Icon name="person_pin" className="shrink-0 text-[18px] text-secondary" />
                  <span>{profile.roleLine}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                  <Icon name="cake" className="shrink-0 text-[18px] text-secondary" />
                  <span>{profile.birth}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                  <Icon name="location_on" className="shrink-0 text-[18px] text-secondary" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-on-surface-variant">
                  <Icon name="school" className="shrink-0 text-[18px] text-secondary" />
                  <span>{profile.major}</span>
                </div>
              </div>

              {/* <div className="mb-4 grid grid-cols-3 divide-x divide-outline-variant/40 border-b border-outline-variant/30 pb-4 text-center">
                <div>
                  <p className="text-[11px] text-outline">项目</p>
                  <p className="mt-0.5 text-lg font-bold text-primary">{projects.length}</p>
                </div>
                <div>
                  <p className="text-[11px] text-outline">技能</p>
                  <p className="mt-0.5 text-lg font-bold text-primary">{skills.length}</p>
                </div>
                <div>
                  <p className="text-[11px] text-outline">经历</p>
                  <p className="mt-0.5 text-lg font-bold text-primary">{experiences.length}</p>
                </div>
              </div> */}

              <div className="flex flex-col gap-2">
                <AiAgentLink variant="nav" className="w-full justify-center" />
                <div className="overflow-hidden rounded-lg border border-outline-variant/60">
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-2.5 border-b border-outline-variant/60 px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                  >
                    <Icon name="mail" className="shrink-0 text-[18px] text-secondary" />
                    <span className="truncate">{profile.email}</span>
                  </a>
                  <a
                    href={`tel:${profile.phoneTel}`}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                  >
                    <Icon name="call" className="shrink-0 text-[18px] text-secondary" />
                    <span>{profile.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* TOC card */}
          <nav className="rounded-2xl bg-white p-4 shadow-[0_8px_30px_rgba(27,43,58,0.06)]">
            <div className="mb-3 flex items-center gap-2 px-2 text-sm font-bold text-primary">
              <Icon name="list" className="text-[20px]" />
              页面目录
            </div>
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const active = activeNav === item.id
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        scrollTo(item.id)
                      }}
                      className={`block rounded-xl px-3 py-2.5 text-sm transition-all ${active
                          ? 'bg-secondary-container/35 font-semibold text-primary'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                        }`}
                    >
                      {item.label}
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 space-y-6 pb-10">
          {/* About */}
          <section
            id="home"
            className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(27,43,58,0.06)]"
          >
            <div className="relative h-44 overflow-hidden">
              <img src={COVER_IMG} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="p-8">
              <p className="text-lg leading-relaxed text-on-surface-variant">{profile.intro}</p>
            </div>
          </section>

          {/* Skills */}
          <section
            id="skills"
            className="rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(27,43,58,0.06)]"
          >
            <h2 className="mb-6 font-headline-lg text-2xl text-primary">核心竞争力</h2>
            <div className="grid grid-cols-2 gap-5">
              {skills.map((skill, index) => (
                <div key={skill.title} className="skill-card flex flex-col gap-3 rounded-xl p-5">
                  <Icon
                    name={DESKTOP_SKILL_ICONS[index] ?? skill.icon}
                    className="skill-card-icon text-3xl text-primary"
                  />
                  <h3 className="skill-card-title font-headline-md text-on-surface">{skill.title}</h3>
                  <p className="skill-card-desc text-sm text-on-surface-variant">{skill.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Experience */}
          <section
            id="experience"
            className="rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(27,43,58,0.06)]"
          >
            <div className="mb-10 flex items-center gap-4">
              <h2 className="font-headline-lg text-2xl text-primary">职业履历</h2>
              <div className="h-px flex-1 bg-outline-variant" />
            </div>
            <div className="space-y-10">
              {experiences.map((exp) => (
                <div key={exp.company} className="relative flex gap-8">
                  <div className="w-40 shrink-0">
                    <p
                      className={`text-lg font-bold ${exp.current ? 'text-primary' : 'text-secondary'}`}
                    >
                      {exp.period}
                    </p>
                    <p className="text-on-surface-variant">{exp.title}</p>
                  </div>
                  <div className="relative flex-1 border-l-2 border-surface-container-highest pb-2 pl-8">
                    <div
                      className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full ${exp.current ? 'bg-primary' : 'bg-surface-dim'
                        }`}
                    />
                    <h3 className="mb-2 font-headline-lg text-xl text-primary">{exp.company}</h3>
                    <p className="mb-4 text-on-surface-variant">{exp.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {exp.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-outline-variant bg-surface-container px-3 py-1 text-sm font-medium"
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

          {/* Prototypes */}
          <section
            id="prototypes"
            className="rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(27,43,58,0.06)]"
          >
            <div className="mb-8 text-center">
              <h2 className="mb-2 font-headline-lg text-2xl text-primary">产品原型</h2>
              <p className="text-on-surface-variant">专注易用性与逻辑严密性的原型输出 (脱敏展示)</p>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {[
                { title: '移动端线索流转界面', sub: 'Figma · MasterGo' },
                { title: 'PC 管理后台全局看板', sub: 'High-Fidelity Mockup' },
                { title: '自动化流程编辑器', sub: 'Workflow Logic Design' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-xl border border-outline-variant bg-gradient-to-br from-primary to-secondary p-5"
                >
                  <Icon
                    name="draw"
                    className="absolute right-5 top-5 text-5xl text-white/20 transition-transform group-hover:scale-110"
                  />
                  <p className="font-headline-md text-white">{item.title}</p>
                  <p className="text-sm text-white/60">{item.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Projects */}
          <section
            id="projects"
            className="rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(27,43,58,0.06)]"
          >
            <div className="mb-8">
              <h2 className="mb-2 font-headline-lg text-2xl text-primary">核心项目</h2>
              <p className="text-on-surface-variant">
                围绕 MarketUp 产品，打通从「获客」到「转化」的全链路闭环
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {projects.map((project) => (
                <div
                  key={project.title}
                  className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-sm transition-all duration-500 hover:shadow-lg"
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="flex items-center justify-center border-b border-outline-variant bg-surface-container-low p-8 md:w-40 md:border-b-0 md:border-r">
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                        <Icon name={project.icon} className="text-3xl text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <h3 className="font-headline-lg text-xl">{project.title}</h3>
                        <span className="rounded-lg border border-secondary/20 bg-secondary/10 px-3 py-1 font-label-md text-secondary">
                          {project.badge}
                        </span>
                      </div>
                      <p className="mb-4 text-on-surface-variant">{project.summary}</p>
                      <ul className="mb-4 list-disc space-y-2 pl-5 text-on-surface-variant">
                        {project.points.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg border border-outline-variant bg-surface-container px-3 py-1 text-sm font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Interests */}
          <section
            id="life"
            className="rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(27,43,58,0.06)]"
          >
            <div className="mb-8 flex items-end justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="mb-2 font-headline-lg text-2xl text-primary">生活瞬间</h2>
                <p className="text-on-surface-variant">
                  在产品经理的理性逻辑之外，我喜欢用摄影捕捉感性瞬间，通过运动保持高效的精力和清醒的思考。
                </p>
              </div>
              <div className="flex gap-3">
                <div className="rounded-lg bg-primary p-3 text-white">
                  <Icon name="photo_camera" />
                </div>
                <div className="rounded-lg border border-secondary/20 bg-secondary/10 p-3 text-secondary">
                  <Icon name="directions_run" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {['摄影', '街拍', '运动', '跑步'].map((label, i) => (
                <div
                  key={label}
                  className={`flex h-56 items-center justify-center rounded-xl border border-outline-variant bg-surface-container-low ${i % 2 === 1 ? 'mt-6' : ''
                    }`}
                >
                  <span className="font-headline-md text-on-surface-variant">{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section
            id="education"
            className="rounded-2xl bg-white p-8 shadow-[0_8px_30px_rgba(27,43,58,0.06)]"
          >
            <div className="grid grid-cols-2 items-center gap-12">
              <div className="space-y-6">
                <h2 className="font-headline-lg text-2xl text-primary">教育背景</h2>
                <div className="flex items-start gap-5 rounded-xl border border-outline-variant bg-surface-container-low p-6">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <Icon name="school" className="text-3xl text-primary" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-headline-md text-lg">
                      {education.school}
                    </h4>
                    <p className="font-medium text-on-surface-variant">
                      {education.major}
                    </p>
                    <p className="font-medium text-on-surface-variant">
                      {education.period}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {education.certificates.map((cert) => (
                        <span
                          key={cert}
                          className="rounded-lg border border-outline-variant bg-surface px-2 py-1 text-sm text-on-surface-variant"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <Icon
                  name="format_quote"
                  className="absolute -left-6 -top-10 select-none text-7xl text-primary/10"
                />
                <blockquote className="relative z-10 text-xl italic leading-relaxed text-on-surface">
                  “{profile.quote}”
                </blockquote>
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-0.5 w-10 bg-primary" />
                  <p className="font-bold text-primary">{profile.name} · 个人自述</p>
                </div>
              </div>
            </div>
          </section>

          <footer
            id="contact"
            className="rounded-2xl bg-white px-8 py-6 shadow-[0_8px_30px_rgba(27,43,58,0.06)]"
          >
            <div className="flex items-center justify-between gap-6">
              <div>
                <div className="font-bold text-primary">
                  {profile.name} {profile.nameEn}
                </div>
                <p className="text-sm text-on-surface-variant">
                  © 2026 {profile.name}. Built with Product Thinking & Professional Excellence.
                </p>
              </div>
              <div className="flex gap-6">
                <a
                  className="text-sm text-on-surface-variant underline transition-all hover:text-primary"
                  href={`tel:${profile.phoneTel}`}
                >
                  {profile.phone}
                </a>
                <a
                  className="text-sm text-on-surface-variant underline transition-all hover:text-primary"
                  href={`mailto:${profile.email}`}
                >
                  {profile.email}
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
