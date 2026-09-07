# 统一规范样式

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 上游：L1 功能整合 Skill 输出的结构化 JSON  
> 下游：HTML 片段 → PDF 生成服务  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；样式以本文 §4.2 固定 CSS 为准，HTML 片段使用 class，禁止内联 `style`。**

---

## 一、Skill Role（技能角色）

本 Skill 接收 L1 功能整合 Skill 输出的**结构化展示数据 JSON**，按 `displayType` 分发到对应样式分支，将数据渲染为**统一样式**的 HTML 片段。

AI 在本层**仅负责样式匹配与 HTML 输出**，不修改、不计算、不补充业务数据。

---

## 二、输入数据 Schema

### 2.1 模块级结构

```json
{
  "moduleName": "模块中文名称",
  "moduleKey": "module_key",
  "blocks": []
}
```

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | :--: | ---- |
| `moduleName` | string | 是 | 模块中文标题，渲染为模块顶栏 |
| `moduleKey` | string | 是 | 模块标识，仅用于数据匹配，不输出到 HTML |
| `blocks` | array | 是 | 模块内数据块列表，按数组顺序渲染 |

### 2.2 数据块通用字段

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | :--: | ---- |
| `blockKey` | string | 是 | 数据块标识，仅用于数据匹配，不输出到 HTML |
| `label` | string | 否 | 中文展示名称；`group` / `table` 类型作为分组/表格标题 |
| `displayType` | string | 是 | 展示类型，决定走哪个样式分支（见第三节） |

### 2.3 各 displayType 数据结构

#### direct — 直接展示（键值对）

```json
{
  "blockKey": "customerName",
  "label": "客户名称",
  "displayType": "direct",
  "value": "丹阳龙江钢铁有限公司"
}
```

| 扩展字段 | 类型 | 说明 |
| -------- | ---- | ---- |
| `value` | string | 展示值；空值由 L1 传「—」 |

#### person — 人员参照

```json
{
  "blockKey": "manager",
  "label": "项目经理",
  "displayType": "person",
  "name": "蒋忠宇",
  "workNo": "001234"
}
```

- 渲染格式：仅展示 `name`；**不展示工号**（`workNo` 即使传入也忽略，L1 可不传）

#### longText — 长文本

```json
{
  "blockKey": "leasebackExplain",
  "label": "售后回租原因说明",
  "displayType": "longText",
  "value": "完整文本内容……"
}
```

- 标签与内容上下排列，内容区自动换行，不截断

#### group — 分组展示（多字段键值对区域）

```json
{
  "blockKey": "projectBaseInfo",
  "label": "项目基本信息",
  "displayType": "group",
  "columns": 4,
  "children": [
    {
      "blockKey": "customerName",
      "label": "客户名称",
      "displayType": "direct",
      "value": "丹阳龙江钢铁有限公司"
    },
    {
      "blockKey": "managerName",
      "label": "项目经理",
      "displayType": "direct",
      "value": "蒋忠宇"
    }
  ]
}
```

| 扩展字段 | 类型 | 说明 |
| -------- | ---- | ---- |
| `columns` | number | 每行展示列数，默认 `4` |
| `children` | array | 子数据块，支持 `direct` / `person` / `longText` |

> 对应页面效果：蓝色圆点 + 分组标题（如「项目基本信息」「报价信息」「参考收益率」），下方 4 列栅格排列键值对。
>
> **仅标题分组（圆点）**：`children` 为空数组时，只渲染 `report-section-title`（蓝色圆点），不输出栅格（用于实施方案报价名称 `quotName` 等**内容级**分隔标题）。
>
> **大区仅标题（蓝竖条）**：经营数据分析等模块的分区标题（如「资产规模」）须用 `sectionHeading`，**不要**用空 `group`（否则与「厂房情况」等圆点内容标题无法区分）。见下方 `sectionHeading`。

#### sectionHeading — 大区仅标题（蓝竖条）

用于模块内**分区级**仅标题，与内容标题（蓝色圆点）区分。对齐页面「资产规模 / 生产销售情况分析 / 收入分析 / 还款能力分析」。

```json
{
  "blockKey": "assetSizeTitle",
  "label": "资产规模",
  "displayType": "sectionHeading"
}
```

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `label` | string | 必填；大区标题文案 |
| `children` | — | **不传**；本类型无子节点 |

> 对应页面效果：左侧 **3px 蓝色竖条** + 加粗黑字标题（非蓝色圆点、非蓝字）。
>
> L2 渲染为 `report-section-heading`，**禁止**降级为 `report-section-title`。

#### table — 表格展示

```json
{
  "blockKey": "filingStatusDetailList",
  "label": "项目备案明细",
  "displayType": "table",
  "showIndex": true,
  "columns": [
    { "key": "projectName", "label": "项目名称", "align": "left" },
    { "key": "registeredCapacityMw", "label": "备案容量(MW)", "align": "left" },
    { "key": "actualCapacityMw", "label": "实际容量(MW)", "align": "left" }
  ],
  "rows": [
    {
      "projectName": "项目A",
      "registeredCapacityMw": "23.00",
      "actualCapacityMw": "23.00"
    }
  ],
  "summary": {
    "index": "合计 --",
    "registeredCapacityMw": "46.00",
    "actualCapacityMw": "46.00"
  },
  "emptyText": "暂无备案信息"
}
```

| 扩展字段 | 类型 | 说明 |
| -------- | ---- | ---- |
| `showIndex` | boolean | 是否展示序号列，默认 `false` |
| `columns` | array | 列定义，`key` 对应 `rows` / `summary` 中的字段 |
| `columns[].align` | string | `left`（默认）/ `center` / `right` |
| `columns[].mergeSame` | boolean | 为 `true` 时，对该列连续相同的非空值做 `rowspan` 合并（见下方说明） |
| `columns[].stackSpan` | boolean | 仅叠行宽表有效：为 `true` 时该列**不参与两两配对**，单独占一物理列且 `rowspan="2"`（跨上下两行） |
| `columns[].subKey` | string | 可选；同单元格副文案字段（如征信查询日期），渲染为主值下方一行 |
| `rows` | array | 数据行 |
| `summary` | object | 合计行；无合计时不传 |
| `emptyText` | string | `rows` 为空时的占位文案，默认「暂无数据」 |

