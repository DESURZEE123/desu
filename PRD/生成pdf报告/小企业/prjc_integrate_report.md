# 报告自动生成 PDF 模块（prjc_integrate_report）

## 一、总体架构

### 资源角色

本资源为**总体架构 / 下发控制资源**，负责接收用户直接传入的尽调项目数据参数（不走接口），判断数据完整性与模块范围，按约定顺序调度下层资源完成报告生成，最终将 HTML 片段交由 PDF 生成服务输出尽调报告 PDF。

AI 在本层**仅负责流程编排与资源下发**，不做数据整理、分析、计算或样式渲染。

### 架构分层

```text
prjc_integrate_report（总体架构资源 · 下发控制）
│
├─ Step 1 · 功能整合 （按模块，同级并行资源）
│    ├─ 项目概要 · 功能整合资源（prjc_integrate_project_summary）
│    ├─ 合作历史 · 功能整合资源（prjc_integrate_cooperation_history）
│    ├─ 知识图谱 · 功能整合资源（prjc_integrate_knowledge_graph）— 待编写
│    ├─ 项目基本信息 · 功能整合资源（prjc_integrate_project_base_info）
│    ├─ 实施方案 · 功能整合资源（prjc_integrate_implementation_plan）
│    ├─ 租赁物信息 · 功能整合资源（prjc_integrate_lease_property）
│    ├─ 承租人基本信息 · 功能整合资源（prjc_integrate_lessee_base_info）
│    ├─ 关联企业信息 · 功能整合资源（prjc_integrate_related_enterprise）
│    ├─ 增信措施 · 功能整合资源（prjc_integrate_credit_enhancement）
│    ├─ 经营数据分析 · 功能整合资源（prjc_integrate_revenue_analysis）
│    ├─ 刚性负债分析 · 功能整合资源（prjc_integrate_liability_analysis）
│    ├─ 重点指标 · 功能整合资源（prjc_integrate_key_indicators）
│    ├─ 重点科目财务报表 · 功能整合资源（prjc_integrate_key_account_financials）
│    ├─ AI分析结果 · 功能整合资源（prjc_integrate_analysis_results）
│    └─ 附件信息 · 功能整合资源（prjc_integrate_attachments）
│
└─ Step 2 · 统一规范样式
     ├─ 直接展示
     ├─ 表格展示
     └─ …（后续扩展展示类型）
```

| 层级 | 资源类型 | 职责 | 输入 | 输出 |
| ---- | -------- | ---- | ---- | ---- |
| L0 | **总体架构资源** | 判断范围、下发调度、汇总 HTML | 用户传入的尽调项目全量参数 | 完整 HTML 片段 → PDF 服务 |
| L1 | **功能整合资源** | 按模块取参、字段映射、标注展示类型 | 模块对应入参数据 | 带展示类型标注的结构化展示数据 |
| L2 | **样式资源** | 按标注类型与固定样式规则渲染 HTML | L1 输出的结构化展示数据 | 模块 HTML 片段 |

### 核心原则

1. **职责分离**：L0 管流程，L1 管「展示什么」，L2 管「怎么展示」
2. **数据直传**：全链路基于用户传入参数，不调用业务接口
3. **小企业专用**：当前 PDF 仅按小企业（`prjc-slb`）页面输出，不做其他尽调系统分支判断
4. **不做加工**：各层均不修改、不计算、不补充业务数据；缺失字段以「—」占位
5. **样式统一**：L1 只输出展示类型标注，具体 HTML/CSS 由 L2 统一定义

---

## 二、总体操作流程

### 一、判断数据完整性与模块范围

首先判断用户传入的参数是否包含生成报告所需的完整数据，以及需要生成哪些模块：

1. 若数据完整且模块明确，进入 Step 1，按模块依次下发对应功能整合资源；
2. 若数据缺失，记录缺失字段，下发时告知各模块资源以「—」占位，**不中断**生成流程；
3. 若模块范围不明确，默认生成所有已配置模块（按小企业页面 Tab 顺序，当前已实现 9 个，见下表）。

