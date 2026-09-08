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
| `lshldModel.isInstallEquipment` | 是否安装租赁物监控设备 |
| `lshldModel.installEquipmentDesc` | 监控设备情况说明 |
| `lshldModel.evalReportNo` | 评估报告号 |
| `lshldModel.netWorthTotal` | 净值合计(元) |
| `lshldModel.pricingResult` | 定价结果(元) |
| `lshldModel.convertRatio` | 公司要求折价比例(%) |
| `lshldModel.realityConvertRatio` | 实际折价比例(%) |
| `lshldModel.equipmentRatio` | 通用设备占比(%) |
| `lshldModel.lshldInfoList[]` | 租赁物明细（汇总列 + 行内详情） |
| `lshldModel.lshldPriceTotal` | 原值合计（表合计行） |
| `lshldModel.netWorthTotal` | 净值合计（表合计行，与顶栏同字段） |
| `lshldModel.lshldOwnershipDesc` | 租赁物权属状态说明 |
| `lshldModel.breakPriceDesc` | 是否突破作价及说明 |

**PDF 不提取 / 不输出：**

| 字段 / 能力 | 原因 |
| ----------- | ---- |
| `pkRentThing` / `pkRentThingCore` 等主键 | 仅数据匹配 |
| `supplierInfoList` | 本 mock / 截图无供应商区展示需求（空列表） |
| `initialDetail` / `checkInfo` / `riskInfo` | 详情弹窗其它分区；本页展开区未展示 |
| 「全部展开」「全部收起」「导出」「操作 / 收起」 | 页面交互；PDF 默认全部展开详情 |

---

## 四、整合流程

```text
1. 若 lshldModel 为 null / 缺失：整模块不输出
2. 输出顶部汇总 group（4 列）
3. 输出租赁物明细 table：每行 = 汇总列 + detail 详情栅格（PDF 全部展开）
4. 输出权属说明、突破作价说明 longText（有值时）
5. 空值 →「—」；金额千分位 2 位；比例原样透传（不追加 %）
6. 输出 moduleIndex=7 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

- `lshldInfoList` 为 `null` / `[]`：仍输出 table + `emptyText`
- `thingType`：取对象 `name`
- 每条明细**必须**输出 `detail`（20 字段 · 5 列栅格），对齐页面展开区；无折叠交互
- 合计行：原值 ← `lshldPriceTotal`，净值 ← `netWorthTotal`；其余列 `—`；序号列文案 `合计`；合计行**无** `detail`
- 宽表（汇总列数 > 8）：L2 自动叠行；详情栅格仍挂在该条记录下方
- 长文本为空：不输出该 block

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

**数据来源：** `lshldModel` 顶层字段  
**displayType：** `group`；子字段均为 `direct`

| 顺序 | label | 接口字段 | displayType | 格式化 |
| :--: | ----- | -------- | ----------- | ------ |
| 1 | 是否安装租赁物监控设备 | `isInstallEquipment` | `direct` | 原样 |
| 2 | 监控设备情况说明 | `installEquipmentDesc` | `direct` | 原样 |
| 3 | 评估报告号 | `evalReportNo` | `direct` | 原样 |
| 4 | 净值合计(元) | `netWorthTotal` | `direct` | 千分位 |
| 5 | 定价结果(元) | `pricingResult` | `direct` | 千分位 |
| 6 | 公司要求折价比例(%) | `convertRatio` | `direct` | 原样 |
| 7 | 实际折价比例(%) | `realityConvertRatio` | `direct` | 原样 |
| 8 | 通用设备占比(%) | `equipmentRatio` | `direct` | 原样 |

### 7.2 租赁物明细（table）

**数据来源：** `lshldModel.lshldInfoList[]`  
**blockKey：** `lshldInfoList`  
**label：** `租赁物信息`  
**displayType：** `table`  
**showIndex：** `true`  
**emptyText：** `暂无租赁物数据`

#### 7.2.1 汇总行（表头列 · 对齐列表收起态）

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

> **不输出**「操作」列。

**合计行 summary：**

| 字段 | 值 |
| ---- | -- |
| `index` | `合计` |
| `originalValue` | `lshldPriceTotal` |
| `netWorth` | `netWorthTotal` |

#### 7.2.2 行内详情（展开区 · PDF 每条必出）

对齐页面「展开」后的详情栅格；字段均取自同条 `lshldInfoList[]` 项。

**结构：** `rows[i].detail`

| 属性 | 值 |
| ---- | -- |
| `detail.columns` | `5`（每行 5 个字段，共 4 行） |
| `detail.children[]` | 见下表；`displayType: direct` |

| 顺序 | label | 接口字段 | 格式化 |
| :--: | ----- | -------- | ------ |
| 1 | 租赁物名称 | `thingName` | 原样 |
| 2 | 品牌 | `brand` | 原样 |
| 3 | 型号 | `model` | 原样 |
| 4 | 中登唯一标识码 | `zdNo` | 原样 |
| 5 | 数量 | `thingNumber` | 原样 |
| 6 | 是否主租赁物 | `isRefMain` | 原样 |
| 7 | 租赁物分类 | `thingType.name` | 原样 |
| 8 | 使用地点 | `useAddress` | 原样 |
| 9 | 发票号 | `invoiceNo` | 原样 |
| 10 | 发票日期 | `invoiceDate` | 原样 |
| 11 | 原值(元) | `originalValue` | 千分位 |
| 12 | 实际折旧月数 | `depreciationMonths` | 原样 |
| 13 | 折旧年限 | `depreciationYears` | 原样 |
| 14 | 累计折旧(元) | `accumulatedDepreciation` | 千分位 |
| 15 | 净值(元) | `netWorth` | 千分位 |
| 16 | 租赁物权属状态 | `ownershipStatus` | 原样 |
| 17 | 保险计算基准金额(元) | `insureBaseAmt` | 千分位 |
| 18 | 租赁物评估方式 | `leaseAssetAssessMethod` | 原样 |
| 19 | 租赁物评估日期 | `leaseAssetAssessDate` | 原样 |
| 20 | 资产评估机构名称 | `assetAssessOrgName` | 原样 |

**L2 渲染约定：**

- 标准表：每条数据 `tr` 后追加一行 `td[colspan=列数]`，内嵌 `report-grid`（`columns: 5`）
- 叠行表：每条记录的上下两行之后追加一行详情 `tr`（`colspan` 覆盖序号 + 全部叠列）
- 详情区背景浅灰、与汇总行视觉分隔；**无**「收起」按钮

---

## 八、完整 JSON 示例（节选）

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
        { "blockKey": "netWorthTotal", "label": "净值合计(元)", "displayType": "direct", "value": "9,369,161.39" }
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
              { "blockKey": "zdNo", "label": "中登唯一标识码", "displayType": "direct", "value": "—" },
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