**`mergeSame` 合并规则：**

1. 仅当 `columns[].mergeSame === true` 时生效
2. 自上而下扫描该列：连续相同且非空（非 `—` / 非空串）的单元格合并为一个 `td`
3. **标准单行表**：`rowspan = 连续行数 N`
4. **叠行宽表**：仅对 `stackSpan: true` 的列生效；`rowspan = N × 2`（每条逻辑记录占 2 个 `tr`）；配对叠放列**不**做 mergeSame
5. 被合并的后续行**不再输出**该列 `td`
6. 值变为不同、或为空占位 `—` 时，结束上一组合并并重新起算
7. 典型场景：重点指标「评估项目」；刚性负债「借款主体 / 担保主体 / 主体角色」等

**列数与布局（L2 自动判定，L1 无需传 layout）：**

| `columns.length` | 布局 | 说明 |
| :--------------: | ---- | ---- |
| ≤ 8 | 标准单行表 | 1 行表头 + 每条数据 1 行 `tr` |
| > 8 | 叠行宽表 | 2 行表头 + 每条数据 2 行 `tr`；见 §5.5.1；**单表输出，不按 16 列强制分段** |

#### empty — 空状态

```json
{
  "blockKey": "bizSource",
  "label": "业务信息来源",
  "displayType": "empty",
  "emptyText": "暂无数据"
}
```

#### measureList — 增信措施卡片列表

```json
{
  "blockKey": "creditEnhancement_0",
  "label": "增信措施",
  "displayType": "measureList",
  "emptyText": "暂无增信措施",
  "items": [
    {
      "guaranteeMethod": "保证担保",
      "guaranteeTone": "guarantee",
      "customerName": "江阴绮星水泥有限公司",
      "crdntlsType": "统一社会信用代码",
      "documentCode": "91320281142225264B"
    }
  ]
}
```

| 扩展字段 | 类型 | 说明 |
| -------- | ---- | ---- |
| `items` | array | 措施卡片列表，按接口顺序 |
| `emptyText` | string | `items` 为空时占位文案，默认「暂无增信措施」 |
| `items[].guaranteeMethod` | string | 担保方式文案（标签文字） |
| `items[].guaranteeTone` | string | `guarantee` / `mortgage` / `pledge` / `default`，决定标签色 |
| `items[].customerName` | string | 客户名称 |
| `items[].relationship` | string | 关系标签（如「实控人父母」）；空则不渲染 |
| `items[].crdntlsType` | string | 证件类型 |
| `items[].documentCode` | string | 证件代码 |
| `items[].attrs` | array | 可选；抵押/质押属性行 `{ label, value }[]` |
| `items[].collateral` | object | 可选；担保物子表，结构同 `table`（`label` / `showIndex` / `columns` / `rows`） |

#### analysisList — AI 分析结果列表

```json
{
  "blockKey": "judicial_analysis",
  "label": "项目司法分析",
  "displayType": "analysisList",
  "emptyText": "暂无分析结果",
  "items": [
    {
      "customerName": "肖令权",
      "conclusion": "## 模块七：综合评分与建议\n\n- **综合评分**：低风险"
    }
  ]
}
```

| 扩展字段 | 类型 | 说明 |
| -------- | ---- | ---- |
| `items` | array | 分析结果条目，按数组顺序 |
| `emptyText` | string | `items` 为空时占位文案，默认「暂无分析结果」 |
| `items[].customerName` | string \| null | 有值时渲染蓝色方点 + 实体标题；空则跳过标题行 |
| `items[].conclusion` | string \| null | 分析结论，**Markdown 原文**；空则结论区展示「—」 |

> L2 须将 `conclusion` 从 Markdown 转为 HTML（见 §5.8.1），写入 `report-md` 容器。**不展示** `analysisDetail`。

---

## 三、displayType 分发规则

| displayType | 适用场景 | 根容器 class | 样式章节 |
| ----------- | -------- | ------------ | -------- |
| （模块级） | 模块顶栏 + 内容区 | `report-module` | §5.1 |
| `direct` | 文本 / 数值 / 枚举单值 | `report-kv` | §5.2 |
| `person` | 人员参照 | `report-kv` | §5.2 |
| `longText` | 长文本说明 | `report-longtext` | §5.3 |
| `group` | 分组多字段区域 | `report-group` | §5.4 |
| `sectionHeading` | 大区仅标题（蓝竖条） | `report-section-heading` | §5.4.1 |
| `table` | 列表 / 明细 / 合计（≤8 列） | `report-table-block` | §5.5 |
| `table`（`columns.length > 8`） | 叠行宽表 | `report-table report-table--stacked` | §5.5.1 |
| `empty` | 无数据占位 | `report-empty` | §5.6 |
| `measureList` | 增信措施卡片列表 | `report-measure-list` | §5.7 |
| `analysisList` | AI 分析结果（结论 Markdown） | `report-analysis-list` | §5.8 |

> **列数规则**：`columns.length ≤ 8` 走标准单行表格（§5.5）；`> 8` 走叠行表格（§5.5.1），同一逻辑记录占 2 行。叠行时物理列数**不**限制为最多 8 列，**不**因超过 16 逻辑列再拆成多张子表。

---

## 四、设计 Token 与固定 CSS

### 4.1 设计 Token

| Token | 值 | 用途 |
| ----- | -- | ---- |
| `--color-primary` | `#1677FF` | 分组标题、强调色 |
| `--color-title-bg` | `#E8F3FF` | 模块顶栏背景 |
| `--color-text` | `#1D2129` | 字段值 |
| `--color-label` | `#86909C` | 字段名 |
| `--color-border` | `#E5E6EB` | 表格边框、分隔线 |
| `--color-table-head-bg` | `#F7F8FA` | 表头背景 |
| `--color-table-summary-bg` | `#FAFBFC` | 合计行背景 |
| `--font-size-base` | `14px` | 正文 |
| `--font-size-module` | `16px` | 模块标题 |
| `--font-size-group` | `14px` | 分组标题 |
| `--line-height` | `22px` | 行高 |
| `--color-tag-guarantee` | `#FF7D00` | 保证担保标签 |
| `--color-tag-mortgage` | `#3491FA` | 抵押担保标签 |
| `--color-tag-pledge` | `#FF9A2E` | 质押担保标签 |
| `--color-tag-default` | `#86909C` | 其他担保方式标签 |
| `--color-rel-tag` | `#00B42A` | 关系标签边框/文字 |
| `--color-rel-tag-bg` | `#E8FFEA` | 关系标签背景 |
| `--color-measure-card-bg` | `#F7F9FC` | 增信措施卡片背景 |
| `--color-analysis-card-bg` | `#F7F8FA` | AI 分析结论卡片背景 |
| `--color-analysis-entity` | `#1677FF` | AI 分析实体标题 |