### 二、Step 1 · 下发功能整合资源

针对每个待生成模块，下发对应的**功能整合资源**（同级 L1，按 `moduleIndex` 顺序调度）：

1. 各模块资源从总入参中**自行提取**本模块所需字段；
2. 按**小企业（`prjc-slb`）**页面字段范围与展示顺序输出，不做其他尽调系统分支判断；
3. 将字段映射为中文展示名称，并为每条展示项标注**展示类型**（如：直接展示、表格展示等）；
4. 输出本模块的结构化展示数据，交由 Step 2 处理。

> 当前 PDF 报告**仅支持小企业**；各模块字段范围与 blocks 组装规则见对应 L1 资源文档。

**当前模块规划（对齐小企业页面 Tab 顺序）：**

| 顺序 | 模块 | 资源名称 | 标识 | `moduleKey` | 状态 |
| :--: | ---- | -------- | ---- | ----------- | ---- |
| 1 | 项目概要 | 项目概要 · 功能整合 | `prjc_integrate_project_summary` | `project_summary` | 已编写 |
| 2 | 合作历史 | 合作历史 · 功能整合 | `prjc_integrate_cooperation_history` | `cooperation_history` | 已编写 |
| 3 | 知识图谱 | 知识图谱 · 功能整合 | `prjc_integrate_knowledge_graph` | `knowledge_graph` | 待编写（PDF 不输出交互图谱） |
| 4 | 项目基本信息 | 项目基本信息 · 功能整合 | `prjc_integrate_project_base_info` | `project_base_info` | 已编写 |
| 5 | 实施方案 | 实施方案 · 功能整合 | `prjc_integrate_implementation_plan` | `implementation_plan` | 已编写 |
| 6 | 租赁物信息 | 租赁物信息 · 功能整合 | `prjc_integrate_lease_property` | `lease_property` | 已编写 |
| 7 | 承租人基本信息 | 承租人基本信息 · 功能整合 | `prjc_integrate_lessee_base_info` | `lessee_base_info` | 已编写 |
| 8 | 关联企业信息 | 关联企业信息 · 功能整合 | `prjc_integrate_related_enterprise` | `related_enterprise` | 已编写 |
| 9 | 增信措施 | 增信措施 · 功能整合 | `prjc_integrate_credit_enhancement` | `credit_enhancement` | 已编写 |
| 10 | 经营数据分析 | 经营数据分析 · 功能整合 | `prjc_integrate_revenue_analysis` | `revenue_analysis` | 已编写 |
| 11 | 刚性负债分析 | 刚性负债分析 · 功能整合 | `prjc_integrate_liability_analysis` | `liability_analysis` | 已编写 |
| 12 | 重点指标 | 重点指标 · 功能整合 | `prjc_integrate_key_indicators` | `key_indicators` | 已编写 |
| 13 | 重点科目财务报表 | 重点科目财务报表 · 功能整合 | `prjc_integrate_key_account_financials` | `key_account_financials` | 已编写 |
| 14 | AI分析结果 | AI分析结果 · 功能整合 | `prjc_integrate_analysis_results` | `analysis_results` | 已编写 |
| 15 | 附件信息 | 附件信息 · 功能整合 | `prjc_integrate_attachments` | `attachments` | 已编写 |

> 汇总 HTML 时按 `moduleIndex` 升序拼接各模块片段。

### 三、Step 2 · 下发样式资源

接收 Step 1 各模块输出的结构化展示数据，按每条数据的**展示类型标注**，下发对应样式资源渲染 HTML：

1. **直接展示**：键值对、人员参照、长文本、子对象分组等 → 走统一直接展示样式；
2. **表格展示**：列表数组、明细行、汇总行等 → 走统一表格展示样式；
3. 其他展示类型后续扩展，样式资源同步扩展。

