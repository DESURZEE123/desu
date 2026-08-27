# 样式 Skill（L2 · 统一样式渲染）

> 所属：报告自动生成 PDF 模块（PRJC_REPORT）  
> 上游：L1 功能整合 Skill 输出的结构化 JSON  
> 下游：HTML 片段 → PDF 生成服务

---

## 一、Skill Role（技能角色）

本 Skill 接收 L1 功能整合 Skill 输出的**结构化展示数据 JSON**，按 `displayType` 分发到对应样式分支，将数据渲染为**统一样式**的 HTML 片段。

AI 在本层**仅负责样式匹配与 HTML 输出**，不修改、不计算、不补充业务数据。

---

## 二、输入数据 Schema

### 2.1 模块级结构

```json
{
  "moduleName": "模块中文名称",
  "moduleKey": "module_key",
  "blocks": []
}
```

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | :--: | ---- |
| `moduleName` | string | 是 | 模块中文标题，渲染为模块顶栏 |
| `moduleKey` | string | 是 | 模块标识，仅用于数据匹配，不输出到 HTML |
| `blocks` | array | 是 | 模块内数据块列表，按数组顺序渲染 |

### 2.2 数据块通用字段

| 字段 | 类型 | 必填 | 说明 |
| ---- | ---- | :--: | ---- |
| `blockKey` | string | 是 | 数据块标识，仅用于数据匹配，不输出到 HTML |
| `label` | string | 否 | 中文展示名称；`group` / `table` 类型作为分组/表格标题 |
| `displayType` | string | 是 | 展示类型，决定走哪个样式分支（见第三节） |

### 2.3 各 displayType 数据结构

#### direct — 直接展示（键值对）

```json
{
  "blockKey": "customerName",
  "label": "客户名称",
  "displayType": "direct",
  "value": "丹阳龙江钢铁有限公司"
}
```

| 扩展字段 | 类型 | 说明 |
| -------- | ---- | ---- |
| `value` | string | 展示值；空值由 L1 传「—」 |

#### person — 人员参照

```json
{
  "blockKey": "manager",
  "label": "项目经理",
  "displayType": "person",
  "name": "蒋忠宇",
  "workNo": "001234"
}
```

- 渲染格式：`姓名（工号）`；`workNo` 为空时仅展示 `name`

#### longText — 长文本

```json
{
  "blockKey": "leasebackExplain",
  "label": "售后回租原因说明",
  "displayType": "longText",
  "value": "完整文本内容……"
}
```

- 标签与内容上下排列，内容区自动换行，不截断

#### group — 分组展示（多字段键值对区域）

```json
{
  "blockKey": "projectBaseInfo",
  "label": "项目基本信息",
  "displayType": "group",
  "columns": 4,
  "children": [
    {
      "blockKey": "customerName",
      "label": "客户名称",
      "displayType": "direct",
      "value": "丹阳龙江钢铁有限公司"
    },
    {
      "blockKey": "manager",
      "label": "项目经理",
      "displayType": "person",
      "name": "蒋忠宇",
      "workNo": ""
    }
  ]
}
```

| 扩展字段 | 类型 | 说明 |
| -------- | ---- | ---- |
| `columns` | number | 每行展示列数，默认 `4` |
| `children` | array | 子数据块，支持 `direct` / `person` / `longText` |

> 对应页面效果：蓝色圆点 + 分组标题（如「项目基本信息」「报价信息」「参考收益率」），下方 4 列栅格排列键值对。

#### table — 表格展示

```json
{
  "blockKey": "filingStatusDetailList",
  "label": "项目备案明细",
  "displayType": "table",
  "showIndex": true,
  "columns": [
    { "key": "projectName", "label": "项目名称", "align": "left" },
    { "key": "registeredCapacityMw", "label": "备案容量(MW)", "align": "left" },
    { "key": "actualCapacityMw", "label": "实际容量(MW)", "align": "left" }
  ],
  "rows": [
    {
      "projectName": "项目A",
      "registeredCapacityMw": "23.00",
      "actualCapacityMw": "23.00"
    }
  ],
  "summary": {
    "index": "合计 --",
    "registeredCapacityMw": "46.00",
    "actualCapacityMw": "46.00"
  },
  "emptyText": "暂无备案信息"
}
```

