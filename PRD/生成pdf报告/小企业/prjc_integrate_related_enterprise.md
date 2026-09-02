# 关联企业信息 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**8**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `associateCompany`，按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不调用 CRM / 司法涉诉接口、不做 HTML 渲染。

页面为「关联企业概要卡片列表 + 各企业详情（基本信息 / 主营业务 / 股权结构 / 实控人介绍 / 司法诉讼）」；PDF **按概要列表顺序全部展开**（无折叠 / Tab）。

> 若 `associateCompany` 为 null / 缺失，整模块不输出。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `8` |
| `moduleKey` | `related_enterprise` |
| `moduleName` | `关联企业信息` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `associateCompany` | 模块主数据对象 |
| `associateCompany.associatedCompanySynopsisList[]` | 关联企业概要列表（标签 + 名称 + 证件号） |
| `associateCompany.associatedCompanySynopsisList[].isGuarantor` | 是否担保人：`是`→担保人，否则→非担保人 |
| `associateCompany.associatedCompanySynopsisList[].customerName` | 客户名称 |
| `associateCompany.associatedCompanySynopsisList[].crdntlsCode` | 统一社会信用代码 |
| `associateCompany.associatedCompanyList[]` | 关联企业详情（结构与 `companyPublicInfo` 同构） |
| `associatedCompanyList[].baseInfo` | 基本信息 |
| `associatedCompanyList[].relationTypes[]` | 与承租人关系 |
| `associatedCompanyList[].otherDesc` | 其他关系说明 |
| `associatedCompanyList[].shareholderList[]` / `shareholderTotal` | 股权结构 |
| `associatedCompanyList[].controllerIntroduction` | 实控人及股东情况介绍 |
| `associatedCompanyList[].judicialLitigationInfo` | 司法诉讼总览 |

**PDF 不提取 / 不输出：**

| 字段 / 区块 | 原因 |
| ----------- | ---- |
| `pkCustomerStkhldr` / 各类主键 | 仅数据匹配 |
| `collaborationHistoryModel` | 合作历史由模块 2 独立输出 |
| `assetSize` / `financialAnalysisList` 等 | 页面截图范围外 |
| 仅存在于概要列表、无详情的企业 | 仅输出概要卡片，不输出详情区 |

---

## 四、整合流程

```text
1. 若 associateCompany 为 null / 缺失：整模块不输出
2. 概要列表与详情列表均为空：输出 empty「暂无关联企业」
3. 输出「关联企业概要」associateCompanySynopsis（按 synopsisList 顺序）
4. 按 synopsisList 顺序，匹配 associatedCompanyList（customerNo）输出详情卡片
5. 详情内：基本信息 → 主营业务 → 股权结构 → 实控人介绍 → 司法诉讼 → 司法诉讼说明
6. 空值规范化为「—」
7. 输出 moduleIndex=8 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

- `isGuarantor === '是'` → 标签「担保人」、`tone: guarantor`（蓝）
- 否则 → 标签「非担保人」、`tone: nonGuarantor`（黄）
- `relationTypes[]`：多值用 `、` 拼接
- 司法标签：`caseNum <= 0` 不展示卡片
- 无详情数据的概要企业：仅出现在概要列表，不输出详情 block

---

## 六、blocks 组装顺序

| 顺序 | blockKey | displayType | 说明 |
| :--: | -------- | ----------- | ---- |
| 1 | `associatedCompanySynopsisList` | `associateCompanySynopsis` | 概要卡片列表 |
| 2+ | `company_{customerNo}` | `associateCompanyDetail` | 每家有详情的企业一组嵌套 blocks |

**associateCompanyDetail 内 childBlocks 顺序：**

| 顺序 | blockKey | label | displayType |
| :--: | -------- | ----- | ----------- |
| 1 | `baseInfo` | `基本信息` | `group` |
| 2 | `mainBusiness` | `主营业务` | `longText`（有值时） |
| 3 | `shareholderList` | `股权结构` | `table` |
| 4 | `controllerIntroduction` | `实控人及股东情况介绍` | `longText`（有值时） |
| 5 | `judicialLitigationInfo` | `司法诉讼信息` | `litigationCards` |
| 6 | `judicialLitigationInfoDesc` | `司法诉讼信息说明` | `longText`（有值时） |

---

## 七、基本信息字段（group · columns: 4）

| 顺序 | label | 接口字段 |
| :--: | ----- | -------- |
| 1 | 企业名称 | `baseInfo.customerName` |
| 2 | 统一社会信用代码 | `baseInfo.crdntlsCode` |
| 3 | 法定代表人 | `baseInfo.legalRepresentativeCustomerName` |
| 4 | 实际控制人 | `baseInfo.actControlsName` |
| 5 | 成立时间 | `baseInfo.estblshDate` |
| 6 | 注册资本(万元) | `baseInfo.rgstrdCapital` |
| 7 | 行业小类 | `baseInfo.pkIndustrySortLittle.name` |
| 8 | 从业人数 | `baseInfo.employeeNum` |
| 9 | 注册地址 | `baseInfo.rgstrdAddress`（`fullWidth: true`） |
| 10 | 与承租人关系 | `relationTypes[]` |
| 11 | 其他关系说明 | `otherDesc`（`fullWidth: true`） |

---

## 八、概要卡片样式（L2 扩展 · mock-to-html 已实现）

| tone | 标签文案 | 说明 |
| ---- | -------- | ---- |
| `guarantor` | 担保人 | 蓝色平行四边形标签 |
| `nonGuarantor` | 非担保人 | 黄色平行四边形标签 |

正式 L2 扩展见后续 `prjc_style_render` 迭代，当前由 `mock-to-html.mjs` 内联 CSS 支持。

---

## 九、完整 JSON 示例（节选）

```json
{
  "moduleIndex": 8,
  "moduleName": "关联企业信息",
  "moduleKey": "related_enterprise",
  "blocks": [
    {
      "blockKey": "associatedCompanySynopsisList",
      "displayType": "associateCompanySynopsis",
      "items": [
        {
          "guarantorTag": "非担保人",
          "guarantorTone": "nonGuarantor",
          "customerName": "北京鑫鑫印刷有限公司",
          "crdntlsCode": "911101147921218971"
        }
      ]
    },
    {
      "blockKey": "company_C120240098896",
      "displayType": "associateCompanyDetail",
      "guarantorTag": "非担保人",
      "customerName": "北京鑫鑫印刷有限公司",
      "crdntlsCode": "911101147921218971",
      "childBlocks": []
    }
  ]
}
```
