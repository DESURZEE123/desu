# 尽调报告总体架构与模块清单（L0）

> 本文件是技能的**总控说明**，不是某个模块的规格。它定义三件事：
> ① 分层职责 ② 章节顺序表（moduleIndex / moduleKey / moduleName）③ 取数路径校正表。
> 各模块的字段级规格在 `reference/<module>.md`；样式 schema 在 `reference/style_render.md`。

---

## 一、分层职责

| 层级 | 职责 |
| ---- | ---- |
| L1 | 取参、字段映射、标注 displayType → block JSON（**就是你写 builder 做的事**） |
| L2 | 按 displayType 渲染模块 HTML 片段（**已由 ddr_engine 固化，你不碰**） |

核心原则：
1. **职责分离**：你只管「展示什么」（L1），「怎么展示」（L2 样式）已固化。
2. **数据直传**：全链路基于 input.json，不调接口。
3. **不做加工**：不修改、不计算业务数据（合计/求和等规格明确要求的除外）；
   缺失字段以「—」占位，**不中断**生成。
4. **样式统一**：你只标注 displayType；HTML/CSS 由 ddr_engine 统一定义。

---

## 二、章节顺序表（权威）

报告章节顺序 = 下表 `moduleIndex` 升序。`build_report.py` 按各 builder 的
`MODULE_INDEX` 自动排序，**你不需要管拼接**。写 builder 时：
`MODULE_INDEX` / `MODULE_KEY` / `MODULE_TITLE` 三个常量直接抄本表对应行。

| moduleIndex | moduleName（MODULE_TITLE） | moduleKey（MODULE_KEY） | reference 文件 | 取数根（SOURCE） |
| :--: | ---- | ---- | ---- | ---- |
| 1 | 合作历史 | `cooperation_history` | `cooperation_history.md` | `commonCollaborationHistoryModel` |
| 2 | 项目基本信息 | `base_info` | `base_info.md` | `projectBaseInfo` |
| 3 | 实施方案 | `implementation_plan` | `implementation_plan.md` | `embodiment` |
| 4 | 租赁物信息 | `lease_property` | `lease_property.md` | `lshldModel` |
| 5 | 承租人基本信息 | `lessee_base_info` | `lessee_base_info.md` | `lesseeBaseInfo` |
| 6 | 关联企业信息 | `related_enterprise` | `related_enterprise.md` | `associatedCompanyModule` |
| 7 | 增信措施 | `credit_enhancement` | `credit_enhancement.md` | `creditEnhancementMeasure` |
| 8 | 经营数据分析 | `revenue_analysis` | `revenue_analysis.md` | `cppRevenueAnalysis` |
| 9 | 刚性负债分析 | `liability_analysis` | `liability_analysis.md` | `liabilityAnalysis` |

> moduleKey 仅用于模块外壳的 `data-module-key` 标识与排序日志，不影响渲染内容；
> 但仍按本表填写，保持一致。

---

## 三、取数路径校正表（权威，**优先级高于各模块 reference 正文**）

各模块 `reference/<module>.md` 正文里的 `$.xxx` 路径，是上游编写规格时的口径，
与当前 `input.json` 实际结构存在若干偏差。**当正文路径与本表冲突时，一律以本表为准**
（input.json 是真实数据契约）。下表只列「正文写了但 input.json 里不是这样」的项；
未列出的路径按正文即可。

| 模块 | reference 正文路径 | 实际路径（以此为准） | 说明 |
| ---- | ---- | ---- | ---- |
| related_enterprise | `$.associateCompany` 及其全部子路径 | `$.associatedCompanyModule` | 仅**根键名**不同，子结构（associatedCompanySynopsisList / associatedCompanyList）完全一致；正文里所有 `$.associateCompany.X` 一律替换为 `$.associatedCompanyModule.X` |
| base_info | `$.companyBaseInfo` / `$.siteSituationList` / `$.settleBeLeaseContList` / `$.environmentAndSocialRisk` / `$.projectType` / `$.oldContInfoList` / `$.projectSource` / `$.capitalUse` / `$.leasebackReason` / `$.leasebackExplain` / `$.insuranceSituation` / `$.managerName` / `$.custHelpName` / `$.leaseInsurance` | 全部在 `$.projectBaseInfo.` 下（即 SOURCE=`projectBaseInfo`，正文路径都是相对该根的子路径） | `customerName` 顶层与 projectBaseInfo 下都有，取 `projectBaseInfo.customerName` 即可 |
| implementation_plan | 增信措施取 `$.commonCreditEnhancementMeasure.creditEnhancementMeasureList` | 按 reference「字段解析要求」的**优先级链**：①`embodiment.creditEnhancementMeasureInfo.creditEnhancementMeasureList`（与报价 quotName 匹配）②`creditEnhancementMeasure.creditEnhancementMeasureInfo.creditEnhancementMeasureList` | input.json 无 `commonCreditEnhancementMeasure` 这个根；报价主数据在 `embodiment.advertisingInfoList[]` |
| lease_property | `$.lshldModel.lshldInfoList[].dprctnAmt`（折价） | input.json 中**无 dprctnAmt 字段** | 折价(元) = `originalValue - netWorth`（§八「折价/原值-净值」口径）；B 形态详情若两值齐全则相减，否则填「—」 |

> 写 builder 前，**先用 §三 的 SOURCE 探查 input.json 对应子树的结构骨架**
> （见 SKILL.md「探查数据结构」），确认字段真实存在再映射；不要把整段 JSON 读进上下文。

---

## 四、报告标题（`<title>`）规则

由 `html_template.build_title()` 自动拼接，**你不需要在任何 builder 里处理标题**：
- 数据路径：`headInfo.projectName`
- 有值：`{projectName}-尽调调查报告-{yyyyMMddHHmm}`
- 缺失：`尽调调查报告-{yyyyMMddHHmm}`
