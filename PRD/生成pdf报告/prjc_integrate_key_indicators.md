# 重点指标 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**6**（与同级 L1 模块并列；调度顺序在刚性负债分析之后）  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> 业务对照：`尽调系统/项目审批/重点指标.md`  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `keyIndicators`，按尽调系统类型筛选字段、映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不做指标计算、不调用税票接口、不做 HTML 渲染。

页面为「顶部重点指标栅格 + 承租人近 3 年主要财务指标表」；PDF 按同一顺序全部展开输出。系统中每行展示 **3** 个指标，PDF 对齐为 `columns: 3`。

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
| `moduleIndex` | `6` |
| `moduleKey` | `key_indicators` |
| `moduleName` | `重点指标` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `projectAttribute` | 尽调系统类型（`prjc-*`），决定模块是否输出 |
| `keyIndicators` | 模块主数据对象 |
| `keyIndicators.yoyRevenueGrowthRate` | 近一年收入同期增长率(%) |
| `keyIndicators.generalProvisionRatio` | 营授比(%)（字段名历史遗留，展示名以页面为准） |
| `keyIndicators.elementList[]` | 承租人 / 担保人抵押类负债占比动态列表 |
| `keyIndicators.elementList[].equivalentName` | 指标中文名（已含主体名称与单位） |
| `keyIndicators.elementList[].equivalentValue` | 指标值 |
| `keyIndicators.lesseeAndGuarantorsMortgageLiabilityRatio` | 承租人及担保人抵押类负债占比(%) |
| `keyIndicators.dailyAverageBalanceToIncomeRatio` | 日均余额收入比(%) |
| `keyIndicators.externalGuaranteeToIncomeRatio` | 对外担保收入比(%) |
| `keyIndicators.cashCoverageRatio` | 现金覆盖比(%) |
| `keyIndicators.financialIndicatorList[]` | 承租人近 3 年主要财务指标（按年份列展开） |
| `keyIndicators.financialIndicatorList[].year` | 年份键，如 `202312` |
| `keyIndicators.financialIndicatorList[].dataType` | 数据类型，如 `合并` / `单体` |
| `keyIndicators.haveData` | 财务指标表是否有数据；`false` 时财务表走空态 |
| `keyIndicators.fsDataSourceType` | 财报数据来源类型（仅数据匹配，**默认不输出到 HTML**） |

> PDF **不输出**「税票数据引入」等页面操作按钮；使用入参中已落库的计算结果。

---

## 四、整合流程

```text
1. 读取 projectAttribute，确定尽调系统类型
2. 若不在适用系统内：整模块不输出
3. 若 keyIndicators 为 null / 缺失：整模块不输出
4. 组装顶部重点指标 group（见 §7.1），含 elementList 动态项
5. 按 financialIndicatorList 生成年份列，按固定行序展开财务指标表（见 §7.2）
6. 空值规范化为「—」；数值原样透传（不追加 %）
7. 输出 moduleIndex=6 的结构化 JSON → 交由 L2 渲染
```

---

## 五、尽调系统差异约束

| 分组 / 字段 | prjc-flr | prjc-slb | prjc-drs | prjc-PEP | prjc-si | prjc-gld | prjc-hdr |
| ----------- | :----: | :----: | :------: | :--: | :--: | :------: | :------: |
| 重点指标模块整体 | — | ✅ | ✅ | ✅ | — | 待补充 | 待补充 |
| 顶部重点指标栅格 | — | ✅ | ✅ | ✅ | — | 待补充 | — |
| 承租人近3年主要财务指标 | — | ✅ | ✅ | ✅ | — | 待补充 | — |

**条件展示规则：**

- 适用系统对齐业务侧「小企业 / 厂商租赁 / 印包」刚性负债 + 经营数据链路；`prjc-flr` / `prjc-si` 本模块**整段不输出**
- `prjc-gld` / `prjc-hdr`：本节模块差异待补充，当前 PDF 模块暂不输出
- `elementList`：有几条输出几条；`null` / `[]` 时跳过动态项，其余固定指标仍输出
- `haveData === false` 或 `financialIndicatorList` 为 `null` / `[]`：仍输出顶部指标；财务表输出 `table` + `emptyText`，不省略 block
- `netProfitMargin`：入参可有该字段，但页面 / 业务 PRD **不展示**，L1 **不提取、不输出**
- 「税票数据引入」：页面操作，PDF **不输出**

---

## 六、blocks 组装顺序

| 顺序 | blockKey | label | displayType | 适用系统 |
| :--: | -------- | ----- | ----------- | -------- |
| 1 | `keyMetrics` | （不传 label） | `group` | prjc-slb / prjc-drs / prjc-PEP |
| 2 | `financialIndicatorList` | `承租人近3年主要财务指标` | `table` | 同上 |

