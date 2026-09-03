# 实施方案 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**6**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `embodiment`（及同构报价 / 增信子对象），按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不做业务分析、不计算风险敞口、不做 HTML 渲染。

页面为 Tab 的「租金计划表 / 保证金计划 / 其他收支计划」在 PDF 中**按顺序全部展开**输出（无 Tab 交互）。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `6` |
| `moduleKey` | `implementation_plan` |
| `moduleName` | `实施方案` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `embodiment` | 模块主数据对象 |
| `embodiment.riskExposure` | 预测风险敞口(元) |
| `embodiment.rate` | 预测风险敞口/设备原值(%) |
| `embodiment.lesseeAggregateRiskExposure` | 承租人累计风险敞口(元) |
| `embodiment.aggregateRiskExposure` | 承租人及关联方累计风险敞口(元) |
| `embodiment.advertisingInfoList[]` | 报价方案列表（投放信息 / 付款条件 / 各类计划） |
| `embodiment.advertisingInfoList[].paymentTermList` | 付款条件及笔数 |
| `embodiment.advertisingInfoList[].rentPlan` | 租金计划表（含汇总 + 明细） |
| `embodiment.advertisingInfoList[].depositPlan` | 保证金计划 |
| `embodiment.advertisingInfoList[].otherPlan` | 其他收支计划 |
| `commonCreditEnhancementMeasure.creditEnhancementMeasureList[]` | 按 `quotName` 匹配的增信措施（优先） |
| `embodiment.creditEnhancementMeasureInfo` | 实施方案内嵌增信措施（次选） |
| `creditEnhancementMeasure` | 顶层增信措施（兜底） |

> 多报价时，按 `advertisingInfoList` 接口返回顺序逐条输出；每条报价以其 `quotName` 作为分组标题。

---

## 四、整合流程

