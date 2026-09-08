# 承租人基本信息 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**8**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
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
| `moduleIndex` | `8` |
| `moduleKey` | `lessee_base_info` |
| `moduleName` | `承租人基本信息` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `lesseeBaseInfo.companyPublicInfo` | 模块主数据对象 |
| `lesseeBaseInfo.companyPublicInfo.baseInfo` | 基本信息 |
| `lesseeBaseInfo.companyPublicInfo.baseInfo.mainBusiness` | 主营业务 |
| `lesseeBaseInfo.companyPublicInfo.baseInfo.companyEvolution` | 公司沿革 |
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
2. 输出「基本信息」大区标题 sectionHeading（蓝竖条）
3. 输出「基本信息」group（4 列栅格，注册地址整行；**不传 label**，避免与大区标题重复）
4. 输出「行业许可证」table（圆点小标题保留）
5. 输出「主营业务」「公司沿革」longText（有值时；小标题不动）
6. 输出「股权结构」table + 合计行（圆点小标题保留）
7. 输出「实控人及股东情况介绍」longText（有值时；小标题不动）
8. 输出「司法诉讼信息」大区标题 sectionHeading（蓝竖条）
9. 输出诉讼卡片 litigationCards（**不传 label**；caseNum=0 的标签不展示）
10. 输出「司法诉讼信息说明」longText（有值时；圆点小标题保留）
11. 空值规范化为「—」；数值原样透传
12. 输出 moduleIndex=8 的结构化 JSON → 交由 L2 渲染
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
| 1 | `baseInfoTitle` | `基本信息` | `sectionHeading` | 大区仅标题（蓝竖条）；覆盖其下字段栅格 / 行业许可证 / 股权结构等 |
| 2 | `baseInfo` | 基本信息 | `group` | 4 列；注册地址 `fullWidth` |
| 3 | `industryLicenseList` | `行业许可证` | `table` | 圆点小标题保留 |
| 4 | `mainBusiness` | `主营业务` | `longText` | 有值时；小标题不动 |
| 5 | `companyEvolution` | `公司沿革` | `longText` | 有值时；小标题不动 |
| 6 | `shareholderList` | `股权结构` | `table` | 圆点小标题保留；含合计行 |
| 7 | `controllerIntroduction` | `实控人及股东情况介绍` | `longText` | 有值时；小标题不动 |
| 8 | `judicialLitigationTitle` | `司法诉讼信息` | `sectionHeading` | 大区仅标题（蓝竖条） |
| 9 | `judicialLitigationInfo` | （不传 label） | `litigationCards` | 含 `updateTime`；标题已由上一项 sectionHeading 承担 |
| 10 | `judicialLitigationInfoDesc` | `司法诉讼信息说明` | `longText` | 有值时；小标题不动 |

> **标题层级：** 「基本信息」「司法诉讼信息」用 `sectionHeading`（蓝竖条）作大标题；其下原内容标题若与大标题同名则不再传 `label`。其余圆点小标题（行业许可证 / 股权结构 / 主营业务等）保持不变。

---

## 七、字段映射与 displayType 规则

### 7.0 大区标题（sectionHeading）

| blockKey | label | 说明 |
| -------- | ----- | ---- |
| `baseInfoTitle` | `基本信息` | 置于 `baseInfo` 之前；蓝竖条大标题 |
| `judicialLitigationTitle` | `司法诉讼信息` | 置于 `judicialLitigationInfo` 之前；蓝竖条大标题 |

```json
{ "blockKey": "baseInfoTitle", "label": "基本信息", "displayType": "sectionHeading" }
```

```json
{ "blockKey": "judicialLitigationTitle", "label": "司法诉讼信息", "displayType": "sectionHeading" }
```

### 7.1 基本信息（group · columns: 4）

**blockKey：** `baseInfo`  
**displayType：** `group`  
**label：** 不传（大区标题由 `baseInfoTitle` sectionHeading 承担）  
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
**label：** `行业许可证`（圆点小标题，保留）  
**showIndex：** `true`  
**emptyText：** `暂无行业许可证数据`
**数据来源：** `companyPublicInfo.industryLicenseList`