### 4.2 固定样式表（L2 唯一 CSS 来源）

L0 汇总 HTML 时，在**所有模块片段之前**输出一次下方 `<style>` 块；**不**新建独立 `.css` 文件，**不**在元素上写内联 `style`。

```html
<style>
  /* ===== 报告根容器（可选，包裹全部模块） ===== */
  .report-root {
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }

  /* ===== 模块容器 ===== */
  .report-module {
    margin-bottom: 24px;
  }
  .report-module__header {
    background: #E8F3FF;
    padding: 10px 16px;
    font-size: 16px;
    font-weight: 600;
    color: #1D2129;
    border-radius: 4px 4px 0 0;
  }
  .report-module__body {
    padding: 16px;
    border: 1px solid #E5E6EB;
    border-top: none;
    border-radius: 0 0 4px 4px;
  }

  /* ===== 通用 block 间距 ===== */
  .report-block {
    margin-bottom: 20px;
  }

  /* ===== 分组 / 表格 / 空状态 — 蓝色圆点标题 ===== */
  .report-section-title {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }
  .report-section-title__dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #1677FF;
    margin-right: 8px;
  }
  .report-section-title__text {
    font-size: 14px;
    font-weight: 600;
    color: #1677FF;
  }

  /* ===== 大区仅标题 — 蓝色竖条（与圆点内容标题区分） ===== */
  .report-section-heading {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    padding-left: 10px;
    border-left: 3px solid #1677FF;
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
    line-height: 22px;
  }

  /* ===== direct / person — 键值对 ===== */
  .report-kv {
    display: flex;
    font-size: 14px;
    line-height: 22px;
  }
  .report-kv__label {
    color: #86909C;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .report-kv__value {
    color: #1D2129;
    font-weight: 500;
    word-break: break-all;
  }

  /* ===== longText — 长文本 ===== */
  .report-longtext {
    margin-bottom: 16px;
  }
  .report-longtext__label {
    color: #86909C;
    font-size: 14px;
    margin-bottom: 8px;
  }
  .report-longtext__value {
    color: #1D2129;
    font-size: 14px;
    line-height: 22px;
    white-space: pre-wrap;
    word-break: break-all;
  }

  /* ===== group — 分组栅格 ===== */
  .report-grid {
    display: flex;
    flex-wrap: wrap;
  }
  .report-grid__cell {
    padding-right: 16px;
    box-sizing: border-box;
    margin-bottom: 12px;
  }
  .report-grid__cell--w-25 { width: 25%; }
  .report-grid__cell--w-33 { width: 33.33%; }
  .report-grid__cell--w-50 { width: 50%; }
  .report-grid__cell--w-100 { width: 100%; }

  /* ===== table — 表格 ===== */
  .report-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .report-table thead tr {
    background: #F7F8FA;
  }
  .report-table th,
  .report-table td {
    padding: 10px 12px;
    border: 1px solid #E5E6EB;
    color: #1D2129;
    word-break: break-all;
  }
  .report-table th {
    text-align: left;
    font-weight: 600;
  }
  .report-table__summary-row {
    background: #FAFBFC;
  }
  .report-table__cell--strong {
    font-weight: 600;
  }
  .report-table__cell--align-center {
    text-align: center;
  }
  .report-table__cell--align-right {
    text-align: right;
  }
  .report-table__img {
    max-width: 120px;
    max-height: 120px;
    display: block;
  }
  .report-table-empty {
    padding: 24px;
    text-align: center;
    color: #86909C;
    font-size: 14px;
    border: 1px dashed #E5E6EB;
    border-radius: 4px;
  }

  /* ===== table — 叠行宽表（columns > 8） ===== */
  .report-table--stacked thead tr {
    background: #F7F8FA;
  }
  .report-table--stacked .report-table__head-row--bottom th {
    border-top: none;
    font-weight: 600;
  }
  .report-table--stacked .report-table__stack-label {
    display: block;
    font-weight: 600;
    color: #1D2129;
    line-height: 20px;
  }
  .report-table--stacked .report-table__stack-value {
    display: block;
    color: #1D2129;
    line-height: 20px;
    word-break: break-all;
  }
  .report-table--stacked .report-table__data-row--top td {
    border-bottom: none;
    vertical-align: bottom;
  }
  .report-table--stacked .report-table__data-row--bottom td {
    vertical-align: top;
  }
  .report-table--stacked .report-table__record-divider td {
    border-bottom: 2px solid #E5E6EB;
  }
  .report-table--stacked .report-table__summary-row--top td {
    border-bottom: none;
    background: #FAFBFC;
  }
  .report-table--stacked .report-table__summary-row--bottom td {
    background: #FAFBFC;
  }
  .report-table--stacked .report-table__index-cell {
    vertical-align: middle;
    text-align: center;
  }
  .report-table td[rowspan]:not(.report-table__index-cell) {
    vertical-align: middle;
    text-align: center;
  }
  .report-table--stacked .report-table__span-cell {
    vertical-align: middle !important;
    text-align: center;
  }
  .report-table td[rowspan]:not(.report-table__index-cell) {
    vertical-align: middle;
    text-align: center;
  }
  .report-table__entity-sub {
    display: block;
    color: #86909C;
    font-size: 12px;
    line-height: 18px;
    font-weight: 400;
    text-align: center;
  }
  .report-table--stacked + .report-table--stacked {
    margin-top: 16px;
  }

  /* ===== empty — 空状态 ===== */
  .report-empty__placeholder {
    padding: 24px;
    text-align: center;
    color: #86909C;
    font-size: 14px;
    border: 1px dashed #E5E6EB;
    border-radius: 4px;
  }

  /* ===== measureList — 增信措施卡片 ===== */
  .report-measure-list__items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .report-measure-card {
    background: #F7F9FC;
    border: 1px solid #E5E6EB;
    border-radius: 4px;
    padding: 12px 16px;
  }
  .report-measure-card__head {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    line-height: 22px;
  }
  .report-measure-card__tag {
    display: inline-block;
    padding: 0 8px;
    height: 22px;
    line-height: 22px;
    border-radius: 2px;
    font-size: 12px;
    font-weight: 500;
    color: #FFFFFF;
    flex-shrink: 0;
  }
  .report-measure-card__tag--guarantee { background: #FF7D00; }
  .report-measure-card__tag--mortgage { background: #3491FA; }
  .report-measure-card__tag--pledge { background: #FF9A2E; }
  .report-measure-card__tag--default { background: #86909C; }
  .report-measure-card__name {
    font-size: 14px;
    font-weight: 500;
    color: #1677FF;
  }
  .report-measure-card__rel {
    display: inline-block;
    padding: 0 6px;
    height: 20px;
    line-height: 18px;
    border: 1px solid #00B42A;
    border-radius: 2px;
    background: #E8FFEA;
    color: #00B42A;
    font-size: 12px;
    flex-shrink: 0;
  }
  .report-measure-card__id {
    font-size: 14px;
    color: #4E5969;
  }
  .report-measure-card__attrs {
    display: flex;
    flex-wrap: wrap;
    margin-top: 10px;
    gap: 8px 24px;
  }
  .report-measure-card__attr {
    display: flex;
    font-size: 14px;
    line-height: 22px;
  }
  .report-measure-card__attr-label {
    color: #86909C;
    white-space: nowrap;
  }
  .report-measure-card__attr-value {
    color: #1D2129;
    font-weight: 500;
  }
  .report-measure-card__collateral {
    margin-top: 12px;
  }
  .report-measure-card__collateral-title {
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
    margin-bottom: 8px;
  }
  .report-measure-card__collateral-title::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #1D2129;
    margin-right: 8px;
  }
  /* 担保物表：表头与单元格统一左对齐 */
  .report-measure-card__collateral .report-table th,
  .report-measure-card__collateral .report-table td {
    text-align: left;
  }

  /* ===== analysisList — AI 分析结果 ===== */
  .report-analysis-list__items {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .report-analysis-item__entity {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }
  .report-analysis-item__entity-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #1677FF;
    margin-right: 8px;
    flex-shrink: 0;
  }
  .report-analysis-item__entity-name {
    font-size: 14px;
    font-weight: 600;
    color: #1677FF;
    line-height: 22px;
  }
  .report-analysis-item__conclusion {
    background: #F7F8FA;
    border: 1px solid #E5E6EB;
    border-radius: 4px;
    padding: 12px 16px;
  }
  .report-analysis-item__empty {
    color: #86909C;
    font-size: 14px;
    line-height: 22px;
  }

  /* ===== Markdown 渲染容器 ===== */
  .report-md {
    color: #1D2129;
    font-size: 14px;
    line-height: 22px;
    word-break: break-all;
  }
  .report-md > *:first-child { margin-top: 0; }
  .report-md > *:last-child { margin-bottom: 0; }
  .report-md h1,
  .report-md h2,
  .report-md h3,
  .report-md h4,
  .report-md h5,
  .report-md h6 {
    color: #1D2129;
    font-weight: 600;
    margin: 12px 0 8px;
    line-height: 24px;
  }
  .report-md h1 { font-size: 16px; }
  .report-md h2 { font-size: 15px; }
  .report-md h3 { font-size: 14px; }
  .report-md h4,
  .report-md h5,
  .report-md h6 { font-size: 14px; }
  .report-md p {
    margin: 0 0 8px;
  }
  .report-md ul,
  .report-md ol {
    margin: 0 0 8px;
    padding-left: 1.5em;
  }
  .report-md li {
    margin-bottom: 4px;
  }
  .report-md li > ul,
  .report-md li > ol {
    margin-top: 4px;
    margin-bottom: 0;
  }
  .report-md strong { font-weight: 600; }
  .report-md em { font-style: italic; }
  .report-md blockquote {
    margin: 8px 0;
    padding: 8px 12px;
    border-left: 3px solid #E5E6EB;
    color: #4E5969;
    background: #FAFBFC;
  }
  .report-md hr {
    border: none;
    border-top: 1px solid #E5E6EB;
    margin: 12px 0;
  }
  .report-md code {
    font-family: Menlo, Consolas, monospace;
    font-size: 12px;
    background: #F2F3F5;
    padding: 1px 4px;
    border-radius: 2px;
  }
  .report-md pre {
    background: #F7F8FA;
    border: 1px solid #E5E6EB;
    border-radius: 4px;
    padding: 10px 12px;
    overflow-x: auto;
    margin: 8px 0;
  }
  .report-md pre code {
    background: none;
    padding: 0;
  }
  .report-md table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    margin: 8px 0 12px;
  }
  .report-md th,
  .report-md td {
    padding: 8px 10px;
    border: 1px solid #E5E6EB;
    color: #1D2129;
    word-break: break-all;
    text-align: left;
  }
  .report-md th {
    background: #F7F8FA;
    font-weight: 600;
  }
</style>
```

