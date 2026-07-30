const coverLiuzi =
  'https://assets-cdn-01.marketup.cn/marketup/company/659/2026/0730/cu/5026743922694145/20260730174434033-xxx%E5%85%AC%E5%8F%B8%E5%8D%95%E4%BA%A7%E5%93%81%E7%95%99%E8%B5%84b8p8yhx23juu.png'

const coverXiaochengxu =
  'https://assets-cdn-01.marketup.cn/marketup/company/659/2026/0730/cu/5026743922694145/20260730174434222-image1ud5u9rjlkp8h.png'

const coverGongzuoliu =
  'https://assets-cdn-01.marketup.cn/marketup/company/659/2026/0730/cu/5026743922694145/20260730180543058-1111bfw8pqwqda3b.png'

export type PrototypeItem = {
  id: string
  title: string
  description: string
  cover: string
  tools: string
  tags: string[]
}

export const prototypesPage = {
  title: '产品原型',
  cover: coverLiuzi,
  author: '王怡阳',
  date: '2026-07',
  description:
    '产品经历中绘制的高保真原型，覆盖获客留资、小程序营销、自动化工作流等 ToB 场景，展示已脱敏。',
}

export const prototypes = [
  {
    id: '1',
    title: 'xxx公司—单产品留资',
    description:
      '面向单产品获客场景的留资落地页与表单流程原型，梳理信息层级、转化路径与字段校验交互。',
    cover: coverLiuzi,
    tools: 'Figma · MasterGo',
    tags: ['留资', '落地页', '表单'],
  },
  {
    id: '2',
    title: 'xxx公司—小程序营销',
    description:
      '小程序端营销活动与触达链路原型，覆盖活动入口、内容分发与线索回传等关键节点。',
    cover: coverXiaochengxu,
    tools: 'Figma · MasterGo',
    tags: ['小程序', '营销', '获客'],
  },
  {
    id: '3',
    title: 'MarketUp—工作流',
    description:
      '可视化自动化工作流编排界面，支持系统事件触发、机器人通知、多分支控制与第三方应用集成。',
    cover: coverGongzuoliu,
    tools: 'Figma · MasterGo',
    tags: ['工作流', '自动化', '编排'],
  },
] satisfies PrototypeItem[]
