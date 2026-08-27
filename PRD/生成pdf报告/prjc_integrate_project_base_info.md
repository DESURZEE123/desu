#项目基本信息 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**1**（第一个展示）  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `projectBaseInfo` 及相关子对象，按尽调系统类型筛选字段、映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md的Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不做业务分析或 HTML 渲染。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `1` |
| `moduleKey` | `project_base_info` |
| `moduleName` | `基本信息` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `projectAttribute` / `headInfo.projectType` | 尽调系统类型，决定字段展示范围 |
| `projectBaseInfo` | 模块主数据对象 |
| `projectBaseInfo.quoteInfo` | 报价信息分组 |
| `projectBaseInfo.referenceYield` | 参考收益率分组 |
| `projectBaseInfo.environmentAndSocialRisk` | 环境与社会风险评估 |
| `projectBaseInfo.filingStatusInfo` | 闪光租 · 项目备案情况 |
| `projectBaseInfo.projectSourceList` | 通用大单 · 业务信息来源列表 |
| `projectBaseInfo.siteSituationList` | 现场尽调情况列表 |

---

## 四、整合流程

```text
1. 读取 projectAttribute，确定尽调系统类型
2. 从 projectBaseInfo 提取字段
3. 按尽调系统差异过滤字段（见第五节）
4. 按分组顺序组装 blocks（见第六节）
5. 为每个字段标注 displayType 并格式化展示值
6. 输出 moduleIndex=1 的结构化 JSON → 交由 L2 渲染
```

---

## 五、尽调系统差异约束

| 分组 / 字段 | 闪光租 | 小企业 | 厂商租赁 | 印包 | 环卫 | 通用大单 |
| ----------- | :----: | :----: | :------: | :--: | :--: | :------: |
| 项目基本信息（通用字段） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 报价信息 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 参考收益率 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 环境与社会风险评估 | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| 项目备案情况（filingStatusInfo） | ✅ | — | — | — | — | — |
| 对应老合同 | — | ✅ | — | — | — | 条件展示 |
| 现场尽调情况 | — | ✅ | ✅ | — | ✅ | — |
| 业务信息来源 | — | — | — | — | — | ✅ |

**条件展示规则：**

- `对应老合同`：小企业且 `projectType = 老客租项目` 时展示
- `项目备案情况`：仅 `projectAttribute = 闪光租` 时展示
- `合同收益IRR(银票)`：实施方案存在投放方式=银票时展示（`referenceYield.contIrrBanknote` 有值）
- `SOFR类型` / `margin`：业务部门=航运金融事业部时展示

---

## 六、blocks 组装顺序

模块内 `blocks` 按以下顺序输出（与页面展示顺序一致）：

| 顺序 | blockKey | label | displayType | 适用系统 |
| :--: | -------- | ----- | ------------- | -------- |
| 1 | `projectBaseInfo` | 项目基本信息 | `group` | 全部 |
| 2 | `quoteInfo` | 报价信息 | `group` | 全部 |
| 3 | `referenceYield` | 参考收益率 | `group` | 全部 |
| 4 | `environmentAndSocialRisk` | 环境与社会风险评估 | `group` | 闪光租 / 小企业 / 厂商租赁 / 印包 / 环卫 |
| 5 | `filingStatusInfo` | 项目备案情况 | 混合（见 §6.5） | 仅闪光租 |
| 6 | `siteSituationList` | 现场尽调情况 | `table` | 小企业 / 厂商租赁 / 环卫 |
| 7 | `projectSourceList` | 业务信息来源 | `table` / `empty` | 通用大单 |

---

## 七、字段映射与 displayType 规则

### 7.1 项目基本信息（group · columns: 4）

