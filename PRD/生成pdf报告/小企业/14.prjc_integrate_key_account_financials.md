# 重点科目财务报表 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**14**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `financialStatementsOfKeyAccounts`，按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、透视展开、行级样式标注与 displayType 标注**，不调用税票 / 财报分析接口、不做 HTML 渲染。

页面为「按主体展开的资产负债表 + 利润表 + 模块级财务说明」；PDF **全部展开**（无「财报分析」跳转按钮、无上传主体财报等交互）。

> 若 `financialStatementsOfKeyAccounts` 为 null / 缺失，整模块不输出。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `14` |
| `moduleKey` | `key_account_financials` |
| `moduleName` | `重点科目财务报表` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `financialStatementsOfKeyAccounts` | 模块主数据对象 |
| `financialStatementsOfKeyAccounts.financialStatementsOfKeyAccountList[]` | 各主体财报表 |
| `financialStatementsOfKeyAccounts.financialStatementsOfKeyAccountList[].sheetName` | 主体标题（如「承租人XXX重点科目财务报表」） |
| `financialStatementsOfKeyAccounts.financialStatementsOfKeyAccountList[].fsDataSourceType` | 数据来源（展示为「数据来源：{值}」） |
| `financialStatementsOfKeyAccounts.financialStatementsOfKeyAccountList[].balanceSheet[]` | 资产负债表按期明细 |
| `financialStatementsOfKeyAccounts.financialStatementsOfKeyAccountList[].profitSheet[]` | 利润表按期明细 |
| `financialStatementsOfKeyAccounts.financialStatementsOfKeyAccountList[].balanceSheet[].period` / `financialStatementsOfKeyAccounts.financialStatementsOfKeyAccountList[].profitSheet[].period` | 期间列头，如 `202312` |
| `financialStatementsOfKeyAccounts.financialStatementsOfKeyAccountList[].balanceSheet[].dataType` / `financialStatementsOfKeyAccounts.financialStatementsOfKeyAccountList[].profitSheet[].dataType` | 单体 / 合并（列头红标） |
| `financialStatementsOfKeyAccounts.financialNotes` | 财务说明（模块级，全部主体表之后） |

**PDF 不提取 / 不输出：**

| 字段 / 能力 | 原因 |
| ----------- | ---- |
| `creditCode` / `customerNo` / `periodType` | 仅数据匹配 |
| `financialIndex[]` | 本页截图不展示（重点指标模块另有财务指标表） |
| 「财报分析」「上传主体财报」「税票授权财报引入」 | 页面交互 |

---

## 四、整合流程

