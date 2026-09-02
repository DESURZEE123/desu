#项目基本信息 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**4**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `projectBaseInfo` 及相关子对象，按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不做业务分析或 HTML 渲染。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `4` |
| `moduleKey` | `project_base_info` |
| `moduleName` | `基本信息` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `projectBaseInfo` | 模块主数据对象 |
| `projectBaseInfo.environmentAndSocialRisk` | 环境与社会风险评估 |
| `projectBaseInfo.siteSituationList` | 现场尽调情况列表 |
| `projectBaseInfo.companyBaseInfo` | 项目基本情况 |

---

## 四、整合流程

```text
1. 从 projectBaseInfo 提取字段
2. 按固定 blocks 顺序组装（见第六节）
3. 为每个字段标注 displayType 并格式化展示值
4. 输出 moduleIndex=4 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

**固定 blocks（对齐小企业页面）：**

| block | label | displayType |
| ----- | ----- | ----------- |
| `projectBaseInfo` | `项目基本信息` | `group` |
| `environmentAndSocialRisk` | `环境与社会风险评估` | `table` |
| `companyBaseInfo` | `项目基本情况` | `longText` |
| `siteSituationList` | `现场尽调情况` | `table` |

**条件展示：**

- `对应老合同`：仅当 `projectType = 老客租项目` 时，在 `projectBaseInfo` group 内输出
- `合同收益IRR(银票)`：实施方案存在银票投放且 `referenceYield.contIrrBanknote` 有值时，在参考收益率相关字段中展示（若入参携带）
- `SOFR类型` / `margin`：业务部门 = 航运金融事业部时展示（若入参携带）

**不输出：** 报价信息、参考收益率（通用大单专属）、项目备案情况、现场考察情况（`siteSituation`）、手续情况、尽调情况说明、业务信息来源列表

---

## 六、blocks 组装顺序

模块内 `blocks` 按以下顺序输出（与页面展示顺序一致）：

| 顺序 | blockKey | label | displayType |
| :--: | -------- | ----- | ----------- |
| 1 | `projectBaseInfo` | `项目基本信息` | `group` |
| 2 | `environmentAndSocialRisk` | `环境与社会风险评估` | `table` |
| 3 | `companyBaseInfo` | `项目基本情况` | `longText` |
| 4 | `siteSituationList` | `现场尽调情况` | `table` |

---

## 七、字段映射与 displayType 规则

### 7.1 项目基本信息（group · columns: 4）

| 顺序 | label | 接口字段 | displayType | 格式化 |
| :--: | ----- | -------- | ----------- | ------ |
| 1 | 客户名称 | `customerName` | `direct` | 原样 |
| 2 | 项目金额(元) | `projectAmount` | `direct` | 千分位 + 2 位小数 |
| 3 | 资金用途 | `capitalUse` | `direct` | 原样 |
| 4 | 租赁方式 | `leaseMethod` | `direct` | 原样 |
| 5 | 项目经理 | `managerName` | `direct` | 仅姓名，不传工号 |
| 6 | 项目协办人 | `custHelpName` | `direct` | 仅姓名，不传工号 |
| 7 | 业务信息来源 | `projectSource` | `direct` | 原样 |
| 8 | 项目类型 | `projectType` | `direct` | 原样 |
| 9 | 投保情况 | `insuranceSituation` | `direct` | 原样 |
| 10 | 售后回租原因 | `leasebackReason` | `direct` | 原样 |
| 11 | 对应老合同 | `oldContInfoList` | `direct` | 条件：`projectType = 老客租项目`；取合同名称，多个用 `；` 分隔 |
| 12 | 租赁物保险 | `leaseInsurance` | `longText` | 原样 |
| 13 | 售后回租原因说明 | `leasebackExplain` | `longText` | 原样 |

> `项目基本情况`（`companyBaseInfo`）、`现场尽调情况`（`siteSituationList`）按第六节独立 block 输出，不放入 `projectBaseInfo` group。

### 7.2 环境与社会风险评估（table）

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

### 7.3 项目基本情况（longText）

数据来源：`projectBaseInfo.companyBaseInfo`

```json
{
  "blockKey": "companyBaseInfo",
  "label": "项目基本情况",
  "displayType": "longText",
  "value": "……"
}
```

### 7.4 现场尽调情况（table）

数据来源：`projectBaseInfo.siteSituationList`

**blockKey：** `siteSituationList`  
**label：** `现场尽调情况`  
**showIndex：** `true`  
**emptyText：** `暂无现场尽调记录`

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 尽调人员 | `workerList` | `workerList[]` 取 `userName`，多人用 `、` 拼接 |
| 尽调日期 | `signDate` | 原样 |
| 地点 | `address` | 原样 |
| 主要内容 | `context` | 原样 |

- PDF **不输出**打卡附件链接、删除按钮等页面交互

---

## 八、空值与格式化规则

| 规则 | 说明 |
| ---- | ---- |
| 空值占位 | `null` / `""` / 缺失 → 展示值填 `—` |
| 金额 | 千分位 + 保留 2 位小数，如 `10,000.00` |
| 百分比 | 保留 4 位小数 + `%`，如 `8.5155%` |
| 枚举 | 直接展示接口返回的中文值，不做码值转换 |
| 人员姓名 | 项目经理 / 项目协办人取 `managerName` / `custHelpName`，`direct` 输出，不传工号 |

---

## 九、输出示例

```json
{
  "moduleIndex": 4,
  "moduleName": "基本信息",
  "moduleKey": "project_base_info",
  "blocks": [
    {
      "blockKey": "projectBaseInfo",
      "label": "项目基本信息",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "customerName", "label": "客户名称", "displayType": "direct", "value": "苏州隆实电子科技有限公司" },
        { "blockKey": "projectAmount", "label": "项目金额(元)", "displayType": "direct", "value": "10,000.00" },
        { "blockKey": "capitalUse", "label": "资金用途", "displayType": "direct", "value": "购置本次租赁物" },
        { "blockKey": "leaseMethod", "label": "租赁方式", "displayType": "direct", "value": "回租" },
        { "blockKey": "managerName", "label": "项目经理", "displayType": "direct", "value": "张三" },
        { "blockKey": "custHelpName", "label": "项目协办人", "displayType": "direct", "value": "李四" },
        { "blockKey": "projectSource", "label": "业务信息来源", "displayType": "direct", "value": "直销" },
        { "blockKey": "projectType", "label": "项目类型", "displayType": "direct", "value": "小企业" },
        { "blockKey": "insuranceSituation", "label": "投保情况", "displayType": "direct", "value": "客户自行购买保险" },
        { "blockKey": "leasebackReason", "label": "售后回租原因", "displayType": "direct", "value": "承租人缺进项票" },
        { "blockKey": "leaseInsurance", "label": "租赁物保险", "displayType": "longText", "value": "符合公司保险政策，为设备购买财产一切险" },
        { "blockKey": "leasebackExplain", "label": "售后回租原因说明", "displayType": "longText", "value": "售后回租原因说明" }
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
      "blockKey": "companyBaseInfo",
      "label": "项目基本情况",
      "displayType": "longText",
      "value": "项目基本情况说明"
    },
    {
      "blockKey": "siteSituationList",
      "label": "现场尽调情况",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "workerList", "label": "尽调人员" },
        { "key": "signDate", "label": "尽调日期" },
        { "key": "address", "label": "地点" },
        { "key": "context", "label": "主要内容" }
      ],
      "rows": [
        {
          "workerList": "马成斌",
          "signDate": "2024-04-10",
          "address": "中国浙江省杭州市淳安县千岛湖镇南山一路92号",
          "context": "拜访直营店，了解经营情况"
        }
      ],
      "emptyText": "暂无现场尽调记录"
    }
  ]
}
```

---

## 十、输出约束

1. 必须携带 `moduleIndex: 4`
2. 输出 JSON，**不包含 HTML 标签**
3. 字段名使用中文 `label`，接口英文字段名仅用于取值匹配
4. 空值统一填 `—`，不输出 `null` 或空字符串
5. `blocks` 内顺序严格按第六节表格排列