| 顺序 | label | 接口字段 | displayType | 适用系统 | 格式化 |
| :--: | ----- | -------- | ----------- | -------- | ------ |
| 1 | 客户名称 | `customerName` | `direct` | 全部 | 原样 |
| 2 | 融资形式 | `leaseCategry` | `direct` | 通用大单 | 原样 |
| 3 | 项目金额 | `projectAmount` | `direct` | 非通用大单 | 千分位 + 2 位小数 |
| 4 | 资金用途 | `capitalUse` | `direct` | 全部 | 原样 |
| 5 | 业务部门 | `deptName` | `direct` | 通用大单 | 原样 |
| 6 | 租赁方式 | `leaseMethod` | `direct` | 非通用大单 | 原样 |
| 7 | 项目经理 | `managerName` / `managerWorkNo` | `person` | 全部 | 姓名（工号） |
| 8 | 项目协办人 | `custHelpName` / `custHelpNo` | `person` | 全部 | 姓名（工号） |
| 9 | 项目来源 | `projectSource` | `direct` | 全部 | 原样 |
| 10 | 是否单个报价 | `isOnetoone` | `direct` | 通用大单 | 原样 |
| 11 | 是否投保 | `isInsure` | `direct` | 通用大单 | 原样 |
| 12 | 项目绿色投向 | `greenIndustry` | `direct` | 通用大单 | 原样 |
| 13 | 项目类型 | `projectType` | `direct` | 全部 | 原样 |
| 14 | 评审部门 | `reviewDept` | `direct` | 通用大单 | 原样 |
| 15 | 投保情况 | `insuranceSituation` | `direct` | 非通用大单 | 原样 |
| 16 | 售后回租原因 | `leasebackReason` | `direct` | 非通用大单 / 非环卫大单 | 原样 |
| 17 | 对应老合同 | `oldContInfoList` | `direct` | 小企业（条件） | 取合同名称，多个用 `；` 分隔 |
| 18 | 项目来源说明 | `projectSourceDesc` | `direct` | 厂商租赁 / 印包 | 原样 |
| 19 | 现场尽调情况 | `siteSituation` | `longText` | 闪光租 | 原样 |
| 20 | 项目基本情况 | `companyBaseInfo` | `longText` | 非通用大单 | 原样 |
| 21 | 租赁物保险 | `leaseInsurance` | `longText` | 非通用大单 | 原样 |
| 22 | 售后回租原因说明 | `leasebackExplain` | `longText` | 非通用大单 / 非环卫大单 | 原样 |

> 通用大单字段顺序对齐页面截图：4 列栅格，先横后纵填充。

### 7.2 报价信息（group · columns: 4）

数据来源：`projectBaseInfo.quoteInfo`

| 顺序 | label | 接口字段 | displayType | 格式化 |
| :--: | ----- | -------- | ----------- | ------ |
| 1 | 项目金额 | `projectCash` | `direct` | 千分位 + 2 位小数 |
| 2 | 设备总价 | `assetsTotalAmount` | `direct` | 千分位 + 2 位小数 |
| 3 | 租赁方式 | `leaseMethod` | `direct` | 原样 |
| 4 | 租赁期限(月) | `leaseTimes` | `direct` | 原样 |
| 5 | 报价利率 | `finalRate` | `direct` | 原样（已为百分比则直接展示） |
| 6 | 净融资额(元) | `netFinanceCash` | `direct` | 千分位 + 2 位小数 |
| 7 | 首付款金额(元) | `downPayment` | `direct` | 千分位 + 2 位小数 |
| 8 | 保证金总额(元) | `depositCash` | `direct` | 千分位 + 2 位小数 |
| 9 | 总租金(元) | `leaseCashSum` | `direct` | 千分位 + 2 位小数 |
| 10 | 总利息(元) | `leaseInterestSum` | `direct` | 千分位 + 2 位小数 |
| 11 | 总本金(元) | `planCashLoan` | `direct` | 千分位 + 2 位小数 |
| 12 | 服务费金额(元) | `srvfeeCashOut` | `direct` | 千分位 + 2 位小数 |
| 13 | 综合收益率 | `generalIrr` | `direct` | 保留 4 位小数 + `%` |
| 14 | 内部收益率 | `internalIrr` | `direct` | 保留 4 位小数 + `%`；多报价用 `;` 分隔 |

### 7.3 参考收益率（group · columns: 4）

数据来源：`projectBaseInfo.referenceYield`

| 顺序 | label | 接口字段 | displayType | 格式化 | 条件 |
| :--: | ----- | -------- | ----------- | ------ | ---- |
| 1 | 计划合同IRR | `projectIrr` | `direct` | 4 位小数 + `%` | 全部 |
| 2 | 合同收益IRR(银票) | `contIrrBanknote` | `direct` | 4 位小数 + `%` | 有银票投放时 |
| 3 | SOFR类型 | `quoteInfo.sofrType` | `direct` | 原样 | 航运事业部 |
| 4 | margin | `quoteInfo.margin` | `direct` | 5 位小数 + `%` | 航运事业部 |

### 7.4 环境与社会风险评估（group · columns: 2）

数据来源：`projectBaseInfo.environmentAndSocialRisk`

| label | 接口字段 | displayType |
| ----- | -------- | ----------- |
| 是否禁入业务 | `exclusionBusinessResult` | `direct` |
| 是否政策限制 | `policyRestrictResult` | `direct` |
| 是否取得经营许可 | `operateLicenseResult` | `direct` |
| 是否违法违规 | `offenceResult` | `direct` |
| 是否存在隐患风险 | `hiddenRiskResult` | `direct` |
| 评估结果 | `assessResult` | `direct` |