### 4.3 displayType → class 速查

| displayType | HTML 结构要点 | 主要 class |
| ----------- | ------------- | ---------- |
| 模块 | 顶栏 + 内容区 | `report-module` / `report-module__header` / `report-module__body` |
| `direct` / `person` | 字段名 + 值 | `report-kv` / `report-kv__label` / `report-kv__value` |
| `longText` | 标签 + 全文 | `report-longtext` / `report-longtext__label` / `report-longtext__value` |
| `group` | 圆点标题 + 栅格 | `report-block` + `report-section-title` + `report-grid` + `report-grid__cell--w-*` |
| `sectionHeading` | 蓝竖条大区标题 | `report-block` + `report-section-heading` |
| `table` | 圆点标题 + 表格 | `report-table-block` + `report-table` |
| `table`（>8 列） | 叠行宽表 | `report-table report-table--stacked` + `report-table__head-row--*` / `report-table__data-row--*` |
| `table` 空数据 | 虚线占位 | `report-table-empty` |
| `table` 合计行（≤8 列） | tbody 末行 | `report-table__summary-row` / `report-table__cell--strong` |
| `table` 合计行（>8 列） | tbody 末 2 行 | `report-table__summary-row--top` / `--bottom` |
| `empty` | 圆点标题 + 占位 | `report-empty` + `report-empty__placeholder` |
| `measureList` | 圆点标题 + 卡片列表 | `report-measure-list` + `report-measure-card` |
| `analysisList` | 圆点标题 + 实体项 + Markdown | `report-analysis-list` + `report-analysis-item` + `report-md` |