> 顶部指标为模块顶栏下的指标行，**无**蓝色小节标题（对齐页面截图与实施方案 `riskSummary`）。

---

## 七、字段映射与 displayType 规则

### 7.1 顶部重点指标（group · columns: 3）

数据来源：`keyIndicators` 顶层字段 + `elementList`

**blockKey：** `keyMetrics`  
**columns：** `3`（对齐页面「每行 3 个指标」）  
**label：** 不传

**children 组装顺序：**

| 顺序 | label | 接口字段 | displayType | 格式化 |
| :--: | ----- | -------- | ----------- | ------ |
| 1 | 近一年收入同期增长率(%) | `yoyRevenueGrowthRate` | `direct` | 原样；空 → `—` |
| 2 | 营授比(%) | `generalProvisionRatio` | `direct` | 同上 |
| 3… | `equivalentName` 原文 | `elementList[i].equivalentValue` | `direct` | label 取 `equivalentName`；值原样；空 → `—` |
| 后 1 | 承租人及担保人抵押类负债占比(%) | `lesseeAndGuarantorsMortgageLiabilityRatio` | `direct` | 原样；空 → `—` |
| 后 2 | 日均余额收入比(%) | `dailyAverageBalanceToIncomeRatio` | `direct` | 同上 |
| 后 3 | 对外担保收入比(%) | `externalGuaranteeToIncomeRatio` | `direct` | 同上 |
| 后 4 | 现金覆盖比(%) | `cashCoverageRatio` | `direct` | 同上 |

**动态项规则（`elementList`）：**

- 插入位置：固定在「营授比」之后、「承租人及担保人抵押类负债占比」之前
- `blockKey`：`element_{i}`（`i` 从 0 起）
- `label`：**完整透传** `equivalentName`（如「承租人、担保人东莞市捷宏激光科技有限公司抵押类负债占比(%)」），L1 不改写、不截断
- 列表为空：不插入动态 children，顺序变为：增长率 → 营授比 → 承租人及担保人占比 → 日均余额收入比 → 对外担保收入比 → 现金覆盖比

```json
{
  "blockKey": "keyMetrics",
  "displayType": "group",
  "columns": 3,
  "children": [
    { "blockKey": "yoyRevenueGrowthRate", "label": "近一年收入同期增长率(%)", "displayType": "direct", "value": "0.0000" },
    { "blockKey": "generalProvisionRatio", "label": "营授比(%)", "displayType": "direct", "value": "0.0000" },
    { "blockKey": "element_0", "label": "承租人、担保人东莞市捷宏激光科技有限公司抵押类负债占比(%)", "displayType": "direct", "value": "0.0000" },
    { "blockKey": "element_1", "label": "担保人江阴绮星水泥有限公司抵押类负债占比(%)", "displayType": "direct", "value": "93.0945" },
    { "blockKey": "element_2", "label": "担保人苏州工业园区昌源工贸有限公司抵押类负债占比(%)", "displayType": "direct", "value": "0.0000" },
    { "blockKey": "lesseeAndGuarantorsMortgageLiabilityRatio", "label": "承租人及担保人抵押类负债占比(%)", "displayType": "direct", "value": "31.0315" },
    { "blockKey": "dailyAverageBalanceToIncomeRatio", "label": "日均余额收入比(%)", "displayType": "direct", "value": "0.0000" },
    { "blockKey": "externalGuaranteeToIncomeRatio", "label": "对外担保收入比(%)", "displayType": "direct", "value": "0.0000" },
    { "blockKey": "cashCoverageRatio", "label": "现金覆盖比(%)", "displayType": "direct", "value": "108.4952" }
  ]
}
```

### 7.2 承租人近3年主要财务指标（table）

数据来源：`keyIndicators.financialIndicatorList`

**blockKey：** `financialIndicatorList`  
**label：** `承租人近3年主要财务指标`  
**showIndex：** `false`  
**emptyText：** `暂无财务指标数据`

#### 7.2.1 动态列（表头）

固定前两列 + 按 `financialIndicatorList` **年份升序**展开的数据列：

| 列顺序 | label | key | 说明 |
| :----: | ----- | --- | ---- |
| 1 | 评估项目 | `category` | 固定中文；列定义加 `mergeSame: true`（L2 合并连续相同值） |
| 2 | 财务指标 | `indicator` | 固定中文文案 |
| 3… | `{year} {dataType}` | `y_{year}` | 如 `202312 合并`；`dataType` 为空时仅展示 `year` |

- 年份列数量以入参为准（通常近 3 年，不做强制截断）
- 同一 `year` 多条时：以后出现的为准（正常入参不应重复）

#### 7.2.2 固定行序（评估项目 × 财务指标）

L1 按下行序**展开为行**；每行从各年份对象取对应接口字段写入 `y_{year}`。

