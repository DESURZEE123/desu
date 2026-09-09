---
name: prjc-html-style
description: |
  小企业尽调报告 PDF · 统一 HTML/CSS 样式规范。定义固定 CSS、displayType 对应 HTML 结构与 class。
  由 00.prjc_html_report 在拼接时注入一次；各模块 Skill 按本文模板输出片段。
---

# 小企业尽调报告 · 统一 HTML/CSS 样式规范（prjc_html_style）

## 一、资源角色

本资源为**共享样式与 HTML 模板源**，供全部模块 HTML Skill 引用。

| 职责 | 说明 |
| ---- | ---- |
| 固定 CSS | 本文「固定样式表」为整份报告**唯一**样式来源 |
| 注入时机 | 由 `00.prjc_html_report` 在文档壳 `<head>` 中**注入一次**；模块 Skill **禁止**再输出 `<style>` |
| 模块输出 | 各模块 Skill 仅按本文模板输出带 class 的 HTML **片段**（`report-module` 容器），不写内联 `style`，不包文档壳 |

**核心约定：**

1. 样式只走 class；元素上**不得**写 `style` 属性
2. 不引用独立 `.css` 文件
3. HTML 中只出现中文 `label` 与展示值，**不出现** `blockKey` / `moduleKey` / `columns[].key` 等英文字段名
4. 空值统一渲染为「—」；缺失数据不中断生成

---

## 二、设计 Token

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
| `--color-highlight` | `#FF7D00` | 表格高亮单元格文字 |
| `--color-negative` | `#F53F3F` | 负面清单 / 高风险强调 |

> Token 供文档对齐；实际样式写在下方固定 CSS 的具体规则中（PDF 引擎不依赖 CSS 变量）。

---

## 三、固定样式表（整份报告注入一次）

