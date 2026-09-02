# 经营数据分析 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**8**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> 业务对照：`尽调系统/项目审批/经营数据分析.md`  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `revenueAnalysis`，按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射、分组/透视与 displayType 标注**，不调用税票/流水接口、不筛选主体、不做 HTML 渲染。

页面为「主体列表 + 资产规模 + 生产销售情况分析 + 收入分析 + 还款能力分析」；PDF **按顺序全部展开**（无 Tab / 筛选主体 / 信息完善 badge 等交互）。宽表（列数 > 8）由 L2 自动叠行。

> 若 `revenueAnalysis` 为 null / 缺失，整模块不输出。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `8` |
| `moduleKey` | `revenue_analysis` |
| `moduleName` | `经营数据分析` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `revenueAnalysis` | 模块主数据对象 |
| `revenueAnalysis.subjectInfoList[]` | 主体列表 |
| `revenueAnalysis.assetSize` | 资产规模（厂房 / 设备 / 稼动率） |
| `revenueAnalysis.assetSize.factoryList[]` | 厂房情况 |
| `revenueAnalysis.assetSize.factoryDesc` | 厂房情况说明 |
| `revenueAnalysis.assetSize.mainEquipmentList[]` | 主要设备情况 |
| `revenueAnalysis.assetSize.ratioList[]` | 设备稼动率 |
| `revenueAnalysis.assetSize.ratioDesc` | 稼动率说明 |
| `revenueAnalysis.proAndSaleSituation` | 生产销售情况分析 |
| `revenueAnalysis.proAndSaleSituation.mainProductList[]` | 近 12 个月主营产品 |
| `revenueAnalysis.proAndSaleSituation.desc` | 主要原材料、生产工艺流程、行业地位说明 |
| `revenueAnalysis.proAndSaleSituation.downstreamCustomerList[]` | 主要下游客户 |
| `revenueAnalysis.proAndSaleSituation.downstreamCustomerDesc` | 下游客户司法诉讼情况概述 |
| `revenueAnalysis.proAndSaleSituation.productionAndSaleSituationDesc` | 生产销售情况说明（收入分析区） |
| `revenueAnalysis.incomeAnalysis` | 收入分析 |
| `revenueAnalysis.incomeAnalysis.operatingIncomeAnalysis[]` | 营业收入分析明细 |
| `revenueAnalysis.incomeAnalysis.operatingIncomeAnalysisTotal[]` | 营业收入分析合计行 |
| `revenueAnalysis.incomeAnalysis.operatingIncomeVerificationList[]` | 营业收入核验明细 |
| `revenueAnalysis.incomeAnalysis.operatingIncomeVerificationFlowTotalList[]` | 营业收入核验汇总行 |
| `revenueAnalysis.incomeAnalysis.operatingIncomeDesc` | 营业收入分析说明 |
| `revenueAnalysis.incomeAnalysis.operatingIncomeVerifyDesc` | 营业收入核验说明 |
| `revenueAnalysis.incomeAnalysis.ratio` | 可验证回款比例(%) |
| `revenueAnalysis.incomeAnalysis.repayAbilityAnalysis` | 还款能力分析 |
| `revenueAnalysis.incomeAnalysis.repayAbilityAnalysis.repayBaseInfoList[]` | 基础信息 |
| `revenueAnalysis.incomeAnalysis.repayAbilityAnalysis.revenueExpenseDetails[]` | 收支明细 |
| `revenueAnalysis.incomeAnalysis.repayAbilityAnalysis.repayAbilityIndex` | 还款能力指标（对象或数组） |
| `revenueAnalysis.incomeAnalysis.businessDataAnalysisDesc` | 经营数据分析说明 |

**PDF 不提取 / 不输出：**

| 字段 | 原因 |
| ---- | ---- |
| `customerNo` / 各类主键 | 仅数据匹配 |
| `operateAnalysisByCustomer` | 页面筛选态，PDF 全量输出 |
| `siIncomeVerifiUnit` / `siIncomeVerifiRemark` | 主体列表内部字段，页面不展示 |
| `pkCompanyAsset` / `pkRevenueAnalysis` / `pkOperatingRevenue` | 主键 |
| `bankStatementFromJz` 等内部流水字段 | 仅用于 L1 判断高亮，不单独成列 |
| 「筛选主体」「新增主体」「引入全部经营数据」 | 页面操作 |