| 顺序 | 评估项目（`category`） | 财务指标（`indicator`） | 接口字段 |
| :--: | ---------------------- | ----------------------- | -------- |
| 1 | 盈利能力 | 销售毛利率(%) | `grossProfitMargin` |
| 2 | 盈利能力 | ROA 资产净利率(%) | `returnOnAssets` |
| 3 | 盈利能力 | ROE 净资产收益率(%) | `returnOnEquity` |
| 4 | 运营能力 | 存货周转率 | `inventoryTurnover` |
| 5 | 运营能力 | 应收账款周转率 | `accountsReceivableTurnover` |
| 6 | 运营能力 | 总资产周转率 | `totalAssetTurnover` |
| 7 | 偿债能力 | 资产负债率(%) | `debtToAssetRatio` |
| 8 | 偿债能力 | 速动比率 | `quickRatio` |
| 9 | 偿债能力 | 流动比率 | `currentRatio` |
| 10 | 偿债能力 | 借款依存度(%) | `loanDependence` |
| 11 | 偿债能力 | 现金流动负债比率(%) | `cashFlowToCurrentLiabilitiesRatio` |
| 12 | 偿债能力 | 销售现金比率(%) | `cashSalesRatio` |
| 13 | 偿债能力 | 清算价值比率(%) | `liquidationValueRatio` |
| 14 | 发展能力 | 营业增长率(%) [财报数据] | `operatingRevenueGrowthRateFinancial` |
| 15 | 发展能力 | 资本积累率(%) | `capitalAccumulationRate` |
| 16 | 发展能力 | 总资产增长率(%) | `totalAssetGrowthRate` |

> 评估项目文案对齐页面截图（「运营能力」）；业务 PRD 中的「营运能力」以页面为准。  
> 业务 PRD 另有「营业增长率(%)[发票数据]」；当前入参 schema 无对应字段时**不输出该行**。若后续入参加入 `operatingRevenueGrowthRateInvoice`，插在「营业增长率(%) [财报数据]」之前，归属发展能力。

#### 7.2.3 空表判定

满足任一条件时：`rows` 置为 `[]`，走 `emptyText`：

- `haveData === false`
- `financialIndicatorList` 为 `null` / 非数组 / 长度为 0

有数据时：始终输出上表 16 行（或含发票增长率时 17 行），缺年份字段填 `—`，**不因某年全空而删行**。

```json
{
  "blockKey": "financialIndicatorList",
  "label": "承租人近3年主要财务指标",
  "displayType": "table",
  "showIndex": false,
  "columns": [
    { "key": "category", "label": "评估项目", "mergeSame": true },
    { "key": "indicator", "label": "财务指标" },
    { "key": "y_202312", "label": "202312 合并" },
    { "key": "y_202412", "label": "202412 合并" },
    { "key": "y_202509", "label": "202509 合并" }
  ],
  "rows": [
    {
      "category": "盈利能力",
      "indicator": "销售毛利率(%)",
      "y_202312": "3.6000",
      "y_202412": "6.5700",
      "y_202509": "6.5300"
    }
  ],
  "emptyText": "暂无财务指标数据"
}
```

---

## 八、空值与格式化规则

| 规则 | 说明 |
| ---- | ---- |
| 空值占位 | `null` / `""` / 缺失 → 展示值填 `—` |
| 数值透传 | 接口返回的数字字符串**原样展示**（如 `0.0000`、`98.25`、`1.14`），**不**强制补齐小数位，**不**追加 `%`（单位已在 label 中） |
| 百分比字段 | 同上；与基本信息模块「补 `%`」规则不同，本模块对齐页面截图 |
| 枚举 / 名称 | `equivalentName`、`dataType` 直接展示，不做码值转换 |
| `fsDataSourceType` | 不输出到 HTML |

---

## 九、输出示例（prjc-slb · 对齐 mock.json）