| 顺序 | 列 label | key |
| :--: | -------- | --- |
| 1 | 证件名称 | `specCrdntlsName` |
| 2 | 编号 | `specCrdntlsCode` |
| 3 | 期限 | `expirationDate` |

### 7.3 主营业务 / 公司沿革（longText）

圆点小标题保留；有值时输出，空 / null 不输出该 block。顺序在「行业许可证」之后、「股权结构」之前。

| blockKey | label | displayType | 接口字段 |
| -------- | ----- | ----------- | -------- |
| `mainBusiness` | `主营业务` | `longText` | `companyPublicInfo.baseInfo.mainBusiness` |
| `companyEvolution` | `公司沿革` | `longText` | `companyPublicInfo.baseInfo.companyEvolution` |

```json
{
  "blockKey": "mainBusiness",
  "label": "主营业务",
  "displayType": "longText",
  "value": "高新纤维与功能性复合面料的研发、生产及一体化供应链服务…"
}
```

```json
{
  "blockKey": "companyEvolution",
  "label": "公司沿革",
  "displayType": "longText",
  "value": "南通东屹高新纤维科技有限公司的历史沿革…"
}
```

### 7.4 股权结构（table）

**blockKey：** `shareholderList`  
**label：** `股权结构`（圆点小标题，保留）  
**showIndex：** `true`  
**emptyText：** `暂无股权结构数据`  
**数据来源：** `companyPublicInfo.shareholderList[]` + `companyPublicInfo.shareholderTotal`

| 顺序 | 列 label | key |
| :--: | -------- | --- |
| 1 | 股东名称 | `shareholderName` |
| 2 | 出资额(万元) | `shareholderCapitalAmount` |
| 3 | 占比(%) | `holdStockRatio` |

**合计行（summary）：** 取自 `shareholderTotal`；`shareholderName` 列展示 `合计`。

### 7.5 司法诉讼信息（litigationCards）

**blockKey：** `judicialLitigationInfo`  
**displayType：** `litigationCards`  
**label：** 不传（大区标题由 `judicialLitigationTitle` sectionHeading 承担）  
**数据来源：** `companyPublicInfo.judicialLitigationInfo`

| 属性 | 说明 |
| ---- | ---- |
| `updateTime` | `judicialLitigationInfo.updateTime`；展示为「司法诉讼数据更新时间：{time}」（可置于卡片区上方右侧） |
| `cards[]` | 先 `caseTypeHighRiskList`，再 `caseTypeCommonList`；过滤 `caseNum <= 0` |
| `cards[].caseType` | 案件类型标签名 |
| `cards[].caseNum` | 案件数量（卡片右上角） |
| `cards[].tone` | `highRisk` / `common` |
| `emptyText` | `客户暂无司法诉讼数据` |

## 八、司法诉讼卡片样式（L2 扩展 · mock-to-html 已实现）

| tone | 说明 |
| ---- | ---- |
| `highRisk` | 红渐变底；被执行人、强制清算与破产案件、限制高消费等 |
| `common` | 蓝渐变底；民事案件、执行案件等 |

布局：卡片左起自动换行，**宽度适中**（约 3 列量级），**不按一行卡片数均分拉满**；右上角数量、居中案件类型。正式 L2 扩展见后续 `prjc_style_render` 迭代，当前由 `mock-to-html.mjs` 内联 CSS 支持。

---

## 九、完整 JSON 示例（节选）

```json
{
  "moduleIndex": 8,
  "moduleName": "承租人基本信息",
  "moduleKey": "lessee_base_info",
  "blocks": [
    {
      "blockKey": "baseInfoTitle",
      "label": "基本信息",
      "displayType": "sectionHeading"
    },
    {
      "blockKey": "baseInfo",
      "displayType": "group",
      "columns": 4,
      "children": [
        { "blockKey": "customerName", "label": "企业名称", "displayType": "direct", "value": "昆山东卓精密电子科技有限公司" }
      ]
    },
    {
      "blockKey": "judicialLitigationTitle",
      "label": "司法诉讼信息",
      "displayType": "sectionHeading"
    },
    {
      "blockKey": "judicialLitigationInfo",
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