### 7.5 项目备案情况（仅闪光租）

数据来源：`projectBaseInfo.filingStatusInfo`

输出为 **2 个 block**，顺序如下：

**Block A — 自用电价（direct）**

```json
{
  "blockKey": "selfUseElectricityPrice",
  "label": "自用电价",
  "displayType": "direct",
  "value": "233.0000 元/度"
}
```

- 取值：`filingStatusInfo.selfUseElectricityPrice`
- 格式：保留 4 位小数 + 单位「元/度」

**Block B — 项目备案明细（table）**

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 项目名称 | `projectName` | 原样 |
| 备案容量(MW) | `registeredCapacityMw` | 2 位小数 |
| 实际容量(MW) | `actualCapacityMw` | 2 位小数 |
| 模式 | `operationMode` | 原样 |
| 屋顶企业 | `roofEnterprise` | 原样 |
| 用电企业 | `powerConsumingEnterprise` | 原样 |
| 自用电价（元/度） | `selfConsumptionTariff` | 4 位小数 |
| 消纳比例(%) | `consumptionRatio` | 4 位小数 |
| 项目地址 | `projectAddress` | 原样 |
| 并网日期 | `gridConnectionDate` | 原样 |
| 设备 | `equipment` | 原样 |

- `showIndex`: `true`
- `emptyText`: `暂无备案信息`
- `summary`：取 `filingStatusInfo.filingStatusTotal`
  - 首列：`合计 --`
  - `registeredCapacityMw` / `actualCapacityMw` 填汇总值
  - 其余列：`—`

---

## 八、空值与格式化规则

| 规则 | 说明 |
| ---- | ---- |
| 空值占位 | `null` / `""` / 缺失 → 展示值填 `—` |
| 金额 | 千分位 + 保留 2 位小数，如 `10,000.00` |
| 百分比 | 保留 4 位小数 + `%`，如 `8.5155%` |
| margin | 保留 5 位小数 + `%` |
| 容量 MW | 保留 2 位小数，如 `23.00` |
| 电价 | 保留 4 位小数，单位「元/度」 |
| 枚举 | 直接展示接口返回的中文值，不做码值转换 |
| 人员 | `name` 有值 + `workNo` 有值 → L2 渲染为 `姓名（工号）` |

---

## 九、输出示例（闪光租 · 基于 data.js）