```json
{
  "moduleIndex": 6,
  "moduleName": "重点指标",
  "moduleKey": "key_indicators",
  "blocks": [
    {
      "blockKey": "keyMetrics",
      "displayType": "group",
      "columns": 3,
      "children": [
        { "blockKey": "yoyRevenueGrowthRate", "label": "近一年收入同期增长率(%)", "displayType": "direct", "value": "0.0000" },
        { "blockKey": "generalProvisionRatio", "label": "营授比(%)", "displayType": "direct", "value": "0.0000" },
        { "blockKey": "element_0", "label": "承租人、担保人东莞市捷宏激光科技有限公司抵押类负债占比(%)", "displayType": "direct", "value": "0.0000" },
        { "blockKey": "element_1", "label": "担保人江阴绮星水泥有限公司抵押类负债占比(%)", "displayType": "direct", "value": "93.0945" },
        { "blockKey": "element_2", "label": "担保人苏州工业园区昌源工贸有限公司抵押类负债占比(%)", "displayType": "direct", "value": "0.0000" },
        { "blockKey": "lesseeAndGuarantorsMortgageLiabilityRatio", "label": "承租人及担保人抵押类负债占比(%)", "displayType": "direct", "value": "31.0315" },
        { "blockKey": "dailyAverageBalanceToIncomeRatio", "label": "日均余额收入比(%)", "displayType": "direct", "value": "0.0000" },
        { "blockKey": "externalGuaranteeToIncomeRatio", "label": "对外担保收入比(%)", "displayType": "direct", "value": "0.0000" },
        { "blockKey": "cashCoverageRatio", "label": "现金覆盖比(%)", "displayType": "direct", "value": "108.4952" }
      ]
    },
    {
      "blockKey": "financialIndicatorList",
      "label": "承租人近3年主要财务指标",
      "displayType": "table",
      "showIndex": false,
      "columns": [
        { "key": "category", "label": "评估项目", "mergeSame": true },
        { "key": "indicator", "label": "财务指标" },
        { "key": "y_202312", "label": "202312 合并" },
        { "key": "y_202412", "label": "202412 合并" },
        { "key": "y_202509", "label": "202509 合并" }
      ],
      "rows": [
        { "category": "盈利能力", "indicator": "销售毛利率(%)", "y_202312": "3.6000", "y_202412": "6.5700", "y_202509": "6.5300" },
        { "category": "盈利能力", "indicator": "ROA 资产净利率(%)", "y_202312": "—", "y_202412": "3.5000", "y_202509": "—" },
        { "category": "盈利能力", "indicator": "ROE 净资产收益率(%)", "y_202312": "—", "y_202412": "14.0500", "y_202509": "—" },
        { "category": "运营能力", "indicator": "存货周转率", "y_202312": "—", "y_202412": "98.25", "y_202509": "—" },
        { "category": "运营能力", "indicator": "应收账款周转率", "y_202312": "—", "y_202412": "11.66", "y_202509": "—" },
        { "category": "运营能力", "indicator": "总资产周转率", "y_202312": "—", "y_202412": "1.05", "y_202509": "—" },
        { "category": "偿债能力", "indicator": "资产负债率(%)", "y_202312": "74.9900", "y_202412": "75.2400", "y_202509": "81.3700" },
        { "category": "偿债能力", "indicator": "速动比率", "y_202312": "1.14", "y_202412": "1.13", "y_202509": "1.25" },
        { "category": "偿债能力", "indicator": "流动比率", "y_202312": "1.23", "y_202412": "1.23", "y_202509": "1.31" },
        { "category": "偿债能力", "indicator": "借款依存度(%)", "y_202312": "206.4400", "y_202412": "202.4700", "y_202509": "322.8100" },
        { "category": "偿债能力", "indicator": "现金流动负债比率(%)", "y_202312": "—", "y_202412": "—", "y_202509": "—" },
        { "category": "偿债能力", "indicator": "销售现金比率(%)", "y_202312": "—", "y_202412": "—", "y_202509": "—" },
        { "category": "偿债能力", "indicator": "清算价值比率(%)", "y_202312": "—", "y_202412": "—", "y_202509": "—" },
        { "category": "发展能力", "indicator": "营业增长率(%) [财报数据]", "y_202312": "—", "y_202412": "12.5300", "y_202509": "—" },
        { "category": "发展能力", "indicator": "资本积累率(%)", "y_202312": "—", "y_202412": "15.1100", "y_202509": "—" },
        { "category": "发展能力", "indicator": "总资产增长率(%)", "y_202312": "—", "y_202412": "16.2700", "y_202509": "—" }
      ],
      "emptyText": "暂无财务指标数据"
    }
  ]
}
```

---

## 十、输出约束

1. 必须携带 `moduleIndex: 6`，供 L0 排序
2. 输出 JSON，**不包含 HTML 标签**
3. 字段名使用中文 `label`，接口英文字段名仅用于取值匹配
4. 空值统一填 `—`，不输出 `null` 或空字符串（`analysisList` 类除外；本模块无此类型）
5. 不适用尽调系统 / `keyIndicators` 缺失时：**整模块不输出**
6. `blocks` 内顺序严格按第六节表格排列
7. 不计算、不改写指标；`elementList` 名称完整透传
8. 财务表「评估项目」列通过 `mergeSame: true` 交由 L2 做单元格合并；L1 仍按行重复写入 `category` 文案

---

## 十一、与 L2 协作约定

1. 本模块使用的展示类型：`group`（`columns: 3`）、`table`（含 `mergeSame`）
2. L2 对 `columns[].mergeSame === true` 的列：连续相同非空值合并为 `rowspan`（见 `prjc_style_render.md`）
3. 顶部 `keyMetrics` **不传** `label`，L2 不渲染蓝色小节标题
4. PDF 侧：**不输出**税票引入按钮及相关操作文案
