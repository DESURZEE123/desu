#项目基本信息 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**1**（第一个展示）  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `projectBaseInfo` 及相关子对象，按尽调系统类型筛选字段、映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md的Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不做业务分析或 HTML 渲染。

**尽调系统类型对照**

| 中文 | 英文类型 |
| ---- | -------- |
| 闪光租 | `prjc-flr` |
| 小企业 | `prjc-slb` |
| 厂商租赁 | `prjc-drs` |
<!-- | 印包 | `prjc-PEP` | -->
| 环卫 | `prjc-si` |
| 通用大单 | `prjc-gld` |
| 大健康 | `prjc-hdr` |

> 编码规则：`prjc-{小写系统码}`。印包（`prjc-PEP`）暂不在本节对照表启用，文中涉及印包的模块规则保持不变。

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
| `projectAttribute` | 尽调系统类型（`prjc-*`），决定字段展示范围 |
| `projectBaseInfo` | 模块主数据对象 |
| `projectBaseInfo.quoteInfo` | 报价信息分组 |
| `projectBaseInfo.referenceYield` | 参考收益率分组 |
| `projectBaseInfo.environmentAndSocialRisk` | 环境与社会风险评估 |
| `projectBaseInfo.filingStatusInfo` | prjc-flr · 项目备案情况 |
| `projectBaseInfo.projectSourceList` | prjc-gld · 业务信息来源列表 |
| `projectBaseInfo.siteSituation` | 现场考察情况（prjc-flr / prjc-drs / prjc-si） |
| `projectBaseInfo.siteSituationList` | 现场尽调情况列表（prjc-slb / prjc-PEP） |
| `projectBaseInfo.procedureStatusInfo` | prjc-PEP · 手续情况 |
| `projectBaseInfo.onsiteInspectionDetails` | prjc-PEP · 尽调情况说明 |
| `projectBaseInfo.companyBaseInfo` | 项目基本情况（非 prjc-gld） |

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

| 分组 / 字段 | prjc-flr | prjc-slb | prjc-drs | prjc-PEP | prjc-si | prjc-gld | prjc-hdr |
| ----------- | :----: | :----: | :------: | :--: | :--: | :------: | :------: |
| 项目基本信息（通用字段） | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 报价信息 | — | — | — | — | — | ✅ | — |
| 参考收益率 | — | — | — | — | — | ✅ | — |
| 环境与社会风险评估 | ✅ | ✅ | ✅ | ✅ | ✅ | — | 待补充 |
| 项目基本情况（companyBaseInfo） | ✅ | ✅ | ✅ | ✅ | ✅ | — | 待补充 |
| 项目备案情况（filingStatusInfo） | ✅ | — | — | — | — | — | — |
| 对应老合同（oldContInfoList） | — | 条件 | — | — | — | 条件 | — |
| 现场考察情况（siteSituation） | ✅ | — | ✅ | — | ✅ | — | — |
| 现场尽调情况（siteSituationList） | — | ✅ | — | ✅ | — | — | — |
| 手续情况（procedureStatusInfo） | — | — | — | ✅ | — | — | — |
| 尽调情况说明（onsiteInspectionDetails） | — | — | — | ✅ | — | — | — |
| 业务信息来源（projectSourceList） | — | — | — | — | — | ✅ | — |

**条件展示规则：**

- `对应老合同`：prjc-slb 且 `projectType = 老客租项目` 时展示；prjc-gld 按页面规则条件展示
- `项目备案情况`：仅 prjc-flr 展示
- `现场考察情况` / `现场尽调情况`：尽调页面命名不同，PDF 按接口字段分别输出；prjc-drs、prjc-si 走「现场考察情况」，prjc-slb、prjc-PEP 走「现场尽调情况」
- `合同收益IRR(银票)`：实施方案存在投放方式=银票时展示（`referenceYield.contIrrBanknote` 有值）
- `prjc-hdr`（大健康）：本节模块差异待补充，当前 PDF 模块暂不输出专属 block
- `SOFR类型` / `margin`：业务部门=航运金融事业部时展示

---

## 六、blocks 组装顺序

模块内 `blocks` 按以下顺序输出（与页面展示顺序一致）：

| 顺序 | blockKey | label | displayType | 适用系统 |
| :--: | -------- | ----- | ------------- | -------- |
| 1 | `projectBaseInfo` | 项目基本信息 | `group` | 全部 |
| 2 | `quoteInfo` | 报价信息 | `group` | 仅 prjc-gld |
| 3 | `referenceYield` | 参考收益率 | `group` | 仅 prjc-gld |
| 4 | `environmentAndSocialRisk` | 环境与社会风险评估 | `table` | prjc-flr / prjc-slb / prjc-drs / prjc-PEP / prjc-si |
| 5 | `companyBaseInfo` | 项目基本情况 | `longText` | prjc-flr / prjc-slb / prjc-drs / prjc-PEP / prjc-si |
| 6 | `filingStatusInfo` | 项目备案情况 | 混合（见 §7.5） | 仅 prjc-flr |
| 7 | `siteSituation` | 现场考察情况 | `longText` | prjc-flr / prjc-drs / prjc-si |
| 8 | `siteSituationList` | 现场尽调情况 | `table` | prjc-slb / prjc-PEP |
| 9 | `procedureStatusInfo` | 手续情况 | 待定义 | 仅 prjc-PEP |
| 10 | `onsiteInspectionDetails` | 尽调情况说明 | `longText` | 仅 prjc-PEP |
| 11 | `projectSourceList` | 业务信息来源 | `table` / `empty` | prjc-gld |

