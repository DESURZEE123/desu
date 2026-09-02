# AI分析结果 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**14**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `analysisResults` 数组，按 `analysisType` 分组、映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、分组排序与 displayType 标注**，不做业务分析、不改写 AI 结论原文、不做 HTML 渲染。

> 当前 PDF **仅按小企业（`prjc-slb`）**输出；本模块字段结构固定，不做尽调系统分支判断。若入参无 `analysisResults` 或为空数组，整模块不输出。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `14` |
| `moduleKey` | `analysis_results` |
| `moduleName` | `AI分析结果` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `analysisResults[]` | 模块主数据：AI 分析结果列表 |
| `analysisResults[].analysisType` | 分析类型（分组标题，如「项目司法分析」「项目流水分析」） |
| `analysisResults[].customerName` | 客户名称（司法分析按客户分行；流水分析可为空） |
| `analysisResults[].customerNo` | 客户编号（仅数据匹配，**不输出到 HTML**） |
| `analysisResults[].analysisConclusion` | 分析结论（**Markdown 原文**，PDF 唯一展示内容） |
| `analysisResults[].analysisDetail` | 分析详情（**PDF 不展示**，L1 不提取、不输出） |
| `analysisResults[].taskStatus` | 任务状态（仅数据匹配，默认不输出） |
| `analysisResults[].pkAnalysisResult` | 结果主键（仅数据匹配，不输出） |

---

## 四、整合流程

```text
1. 读取 analysisResults；若 null / 非数组 / 长度为 0 → 整模块不输出
2. 按 analysisType 分组（见第五节固定顺序）
3. 组内按入参数组原始顺序保留条目
4. 组装 analysisList blocks（见第六节）
5. 对 conclusion 做空值规范化（见第七节），原文透传，不做 Markdown 改写
6. 输出 moduleIndex=14 的结构化 JSON → 交由 L2 渲染
```

---

## 五、分组与展示顺序

| 顺序 | analysisType | blockKey | 说明 |
| :--: | ------------ | -------- | ---- |
| 1 | `项目流水分析` | `cashflow_analysis` | 项目级；通常无 `customerName` |
| 2 | `项目司法分析` | `judicial_analysis` | 按客户分行；有 `customerName` 时展示实体标题 |

- 仅输出入参中**实际出现**的 `analysisType`；未出现的类型不输出空分组
- 若出现上表未列出的 `analysisType`：按首次出现顺序追加在固定类型之后，`label` 取 `analysisType` 原文，`blockKey` 取 `analysis_type_{序号}`

---

## 六、blocks 组装

每个 `analysisType` 输出 **1 个** `displayType: "analysisList"` block：

```json
{
  "blockKey": "judicial_analysis",
  "label": "项目司法分析",
  "displayType": "analysisList",
  "emptyText": "暂无分析结果",
  "items": [
    {
      "customerName": "肖令权",
      "conclusion": "## 模块七：综合评分与建议\n\n…"
    }
  ]
}
```

| 字段 | 类型 | 说明 |
| ---- | ---- | ---- |
| `label` | string | 取 `analysisType` 原文，作为分组标题 |
| `items[]` | array | 该类型下的分析结果，按入参顺序 |
| `items[].customerName` | string \| null | 有值则渲染蓝色实体标题；空 / null 不渲染标题行 |
| `items[].conclusion` | string | `analysisConclusion` 规范化后的 Markdown 原文 |
| `emptyText` | string | `items` 为空时占位（正常分组不会为空） |

> PDF 仅展示 `analysisConclusion`（映射为 `conclusion`）；`analysisDetail` **不进入 L1 输出**。

---

## 七、空值与占位规则

| 原值 | 规范化结果 | L2 表现 |
| ---- | ---------- | ------- |
| `null` / `undefined` / `""` | `null`（字段不传或传 null） | 结论区展示「—」 |
| `"{}"`（空 JSON 对象字符串） | `null` | 同上 |
| 仅空白字符 | `null` | 同上 |
| 其他字符串 | **原样透传**（保留 Markdown） | L2 按 Markdown 渲染为 HTML |

- `customerName` 为空时：不输出实体标题（流水分析场景）
- `conclusion` 为空：仍保留该 `item`，L2 展示「—」
- **禁止**将 Markdown 预渲染为 HTML 写入 JSON；HTML 转换仅在 L2 完成

---

## 八、字段映射总表

| 接口字段 | 展示名 / 用途 | 是否输出 | 备注 |
| -------- | ------------- | :------: | ---- |
| `analysisType` | 分组标题 | ✅ | block.label |
| `customerName` | 实体标题 | 条件 | 有值才展示 |
| `analysisConclusion` | （无独立标签） | ✅ | → `conclusion`，Markdown |
| `analysisDetail` | — | — | **不输出** |
| `customerNo` | — | — | 不输出 |
| `taskStatus` / `taskId` / 时间戳 / 主键 | — | — | 不输出 |

---

## 九、输出示例

### 9.1 输入（节选）

```json
{
  "analysisResults": [
    {
      "analysisType": "项目司法分析",
      "customerName": "苏州工业园区昌源工贸有限公司",
      "analysisConclusion": "{}",
      "analysisDetail": "{}"
    },
    {
      "analysisType": "项目流水分析",
      "customerName": null,
      "analysisConclusion": "**流水分析结论：** 该承租人仅提供…",
      "analysisDetail": "## 一、核心数据\n\n| 指标 | 数值 |"
    },
    {
      "analysisType": "项目司法分析",
      "customerName": "肖令权",
      "analysisConclusion": "## 模块七：综合评分与建议\n\n- **综合评分**：低风险\n…",
      "analysisDetail": "## 模块一：司法涉诉基础信息\n\n…"
    }
  ]
}
```

### 9.2 输出 JSON

```json
{
  "moduleIndex": 14,
  "moduleName": "AI分析结果",
  "moduleKey": "analysis_results",
  "blocks": [
    {
      "blockKey": "cashflow_analysis",
      "label": "项目流水分析",
      "displayType": "analysisList",
      "emptyText": "暂无分析结果",
      "items": [
        {
          "customerName": null,
          "conclusion": "**流水分析结论：** 该承租人仅提供…"
        }
      ]
    },
    {
      "blockKey": "judicial_analysis",
      "label": "项目司法分析",
      "displayType": "analysisList",
      "emptyText": "暂无分析结果",
      "items": [
        {
          "customerName": "苏州工业园区昌源工贸有限公司",
          "conclusion": null
        },
        {
          "customerName": "肖令权",
          "conclusion": "## 模块七：综合评分与建议\n\n- **综合评分**：低风险\n…"
        }
      ]
    }
  ]
}
```

---

## 十、与 L2 协作约定

1. 本模块唯一使用的展示类型：`analysisList`（结论由 L2 按 **Markdown** 渲染）
2. L1 **不**输出 `detail` / `html` 字段，不预转换 Markdown
3. L2 规则见 `prjc_style_render.md` → `analysisList` / Markdown 渲染章节
4. PDF 侧：**不输出**「查看详情」链接；**不展示** `analysisDetail`