> 展示类型的具体样式规则（标签结构、固定 CSS class、空值处理等）在**样式资源**中统一定义（`prjc_style_render`）。

### 四、汇总输出 HTML 片段

综合各模块 HTML 片段，输出标准 HTML：

1. 每个模块输出为独立的 `div` 容器，包含模块标题和内容；
2. 使用语义化标签（`div`、`p`、`table`、`thead`、`tbody`、`tr`、`td`、`ul`、`li` 等），**不包含** `html` / `head` / `body` 等完整文档标签；
3. 样式通过 §4.2 固定 `<style>` 块 + `class` 控制，不使用内联 `style`，不依赖外部 CSS 文件；
4. 字段名使用中文展示名称，接口英文字段名仅用于 L1 数据匹配，**不输出到 HTML**；
5. 所有字段值为空时统一展示「—」，不输出 `null` 或空字符串；
6. 按 Step 1 模块顺序拼接后，交由 PDF 生成服务转换为最终 PDF 文件。

---

## 三、资源管理

| 资源名称 | 标识 | 层级 | 状态 |
| -------- | ---- | ---- | ---- |
| 报告自动生成 PDF 模块（总体架构 / 下发控制） | `prjc_integrate_report` | L0 | 已编写 |
| 项目概要 · 功能整合 | `prjc_integrate_project_summary` | L1 | 已编写 |
| 合作历史 · 功能整合 | `prjc_integrate_cooperation_history` | L1 | 已编写 |
| 知识图谱 · 功能整合 | `prjc_integrate_knowledge_graph` | L1 | 待编写 |
| 项目基本信息 · 功能整合 | `prjc_integrate_project_base_info` | L1 | 已编写 |
| 实施方案 · 功能整合 | `prjc_integrate_implementation_plan` | L1 | 已编写 |
| 租赁物信息 · 功能整合 | `prjc_integrate_lease_property` | L1 | 已编写 |
| 承租人基本信息 · 功能整合 | `prjc_integrate_lessee_base_info` | L1 | 已编写 |
| 关联企业信息 · 功能整合 | `prjc_integrate_related_enterprise` | L1 | 已编写 |
| 增信措施 · 功能整合 | `prjc_integrate_credit_enhancement` | L1 | 已编写 |
| 经营数据分析 · 功能整合 | `prjc_integrate_revenue_analysis` | L1 | 已编写 |
| 刚性负债分析 · 功能整合 | `prjc_integrate_liability_analysis` | L1 | 已编写 |
| 重点指标 · 功能整合 | `prjc_integrate_key_indicators` | L1 | 已编写 |
| 重点科目财务报表 · 功能整合 | `prjc_integrate_key_account_financials` | L1 | 已编写 |
| AI分析结果 · 功能整合 | `prjc_integrate_analysis_results` | L1 | 已编写 |
| 附件信息 · 功能整合 | `prjc_integrate_attachments` | L1 | 已编写 |
| 统一规范样式 | `prjc_style_render` | L2 | 已编写 |

---

## 四、L1 → L2 数据传递约定

Step 1 功能整合资源输出给 Step 2 样式资源的结构化数据格式，详见统一规范样式。

```json
{
  "moduleIndex": 1,
  "moduleName": "模块中文名称",
  "moduleKey": "module_key",
  "blocks": [
    {
      "blockKey": "字段或数据块标识",
      "label": "中文展示名称",
      "displayType": "direct | person | longText | group | table | empty",
      "value": "直接展示的值"
    }
  ]
}
```

- `moduleIndex`：供 L0 按数字升序排序拼接
- `displayType`：展示类型标注，决定 L2 走哪个样式分支
- L1 只负责填充业务语义与展示类型，**不包含 HTML 标签**
- L2 根据 `displayType` 选择固定样式模板，生成 HTML 片段
