import { useState } from 'react'
import { Icon } from '../Icon'

const BOTTOM_NAV: { id: string; icon: string; label: string }[] = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'skills', icon: 'bolt', label: 'Skills' },
  { id: 'projects', icon: 'description', label: 'Projects' },
  { id: 'life', icon: 'camera', label: 'Life' },
  { id: 'contact', icon: 'mail', label: 'Contact' },
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
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-primary-container/10 active:scale-95"
          aria-label="账号"
        >
          <Icon name="account_circle" className="text-primary" />
        </button>
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
          </div>
        </div>
      )}

      <main className="pb-24 pt-16">
        {/* Hero */}
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
              你好啊，欢迎来到我的个人站。
            </h2>
            <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
              我是王怡阳，一名做 ToB SaaS 的产品经理。
            </p>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-primary-container">
              <img
                className="h-full w-full object-cover"
                alt="王怡阳"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3hZI5ly3pIqFdyEgNWouXeIZ_JBxQTcH8PwZ0IDh8u7-LfdoPgI4JdUSy5PRsQGzU-esxnHoJ7MafKJT3GRToAKPqSKYOQPJlvKGNICOXOPjmtlmJpTWvLf0cS8buA39Th0C3Veaz9MRjhnwPZKOUuvq_IuD5_3rLvmeDMG1HgVb3QaUmhZaifwZApiUFhJRwSf95nqlJ4sd5m1moNvLLNFQRtY1_O3aovDj9tHrW2acrgICvLalKu7uQCWwvEE7GvCGw2YIqaIs"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-[18px] text-on-surface">王怡阳</span>
              <span className="font-body-md text-body-md font-semibold text-secondary">
                ToB 产品经理｜2 年工作经验
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="flex items-center gap-1 text-[12px] text-outline">
                  <Icon name="calendar_today" className="text-[14px]" />
                  2001.01
                </span>
                <span className="flex items-center gap-1 text-[12px] text-outline">
                  <Icon name="location_on" className="text-[14px]" />
                  江苏南京
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className="px-margin-mobile py-6">
          <h3 className="mb-4 flex items-center gap-2 font-headline-md text-[20px] text-on-surface">
            <Icon name="bolt" className="text-primary" /> 核心竞争力
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-highest p-4">
              <Icon name="hub" className="text-3xl text-primary" />
              <span className="font-bold text-on-surface">核心优势 (B端SaaS)</span>
              <p className="text-body-sm text-on-surface-variant">
                深入理解CRM、线索流转与公海池逻辑，具备0-1构建复杂业务系统的实战经验。
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
              <Icon name="design_services" className="text-secondary" />
              <span className="font-bold text-on-surface">专业技能</span>
              <p className="text-body-sm text-on-surface-variant">
                精通 Figma, MasterGo 原型设计与 SQL 数据查询。
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-low p-4">
              <Icon name="psychology" className="text-secondary" />
              <span className="font-bold text-on-surface">AI产品经验</span>
              <p className="text-body-sm text-on-surface-variant">
                基于 Cursor, Claude Code 提升产研效率，探索AI+营销闭环。
              </p>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container p-4">
              <div className="flex flex-col">
                <span className="font-bold text-on-surface">协同交付</span>
                <p className="text-body-sm text-on-surface-variant">
                  敏捷开发实践，高质量 PRD 输出，确保产研高效协同。
                </p>
              </div>
              <Icon name="groups" className="text-4xl text-outline" />
            </div>
          </div>
        </section>

        {/* Experience */}
        <section id="experience" className="px-margin-mobile py-6">
          <h3 className="mb-4 flex items-center gap-2 font-headline-md text-[20px] text-on-surface">
            <Icon name="work" className="text-primary" /> 职业履历
          </h3>
          <div className="relative flex flex-col gap-6 before:absolute before:bottom-4 before:left-[11px] before:top-4 before:w-[2px] before:bg-outline-variant/30 before:content-['']">
            <div className="relative flex gap-4">
              <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <div className="flex flex-col pb-4">
                <span className="text-[12px] font-bold text-primary">2024.06 - 至今</span>
                <span className="text-body-lg font-bold text-on-surface">弟齐 (Digee)</span>
                <span className="text-body-md text-on-surface-variant">产品经理</span>
                <p className="mt-2 text-body-sm leading-relaxed text-outline">
                  负责公司核心线索管理平台的 0-1 构建与迭代，主导从线索获取到销售协同的全链路数字化升级。
                </p>
              </div>
            </div>
            <div className="relative flex gap-4">
              <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-outline-variant">
                <div className="h-2 w-2 rounded-full bg-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-outline">2023.06 - 2024.04</span>
                <span className="text-body-lg font-bold text-on-surface">百胜中国 (Yum China)</span>
                <span className="text-body-md text-on-surface-variant">产品运营实习</span>
                <p className="mt-2 text-body-sm leading-relaxed text-outline">
                  参与数字化运营平台的日常运维与需求收集，分析用户行为数据以优化流程体验。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className="bg-surface-container-low px-margin-mobile py-6">
          <h3 className="mb-4 flex items-center gap-2 font-headline-md text-[20px] text-on-surface">
            <Icon name="assignment" className="text-primary" /> 核心项目
          </h3>
          <div className="flex flex-col gap-6">
            {[
              {
                icon: 'database',
                iconBg: 'bg-primary-container',
                iconColor: 'text-white opacity-40',
                title: '线索获取与统一数据平台',
                badge: '从 0 到 1',
                badgeClass: 'bg-secondary-container/30 text-on-secondary-container',
                points: [
                  '构建全渠道线索采集系统，整合API、表单与手动导入。',
                  '实现数据去重与标准化，提升线索有效率 35%。',
                ],
                tags: ['数据架构', '全链路'],
              },
              {
                icon: 'auto_fix_high',
                iconBg: 'bg-secondary/10',
                iconColor: 'text-secondary opacity-40',
                title: '线索培育与营销自动化',
                badge: '精细化运营',
                badgeClass: 'bg-surface-container-highest text-on-surface-variant',
                points: [
                  '设计自动化触达工作流（SDR），覆盖邮件、短信、企微。',
                  '建立线索分层机制，针对高意向线索实现秒级流转。',
                ],
                tags: ['MA', 'SDR'],
              },
              {
                icon: 'trending_up',
                iconBg: 'bg-primary/5',
                iconColor: 'text-primary opacity-40',
                title: '线索评分与销售协同',
                badge: '闭环增长',
                badgeClass: 'bg-secondary-fixed text-on-secondary-fixed-variant',
                points: [
                  '建立 Lead Scoring 模型，动态计算用户价值。',
                  '优化公海池分配规则，销售人效提升 20%。',
                ],
                tags: ['CRM', '算法'],
              },
              {
                icon: 'smart_toy',
                iconBg: 'bg-primary-container',
                iconColor: 'text-white opacity-30',
                title: 'AI 知识库与智能线索挖掘',
                badge: 'AI+营销',
                badgeClass: 'bg-primary text-white',
                points: [
                  '整合 LLM 实现多格式非结构化文档的知识库入库。',
                  '基于 AI 语义识别从社交媒体中自动识别高潜客户。',
                ],
                tags: ['LLM', 'RAG'],
              },
            ].map((project) => (
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
                      {project.badge}
                    </span>
                  </div>
                  <ul className="flex list-disc flex-col gap-1 pl-4 text-body-sm text-on-surface-variant">
                    {project.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                  <div className="mt-4 flex gap-2">
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

        {/* Prototypes */}
        <section id="prototypes" className="px-margin-mobile py-6">
          <div className="mb-4 flex items-end justify-between">
            <h3 className="flex items-center gap-2 font-headline-md text-[20px] text-on-surface">
              <Icon name="draw" className="text-primary" /> 产品原型
            </h3>
            <span className="text-[12px] text-outline">* 已脱敏处理</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              'https://lh3.googleusercontent.com/aida-public/AB6AXuAu_VNKJvePxtLRIjvKqyBrOQGgif-BU1FWxh5APBgB2Q5f3oAj1Dv104V9RIW93naj2dxdszxIZ1Pw-f3MY6-x_qDQeRiDzcK-vyn2fWucdNj0YT7fGJz8vgpHylG-Cgid9i1giosnVVxRXJ51GVWb7_hN4ETQnitmqOXETCRkspRt2ZhscXl37Agx6_Y1vPoxQ6iQNlSunGixSpxjwo1k88Je4mosWMuMqrelRHkAk81dlhCvl84X2sNOnW9JCpuiU8sqhrDUTpc',
              'https://lh3.googleusercontent.com/aida-public/AB6AXuAc36cAdbx7byEXePaDz2z7QicQ-mTiQZxRYFFEubUTVvRAYWSJR3LyIZ3iUiTM7rZBUIWvOe8UvmlR1tKoEbkuxLC6v-c3ESqJrz3-Z1N2ruxlzAZQM98rBoHIWKRWBupS4hUj7n2o4sDd_r20kypQ-KPWINELbAhWVwNmyNJj9vYBZ7YrRv4gFW06yQLLQUq7MLLAzoZMNhokmJGgEmfKuq4PeZjvTbv0EOUEhwX8SOCiW5MYA1xTWkWrsCLfEva3YpDWUy4ATrs',
              null,
              'https://lh3.googleusercontent.com/aida-public/AB6AXuBrSNJgIPrUDx_B4MvkkAq-le97BJHllHUw4sDVlB2zxNfXpgqaEjAR4R-joSvGr4VPV5n3zWHrV_dIh-05f0dzg5K3m_wzDOo4a2f8bMoDX61vMFeE5eKog1ym93SBM-ohkHo-tD4itE2gCrUMUSLzDTvPpeOfr0HSMIc_Dh9As5IUlK4ZGkwpuyFHlTj2rdTcDXLptQsryDk6Yg-4YXGc4YLYZpSZf8X0exunaYdsq1zMIuINEILZ0oRuw96S1_XfqzI2KWK1V2M',
              'https://lh3.googleusercontent.com/aida-public/AB6AXuCFOlJ30wGl2RXhxGbU0kdB6wDThhTxjxpdeznprF5atF3uhmQw2X971gfLOaBsz3jXs-zmAgCQsr5YpPwk_jzjW6DlfSQYeez2xHyO2z7mYI2YzLY8iSQtS2GG8G2iV0Mqa-JWJnfFWHsasoBZYxK_s_d-239GUefWd57UELp7MIQxNH9MvCsBqMxtiJ6paff_2xkxAP4nqsEpqRyvcRgLikgNK2s1tmXsdvN-exX2ses-voQCEbu8bIGEyO4cJXcBtU7Z5t2qLdc',
              'https://lh3.googleusercontent.com/aida-public/AB6AXuDQJdhAyMLa-CfC1a2qtBCc7shQNhbDJpOkH9G2nwGP4FEgwNfm2qf9ZbEIaHs3JLmhjm7OYEJvtiB9-TVqON4TXZu8Wy2rwtFI6cbAurmq8KRZBH1KTak5CtZ3I--GpLviLE45AumGbfy6NqMWx3iFCudtjjyYnostzC-ceJO_7F309nXcDfnlMB83ujg3mN7inTGhQ8bd18fLyQ2iyzNyvwLHm7BiVS65dbgtJSWVcDq6DIFCaIH2dVv6EzMuqfc1X52Dk5EYOd0',
            ].map((src, i) =>
              src ? (
                <div
                  key={src}
                  className="aspect-square overflow-hidden rounded-lg border border-outline-variant/20 bg-surface-container-highest"
                >
                  <img
                    className="h-full w-full object-cover grayscale transition-all duration-300 hover:grayscale-0"
                    alt={`原型 ${i + 1}`}
                    src={src}
                  />
                </div>
              ) : (
                <div
                  key="placeholder"
                  className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-outline-variant/20 bg-primary-fixed/20"
                >
                  <Icon name="visibility" className="text-primary" />
                </div>
              ),
            )}
          </div>
        </section>

        {/* Hobbies */}
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
          {hobbyTab === 'photography' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="h-48 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-highest">
                <img
                  className="h-full w-full object-cover"
                  alt="摄影作品 1"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBL_mFy4etaMnrhlEk29I_bxJJ7DGnmmxwNwoiD0azh9jQAsbNUFQ1d1eQb15Zt-jsAPRCe_30e0m9sSorVIm5gH1uLUwn85ww7WyTSJp3SlBBpE6ZLN5p4rBviHjkTEL9pwblnUum75JI7bSbKANioCWuOJ3mliVU2baiGGu7A2i03TQvRTCgJzxT23SgTwlJ56H1GEEgR-Ip_59cPv9AbmE3Q9J2ApCx4zg9rKuoReSeQBdzowuksefInCrZdw2oxSLB58CfNDYM"
                />
              </div>
              <div className="h-48 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-highest">
                <img
                  className="h-full w-full object-cover"
                  alt="摄影作品 2"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7OLS1ky7z_wYLLMwsNL7lDzq0zsGgcg-Q2KHAZAKXaOU6nMT7gY6GTz1ZM-X25M-f0TQF5a0t964C0a-stt5FQDQ7VH4E8ZuhjCkPvZ_Lmczvgy5O7MQyTJkXDt4ae-PJ4M677FRrQu1_itXmC4k9KmHgZ-ZWO3h9aBk_Jzc1KcmD_XC1WQird2XWCju4IYrzC_EZaOPh-JfJoM097wTLX0OoEPxhOgldlWomogy2FrG8jk3wOO1KAj1-T_4jmCKl23kJj7PGYsY"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="h-48 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-highest">
                <img
                  className="h-full w-full object-cover"
                  alt="运动瞬间 1"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPMShCJBIISxQqQBtTR0hEBDJTPP30x_DV8zSCZj2vX8bZTWVA5JJGdLSp42gclAtaQP160CTYIkbrRE-avGgpzbQ1l3wmRK1_h19WTykEdAZz3hX63_HJBgQF-0UTx48BO4Lc8e4agJEi0pAH5uPfBf_-Iwt1Qr-bCkLXcnWBPjBYS3EnJgJLVGDAGKxF7ti9PUncKU-5OEiB6IYKRKLxY0CFfJb4Z9zQ5ndZBS6--UR7CkukmxaPrEoitCDTQYOe8qa6H28yst4"
                />
              </div>
              <div className="h-48 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-highest">
                <img
                  className="h-full w-full object-cover"
                  alt="运动瞬间 2"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVxPCC9u-ZLbAB_L3XT0gW73hu54BNfM-4koYjkkSynOWWMHzHkANG0UPsTvqxOepMuq5Yed4ClEeUSnvOkVVT2KvCkm0ydxAbx1h6Dr_yehsKigM3icB_hJJ4C0iZiQf6nuGxAO1e1ZEjbA64XxL0D7zP8VMzPx40K53GIKlFl9q3aCwPp8tFwKYLHbzlBCXVCINJUCi2qMpw8CvmM-URb2SWPJc_2Pl1IKAwBtxu3LRQ_r-76Sbmn5R11tcNzvftbK6fYKCdx1c"
                />
              </div>
            </div>
          )}
        </section>

        {/* Education */}
        <section id="education" className="bg-surface-container-low px-margin-mobile py-6">
          <div className="rounded-xl border border-outline-variant/30 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-container/10">
                <Icon name="school" className="text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-on-surface">徐州工程学院</span>
                <span className="text-[12px] text-on-surface-variant">
                  信息管理与信息技术 · 2020.09-2024.06
                </span>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-sm border border-primary/10 bg-primary/5 px-3 py-1 text-[12px] font-bold text-primary">
                软考·软件设计师
              </span>
              <span className="rounded-sm border border-primary/10 bg-primary/5 px-3 py-1 text-[12px] font-bold text-primary">
                英语六级 (CET-6)
              </span>
            </div>
            <hr className="mb-4 border-outline-variant/30" />
            <p className="font-body-md text-[14px] italic leading-relaxed text-on-surface-variant">
              &quot;效率与结果先行。作为一名拥有信息管理背景的产品经理，我热衷于通过数字化手段重构业务流程，将复杂的问题拆解为可落地、可衡量的功能模块。在AI浪潮下，我正积极探索LLM在B端场景的深度整合，为企业创造真正的提效价值。&quot;
            </p>
          </div>
        </section>

        {/* Contact */}
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
              href="mailto:yiyang.wang@example.com"
            >
              <Icon
                name="mail"
                className="rounded-lg bg-primary-container/10 p-2 text-primary"
              />
              <span className="font-medium text-on-surface-variant">yiyang.wang@example.com</span>
            </a>
            <a
              className="flex items-center gap-4 rounded-xl border border-outline-variant/30 bg-white p-3"
              href="tel:+8613800000000"
            >
              <Icon
                name="call"
                className="rounded-lg bg-primary-container/10 p-2 text-primary"
              />
              <span className="font-medium text-on-surface-variant">+86 138-0000-0000</span>
            </a>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 font-label-md text-white transition-transform active:scale-95"
              onClick={() => window.print()}
            >
              <Icon name="print" className="text-[18px]" /> 打印简历
            </button>
            <span className="text-[12px] text-outline">© 2024 王怡阳 Portfolio</span>
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