**栅格列宽 class 映射：**

| `columns` | 栅格 cell class |
| --------- | --------------- |
| 4（默认） | `report-grid__cell--w-25` |
| 3 | `report-grid__cell--w-33` |
| 2 | `report-grid__cell--w-50` |
| 1 | `report-grid__cell--w-100` |

**表格对齐 class 映射：**

| `columns[].align` | th / td 附加 class |
| ----------------- | ------------------ |
| `left`（默认） | （无） |
| `center` | `report-table__cell--align-center` |
| `right` | `report-table__cell--align-right` |

---

## 五、HTML 结构规范（class 版）

### 5.1 模块容器

每个模块输出一个独立 `div`：

```html
<div class="report-module" data-module-key="project_base_info">
  <div class="report-module__header">基本信息</div>
  <div class="report-module__body">
    <!-- blocks 渲染结果 -->
  </div>
</div>
```

- `data-module-key` 取 `moduleKey`，便于调试，PDF 中可保留或省略
- `moduleName` 渲染为 `report-module__header` 文字，**不输出** `moduleKey`

### 5.2 键值对（direct / person）

单行结构：`字段名：字段值`，用于 `group` 的 `children` 内或独立 `direct` 块。

```html
<div class="report-kv">
  <span class="report-kv__label">客户名称：</span>
  <span class="report-kv__value">丹阳龙江钢铁有限公司</span>
</div>
```

**人员参照（person）值格式：**

| 条件 | 渲染值 |
| ---- | ------ |
| `name` 有值 | `姓名` |
| `name` 为空 | `—` |

> 工号（`workNo`）不参与 PDF 展示。HTML 结构与 `direct` 相同，均使用 `report-kv`。

**数值格式（L1 已格式化后传入，L2 原样展示）：**

| 类型 | 格式 |
| ---- | ---- |
| 金额 | 千分位 + 两位小数，如 `102,843,100.00` |
| 百分比 | 四位小数 + `%`，如 `2.8431%` |
| 容量 MW | 两位小数，如 `23.00` |
| 电价 元/度 | 四位小数，如 `0.6500` |

### 5.3 长文本（longText）

**独立 block：**

```html
<div class="report-block report-longtext">
  <div class="report-longtext__label">售后回租原因说明：</div>
  <div class="report-longtext__value">完整文本内容……</div>
</div>
```

**作为 `group.children` 子项时**，外层包一层 `report-grid__cell report-grid__cell--w-100`：

```html
<div class="report-grid__cell report-grid__cell--w-100">
  <div class="report-longtext">
    <div class="report-longtext__label">租赁物保险：</div>
    <div class="report-longtext__value">符合公司保险政策……</div>
  </div>
</div>
```

### 5.4 分组栅格（group）

```html
<div class="report-block report-group">
  <div class="report-section-title">
    <span class="report-section-title__dot"></span>
    <span class="report-section-title__text">项目基本信息</span>
  </div>
  <div class="report-grid">
    <div class="report-grid__cell report-grid__cell--w-25">
      <div class="report-kv">
        <span class="report-kv__label">客户名称：</span>
        <span class="report-kv__value">丹阳龙江钢铁有限公司</span>
      </div>
    </div>
    <!-- 其余 children … -->
  </div>
</div>
```

- `children` 按数组顺序从左到右、从上到下填充栅格
- `longText` 子项使用 `report-grid__cell--w-100`
- `children` 为空或不传时：只输出小节标题（**蓝色圆点**），不输出 `.report-grid`

### 5.4.1 大区仅标题（sectionHeading）

```html
<div class="report-block">
  <div class="report-section-heading">资产规模</div>
</div>
```

- 仅输出蓝竖条大标题，无栅格、无子内容
- 用于经营数据分析等模块的分区标题；下属内容块（如「厂房情况」）仍用各自 displayType 的圆点标题
- **禁止**用空 `group` 冒充本类型

### 5.5 表格（table · 标准单行 · columns ≤ 8）

```html
<div class="report-block report-table-block">
  <div class="report-section-title">
    <span class="report-section-title__dot"></span>
    <span class="report-section-title__text">项目备案明细</span>
  </div>
  <table class="report-table">
    <thead>
      <tr>
        <th>序号</th>
        <th>项目名称</th>
        <!-- 其余 columns（columns 数组 ≤ 8；showIndex 序号列另计） -->
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>项目A</td>
      </tr>
      <tr class="report-table__summary-row">
        <td class="report-table__cell--strong">合计 --</td>
        <td>—</td>
        <td class="report-table__cell--strong">46.00</td>
      </tr>
    </tbody>
  </table>
</div>
```

**标准单行表格规则：**

| 规则 | 说明 |
| ---- | ---- |
| 触发条件 | `columns.length ≤ 8` |
| 结构 | 必须包含 `thead` + `tbody`，合计行放在 `tbody` 最后一行 |
| 序号列 | `showIndex: true` 时，首列为自增序号（从 1 开始）；**不计入** 8 列上限 |
| 表头 | 取 `columns[].label`，**不输出** `columns[].key` |
| 数据行 | `rows` 中每个对象对应一行 `tr`，按 `columns[].key` 取值 |
| 同值合并 | `columns[].mergeSame === true` 时，对该列连续相同非空值输出 `rowspan`（见 §2.3）；垂直居中可用默认 `td` 对齐 |
| 合计行 | `summary` 存在时渲染；`summary.index` 默认为「合计 --」；数值列加 `report-table__cell--strong` |
| 空数据 | `rows` 为空时，不渲染 `table`，改为 `report-table-empty` |
| 对齐 | 按 §4.3 映射附加 align class |
| 图片单元格 | 使用 `<img class="report-table__img" …>` |