| 扩展字段 | 类型 | 说明 |
| -------- | ---- | ---- |
| `showIndex` | boolean | 是否展示序号列，默认 `false` |
| `columns` | array | 列定义，`key` 对应 `rows` / `summary` 中的字段 |
| `columns[].align` | string | `left`（默认）/ `center` / `right` |
| `rows` | array | 数据行 |
| `summary` | object | 合计行；无合计时不传 |
| `emptyText` | string | `rows` 为空时的占位文案，默认「暂无数据」 |

#### empty — 空状态

```json
{
  "blockKey": "bizSource",
  "label": "业务信息来源",
  "displayType": "empty",
  "emptyText": "暂无数据"
}
```

---

## 三、displayType 分发规则

| displayType | 适用场景 | 样式分支 |
| ----------- | -------- | -------- |
| `direct` | 文本 / 数值 / 枚举单值 | §4.2 键值对 |
| `person` | 人员参照 | §4.2 键值对（值格式特殊） |
| `longText` | 长文本说明 | §4.3 长文本 |
| `group` | 分组多字段区域 | §4.4 分组栅格 |
| `table` | 列表 / 明细 / 合计 | §4.5 表格 |
| `empty` | 无数据占位 | §4.6 空状态 |

---

## 四、统一样式规范

> 以下样式值对齐尽调评审系统报告 PDF 页面规范（见附图）。所有样式通过**内联 style** 输出，不依赖外部 CSS。

### 4.1 设计 Token

| Token | 值 | 用途 |
| ----- | -- | ---- |
| `--color-primary` | `#1677FF` | 分组标题、强调色 |
| `--color-title-bg` | `#E8F3FF` | 模块顶栏背景 |
| `--color-text` | `#1D2129` | 字段值 |
| `--color-label` | `#86909C` | 字段名 |
| `--color-border` | `#E5E6EB` | 表格边框、分隔线 |
| `--color-table-head-bg` | `#F7F8FA` | 表头背景 |
| `--color-table-summary-bg` | `#FAFBFC` | 合计行背景 |
| `--font-size-base` | `14px` | 正文 |
| `--font-size-module` | `16px` | 模块标题 |
| `--font-size-group` | `14px` | 分组标题 |
| `--line-height` | `22px` | 行高 |

### 4.2 模块容器

每个模块输出一个独立 `div`：

```html
<div class="report-module" data-module-key="project_base_info" style="margin-bottom: 24px;">
  <!-- 模块顶栏 -->
  <div style="background: #E8F3FF; padding: 10px 16px; font-size: 16px; font-weight: 600; color: #1D2129; border-radius: 4px 4px 0 0;">
    基本信息
  </div>
  <!-- 模块内容区 -->
  <div style="padding: 16px; border: 1px solid #E5E6EB; border-top: none; border-radius: 0 0 4px 4px;">
    <!-- blocks 渲染结果 -->
  </div>
</div>
```

- `data-module-key` 取 `moduleKey`，便于调试，PDF 中可保留或省略
- `moduleName` 渲染为顶栏文字，**不输出** `moduleKey`

### 4.3 键值对（direct / person）

单行结构：`字段名：字段值`，用于 `group.children` 内或独立 `direct` 块。

```html
<div style="display: flex; margin-bottom: 12px; font-size: 14px; line-height: 22px;">
  <span style="color: #86909C; white-space: nowrap; flex-shrink: 0;">客户名称：</span>
  <span style="color: #1D2129; font-weight: 500; word-break: break-all;">丹阳龙江钢铁有限公司</span>
</div>
```

**人员参照（person）值格式：**

| 条件 | 渲染值 |
| ---- | ------ |
| `name` 有值 + `workNo` 有值 | `姓名（工号）` |
| `name` 有值 + `workNo` 为空 | `姓名` |
| `name` 为空 | `—` |

**数值格式（L1 已格式化后传入，L2 原样展示）：**

| 类型 | 格式 |
| ---- | ---- |
| 金额 | 千分位 + 两位小数，如 `102,843,100.00` |
| 百分比 | 四位小数 + `%`，如 `2.8431%` |
| 容量 MW | 两位小数，如 `23.00` |
| 电价 元/度 | 四位小数，如 `0.6500` |