```text
1. 若 financialStatementsOfKeyAccounts 为 null / 缺失：整模块不输出
2. 遍历 financialStatementsOfKeyAccountList（保持入参顺序）
3. 每个主体输出：主体标题栏 → 资产负债表 → 利润表
4. 全部主体结束后，若 financialNotes 有值：输出「财务说明」longText
5. 空值 →「—」；有值金额千分位保留 2 位；0.00 原样展示
6. 输出 moduleIndex=14 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

- 每个主体 `balanceSheet` / `profitSheet` 为空：仍输出对应表标题 + `emptyText`
- 期间列：按数组顺序提取不重复 `period`；列头同时带 `dataType`（如「单体」）
- 资产负债表与利润表期间列可不一致（各自独立透视）
- 行层级 `rowLevel`：`1` 一级合计（粉底加粗）、`2` 二级小计（黄底加粗）、`3` 明细行（缩进）
- 「财报分析」按钮：PDF **不输出**

---

## 六、blocks 组装顺序

| 顺序 | blockKey | displayType | 说明 |
| :--: | -------- | ----------- | ---- |
| 每主体 | `subject_{customerNo}_header` | `fsSubjectHeader` | `sheetName` + `fsDataSourceType` |
| 每主体 | `subject_{customerNo}_balanceSheet` | `financialStatementTable` | 资产负债表 |
| 每主体 | `subject_{customerNo}_profitSheet` | `financialStatementTable` | 利润表 |
| 末尾 | `financialNotes` | `longText` | 有值时；label=`财务说明` |

---

## 七、字段映射

### 7.1 主体标题栏（fsSubjectHeader）

| 属性 | 来源 |
| ---- | ---- |
| `title` | `sheetName` |
| `dataSource` | `fsDataSourceType`（展示前缀「数据来源：」） |

### 7.2 财务报表透视表（financialStatementTable）

| 属性 | 说明 |
| ---- | ---- |
| `label` | `资产负债表` / `利润表` |
| `unit` | 固定 `单位：元` |
| `periods[]` | `{ period, dataType }` |
| `rows[]` | `{ accountName, rowLevel, values: { [period]: string } }` |
| `emptyText` | `暂无数据` |

金额格式化：`null` / 空 → `—`；否则千分位 + 2 位小数（含 `0.00`、负数）。

### 7.3 资产负债表固定行序

| accountName | 字段 key | rowLevel |
| ----------- | -------- | :------: |
| 一、资产合计 | `totalAssets` | 1 |
| 1、流动资产合计 | `totalCurrentAssets` | 2 |
| 货币资金 | `monetaryFunds` | 3 |
| 短期投资 | `shortInvestments` | 3 |
| 应收票据 | `notesReceivable` | 3 |
| 应收账款 | `accountsReceivable` | 3 |
| 预付款项 | `prepayments` | 3 |
| 应收股利 | `dividentsReceivable` | 3 |
| 应收利息 | `interestReceivable` | 3 |
| 其他应收款 | `otherReceivables` | 3 |
| 存货 | `inventories` | 3 |
| 其他流动资产 | `otherCurrentAssets` | 3 |
| 2、非流动资产合计 | `totalNoncurrentAssets` | 2 |
| 长期债权投资 | `longDebtInvestments` | 3 |
| 长期股权投资 | `longEquityInvestments` | 3 |
| 固定资产原价 | `originalValueFixedAssets` | 3 |
| 减：累计折旧 | `accumulateDepreciation` | 3 |
| 固定资产账面价值 | `bookValueOfFixedAssets` | 3 |
| 在建工程 | `constructionProjects` | 3 |
| 生产性生物资产 | `producedBiologicalAssets` | 3 |
| 无形资产 | `intangibleAssets` | 3 |
| 长期待摊费用 | `longAmortisedExpenses` | 3 |
| 使用权资产 | `rightOfUseAsset` | 3 |
| 其他非流动资产 | `otherNoncurrentAssets` | 3 |
| 二、负债合计 | `totalLiabilities` | 1 |
| 1、流动负债合计 | `totalCurrentLiabilities` | 2 |
| 短期借款 | `shortLoans` | 3 |
| 应付票据 | `notesPayable` | 3 |
| 应付账款 | `accountsPayable` | 3 |
| 预收账款 | `accountsReceivedAdvance` | 3 |
| 应付职工薪酬 | `wagesPayable` | 3 |
| 应交税费 | `taxesPayable` | 3 |
| 应付利息 | `interestPayable` | 3 |
| 应付利润 | `profitPayable` | 3 |
| 其他应付款 | `otherPayables` | 3 |
| 其他流动负债 | `otherCurrentLiabilities` | 3 |
| 2、非流动负债合计 | `totalNoncurrentLiabilities` | 2 |
| 长期借款 | `longLoans` | 3 |
| 长期应付款 | `longPayables` | 3 |
| 递延收益 | `deferredIncome` | 3 |
| 租赁负债 | `leaseLiability` | 3 |
| 其他非流动负债 | `otherNoncurrentLiabilities` | 3 |
| 三、所有者权益(或股东权益)合计 | `totalOwnersEquity` | 1 |
| 实收资本(或股本) | `paidInCapital` | 3 |
| 资本公积 | `capitalSurplus` | 3 |
| 盈余公积 | `surplusReserves` | 3 |
| 未分配利润 | `undistributedProfit` | 3 |

### 7.4 利润表固定行序

| accountName | 字段 key | rowLevel |
| ----------- | -------- | :------: |
| 一、营业收入 | `revenueOperations` | 1 |
| 减：营业成本 | `costBusiness` | 3 |
| 营业税金及附加 | `mainBusinessTaxesSurcharges` | 3 |
| 销售费用 | `sellingExpenses` | 3 |
| 管理费用 | `administrativeExpenses` | 3 |
| 财务费用 | `financeCosts` | 3 |
| 二、营业利润 | `operatingProfit` | 1 |
| 加：营业外收入 | `nonoperatingIncome` | 3 |
| 减：营业外支出 | `nonoperatingExpenses` | 3 |
| 三、利润总额 | `totalProfit` | 1 |
| 减：所得税费用 | `incomeTaxExpense` | 3 |
| 四、净利润 | `netProfit` | 1 |

---

## 八、样式约定

| rowLevel | 样式 |
| :------: | ---- |
| 1 | 背景 `#FFECE8`，字重 600 |
| 2 | 背景 `#FFF7E8`，字重 600 |
| 3 | 科目名左侧缩进；斑马纹可选 |
| 列头 dataType | 红色小标签（如「单体」） |
| 金额列 | 右对齐 |

---

## 九、完整 JSON 示例（节选）

```json
{
  "moduleIndex": 14,
  "moduleName": "重点科目财务报表",
  "moduleKey": "key_account_financials",
  "blocks": [
    {
      "blockKey": "subject_120227949000_header",
      "displayType": "fsSubjectHeader",
      "title": "承租人芜湖华翔印务包装有限公司重点科目财务报表",
      "dataSource": "税票授权采集"
    },
    {
      "blockKey": "subject_120227949000_balanceSheet",
      "label": "资产负债表",
      "displayType": "financialStatementTable",
      "unit": "单位：元",
      "periods": [
        { "period": "202312", "dataType": "单体" },
        { "period": "202412", "dataType": "单体" }
      ],
      "rows": [
        {
          "accountName": "一、资产合计",
          "rowLevel": 1,
          "values": { "202312": "256,305,567.03", "202412": "269,270,210.06" }
        }
      ]
    },
    {
      "blockKey": "financialNotes",
      "label": "财务说明",
      "displayType": "longText",
      "value": "1、拟承租人2023年营业收入…"
    }
  ]
}
```
