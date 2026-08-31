# 合作历史 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**待定**（页面顺序上位于「项目基本信息」之前；L0 排序以本字段为准，落地时与 `project_base_info` 一并确认）  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> 业务对照：`尽调系统/项目审批/1.合作历史.md`

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `commonCollaborationHistoryModel`（及同构子对象），按尽调系统类型筛选字段、映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不做业务分析、不做筛选主体计算、不渲染知识图谱、不做 HTML 渲染。

**尽调系统类型对照**

| 中文   | 英文类型       |
| ---- | ---------- |
| 闪光租  | `prjc-flr` |
| 小企业  | `prjc-slb` |
| 厂商租赁 | `prjc-drs` |
| 环卫   | `prjc-si`  |
| 通用大单 | `prjc-gld` |
| 大健康  | `prjc-hdr` |

<!-- | 印包 | `prjc-PEP` | -->

> 编码规则：`prjc-{小写系统码}`。印包（`prjc-PEP`）暂不在本节对照表启用，文中涉及印包的模块规则保持不变。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | 待定（建议：页面序在基本信息前） |
| `moduleKey` | `cooperation_history` |
| `moduleName` | `合作历史` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `projectAttribute` | 尽调系统类型（`prjc-*`），决定字段展示范围与表头文案 |
| `commonCollaborationHistoryModel` | 模块主数据对象（项目级合作历史） |
| `commonCollaborationHistoryModel.leaseCollaborationHistoryList` | 作为承租人情况列表 |
| `commonCollaborationHistoryModel.leaseAmountTotal` | 作为承租人情况 · 合计 |
| `commonCollaborationHistoryModel.guarantorCollaborationHistories` | 作为担保人情况列表 |
| `commonCollaborationHistoryModel.guarantorAmountTotal` | 作为担保人情况 · 合计 |
| `commonCollaborationHistoryModel.cooperateHistoryDesc` | 合作历史说明 |
| `commonCollaborationHistoryModel.updateTime` | 数据更新时间（环卫等场景用，本节 PDF 首版可选） |
| `commonCollaborationHistoryModel.isRepeatOrderOk` | 是否符合翻单要求（环卫大单回租条件字段） |
| `commonCollaborationHistoryModel.repeatOrderSituation` | 翻单情况（环卫大单回租条件字段） |

> 承租人 / 担保人模块内嵌的 `collaborationHistoryModel` **不**作为本模块主数据源；PDF「合作历史」大模块仅取项目级 `commonCollaborationHistoryModel`。

---

## 四、整合流程

```text
1. 读取 projectAttribute，确定尽调系统类型
2. 若系统为 prjc-flr：本模块整段不输出（闪光租无独立合作历史模块）
3. 从 commonCollaborationHistoryModel 提取字段
4. 按尽调系统差异过滤 / 改表头（见第五节）
5. 按分组顺序组装 blocks（见第六节）
6. 为每个字段标注 displayType 并格式化展示值
7. 输出结构化 JSON → 交由 L2 渲染
```

---

## 五、尽调系统差异约束

| 分组 / 字段 | prjc-flr | prjc-slb | prjc-drs | prjc-PEP | prjc-si | prjc-gld | prjc-hdr |
| ----------- | :----: | :----: | :------: | :--: | :--: | :------: | :------: |
| 合作历史模块整体 | — | ✅ | ✅ | ✅ | ✅ | 待补充 | 待补充 |
| 作为承租人情况表 | — | ✅ | ✅ | ✅ | ✅ | 待补充 | — |
| 作为担保人情况表 | — | ✅ | ✅ | ✅ | ✅ | 待补充 | — |
| 合作历史说明 | — | ✅ | ✅ | ✅ | 条件 | 待补充 | — |
| 经营情况列 | — | — | — | — | 条件 | — | — |
| 翻单字段 | — | — | — | — | 条件 | — | — |
| 知识图谱 | — | — | — | — | — | — | — |

