import { useEffect, useState } from 'react'
import { AiAgentLink } from '../AiAgentLink'
import { Icon } from '../Icon'
import {
  education,
  experiences,
  profile,
  projects,
  skills,
} from '../../data/profile'

const NAV_ITEMS = [
  { id: 'about', label: '关于' },
  { id: 'experience', label: '经历' },
  { id: 'projects', label: '项目' },
  { id: 'prototypes', label: '原型' },
  { id: 'interests', label: '兴趣' },
  { id: 'education', label: '教育' },
] as const

const DESKTOP_SKILL_ICONS = ['strategy', 'design_services', 'psychology', 'groups']

export function DesktopPortfolio() {
  const [scrolled, setScrolled] = useState(false)
  const [activeNav, setActiveNav] = useState('about')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' })
    setActiveNav(id)
  }

  return (
    <div className="font-body-md text-body-md selection:bg-primary/10">
      <header
        className={`fixed top-0 z-50 w-full border-b border-outline-variant bg-surface/80 backdrop-blur-md transition-all ${
          scrolled ? 'py-2 shadow-md' : ''
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-margin-desktop py-4">
          <div className="font-headline-md text-headline-md font-bold text-primary">
            {profile.name} {profile.nameEn}
          </div>
          <div className="flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  scrollTo(item.id)
                }}
                className={`cursor-pointer py-1 transition-all active:scale-95 ${
                  activeNav === item.id
                    ? 'border-b-2 border-primary font-bold text-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {item.label}
              </a>
            ))}
            <AiAgentLink variant="nav" />
            <a
              href={`mailto:${profile.email}`}
              className="rounded-lg border border-outline-variant px-5 py-2 font-label-md text-primary transition-all hover:border-primary hover:bg-surface-container-low active:scale-95"
            >
              联系我
            </a>
          </div>
        </nav>
      </header>

      <main className="mt-20">
        <section
          id="about"
          className="mx-auto flex max-w-7xl flex-col items-center gap-16 px-margin-desktop py-24 md:flex-row"
        >
          <div className="flex-1 space-y-6">
            <h1 className="font-headline-xl text-6xl leading-tight tracking-tight">
              {profile.greeting}
              <br />
              我是<span className="text-gradient">{profile.name}</span>
            </h1>
            <p className="max-w-2xl font-body-lg text-xl text-on-surface-variant">
              {profile.intro}
            </p>
            <div className="grid grid-cols-2 gap-y-4 border-t border-outline-variant pt-4">
              <div className="flex items-center gap-3">
                <Icon name="person_pin" className="text-secondary" />
                <span className="text-on-surface-variant">{profile.roleLine}</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="cake" className="text-secondary" />
                <span className="text-on-surface-variant">{profile.birth} 出生</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="location_on" className="text-secondary" />
                <span className="text-on-surface-variant">{profile.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="school" className="text-secondary" />
                <span className="text-on-surface-variant">{profile.major}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 pt-4">
              <AiAgentLink variant="hero" />
              <a
                href={`mailto:${profile.email}`}
                className="flex items-center gap-2 rounded-lg border border-primary px-8 py-4 font-headline-md text-primary transition-all hover:bg-primary hover:text-white active:scale-95"
              >
                <Icon name="mail" /> {profile.email}
              </a>
              <a
                href={`tel:${profile.phoneTel}`}
                className="flex items-center gap-2 rounded-lg border border-outline-variant px-8 py-4 font-headline-md text-on-surface-variant transition-all hover:border-primary hover:text-primary active:scale-95"
              >
                <Icon name="call" /> {profile.phone}
              </a>
            </div>
          </div>
          <div className="relative h-80 w-80 md:h-[450px] md:w-[450px]">
            <div className="absolute inset-0 scale-105 rotate-6 rounded-xl border border-outline-variant bg-surface-container-high" />
            <div className="absolute inset-0 -rotate-3 rounded-xl border border-outline-variant bg-surface-container-highest" />
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-surface-container-low shadow-xl">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-4xl font-bold text-white">
                  王
                </div>
                <p className="font-headline-md text-primary">{profile.name}</p>
                <p className="text-on-surface-variant">{profile.role}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-outline-variant bg-surface-container-low py-12">
          <div className="mx-auto max-w-7xl px-margin-desktop">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              {skills.map((skill, index) => (
                <div
                  key={skill.title}
                  className="glass-card group flex flex-col gap-3 rounded-lg p-6 transition-all duration-300 hover:border-primary hover:bg-primary"
                >
                  <Icon
                    name={DESKTOP_SKILL_ICONS[index] ?? skill.icon}
                    className="text-4xl text-primary group-hover:text-white"
                  />
                  <h3 className="font-headline-md group-hover:text-white">{skill.title}</h3>
                  <p className="text-on-surface-variant group-hover:text-white/80">{skill.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="experience" className="mx-auto max-w-7xl px-margin-desktop py-24">
          <div className="mb-16 flex items-center gap-4">
            <h2 className="font-headline-lg text-4xl">工作经历</h2>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>
          <div className="space-y-12">
            {experiences.map((exp) => (
              <div key={exp.company} className="relative flex flex-col gap-8 md:flex-row">
                <div className="md:w-1/4">
                  <p
                    className={`text-xl font-bold ${exp.current ? 'text-primary' : 'text-secondary'}`}
                  >
                    {exp.period}
                  </p>
                  <p className="text-on-surface-variant">{exp.title}</p>
                </div>
                <div className="relative flex-1 border-l-2 border-surface-container-highest pb-12 pl-8">
                  <div
                    className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full ${
                      exp.current ? 'bg-primary' : 'bg-surface-dim'
                    }`}
                  />
                  <h3 className="mb-2 font-headline-lg text-2xl text-primary">{exp.company}</h3>
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

        <section
          id="projects"
          className="border-y border-outline-variant bg-surface-container-low py-24"
        >
          <div className="mx-auto max-w-7xl px-margin-desktop">
            <div className="mb-16">
              <h2 className="mb-4 font-headline-lg text-4xl">项目经历</h2>
              <p className="text-on-surface-variant">
                围绕 MarketUp 产品，打通从「获客」到「转化」的全链路闭环
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8">
              {projects.map((project, index) => (
                <div
                  key={project.title}
                  className={`overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm transition-all duration-500 hover:shadow-lg ${
                    index === 0 ? '' : ''
                  }`}
                >
                  <div className="flex flex-col md:flex-row">
                    <div className="flex items-center justify-center border-b border-outline-variant bg-surface-container-low p-8 md:w-48 md:border-b-0 md:border-r">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                        <Icon name={project.icon} className="text-3xl text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 p-8">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <h3 className="font-headline-lg text-2xl">{project.title}</h3>
                        <span className="rounded-lg border border-secondary/20 bg-secondary/10 px-3 py-1 font-label-md text-secondary">
                          {project.badge}
                        </span>
                      </div>
                      <p className="mb-6 text-on-surface-variant">{project.summary}</p>
                      <ul className="mb-6 list-disc space-y-2 pl-5 text-on-surface-variant">
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
          </div>
        </section>

        <section id="prototypes" className="mx-auto max-w-7xl px-margin-desktop py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-headline-lg text-4xl">工作原型</h2>
            <p className="text-on-surface-variant">专注易用性与逻辑严密性的原型输出 (脱敏展示)</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { title: '移动端线索流转界面', sub: 'Figma · MasterGo' },
              { title: 'PC 管理后台全局看板', sub: 'High-Fidelity Mockup' },
              { title: '自动化流程编辑器', sub: 'Workflow Logic Design' },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-lg border border-outline-variant bg-gradient-to-br from-primary to-secondary p-6"
              >
                <Icon
                  name="draw"
                  className="absolute right-6 top-6 text-6xl text-white/20 transition-transform group-hover:scale-110"
                />
                <p className="font-headline-md text-white">{item.title}</p>
                <p className="text-sm text-white/60">{item.sub}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="interests" className="border-t border-outline-variant bg-surface py-24">
          <div className="mx-auto max-w-7xl px-margin-desktop">
            <div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row">
              <div className="md:w-1/2">
                <h2 className="mb-4 font-headline-lg text-4xl">生活与热爱</h2>
                <p className="text-on-surface-variant">
                  在产品经理的理性逻辑之外，我喜欢用摄影捕捉感性瞬间，通过运动保持高效的精力和清醒的思考。
                </p>
              </div>
              <div className="flex gap-4">
                <div className="rounded-lg bg-primary p-3 text-white">
                  <Icon name="photo_camera" />
                </div>
                <div className="rounded-lg border border-secondary/20 bg-secondary/10 p-3 text-secondary">
                  <Icon name="directions_run" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {['摄影', '街拍', '运动', '跑步'].map((label, i) => (
                <div
                  key={label}
                  className={`flex h-48 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low md:h-80 ${
                    i % 2 === 1 ? 'mt-8' : ''
                  }`}
                >
                  <span className="font-headline-md text-on-surface-variant">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="education" className="mx-auto max-w-7xl px-margin-desktop py-24">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
            <div className="space-y-6">
              <h2 className="mb-8 font-headline-lg text-4xl">教育背景</h2>
              <div className="flex items-start gap-6 rounded-lg border border-outline-variant bg-surface-container-low p-8">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <Icon name="school" className="text-3xl text-primary" />
                </div>
                <div>
                  <h4 className="mb-1 font-headline-md text-xl">{education.school}</h4>
                  <p className="font-medium text-on-surface-variant">
                    {education.major} · {education.period}
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
                className="absolute -left-8 -top-12 select-none text-8xl text-primary/10"
              />
              <blockquote className="relative z-10 font-headline-md text-2xl italic leading-relaxed text-on-surface">
                “{profile.quote}”
              </blockquote>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-0.5 w-12 bg-primary" />
                <p className="font-bold text-primary">{profile.name} · 个人自述</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-24 w-full border-t border-outline-variant bg-surface-container-low py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-margin-desktop md:flex-row">
          <div className="flex flex-col gap-2">
            <div className="font-headline-md text-headline-md font-bold text-primary">
              {profile.name} {profile.nameEn}
            </div>
            <p className="text-sm text-on-surface-variant">
              © 2024 {profile.name}. Built with Passion & Professional Rigor.
            </p>
          </div>
          <div className="flex gap-8">
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
    </div>
  )
}
