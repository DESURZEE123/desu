# 承租人基本信息 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**9**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> 业务对照：`尽调系统/项目审批/承租人基本信息.md`  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `lesseeBaseInfo.companyPublicInfo`，按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不调用法人客户 / 司法涉诉接口、不做 HTML 渲染。

页面为「基本信息 + 行业许可证 + 主营业务 + 公司沿革 + 股权结构 + 实控人介绍 + 司法诉讼总览 + 司法诉讼说明」；PDF **按顺序全部展开**（无编辑按钮 / 更新司法涉诉数据等交互）。

> 若 `lesseeBaseInfo` 或 `companyPublicInfo` 为 null / 缺失，整模块不输出。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `9` |
| `moduleKey` | `lessee_base_info` |
| `moduleName` | `承租人基本信息` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `lesseeBaseInfo.companyPublicInfo` | 模块主数据对象 |
| `lesseeBaseInfo.companyPublicInfo.baseInfo` | 基本信息 |
| `lesseeBaseInfo.companyPublicInfo.industryLicenseList[]` | 行业许可证 |
| `lesseeBaseInfo.companyPublicInfo.shareholderList[]` | 股权结构明细 |
| `lesseeBaseInfo.companyPublicInfo.shareholderTotal` | 股权结构合计 |
| `lesseeBaseInfo.companyPublicInfo.controllerIntroduction` | 实控人及股东情况介绍 |
| `lesseeBaseInfo.companyPublicInfo.judicialLitigationInfo` | 司法诉讼总览 |
| `lesseeBaseInfo.companyPublicInfo.judicialLitigationInfo.caseTypeHighRiskList[]` | 高风险案件标签 |
| `lesseeBaseInfo.companyPublicInfo.judicialLitigationInfo.caseTypeCommonList[]` | 普通案件标签 |
| `lesseeBaseInfo.companyPublicInfo.judicialLitigationInfo.judicialLitigationInfoDesc` | 司法诉讼信息说明 |
| `lesseeBaseInfo.companyPublicInfo.judicialLitigationInfo.updateTime` | 司法诉讼数据更新时间 |

**PDF 不提取 / 不输出：**

| 字段 / 区块 | 原因 |
| ----------- | ---- |
| `pkCompanyPublicInfo` / 各类主键 | 仅数据匹配 |
| `customerNo` / `customerType[]` | 页面不展示 |
| `personActControlList` / `serviceInformAdress` 等 | 小企业页面不展示 |
| `assetSize` / `financialAnalysisList` / `loan` 等 | 属其他子模块，本模块截图范围外 |
| `collaborationHistoryModel` | 承租人页内嵌合作历史，PDF 已由模块 2 独立输出 |
| 「更新司法涉诉数据」按钮 | 页面操作 |

---

## 四、整合流程