**条件展示规则：**

- `prjc-flr`（闪光租）：**无独立合作历史模块**，合作历史展示在承租人信息 / 增信措施中，本 Skill **整模块不输出**
- 表头文案：
  - `prjc-slb` / `prjc-drs`：`承租人、关联方、担保人作为承租人情况` / `承租人、关联方、担保人作为担保人情况`（对齐页面截图）
  - `prjc-PEP`：`承租人、担保人作为承租方的情况` / `承租人、担保人作为担保方情况`（不含关联方）
  - `prjc-si`：默认 `承租人关联方作为承租方` / `承租人及关联方作为担保人情况`；细分项目类型差异见业务 PRD，本节 PDF 首版按通用两表 + 说明输出，经营情况 / 翻单等扩展字段标「待补充」
- `合作历史说明`：两表任一有数据时输出；两表皆空时不输出该 block
- `知识图谱`：交互可视化，**PDF 不输出**
- `筛选主体` / `更新合作历史`：页面操作，**PDF 不输出**（PDF 使用入参中已落库的全量列表，不做前端筛选）
- `prjc-gld` / `prjc-hdr`：本节模块差异待补充，当前 PDF 模块暂不输出或按后续补齐规则输出

**空数据规则：**

- 两表 `rows` 皆空（`null` / `[]`）：仍输出两个 table block，`emptyText` 均为 `所有客户均无合作历史数据`；不输出「合作历史说明」
- 单表为空：该表走 `emptyText: 暂无合作历史数据`，另一表正常输出；有数据时仍可输出说明

---

## 六、blocks 组装顺序

模块内 `blocks` 按以下顺序输出（与页面展示顺序一致）：

| 顺序 | blockKey | label | displayType | 适用系统 |
| :--: | -------- | ----- | ----------- | -------- |
| 1a | `leaseCollaborationHistoryList_contract` | 见 §5 表头文案 · 合同信息 | `table` | prjc-slb / prjc-drs / prjc-PEP / prjc-si |
| 1b | `leaseCollaborationHistoryList_yieldOverdue` | （同组）收益与逾期 | `table` | 同上 |
| 2a | `guarantorCollaborationHistories_contract` | 见 §5 表头文案 · 合同信息 | `table` | 同上 |
| 2b | `guarantorCollaborationHistories_yieldOverdue` | （同组）收益与逾期 | `table` | 同上 |
| 3 | `cooperateHistoryDesc` | 合作历史说明 | `longText` | 有合作历史数据时 |

---

## 七、字段映射与 displayType 规则

### 7.1 作为承租人情况（table · 宽表拆分）

数据来源：`commonCollaborationHistoryModel.leaseCollaborationHistoryList`

**默认 label（prjc-slb / prjc-drs）：** `承租人、关联方、担保人作为承租人情况`

> PDF 列过多时，同一业务块输出为 **2 个上下排列的 table**（共用同一 `label` 分组标题，子表用灰色小标题区分）。行序、序号一致，便于对照。

**子表 A — 合同信息**（`blockKey`: `leaseCollaborationHistoryList_contract`）

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 客户名称 | `customerName` | 原样 |
| 客户角色 | `customerRoleEnum` | 原样（已为中文则直接展示） |
| 租赁方式(实际) | `leaseMethodFact` | 原样 |
| 合同名称 | `contName` | 原样 |
| 合同金额(元) | `contCashPledge` | 千分位 + 2 位小数 |
| 剩余本金(元) | `corpusBalancePledge` | 千分位 + 2 位小数 |
| 当前逾期金额(元) | `curOverdueAmount` | 千分位 + 2 位小数 |
| 合同起租日 | `leaseBeginDate` | 原样 |
| 合同到期日 | `contEndDate` | 原样 |

- `showIndex`: `true`
- `summary`：取 `leaseAmountTotal`（合计仅落在本子表）
  - 首列：`合计`
  - `contCashPledge` / `corpusBalancePledge` / `curOverdueAmount`：汇总值
  - 其余列：`—`