`00.prjc_html_report` 在 `<head>` 中原样输出下方完整 `<style>…</style>` **一次**。内容 = 基地 CSS + 扩展 CSS（高亮 / 清单双卡 / 诉讼卡 / 关联企业 / 担保详情 / 财报等）。

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
  .report-grid__cell--w-20 { width: 20%; }
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
  .report-table__detail-row > td {
    padding: 0;
    background: #F7F8FA;
    border-bottom: 1px solid #E5E6EB;
  }
  .report-table__detail {
    padding: 12px 16px;
    background: #F7F8FA;
  }
  .report-table__detail .report-grid {
    margin: 0;
  }
  .report-table__detail .report-grid__cell {
    margin-bottom: 8px;
  }

  /* ===== table — 叠行宽表（columns > 8） ===== */
  .report-table--stacked thead tr {
    background: #F7F8FA;
  }
  .report-table--stacked .report-table__head-row--top th,
  .report-table--stacked .report-table__head-row--bottom th {
    background: #F7F8FA;
    font-weight: 600;
    color: #1D2129;
    font-size: 14px;
    padding: 10px 12px;
    text-align: left;
    vertical-align: middle;
  }
  .report-table--stacked .report-table__head-row--bottom th {
    border-top: none;
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

  /* ===== 扩展：表格单元格高亮 ===== */
  .report-table__cell--highlight {
    color: #FF7D00;
    font-weight: 600;
  }

  /* ===== 扩展：清单双卡 labelPanel ===== */
  .report-label-panel {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
  }
  .report-label-card {
    flex: 1;
    border-radius: 4px;
    padding: 12px 16px;
    border: 1px solid #E5E6EB;
    box-sizing: border-box;
  }
  .report-label-card--warning {
    background: #FFF7E8;
    border-color: #FF7D00;
  }
  .report-label-card--negative {
    background: #FFECE8;
    border-color: #F53F3F;
  }
  .report-label-card__title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .report-label-card--warning .report-label-card__title { color: #FF7D00; }
  .report-label-card--negative .report-label-card__title { color: #F53F3F; }
  .report-label-card__list {
    margin: 0;
    padding-left: 1.2em;
    font-size: 14px;
    line-height: 22px;
    color: #1D2129;
  }
  .report-label-card__list li { margin-bottom: 4px; }

  /* ===== 扩展：主体角色标签 ===== */
  .report-role-tag {
    display: inline-block;
    padding: 0 8px;
    border-radius: 2px;
    font-size: 12px;
    line-height: 20px;
    margin-right: 4px;
    margin-bottom: 2px;
  }
  .report-role-tag--lessee { background: #E8F3FF; color: #1677FF; }
  .report-role-tag--guarantor { background: #FFF7E8; color: #FF7D00; }
  .report-role-tag--related { background: #E8FFEA; color: #00B42A; }
  .report-role-tag--default { background: #F2F3F5; color: #86909C; }

  /* ===== 扩展：司法诉讼卡片 litigationCards ===== */
  .report-litigation-section__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .report-litigation-section__header .report-section-title { margin-bottom: 0; }
  .report-litigation-section__meta {
    font-size: 12px;
    color: #86909C;
    flex-shrink: 0;
  }
  .report-litigation-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .report-litigation-card {
    position: relative;
    width: 220px;
    max-width: 100%;
    box-sizing: border-box;
    border-radius: 4px;
    padding: 20px 16px;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .report-litigation-card__type {
    font-size: 14px;
    font-weight: 500;
    color: #FFFFFF;
    text-align: center;
    line-height: 22px;
  }
  .report-litigation-card__num {
    position: absolute;
    top: 8px;
    right: 12px;
    font-size: 18px;
    font-weight: 600;
    color: #FFFFFF;
    line-height: 1;
  }
  .report-litigation-card--highRisk {
    background: linear-gradient(135deg, #F98981 0%, #F53F3F 100%);
  }
  .report-litigation-card--common {
    background: linear-gradient(135deg, #6AA1FF 0%, #1677FF 100%);
  }

  /* ===== 扩展：关联企业概要 / 详情 ===== */
  .report-associate-synopsis {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }
  .report-associate-synopsis__card {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 12px 16px;
    background: #F7F9FC;
    border: 1px solid #E5E6EB;
    border-radius: 4px;
  }
  .report-associate-tag {
    display: inline-block;
    padding: 0 10px;
    height: 22px;
    line-height: 22px;
    font-size: 12px;
    font-weight: 500;
    color: #FFFFFF;
    transform: skewX(-12deg);
    flex-shrink: 0;
  }
  .report-associate-tag > span {
    display: inline-block;
    transform: skewX(12deg);
  }
  .report-associate-tag--guarantor { background: #1677FF; }
  .report-associate-tag--nonGuarantor { background: #F7BA1E; }
  .report-associate-synopsis__name {
    font-size: 14px;
    font-weight: 500;
    color: #1677FF;
  }
  .report-associate-synopsis__id {
    font-size: 14px;
    color: #4E5969;
  }
  .report-associate-detail,
  .report-guarantee-detail {
    margin-bottom: 20px;
    padding: 12px 16px 4px;
    border: 1px solid #E5E6EB;
    border-radius: 4px;
    background: #FFFFFF;
  }
  .report-associate-detail__header,
  .report-guarantee-detail__header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #E5E6EB;
  }
  .report-associate-detail__title,
  .report-guarantee-detail__title {
    font-size: 14px;
    font-weight: 600;
    color: #1677FF;
    line-height: 22px;
  }
  .report-associate-detail__id {
    font-size: 13px;
    color: #86909C;
  }

  /* ===== 扩展：财务报表 fsSubjectHeader / financialStatementTable ===== */
  .report-fs-subject-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0 12px;
    padding: 10px 12px;
    background: #F2F3F5;
    border-radius: 4px;
  }
  .report-fs-subject-header__title {
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
  }
  .report-fs-subject-header__source {
    font-size: 12px;
    color: #86909C;
  }
  .report-fs-table-block {
    margin-bottom: 16px;
  }
  .report-fs-table-block__caption {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
  }
  .report-fs-table-block__title {
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
  }
  .report-fs-table-block__unit {
    font-size: 12px;
    color: #86909C;
  }
  .report-fs-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 12px;
  }
  .report-fs-table th,
  .report-fs-table td {
    border-bottom: 1px solid #E5E6EB;
    padding: 8px 10px;
    vertical-align: middle;
  }
  .report-fs-table thead th {
    background: #F2F3F5;
    font-weight: 600;
    color: #1D2129;
    text-align: left;
  }
  .report-fs-table thead th.report-fs-table__period {
    text-align: right;
  }
  .report-fs-table__period-label {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }
  .report-fs-table__data-type {
    display: inline-block;
    padding: 0 6px;
    border-radius: 2px;
    background: #F53F3F;
    color: #FFFFFF;
    font-size: 11px;
    line-height: 18px;
    font-weight: 500;
  }
  .report-fs-table__account {
    color: #1D2129;
  }
  .report-fs-table__account--l3 {
    padding-left: 28px;
  }
  .report-fs-table__value {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: #1D2129;
  }
  .report-fs-table__row--l1 td {
    background: #FFECE8;
    font-weight: 600;
  }
  .report-fs-table__row--l2 td {
    background: #FFF7E8;
    font-weight: 600;
  }
  .report-fs-table__row--l3:nth-child(even) td {
    background: #FAFBFC;
  }
</style>

```

---

## 四、displayType → class 速查

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
| `empty` | 圆点标题 + 占位 | `report-empty` + `report-empty__placeholder` |
| `measureList` | 圆点标题 + 卡片列表 | `report-measure-list` + `report-measure-card` |
| `analysisList` | 圆点标题 + 实体项 + Markdown | `report-analysis-list` + `report-analysis-item` + `report-md` |
| `labelPanel` | 警示/负面双卡 | `report-label-panel` + `report-label-card--warning/--negative` |
| `litigationCards` | 诉讼卡片网格 | `report-litigation-section` + `report-litigation-card--highRisk/--common` |
| `associateCompanySynopsis` | 关联企业概要卡 | `report-associate-synopsis` + `report-associate-tag--*` |
| `associateCompanyDetail` | 关联企业详情容器 | `report-associate-detail` |
| `guaranteePersonDetail` / `guaranteeCompanyDetail` | 担保人详情容器 | `report-guarantee-detail` |
| `fsSubjectHeader` | 财报主体标题栏 | `report-fs-subject-header` |
| `financialStatementTable` | 财务报表透视表 | `report-fs-table-block` + `report-fs-table` + `__row--l1/l2/l3` |

**栅格列宽 class 映射：**

| `columns` | 栅格 cell class |
| --------- | --------------- |
| 4（默认） | `report-grid__cell--w-25` |
| 3 | `report-grid__cell--w-33` |
| 2 | `report-grid__cell--w-50` |
| 5 | `report-grid__cell--w-20` |
| 1 | `report-grid__cell--w-100` |

**表格对齐 class 映射：**

| `columns[].align` | th / td 附加 class |
| ----------------- | ------------------ |
| `left`（默认） | （无） |
| `center` | `report-table__cell--align-center` |
| `right` | `report-table__cell--align-right` |

**主体角色标签 tone：**

| tone | class |
| ---- | ----- |
| `lessee` | `report-role-tag report-role-tag--lessee` |
| `guarantor` | `report-role-tag report-role-tag--guarantor` |
| `related` | `report-role-tag report-role-tag--related` |
| 其他 | `report-role-tag report-role-tag--default` |

---

## 五、HTML 结构模板（基础类型）

### 5.1 模块容器

每个模块输出一个独立 `div`：

```html
<div class="report-module" data-module-key="project_base_info">
  <div class="report-module__header">项目基本信息</div>
  <div class="report-module__body">
    <!-- blocks 渲染结果 -->
  </div>
</div>
```

- `data-module-key` 取 `moduleKey`，便于调试，PDF 中可保留或省略
- `moduleName` 渲染为 `report-module__header` 文字，**不输出** `moduleKey`
- 模块 Skill **不**输出完整 `html` / `head` / `body`，**不**输出 `<style>`

### 5.2 键值对（direct / person）

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

> 工号（`workNo`）不参与 PDF 展示。结构与 `direct` 相同。

### 5.3 长文本（longText）

**独立 block：**

```html
<div class="report-block report-longtext">
  <div class="report-longtext__label">售后回租原因说明：</div>
  <div class="report-longtext__value">完整文本内容……</div>
</div>
```

**作为 `group.children` 子项时**，外层包 `report-grid__cell report-grid__cell--w-100`。

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
- `longText` / `fullWidth` 子项使用 `report-grid__cell--w-100`
- `children` 为空或不传时：只输出蓝色圆点小节标题，不输出 `.report-grid`
- **禁止**用空 `group` 冒充大区标题（大区须用 `sectionHeading`）

### 5.4.1 大区仅标题（sectionHeading）

```html
<div class="report-block">
  <div class="report-section-heading">资产规模</div>
</div>
```

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
        <!-- 其余 columns -->
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
| 序号列 | `showIndex: true` 时首列为自增序号（从 1 起）；**不计入** 8 列上限 |
| 表头 | 取 `columns[].label`，**不输出** `columns[].key` |
| 数据行 | 按 `columns[].key` 取值；若值为 `{ "value": "…", "cellType": "highlight" }` 则解包并加 `.report-table__cell--highlight` |
| 同值合并 | `columns[].mergeSame === true` 时，对该列连续相同非空值输出 `rowspan`（见第七节） |
| 合计行 | `summary` 存在时渲染；数值列加 `report-table__cell--strong` |
| 空数据 | `rows` 为空时不渲染 `table`，改为 `report-table-empty` |
| 行内详情 | `rows[].detail` 有值时，在该行后追加全宽详情栅格（`report-table__detail-row`） |
| 图片单元格 | `<img class="report-table__img" …>` |

### 5.5.1 表格（table · 叠行宽表 · columns > 8）

当逻辑列超过 8 列时，在同一 `report-table-block` 内渲染**一张**叠行宽表（表头 2 行、每条数据 2 行）。**禁止**因列过多再拆成多个子表。

**列布局规则：**

1. 将 `columns` 分为两类（保持原数组相对顺序）：
   - **跨行固定列**（`stackSpan: true`）：单独占一物理列，表头 / 单元格均 `rowspan="2"`
   - **配对叠放列**（其余）：按出现顺序**两两配对**为物理列（上行 / 下行）
2. 配对时**不限制**物理列上限；末列落单时上行填该列、下行填「—」
3. `showIndex: true` 时序号列为最左跨行固定列（不计入 `columns.length`）

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
  </tbody>
</table>
```

**叠行宽表规则：**

| 规则 | 说明 |
| ---- | ---- |
| 触发条件 | `columns.length > 8` |
| 表格 class | `report-table report-table--stacked` |
| 单表输出 | 同一 block **只输出一张**叠行表 |
| 表头上下行样式 | `head-row--top` 与 `head-row--bottom` **样式须完全一致**；仅下行 `th` 设 `border-top: none` |
| 跨行固定列 | `stackSpan: true`：`rowspan="2"`；若同时 `mergeSame`，则 `rowspan = 连续相同记录数 × 2`；用 `report-table__span-cell` |
| 配对叠放列 | 非 `stackSpan` 列两两配对；高亮 class 加在 `.report-table__stack-value` 上 |
| 副文案 | 有 `subKey` 时主值下方追加 `report-table__entity-sub` |
| 合计行 | 有 `summary` 时占 2 行（`summary-row--top` / `--bottom`） |

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
    <div class="report-measure-card">
      <div class="report-measure-card__head">
        <span class="report-measure-card__tag report-measure-card__tag--guarantee">保证担保</span>
        <span class="report-measure-card__name">江阴绮星水泥有限公司</span>
        <span class="report-measure-card__id">统一社会信用代码：91320281142225264B</span>
      </div>
    </div>
    <div class="report-measure-card">
      <div class="report-measure-card__head">
        <span class="report-measure-card__tag report-measure-card__tag--guarantee">保证担保</span>
        <span class="report-measure-card__name">肖令权</span>
        <span class="report-measure-card__rel">实控人父母</span>
        <span class="report-measure-card__id">居民身份证：51222219750923425X</span>
      </div>
    </div>
    <div class="report-measure-card">
      <div class="report-measure-card__head">…</div>
      <div class="report-measure-card__attrs">
        <div class="report-measure-card__attr">
          <span class="report-measure-card__attr-label">抵押物类别：</span>
          <span class="report-measure-card__attr-value">其他</span>
        </div>
      </div>
      <div class="report-measure-card__collateral">
        <div class="report-measure-card__collateral-title">担保物</div>
        <table class="report-table report-table--stacked">…</table>
      </div>
    </div>
  </div>
</div>
```

| 规则 | 说明 |
| ---- | ---- |
| 标题 | 有 `label` 时输出 `report-section-title` |
| 空数据 | `items` 为空时输出 `report-table-empty`（文案取 `emptyText`） |
| 担保方式标签 | `guaranteeTone` → `report-measure-card__tag--{tone}`；缺省 `default` |
| 关系标签 | 仅当 `relationship` 有值时输出 `report-measure-card__rel` |
| 担保物表 | 内部表格规则同 §5.5 / §5.5.1；表头与单元格统一左对齐 |
| 禁止 | 不输出 icon、SVG、知识图谱、编辑/删除等交互控件 |

### 5.8 AI 分析结果列表（analysisList）

```html
<div class="report-block report-analysis-list">
  <div class="report-section-title">
    <span class="report-section-title__dot"></span>
    <span class="report-section-title__text">项目司法分析</span>
  </div>
  <div class="report-analysis-list__items">
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
          </ul>
        </div>
      </div>
    </div>
    <div class="report-analysis-item">
      <div class="report-analysis-item__conclusion">
        <div class="report-md"><p><strong>流水分析结论：</strong>该承租人仅提供……</p></div>
      </div>
    </div>
    <div class="report-analysis-item">
      <div class="report-analysis-item__entity">…</div>
      <div class="report-analysis-item__conclusion">
        <div class="report-analysis-item__empty">—</div>
      </div>
    </div>
  </div>
</div>
```

| 规则 | 说明 |
| ---- | ---- |
| 分组标题 | 始终输出 `report-section-title`，文案取 `label` |
| 空列表 | `items` 为空时输出 `report-table-empty` |
| 实体标题 | 仅当 `customerName` 非空时输出蓝色方点 + 名称 |
| 结论区 | 有 Markdown 则渲染进 `report-md`，否则「—」 |
| 详情 | **不展示** `analysisDetail`；禁止「查看详情」等交互 |

### 5.8.1 Markdown → HTML 转换规则

将 `conclusion` Markdown 转为 HTML，包裹在 `<div class="report-md">` 内：

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
2. HTML 特殊字符须转义（`<` `>` `&` `"`）
3. 不保留原始 Markdown 源码到 HTML 文本节点
4. 表格样式使用 `.report-md table`，**不**改用 `report-table` class

---

## 六、HTML 结构模板（扩展类型）

### 6.1 清单双卡（labelPanel）

```html
<div class="report-block">
  <div class="report-label-panel">
    <div class="report-label-card report-label-card--warning">
      <div class="report-label-card__title">警示清单</div>
      <ul class="report-label-card__list">
        <li>承租人为非关联方的对外担保</li>
        <li>折旧不符合公司要求</li>
      </ul>
    </div>
    <div class="report-label-card report-label-card--negative">
      <div class="report-label-card__title">负面清单</div>
      <ul class="report-label-card__list">
        <li>总回款可验证比例＜50%</li>
      </ul>
    </div>
  </div>
</div>
```

| 规则 | 说明 |
| ---- | ---- |
| `tone` | `warning` → `--warning`；`negative` → `--negative` |
| 单卡 | `panels` 仅 1 项时仍用 `report-label-panel`（flex 单卡占满） |
| 空项 | `items` 空白条目不输出 `<li>`；双方皆空则整块不输出 |

### 6.2 司法诉讼卡片（litigationCards）

```html
<div class="report-block report-litigation-section">
  <div class="report-litigation-section__header">
    <span class="report-litigation-section__meta">司法诉讼数据更新时间：2026-06-02 09:53:30</span>
  </div>
  <div class="report-litigation-grid">
    <div class="report-litigation-card report-litigation-card--highRisk">
      <span class="report-litigation-card__num">80</span>
      <span class="report-litigation-card__type">被执行人</span>
    </div>
    <div class="report-litigation-card report-litigation-card--common">
      <span class="report-litigation-card__num">105</span>
      <span class="report-litigation-card__type">民事案件</span>
    </div>
  </div>
</div>
```

| 规则 | 说明 |
| ---- | ---- |
| 大区标题 | 通常由前置 `sectionHeading`（「司法诉讼信息」）承担；本类型**可不传 label** |
| `tone` | `highRisk` 红渐变；`common` 蓝渐变 |
| 空数据 | `cards` 为空时输出 `report-table-empty`（文案取 `emptyText`，默认「客户暂无司法诉讼数据」） |
| 过滤 | `caseNum <= 0` 的卡片不展示 |
| 布局 | 卡片左起自动换行，固定约 220px 宽，**不**按一行均分拉满 |

### 6.3 关联企业概要（associateCompanySynopsis）

```html
<div class="report-block report-associate-synopsis">
  <div class="report-associate-synopsis__card">
    <span class="report-associate-tag report-associate-tag--nonGuarantor"><span>非担保人</span></span>
    <span class="report-associate-synopsis__name">北京鑫鑫印刷有限公司</span>
    <span class="report-associate-synopsis__id">统一社会信用代码：911101147921218971</span>
  </div>
  <div class="report-associate-synopsis__card">
    <span class="report-associate-tag report-associate-tag--guarantor"><span>担保人</span></span>
    <span class="report-associate-synopsis__name">昆山华阳新材料股份有限公司</span>
    <span class="report-associate-synopsis__id">统一社会信用代码：91320500765135302R</span>
  </div>
</div>
```

| 规则 | 说明 |
| ---- | ---- |
| `guarantorTone` | `guarantor` / `nonGuarantor` → 对应 tag class |
| 证件行 | `统一社会信用代码：{crdntlsCode}`；缺省「—」 |
| 空列表 | 可输出空占位或跳过（由模块 Skill 决定；通常有概要才输出本块） |

### 6.4 关联企业详情（associateCompanyDetail）

```html
<div class="report-block report-associate-detail">
  <div class="report-associate-detail__header">
    <span class="report-associate-detail__title">北京鑫鑫印刷有限公司</span>
    <span class="report-associate-detail__id">统一社会信用代码：911101147921218971</span>
  </div>
  <!-- 递归渲染 childBlocks：group / table / litigationCards / … -->
</div>
```

### 6.5 担保自然人 / 担保企业详情（guaranteePersonDetail / guaranteeCompanyDetail）

```html
<div class="report-block report-guarantee-detail">
  <div class="report-guarantee-detail__header">
    <span class="report-guarantee-detail__title">担保自然人 - 杨洪卫</span>
  </div>
  <!-- 递归渲染 childBlocks -->
</div>
```

```html
<div class="report-block report-guarantee-detail">
  <div class="report-guarantee-detail__header">
    <span class="report-guarantee-detail__title">担保企业 - 太和县中医院</span>
  </div>
  <!-- 递归渲染 childBlocks -->
</div>
```

- 标题文案取 `label`（如「担保自然人 - {姓名}」）
- 内部 `childBlocks` 按本文对应 displayType 递归渲染

### 6.6 财务报表主体标题（fsSubjectHeader）

```html
<div class="report-block">
  <div class="report-fs-subject-header">
    <span class="report-fs-subject-header__title">承租人芜湖华翔印务包装有限公司重点科目财务报表</span>
    <span class="report-fs-subject-header__source">数据来源：税票授权采集</span>
  </div>
</div>
```

- `title` → `__title`；`dataSource` 前缀固定「数据来源：」

### 6.7 财务报表透视表（financialStatementTable）

```html
<div class="report-block report-fs-table-block">
  <div class="report-fs-table-block__caption">
    <span class="report-fs-table-block__title">资产负债表</span>
    <span class="report-fs-table-block__unit">单位：元</span>
  </div>
  <table class="report-fs-table">
    <thead>
      <tr>
        <th>科目名称</th>
        <th class="report-fs-table__period">
          <span class="report-fs-table__period-label">202312<span class="report-fs-table__data-type">单体</span></span>
        </th>
        <th class="report-fs-table__period">
          <span class="report-fs-table__period-label">202412<span class="report-fs-table__data-type">单体</span></span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr class="report-fs-table__row--l1">
        <td class="report-fs-table__account">一、资产合计</td>
        <td class="report-fs-table__value">256,305,567.03</td>
        <td class="report-fs-table__value">269,270,210.06</td>
      </tr>
      <tr class="report-fs-table__row--l2">
        <td class="report-fs-table__account">1、流动资产合计</td>
        <td class="report-fs-table__value">…</td>
        <td class="report-fs-table__value">…</td>
      </tr>
      <tr class="report-fs-table__row--l3">
        <td class="report-fs-table__account report-fs-table__account--l3">货币资金</td>
        <td class="report-fs-table__value">…</td>
        <td class="report-fs-table__value">—</td>
      </tr>
    </tbody>
  </table>
</div>
```

| rowLevel | class |
| :------: | ----- |
| 1 | `report-fs-table__row--l1` |
| 2 | `report-fs-table__row--l2` |
| 3 | `report-fs-table__row--l3` + 科目名加 `__account--l3` |

- 空 `rows` → `report-table-empty`（文案取 `emptyText`）
- 金额列右对齐；`dataType` 有值时输出红色小标签

---

## 七、通用渲染规则

### 7.1 禁止内联样式

- 元素上**不得**写 `style` 属性
- 样式仅来自本文固定 CSS + class

### 7.2 空值

- 字段值为空、`null`、空字符串时，统一渲染为「—」
- `labelPanel.items` 空白条目剔除，不进入列表
- 缺失数据**不中断**模块输出

### 7.3 中文展示

- HTML 中只出现中文 `label` 与展示值
- **不出现** `blockKey`、`moduleKey`、`columns[].key` 等英文字段名

### 7.4 单元格高亮解包（highlight unwrap）

单元格值可为：

- 普通字符串
- `{ "value": "…", "cellType": "highlight" }`（兼容 `highlight: true`）

渲染时：

1. **必须**解包 `value` 再输出文本
2. 高亮时包 `<span class="report-table__cell--highlight">…</span>`
3. **禁止**对对象直接 `String()`（会得到 `[object Object]`）
4. 叠行宽表将高亮 class 加在 `.report-table__stack-value` 上

### 7.5 mergeSame 合并规则

1. 仅当 `columns[].mergeSame === true` 时生效
2. 自上而下扫描：连续相同且非空（非 `—` / 非空串）的单元格合并为一个 `td`
3. **标准单行表**：`rowspan = 连续行数 N`
4. **叠行宽表**：仅对 `stackSpan: true` 的列生效；`rowspan = N × 2`；配对叠放列**不**做 mergeSame
5. 被合并的后续行**不再输出**该列 `td`
6. 值变为不同或为空占位 `—` 时，结束上一组合并并重新起算

### 7.6 叠行（stack）规则摘要

| 条件 | 行为 |
| ---- | ---- |
| `columns.length ≤ 8` | 标准单行表 |
| `columns.length > 8` | 叠行宽表；**单表**，不拆分子表 |
| `stackSpan: true` | 跨行固定列，`rowspan=2`（或 merge 后 ×2） |
| 其余列 | 两两配对为上下行物理列 |
| 表头上下行 | 样式完全一致 |

### 7.7 顺序与片段边界

- `blocks` / `children` / `childBlocks` 按数组顺序渲染
- 模块只输出 `report-module` 片段；文档壳与 `<style>` 由 `00.prjc_html_report` 负责

---

## 八、引用关系

| 角色 | 文件 |
| ---- | ---- |
| 总控拼接 | `00.prjc_html_report.md` |
| 本样式 | `prjc_html_style.md`（本文） |
| 各模块 | `1.prjc_html_*.md` … `15.prjc_html_analysis_results.md` |

各模块 Skill 生成 HTML 时**必须**遵循本文模板与 class；不得自定义内联样式或另起 CSS。
