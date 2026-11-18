# json → HTML 尽调报告生成方法（Agent Playbook）

> 所属：`PRD/生成pdf报告/Tools`  
> 对齐：`小企业/00.prjc_integrate_report.md`（L0）→ L1 `prjc_integrate_*` → L2 `prjc_style_render`  
> 配套脚本：`assemble-html.py`（汇总）、`html-to-pdf.mjs`（转 PDF）  
> 扩展样式：`report-style.supplements.css`（L2 §4.2 尚未收录的 class）

本文件描述 **如何用尽调全量 JSON + 小企业 Skills 生成可预览 HTML**。  
业务映射由 Agent 按 L1 执行；样式与文档壳由 L2 / `assemble-html.py` 统一处理。

---

## 一、何时使用

用户出现以下意图时，**先读本文件再动手**：

- 「按小企业 skills 生成 html」
- 「用某某.json 出一份尽调报告 HTML」
- 「重新生成 / 刷新 pdf 报告预览」

输入通常为：

| 输入 | 路径约定 |
| ---- | -------- |
| 全量 JSON | `PRD/生成pdf报告/json数据/*.json` |
| Skills | `PRD/生成pdf报告/小企业/*.md` |
| 输出 HTML | `PRD/生成pdf报告/html/{自定义名}.html` |

---

## 二、总体流程（必须遵守）

```text
1. 准备输出目录 html/_fragments_{tag}/
2. 抽出样式（可选，assemble 也会做）
     python3 Tools/assemble-html.py --style-only --style-out <frag>/style.html
3. 并行生成模块片段（L1 映射 + L2 渲染）→ 写入 _fragments_*
4. 汇总完整文档
     python3 Tools/assemble-html.py --json <json> --fragments <frag> -o <html>
5. （可选）转 PDF
     node Tools/html-to-pdf.mjs <html> -o ../pdf/<name>.pdf
```

**原则：**

1. **职责分离**：L1 管「展示什么」，L2 管「怎么展示」，Tools 管「怎么汇总」
2. **不改业务数据**：缺失字段用「—」，不中断；禁止自行计算业务指标（除非 L1 明文要求格式化）
3. **禁止内联 `style=`**；片段内禁止再写 `<style>` / `<html>` / `<head>` / `<body>`
4. **跳过知识图谱**（moduleIndex=4）；附件模块按 `prjc_integrate_attachments.md`，默认不进主报告除非用户点名
5. 片段跳过时文件内容仅为：`<!-- SKIP -->`

---

## 三、目录与命名

```text
PRD/生成pdf报告/
├── 小企业/                          # L0 / L1 / L2 Skills（唯一业务规范源）
├── json数据/                        # 入参
├── html/
│   ├── _fragments_{tag}/            # 中间片段（可删可留）
│   │   ├── style.html               # 可选缓存
│   │   ├── 01_project_change.html
│   │   ├── 02_project_summary.html
│   │   ├── … 
│   │   └── 15_analysis_results.html
│   └── {用户指定名}.html            # 最终交付
└── Tools/
    ├── json-to-html.md              # 本方法
    ├── assemble-html.py
    ├── report-style.supplements.css
    └── html-to-pdf.mjs
```

片段文件名：`{两位 moduleIndex}_{moduleKey}.html`  
例如：`07_lease_property.html`。

`{tag}` 建议用日期或任务名，如 `_fragments_918`、`_fragments_leaseback`。

---

## 四、模块清单与数据根路径

| Index | moduleKey | L1 文档 | JSON 主路径（常见） |
| :---: | --------- | ------- | ------------------- |
| 1 | `project_change` | `1.prjc_integrate_project_change.md` | `projectChange`（仅审批变更/修改） |
| 2 | `project_summary` | `2.prjc_integrate_project_summary.md` | `labelInfo` |
| 3 | `cooperation_history` | `3.prjc_integrate_cooperation_history.md` | `commonCollaborationHistoryModel` |
| 4 | — | — | **PDF 不输出** |
| 5 | `project_base_info` | `5.prjc_integrate_project_base_info.md` | `projectBaseInfo` |
| 6 | `implementation_plan` | `6.prjc_integrate_implementation_plan.md` | `embodiment` |
| 7 | `lease_property` | `7.prjc_integrate_lease_property.md` | `lshldModel` + `projectBaseInfo` 形态判定 |
| 8 | `lessee_base_info` | `8.prjc_integrate_lessee_base_info.md` | `lesseeBaseInfo` |
| 9 | `related_enterprise` | `9.prjc_integrate_related_enterprise.md` | `associatedCompanyModule`（兼容文档中的 associateCompany） |
| 10 | `credit_enhancement` | `10.prjc_integrate_credit_enhancement.md` | `creditEnhancementMeasure` |
| 11 | `revenue_analysis` | `11.prjc_integrate_revenue_analysis.md` | `revenueAnalysis` |
| 12 | `liability_analysis` | `12.prjc_integrate_liability_analysis.md` | `liabilityAnalysis` |
| 13 | `key_indicators` | `13.prjc_integrate_key_indicators.md` | `keyIndicators` |
| 14 | `key_account_financials` | `14.prjc_integrate_key_account_financials.md` | `financialStatementsOfKeyAccounts` |
| 15 | `analysis_results` | `15.prjc_integrate_analysis_results.md` | `analysisResults` |

