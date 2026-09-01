# 实施方案 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**3**（与 `cooperation_history` / `project_base_info` 同级 L1，调度顺序在其后）  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> 业务对照：`尽调系统/项目审批/3.实施方案.md`  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `embodiment`（及同构报价 / 增信子对象），按尽调系统类型筛选字段、映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不做业务分析、不计算风险敞口、不做 HTML 渲染。

页面为 Tab 的「租金计划表 / 保证金计划 / 其他收支计划」在 PDF 中**按顺序全部展开**输出（无 Tab 交互）。

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
| `moduleIndex` | `3` |
| `moduleKey` | `implementation_plan` |
| `moduleName` | `实施方案` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `projectAttribute` | 尽调系统类型（`prjc-*`），决定字段展示范围 |
| `embodiment` | 模块主数据对象 |
| `embodiment.riskExposure` | 预测风险敞口(元) |
| `embodiment.rate` | 预测风险敞口/设备原值(%) |
| `embodiment.lesseeAggregateRiskExposure` | 承租人累计风险敞口(元) |
| `embodiment.aggregateRiskExposure` | 承租人及关联方累计风险敞口(元) |
| `embodiment.singleWattFinancingAmount` | 单瓦融资额(元)（闪光租） |
| `embodiment.advertisingInfoList[]` | 报价方案列表（投放信息 / 付款条件 / 各类计划） |
| `embodiment.advertisingInfoList[].paymentTermList` | 付款条件及笔数 |
| `embodiment.advertisingInfoList[].rentPlan` | 租金计划表（含汇总 + 明细） |
| `embodiment.advertisingInfoList[].depositPlan` | 保证金计划 |
| `embodiment.advertisingInfoList[].otherPlan` | 其他收支计划 |
| `embodiment.advertisingInfoList[].insuranceRuleSetting` | 保险规则设置（厂商租赁） |
| `embodiment.advertisingInfoList[].insuranceSubTable` | 保险明细（厂商租赁） |
| `commonCreditEnhancementMeasure.creditEnhancementMeasureList[]` | 按 `quotName` 匹配的增信措施（优先） |
| `embodiment.creditEnhancementMeasureInfo` | 实施方案内嵌增信措施（次选） |
| `creditEnhancementMeasure` | 顶层增信措施（兜底） |

> 多报价时，按 `advertisingInfoList` 接口返回顺序逐条输出；每条报价以其 `quotName` 作为分组标题。

---

## 四、整合流程

```text
1. 读取 projectAttribute，确定尽调系统类型
2. 从 embodiment 提取风险敞口汇总字段
3. 遍历 advertisingInfoList，按尽调系统差异过滤子块（见第五节）
4. 按分组顺序组装 blocks（见第六节）
5. 为每个字段标注 displayType 并格式化展示值
6. 输出 moduleIndex=3 的结构化 JSON → 交由 L2 渲染
```

---

## 五、尽调系统差异约束

| 分组 / 字段 | prjc-flr | prjc-slb | prjc-drs | prjc-PEP | prjc-si | prjc-gld | prjc-hdr |
| ----------- | :----: | :----: | :------: | :--: | :--: | :------: | :------: |
| 风险敞口汇总 | 条件 | ✅ | ✅ | ✅ | 条件 | 待补充 | 待补充 |
| 单瓦融资额 | ✅ | — | — | — | — | — | — |
| 报价方案（quotName 分组） | ✅ | ✅ | ✅ | ✅ | ✅ | 待补充 | 待补充 |
| 投放信息 | ✅ | ✅ | ✅ | ✅ | ✅ | 待补充 | 待补充 |
| 贴息金额 / 银票收益率 | — | ✅ | ✅ | ✅ | ✅ | — | — |
| 是否调息 | — | 条件 | ✅ | ✅ | — | — | — |
| 支付方式 / 备注 | — | — | — | — | ✅ | — | — |
| 付款条件及笔数 | ✅ | ✅ | ✅ | ✅ | ✅ | 待补充 | 待补充 |
| 租金计划表 | ✅ | ✅ | ✅ | ✅ | ✅ | 待补充 | 待补充 |
| 保证金计划 | — | ✅ | ✅ | ✅ | — | — | — |
| 其他收支计划 | — | ✅ | ✅ | ✅ | — | — | — |
| 保险规则设置 / 保险 | — | — | ✅ | — | — | — | — |
| 增信措施 | — | ✅ | ✅ | ✅ | ✅ | 待补充 | 待补充 |

**条件展示规则：**