```json
{
  "moduleIndex": 1,
  "moduleName": "基本信息",
  "moduleKey": "project_base_info",
  "blocks": [
    {
      "blockKey": "projectBaseInfo",
      "label": "项目基本信息",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "customerName", "label": "客户名称", "displayType": "direct", "value": "张家港博佑光电科技有限公司" },
        { "blockKey": "projectAmount", "label": "项目金额", "displayType": "direct", "value": "10,000.00" },
        { "blockKey": "projectType", "label": "项目类型", "displayType": "direct", "value": "闪光租" },
        { "blockKey": "projectSource", "label": "项目来源", "displayType": "direct", "value": "代销-厂商" },
        { "blockKey": "leaseMethod", "label": "租赁方式", "displayType": "direct", "value": "回租" },
        { "blockKey": "capitalUse", "label": "资金用途", "displayType": "direct", "value": "购置本次租赁物" },
        { "blockKey": "manager", "label": "项目经理", "displayType": "person", "name": "顾泽平", "workNo": "0569" },
        { "blockKey": "custHelp", "label": "项目协办人", "displayType": "person", "name": "盛泽宇", "workNo": "0616" },
        { "blockKey": "insuranceSituation", "label": "投保情况", "displayType": "direct", "value": "客户自行购买保险" },
        { "blockKey": "leasebackReason", "label": "售后回租原因", "displayType": "direct", "value": "承租人缺进项票" },
        { "blockKey": "deptName", "label": "部门名称", "displayType": "direct", "value": "清洁能源二部" },
        { "blockKey": "leaseInsurance", "label": "租赁物保险", "displayType": "longText", "value": "符合公司保险政策，为设备购买财产一切险" },
        { "blockKey": "leasebackExplain", "label": "售后回租原因说明", "displayType": "longText", "value": "售后回租（新设备）原因说明456" }
      ]
    },
    {
      "blockKey": "quoteInfo",
      "label": "报价信息",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "projectCash", "label": "项目金额", "displayType": "direct", "value": "10,000.00" },
        { "blockKey": "assetsTotalAmount", "label": "设备总价", "displayType": "direct", "value": "100,023.00" },
        { "blockKey": "leaseMethod", "label": "租赁方式", "displayType": "direct", "value": "回租" },
        { "blockKey": "leaseTimes", "label": "租赁期限(月)", "displayType": "direct", "value": "36" },
        { "blockKey": "finalRate", "label": "报价利率", "displayType": "direct", "value": "4.0300%" },
        { "blockKey": "netFinanceCash", "label": "净融资额(元)", "displayType": "direct", "value": "10,000.00" },
        { "blockKey": "downPayment", "label": "首付款金额(元)", "displayType": "direct", "value": "0.00" },
        { "blockKey": "depositCash", "label": "保证金总额(元)", "displayType": "direct", "value": "0.00" },
        { "blockKey": "leaseCashSum", "label": "总租金(元)", "displayType": "direct", "value": "11,196.00" },
        { "blockKey": "leaseInterestSum", "label": "总利息(元)", "displayType": "direct", "value": "1,196.00" },
        { "blockKey": "planCashLoan", "label": "总本金(元)", "displayType": "direct", "value": "10,000.00" },
        { "blockKey": "srvfeeCashOut", "label": "服务费金额(元)", "displayType": "direct", "value": "0.00" },
        { "blockKey": "generalIrr", "label": "综合收益率", "displayType": "direct", "value": "8.5155%" },
        { "blockKey": "internalIrr", "label": "内部收益率", "displayType": "direct", "value": "8.5155%" }
      ]
    },
    {
      "blockKey": "referenceYield",
      "label": "参考收益率",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "projectIrr", "label": "计划合同IRR", "displayType": "direct", "value": "8.5155%" }
      ]
    },
    {
      "blockKey": "environmentAndSocialRisk",
      "label": "环境与社会风险评估",
      "displayType": "group",
      "columns": 2,
      "children": [
        { "blockKey": "exclusionBusinessResult", "label": "是否禁入业务", "displayType": "direct", "value": "否" },
        { "blockKey": "policyRestrictResult", "label": "是否政策限制", "displayType": "direct", "value": "否" },
        { "blockKey": "operateLicenseResult", "label": "是否取得经营许可", "displayType": "direct", "value": "是" },
        { "blockKey": "offenceResult", "label": "是否违法违规", "displayType": "direct", "value": "否" },
        { "blockKey": "hiddenRiskResult", "label": "是否存在隐患风险", "displayType": "direct", "value": "否" },
        { "blockKey": "assessResult", "label": "评估结果", "displayType": "direct", "value": "中" }
      ]
    },
    {
      "blockKey": "selfUseElectricityPrice",
      "label": "自用电价",
      "displayType": "direct",
      "value": "233.0000 元/度"
    },
    {
      "blockKey": "filingStatusDetailList",
      "label": "项目备案明细",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "projectName", "label": "项目名称" },
        { "key": "registeredCapacityMw", "label": "备案容量(MW)" },
        { "key": "actualCapacityMw", "label": "实际容量(MW)" },
        { "key": "operationMode", "label": "模式" },
        { "key": "roofEnterprise", "label": "屋顶企业" },
        { "key": "powerConsumingEnterprise", "label": "用电企业" },
        { "key": "selfConsumptionTariff", "label": "自用电价（元/度）" },
        { "key": "consumptionRatio", "label": "消纳比例(%)" },
        { "key": "projectAddress", "label": "项目地址" },
        { "key": "gridConnectionDate", "label": "并网日期" },
        { "key": "equipment", "label": "设备" }
      ],
      "rows": [
        {
          "projectName": "的说法是",
          "registeredCapacityMw": "23.00",
          "actualCapacityMw": "23.00",
          "operationMode": "全部上网",
          "roofEnterprise": "是大幅度随风倒十分撒旦发撒旦发",
          "powerConsumingEnterprise": "但是犯得上房贷首付是撒旦发",
          "selfConsumptionTariff": "233.0000",
          "consumptionRatio": "23.0000",
          "projectAddress": "士大夫大师傅是",
          "gridConnectionDate": "2026-08-21",
          "equipment": "大师傅大师傅"
        }
      ],
      "summary": {
        "index": "合计 --",
        "registeredCapacityMw": "—",
        "actualCapacityMw": "—"
      },
      "emptyText": "暂无备案信息"
    }
  ]
}
```

---

## 十、输出约束

1. 必须携带 `moduleIndex: 1`，供 L0 排序
2. 输出 JSON，**不包含 HTML 标签**
3. 字段名使用中文 `label`，接口英文字段名仅用于取值匹配
4. 空值统一填 `—`，不输出 `null` 或空字符串
5. 不传当前尽调系统不需要的 block / 字段
6. `blocks` 内顺序严格按第六节表格排列