```text
1. 从 embodiment 提取风险敞口汇总字段
2. 遍历 advertisingInfoList，组装各报价子块
3. 按固定 blocks 顺序输出（见第六节）
4. 为每个字段标注 displayType 并格式化展示值
5. 输出 moduleIndex=6 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

**固定输出范围（对齐小企业页面）：**

| 分组 / 字段 | 是否输出 |
| ----------- | :------: |
| 风险敞口汇总（4 项） | ✅ |
| 报价方案（`quotName` 分组） | ✅ |
| 投放信息（含贴息、银票收益率、是否调息） | ✅ |
| 付款条件及笔数 | ✅ |
| 租金计划表（汇总 + 明细） | ✅ |
| 保证金计划 | ✅ |
| 其他收支计划 | ✅ |
| 增信措施 | ✅ |
| 保险规则 / 保险 | — |
| 单瓦融资额 | — |
| 支付方式 / 备注（环卫专属） | — |

**空数据规则：**

- `advertisingInfoList` 为 `null` / `[]`：仍输出风险敞口汇总（有值则展示，无值 `—`）；不输出报价子块，可追加 `empty` block，`emptyText: 暂无关联报价`
- 单表为空：该表走对应 `emptyText`，其余块正常输出
- 增信措施列表为空：输出 `measureList`，`emptyText: 暂无增信措施`

**页面交互不输出：** 关联报价 / 取消关联 / 编辑 / 保存、知识图谱等

---

## 六、blocks 组装顺序

模块内 `blocks` 按以下顺序输出（与页面展示顺序一致；多报价时对每个报价重复 2～8）：

| 顺序 | blockKey | label | displayType |
| :--: | -------- | ----- | ----------- |
| 1 | `riskSummary` | （无标题 / 可不传 label） | `group` |
| 2 | `quoteTitle_{i}` | `{quotName}` | `group`（仅标题，`children` 可为空） |
| 3 | `loanInfo_{i}` | `投放信息` | `group` |
| 4 | `paymentTermList_{i}` | `付款条件及笔数` | `table` |
| 5 | `rentPlanSummary_{i}` | `租金计划表` | `group` |
| 6 | `rentPlanDetail_{i}` | （不传 label，紧接上块） | `table` |
| 7 | `depositPlan_{i}` | `保证金计划` | `table` |
| 8 | `otherPlan_{i}` | `其他收支计划` | `table` |
| 9 | `creditEnhancement_{i}` | `增信措施` | `measureList` |

> `{i}` 为报价在 `advertisingInfoList` 中的下标（从 0 起）。多报价时按列表顺序完整重复 2～9。

---

## 七、字段映射与 displayType 规则

### 7.1 风险敞口汇总（group）

数据来源：`embodiment` 顶层字段

**blockKey：** `riskSummary`  
**columns：** `4`  
**label：** 不传（页面为顶栏指标行，无蓝色小节标题）

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 预测风险敞口(元) | `riskExposure` | 千分位 + 2 位小数 |
| 预测风险敞口/设备原值(%) | `rate` | 原样；纯数字保留接口精度（如 `24.5000`） |
| 承租人累计风险敞口(元) | `lesseeAggregateRiskExposure` | 千分位 + 2 位小数 |
| 承租人及关联方累计风险敞口(元) | `aggregateRiskExposure` | 千分位 + 2 位小数 |

```json
{
  "blockKey": "riskSummary",
  "displayType": "group",
  "columns": 4,
  "children": [
    { "blockKey": "riskExposure", "label": "预测风险敞口(元)", "displayType": "direct", "value": "9,800.00" },
    { "blockKey": "rate", "label": "预测风险敞口/设备原值(%)", "displayType": "direct", "value": "24.5000" },
    { "blockKey": "lesseeAggregateRiskExposure", "label": "承租人累计风险敞口(元)", "displayType": "direct", "value": "13,862,560.87" },
    { "blockKey": "aggregateRiskExposure", "label": "承租人及关联方累计风险敞口(元)", "displayType": "direct", "value": "13,862,560.87" }
  ]
}
```

### 7.2 报价方案标题（group）

数据来源：`advertisingInfoList[i].quotName`

```json
{
  "blockKey": "quoteTitle_0",
  "label": "20260810回租1",
  "displayType": "group",
  "columns": 1,
  "children": []
}
```

- `label` 取 `quotName`；空则填 `—`
- L2 渲染为蓝色圆点小节标题，对应页面报价名称标签

### 7.3 投放信息（group）

数据来源：`advertisingInfoList[i]`

**blockKey：** `loanInfo_{i}`  
**label：** `投放信息`  
**columns：** `4`（对齐统一栅格；页面约 5 列，PDF 按 4 列换行）

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 投放金额(元) | `advertisingAmount` | 千分位 + 2 位小数 |
| 租金总额(元) | `totalRent` | 千分位 + 2 位小数 |
| 首付款金额(元) | `downPaymentRent` | 千分位 + 2 位小数；空可回退 `downPaymentSetting.downPayment` |
| 贴息金额(元) | `interestSubsidy` | 千分位 + 2 位小数 |
| 保证金金额(元) | `marginRent` | 千分位 + 2 位小数 |
| 名义货价(元) | `nominalPrice` | 千分位 + 2 位小数 |
| 综合收益率(%) | `comprehensiveYield` | 原样 |
| 内部收益率(%) | `internalYield` | 原样 |
| 租金分配IRR(%) | `rentDistribution` | 原样 |
| 报价利率(%) | `quotationRate` | 原样 |
| 租赁期限(月) | `leasingTerm` | 原样 |
| 租赁方式 | `leaseMethod` | 原样 |
| 是否起租调整 | `isStartLease` | 原样 |
| 先付后付标识 | `paymentOrder` | 原样 |
| 投放日期 | `advertisingDate` | 原样 |
| 银票收益率(%) | `babRate` | 原样；空可回退 `referenceRate.contIrrBanknote` |
| 是否调息 | `isAdjustingInterest` | 原样 |

### 7.4 付款条件及笔数（table）

数据来源：`advertisingInfoList[i].paymentTermList`

**blockKey：** `paymentTermList_{i}`  
**label：** `付款条件及笔数`

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 期数展示 | `number` | 原样 |
| 付款方式 | `paymentMethod` | 原样；已为中文则直接展示 |
| 是否内扣 | `ifInnerDeduct` | 原样 |
| 计划投放日期 | `plannedLaunchDate` | 原样 |
| 金额(元) | `amount` | 千分位 + 2 位小数 |
| 付款条件 | `paymentTerm` | 原样；多条件已用 `；` 分隔则直接展示；空可回退拼接 `paymentConditions` |
| 付款对象 | `paymentRecipient` | 原样 |

- `showIndex`: `true`（对应页面「序号」列）
- `emptyText`: `暂无付款条件`
- 金额列建议 `align: "right"`

### 7.5 租金计划表 · 汇总（group）

数据来源：`advertisingInfoList[i].rentPlan`

**blockKey：** `rentPlanSummary_{i}`  
**label：** `租金计划表`  
**columns：** `3`

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 租金总额(元) | `rentTotalAmount` | 千分位 + 2 位小数 |
| 本金总额(元) | `principalTotalAmount` | 千分位 + 2 位小数 |
| 利息总额(元) | `interestTotalAmount` | 千分位 + 2 位小数 |

### 7.6 租金计划表 · 明细（table）

数据来源：`advertisingInfoList[i].rentPlan.rentPlanDetailList`

**blockKey：** `rentPlanDetail_{i}`  
**label：** 不传（标题已由 §7.5 输出）

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 期数 | `leaseTime` | 原样 |
| 事件类别 | `eventCategory` | 原样 |
| 计划收取日期 | `planDate` | 原样 |
| 租金(元) | `rentAmount` | 千分位 + 2 位小数 |
| 利息(元) | `interestAmount` | 千分位 + 2 位小数 |
| 本金(元) | `principalAmount` | 千分位 + 2 位小数 |

- `showIndex`: `false`（期数为业务字段，非自增序号）
- `emptyText`: `暂无租金计划`
- 金额列建议 `align: "right"`

### 7.7 保证金计划（table）

数据来源：`advertisingInfoList[i].depositPlan.depositPlanDetailList`

**blockKey：** `depositPlan_{i}`  
**label：** `保证金计划`

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 期数 | `leaseTime` | 原样 |
| 事件类别 | `eventName` | 原样；空可回退 `eventCategory` / `type` |
| 还款日期 | `planDate` | 原样 |
| 应收金额(元) | `amount` | 千分位 + 2 位小数；空可回退 `leaseCash` |

- `showIndex`: `false`
- `emptyText`: `暂无保证金计划`

### 7.8 其他收支计划（table）

数据来源：`advertisingInfoList[i].otherPlan.otherPlanDetailList`

**blockKey：** `otherPlan_{i}`  
**label：** `其他收支计划`

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 期数 | `leaseTime` | 原样 |
| 还款类型 | `type` | 原样 |
| 还款日期 | `planDate` | 原样 |
| 金额(元) | `amount` | 千分位 + 2 位小数；空可回退 `leaseCash` |

- `showIndex`: `false`
- `emptyText`: `暂无其他收支计划`

### 7.9 增信措施（measureList · 卡片列表）

对齐页面「增信措施」卡片样式：每条措施一张卡，含担保方式色标、客户身份行；抵押/质押额外展开属性行 + 担保物明细表。

数据来源（按优先级）：

1. `commonCreditEnhancementMeasure.creditEnhancementMeasureList` 中 `quotName` 与当前报价一致的项 → 其内层 `creditEnhancementMeasureList`
2. `embodiment.creditEnhancementMeasureInfo.creditEnhancementMeasureList`
3. `creditEnhancementMeasure.creditEnhancementMeasureList`（若带 `quotName` 则按报价过滤）

**blockKey：** `creditEnhancement_{i}`  
**label：** `增信措施`  
**displayType：** `measureList`  
**emptyText：** `暂无增信措施`

#### 7.9.1 卡片主字段（每条 `items[]`）

| 字段 | key / 规则 | 格式化 |
| ---- | ---------- | ------ |
| 担保方式文案 | `guaranteeMethod` | 取对象 `desc`；已是字符串则原样 |
| 担保方式色调 | `guaranteeTone` | 见下表；L2 按此渲染标签色 |
| 客户名称 | `customerName` | 原样 |
| 关系标签 | `relationship` | 原样；空则不传（不渲染绿色关系 tag） |
| 证件类型 | `crdntlsType` | 原样 |
| 证件代码 | `documentCode` | 原样 |

**`guaranteeTone` 映射（按 `guaranteeMethod.code` / 文案）：**

| 担保方式 | code | `guaranteeTone` | 标签色（L2） |
| -------- | :--: | --------------- | ------------ |
| 保证担保 | 1 | `guarantee` | 橙 `#FF7D00` |
| 抵押担保 | 3 | `mortgage` | 蓝 `#3491FA` |
| 质押担保 | 5 | `pledge` | 浅橙 `#FF9A2E` |
| 其他 / 未知 | — | `default` | 灰 `#86909C` |

