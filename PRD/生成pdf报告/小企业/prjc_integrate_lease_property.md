# 租赁物信息 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**6**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `lshldModel`，按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不调用核心租赁物接口、不做 HTML 渲染。

页面为「顶部汇总指标 + 租赁物明细表 + 底部说明」；PDF **全部展开**（无全部展开 / 收起 / 导出 / 详情按钮）。

> 若 `lshldModel` 为 null / 缺失，整模块不输出。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `6` |
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
| `lshldModel.lshldInfoList[]` | 租赁物明细 |
| `lshldModel.lshldPriceTotal` | 原值合计（表合计行） |
| `lshldModel.netWorthTotal` | 净值合计（表合计行，与顶栏同字段） |
| `lshldModel.lshldOwnershipDesc` | 租赁物权属状态说明 |
| `lshldModel.breakPriceDesc` | 是否突破作价及说明 |

**PDF 不提取 / 不输出：**

| 字段 / 能力 | 原因 |
| ----------- | ---- |
| `pkRentThing` / `pkRentThingCore` 等主键 | 仅数据匹配 |
| `supplierInfoList` | 本 mock / 截图无供应商区展示需求（空列表） |
| `initialDetail` / `checkInfo` / `riskInfo` | 详情弹窗字段，PDF 列表不展开 |
| 「全部展开」「全部收起」「导出」「详情」 | 页面交互 |

---

## 四、整合流程

```text
1. 若 lshldModel 为 null / 缺失：整模块不输出
2. 输出顶部汇总 group（4 列）
3. 输出租赁物明细 table（含合计行）
4. 输出权属说明、突破作价说明 longText（有值时）
5. 空值 →「—」；金额千分位 2 位；比例原样透传（不追加 %）
6. 输出 moduleIndex=6 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

- `lshldInfoList` 为 `null` / `[]`：仍输出 table + `emptyText`
- `thingType`：取对象 `name`
- 合计行：原值 ← `lshldPriceTotal`，净值 ← `netWorthTotal`；其余列 `—`；序号列文案 `合计`
- 宽表（列数 > 8）：L2 自动叠行
- 长文本为空：不输出该 block

---

## 六、blocks 组装顺序

| 顺序 | blockKey | label | displayType |
| :--: | -------- | ----- | ----------- |
| 1 | `summary` | （不传 label） | `group` columns: 4 |
| 2 | `lshldInfoList` | `租赁物信息` | `table` |
| 3 | `lshldOwnershipDesc` | `租赁物权属状态说明` | `longText`（有值时） |
| 4 | `breakPriceDesc` | `是否突破作价及说明` | `longText`（有值时） |

---

## 七、字段映射

### 7.1 顶部汇总（group · columns: 4）

| 顺序 | label | 接口字段 | 格式化 |
| :--: | ----- | -------- | ------ |
| 1 | 是否安装租赁物监控设备 | `isInstallEquipment` | 原样 |
| 2 | 监控设备情况说明 | `installEquipmentDesc` | 原样 |
| 3 | 评估报告号 | `evalReportNo` | 原样 |
| 4 | 净值合计(元) | `netWorthTotal` | 千分位 |
| 5 | 定价结果(元) | `pricingResult` | 千分位 |
| 6 | 公司要求折价比例(%) | `convertRatio` | 原样 |
| 7 | 实际折价比例(%) | `realityConvertRatio` | 原样 |
| 8 | 通用设备占比(%) | `equipmentRatio` | 原样 |

### 7.2 租赁物明细（table）

**showIndex：** `true`  
**emptyText：** `暂无租赁物数据`

| 列 label | key | 来源 |
| -------- | --- | ---- |
| 租赁物名称 | `thingName` | `thingName` |
| 租赁物分类 | `thingType` | `thingType.name` |
| 品牌 | `brand` | `brand` |
| 型号 | `model` | `model` |
| 数量 | `thingNumber` | `thingNumber` |
| 是否主租赁物 | `isRefMain` | `isRefMain` |
| 发票号 | `invoiceNo` | `invoiceNo` |
| 发票日期 | `invoiceDate` | `invoiceDate` |
| 折旧年限 | `depreciationYears` | `depreciationYears` |
| 原值(元) | `originalValue` | `originalValue`（千分位） |
| 净值(元) | `netWorth` | `netWorth`（千分位） |
| 使用地点 | `useAddress` | `useAddress` |
| 租赁物权属状态 | `ownershipStatus` | `ownershipStatus` |

**合计行 summary：**

| 字段 | 值 |
| ---- | -- |
| `index` | `合计` |
| `originalValue` | `fmt(lshldPriceTotal)` |
| `netWorth` | `fmt(netWorthTotal)` |

---

## 八、完整 JSON 示例（节选）

```json
{
  "moduleIndex": 6,
  "moduleName": "租赁物信息",
  "moduleKey": "lease_property",
  "blocks": [
    {
      "blockKey": "summary",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "isInstallEquipment", "label": "是否安装租赁物监控设备", "displayType": "direct", "value": "是" },
        { "blockKey": "netWorthTotal", "label": "净值合计(元)", "displayType": "direct", "value": "1.00" }
      ]
    },
    {
      "blockKey": "lshldInfoList",
      "label": "租赁物信息",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "thingName", "label": "租赁物名称" },
        { "key": "originalValue", "label": "原值(元)", "align": "right" },
        { "key": "netWorth", "label": "净值(元)", "align": "right" }
      ],
      "rows": [
        { "thingName": "测试", "originalValue": "1.00", "netWorth": "1.00" }
      ],
      "summary": { "index": "合计", "originalValue": "1.00", "netWorth": "1.00" }
    }
  ]
}
```