- **风险敞口汇总**
  - `prjc-slb` / `prjc-drs` / `prjc-PEP`：输出 4 项（预测风险敞口、预测风险敞口/设备原值、承租人累计、承租人及关联方累计）
  - `prjc-flr`：删除「承租人及关联方累计风险敞口」；增加「单瓦融资额(元)」；保留预测风险敞口、预测风险敞口/设备原值、承租人累计风险敞口
  - `prjc-si` 零售：删除预测风险敞口、预测风险敞口/设备原值、承租人及关联方累计；保留承租人累计（具体细分以业务 PRD 为准，PDF 首版按通用 4 项输出，差异标「待补充」时可收窄）
  - `prjc-si` 大单：删除承租人累计风险敞口
- **投放信息 · 贴息金额 / 银票收益率**：仅小企业、厂商租赁、印包、环卫展示；闪光租不输出
- **投放信息 · 是否调息**：厂商租赁 / 闪光租 / 印包展示；小企业截图有该字段时按页面输出（`prjc-slb` ✅）；环卫不输出
- **投放信息 · 支付方式 / 备注**：仅环卫展示
- **保证金计划 / 其他收支计划**：闪光租、环卫不输出
- **保险规则设置 / 保险**：仅厂商租赁展示
- **增信措施**：闪光租不输出
- **关联报价 / 取消关联 / 编辑 / 保存** 等页面操作：PDF **不输出**
- `prjc-gld` / `prjc-hdr`：本节模块差异待补充，当前 PDF 模块暂不输出或按后续补齐规则输出

**空数据规则：**

- `advertisingInfoList` 为 `null` / `[]`：仍输出风险敞口汇总（有值则展示，无值 `—`）；不输出报价子块，可追加 `empty` block，`emptyText: 暂无关联报价`
- 单表为空：该表走对应 `emptyText`，其余块正常输出
- 增信措施列表为空：输出 table，`emptyText: 暂无增信措施`

---

## 六、blocks 组装顺序

模块内 `blocks` 按以下顺序输出（与页面展示顺序一致；多报价时对每个报价重复 2～8）：

| 顺序 | blockKey | label | displayType | 适用系统 |
| :--: | -------- | ----- | ----------- | -------- |
| 1 | `riskSummary` | （无标题 / 可不传 label） | `group` | 见 §5 |
| 2 | `quoteTitle_{i}` | `{quotName}` | `group`（仅标题，`children` 可为空） | 有报价时 |
| 3 | `loanInfo_{i}` | `投放信息` | `group` | 有报价时 |
| 4 | `paymentTermList_{i}` | `付款条件及笔数` | `table` | 有报价时 |
| 5 | `rentPlanSummary_{i}` | `租金计划表` | `group` | 有报价时 |
| 6 | `rentPlanDetail_{i}` | （不传 label，紧接上块） | `table` | 有报价时 |
| 7 | `depositPlan_{i}` | `保证金计划` | `table` | prjc-slb / prjc-drs / prjc-PEP |
| 8 | `otherPlan_{i}` | `其他收支计划` | `table` | 同上 |
| 9 | `insuranceRule_{i}` | `保险规则设置` | `table` | prjc-drs |
| 10 | `insurance_{i}` | `保险` | `table` | prjc-drs |
| 11 | `creditEnhancement_{i}` | `增信措施` | `table` | 非 prjc-flr |

> `{i}` 为报价在 `advertisingInfoList` 中的下标（从 0 起）。多报价时按列表顺序完整重复 2～11。

---

## 七、字段映射与 displayType 规则

### 7.1 风险敞口汇总（group）

数据来源：`embodiment` 顶层字段

**blockKey：** `riskSummary`  
**columns：** `4`（闪光租含单瓦融资额时仍用 4 列栅格）  
**label：** 不传（页面为顶栏指标行，无蓝色小节标题）

| 列 label | key | 格式化 | 适用 |
| -------- | --- | ------ | ---- |
| 预测风险敞口(元) | `riskExposure` | 千分位 + 2 位小数 | 默认 |
| 预测风险敞口/设备原值(%) | `rate` | 原样；纯数字保留接口精度（如 `24.5000`） | 默认 |
| 承租人累计风险敞口(元) | `lesseeAggregateRiskExposure` | 千分位 + 2 位小数 | 见 §5 |
| 承租人及关联方累计风险敞口(元) | `aggregateRiskExposure` | 千分位 + 2 位小数 | 见 §5 |
| 单瓦融资额(元) | `singleWattFinancingAmount` | 千分位 + 2 位小数 | 仅 prjc-flr |

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
| 支付方式 | `paymentMethod` | 原样（仅环卫） |
| 备注 | `remark` | 原样（仅环卫） |