**子表 B — 收益与逾期**（`blockKey`: `leaseCollaborationHistoryList_yieldOverdue`）

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 客户名称 | `customerName` | 原样（关联键，与子表 A 同行对应） |
| 合同名称 | `contName` | 原样 |
| 内部收益率(%) | `irr` | 数值原样；已带 `%` 则不再追加 |
| 综合收益率(%) | `cmprhnsvIrr` | 同上 |
| 当前逾期天数 | `curOverdueDays` | 原样 |
| 历史最大逾期天数 | `historyOverdueDays` | 原样 |
| 历史逾期次数 | `historyOverdueTimes` | 原样 |

- `showIndex`: `true`
- 无合计行
- `emptyText`: 与子表 A 相同（`暂无合作历史数据`；两表皆空时 `所有客户均无合作历史数据`）

### 7.2 作为担保人情况（table · 宽表拆分）

数据来源：`commonCollaborationHistoryModel.guarantorCollaborationHistories`

**默认 label（prjc-slb / prjc-drs）：** `承租人、关联方、担保人作为担保人情况`

同样拆成 **合同信息** + **收益与逾期** 两子表。

**子表 A — 合同信息**（`blockKey`: `guarantorCollaborationHistories_contract`）

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 客户名称 | `customerName` | 原样 |
| 客户角色 | `customerRoleEnum` | 原样 |
| 担保方式 | `guaranteeMethod` | 原样；多种担保方式已用 `；` 分隔则直接展示 |
| 合同名称 | `contName` | 原样 |
| 租赁方式(实际) | `leaseMethodFact` | 原样 |
| 合同金额(元) | `contCashPledge` | 千分位 + 2 位小数 |
| 剩余本金(元) | `corpusBalancePledge` | 千分位 + 2 位小数 |
| 当前逾期金额(元) | `curOverdueAmount` | 千分位 + 2 位小数 |
| 合同起租日 | `leaseBeginDate` | 原样 |
| 合同到期日 | `contEndDate` | 原样 |

- `showIndex`: `true`
- `summary`：取 `guarantorAmountTotal`（规则同 §7.1 子表 A）

**子表 B — 收益与逾期**（`blockKey`: `guarantorCollaborationHistories_yieldOverdue`）

列与 §7.1 子表 B 相同（客户名称、合同名称、IRR、综合收益率、三类逾期指标）。

- `showIndex`: `true`
- 无合计行

> L2 渲染：分组蓝点标题只出一次；两子表上方各加灰色小标题「合同信息」「收益与逾期」。

### 7.3 合作历史说明（longText）

数据来源：`commonCollaborationHistoryModel.cooperateHistoryDesc`

```json
{
  "blockKey": "cooperateHistoryDesc",
  "label": "合作历史说明",
  "displayType": "longText",
  "value": "……"
}
```

- 仅当 `leaseCollaborationHistoryList` 或 `guarantorCollaborationHistories` 至少一方有数据时输出
- 空值填 `—`（有表数据但说明未填时）

---

## 八、空值与格式化规则

| 规则 | 说明 |
| ---- | ---- |
| 空值占位 | `null` / `""` / 缺失 → 展示值填 `—` |
| 金额 | 千分位 + 保留 2 位小数，如 `10,000.00` |
| 收益率 | 接口已为百分比文案则原样；纯数字可按业务约定补 `%`，不做额外精度改写 |
| 枚举 | 直接展示接口返回的中文值，不做码值转换 |
| 列表顺序 | 按接口返回顺序输出，L1 不重排 |
| 合计 | 优先用 `leaseAmountTotal` / `guarantorAmountTotal`；缺失时再按当前 rows 对应列求和 |

---

## 九、输出示例（prjc-slb）