### 5.5.1 表格（table · 叠行宽表 · columns > 8）

当逻辑列超过 8 列时，L2 在**同一个** `report-table-block` 内渲染**一张**叠行宽表（表头 2 行、每条数据 2 行）。**禁止**因列过多再拆成多个子表（避免末列如「是否与征信重复」单独成表）。

**列布局规则：**

1. 将 `columns` 分为两类（保持原数组相对顺序）：
   - **跨行固定列**（`stackSpan: true`）：单独占一物理列，表头 / 单元格均 `rowspan="2"`
   - **配对叠放列**（其余）：按出现顺序**两两配对**为物理列（上行 / 下行）
2. 配对时**不限制**物理列上限（可超过 8）；末列落单时上行填该列、下行填「—」
3. `showIndex: true` 时序号列为最左跨行固定列（不计入 `columns.length`）

```text
示例（含 stackSpan）：
序号(跨行) | 借款主体(跨行) | 主体角色(跨行) | 业务类型↑/机构编码↓ | 授信机构↑/借款金额↓ | … | 是否与征信重复↑/—↓
```

**HTML 结构（节选 · 含跨行固定列）：**

```html
<table class="report-table report-table--stacked">
  <thead>
    <tr class="report-table__head-row--top">
      <th rowspan="2">序号</th>
      <th rowspan="2">借款主体</th>
      <th rowspan="2">主体角色</th>
      <th><span class="report-table__stack-label">业务类型</span></th>
      <th><span class="report-table__stack-label">授信机构</span></th>
    </tr>
    <tr class="report-table__head-row--bottom">
      <th><span class="report-table__stack-label">机构编码</span></th>
      <th><span class="report-table__stack-label">借款金额(元)</span></th>
    </tr>
  </thead>
  <tbody>
    <tr class="report-table__data-row--top">
      <td rowspan="2" class="report-table__index-cell">1</td>
      <td rowspan="4" class="report-table__span-cell">
        连云港惟美数智家居科技有限公司
        <span class="report-table__entity-sub">（征信查询日期: 2024-08-27）</span>
      </td>
      <td rowspan="4" class="report-table__span-cell">承租人</td>
      <td><span class="report-table__stack-value">融资型租赁</span></td>
      <td><span class="report-table__stack-value">—</span></td>
    </tr>
    <tr class="report-table__data-row--bottom report-table__record-divider">
      <td><span class="report-table__stack-value">本机构</span></td>
      <td><span class="report-table__stack-value">2,628,700.00</span></td>
    </tr>
    <!-- 同主体第 2 条：不再输出已合并的借款主体 / 主体角色 td；序号仍为 2 -->
  </tbody>
</table>
```

**叠行宽表规则：**

| 规则 | 说明 |
| ---- | ---- |
| 触发条件 | `columns.length > 8` |
| 表格 class | `report-table report-table--stacked` |
| 单表输出 | 无论列数多少，同一 block **只输出一张**叠行表 |
| 跨行固定列 | `stackSpan: true`：th/td `rowspan="2"`（单条记录）；若同时 `mergeSame`，则 `rowspan = 连续相同记录数 × 2`；内容**水平+垂直居中**（`report-table__span-cell`） |
| 配对叠放列 | 非 `stackSpan` 列两两配对；物理列数不封顶 |
| 副文案 | 有 `subKey` 时，主值下方追加 `report-table__entity-sub`（如征信查询日期） |
| 序号 | `showIndex: true` 时每条记录仍各自编号，`rowspan="2"`，**不**与主体合并 |
| 合计行 | 有 `summary` 时占 2 行；跨行固定列在合计行输出对应值或 `—`（`rowspan="2"`） |
| 空数据 / 对齐 / 图片 | 同 §5.5 |

> L1 仍输出**一个** `displayType: "table"` block 及完整 `columns` / `rows`；叠行、跨行固定列与合并由 L2 完成。

### 5.6 空状态（empty）

```html
<div class="report-block report-empty">
  <div class="report-section-title">
    <span class="report-section-title__dot"></span>
    <span class="report-section-title__text">业务信息来源</span>
  </div>
  <div class="report-empty__placeholder">暂无数据</div>
</div>
```

### 5.7 增信措施卡片列表（measureList）

```html
<div class="report-block report-measure-list">
  <div class="report-section-title">
    <span class="report-section-title__dot"></span>
    <span class="report-section-title__text">增信措施</span>
  </div>
  <div class="report-measure-list__items">
    <!-- 保证担保 · 企业 -->
    <div class="report-measure-card">
      <div class="report-measure-card__head">
        <span class="report-measure-card__tag report-measure-card__tag--guarantee">保证担保</span>
        <span class="report-measure-card__name">江阴绮星水泥有限公司</span>
        <span class="report-measure-card__id">统一社会信用代码：91320281142225264B</span>
      </div>
    </div>
    <!-- 保证担保 · 个人 + 关系标签 -->
    <div class="report-measure-card">
      <div class="report-measure-card__head">
        <span class="report-measure-card__tag report-measure-card__tag--guarantee">保证担保</span>
        <span class="report-measure-card__name">肖令权</span>
        <span class="report-measure-card__rel">实控人父母</span>
        <span class="report-measure-card__id">居民身份证：51222219750923425X</span>
      </div>
    </div>
    <!-- 抵押 / 质押：属性行 + 担保物表（列数 > 8 走叠行） -->
    <div class="report-measure-card">
      <div class="report-measure-card__head">…</div>
      <div class="report-measure-card__attrs">
        <div class="report-measure-card__attr">
          <span class="report-measure-card__attr-label">抵押物类别：</span>
          <span class="report-measure-card__attr-value">其他</span>
        </div>
        <!-- 其余 attrs … -->
      </div>
      <div class="report-measure-card__collateral">
        <div class="report-measure-card__collateral-title">担保物</div>
        <table class="report-table report-table--stacked">…</table>
      </div>
    </div>
  </div>
</div>
```