> 有 `desc` 无 `code` 时按文案包含「保证 / 抵押 / 质押」匹配；均无法匹配则 `default`。

#### 7.9.2 抵押 / 质押属性行（`attrs`）

仅当担保方式为 **抵押担保** 或 **质押担保** 时输出 `attrs`（保证担保不传）：

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 抵押物类别 | `collateralType` | 原样；空 → `—` |
| 抵质押物类型 | `mortgageAndPledgeType` | 原样；空 → `—` |
| 抵质押物分类 | `mortgageAndPledgeClass` | 原样；空 → `—` |

```json
"attrs": [
  { "label": "抵押物类别", "value": "其他" },
  { "label": "抵质押物类型", "value": "动产" },
  { "label": "抵质押物分类", "value": "4.3.1车辆" }
]
```

#### 7.9.3 担保物明细（`collateral`）

仅当 `collateralList` 非空时输出；结构复用 table Schema（由 L2 在卡片内渲染；列数 > 8 自动叠行）：

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 担保物名称 | `assetsName` | 原样 |
| 所在地 | `locationVfbc` | 原样 |
| 车牌号/不动产面积 | `assetsNo1Vfbc` | 原样 |
| 机身号/不动产单元号 | `assetsNo` | 原样 |
| 租赁物唯一识别码/抵质押证书编号 | `assetsNo2Vfbc` | 原样 |
| 担保物估值(元) | `estimateValue` | 千分位 + 2 位小数 |
| 币种 | `currtype` | 原样 |
| 第三方质押债务人 | `debtor` | 原样 |
| 是否第一顺位 | `isFirstOrder` | 原样 |
| 评估方式 | `assessMode` | 原样 |
| 优先受偿权数额 | `compensationNumber` | 千分位 + 2 位小数（已是文案则原样） |
| 估值周期 | `valuationCycle` | 原样 |

