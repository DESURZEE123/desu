# 租赁物信息 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**7**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `lshldModel`，按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不调用核心租赁物接口、不做 HTML 渲染。

页面为「顶部汇总指标 + 租赁物明细表（可展开行）+ 底部说明」；PDF **全部展开**：每条明细在汇总行下固定输出详情栅格（无全部展开 / 收起 / 导出 / 操作列）。

> 若 `lshldModel` 为 null / 缺失，整模块不输出。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `7` |
| `moduleKey` | `lease_property` |
| `moduleName` | `租赁物信息` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `lshldModel` | 模块主数据对象 |
| `projectBaseInfo.leaseMethod` | 租赁方式（判定项目形态） |
| `projectBaseInfo.capitalUse` | 资金用途（判定项目形态） |
| `lshldModel.isInstallEquipment` | 是否安装租赁物监控设备（各形态均展示） |
| `lshldModel.installEquipmentDesc` | 监控设备情况说明（各形态均展示） |
| `lshldModel.evalReportNo` | 评估报告号（**仅纯回租**） |
| `lshldModel.netWorthTotal` | 净值合计(元)（顶栏**仅纯回租**；表合计行各形态均用） |
| `lshldModel.pricingResult` | 定价结果(元)（**仅纯回租**） |
| `lshldModel.convertRatio` | 公司要求折价比例(%)（**仅纯回租**） |
| `lshldModel.realityConvertRatio` | 实际折价比例(%)（**仅纯回租**） |
| `lshldModel.equipmentRatio` | 通用设备占比(%)（系统计算；**仅纯回租**） |
| `lshldModel.lshldInfoList[]` | 租赁物明细（汇总列 + 行内详情；列集按形态分支，见 §7.2） |
| `lshldModel.lshldInfoList[].consumerName` | 供应商名称（**直租 / 直转回**） |
| `lshldModel.lshldInfoList[].isNew` | 新旧标识（**直租 / 直转回**） |
| `lshldModel.lshldInfoList[].deliveryAddress` | 交货地点（**直租 / 直转回**） |
| `lshldModel.lshldInfoList[].zdNo` | 中登唯一识别码（**纯回租**详情） |
| `lshldModel.lshldInfoList[].invoiceNo` / `invoiceDate` | 发票号 / 发票日期（**纯回租**） |
| `lshldModel.lshldInfoList[].depreciationMonths` | 实际折旧月数（**纯回租**；清单或称「实际折旧年限」） |
| `lshldModel.lshldInfoList[].accumulatedDepreciation` | 累计折旧(元)（**纯回租**） |
| `lshldModel.lshldPriceTotal` | 原值合计（表合计行） |
| `lshldModel.lshldOwnershipDesc` | 租赁物权属状态说明 |
| `lshldModel.breakPriceDesc` | 是否突破作价及说明 |

### 3.1 项目形态判定（取 `projectBaseInfo`）

| 项目形态 | 判定条件 |
| -------- | -------- |
| 直租 | `leaseMethod = 直租` |
| 直转回 | `leaseMethod = 回租` 且 `capitalUse ∈ {购置本次租赁物, 其他租赁物}` |
| 纯回租 | `leaseMethod = 回租` 且 `capitalUse = 补充流动资金` |

> 判定顺序：先看是否直租；否则再按资金用途区分直转回 / 纯回租。L1 **只读**上述两字段做展示分支，不改写业务数据。

**PDF 不提取 / 不输出：**

| 字段 / 能力 | 原因 |
| ----------- | ---- |
| `pkRentThing` / `pkRentThingCore` 等主键 | 仅数据匹配 |
| `supplierInfoList` | 本 mock / 截图无供应商区展示需求（空列表） |
| `initialDetail` / `checkInfo` / `riskInfo` | 详情弹窗其它分区；本页展开区未展示 |
| 「全部展开」「全部收起」「导出」「操作 / 收起」 | 页面交互；PDF 默认全部展开详情 |
| 顶栏纯回租专属字段（见 §5 / §7.1） | 直租、直转回形态下不输出 |

---

## 四、整合流程

