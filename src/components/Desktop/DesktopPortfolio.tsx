import { useEffect, useState } from 'react'
import { Icon } from '../Icon'

const NAV_ITEMS = [
  { id: 'about', label: '关于' },
  { id: 'experience', label: '经历' },
  { id: 'projects', label: '项目' },
  { id: 'prototypes', label: '原型' },
  { id: 'interests', label: '兴趣' },
  { id: 'education', label: '教育' },
] as const

const SKILLS = [
  {
    icon: 'strategy',
    title: '业务架构设计',
    desc: '擅长梳理复杂业务逻辑，将商业需求转化为高可用的 SaaS 架构。',
  },
  {
    icon: 'auto_awesome',
    title: '营销自动化 (MA)',
    desc: '精通全渠道线索追踪与自动化触达策略，提升私域运营效率。',
  },
  {
    icon: 'psychology',
    title: 'AI 智能应用',
    desc: '结合 RAG 技术构建行业知识库，实现智能化的销售协同与客服体系。',
  },
  {
    icon: 'data_exploration',
    title: '数据驱动增长',
    desc: '利用全链路埋点分析，量化转化漏斗，实现产品体验的持续迭代。',
  },
]

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
            王怡阳 Yiyang
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
            <button
              type="button"
              onClick={() => scrollTo('about')}
              className="rounded-lg bg-primary px-6 py-2 font-label-md text-white transition-all hover:bg-primary-container active:scale-95"
            >
              联系我
            </button>
          </div>
        </nav>
      </header>

      <main className="mt-20">
        {/* Hero */}
        <section
          id="about"
          className="mx-auto flex max-w-7xl flex-col items-center gap-16 px-margin-desktop py-24 md:flex-row"
        >
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-high px-4 py-1.5 font-label-sm text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              目前在职 · 弟齐信息
            </div>
            <h1 className="font-headline-xl text-6xl leading-tight tracking-tight">
              你好啊，欢迎来到我的个人站。
              <br />
              我是<span className="text-gradient">王怡阳</span>
            </h1>
            <p className="max-w-2xl font-body-lg text-xl text-on-surface-variant">
              一名做 ToB SaaS 的产品经理。致力于通过数字技术赋能商业增长，构建高效的获客与转化体系。
            </p>
            <div className="grid grid-cols-2 gap-y-4 border-t border-outline-variant pt-4">
              <div className="flex items-center gap-3">
                <Icon name="person_pin" className="text-secondary" />
                <span className="text-on-surface-variant">ToB 产品经理｜2 年经验</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="cake" className="text-secondary" />
                <span className="text-on-surface-variant">1999 年出生</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="location_on" className="text-secondary" />
                <span className="text-on-surface-variant">上海 / 苏州</span>
              </div>
              <div className="flex items-center gap-3">
                <Icon name="school" className="text-secondary" />
                <span className="text-on-surface-variant">徐州工程学院</span>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <a
                href="mailto:yiyang.wang@email.com"
                className="flex items-center gap-2 rounded-lg bg-primary px-8 py-4 font-headline-md text-white transition-all hover:shadow-lg active:scale-95"
              >
                <Icon name="mail" /> 获取我的简历
              </a>
            </div>
          </div>
          <div className="relative h-80 w-80 md:h-[450px] md:w-[450px]">
            <div className="absolute inset-0 scale-105 rotate-6 rounded-xl border border-outline-variant bg-surface-container-high" />
            <div className="absolute inset-0 -rotate-3 rounded-xl border border-outline-variant bg-surface-container-highest" />
            <div className="relative h-full w-full overflow-hidden rounded-xl border-2 border-white shadow-xl">
              <img
                alt="Wang Yiyang Portrait"
                className="h-full w-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9esF_6Tfqi7cO9Ji2iHqHtDcYspi4hW82mbaq8KVxms2WXhm9NrbbaSuN0HbuZy76vsrGGSF2hWmypm8oB4KK6OFKBp-1gj0rmnnY7cOeeGiNdtn2_34vpEeEOeEA8u7apbk-CQZKtr6rVsPUswg701R6L02nHxsty4-QroRI8g5kWw8Czg9_LLYxq2y6uCR87U3FuLSbzim63zmTLSrmu5G1QsIaEmWEpJRKbGQKQrrRp8LFPohCpNvmL0eaT41nwv3M56LIuLI"
              />
            </div>
          </div>
        </section>

        {/* Skills */}
        <section className="border-y border-outline-variant bg-surface-container-low py-12">
          <div className="mx-auto max-w-7xl px-margin-desktop">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
              {SKILLS.map((skill) => (
                <div
                  key={skill.title}
                  className="glass-card group flex flex-col gap-3 rounded-lg p-6 transition-all duration-300 hover:border-primary hover:bg-primary"
                >
                  <Icon
                    name={skill.icon}
                    className="text-4xl text-primary group-hover:text-white"
                  />
                  <h3 className="font-headline-md group-hover:text-white">{skill.title}</h3>
                  <p className="text-on-surface-variant group-hover:text-white/80">{skill.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Experience */}
        <section id="experience" className="mx-auto max-w-7xl px-margin-desktop py-24">
          <div className="mb-16 flex items-center gap-4">
            <h2 className="font-headline-lg text-4xl">工作经历</h2>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>
          <div className="space-y-12">
            <div className="relative flex flex-col gap-8 md:flex-row">
              <div className="md:w-1/4">
                <p className="text-xl font-bold text-primary">2024.06 - 至今</p>
                <p className="text-on-surface-variant">产品经理</p>
              </div>
              <div className="relative flex-1 border-l-2 border-surface-container-highest pb-12 pl-8">
                <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-primary" />
                <h3 className="mb-2 font-headline-lg text-2xl text-primary">弟齐信息 (DQI)</h3>
                <p className="mb-4 text-on-surface-variant">
                  主导线索全生命周期管理系统的设计与迭代，优化 SaaS 平台核心获客组件。负责私域营销自动化工具
                  (MA) 的从 0 到 1 建设，对接多平台 API 实现全域数据同步。
                </p>
                <div className="flex flex-wrap gap-2">
                  {['B端架构', 'SaaS 系统', 'API 开放平台'].map((tag) => (
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
            <div className="relative flex flex-col gap-8 md:flex-row">
              <div className="md:w-1/4">
                <p className="text-xl font-bold text-secondary">2023.06 - 2024.04</p>
                <p className="text-on-surface-variant">产品运营专员 (实习)</p>
              </div>
              <div className="relative flex-1 border-l-2 border-surface-container-highest pb-12 pl-8">
                <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-surface-dim" />
                <h3 className="mb-2 font-headline-lg text-2xl text-primary">
                  百盛中国 (Yum China)
                </h3>
                <p className="mb-4 text-on-surface-variant">
                  参与连锁餐饮供应链系统的优化与门店运营数据采集分析。协助制定多品牌联动营销方案，分析千万级用户行为习惯，输出产品改进建议。
                </p>
                <div className="flex flex-wrap gap-2">
                  {['大型企业内部系统', '业务流程优化'].map((tag) => (
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
        </section>

        {/* Projects */}
        <section
          id="projects"
          className="border-y border-outline-variant bg-surface-container-low py-24"
        >
          <div className="mx-auto max-w-7xl px-margin-desktop">
            <div className="mb-16">
              <h2 className="mb-4 font-headline-lg text-4xl">项目经历</h2>
              <p className="text-on-surface-variant">
                深耕 B 端领域，打通从“获客”到“转化”的全链路闭环
              </p>
            </div>
            <div className="bento-grid">
              <div className="group col-span-12 overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm transition-all duration-500 hover:shadow-lg md:col-span-7">
                <div className="h-64 overflow-hidden border-b border-outline-variant">
                  <img
                    alt="Project Dashboard"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy-sqUjD0yxl8IGhSWDHB--c0tvxRVlyOUZmlHmeATdjlDfT5YR1GeRPSeLSEPv7dGTuRQznnhXffAxCqM2hRV4hiiaFuZN_25VC29m4TAF2qHUAqf44dVhM1lGHZbOZRvg-wjFOLTqa_sR8b2a_FKUH7D8duxWoEw6qUYWyIXLjEVjUNkNh0W5K8Z0Y_gtRZVHbpuUKzj2hAgYG9yXVLN_9-9GF5snY5fe-JbhUy0W6HlaX4T04itI6Maq44oHrUpEbfOF7C8j4g"
                  />
                </div>
                <div className="p-8">
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="font-headline-lg text-2xl">全域线索获取平台</h3>
                    <span className="rounded-lg border border-secondary/20 bg-secondary/10 px-3 py-1 font-label-md text-secondary">
                      核心项目
                    </span>
                  </div>
                  <p className="mb-6 line-clamp-2 text-on-surface-variant">
                    解决企业多渠道资源分散痛点，实现百度、抖快等多平台线索自动聚合与智能清洗，提升线索利用率
                    40%。
                  </p>
                  <div className="flex gap-4">
                    <span className="flex cursor-pointer items-center gap-1 font-bold text-primary hover:underline">
                      查看详情 <Icon name="arrow_right_alt" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="group col-span-12 overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm transition-all duration-500 hover:shadow-lg md:col-span-5">
                <div className="flex h-full flex-col p-8">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <Icon name="dynamic_feed" className="text-primary" />
                  </div>
                  <h3 className="mb-4 font-headline-lg text-2xl">营销自动化 (MA) 策略中心</h3>
                  <p className="mb-auto text-on-surface-variant">
                    基于用户行为触发自动化工作流。通过可视化看板配置 S-O-P
                    流程，实现私域精准触达，显著降低运营人工成本。
                  </p>
                  <div className="mt-8 border-t border-outline-variant pt-8">
                    <div className="flex -space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-[10px] text-white">
                        MA
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-secondary text-[10px] text-white">
                        CRM
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group col-span-12 overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm transition-all duration-500 hover:shadow-lg md:col-span-5">
                <div className="flex h-full flex-col p-8">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                    <Icon name="groups" className="text-primary" />
                  </div>
                  <h3 className="mb-4 font-headline-lg text-2xl">销售协同转化工作台</h3>
                  <p className="text-on-surface-variant">
                    针对一线销售团队设计的移动端助手。集成了实时消息提醒、公海池抢单、客户轨迹地图等功能，打通销售转化最后一公里。
                  </p>
                  <div className="mt-8 flex h-32 items-center justify-center rounded-lg border border-outline-variant bg-surface-container">
                    <span className="text-sm font-medium text-on-surface-variant">
                      Dashboard Preview
                    </span>
                  </div>
                </div>
              </div>

              <div className="group col-span-12 overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm transition-all duration-500 hover:shadow-lg md:col-span-7">
                <div className="flex h-full flex-col md:flex-row">
                  <div className="p-8 md:w-3/5">
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                      <Icon name="smart_toy" className="text-primary" fill />
                    </div>
                    <h3 className="mb-4 font-headline-lg text-2xl">AI 行业智能知识库</h3>
                    <p className="mb-6 text-on-surface-variant">
                      利用 RAG 框架封装垂直领域知识，为 B
                      端企业提供定制化问答。支持文档自动切片与向量化搜索，准确率提升至 92%。
                    </p>
                    <button
                      type="button"
                      className="rounded-lg border border-primary px-6 py-2 font-label-md text-primary transition-all hover:bg-primary hover:text-white"
                    >
                      案例演示
                    </button>
                  </div>
                  <div className="flex items-center justify-center border-l border-outline-variant bg-surface-container-low p-4 md:w-2/5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-16 w-16 rounded-lg border border-outline-variant bg-white shadow-sm" />
                      <div className="mt-4 h-16 w-16 rounded-lg border border-outline-variant bg-white shadow-sm" />
                      <div className="-mt-4 h-16 w-16 rounded-lg border border-outline-variant bg-white shadow-sm" />
                      <div className="h-16 w-16 rounded-lg border border-outline-variant bg-white shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prototypes */}
        <section id="prototypes" className="mx-auto max-w-7xl px-margin-desktop py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 font-headline-lg text-4xl">工作原型</h2>
            <p className="text-on-surface-variant">专注易用性与逻辑严密性的原型输出 (脱敏展示)</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                title: '移动端线索流转界面',
                sub: 'Figma · Axure RP',
                src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDW6xxeP9rGWZ7ap2fhCQjKPkZj4vPhQaMIV6TkTd8pCqEwFWf0RmCY14unxpw0h1HRFsdtASIHpvVRlbsBsEwUmR6GJ_ipHRzCaHmANb2MYTfAEKHRDX3JiqpFYUZNEu4SNLcPGalOO2FRM0o3iYZyd91jpw_Clvjzpo1ZZ2lABV1z8OyJTVtmp2GViVOJ4PJLiFF_q9UibkrYzR1SaRWSPImQ0_TyeKoytnMpA57ItqJ3uSRoj0cUgI5GT0zVK9MtAqeSae4Odt0',
              },
              {
                title: 'PC 管理后台全局看板',
                sub: 'High-Fidelity Mockup',
                src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzLSlQa10CFANtZYbwIitTHeMAGVpPq8X8L9RR9KbGdZip8Cnp897zhchzRgucUJqBcq0WTFPqy2h-CuXqczcX1B6d4pOOSvZRWIBosHv3_EJCo5T3--HVegX2tejJeOWOBgYTvHRQaqlfIhpxxrpNKs_bO3v5CARDj3tQnQrLelUBCDC0yAAHZp6QVytxCmH6yRepQ7IO2JgOdv0hXKZo_CKtJpFP5Hcrch7oPcfYeBUYCl2EYh-3nDiG3_msim6_I-waQRzB7FI',
              },
              {
                title: '自动化流程编辑器',
                sub: 'Workflow Logic Design',
                src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTfEEnfEb-zmMH4DInNupdm3oph2vsWXnoquBkFvHV1-DoUQTWex8Ir5PC7ywRI1wJRYcYbxwL5cNYUy26SO9drzeA95IZB8mzePIjPMUPrEITB8b2oSgE5NamNEXDdBO_N-ZTyFD6BMkL48qg5P45f6n6K_oOAf41BdX3EMAoFifArmahArQEsJCypJ9c-HxAIOLZ6XliexjJfjylmwmJgNgzpPvzKa9bmKKwiRQRwSxlj-4DdfKDxZIhAZ66MluK9ztDWGBrYsk',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-outline-variant bg-surface-container"
              >
                <img
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  src={item.src}
                />
                <div className="absolute inset-0 flex translate-y-4 flex-col justify-end bg-gradient-to-t from-[#1b2b3a]/90 via-[#1b2b3a]/20 to-transparent p-6 transition-transform group-hover:translate-y-0">
                  <p className="font-headline-md text-white">{item.title}</p>
                  <p className="text-sm text-white/60">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Interests */}
        <section id="interests" className="border-t border-outline-variant bg-surface py-24">
          <div className="mx-auto max-w-7xl px-margin-desktop">
            <div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row">
              <div className="md:w-1/2">
                <h2 className="mb-4 font-headline-lg text-4xl">生活与热爱</h2>
                <p className="text-on-surface-variant">
                  在产品经理的理性逻辑之外，我喜欢用摄影捕捉感性瞬间，通过运动保持高效的精力和清醒的思考。我认为好的产品经理应该拥有对生活细腻的洞察力。
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
              {[
                {
                  alt: 'Street Photography',
                  src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPeiIi3NGUNTBBmKPtHmUbCMHzFc5KdsunFvr35GmNhYdJg3b37Ll5zfFKccPrEHRmQwTOut_SKJVD4XJn_m3Apu6X8qUeYRDvU76ttg1AjVqwIXcsjQi57w9W6U1NbrAN-u_mVd4S66ct_VvCXWeUrbRVQNPJlIuQM_wgniT0vSXVwvzMfz0xHcSwF9y_Aczn_aD30jdnw-XjEbXDrgj9Rh0lbJ8MWzRHT6d0fJfBbr8QnUPifxyO6vVkgh02RYhTnWfsT9CtyGc',
                  offset: false,
                },
                {
                  alt: 'Sports Shot',
                  src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCloE5F7S8p2fVrdBkBy9bH1fHhvT8Va1AxFfowHVbwLJym8mjtsCDb95IKstOqiV2boP5OReC5qholWgtPd9qNQtOxqqJhIap3oR--n-PiwcZ-zWVQtfxWQIzUG-3xthrzr3Zl00QiuSROYwZShHPx6ZqaZ8n7VdnybC4_u1BEjmPjffzoU8QEXZYAH_-VHlHaaoKQrkfS-Vozt26Vplp9zTiNwxIyRA13shPQLKK_gDvdXk2IIqWli70fDOklm6tcyZf46A_BtH0',
                  offset: true,
                },
                {
                  alt: 'Architectural Minimalism',
                  src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEsBib6OQAVuEAkr_D5zmr9Qa2FGxVMy74J15jKtxClI6j325Tn5Dgyal4TAQbS3d_ORjO_xd7mqj_5p-oF-3yTwcWDXmrDDMo7TwMtfOWBcC29H6VuYPmea9_4wranlLQOJyXFTZY7n2qqXVSlF_Q4afwPoBasZn8UAN-Qv2rc3ojZlH_0PiKvaZtgyvxKzs0S93vbYHWVHunQuu4g5FZtYb_JozTLrfXKefwltkkMeUz8Eej-sPruj2Ff5NHPiR5F2Bm60nlKbE',
                  offset: false,
                },
                {
                  alt: 'Vintage Camera',
                  src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAk7R27TfYXq7ULCYFPUAsfMzozcQhTAzfj0baUVWx-1G99IbzCuPCbGRHkKe-OXC6IH3vgT5Ksu1TV43OWW801kjJFlME7TwrJj9P-6MQmR37YwsQESxuUc-eeMgltRfYcOVhBRe33vEWbYTz2lxHmzYbRzrgZT7RDLc-km6CFbgtFliw8YIcKebz2ZQqL0AHfAKMOBkltOWc6ZoEnEANDT5PzZxylyiqVS_K3Dgr70iBPkaOApEY6N6T16LoRh0AcYWhH5kBDqOU',
                  offset: true,
                },
              ].map((img) => (
                <div
                  key={img.alt}
                  className={`h-48 overflow-hidden rounded-lg border border-outline-variant md:h-80 ${
                    img.offset ? 'mt-8' : ''
                  }`}
                >
                  <img
                    alt={img.alt}
                    className="h-full w-full object-cover transition-all duration-500 hover:scale-110"
                    src={img.src}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Education */}
        <section id="education" className="mx-auto max-w-7xl px-margin-desktop py-24">
          <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
            <div className="space-y-6">
              <h2 className="mb-8 font-headline-lg text-4xl">教育背景</h2>
              <div className="flex items-start gap-6 rounded-lg border border-outline-variant bg-surface-container-low p-8">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
                  <Icon name="school" className="text-3xl text-primary" />
                </div>
                <div>
                  <h4 className="mb-1 font-headline-md text-xl">徐州工程学院</h4>
                  <p className="font-medium text-on-surface-variant">本科 · 2019 - 2023</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-lg border border-outline-variant bg-surface px-2 py-1 text-sm text-on-surface-variant">
                      在校期间获二等奖学金
                    </span>
                    <span className="rounded-lg border border-outline-variant bg-surface px-2 py-1 text-sm text-on-surface-variant">
                      产品协会负责人
                    </span>
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
                “作为一名年轻的 PM，我深信 SaaS
                的本质是‘效率革命’。我的目标是让复杂的业务逻辑变简单，让每一条流量都能找到属于它的闭环。保持好奇，死磕逻辑。”
              </blockquote>
              <div className="mt-8 flex items-center gap-4">
                <div className="h-0.5 w-12 bg-primary" />
                <p className="font-bold text-primary">王怡阳 · 个人自述</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-24 w-full border-t border-outline-variant bg-surface-container-low py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-margin-desktop md:flex-row">
          <div className="flex flex-col gap-2">
            <div className="font-headline-md text-headline-md font-bold text-primary">
              王怡阳 Yiyang
            </div>
            <p className="text-sm text-on-surface-variant">
              © 2024 王怡阳. Built with Passion & Professional Rigor.
            </p>
          </div>
          <div className="flex gap-8">
            <a
              className="text-sm text-on-surface-variant underline transition-all hover:text-primary"
              href="#"
            >
              微信
            </a>
            <a
              className="text-sm text-on-surface-variant underline transition-all hover:text-primary"
              href="#"
            >
              简历下载
            </a>
            <a
              className="text-sm text-on-surface-variant underline transition-all hover:text-primary"
              href="mailto:yiyang.wang@email.com"
            >
              Email
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