- `collateral.label`: `担保物`
- `collateral.showIndex`: `true`
- **全部列**默认左对齐（不传 `align`，或统一 `align: "left"`）；表头与单元格对齐一致
- L2 用 `.report-measure-card__collateral .report-table th/td { text-align: left }` 兜底
- `collateralList` 为空 / null：不传 `collateral` 字段（保证担保天然无此块）

#### 7.9.4 输出示例

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
    },
    {
      "guaranteeMethod": "保证担保",
      "guaranteeTone": "guarantee",
      "customerName": "肖令权",
      "relationship": "实控人父母",
      "crdntlsType": "居民身份证",
      "documentCode": "51222219750923425X"
    },
    {
      "guaranteeMethod": "抵押担保",
      "guaranteeTone": "mortgage",
      "customerName": "肖令权",
      "relationship": "实控人父母",
      "crdntlsType": "居民身份证",
      "documentCode": "51222219750923425X",
      "attrs": [
        { "label": "抵押物类别", "value": "其他" },
        { "label": "抵质押物类型", "value": "动产" },
        { "label": "抵质押物分类", "value": "4.3.1车辆" }
      ],
      "collateral": {
        "label": "担保物",
        "showIndex": true,
        "columns": [
          { "key": "assetsName", "label": "担保物名称" , "align": "right" },
          { "key": "locationVfbc", "label": "所在地" , "align": "right" },
          { "key": "assetsNo1Vfbc", "label": "车牌号/不动产面积" , "align": "right" },
          { "key": "assetsNo", "label": "机身号/不动产单元号" , "align": "right" },
          { "key": "assetsNo2Vfbc", "label": "租赁物唯一识别码/抵质押证书编号" , "align": "right" },
          { "key": "estimateValue", "label": "担保物估值(元)", "align": "right" },
          { "key": "currtype", "label": "币种" , "align": "right" },
          { "key": "debtor", "label": "第三方质押债务人" , "align": "right" },
          { "key": "isFirstOrder", "label": "是否第一顺位" , "align": "right" },
          { "key": "assessMode", "label": "评估方式" , "align": "right" },
          { "key": "compensationNumber", "label": "优先受偿权数额", "align": "right" },
          { "key": "valuationCycle", "label": "估值周期" , "align": "right" }
        ],
        "rows": [
          {
            "assetsName": "1",
            "locationVfbc": "3",
            "assetsNo1Vfbc": "4",
            "assetsNo": "5",
            "assetsNo2Vfbc": "6",
            "estimateValue": "2.00",
            "currtype": "人民币",
            "debtor": "7",
            "isFirstOrder": "第一顺位",
            "assessMode": "内部评估",
            "compensationNumber": "0.00",
            "valuationCycle": "季度"
          }
        ]
      }
    }
  ]
}
```

**PDF 不输出：** 知识图谱入口、编辑/删除、担保人详情弹层等页面交互。

---

## 八、空值与格式化规则

| 规则 | 说明 |
| ---- | ---- |
| 空值占位 | `null` / `""` / 缺失 → 展示值填 `—` |
| 金额 | 千分位 + 保留 2 位小数，如 `10,000.00` |
| 比率 / 收益率 | 接口已为百分比文案则原样；纯数字不做额外精度改写（如 `10.8263`、`24.5000`） |
| 枚举 | 直接展示接口返回的中文值，不做码值转换 |
| 对象枚举 | 如 `guaranteeMethod` 为 `{ desc: "保证担保" }` 时取 `desc` |
| 列表顺序 | 按接口返回顺序输出，L1 不重排 |
| 多报价 | 严格按 `advertisingInfoList` 顺序展开；每条报价的子块完整输出后再进入下一条 |

---

## 九、输出示例

```json
{
  "moduleIndex": 6,
  "moduleName": "实施方案",
  "moduleKey": "implementation_plan",
  "blocks": [
    {
      "blockKey": "riskSummary",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "riskExposure", "label": "预测风险敞口(元)", "displayType": "direct", "value": "9,800.00" },
        { "blockKey": "rate", "label": "预测风险敞口/设备原值(%)", "displayType": "direct", "value": "24.5000" },
        { "blockKey": "lesseeAggregateRiskExposure", "label": "承租人累计风险敞口(元)", "displayType": "direct", "value": "13,862,560.87" },
        { "blockKey": "aggregateRiskExposure", "label": "承租人及关联方累计风险敞口(元)", "displayType": "direct", "value": "13,862,560.87" }
      ]
    },
    {
      "blockKey": "quoteTitle_0",
      "label": "20260810回租1",
      "displayType": "group",
      "columns": 1,
      "children": []
    },
    {
      "blockKey": "loanInfo_0",
      "label": "投放信息",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "advertisingAmount", "label": "投放金额(元)", "displayType": "direct", "value": "10,000.00" },
        { "blockKey": "totalRent", "label": "租金总额(元)", "displayType": "direct", "value": "10,164.00" },
        { "blockKey": "downPaymentRent", "label": "首付款金额(元)", "displayType": "direct", "value": "0.00" },
        { "blockKey": "interestSubsidy", "label": "贴息金额(元)", "displayType": "direct", "value": "300.00" },
        { "blockKey": "marginRent", "label": "保证金金额(元)", "displayType": "direct", "value": "200.00" },
        { "blockKey": "nominalPrice", "label": "名义货价(元)", "displayType": "direct", "value": "100.00" },
        { "blockKey": "comprehensiveYield", "label": "综合收益率(%)", "displayType": "direct", "value": "10.8263" },
        { "blockKey": "internalYield", "label": "内部收益率(%)", "displayType": "direct", "value": "10.4321" },
        { "blockKey": "rentDistribution", "label": "租金分配IRR(%)", "displayType": "direct", "value": "3.0102" },
        { "blockKey": "quotationRate", "label": "报价利率(%)", "displayType": "direct", "value": "3.0000" },
        { "blockKey": "leasingTerm", "label": "租赁期限(月)", "displayType": "direct", "value": "12" },
        { "blockKey": "leaseMethod", "label": "租赁方式", "displayType": "direct", "value": "回租" },
        { "blockKey": "isStartLease", "label": "是否起租调整", "displayType": "direct", "value": "否" },
        { "blockKey": "paymentOrder", "label": "先付后付标识", "displayType": "direct", "value": "后付" },
        { "blockKey": "advertisingDate", "label": "投放日期", "displayType": "direct", "value": "2026-08-10" },
        { "blockKey": "babRate", "label": "银票收益率(%)", "displayType": "direct", "value": "—" },
        { "blockKey": "isAdjustingInterest", "label": "是否调息", "displayType": "direct", "value": "否" }
      ]
    },
    {
      "blockKey": "paymentTermList_0",
      "label": "付款条件及笔数",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "number", "label": "期数展示" },
        { "key": "paymentMethod", "label": "付款方式" },
        { "key": "ifInnerDeduct", "label": "是否内扣" },
        { "key": "plannedLaunchDate", "label": "计划投放日期" },
        { "key": "amount", "label": "金额(元)", "align": "right" },
        { "key": "paymentTerm", "label": "付款条件" },
        { "key": "paymentRecipient", "label": "付款对象" }
      ],
      "rows": [
        {
          "number": "投放日",
          "paymentMethod": "网银",
          "ifInnerDeduct": "否",
          "plannedLaunchDate": "2026-08-10",
          "amount": "10,000.00",
          "paymentTerm": "融资租赁合同已生效",
          "paymentRecipient": "苏州隆实电子科技有限公司"
        }
      ],
      "emptyText": "暂无付款条件"
    },
    {
      "blockKey": "rentPlanSummary_0",
      "label": "租金计划表",
      "displayType": "group",
      "columns": 3,
      "children": [
        { "blockKey": "rentTotalAmount", "label": "租金总额(元)", "displayType": "direct", "value": "10,164.00" },
        { "blockKey": "principalTotalAmount", "label": "本金总额(元)", "displayType": "direct", "value": "10,000.00" },
        { "blockKey": "interestTotalAmount", "label": "利息总额(元)", "displayType": "direct", "value": "164.00" }
      ]
    },
    {
      "blockKey": "rentPlanDetail_0",
      "displayType": "table",
      "showIndex": false,
      "columns": [
        { "key": "leaseTime", "label": "期数" },
        { "key": "eventCategory", "label": "事件类别" },
        { "key": "planDate", "label": "计划收取日期" },
        { "key": "rentAmount", "label": "租金(元)", "align": "right" },
        { "key": "interestAmount", "label": "利息(元)", "align": "right" },
        { "key": "principalAmount", "label": "本金(元)", "align": "right" }
      ],
      "rows": [
        {
          "leaseTime": "1",
          "eventCategory": "收租",
          "planDate": "2026-09-10",
          "rentAmount": "847.00",
          "interestAmount": "25.00",
          "principalAmount": "822.00"
        }
      ],
      "emptyText": "暂无租金计划"
    },
    {
      "blockKey": "depositPlan_0",
      "label": "保证金计划",
      "displayType": "table",
      "showIndex": false,
      "columns": [
        { "key": "leaseTime", "label": "期数" },
        { "key": "eventCategory", "label": "事件类别" },
        { "key": "planDate", "label": "还款日期" },
        { "key": "amount", "label": "应收金额(元)", "align": "right" }
      ],
      "rows": [
        {
          "leaseTime": "1",
          "eventCategory": "收取保证金",
          "planDate": "2026-08-10",
          "amount": "200.00"
        },
        {
          "leaseTime": "1",
          "eventCategory": "保证金冲抵",
          "planDate": "2027-08-10",
          "amount": "200.00"
        }
      ],
      "emptyText": "暂无保证金计划"
    },
    {
      "blockKey": "otherPlan_0",
      "label": "其他收支计划",
      "displayType": "table",
      "showIndex": false,
      "columns": [
        { "key": "leaseTime", "label": "期数" },
        { "key": "type", "label": "还款类型" },
        { "key": "planDate", "label": "还款日期" },
        { "key": "amount", "label": "金额(元)", "align": "right" }
      ],
      "rows": [
        {
          "leaseTime": "1",
          "type": "名义价格",
          "planDate": "2027-08-10",
          "amount": "100.00"
        },
        {
          "leaseTime": "1",
          "type": "贴息",
          "planDate": "2026-08-11",
          "amount": "300.00"
        }
      ],
      "emptyText": "暂无其他收支计划"
    },
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
        },
        {
          "guaranteeMethod": "保证担保",
          "guaranteeTone": "guarantee",
          "customerName": "肖令权",
          "relationship": "实控人父母",
          "crdntlsType": "居民身份证",
          "documentCode": "51222219750923425X"
        },
        {
          "guaranteeMethod": "抵押担保",
          "guaranteeTone": "mortgage",
          "customerName": "肖令权",
          "relationship": "实控人父母",
          "crdntlsType": "居民身份证",
          "documentCode": "51222219750923425X",
          "attrs": [
            { "label": "抵押物类别", "value": "其他" },
            { "label": "抵质押物类型", "value": "动产" },
            { "label": "抵质押物分类", "value": "4.3.1车辆" }
          ],
          "collateral": {
            "label": "担保物",
            "showIndex": true,
            "columns": [
              { "key": "assetsName", "label": "担保物名称" , "align": "right" },
              { "key": "locationVfbc", "label": "所在地" , "align": "right" },
              { "key": "assetsNo1Vfbc", "label": "车牌号/不动产面积" , "align": "right" },
              { "key": "assetsNo", "label": "机身号/不动产单元号" , "align": "right" },
              { "key": "assetsNo2Vfbc", "label": "租赁物唯一识别码/抵质押证书编号" , "align": "right" },
              { "key": "estimateValue", "label": "担保物估值(元)", "align": "right" },
              { "key": "currtype", "label": "币种" , "align": "right" },
              { "key": "debtor", "label": "第三方质押债务人" , "align": "right" },
              { "key": "isFirstOrder", "label": "是否第一顺位" , "align": "right" },
              { "key": "assessMode", "label": "评估方式" , "align": "right" },
              { "key": "compensationNumber", "label": "优先受偿权数额", "align": "right" },
              { "key": "valuationCycle", "label": "估值周期" , "align": "right" }
            ],
            "rows": [
              {
                "assetsName": "1",
                "locationVfbc": "3",
                "assetsNo1Vfbc": "4",
                "assetsNo": "5",
                "assetsNo2Vfbc": "6",
                "estimateValue": "2.00",
                "currtype": "人民币",
                "debtor": "7",
                "isFirstOrder": "第一顺位",
                "assessMode": "内部评估",
                "compensationNumber": "0.00",
                "valuationCycle": "季度"
              }
            ]
          }
        },
        {
          "guaranteeMethod": "质押担保",
          "guaranteeTone": "pledge",
          "customerName": "江阴绮星水泥有限公司",
          "crdntlsType": "统一社会信用代码",
          "documentCode": "91320281142225264B",
          "attrs": [
            { "label": "抵押物类别", "value": "—" },
            { "label": "抵质押物类型", "value": "动产" },
            { "label": "抵质押物分类", "value": "4.3.1车辆" }
          ],
          "collateral": {
            "label": "担保物",
            "showIndex": true,
            "columns": [
              { "key": "assetsName", "label": "担保物名称" , "align": "right" },
              { "key": "locationVfbc", "label": "所在地" , "align": "right" },
              { "key": "assetsNo1Vfbc", "label": "车牌号/不动产面积" , "align": "right" },
              { "key": "assetsNo", "label": "机身号/不动产单元号" , "align": "right" },
              { "key": "assetsNo2Vfbc", "label": "租赁物唯一识别码/抵质押证书编号" , "align": "right" },
              { "key": "estimateValue", "label": "担保物估值(元)", "align": "right" },
              { "key": "currtype", "label": "币种" , "align": "right" },
              { "key": "debtor", "label": "第三方质押债务人" , "align": "right" },
              { "key": "isFirstOrder", "label": "是否第一顺位" , "align": "right" },
              { "key": "assessMode", "label": "评估方式" , "align": "right" },
              { "key": "compensationNumber", "label": "优先受偿权数额", "align": "right" },
              { "key": "valuationCycle", "label": "估值周期" , "align": "right" }
            ],
            "rows": [
              {
                "assetsName": "1",
                "locationVfbc": "2",
                "assetsNo1Vfbc": "3",
                "assetsNo": "4",
                "assetsNo2Vfbc": "5",
                "estimateValue": "6.00",
                "currtype": "人民币",
                "debtor": "7",
                "isFirstOrder": "第一顺位",
                "assessMode": "内部评估",
                "compensationNumber": "0.00",
                "valuationCycle": "季度"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

---

## 十、输出约束

1. 输出 JSON，**不包含 HTML 标签**
2. 字段名使用中文 `label`，接口英文字段名仅用于取值匹配
3. 空值统一填 `—`，不输出 `null` 或空字符串
4. `blocks` 内顺序严格按第六节表格排列；多报价按 `advertisingInfoList` 顺序展开
5. 页面 Tab（租金 / 保证金 / 其他收支）在 PDF 中全部展开，不模拟 Tab
6. 不输出关联报价、取消关联、编辑、保存、付款条件选择等页面交互能力
7. 增信措施按页面卡片样式输出（`measureList`）：担保方式色标 + 客户身份行 + 关系标签；抵押/质押展开属性行与担保物表；不输出知识图谱等交互入口
8. 宽表不拆 block；列数 > 8 时由 L2 叠行处理（含卡片内担保物表）