租赁物形态判定（L1 §3.1）：

| 形态 | 条件 |
| ---- | ---- |
| 直租 | `leaseMethod = 直租` |
| 直转回 | `leaseMethod = 回租` 且 `capitalUse ∈ {购置本次租赁物, 其他租赁物}` |
| 纯回租 | `leaseMethod = 回租` 且 `capitalUse = 补充流动资金` |

---

## 五、并行生成策略（推荐）

用 **4 组并行子 Agent**，每组读对应 L1 + 共用 L2，直接写 HTML 片段（或先出 L1 JSON 再按 L2 渲染，二选一，同一任务内保持一致）：

| 批次 | 模块 | 输出文件 |
| ---- | ---- | -------- |
| A | 1, 2, 3, 5 | `01` `02` `03` `05` |
| B | 6, 7, 8, 9 | `06` `07` `08` `09` |
| C | 10, 11, 12 | `10` `11` `12` |
| D | 13, 14, 15 | `13` `14` `15` |

### 子 Agent 固定约束（复制到 prompt）

```text
1. 严格按对应 L1 md 的字段、分支、blocks 顺序映射；空值 →「—」
2. 按 L2 prjc_style_render.md 的 displayType 渲染 HTML class
3. 模块外壳：
   <div class="report-module" data-module-key="{moduleKey}">
     <div class="report-module__header">{moduleName}</div>
     <div class="report-module__body">...</div>
   </div>
4. header 内直接写中文标题，不要再包 <span>
5. 禁止内联 style、禁止文档壳、禁止在片段写 <style>
6. labelPanel → report-label-panel / report-label-card--warning|negative
7. sectionHeading → report-section-heading（蓝竖条）；内容标题用圆点 report-section-title
8. table columns>8 → 叠行宽表；单元格若为 {value, cellType:highlight} 须解包
9. analysisList：conclusion 做 Markdown→.report-md；不展示 analysisDetail
10. 跳过模块只写 <!-- SKIP -->
11. 可写临时 Python 生成器，但最终必须落盘到指定 fragment 路径
```

### 参考 HTML

同场景历史文件（如 `html/大于500w区域线回租.html`）仅作 **class / 结构参考**，字段以当前 JSON + L1 为准，禁止整段盲拷过期数据。

---

## 六、汇总（L0 assemble）

```bash
cd PRD/生成pdf报告/Tools

python3 assemble-html.py \
  --json ../json数据/大于500w区域线回租.json \
  --fragments ../html/_fragments_918 \
  --output ../html/9.18大于500w区域线回租.html
```

脚本会：

1. 抽取 `小企业/prjc_style_render.md` §4.2 CSS  
2. 合并 `report-style.supplements.css`  
3. 按 moduleIndex 拼接非 SKIP 片段  
4. 规范化 header  
5. 写入 title：`{projectName}-尽调调查报告-{yyyyMMddHHmm}`  
6. 做基础体检（`[object Object]`、内联 style、重复 moduleKey）

仅刷新样式：

```bash
python3 assemble-html.py --style-only \
  --style-out ../html/_fragments_918/style.html
```

---

## 七、转 PDF（可选）

```bash
cd PRD/生成pdf报告/Tools
node html-to-pdf.mjs ../html/9.18大于500w区域线回租.html
# 或指定输出
node html-to-pdf.mjs ../html/9.18大于500w区域线回租.html -o ../pdf/9.18大于500w区域线回租.pdf
```

---

## 八、交付前检查清单

- [ ] 14 个已配置模块均有片段或显式 SKIP（无知识图谱）
- [ ] 无 `[object Object]`、无内联 `style=`
- [ ] `data-module-key` 与 L0 清单一致且无重复
- [ ] 纯回租 / 直租 / 直转回分支与 JSON 一致
- [ ] 实施方案租金/保证金/其他计划已全部展开（无 Tab）
- [ ] 租赁物行详情已全部展开（无折叠）
- [ ] AI 结论为 HTML（`.report-md`），非原始 Markdown 源码堆在页面上
- [ ] 若用到高亮单元格（`report-table__cell--highlight`），确认 `report-style.supplements.css` 已定义其样式（L2 §2.3 定义了 class 但 §4.2 未收录，须靠 supplements 兜底）
- [ ] **共用 html/ 目录时**：汇总前先 grep 公司实体名校验片段归属，确认 `_fragments_*` 装的是本项目数据，避免并行会话互相覆盖
- [ ] 文件名使用用户指定名称

---

## 九、与 Skills 的关系

| 层级 | 位置 | Tools 中的角色 |
| ---- | ---- | -------------- |
| L0 编排 | `小企业/00.prjc_integrate_report.md` | 本 playbook 执行其流程 |
| L1 映射 | `小企业/{n}.prjc_integrate_*.md` | Agent 必读，字段以它为准 |
| L2 样式 | `小企业/prjc_style_render.md` | class / displayType 唯一规范 |
| 汇总 | `Tools/assemble-html.py` | 确定性拼装，禁止手改壳 |
| PDF | `Tools/html-to-pdf.mjs` | 下游渲染 |

**Skills 更新后**：优先改 `小企业/`；若新增 displayType / class，同步更新 `prjc_style_render.md`，必要时把临时 class 补进 `report-style.supplements.css`，再考虑并回 L2 §4.2。