```text
1. 若 lesseeBaseInfo.companyPublicInfo 为 null / 缺失：整模块不输出
2. 输出「基本信息」group（4 列栅格，注册地址整行）
3. 输出「行业许可证」table
4. 输出「主营业务」「公司沿革」longText（有值时）
5. 输出「股权结构」table + 合计行
6. 输出「实控人及股东情况介绍」longText（有值时）
7. 输出「司法诉讼信息」litigationCards（caseNum=0 的标签不展示）
8. 输出「司法诉讼信息说明」longText（有值时）
9. 空值规范化为「—」；数值原样透传
10. 输出 moduleIndex=9 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

- 各表 `null` / `[]`：仍输出对应 `table` block，走 `emptyText`
- 各说明类长文本为空：不输出该 `longText` block
- 司法标签：`caseNum === 0` 或缺失时不输出该卡片（对齐业务 PRD）
- 高风险标签（`caseTypeHighRiskList`）→ `tone: highRisk`（红底卡片）
- 普通标签（`caseTypeCommonList`）→ `tone: common`（蓝底卡片）
- 「更新司法涉诉数据」：PDF **不输出**

---

## 六、blocks 组装顺序

| 顺序 | blockKey | label | displayType | 说明 |
| :--: | -------- | ----- | ----------- | ---- |
| 1 | `baseInfo` | `基本信息` | `group` | 4 列；注册地址 `fullWidth: true` |
| 2 | `industryLicenseList` | `行业许可证` | `table` | 序号 + 证件名称 + 编号 + 期限 |
| 3 | `mainBusiness` | `主营业务` | `longText` | 有值时 |
| 4 | `companyEvolution` | `公司沿革` | `longText` | 有值时 |
| 5 | `shareholderList` | `股权结构` | `table` | 含合计行 |
| 6 | `controllerIntroduction` | `实控人及股东情况介绍` | `longText` | 有值时 |
| 7 | `judicialLitigationInfo` | `司法诉讼信息` | `litigationCards` | 含 `updateTime` |
| 8 | `judicialLitigationInfoDesc` | `司法诉讼信息说明` | `longText` | 有值时 |

---

## 七、字段映射与 displayType 规则

### 7.1 基本信息（group · columns: 4）

**blockKey：** `baseInfo`  
**数据来源：** `companyPublicInfo.baseInfo`

| 顺序 | label | 接口字段 | 说明 |
| :--: | ----- | -------- | ---- |
| 1 | 企业名称 | `customerName` | |
| 2 | 统一社会信用代码 | `crdntlsCode` | |
| 3 | 法定代表人 | `legalRepresentativeCustomerName` | |
| 4 | 实际控制人 | `actControlsName` | |
| 5 | 成立时间 | `estblshDate` | |
| 6 | 注册资本(万元) | `rgstrdCapital` | 千分位格式化 |
| 7 | 行业小类 | `pkIndustrySortLittle.name` | 对象取 `name` |
| 8 | 从业人数 | `employeeNum` | |
| 9 | 注册地址 | `rgstrdAddress` | `fullWidth: true` |

### 7.2 行业许可证（table）

**blockKey：** `industryLicenseList`  
**showIndex：** `true`  
**emptyText：** `暂无行业许可证数据`

| 顺序 | 列 label | key |
| :--: | -------- | --- |
| 1 | 证件名称 | `specCrdntlsName` |
| 2 | 编号 | `specCrdntlsCode` |
| 3 | 期限 | `expirationDate` |

### 7.3 股权结构（table）

**blockKey：** `shareholderList`  
**showIndex：** `true`  
**emptyText：** `暂无股权结构数据`

| 顺序 | 列 label | key |
| :--: | -------- | --- |
| 1 | 股东名称 | `shareholderName` |
| 2 | 出资额(万元) | `shareholderCapitalAmount` |
| 3 | 占比(%) | `holdStockRatio` |

**合计行（summary）：** 取自 `shareholderTotal`；`shareholderName` 列展示 `合计`。

### 7.4 司法诉讼信息（litigationCards）

**blockKey：** `judicialLitigationInfo`  
**displayType：** `litigationCards`（L2 扩展 · mock-to-html 已实现）

| 属性 | 说明 |
| ---- | ---- |
| `updateTime` | `judicialLitigationInfo.updateTime`；展示为「司法诉讼数据更新时间：{time}」 |
| `cards[]` | 先 `caseTypeHighRiskList`，再 `caseTypeCommonList`；过滤 `caseNum <= 0` |
| `cards[].caseType` | 案件类型标签名 |
| `cards[].caseNum` | 案件数量（卡片右上角） |
| `cards[].tone` | `highRisk` / `common` |
| `emptyText` | `客户暂无司法诉讼数据` |

---

## 八、司法诉讼卡片样式（L2 扩展 · mock-to-html 已实现）

| tone | 说明 |
| ---- | ---- |
| `highRisk` | 红渐变底；被执行人、强制清算与破产案件、限制高消费等 |
| `common` | 蓝渐变底；民事案件、执行案件等 |

布局：3 列网格，卡片右上角展示数量，居中展示案件类型名称。正式 L2 扩展见后续 `prjc_style_render` 迭代，当前由 `mock-to-html.mjs` 内联 CSS 支持。

---

## 九、完整 JSON 示例（节选）

```json
{
  "moduleIndex": 9,
  "moduleName": "承租人基本信息",
  "moduleKey": "lessee_base_info",
  "blocks": [
    {
      "blockKey": "baseInfo",
      "label": "基本信息",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "customerName", "label": "企业名称", "displayType": "direct", "value": "昆山东卓精密电子科技有限公司" }
      ]
    },
    {
      "blockKey": "judicialLitigationInfo",
      "label": "司法诉讼信息",
      "displayType": "litigationCards",
      "updateTime": "2026-06-02 09:53:30",
      "cards": [
        { "caseType": "被执行人", "caseNum": 80, "tone": "highRisk" },
        { "caseType": "民事案件", "caseNum": 105, "tone": "common" }
      ],
      "emptyText": "客户暂无司法诉讼数据"
    }
  ]
}
```