### 4.4 长文本（longText）

```html
<div style="margin-bottom: 16px;">
  <div style="color: #86909C; font-size: 14px; margin-bottom: 8px;">售后回租原因说明：</div>
  <div style="color: #1D2129; font-size: 14px; line-height: 22px; white-space: pre-wrap; word-break: break-all;">
    完整文本内容……
  </div>
</div>
```

### 4.5 分组栅格（group）

对应页面中「项目基本信息」「报价信息」「参考收益率」等蓝色圆点分组。

```html
<div style="margin-bottom: 20px;">
  <!-- 分组标题 -->
  <div style="display: flex; align-items: center; margin-bottom: 12px;">
    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #1677FF; margin-right: 8px;"></span>
    <span style="font-size: 14px; font-weight: 600; color: #1677FF;">项目基本信息</span>
  </div>
  <!-- 4 列栅格 -->
  <div style="display: flex; flex-wrap: wrap;">
    <!-- 每个 child 占 25% 宽度（columns=4 时） -->
    <div style="width: 25%; padding-right: 16px; box-sizing: border-box; margin-bottom: 12px;">
      <!-- direct / person 键值对结构 -->
    </div>
  </div>
</div>
```

**栅格列宽计算：**

| `columns` | 每项 `width` |
| --------- | ------------ |
| 4（默认） | `25%` |
| 3 | `33.33%` |
| 2 | `50%` |
| 1 | `100%` |

- `children` 按数组顺序从左到右、从上到下填充栅格
- `longText` 类型子项占满整行（`width: 100%`）

### 4.6 表格（table）

对应页面中项目备案明细表格（含序号列、合计行）。

```html
<div style="margin-bottom: 20px;">
  <!-- 表格标题（有 label 时展示） -->
  <div style="display: flex; align-items: center; margin-bottom: 12px;">
    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #1677FF; margin-right: 8px;"></span>
    <span style="font-size: 14px; font-weight: 600; color: #1677FF;">项目备案明细</span>
  </div>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <thead>
      <tr style="background: #F7F8FA;">
        <th style="padding: 10px 12px; border: 1px solid #E5E6EB; text-align: left; font-weight: 600; color: #1D2129;">序号</th>
        <th style="padding: 10px 12px; border: 1px solid #E5E6EB; text-align: left; font-weight: 600; color: #1D2129;">项目名称</th>
        <!-- 其余 columns -->
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 10px 12px; border: 1px solid #E5E6EB; color: #1D2129;">1</td>
        <td style="padding: 10px 12px; border: 1px solid #E5E6EB; color: #1D2129;">项目A</td>
      </tr>
      <!-- summary 行 -->
      <tr style="background: #FAFBFC;">
        <td style="padding: 10px 12px; border: 1px solid #E5E6EB; font-weight: 600; color: #1D2129;">合计 --</td>
        <td style="padding: 10px 12px; border: 1px solid #E5E6EB; color: #1D2129;">—</td>
        <td style="padding: 10px 12px; border: 1px solid #E5E6EB; color: #1D2129;">46.00</td>
      </tr>
    </tbody>
  </table>
</div>
```

**表格规则：**

| 规则 | 说明 |
| ---- | ---- |
| 结构 | 必须包含 `thead` + `tbody`，合计行放在 `tbody` 最后一行 |
| 序号列 | `showIndex: true` 时，首列为自增序号（从 1 开始） |
| 表头 | 取 `columns[].label`，**不输出** `columns[].key` |
| 数据行 | `rows` 中每个对象对应一行 `tr`，按 `columns[].key` 取值 |
| 合计行 | `summary` 存在时渲染；`summary.index` 默认为「合计 --」 |
| 空数据 | `rows` 为空时，不渲染 `table`，改为展示 `emptyText`（居中灰色文案） |
| 对齐 | 按 `columns[].align` 设置 `text-align`，默认左对齐 |
| 换行 | 单元格内容使用 `word-break: break-all`，长文本自动换行 |

### 4.7 空状态（empty）