**measureList 规则：**

| 规则 | 说明 |
| ---- | ---- |
| 标题 | 有 `label` 时输出 `report-section-title` |
| 空数据 | `items` 为空 / 不传时，输出 `report-table-empty`（文案取 `emptyText`） |
| 担保方式标签 | `guaranteeTone` → `report-measure-card__tag--{tone}`；缺省 `default` |
| 关系标签 | 仅当 `relationship` 有值时输出 `report-measure-card__rel` |
| 证件行 | 渲染为 `{crdntlsType}：{documentCode}`；任一空则该段用 `—` |
| 属性行 | 有 `attrs` 时输出；按数组顺序横向换行 |
| 担保物表 | 有 `collateral` 时输出；内部表格渲染规则同 §5.5 / §5.5.1；**表头与单元格统一左对齐**（CSS：`.report-measure-card__collateral .report-table th, td { text-align: left }`） |
| 禁止 | **不输出**企业/个人 icon、SVG、知识图谱、编辑、删除等交互控件 |

### 5.8 AI 分析结果列表（analysisList）

```html
<div class="report-block report-analysis-list">
  <div class="report-section-title">
    <span class="report-section-title__dot"></span>
    <span class="report-section-title__text">项目司法分析</span>
  </div>
  <div class="report-analysis-list__items">

    <!-- 有客户名称 -->
    <div class="report-analysis-item">
      <div class="report-analysis-item__entity">
        <span class="report-analysis-item__entity-dot"></span>
        <span class="report-analysis-item__entity-name">肖令权</span>
      </div>
      <div class="report-analysis-item__conclusion">
        <div class="report-md">
          <h2>模块七：综合评分与建议</h2>
          <ul>
            <li><strong>综合评分</strong>：低风险</li>
            <li><strong>风险等级</strong>：低风险</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 无客户名称（如项目流水分析） -->
    <div class="report-analysis-item">
      <div class="report-analysis-item__conclusion">
        <div class="report-md">
          <p><strong>流水分析结论：</strong>该承租人仅提供……</p>
        </div>
      </div>
    </div>

    <!-- 结论为空 -->
    <div class="report-analysis-item">
      <div class="report-analysis-item__entity">…</div>
      <div class="report-analysis-item__conclusion">
        <div class="report-analysis-item__empty">—</div>
      </div>
    </div>

  </div>
</div>
```

**analysisList 规则：**

| 规则 | 说明 |
| ---- | ---- |
| 分组标题 | 始终输出 `report-section-title`，文案取 `label` |
| 空列表 | `items` 为空时输出 `report-table-empty`（文案取 `emptyText`） |
| 实体标题 | 仅当 `customerName` 非空时输出蓝色方点 + 名称 |
| 结论区 | 始终输出 `report-analysis-item__conclusion` 灰底卡片；有 Markdown 则渲染进 `report-md`，否则「—」 |
| 详情 | **不展示** `analysisDetail`；**禁止**输出「查看详情」链接、折叠、弹窗等交互控件 |
| Markdown | 见 §5.8.1 |

### 5.8.1 Markdown → HTML 转换规则

L2 将 `conclusion` 的 Markdown 原文转为 HTML，包裹在 `<div class="report-md">` 内：

| Markdown | HTML |
| -------- | ---- |
| `#` ~ `######` | `h1` ~ `h6` |
| 段落 | `p` |
| `-` / `*` / `1.` 列表 | `ul` / `ol` + `li` |
| `**text**` / `__text__` | `strong` |
| `*text*` / `_text_` | `em` |
| `` `code` `` | `code` |
| 围栏代码块 | `pre` > `code` |
| `>` 引用 | `blockquote` |
| `---` | `hr` |
| GFM 表格 | `table` > `thead` / `tbody` > `tr` > `th` / `td` |
| 裸链接 | 转义为文本（PDF 不做外链跳转） |

**安全与约束：**

1. 输出纯语义标签，**禁止**内联 `style`、`script`、事件属性
2. HTML 特殊字符须转义（`<` `>` `&` `"`），避免注入
3. 不保留原始 Markdown 源码到 HTML 文本节点
4. 表格样式使用 `.report-md table`（§4.2），**不**改用 `report-table` class（避免与业务表规则混淆）

---

## 六、渲染流程

```text
输入 JSON（可多模块数组）
  │
  ├─ 1. 输出 §4.2 固定 <style> 块（整份报告仅一次）
  │
  ├─ 2. 可选：包裹 <div class="report-root">
  │
  ├─ 3. 按 moduleIndex 遍历模块：
  │     ├─ 输出 report-module 容器 + 顶栏（§5.1）
  │     └─ 遍历 blocks，按 displayType 分发：
  │           ├─ direct / person  → §5.2
  │           ├─ longText         → §5.3
  │           ├─ group            → §5.4（递归渲染 children）
  │           ├─ sectionHeading   → §5.4.1（蓝竖条大区仅标题）
  │           ├─ table            → §5.5（≤8 列）或 §5.5.1（>8 列）
  │           ├─ empty            → §5.6
  │           ├─ measureList      → §5.7
  │           └─ analysisList     → §5.8（Markdown → §5.8.1）
  │
  └─ 4. 闭合容器，输出 HTML 片段
```

---

## 七、输出约束

1. **不修改数据**：L2 仅按 JSON 原样渲染，不做格式化计算（格式化由 L1 完成）
2. **空值统一**：字段值为空、`null`、空字符串时，统一渲染为「—」
3. **中文展示**：HTML 中只出现 `label` 和展示值，**不出现** `blockKey`、`moduleKey`、`columns[].key` 等英文字段名
4. **片段输出**：输出 `style` + `div` / `table` / `thead` / `tbody` / `tr` / `th` / `td` / `span` / `img` 等语义标签；模块片段**不包含**完整文档级 `html` / `head` / `body`（PDF 服务可自行包裹）
5. **禁止内联样式**：元素上**不得**写 `style` 属性；样式仅来自 §4.2 固定 CSS + class
6. **禁止外部 CSS 文件**：不引用独立 `.css` 文件
7. **顺序保持**：`blocks` 和 `children` 按数组顺序渲染

