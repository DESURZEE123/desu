# 合作历史 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**3**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `commonCollaborationHistoryModel`（及同构子对象），按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不做业务分析、不做筛选主体计算、不渲染知识图谱、不做 HTML 渲染。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `3` |
| `moduleKey` | `cooperation_history` |
| `moduleName` | `合作历史` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `commonCollaborationHistoryModel` | 模块主数据对象（项目级合作历史） |
| `commonCollaborationHistoryModel.leaseCollaborationHistoryList` | 作为承租人情况列表 |
| `commonCollaborationHistoryModel.leaseAmountTotal` | 作为承租人情况 · 合计 |
| `commonCollaborationHistoryModel.guarantorCollaborationHistories` | 作为担保人情况列表 |
| `commonCollaborationHistoryModel.guarantorAmountTotal` | 作为担保人情况 · 合计 |
| `commonCollaborationHistoryModel.cooperateHistoryDesc` | 合作历史说明 |

> 承租人 / 担保人模块内嵌的 `collaborationHistoryModel` **不**作为本模块主数据源；PDF「合作历史」大模块仅取项目级 `commonCollaborationHistoryModel`。

---

## 四、整合流程

```text
1. 从 commonCollaborationHistoryModel 提取字段
2. 按固定 blocks 顺序组装（见第六节）
3. 为每个字段标注 displayType 并格式化展示值
4. 输出结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

**固定 blocks：**

| block | label | displayType |
| ----- | ----- | ----------- |
| `leaseCollaborationHistoryList` | `承租人、关联方、担保人作为承租人情况` | `table` |
| `guarantorCollaborationHistories` | `承租人、关联方、担保人作为担保人情况` | `table` |
| `cooperateHistoryDesc` | `合作历史说明` | `longText`（有合作历史数据时） |

**展示规则：**

- `合作历史说明`：两表任一有数据时输出；两表皆空时不输出该 block
- `知识图谱`：交互可视化，**PDF 不输出**
- `筛选主体` / `更新合作历史`：页面操作，**PDF 不输出**（PDF 使用入参中已落库的全量列表，不做前端筛选）

**空数据规则：**

- 两表 `rows` 皆空（`null` / `[]`）：仍输出两个 table block，`emptyText` 均为 `所有客户均无合作历史数据`；不输出「合作历史说明」
- 单表为空：该表走 `emptyText: 暂无合作历史数据`，另一表正常输出；有数据时仍可输出说明

---

## 六、blocks 组装顺序

模块内 `blocks` 按以下顺序输出（与页面展示顺序一致）：

| 顺序 | blockKey | label | displayType |
| :--: | -------- | ----- | ----------- |
| 1 | `leaseCollaborationHistoryList` | `承租人、关联方、担保人作为承租人情况` | `table` |
| 2 | `guarantorCollaborationHistories` | `承租人、关联方、担保人作为担保人情况` | `table` |
| 3 | `cooperateHistoryDesc` | `合作历史说明` | `longText` |

> 每个 table block 输出**完整列**（合同 + 收益与逾期字段合并为一张表）。列数超过 8 时由 L2（`prjc_style_render.md` §5.5.1）自动叠行展示，L1 **不**拆表、**不**传 layout 参数。

---

## 七、字段映射与 displayType 规则

### 7.1 作为承租人情况（table）

数据来源：`commonCollaborationHistoryModel.leaseCollaborationHistoryList`

**label：** `承租人、关联方、担保人作为承租人情况`

**blockKey：** `leaseCollaborationHistoryList`

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 客户名称 | `customerName` | 原样 |
| 客户角色 | `customerRole` | 原样（已为中文则直接展示） |
| 租赁方式(实际) | `leaseMethodFact` | 原样 |
| 合同名称 | `contName` | 原样 |
| 内部收益率(%) | `irr` | 数值原样；已带 `%` 则不再追加 |
| 综合收益率(%) | `cmprhnsvIrr` | 同上 |
| 合同金额(元) | `contCashPledge` | 千分位 + 2 位小数 |
| 剩余本金(元) | `corpusBalancePledge` | 千分位 + 2 位小数 |
| 当前逾期金额(元) | `curOverdueAmount` | 千分位 + 2 位小数 |
| 合同起租日 | `leaseBeginDate` | 原样 |
| 合同到期日 | `contEndDate` | 原样 |
| 当前逾期天数 | `curOverdueDays` | 原样 |
| 历史最大逾期天数 | `historyOverdueDays` | 原样 |
| 历史逾期期数 | `historyOverdueTimes` | 原样 |

- `showIndex`: `true`
- `summary`：取 `leaseAmountTotal`
  - 首列：`合计`
  - `contCashPledge` / `corpusBalancePledge` / `curOverdueAmount`：汇总值
  - 其余列：`—`
- `emptyText`：`暂无合作历史数据`；两表皆空时 `所有客户均无合作历史数据`

### 7.2 作为担保人情况（table）

数据来源：`commonCollaborationHistoryModel.guarantorCollaborationHistories`

**label：** `承租人、关联方、担保人作为担保人情况`

**blockKey：** `guarantorCollaborationHistories`

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 客户名称 | `customerName` | 原样 |
| 客户角色 | `customerRole` | 原样 |
| 担保方式 | `guaranteeMethod` | 原样；多种担保方式已用 `；` 分隔则直接展示 |
| 合同名称 | `contName` | 原样 |
| 内部收益率(%) | `irr` | 数值原样；已带 `%` 则不再追加 |
| 综合收益率(%) | `cmprhnsvIrr` | 同上 |
| 租赁方式(实际) | `leaseMethodFact` | 原样 |
| 合同金额(元) | `contCashPledge` | 千分位 + 2 位小数 |
| 剩余本金(元) | `corpusBalancePledge` | 千分位 + 2 位小数 |
| 当前逾期金额(元) | `curOverdueAmount` | 千分位 + 2 位小数 |
| 合同起租日 | `leaseBeginDate` | 原样 |
| 合同到期日 | `contEndDate` | 原样 |
| 当前逾期天数 | `curOverdueDays` | 原样 |
| 历史最大逾期天数 | `historyOverdueDays` | 原样 |
| 历史逾期期数 | `historyOverdueTimes` | 原样 |

- `showIndex`: `true`
- `summary`：取 `guarantorAmountTotal`（规则同 §7.1）
- `emptyText`：同 §7.1

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

## 九、输出示例

```json
{
  "moduleIndex": 3,
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
        { "key": "customerRole", "label": "客户角色" },
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
        { "key": "historyOverdueTimes", "label": "历史逾期期数" }
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
        { "key": "customerRole", "label": "客户角色" },
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
        { "key": "historyOverdueTimes", "label": "历史逾期期数" }
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
4. `blocks` 内顺序严格按第六节表格排列（承租人表 → 担保人表 → 说明）
5. 不输出知识图谱、筛选主体、更新按钮等页面交互能力
6. 宽表不拆 block；14～15 列完整输出于单个 `table`，叠行由 L2 处理