---

## 七、字段映射与 displayType 规则

### 7.1 项目基本信息（group · columns: 4）

| 顺序 | label | 接口字段 | displayType | 适用系统 | 格式化 |
| :--: | ----- | -------- | ----------- | -------- | ------ |
| 1 | 客户名称 | `customerName` | `direct` | 全部 | 原样 |
| 2 | 融资形式 | `leaseCategry` | `direct` | prjc-gld | 原样 |
| 3 | 项目金额 | `projectAmount` | `direct` | 非 prjc-gld | 千分位 + 2 位小数 |
| 4 | 资金用途 | `capitalUse` | `direct` | 全部 | 原样 |
| 5 | 业务部门 | `deptName` | `direct` | prjc-gld | 原样 |
| 6 | 租赁方式 | `leaseMethod` | `direct` | 非 prjc-gld | 原样 |
| 7 | 项目经理 | `managerName` | `direct` | 全部 | 仅姓名，不传工号 |
| 8 | 项目协办人 | `custHelpName` | `direct` | 全部 | 仅姓名，不传工号 |
| 9 | 项目来源 | `projectSource` | `direct` | 全部 | 原样 |
| 10 | 是否单个报价 | `isOnetoone` | `direct` | prjc-gld | 原样 |
| 11 | 是否投保 | `isInsure` | `direct` | prjc-gld | 原样 |
| 12 | 项目绿色投向 | `greenIndustry` | `direct` | prjc-gld | 原样 |
| 13 | 项目类型 | `projectType` | `direct` | 全部 | 原样 |
| 14 | 评审部门 | `reviewDept` | `direct` | prjc-gld | 原样 |
| 15 | 投保情况 | `insuranceSituation` | `direct` | 非 prjc-gld | 原样 |
| 16 | 售后回租原因 | `leasebackReason` | `direct` | 非 prjc-gld / 非 prjc-si | 原样 |
| 17 | 对应老合同 | `oldContInfoList` | `direct` | prjc-slb（条件） | 取合同名称，多个用 `；` 分隔 |
| 18 | 项目来源说明 | `projectSourceDesc` | `direct` | prjc-drs / prjc-PEP | 原样 |
| 19 | 租赁物保险 | `leaseInsurance` | `longText` | 非 prjc-gld | 原样 |
| 20 | 售后回租原因说明 | `leasebackExplain` | `longText` | 非 prjc-gld / 非 prjc-si | 原样 |

> `项目基本情况`（`companyBaseInfo`）、`现场考察情况`（`siteSituation`）、`现场尽调情况`（`siteSituationList`）、`手续情况`（`procedureStatusInfo`）、`尽调情况说明`（`onsiteInspectionDetails`）按第六节独立 block 输出，不放入 `projectBaseInfo` group。

> prjc-gld 字段顺序对齐页面截图：4 列栅格，先横后纵填充。

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

### 7.4 环境与社会风险评估（table）

数据来源：`projectBaseInfo.environmentAndSocialRisk`

接口为扁平对象，L1 按固定行序展开为 **指标 / 结果** 两列表格（对齐页面截图）。

| 列 label | key | 说明 |
| -------- | --- | ---- |
| 指标 | `indicator` | 固定中文文案（见下行序表） |
| 结果 | `result` | 取对应接口字段原值 |

- `showIndex`: `false`
- `emptyText`: `暂无评估信息`

**行序与字段映射：**

| 顺序 | 指标（`indicator`） | 接口字段 → `result` |
| :--: | ------------------- | ------------------- |
| 1 | 拟承租人经营活动是否涉及业务排除清单 | `exclusionBusinessResult` |
| 2 | 所属行业是否为国家产业政策、行业准入政策限制的行业 | `policyRestrictResult` |
| 3 | 是否取得主管部门颁发的特定行业的许可经营证明 | `operateLicenseResult` |
| 4 | 是否存在国家或省级主管部门认定的重大环境、安全生产违法违规行为 | `offenceResult` |
| 5 | 租赁物是否存在环境和社会风险隐患（易燃易爆物、危险化学品、有毒有害物等） | `hiddenRiskResult` |
| 6 | 评估结论（高、中、低） | `assessResult` |

### 7.5 项目备案情况（仅 prjc-flr）

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
| 人员姓名 | 项目经理 / 项目协办人取 `managerName` / `custHelpName`，`direct` 输出，不传工号 |

---

## 九、输出示例（prjc-flr）

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
        { "blockKey": "managerName", "label": "项目经理", "displayType": "direct", "value": "顾泽平" },
        { "blockKey": "custHelpName", "label": "项目协办人", "displayType": "direct", "value": "盛泽宇" },
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
      "displayType": "table",
      "showIndex": false,
      "columns": [
        { "key": "indicator", "label": "指标" },
        { "key": "result", "label": "结果" }
      ],
      "rows": [
        { "indicator": "拟承租人经营活动是否涉及业务排除清单", "result": "否" },
        { "indicator": "所属行业是否为国家产业政策、行业准入政策限制的行业", "result": "否" },
        { "indicator": "是否取得主管部门颁发的特定行业的许可经营证明", "result": "是" },
        { "indicator": "是否存在国家或省级主管部门认定的重大环境、安全生产违法违规行为", "result": "否" },
        { "indicator": "租赁物是否存在环境和社会风险隐患（易燃易爆物、危险化学品、有毒有害物等）", "result": "否" },
        { "indicator": "评估结论（高、中、低）", "result": "低" }
      ],
      "emptyText": "暂无评估信息"
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