---

## 八、完整示例

### 8.1 输入 JSON（项目基本信息 · 通用大单）

```json
{
  "moduleName": "基本信息",
  "moduleKey": "project_base_info",
  "blocks": [
    {
      "blockKey": "projectBaseInfo",
      "label": "项目基本信息",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "customerName", "label": "客户名称", "displayType": "direct", "value": "丹阳龙江钢铁有限公司" },
        { "blockKey": "leaseCategry", "label": "融资形式", "displayType": "direct", "value": "融资租赁" },
        { "blockKey": "capitalUse", "label": "资金用途", "displayType": "direct", "value": "购置本次租赁物" },
        { "blockKey": "deptName", "label": "业务部门", "displayType": "direct", "value": "产业金融事业部" },
        { "blockKey": "managerName", "label": "项目经理", "displayType": "direct", "value": "蒋忠宇" },
        { "blockKey": "custHelpName", "label": "项目协办人", "displayType": "direct", "value": "张三" },
        { "blockKey": "projectSource", "label": "项目来源", "displayType": "direct", "value": "自主营销" },
        { "blockKey": "isOnetoone", "label": "是否单个报价", "displayType": "direct", "value": "是" },
        { "blockKey": "isInsure", "label": "是否投保", "displayType": "direct", "value": "是" },
        { "blockKey": "greenIndustry", "label": "项目绿色投向", "displayType": "direct", "value": "—" },
        { "blockKey": "projectType", "label": "项目类型", "displayType": "direct", "value": "普通项目" },
        { "blockKey": "reviewDept", "label": "评审部门", "displayType": "direct", "value": "—" }
      ]
    },
    {
      "blockKey": "filingStatusDetailList",
      "label": "项目备案明细",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "projectName", "label": "项目名称" },
        { "key": "registeredCapacityMw", "label": "备案容量(MW)" },
        { "key": "actualCapacityMw", "label": "实际容量(MW)" }
      ],
      "rows": [
        {
          "projectName": "测试项目",
          "registeredCapacityMw": "23.00",
          "actualCapacityMw": "23.00"
        }
      ],
      "summary": {
        "index": "合计 --",
        "registeredCapacityMw": "23.00",
        "actualCapacityMw": "23.00"
      },
      "emptyText": "暂无备案信息"
    }
  ]
}
```

### 8.2 对应 HTML 片段（节选）

```html
<style>
  /* … 完整内容见 §4.2 … */
</style>

<div class="report-root">
  <div class="report-module" data-module-key="project_base_info">
    <div class="report-module__header">基本信息</div>
    <div class="report-module__body">

      <div class="report-block report-group">
        <div class="report-section-title">
          <span class="report-section-title__dot"></span>
          <span class="report-section-title__text">项目基本信息</span>
        </div>
        <div class="report-grid">
          <div class="report-grid__cell report-grid__cell--w-25">
            <div class="report-kv">
              <span class="report-kv__label">客户名称：</span>
              <span class="report-kv__value">丹阳龙江钢铁有限公司</span>
            </div>
          </div>
          <!-- 其余 children … -->
        </div>
      </div>

      <div class="report-block report-table-block">
        <div class="report-section-title">
          <span class="report-section-title__dot"></span>
          <span class="report-section-title__text">项目备案明细</span>
        </div>
        <table class="report-table">
          <thead>
            <tr>
              <th>序号</th>
              <th>项目名称</th>
              <th>备案容量(MW)</th>
              <th>实际容量(MW)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>测试项目</td>
              <td>23.00</td>
              <td>23.00</td>
            </tr>
            <tr class="report-table__summary-row">
              <td class="report-table__cell--strong">合计 --</td>
              <td>—</td>
              <td class="report-table__cell--strong">23.00</td>
              <td class="report-table__cell--strong">23.00</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</div>
```

### 8.3 对应页面结构（示意）

```text
┌─────────────────────────────────────────────┐
│  基本信息                          （蓝底顶栏）  │
├─────────────────────────────────────────────┤
│  ● 项目基本信息                               │
│  ┌──────────┬──────────┬──────────┬────────┐ │
│  │客户名称：  │融资形式：  │资金用途：  │业务部门： │ │
│  │丹阳龙江…  │融资租赁   │购置本次…  │产业金融… │ │
│  └──────────┴──────────┴──────────┴────────┘ │
│                                               │
│  ● 项目备案明细                               │
│  ┌────┬────────┬──────────┬──────────┐        │
│  │序号 │项目名称  │备案容量   │实际容量   │        │
│  ├────┼────────┼──────────┼──────────┤        │
│  │ 1  │测试项目  │23.00     │23.00     │        │
│  ├────┼────────┼──────────┼──────────┤        │
│  │合计--│—       │23.00     │23.00     │        │
│  └────┴────────┴──────────┴──────────┘        │
└─────────────────────────────────────────────┘
```

---

## 九、displayType 速查

| displayType | 一句话 | 关键 class |
| ----------- | ------ | ---------- |
| `direct` | 字段名：字段值 | `report-kv` / `report-kv__label` / `report-kv__value` |
| `person` | 字段名：姓名 | 同 `direct` |
| `longText` | 字段名 + 换行全文 | `report-longtext` / `report-longtext__label` / `report-longtext__value` |
| `group` | 蓝色圆点标题 + N 列栅格 | `report-group` + `report-section-title` + `report-grid` |
| `sectionHeading` | 蓝色竖条大区仅标题 | `report-section-heading` |
| `table` | 标准表格 + 可选合计行 | `report-table-block` + `report-table`（≤8 列） |
| `table` | 叠行宽表（>8 列） | `report-table report-table--stacked` + 双行 thead/tbody |
| `empty` | 虚线框 + 居中占位文案 | `report-empty` + `report-empty__placeholder` |
| `measureList` | 增信措施色标卡片 + 可选担保物表 | `report-measure-list` + `report-measure-card` |
| `analysisList` | AI 分析分组 + 结论 Markdown | `report-analysis-list` + `report-analysis-item` + `report-md` |
