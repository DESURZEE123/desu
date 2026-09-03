# 项目概要 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**2**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `labelInfo`，按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不做标签条件计算、不调用外部接口、不做 HTML 渲染。

页面为「数据更新时间 + 警示清单 / 负面清单双卡 + 突破说明」；PDF 按同一顺序全部展开输出（无链接弹窗、无悬浮省略交互）。

> 当前 PDF **仅支持小企业**；不读取 `projectAttribute` 做尽调系统分支。标签文案以入参已落库结果为准，L1 **不重算**负面清单 / 警示清单条件。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `2` |
| `moduleKey` | `project_summary` |
| `moduleName` | `项目概要` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `labelInfo` | 模块主数据对象 |
| `labelInfo.queryTime` | 数据更新时间（模块顶栏副标题） |
| `labelInfo.riskLabel[]` | 警示清单条目（字符串数组） |
| `labelInfo.negativeList[]` | 负面清单条目（字符串数组） |
| `labelInfo.labelDesc` | 突破负面清单/警示清单说明 |
| `labelInfo.highlightLabel[]` | 高亮标签（预留；当前 mock 为空，**PDF 不输出**） |
| `labelInfo.status` | 查询状态（仅数据匹配，**不输出**） |
| `labelInfo.pkRecord` | 记录主键（仅数据匹配，**不输出**） |

> PDF **不输出**变更记录弹窗、标签链接下划线交互、重新计算按钮等页面能力。

---

## 四、整合流程

