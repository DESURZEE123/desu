import coverLiuzi from '../assets/prototype/xxx公司—单产品留资.png'
import coverXiaochengxu from '../assets/prototype/xxx公司—小程序营销.png'

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
    '产品经历中绘制的高保真原型，覆盖获客留资、小程序营销等 ToB 场景，展示已脱敏。',
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
] satisfies PrototypeItem[]