---

## 四、整合流程

```text
1. 若 revenueAnalysis 为 null / 缺失：整模块不输出
2. 输出主体列表 table
3. 输出「资产规模」分组 + 厂房 / 设备 / 稼动率相关 blocks
4. 输出「生产销售情况分析」分组 + 主营产品 / 说明 / 下游客户 blocks
5. 输出「收入分析」分组 + 营业收入分析 / 核验 / 说明 blocks
6. 输出「还款能力分析」分组 + 基础信息 / 收支明细 / 指标 / 说明 blocks
7. 空值规范化为「—」；数值原样透传（不追加 %）
8. 输出 moduleIndex=8 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

- 各表 `null` / `[]`：仍输出对应 `table` block，走 `emptyText`
- 各说明类长文本为空：不输出该 `longText` block
- `factoryType`：`0`→自有、`1`→租用、`2`→无厂房；无法识别则原样或 `—`
- `paymentMethod[]`：多选用 `/` 拼接（如 `现金/银行承兑`）
- 主体角色列：`customerRole[]` 保留数组，列定义 `cellType: roleTag`（L2/mock-to-html 渲染色标）
- 按主体分组的表（主营产品、下游客户）：每组末尾插入「合计」行；`mergeSame` 合并主体名称与角色
- 营业收入分析 / 核验：L1 按时间区间动态生成列；底部汇总行 `_summary: true`，首列 `colspan=3`
- 银行流水与 `bankStatementFromJz` 不一致时：展示 `bankStatementFromJz`，并标记 `cellType: highlight`
- 「信息已完善」badge、筛选主体：PDF **不输出**

---

## 六、blocks 组装顺序

| 顺序 | blockKey | label | displayType | 说明 |
| :--: | -------- | ----- | ----------- | ---- |
| 1 | `subjectInfoList` | `主体列表` | `table` | 序号 + 主体名称 + 主体角色 |
| 2 | `assetSizeTitle` | `资产规模` | `group`（仅标题） | 分隔标题 |
| 3 | `factoryList` | `厂房情况` | `table` | 宽表叠行 |
| 4 | `factoryDesc` | `厂房情况说明` | `longText` | 有值时 |
| 5 | `mainEquipmentList` | `主要设备情况` | `table` | 空列表走 emptyText |
| 6 | `ratioList` | `设备稼动率情况` | `table` | |
| 7 | `ratioDesc` | `稼动率说明` | `longText` | 有值时 |
| 8 | `proAndSaleTitle` | `生产销售情况分析` | `group`（仅标题） | |
| 9 | `mainProductList` | `近12个月主营产品` | `table` | 按主体分组 + 合计行 |
| 10 | `materialProcessDesc` | `主要原材料、生产工艺流程、产品处于行业地位分析等说明` | `longText` | 有值时 |
| 11 | `downstreamCustomerList` | `主要下游客户` | `table` | 按主体分组 + 合计行 |
| 12 | `downstreamCustomerDesc` | `下游客户司法诉讼情况概述` | `longText` | 有值时 |
| 13 | `incomeAnalysisTitle` | `收入分析` | `group`（仅标题） | |
| 14 | `productionAndSaleSituationDesc` | `生产销售情况说明` | `longText` | 有值时 |
| 15 | `operatingIncomeAnalysis` | `营业收入分析` | `table` | 动态年份列 + 汇总行 |
| 16 | `operatingIncomeDesc` | `营业收入分析说明` | `longText` | 有值时 |
| 17 | `verifiableRatio` | `可验证回款比例(%)` | `direct` | 取 `incomeAnalysis.ratio` |
| 18 | `operatingIncomeVerification` | `营业收入核验` | `table` | 动态月份列 + 汇总行 |
| 19 | `operatingIncomeVerifyDesc` | `营业收入核验说明` | `longText` | 有值时 |
| 20 | `repayAbilityTitle` | `还款能力分析` | `group`（仅标题） | |
| 21 | `repayBaseInfoList` | `基础信息` | `table` | |
| 22 | `revenueExpenseDetails` | `收支明细` | `table` | 宽表叠行 |
| 23 | `repayAbilityIndexList` | `还款能力指标` | `table` | |
| 24 | `businessDataAnalysisDesc` | `经营数据分析说明` | `longText` | 有值时 |

---

## 七、字段映射与 displayType 规则

### 7.1 主体列表（table）

**blockKey：** `subjectInfoList`  
**showIndex：** `true`  
**emptyText：** `暂无主体数据`

| 顺序 | 列 label | key | 说明 |
| :--: | -------- | --- | ---- |
| 1 | 主体名称 | `subjectName` | 原样 |
| 2 | 主体角色 | `customerRole` | `cellType: roleTag` |

### 7.2 厂房情况（table · 叠行宽表）

**blockKey：** `factoryList`  
**showIndex：** `true`  
**emptyText：** `暂无厂房数据`

| 顺序 | 列 label | key | 叠行属性 |
| :--: | -------- | --- | -------- |
| 1 | 主体名称 | `subjectName` | `stackSpan` |
| 2 | 主体角色 | `customerRole` | `stackSpan`；`cellType: roleTag` |
| 3 | 厂房类型 | `factoryType` | 配对 |
| 4 | 厂房面积(平方米) | `factoryArea` | 配对 |
| 5 | 厂房年租金(万) | `factoryRent` | 配对 |
| 6 | 租赁到期日 | `leaseEndDate` | 配对 |
| 7 | 当前是否有欠租 | `haveLoan` | 配对 |
| 8 | 土地面积(平方米) | `landArea` | 配对 |
| 9 | 土地价值(万) | `landValue` | 配对 |
| 10 | 所在位置 | `address` | 配对 |
| 11 | 是否有不动产权证 | `haveDocument` | 配对 |
| 12 | 土地厂房是否抵押 | `landMortgaged` | 配对 |

### 7.3 主要设备情况（table）

| 顺序 | 列 label | key |
| :--: | -------- | --- |
| 1 | 主体名称 | `subjectName` |
| 2 | 主体角色 | `customerRole`（`roleTag`） |
| 3 | 数量、名称及品牌 | `equipmentDesc` |
| 4 | 原值(元) | `originalValue` |

> 入参字段名因接口而异，L1 映射：`equipmentDesc` ← 数量名称品牌字段；无数据时 `emptyText: 暂无数据`。

### 7.4 设备稼动率（table）

| 顺序 | 列 label | key |
| :--: | -------- | --- |
| 1 | 主体名称 | `subjectName` |
| 2 | 主体角色 | `customerRole`（`roleTag`） |
| 3 | 当前设备稼动率(%) | `ratio` |

### 7.5 近 12 个月主营产品（table · 分组）

按 `subjectName` + `customerNo` 分组；每组产品行后追加合计行：

| 合计行 | 取值 |
| ------ | ---- |
| `productName` | `合计` |
| `saleNoteAmount` | 组内 `saleNoteAmount` 求和（保留原小数位） |
| `ratio` | 组内 `ratio` 求和（保留 4 位） |
| `source` | `—` |

列：`subjectName`、`customerRole`（`mergeSame` + `roleTag`）、`productName`、`saleNoteAmount`、`ratio`、`source`

### 7.6 主要下游客户（table · 分组）

分组规则同 §7.5。合计行：

| 合计行 | 取值 |
| ------ | ---- |
| `customerName` | `合计` |
| `saleAmount` | 组内求和 |
| `ratio` | 组内求和 |
| 其余列 | `—` |

列：`subjectName`、`customerRole`（`mergeSame` + `roleTag`）、`customerName`、`saleAmount`、`ratio`、`settlementCycle`、`paymentMethod`、`cooperateDuration`、`source`

### 7.7 营业收入分析（table · 透视）

1. 从 `operatingIncomeAnalysis[]` 按 `serialNumber` 顺序提取不重复 `timeInterval` 作为动态列  
2. 每个主体 2 行：`开票收入(万)` / `不开票收入(万)`；`subjectName`、`customerRole` 做 `mergeSame`（rowspan=2）  
3. 底部 3 行汇总（`_summary: true`，首列 colspan 3）取自 `operatingIncomeAnalysisTotal[]`：

| 汇总 label | 字段 |
| ---------- | ---- |
| 合计(万) | `invoicingRevenue` |
| 关联交易(万) | `relatedTransaction` |
| 剔除关联交易后合计(万) | `excludeRelatedTransaction` |

### 7.8 营业收入核验（table · 透视）

1. 动态列：各月 `timeInterval` + `合计` + `均值`  
2. 每个主体 6 行类型（顺序固定）：

| 类型 label | 字段 |
| ---------- | ---- |
| 纳税申报收入(万) | `taxDeclareIncome` |
| 银行流水(万)(剔除关联交易) | `bankStatement`（有 `bankStatementFromJz` 且不同则取后者并高亮） |
| 银行承兑(万)(剔除关联交易) | `bankAcceptance` |
| 纳税申报采购(万) | `taxableIncome` |
| 电费(万) | `electricityFee` |
| 工资总额(万) | `wage` |

3. 底部 3 行汇总（`_summary: true`）取自 `operatingIncomeVerificationFlowTotalList[]`：

| 汇总 label | 字段 |
| ---------- | ---- |
| 流水与承兑合计(万)(剔除关联交易) | `totalFlow` |
| 纳税申报收入关联交易(万) | `relatedTransaction` |
| 剔除关联交易后纳税申报收入合计(万) | `excludeRelatedTransaction` |

### 7.9 还款能力分析

**基础信息** — `repayBaseInfoList`：流水收入(万)、开票收入(万)、日均余额(万)

**收支明细** — `revenueExpenseDetails`（叠行宽表）：原材料成本、人员工资、租赁费用、水电物业、外发加工、实际控制人月还款、银行贷款利息、融资租赁租金、其他费用、支出合计、月结余

**还款能力指标** — 以 `repayBaseInfoList` 为主体顺序；优先取 `repayAbilityIndex`（对象则包装为数组）同 `customerNo` 匹配行；缺失时由 `revenueExpenseDetails` 推导（`maxRent` 由分转万，`rate` 等按页面公式计算）

| 列 label | key |
| -------- | --- |
| 最大一期租金(万) | `maxRent` |
| 月结余/最大一期租金(%) | `rate` |
| 日均余额/最大一期租金(%) | `averageDailyBalanceRatio` |
| 日均余额/流水收入(%) | `averageDailyBalanceRate` |

---

## 八、主体角色色标（L2 扩展 · mock-to-html 已实现）

| 角色 | tone | 说明 |
| ---- | ---- | ---- |
| 承租人 | `lessee` | 浅蓝底 + 蓝字 |
| 担保人 | `guarantor` | 浅橙底 + 橙字 |
| 关联方 | `related` | 浅绿底 + 绿字 |

列定义增加 `cellType: 'roleTag'`；值为 `string[]`。正式 L2 扩展见后续 `prjc_style_render` 迭代，当前由 `mock-to-html.mjs` 内联 CSS 支持。

---

## 九、完整 JSON 示例（节选）

```json
{
  "moduleIndex": 8,
  "moduleName": "经营数据分析",
  "moduleKey": "revenue_analysis",
  "blocks": [
    {
      "blockKey": "subjectInfoList",
      "label": "主体列表",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "subjectName", "label": "主体名称" },
        { "key": "customerRole", "label": "主体角色", "cellType": "roleTag" }
      ],
      "rows": [
        {
          "subjectName": "上海一可包装制品有限公司",
          "customerRole": ["承租人"]
        }
      ],
      "emptyText": "暂无主体数据"
    },
    {
      "blockKey": "assetSizeTitle",
      "label": "资产规模",
      "displayType": "group",
      "columns": 1,
      "children": []
    }
  ]
}
```
