# 报告自动生成 PDF 模块（prjc_integrate_report）

## 一、资源角色

本资源为 **L0 总体架构 / 下发控制**：接收用户直接传入的尽调项目全量参数（不走接口），判断模块范围，按约定顺序调度 L1 → L2，汇总 HTML 后交 PDF 生成服务。

**本层只做流程编排与资源下发**，不做数据整理、分析、计算或样式渲染。

### 分层职责

| 层级 | 资源 | 职责 |
| ---- | ---- | ---- |
| L0 | `prjc_integrate_report` | 判断范围、按序下发、汇总 HTML → PDF |
| L1 | `prjc_integrate_*` | 取参、字段映射、标注 `displayType` → 结构化 JSON |
| L2 | `prjc_style_render` | 按 `displayType` 渲染模块 HTML 片段 |

### 核心原则

1. **职责分离**：L0 管流程，L1 管「展示什么」，L2 管「怎么展示」
2. **数据直传**：全链路基于用户传入参数，不调用业务接口
3. **小企业专用**：仅按小企业（`prjc-slb`）输出，不做其他尽调系统分支
4. **不做加工**：不修改、不计算、不补充业务数据；缺失字段以「—」占位，**不中断**生成
5. **样式统一**：L1 只标注展示类型；HTML/CSS 由 L2 统一定义（见 `prjc_style_render`）

---

## 二、操作流程

1. **判断模块范围**  
   - 模块明确：仅生成指定模块  
   - 模块不明确：默认生成下表全部已配置模块  
   - 数据缺失：告知对应 L1 以「—」占位，不中断

2. **Step 1 · 下发 L1**  
   按 `moduleIndex` 升序调度各功能整合资源。各 L1 自行从总入参提取本模块字段，输出带 `displayType` 的结构化 JSON。字段范围与 blocks 规则见对应 L1 文档。

3. **Step 2 · 下发 L2**  
   将各模块结构化数据交 `prjc_style_render`，按 `displayType` 渲染 HTML。样式规则与 Schema 见该文档。

4. **汇总输出**  
   按 `moduleIndex` 升序拼接各模块 HTML 片段，交 PDF 生成服务。每个模块为独立容器（含标题与内容）；不输出完整文档壳（`html` / `head` / `body`）。

---

## 三、模块清单

对齐小企业页面 Tab 顺序。汇总时按 `moduleIndex` 升序拼接。

| 顺序moduleIndex | 模块 | 资源标识 | `moduleKey` | 状态 |
| :--: | ---- | -------- | ----------- | ---- |
| 1 | 项目变更信息 | `prjc_integrate_project_change` | `project_change` | 已编写 |
| 2 | 项目概要 | `prjc_integrate_project_summary` | `project_summary` | 已编写 |
| 3 | 合作历史 | `prjc_integrate_cooperation_history` | `cooperation_history` | 已编写 |
| 4 | 知识图谱 | `prjc_integrate_knowledge_graph` | `knowledge_graph` | 待编写（PDF 不输出交互图谱） |
| 5 | 基本信息 | `prjc_integrate_project_base_info` | `project_base_info` | 已编写 |
| 6 | 实施方案 | `prjc_integrate_implementation_plan` | `implementation_plan` | 已编写 |
| 7 | 租赁物信息 | `prjc_integrate_lease_property` | `lease_property` | 已编写 |
| 8 | 承租人基本信息 | `prjc_integrate_lessee_base_info` | `lessee_base_info` | 已编写 |
| 9 | 关联企业信息 | `prjc_integrate_related_enterprise` | `related_enterprise` | 已编写 |
| 10 | 增信措施 | `prjc_integrate_credit_enhancement` | `credit_enhancement` | 已编写 |
| 11 | 经营数据分析 | `prjc_integrate_revenue_analysis` | `revenue_analysis` | 已编写 |
| 12 | 刚性负债分析 | `prjc_integrate_liability_analysis` | `liability_analysis` | 已编写 |
| 13 | 重点指标 | `prjc_integrate_key_indicators` | `key_indicators` | 已编写 |
| 14 | 重点科目财务报表 | `prjc_integrate_key_account_financials` | `key_account_financials` | 已编写 |
| 15 | AI分析结果 | `prjc_integrate_analysis_results` | `analysis_results` | 已编写 |

L2 样式资源：`prjc_style_render`（已编写）。L1 → L2 数据结构约定见该文档。