```text
1. 若 lshldModel 为 null / 缺失：整模块不输出
2. 读取 projectBaseInfo.leaseMethod / capitalUse，按 §3.1 判定项目形态
3. 输出顶部汇总 group（4 列）：始终含监控设备 2 字段；仅纯回租追加评估/净值/定价/折价/占比字段
4. 输出租赁物明细 table：每行 = 汇总列 + detail 详情栅格（PDF 全部展开）
5. 输出权属说明、突破作价说明 longText（有值时）
6. 空值 →「—」；金额千分位 2 位；比例原样透传（不追加 %）
7. 输出 moduleIndex=7 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

- `lshldInfoList` 为 `null` / `[]`：仍输出 table + `emptyText`
- `thingType`：取对象 `name`
- 明细表 **汇总列 + 行内详情字段集按项目形态分支**（§7.2.A 直租/直转回 vs §7.2.B 纯回租）；不可混用
- 每条明细**必须**输出对应形态的 `detail`，对齐页面展开区；无折叠交互
- 合计行：原值 ← `lshldPriceTotal`，净值 ← `netWorthTotal`；其余列 `—`；序号列文案 `合计`；合计行**无** `detail`（合计行净值各形态均可带，与顶栏纯回租条件无关）
- 宽表（汇总列数 > 8）：L2 自动叠行；详情栅格仍挂在该条记录下方
- 长文本为空：不输出该 block

**顶部汇总 · 仅纯回租展示的字段：**

| 字段 label | 接口字段 | 必填（页面） | 说明 |
| ---------- | -------- | :----------: | ---- |
| 评估报告号 | `evalReportNo` | 视页面 | 空 → `—` |
| 净值合计(元) | `netWorthTotal` | — | 千分位；系统汇总 |
| 定价结果(元) | `pricingResult` | — | 千分位 |
| 公司要求折价比例(%) | `convertRatio` | 视页面 | 原样透传，不追加 `%` |
| 实际折价比例(%) | `realityConvertRatio` | — | 原样透传 |
| 通用设备占比(%) | `equipmentRatio` | 视页面 | 系统计算；原样透传 |

> 直租 / 直转回：上述 6 项 **整字段不输出**（不占位）。  
> 各形态均展示：`是否安装租赁物监控设备`、`监控设备情况说明`。

**样例对照：**

| 样例 JSON | leaseMethod | capitalUse | 形态 | 顶栏纯回租字段 |
| --------- | ----------- | ---------- | ---- | -------------- |
| `大于500w区域线直租.json` | 直租 | 购置本次租赁物 | 直租 | 不展示 |
| `大于500w区域线回租.json` | 回租 | 补充流动资金 | 纯回租 | 展示 |
| `大于500w老客租回租.json` | 回租 | 补充流动资金 | 纯回租 | 展示 |

---

## 六、blocks 组装顺序

| 顺序 | blockKey | label | displayType |
| :--: | -------- | ----- | ----------- |
| 1 | `summary` | （不传 label） | `group` columns: 4 |
| 2 | `lshldInfoList` | `租赁物信息` | `table`（含行内 `detail`） |
| 3 | `lshldOwnershipDesc` | `租赁物权属状态说明` | `longText`（有值时） |
| 4 | `breakPriceDesc` | `是否突破作价及说明` | `longText`（有值时） |

---

## 七、字段映射

### 7.1 顶部汇总（group · columns: 4）

**数据来源：** `lshldModel` 顶层字段 + §3.1 项目形态  
**displayType：** `group`；子字段均为 `direct`；**不传 group label**

| 顺序 | label | 接口字段 | displayType | 格式化 | 展示条件 |
| :--: | ----- | -------- | ----------- | ------ | -------- |
| 1 | 是否安装租赁物监控设备 | `isInstallEquipment` | `direct` | 原样 | 各形态 |
| 2 | 监控设备情况说明 | `installEquipmentDesc` | `direct` | 原样 | 各形态 |
| 3 | 评估报告号 | `evalReportNo` | `direct` | 原样 | **仅纯回租** |
| 4 | 净值合计(元) | `netWorthTotal` | `direct` | 千分位 | **仅纯回租** |
| 5 | 定价结果(元) | `pricingResult` | `direct` | 千分位 | **仅纯回租** |
| 6 | 公司要求折价比例(%) | `convertRatio` | `direct` | 原样 | **仅纯回租** |
| 7 | 实际折价比例(%) | `realityConvertRatio` | `direct` | 原样 | **仅纯回租** |
| 8 | 通用设备占比(%) | `equipmentRatio` | `direct` | 原样（系统计算） | **仅纯回租** |

> 非纯回租时 `summary.children` 仅含顺序 1～2；纯回租时按 1～8 全量输出（空值填 `—`）。

### 7.2 租赁物明细（table · 按形态分支）

**数据来源：** `lshldModel.lshldInfoList[]`  
**blockKey：** `lshldInfoList`  
**label：** `租赁物信息`  
**displayType：** `table`  
**showIndex：** `true`  
**emptyText：** `暂无租赁物数据`

> 先按 §3.1 判定形态，再选用 **§7.2.A** 或 **§7.2.B** 的汇总列 + 详情字段。  
> **直租 / 直转回** = 资金用途为「购置本次租赁物」或「其他租赁物」（含 `leaseMethod=直租`，以及回租且购置类资金用途）。  
> **纯回租** = `leaseMethod=回租` 且 `capitalUse=补充流动资金`。

**合计行 summary（各形态相同）：**

| 字段 | 值 |
| ---- | -- |
| `index` | `合计` |
| `originalValue` | `lshldPriceTotal` |
| `netWorth` | `netWorthTotal` |

> **不输出**「操作」列。

---

#### 7.2.A 直租 / 直转回（购置本次租赁物 / 其他租赁物）

##### A1 汇总行（表头列）

| 列 label | key | 来源 | 格式化 |
| -------- | --- | ---- | ------ |
| 租赁物名称 | `thingName` | `thingName` | 原样；建议 `stackSpan: true` |
| 品牌 | `brand` | `brand` | 原样 |
| 型号 | `model` | `model` | 原样 |
| 数量 | `thingNumber` | `thingNumber` | 原样 |
| 供应商名称 | `consumerName` | `consumerName` | 原样 |
| 是否主租赁物 | `isRefMain` | `isRefMain` | 原样 |
| 新旧标识 | `isNew` | `isNew` | 原样（如「新设备」） |
| 租赁物分类 | `thingType` | `thingType.name` | 原样 |
| 使用地点 | `useAddress` | `useAddress` | 原样 |
| 交货地点 | `deliveryAddress` | `deliveryAddress` | 原样 |
| 原值(元) | `originalValue` | `originalValue` | 千分位 |
| 净值(元) | `netWorth` | `netWorth` | 千分位 |
| 租赁物权属状态 | `ownershipStatus` | `ownershipStatus` | 原样 |

##### A2 行内详情（`detail.columns: 5` · 每条必出）

| 顺序 | label | 接口字段 | 格式化 |
| :--: | ----- | -------- | ------ |
| 1 | 租赁物名称 | `thingName` | 原样 |
| 2 | 品牌 | `brand` | 原样 |
| 3 | 型号 | `model` | 原样 |
| 4 | 数量 | `thingNumber` | 原样 |
| 5 | 供应商名称 | `consumerName` | 原样 |
| 6 | 是否主租赁物 | `isRefMain` | 原样 |
| 7 | 新旧标识 | `isNew` | 原样 |
| 8 | 租赁物分类 | `thingType.name` | 原样 |
| 9 | 使用地点 | `useAddress` | 原样 |
| 10 | 交货地点 | `deliveryAddress` | 原样 |
| 11 | 原值(元) | `originalValue` | 千分位 |
| 12 | 净值(元) | `netWorth` | 千分位 |
| 13 | 租赁物权属状态 | `ownershipStatus` | 原样 |
| 14 | 保险计算基准金额(元) | `insureBaseAmt` | 千分位 |
| 15 | 租赁物评估方式 | `leaseAssetAssessMethod` | 原样 |
| 16 | 租赁物评估日期 | `leaseAssetAssessDate` | 原样 |
| 17 | 资产评估机构名称 | `assetAssessOrgName` | 原样 |

> **不输出**（本形态）：中登唯一识别码、发票号、发票日期、实际折旧月数、折旧年限、累计折旧。

---

#### 7.2.B 纯回租（回租 + 补充流动资金）

##### B1 汇总行（表头列）

| 列 label | key | 来源 | 格式化 |
| -------- | --- | ---- | ------ |
| 租赁物名称 | `thingName` | `thingName` | 原样；建议 `stackSpan: true` |
| 租赁物分类 | `thingType` | `thingType.name` | 原样 |
| 品牌 | `brand` | `brand` | 原样 |
| 型号 | `model` | `model` | 原样 |
| 数量 | `thingNumber` | `thingNumber` | 原样 |
| 是否主租赁物 | `isRefMain` | `isRefMain` | 原样 |
| 发票号 | `invoiceNo` | `invoiceNo` | 原样 |
| 发票日期 | `invoiceDate` | `invoiceDate` | 原样 |
| 折旧年限 | `depreciationYears` | `depreciationYears` | 原样 |
| 原值(元) | `originalValue` | `originalValue` | 千分位 |
| 净值(元) | `netWorth` | `netWorth` | 千分位 |
| 使用地点 | `useAddress` | `useAddress` | 原样 |
| 租赁物权属状态 | `ownershipStatus` | `ownershipStatus` | 原样 |

##### B2 行内详情（`detail.columns: 5` · 每条必出）

| 顺序 | label | 接口字段 | 格式化 |
| :--: | ----- | -------- | ------ |
| 1 | 租赁物名称 | `thingName` | 原样 |
| 2 | 品牌 | `brand` | 原样 |
| 3 | 型号 | `model` | 原样 |
| 4 | 中登唯一识别码 | `zdNo` | 原样 |
| 5 | 数量 | `thingNumber` | 原样 |
| 6 | 是否主租赁物 | `isRefMain` | 原样 |
| 7 | 租赁物分类 | `thingType.name` | 原样 |
| 8 | 使用地点 | `useAddress` | 原样 |
| 9 | 发票号 | `invoiceNo` | 原样 |
| 10 | 发票日期 | `invoiceDate` | 原样 |
| 11 | 原值(元) | `originalValue` | 千分位 |
| 12 | 实际折旧月数 | `depreciationMonths` | 原样（清单或称「实际折旧年限」，按月数透传） |
| 13 | 折旧年限 | `depreciationYears` | 原样 |
| 14 | 累计折旧(元) | `accumulatedDepreciation` | 千分位（清单或称「累积折旧」） |
| 15 | 净值(元) | `netWorth` | 千分位 |
| 16 | 租赁物权属状态 | `ownershipStatus` | 原样 |
| 17 | 保险计算基准金额(元) | `insureBaseAmt` | 千分位 |
| 18 | 租赁物评估方式 | `leaseAssetAssessMethod` | 原样 |
| 19 | 租赁物评估日期 | `leaseAssetAssessDate` | 原样 |
| 20 | 资产评估机构名称 | `assetAssessOrgName` | 原样 |

> **不输出**（本形态）：供应商名称、新旧标识、交货地点。

**L2 渲染约定（A/B 通用）：**

- 标准表：每条数据 `tr` 后追加一行 `td[colspan=列数]`，内嵌 `report-grid`（`columns: 5`）
- 叠行表：每条记录的上下两行之后追加一行详情 `tr`（`colspan` 覆盖序号 + 全部叠列）
- 详情区背景浅灰、与汇总行视觉分隔；**无**「收起」按钮

---

## 八、完整 JSON 示例（节选）

> 下例顶栏为 **纯回租**；明细 `detail` 亦按 §7.2.B。直租 / 直转回请改用 §7.2.A 字段集（含供应商名称 / 新旧标识 / 交货地点，无发票与折旧月数等）。

```json
{
  "moduleIndex": 7,
  "moduleName": "租赁物信息",
  "moduleKey": "lease_property",
  "blocks": [
    {
      "blockKey": "summary",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "isInstallEquipment", "label": "是否安装租赁物监控设备", "displayType": "direct", "value": "是" },
        { "blockKey": "installEquipmentDesc", "label": "监控设备情况说明", "displayType": "direct", "value": "—" },
        { "blockKey": "evalReportNo", "label": "评估报告号", "displayType": "direct", "value": "—" },
        { "blockKey": "netWorthTotal", "label": "净值合计(元)", "displayType": "direct", "value": "9,369,161.39" },
        { "blockKey": "pricingResult", "label": "定价结果(元)", "displayType": "direct", "value": "10,000,000.00" },
        { "blockKey": "convertRatio", "label": "公司要求折价比例(%)", "displayType": "direct", "value": "85.0000" },
        { "blockKey": "realityConvertRatio", "label": "实际折价比例(%)", "displayType": "direct", "value": "98.8409" },
        { "blockKey": "equipmentRatio", "label": "通用设备占比(%)", "displayType": "direct", "value": "10.0000" }
      ]
    },
    {
      "blockKey": "lshldInfoList",
      "label": "租赁物信息",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "thingName", "label": "租赁物名称", "stackSpan": true },
        { "key": "thingType", "label": "租赁物分类" },
        { "key": "brand", "label": "品牌" },
        { "key": "model", "label": "型号" },
        { "key": "thingNumber", "label": "数量", "align": "right" },
        { "key": "isRefMain", "label": "是否主租赁物" },
        { "key": "invoiceNo", "label": "发票号" },
        { "key": "invoiceDate", "label": "发票日期" },
        { "key": "depreciationYears", "label": "折旧年限", "align": "right" },
        { "key": "originalValue", "label": "原值(元)", "align": "right" },
        { "key": "netWorth", "label": "净值(元)", "align": "right" },
        { "key": "useAddress", "label": "使用地点" },
        { "key": "ownershipStatus", "label": "租赁物权属状态" }
      ],
      "rows": [
        {
          "thingName": "正包毛巾机",
          "thingType": "纺织设备",
          "brand": "—",
          "model": "30”20G60F",
          "thingNumber": "9",
          "isRefMain": "否",
          "invoiceNo": "03805167",
          "invoiceDate": "2022-09-28",
          "depreciationYears": "10.00",
          "originalValue": "972,000.00",
          "netWorth": "618,030.00",
          "useAddress": "海安经济技术开发区立发大道（东）88号",
          "ownershipStatus": "无抵押",
          "detail": {
            "columns": 5,
            "children": [
              { "blockKey": "thingName", "label": "租赁物名称", "displayType": "direct", "value": "正包毛巾机" },
              { "blockKey": "brand", "label": "品牌", "displayType": "direct", "value": "—" },
              { "blockKey": "model", "label": "型号", "displayType": "direct", "value": "30”20G60F" },
              { "blockKey": "zdNo", "label": "中登唯一识别码", "displayType": "direct", "value": "—" },
              { "blockKey": "thingNumber", "label": "数量", "displayType": "direct", "value": "9" },
              { "blockKey": "isRefMain", "label": "是否主租赁物", "displayType": "direct", "value": "否" },
              { "blockKey": "thingType", "label": "租赁物分类", "displayType": "direct", "value": "纺织设备" },
              { "blockKey": "useAddress", "label": "使用地点", "displayType": "direct", "value": "海安经济技术开发区立发大道（东）88号" },
              { "blockKey": "invoiceNo", "label": "发票号", "displayType": "direct", "value": "03805167" },
              { "blockKey": "invoiceDate", "label": "发票日期", "displayType": "direct", "value": "2022-09-28" },
              { "blockKey": "originalValue", "label": "原值(元)", "displayType": "direct", "value": "972,000.00" },
              { "blockKey": "depreciationMonths", "label": "实际折旧月数", "displayType": "direct", "value": "46" },
              { "blockKey": "depreciationYears", "label": "折旧年限", "displayType": "direct", "value": "10.00" },
              { "blockKey": "accumulatedDepreciation", "label": "累计折旧(元)", "displayType": "direct", "value": "353,970.00" },
              { "blockKey": "netWorth", "label": "净值(元)", "displayType": "direct", "value": "618,030.00" },
              { "blockKey": "ownershipStatus", "label": "租赁物权属状态", "displayType": "direct", "value": "无抵押" },
              { "blockKey": "insureBaseAmt", "label": "保险计算基准金额(元)", "displayType": "direct", "value": "—" },
              { "blockKey": "leaseAssetAssessMethod", "label": "租赁物评估方式", "displayType": "direct", "value": "账面价值" },
              { "blockKey": "leaseAssetAssessDate", "label": "租赁物评估日期", "displayType": "direct", "value": "2026-08-01" },
              { "blockKey": "assetAssessOrgName", "label": "资产评估机构名称", "displayType": "direct", "value": "—" }
            ]
          }
        }
      ],
      "summary": { "index": "合计", "originalValue": "14,675,255.56", "netWorth": "9,369,161.39" }
    }
  ]
}
```

---

## 九、输出约束

1. 必须携带 `moduleIndex: 7`
2. 输出 JSON，**不包含 HTML 标签**
3. 项目形态按 §3.1 判定；顶栏「评估报告号 / 净值合计 / 定价结果 / 公司要求折价比例 / 实际折价比例 / 通用设备占比」**仅纯回租**输出
4. 直租、直转回顶栏仅保留监控设备相关 2 字段
5. 明细表字段集按形态分支：直租/直转回用 §7.2.A；纯回租用 §7.2.B；**不得**混用
6. 空值统一填 `—`；比例字段原样透传，不追加 `%`
7. 明细表合计行的净值不受顶栏纯回租条件限制