```json
{
  "moduleIndex": 0,
  "moduleName": "合作历史",
  "moduleKey": "cooperation_history",
  "blocks": [
    {
      "blockKey": "leaseCollaborationHistoryList",
      "label": "承租人、关联方、担保人作为承租人情况",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "customerName", "label": "客户名称" },
        { "key": "customerRoleEnum", "label": "客户角色" },
        { "key": "leaseMethodFact", "label": "租赁方式(实际)" },
        { "key": "contName", "label": "合同名称" },
        { "key": "irr", "label": "内部收益率(%)" },
        { "key": "cmprhnsvIrr", "label": "综合收益率(%)" },
        { "key": "contCashPledge", "label": "合同金额(元)" },
        { "key": "corpusBalancePledge", "label": "剩余本金(元)" },
        { "key": "curOverdueAmount", "label": "当前逾期金额(元)" },
        { "key": "leaseBeginDate", "label": "合同起租日" },
        { "key": "contEndDate", "label": "合同到期日" },
        { "key": "curOverdueDays", "label": "当前逾期天数" },
        { "key": "historyOverdueDays", "label": "历史最大逾期天数" },
        { "key": "historyOverdueTimes", "label": "历史逾期次数" }
      ],
      "rows": [],
      "summary": {
        "index": "合计",
        "contCashPledge": "—",
        "corpusBalancePledge": "—",
        "curOverdueAmount": "—"
      },
      "emptyText": "所有客户均无合作历史数据"
    },
    {
      "blockKey": "guarantorCollaborationHistories",
      "label": "承租人、关联方、担保人作为担保人情况",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "customerName", "label": "客户名称" },
        { "key": "customerRoleEnum", "label": "客户角色" },
        { "key": "guaranteeMethod", "label": "担保方式" },
        { "key": "contName", "label": "合同名称" },
        { "key": "irr", "label": "内部收益率(%)" },
        { "key": "cmprhnsvIrr", "label": "综合收益率(%)" },
        { "key": "leaseMethodFact", "label": "租赁方式(实际)" },
        { "key": "contCashPledge", "label": "合同金额(元)" },
        { "key": "corpusBalancePledge", "label": "剩余本金(元)" },
        { "key": "curOverdueAmount", "label": "当前逾期金额(元)" },
        { "key": "leaseBeginDate", "label": "合同起租日" },
        { "key": "contEndDate", "label": "合同到期日" },
        { "key": "curOverdueDays", "label": "当前逾期天数" },
        { "key": "historyOverdueDays", "label": "历史最大逾期天数" },
        { "key": "historyOverdueTimes", "label": "历史逾期次数" }
      ],
      "rows": [],
      "summary": {
        "index": "合计",
        "contCashPledge": "—",
        "corpusBalancePledge": "—",
        "curOverdueAmount": "—"
      },
      "emptyText": "所有客户均无合作历史数据"
    }
  ]
}
```

> 上例为两表皆空：不输出 `cooperateHistoryDesc`。有数据时在末尾追加 `longText` block，且两表 `emptyText` 改回 `暂无合作历史数据`。

---

## 十、输出约束

1. 输出 JSON，**不包含 HTML 标签**
2. 字段名使用中文 `label`，接口英文字段名仅用于取值匹配
3. 空值统一填 `—`，不输出 `null` 或空字符串
4. 不传当前尽调系统不需要的 block / 字段
5. `blocks` 内顺序严格按第六节表格排列
6. `prjc-flr` 不输出本模块
7. 不输出知识图谱、筛选主体、更新按钮等页面交互能力

---

## 十一、待补充

| 项 | 说明 |
| -- | ---- |
| `moduleIndex` 最终值 | 与 L0、`project_base_info` 排序一并确认 |
| `prjc-si` 经营情况列 / 数据更新时间 / 翻单字段 | 按项目类型条件补齐 |
| `prjc-gld` / `prjc-hdr` | 系统差异与字段范围待补充 |
| 收益率精度 | 若业务要求统一补齐小数位，再在 §8 固化 |