```text
1. 若 labelInfo 为 null / 缺失：整模块不输出
2. 若 riskLabel、negativeList 均为空且无有效 labelDesc：整模块不输出
3. 组装 module 级 updateTime（见 §7.1）
4. 组装 labelPanel 双卡（见 §7.2）；仅输出有数据的清单卡
5. 组装突破说明 longText（见 §7.3）
6. 输出 moduleIndex=2 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

对齐业务 PRD（`项目概要.md`）展示逻辑：

| 场景 | 处理方式 |
| ---- | -------- |
| `labelInfo` 缺失 | 整模块不输出 |
| `riskLabel` 为空 / `[]` | 不输出警示清单卡 |
| `negativeList` 为空 / `[]` | 不输出负面清单卡 |
| 两清单皆空且无 `labelDesc` | 整模块不输出 |
| `labelDesc` | 仅当 `riskLabel` 或 `negativeList` 至少一方有数据时输出 |
| `queryTime` 为空 | 不传 module 级 `updateTime`；其余 blocks 仍正常输出 |
| `highlightLabel` | 不输出（待业务定义 PDF 展示后再扩展） |

**清单条目规则：**

- 按接口数组顺序原样透传文案，L1 不改写、不截断
- 过滤 `null` / `""` / 仅空白条目；过滤后数组为空则视为该清单无数据
- 页面超长省略 + 悬浮完整展示：**PDF 全文展示**，不做省略号截断

---

## 六、blocks 组装顺序

| 顺序 | blockKey | label | displayType | 说明 |
| :--: | -------- | ----- | ----------- | ---- |
| 1 | `labelPanel` | （不传 label） | `labelPanel` | 警示 / 负面双卡区域；仅含非空清单 |
| 2 | `labelDesc` | `突破负面清单/警示清单说明` | `longText` | 任一方清单有数据时 |

> `queryTime` 不占用 block，作为**模块级**字段 `updateTime` 传给 L2，渲染在模块顶栏「数据更新时间」位置（对齐页面截图）。

---

## 七、字段映射与 displayType 规则

### 7.1 模块级数据更新时间

| 字段 | 取值 | 格式化 |
| ---- | ---- | ------ |
| `updateTime` | `labelInfo.queryTime` | `trim` 首尾空白后原样展示 |

```json
{
  "moduleIndex": 2,
  "moduleName": "项目概要",
  "moduleKey": "project_summary",
  "updateTime": "2026-06-02 10:19:07",
  "blocks": []
}
```

- L2 在 `report-module__header` 内模块标题右侧渲染：`数据更新时间 {updateTime}`（样式由 L2 统一定义）
- 无 `updateTime` 时不渲染副标题

### 7.2 清单双卡（labelPanel）

**blockKey：** `labelPanel`  
**displayType：** `labelPanel`

```json
{
  "blockKey": "labelPanel",
  "displayType": "labelPanel",
  "panels": [
    {
      "blockKey": "riskLabel",
      "label": "警示清单",
      "tone": "warning",
      "items": [
        "承租人拜访记录＜3次且累计跟踪＜1个月",
        "承租人为非关联方的对外担保",
        "折旧不符合公司要求"
      ]
    },
    {
      "blockKey": "negativeList",
      "label": "负面清单",
      "tone": "negative",
      "items": [
        "承租人昆山东卓精密电子科技有限公司借贷账户、相关还款责任账户、担保账户存在次级、损失、可疑类贷款记录",
        "总回款可验证比例＜50%",
        "承租人近半年银行流水（含承兑）日均余额不能覆盖租金或日均余额小于月流入的5%"
      ]
    }
  ]
}
```

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `panels[]` | array | 仅包含**有数据**的清单；顺序固定：警示 → 负面 |
| `panels[].blockKey` | string | `riskLabel` / `negativeList` |
| `panels[].label` | string | 卡头文案：`警示清单` / `负面清单` |
| `panels[].tone` | string | `warning`（橙）/ `negative`（红）；供 L2 渲染卡面色调 |
| `panels[].items[]` | string[] | 清单条目，按入参顺序 |

- 仅一方有数据时：`panels` 长度为 1，L2 单卡仍按页面卡样式渲染（宽度对齐双卡布局）
- 两方皆空：不输出本 block

### 7.3 突破说明（longText）

数据来源：`labelInfo.labelDesc`

```json
{
  "blockKey": "labelDesc",
  "label": "突破负面清单/警示清单说明",
  "displayType": "longText",
  "value": "ces"
}
```

- 仅当警示清单或负面清单至少一方有数据时输出
- 空值规范化为 `—`（有清单但说明未填时）
- PDF **不渲染**页面必填红星 `*`；label 固定为「突破负面清单/警示清单说明」

---

## 八、空值与格式化规则

| 规则 | 说明 |
| ---- | ---- |
| 空值占位 | `null` / `""` / 仅空白 → 展示值填 `—`（`labelPanel.items` 中空白条目直接剔除，不进入数组） |
| 清单文案 | 原样透传，保留全角符号（如 `＜`） |
| 说明文本 | `labelDesc` trim 首尾空白后输出 |
| 数组顺序 | 按接口返回顺序，L1 不重排 |

---

## 九、输出示例（对齐 mock.json）

```json
{
  "moduleIndex": 2,
  "moduleName": "项目概要",
  "moduleKey": "project_summary",
  "updateTime": "2026-06-02 10:19:07",
  "blocks": [
    {
      "blockKey": "labelPanel",
      "displayType": "labelPanel",
      "panels": [
        {
          "blockKey": "riskLabel",
          "label": "警示清单",
          "tone": "warning",
          "items": [
            "承租人拜访记录＜3次且累计跟踪＜1个月",
            "承租人为非关联方的对外担保",
            "折旧不符合公司要求"
          ]
        },
        {
          "blockKey": "negativeList",
          "label": "负面清单",
          "tone": "negative",
          "items": [
            "承租人昆山东卓精密电子科技有限公司借贷账户、相关还款责任账户、担保账户存在次级、损失、可疑类贷款记录",
            "总回款可验证比例＜50%",
            "承租人近半年银行流水（含承兑）日均余额不能覆盖租金或日均余额小于月流入的5%"
          ]
        }
      ]
    },
    {
      "blockKey": "labelDesc",
      "label": "突破负面清单/警示清单说明",
      "displayType": "longText",
      "value": "ces"
    }
  ]
}
```

---

## 十、输出约束

1. 必须携带 `moduleIndex: 2`
2. 输出 JSON，**不包含 HTML 标签**
3. 空值统一填 `—`（`labelPanel.items` 除外：空白条目剔除）
4. `blocks` 内顺序严格按第六节表格排列
5. 不输出 `status` / `pkRecord` / `highlightLabel` 及页面交互能力
6. 不做标签条件重算；以入参 `labelInfo` 已落库数据为准

---

## 十一、与 L2 协作约定

1. 本模块新增展示类型：`labelPanel`（双卡清单布局）
2. L2 基地样式（`prjc_style_render.md`）扩展 `labelPanel` 分支时建议结构：
   - 外层：`report-label-panel`（双列栅格）
   - 单卡：`report-label-card report-label-card--warning` / `--negative`
   - 卡头：`report-label-card__title`；列表：`ul.report-label-card__list` > `li`
3. module 级 `updateTime` 由 L2 渲染在模块顶栏，**不**占用 `blocks`
4. 清单条目在 PDF 中**完整展示**；不做 hover 省略
5. 页面变更记录链接（下划线可点击项）在 PDF 中按**纯文本**输出（若后续入参携带链接型标签文案）