- 不传当前系统不需要的字段（见 §5）

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
- 仅 prjc-slb / prjc-drs / prjc-PEP 输出

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
- 仅 prjc-slb / prjc-drs / prjc-PEP 输出

### 7.9 保险规则设置 / 保险（table · 厂商租赁）

数据来源：

- `insuranceRuleSetting.ruleSettingDetails`
- `insuranceSubTable.insuranceSubTableDetails`

**保险规则设置列：** 保险险种(`insuranceName`) / 保险公司(`customerName`) / 支付类型(`paymentType`) / 支付方式(`paymentMethod`)

**保险列：** 保险险种(`typeOfInsurance`) / 保险公司(`customerName`) / 收支类型(`type`) / 交易日期(`tradeDate`) / 购买到期日期(`tradeDateEnd`) / 购买期限(月)(`payTimes`) / 保险费金额(元)(`premiumAmount`) / 不含税金额(`noTaxAmount`) / 税额(`tax`) / 税率(`taxRate`) / 租赁物名称(`rentThing`)

- 列数 > 8 时由 L2 自动叠行，L1 不拆表
- 仅 `prjc-drs` 输出；空表走 `emptyText: 暂无保险数据`

### 7.10 增信措施（table）

数据来源（按优先级）：

1. `commonCreditEnhancementMeasure.creditEnhancementMeasureList` 中 `quotName` 与当前报价一致的项 → 其内层 `creditEnhancementMeasureList`
2. `embodiment.creditEnhancementMeasureInfo.creditEnhancementMeasureList`
3. `creditEnhancementMeasure.creditEnhancementMeasureList`（若带 `quotName` 则按报价过滤）

**blockKey：** `creditEnhancement_{i}`  
**label：** `增信措施`

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 担保方式 | `guaranteeMethod` | 取对象 `desc`；若已是字符串则原样 |
| 客户名称 | `customerName` | 原样 |
| 证件类型 | `crdntlsType` | 原样 |
| 证件代码 | `documentCode` | 原样 |

- `showIndex`: `false`
- `emptyText`: `暂无增信措施`
- PDF **仅输出列表摘要**（对齐页面卡片行：担保方式标签 + 客户名称 + 证件信息）；不展开担保人/担保企业详情、抵押物明细、知识图谱等交互内容
- `prjc-flr` 不输出本块

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

## 九、输出示例（prjc-slb · 单报价）

```json
{
  "moduleIndex": 3,
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
      "displayType": "table",
      "showIndex": false,
      "columns": [
        { "key": "guaranteeMethod", "label": "担保方式" },
        { "key": "customerName", "label": "客户名称" },
        { "key": "crdntlsType", "label": "证件类型" },
        { "key": "documentCode", "label": "证件代码" }
      ],
      "rows": [
        {
          "guaranteeMethod": "保证担保",
          "customerName": "上海汇德实业有限公司",
          "crdntlsType": "统一社会信用代码",
          "documentCode": "91310117607835944Q"
        }
      ],
      "emptyText": "暂无增信措施"
    }
  ]
}
```

---

## 十、输出约束

1. 输出 JSON，**不包含 HTML 标签**
2. 字段名使用中文 `label`，接口英文字段名仅用于取值匹配
3. 空值统一填 `—`，不输出 `null` 或空字符串
4. 不传当前尽调系统不需要的 block / 字段
5. `blocks` 内顺序严格按第六节表格排列；多报价按 `advertisingInfoList` 顺序展开
6. 页面 Tab（租金 / 保证金 / 其他收支）在 PDF 中全部展开，不模拟 Tab
7. 不输出关联报价、取消关联、编辑、保存、付款条件选择等页面交互能力
8. 增信措施仅输出列表摘要，不展开担保人/企业详情与抵押物明细
9. 宽表不拆 block；列数 > 8 时由 L2 叠行处理

---

## 十一、待补充

| 项 | 说明 |
| -- | ---- |
| `prjc-si` 零售 / 大单风险敞口字段差异 | 按项目类型条件收窄 §7.1 字段 |
| `prjc-gld` / `prjc-hdr` | 系统差异与字段范围待补充 |
| 增信措施标签色 | 页面按担保方式着色；若 L2 增加 `tag` / `measureList` 样式，可改为非表格展示 |
| 投放信息 5 列栅格 | 页面约 5 列；当前 PDF 统一 4 列，若需像素级对齐再扩展 L2 `columns: 5` |
| 付款方式空值 | 若入参仅有 `eventCode` 无中文，是否做 10101/10102 映射待业务确认（默认不转换） |