```html
<div style="margin-bottom: 20px;">
  <div style="display: flex; align-items: center; margin-bottom: 12px;">
    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #1677FF; margin-right: 8px;"></span>
    <span style="font-size: 14px; font-weight: 600; color: #1677FF;">业务信息来源</span>
  </div>
  <div style="padding: 24px; text-align: center; color: #86909C; font-size: 14px; border: 1px dashed #E5E6EB; border-radius: 4px;">
    暂无数据
  </div>
</div>
```

---

## 五、渲染流程

```text
输入 JSON
  │
  ├─ 1. 读取 moduleName / moduleKey / blocks
  │
  ├─ 2. 输出模块容器 + 顶栏（§4.2）
  │
  ├─ 3. 遍历 blocks，按 displayType 分发：
  │     ├─ direct / person  → §4.3
  │     ├─ longText         → §4.4
  │     ├─ group            → §4.5（递归渲染 children）
  │     ├─ table            → §4.6
  │     └─ empty            → §4.7
  │
  └─ 4. 闭合模块容器，输出 HTML 片段
```

---

## 六、输出约束

1. **不修改数据**：L2 仅按 JSON 原样渲染，不做格式化计算（格式化由 L1 完成）
2. **空值统一**：字段值为空、`null`、空字符串时，统一渲染为「—」
3. **中文展示**：HTML 中只出现 `label` 和展示值，**不出现** `blockKey`、`moduleKey`、`columns[].key` 等英文字段名
4. **片段输出**：只输出 `div` / `p` / `table` / `thead` / `tbody` / `tr` / `th` / `td` / `span` 等语义标签，**不包含** `html` / `head` / `body`
5. **样式内联**：所有样式通过 `style` 属性控制，不使用外部 CSS 文件
6. **顺序保持**：`blocks` 和 `children` 按数组顺序渲染

---

## 七、完整示例

### 7.1 输入 JSON（项目基本信息 · 通用大单）

```json
{
  "moduleName": "基本信息",
  "moduleKey": "project_base_info",
  "blocks": [
    {
      "blockKey": "projectBaseInfo",
      "label": "项目基本信息",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "customerName", "label": "客户名称", "displayType": "direct", "value": "丹阳龙江钢铁有限公司" },
        { "blockKey": "leaseCategry", "label": "融资形式", "displayType": "direct", "value": "融资租赁" },
        { "blockKey": "capitalUse", "label": "资金用途", "displayType": "direct", "value": "购置本次租赁物" },
        { "blockKey": "deptName", "label": "业务部门", "displayType": "direct", "value": "产业金融事业部" },
        { "blockKey": "manager", "label": "项目经理", "displayType": "person", "name": "蒋忠宇", "workNo": "" },
        { "blockKey": "custHelp", "label": "项目协办人", "displayType": "person", "name": "张三", "workNo": "001234" },
        { "blockKey": "projectSource", "label": "项目来源", "displayType": "direct", "value": "自主营销" },
        { "blockKey": "isOnetoone", "label": "是否单个报价", "displayType": "direct", "value": "是" },
        { "blockKey": "isInsure", "label": "是否投保", "displayType": "direct", "value": "是" },
        { "blockKey": "greenIndustry", "label": "项目绿色投向", "displayType": "direct", "value": "—" },
        { "blockKey": "projectType", "label": "项目类型", "displayType": "direct", "value": "普通项目" },
        { "blockKey": "reviewDept", "label": "评审部门", "displayType": "direct", "value": "—" }
      ]
    },
    {
      "blockKey": "quoteInfo",
      "label": "报价信息",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "projectAmount", "label": "项目金额", "displayType": "direct", "value": "100,000,000.00" },
        { "blockKey": "equipmentTotalPrice", "label": "设备总价", "displayType": "direct", "value": "100,000,000.00" },
        { "blockKey": "leaseMethod", "label": "租赁方式", "displayType": "direct", "value": "直租" },
        { "blockKey": "leaseTerm", "label": "租赁期限(月)", "displayType": "direct", "value": "36" },
        { "blockKey": "quoteRate", "label": "报价利率", "displayType": "direct", "value": "3.8500%" },
        { "blockKey": "netFinanceCash", "label": "净融资额(元)", "displayType": "direct", "value": "95,000,000.00" },
        { "blockKey": "downPayment", "label": "首付款金额(元)", "displayType": "direct", "value": "5,000,000.00" },
        { "blockKey": "depositCash", "label": "保证金总额(元)", "displayType": "direct", "value": "4,750,000.00" },
        { "blockKey": "leaseCashSum", "label": "总租金(元)", "displayType": "direct", "value": "108,500,000.00" },
        { "blockKey": "leaseInterestSum", "label": "总利息(元)", "displayType": "direct", "value": "8,500,000.00" },
        { "blockKey": "planCashLoan", "label": "总本金(元)", "displayType": "direct", "value": "100,000,000.00" },
        { "blockKey": "srvfeeCashOut", "label": "服务费金额(元)", "displayType": "direct", "value": "500,000.00" },
        { "blockKey": "generalIrr", "label": "综合收益率", "displayType": "direct", "value": "2.8431%" },
        { "blockKey": "internalIrr", "label": "内部收益率", "displayType": "direct", "value": "2.6500%" }
      ]
    },
    {
      "blockKey": "referenceYield",
      "label": "参考收益率",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "projectIrr", "label": "计划合同IRR", "displayType": "direct", "value": "4.5000%" }
      ]
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
        { "key": "projectAddress", "label": "项目地址" }
      ],
      "rows": [
        {
          "projectName": "测试项目",
          "registeredCapacityMw": "23.00",
          "actualCapacityMw": "23.00",
          "operationMode": "全部上网",
          "roofEnterprise": "测试屋顶企业",
          "powerConsumingEnterprise": "测试用电企业",
          "selfConsumptionTariff": "0.6500",
          "consumptionRatio": "100.0000",
          "projectAddress": "江苏省南京市"
        }
      ],
      "summary": {
        "index": "合计 --",
        "registeredCapacityMw": "23.00",
        "actualCapacityMw": "23.00"
      },
      "emptyText": "暂无备案信息"
    }
  ]
}
```

