export const profile = {
  name: '王怡阳',
  nameEn: 'Yiyang',
  role: 'ToB 产品经理',
  roleLine: 'ToB 产品经理｜2 年工作经验',
  birth: '2001.01',
  location: '江苏南京',
  major: '信息管理与信息系统',
  phone: '18086737553',
  phoneTel: '+8618086737553',
  email: 'des65071@gmail.com',
  company: '南京弟齐信息技术有限公司',
  companyShort: '弟齐信息',
  greeting: '',
  intro:
    '我是王怡阳，一名做 ToB SaaS 的产品经理。负责 MarketUp（CRM+营销自动化）产品规划与迭代，围绕企业「获客-转化-协同」全链路持续打磨产品。',
  status: '目前在职 · 南京弟齐信息技术有限公司',
  quote:
    '具备产品需求分析、方案设计及项目推进能力，熟悉 ToB SaaS 产品设计流程，能够从业务场景出发分析问题并持续推动产品优化；逻辑思维清晰，学习能力强，责任心强，具备良好的沟通表达与团队协作能力，执行力强，能够积极推动项目落地。',
}

export const aiAgent = {
  name: 'AI Agent',
  url: 'https://chat.lulmuio.cn/',
  desc: '可调用业务系统的 AI 助手 · 在线体验',
}

export const skills = [
  {
    icon: 'hub',
    title: '核心优势',
    desc: '具备 B 端 SaaS 标准化产品经验，覆盖多行业客户，主导并推动 50+ 企业从 0 到 1 打通线索获取、培育及商机转化，具备完整的产品全生命周期管理能力。',
  },
  {
    icon: 'design_services',
    title: '专业技能',
    desc: '熟练使用 Figma、MasterGo 等工具进行产品原型设计与交互表达，通过 SQL 数据分析驱动产品迭代。',
  },
  {
    icon: 'psychology',
    title: 'AI 产品经验',
    desc: '熟练使用 Cursor、CodeX、Claude Code 等工具进行快速原型开发与功能验证，具备开发经验，有效提升个人及团队合作效率。',
  },
  {
    icon: 'groups',
    title: '协同交付',
    desc: '主导跨部门（研发、设计、运营）协作，通过敏捷迭代管理，成功交付线下活动模块 1.0。独立撰写的 PRD 被团队作为模板沿用，将需求返工率降低 20%。',
  },
]

export const experiences = [
  {
    period: '2024.06 - 至今',
    title: '产品经理',
    company: '南京弟齐信息技术有限公司',
    companyShort: '弟齐 (Digee)',
    current: true,
    description:
      '负责 ToB SaaS 产品 MarketUp（CRM+营销自动化）的产品规划与迭代，围绕企业「获客-转化-协同」全链路，主导从需求分析、方案设计到上线交付的全流程。',
    tags: ['MarketUp', 'CRM', '营销自动化'],
  },
  {
    period: '2023.06 - 2024.04',
    title: '产品助理（实习）',
    company: '百胜中国控股有限公司',
    companyShort: '百胜中国 (Yum China)',
    current: false,
    description:
      '参与餐饮数字化产品，如会员运营、订单管理、营销活动模块的需求分析与功能迭代，支持大型连锁企业的门店运营效率提升。',
    tags: ['餐饮数字化', '会员运营', '营销活动'],
  },
]

export const projects = [
  {
    title: 'MarketUp—获客推广营销系统',
    badge: '核心项目',
    badgeMobile: '从 0 到 1',
    icon: 'database',
    iconBg: 'bg-primary-container',
    iconColor: 'text-white opacity-40',
    badgeClass: 'bg-secondary-container/30 text-on-secondary-container',
    summary:
      '为企业构建一套标准化的线上获客体系，实现营销与销售协同，降低获客成本，提升获客效率与质量。',
    points: [
      '构建内容运营、活动裂变、会场互动打卡等核心获客模块，落地「千帆智汇计划」，单次活动获客成本降低 30%，全年有效获客量同比增长 35%。',
      '打通 EDM、短信、微信公众号、企微推送等渠道，通过 A/B 测试将 EDM 打开率从 8% 提升至 23%，并持续稳定在 20% 以上。',
      '设计全链路埋点方案，统一小程序、H5、官网等多端数据结构，为用户画像与自动化营销提供数据基础。',
      '搭建「基础属性+行为+兴趣」三层标签体系，支撑精准营销与分层运营，营销活动 ROI 提升 15%。',
    ],
    tags: ['获客', '全渠道触达', '用户画像'],
  },
  {
    title: 'MarketUp—CRM 线索管理系统',
    badge: '精细化运营',
    badgeMobile: '精细化运营',
    icon: 'auto_fix_high',
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary opacity-40',
    badgeClass: 'bg-surface-container-highest text-on-surface-variant',
    summary:
      '参与 MarketUp 线索模块产品设计与优化，解决中大型企业线索管理混乱、培育依赖人工经验、转化效率低下的问题。',
    points: [
      '搭建基于用户行为的自动触发工作流，实现营销与销售协同闭环。',
      '设计用户行为触发自动跟进规则，线索响应时效从平均 60 分钟提升至 30 分钟（提升 50%），营销执行效率提升 15%，线索转化率提升 22%。',
      '基于行为意向和客户画像建立评分模型，将线索分为高意向、待培育、低优先级，高意向线索识别准确率提升约 30%。',
      '通过 SQL 定期分析各阶段转化流失原因，生成周期线索报告，推动分配与跟进策略持续优化。',
    ],
    tags: ['MA', '线索评分', '销售协同'],
  },
  {
    title: 'AI Agent 与 AI 知识库',
    badge: 'AI+营销',
    badgeMobile: 'AI+营销',
    icon: 'smart_toy',
    iconBg: 'bg-primary-container',
    iconColor: 'text-white opacity-30',
    badgeClass: 'bg-primary text-white',
    demoUrl: 'https://chat.lulmuio.cn/',
    summary:
      '用 AI 把企业已有的产品、案例、行业知识和营销内容变成可生产、可分发、可追踪、可转化的内容资产，服务于 B2B 获客到销售转化的完整营销闭环。',
    points: [
      '设计 AI 内容生产：基于产品资料、客户案例等素材快速生成公众号文章、GEO 内容、EDM，单篇产出效率提升 75%（2 小时降至 30 分钟）。',
      '规划 AI 知识库：沉淀产品资料、案例、FAQ 与行业内容为结构化资产，降低 AI 幻觉风险，提升内容专业度与复用率。',
      '打造 AI Agent：支持一句话完成线索查询与分配、客户检索、内容入库、活动 ROI 分析等，CRM 模块操作效率提升 40%。',
      'AI 个性化内容推荐：在邮件场景按用户标签与行为匹配内容，点击率与转化率提升 25%。',
    ],
    tags: ['LLM', 'RAG', 'AI Agent'],
  },
]

export const education = {
  school: '',
  major: '信息管理与信息技术',
  period: '2020.09 - 2024.06',
  certificates: ['软考·软件设计师', '英语六级 (CET-6)'],
}