### 7.2 对应页面结构（示意）

```text
┌─────────────────────────────────────────────┐
│  基本信息                          （蓝底顶栏）  │
├─────────────────────────────────────────────┤
│  ● 项目基本信息                               │
│  ┌──────────┬──────────┬──────────┬────────┐ │
│  │客户名称：  │融资形式：  │资金用途：  │业务部门： │ │
│  │丹阳龙江…  │融资租赁   │购置本次…  │产业金融… │ │
│  ├──────────┼──────────┼──────────┼────────┤ │
│  │项目经理：  │项目协办人： │项目来源：  │是否单个… │ │
│  │蒋忠宇     │张三(001…) │自主营销   │是       │ │
│  └──────────┴──────────┴──────────┴────────┘ │
│                                               │
│  ● 报价信息                                   │
│  ┌──────────┬──────────┬──────────┬────────┐ │
│  │项目金额：  │设备总价：  │租赁方式：  │租赁期限… │ │
│  │100,000…  │100,000…  │直租      │36       │ │
│  └──────────┴──────────┴──────────┴────────┘ │
│                                               │
│  ● 参考收益率                                 │
│  计划合同IRR：4.5000%                          │
│                                               │
│  ● 项目备案明细                               │
│  ┌────┬────────┬──────────┬──────────┬─────┐ │
│  │序号 │项目名称  │备案容量   │实际容量   │…    │ │
│  ├────┼────────┼──────────┼──────────┼─────┤ │
│  │ 1  │测试项目  │23.00     │23.00     │…    │ │
│  ├────┼────────┼──────────┼──────────┼─────┤ │
│  │合计--│—       │23.00     │23.00     │—    │ │
│  └────┴────────┴──────────┴──────────┴─────┘ │
└─────────────────────────────────────────────┘
```

---

## 八、displayType 速查

| displayType | 一句话 | 关键 HTML 结构 |
| ----------- | ------ | -------------- |
| `direct` | 字段名：字段值 | `span`(label) + `span`(value) |
| `person` | 字段名：姓名（工号） | 同 direct，值格式特殊 |
| `longText` | 字段名 + 换行全文 | `div`(label) + `div`(value, pre-wrap) |
| `group` | 蓝色圆点标题 + N 列栅格 | 标题 `div` + flex 栅格容器 |
| `table` | 标准表格 + 可选合计行 | `table` > `thead` + `tbody` |
| `empty` | 虚线框 + 居中占位文案 | 标题 + 居中 `div` |
