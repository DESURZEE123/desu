# 增信措施 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**10**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `creditEnhancementMeasure`，按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射与 displayType 标注**，不调用客户 / 司法涉诉接口、不做 HTML 渲染。

页面为「担保措施卡片列表 + 担保人（自然人）详情 + 担保企业详情」；PDF **按顺序全部展开**（无「信息已完善」badge、无「管理增信措施」按钮、无折叠 / Tab）。

> 若 `creditEnhancementMeasure` 为 null / 缺失，整模块不输出。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `10` |
| `moduleKey` | `credit_enhancement` |
| `moduleName` | `增信措施` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `creditEnhancementMeasure` | 模块主数据对象 |
| `creditEnhancementMeasure.creditEnhancementMeasureInfo.creditEnhancementMeasureList[]` | 担保措施列表 |
| `creditEnhancementMeasure.guaranteePersonList[]` | 担保自然人详情列表 |
| `creditEnhancementMeasure.guaranteeCompanyList[]` | 担保企业详情列表 |
| `guaranteeCompanyList[].companyPublicInfo` | 担保企业公示信息（与承租人 `companyPublicInfo` 同构） |

**本模块与「实施方案」内嵌增信措施的关系：**

| 模块 | 数据 | 说明 |
| ---- | ---- | ---- |
| 实施方案（moduleIndex 6） | 报价维度增信措施摘要 | 按报价取数：优先 `commonCreditEnhancementMeasure` 中 `quotName` 匹配项 → `embodiment.creditEnhancementMeasureInfo` → 顶层 `creditEnhancementMeasure`（有 `quotName` 则按报价过滤）；卡片字段规则与本模块 §7.1 相同 |
| **本模块（moduleIndex 10）** | **顶层 `creditEnhancementMeasure` 全量页** | 取 `creditEnhancementMeasureInfo.creditEnhancementMeasureList`，**不以报价过滤**；另含担保人 / 担保企业详情 |

**PDF 不提取 / 不输出：**

| 字段 / 区块 | 原因 |
| ----------- | ---- |
| `pkCreditEnhancementMeasure` / `pkGuarantorInfo` / 各类主键 | 仅数据匹配 |
| `customerType[]` / `guaCustomerNo` | 页面卡片不展示 |
| `collaborationHistoryModel` | 合作历史由模块 2 独立输出 |
| `loan` / `productionAndSaleSituation` / `assetSize` / 财报等 | 小企业本页截图范围外 |
| 「信息已完善」badge、「管理增信措施」「更新司法涉诉数据」 | 页面交互 |

---

## 四、整合流程

```text
1. 若 creditEnhancementMeasure 为 null / 缺失：整模块不输出
2. 输出「增信措施」大区标题（sectionHeading）
3. 输出「担保措施」measureList（取 creditEnhancementMeasureInfo.creditEnhancementMeasureList）
4. 若 guaranteePersonList 非空：输出「担保人信息」大区标题（sectionHeading），再按列表顺序输出各自然人详情
5. 若 guaranteeCompanyList 非空：按列表顺序输出各担保企业详情（标题含企业名）
6. 空值规范化为「—」；数值原样透传（金额千分位）
7. 输出 moduleIndex=10 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

- `guaCustType`：`0`→企业客户；`1`→自然人客户（仅用于理解列表语义，**不单独成列**）
- `guaranteeMethod`：取对象 `desc`；已是字符串则原样
- `guaranteeTone`：按 `guaranteeMethod.code` / 文案映射（见下表）；L2 用 `report-measure-card__tag--{tone}` 渲染标签色

| 担保方式 | code | `guaranteeTone` | 标签色（L2） |
| -------- | :--: | --------------- | ------------ |
| 保证担保 | 1 | `guarantee` | 橙 `#FF7D00` |
| 抵押担保 | 3 | `mortgage` | 蓝 `#3491FA` |
| 质押担保 | 5 | `pledge` | 浅橙 `#FF9A2E` |
| 其他 / 未知 | — | `default` | 灰 `#86909C` |

> 有 `desc` 无 `code` 时按文案包含「保证 / 抵押 / 质押」匹配；均无法匹配则 `default`。

- `relationship` 为空：measureList 卡片不传该字段（不渲染绿色关系 tag）
- 抵押 / 质押：仅当 tone 为 `mortgage` / `pledge` 时输出 `attrs`（见 §7.1.2）；`collateralList` 非空时输出担保物表（见 §7.1.3）；保证担保通常不传这两项
- 司法标签：`caseNum <= 0` 不展示卡片；先高风险后普通
- 长文本为空：不输出该 `longText` block
- 担保人 / 担保企业列表为空：不输出对应详情区块（担保措施列表仍输出，可走 emptyText）

---

## 六、blocks 组装顺序

| 顺序 | blockKey | label | displayType | 说明 |
| :--: | -------- | ----- | ----------- | ---- |
| 1 | `creditEnhancementTitle` | `增信措施` | `sectionHeading` | 大区仅标题（蓝竖条）；位于担保措施卡片上方 |
| 2 | `creditEnhancementMeasureList` | `担保措施` | `measureList` | 卡片列表 |
| 3 | `guaranteePersonTitle` | `担保人信息` | `sectionHeading` | 大区仅标题（蓝竖条）；仅当 `guaranteePersonList` 非空 |
| 4+ | `guaranteePerson_{customerNo}` | `担保自然人 - {customerName}` | `guaranteePersonDetail` | 嵌套 childBlocks；每人一组 |
| … | `guaranteeCompany_{customerNo}` | `担保企业 - {customerName}` | `guaranteeCompanyDetail` | 嵌套 childBlocks；每企一组 |

> `guaranteePersonDetail` / `guaranteeCompanyDetail` 为 L2 扩展展示类型：渲染蓝色副标题 + 内部 blocks。若 L2 暂未实现该类型，可用 `group`（`columns: 1`）+ 后续 sibling blocks 等价展开，但 **L1 输出须按上表标注**，以便后续样式统一。

### 6.1 担保自然人 childBlocks

| 顺序 | blockKey | label | displayType |
| :--: | -------- | ----- | ----------- |
| 1 | `baseInfo` | `基本信息` | `group`（columns: 4） |
| 2 | `judicialLitigationInfo` | `司法诉讼信息` | `litigationCards` |
| 3 | `judicialLitigationInfoDesc` | `司法诉讼信息说明` | `longText`（有值时） |

### 6.2 担保企业 childBlocks

| 顺序 | blockKey | label | displayType |
| :--: | -------- | ----- | ----------- |
| 1 | `baseInfo` | `基本信息` | `group`（columns: 4） |
| 2 | `shareholderList` | `股权结构` | `table` |
| 3 | `controllerIntroduction` | `实控人及股东情况介绍` | `longText`（有值时） |
| 4 | `judicialLitigationInfo` | `司法诉讼信息` | `litigationCards` |
| 5 | `judicialLitigationInfoDesc` | `司法诉讼信息说明` | `longText`（有值时） |

---

## 七、字段映射与 displayType 规则

### 7.1 担保措施（measureList）

对齐页面「担保措施」卡片样式：每条措施一张卡，含担保方式色标、客户身份行；抵押/质押额外展开属性行 + 担保物明细表。

**数据来源：** `creditEnhancementMeasure.creditEnhancementMeasureInfo.creditEnhancementMeasureList[]`  
**blockKey：** `creditEnhancementMeasureList`  
**label：** `担保措施`  
**displayType：** `measureList`  
**emptyText：** `暂无增信措施`

#### 7.1.1 卡片主字段（每条 `items[]`）

| 卡片字段 | 接口字段 / 规则 | 说明 |
| -------- | --------------- | ---- |
| `guaranteeMethod` | `guaranteeMethod.desc`（已是字符串则原样） | 担保方式文案（标签文字） |
| `guaranteeTone` | 见 §五色标表 | 决定标签色；`report-measure-card__tag--{tone}` |
| `customerName` | `customerName` | 客户名称 |
| `relationship` | `relationship` | 关系标签（绿底）；空则不传、不渲染 |
| `crdntlsType` | `crdntlsType` | 证件类型 |
| `documentCode` | `documentCode` | 证件代码 |

#### 7.1.2 抵押 / 质押属性行（`attrs`）

仅当担保方式为 **抵押担保** 或 **质押担保**（`guaranteeTone` 为 `mortgage` / `pledge`）时输出 `attrs`；保证担保不传：

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 抵押物类别 | `collateralType` | 原样；空 → `—` |
| 抵质押物类型 | `mortgageAndPledgeType` | 原样；空 → `—` |
| 抵质押物分类 | `mortgageAndPledgeClass` | 原样；空 → `—` |

```json
"attrs": [
  { "label": "抵押物类别", "value": "其他" },
  { "label": "抵质押物类型", "value": "动产" },
  { "label": "抵质押物分类", "value": "4.3.1车辆" }
]
```

#### 7.1.3 担保物明细（`collateral`）

仅当 `collateralList` 非空时输出；结构复用 table Schema（由 L2 在卡片内渲染；列数 > 8 自动叠行）：

| 列 label | key | 格式化 |
| -------- | --- | ------ |
| 担保物名称 | `assetsName` | 原样 |
| 所在地 | `locationVfbc` | 原样 |
| 车牌号/不动产面积 | `assetsNo1Vfbc` | 原样 |
| 机身号/不动产单元号 | `assetsNo` | 原样 |
| 租赁物唯一识别码/抵质押证书编号 | `assetsNo2Vfbc` | 原样 |
| 担保物估值(元) | `estimateValue` | 千分位 + 2 位小数 |
| 币种 | `currtype` | 原样 |
| 第三方质押债务人 | `debtor` | 原样 |
| 是否第一顺位 | `isFirstOrder` | 原样 |
| 评估方式 | `assessMode` | 原样 |
| 优先受偿权数额 | `compensationNumber` | 千分位 + 2 位小数（已是文案则原样） |
| 估值周期 | `valuationCycle` | 原样 |

- `collateral.label`: `担保物`
- `collateral.showIndex`: `true`
- **全部列**默认左对齐（不传 `align`，或统一 `align: "left"`）；表头与单元格对齐一致
- L2 用 `.report-measure-card__collateral .report-table th/td { text-align: left }` 兜底
- `collateralList` 为空 / null：不传 `collateral` 字段（保证担保天然无此块）

> 保证担保示例：企业（统一社会信用代码）、自然人（居民身份证 + 关系标签）。抵押/质押示例见 §九。

### 7.2 担保自然人 · 基本信息（group · columns: 4）

**数据来源：** `guaranteePersonList[]` 项

| 顺序 | label | 接口字段 | 说明 |
| :--: | ----- | -------- | ---- |
| 1 | 姓名 | `customerName` | |
| 2 | 证件类型 | `crdntlsType` | |
| 3 | 证件代码 | `documentCode` | |
| 4 | 与承租人关系 | `relationship` | |
| 5 | 与承租人关系说明 | `relationshipDesc` | |
| 6 | 名下资产、市值与抵押情况 | `assetDesc` | `fullWidth: true` |

> `age` / `sex` / `maritalStatus` / `guaranteeContInfoList`：小企业本页截图不展示，**不输出**。

### 7.3 担保企业 · 基本信息（group · columns: 4）

**数据来源：** `guaranteeCompanyList[].companyPublicInfo.baseInfo`

| 顺序 | label | 接口字段 | 说明 |
| :--: | ----- | -------- | ---- |
| 1 | 企业名称 | `customerName` | |
| 2 | 统一社会信用代码 | `crdntlsCode` | |
| 3 | 法定代表人 | `legalRepresentativeCustomerName` | |
| 4 | 实际控制人 | `actControlsName` | |
| 5 | 成立时间 | `estblshDate` | |
| 6 | 注册资本(万元) | `rgstrdCapital` | 千分位 |
| 7 | 行业小类 | `pkIndustrySortLittle.name` | |
| 8 | 从业人数 | `employeeNum` | |
| 9 | 注册地址 | `rgstrdAddress` | `fullWidth: true` |

> 小企业本页截图**不输出**行业许可证、主营业务、公司沿革（与承租人基本信息模块区分）。

### 7.4 股权结构（table）

**数据来源：** `companyPublicInfo.shareholderList[]` + `shareholderTotal`  
**showIndex：** `true`  
**emptyText：** `暂无股权结构数据`

| 列 label | key |
| -------- | --- |
| 股东名称 | `shareholderName` |
| 出资额(万元) | `shareholderCapitalAmount`（千分位） |
| 占比(%) | `holdStockRatio` |

**合计行：** 取 `shareholderTotal`；序号列文案 `合计`。

### 7.5 司法诉讼信息（litigationCards）

规则同 `prjc_integrate_lessee_base_info` §7.4：

| 属性 | 说明 |
| ---- | ---- |
| `updateTime` | `judicialLitigationInfo.updateTime` |
| `cards[]` | 先 `caseTypeHighRiskList`，再 `caseTypeCommonList`；过滤 `caseNum <= 0` |
| `cards[].tone` | 高风险 → `highRisk`；普通 → `common` |
| `emptyText` | `客户暂无司法诉讼数据` |

自然人取 `guaranteePersonList[].judicialLitigationInfo`；企业取 `companyPublicInfo.judicialLitigationInfo`。

### 7.6 实控人及股东情况介绍 / 司法诉讼信息说明（longText）

| label | 企业路径 | 自然人路径 |
| ----- | -------- | ---------- |
| 实控人及股东情况介绍 | `companyPublicInfo.controllerIntroduction` | —（不输出） |
| 司法诉讼信息说明 | `judicialLitigationInfo.judicialLitigationInfoDesc` | 同左 |

---

## 八、展示类型依赖（L2）

本模块复用已有展示类型，**不要求修改 Tools 实现文件**即可完成规则定义；落地渲染时依赖：

| displayType | 用途 | 既有约定 |
| ----------- | ---- | -------- |
| `measureList` | 担保措施卡片 | `prjc_style_render`（色标 / 关系 tag / 卡片内担保物表） |
| `sectionHeading` | 「增信措施」「担保人信息」大区标题 | `prjc_style_render` §5.4.1（蓝竖条） |
| `group` | 基本信息栅格 | 标准 L2 |
| `table` | 股权结构 | 标准 L2 + summary |
| `longText` | 说明类文本 | 标准 L2 |
| `litigationCards` | 司法诉讼卡片网格 | 承租人基本信息 L1 §八 |
| `guaranteePersonDetail` / `guaranteeCompanyDetail` | 详情容器 + 蓝色副标题 | **本模块新增约定**；L2 待实现前可用 group 降级 |

---

## 九、完整 JSON 示例（节选）

```json
{
  "moduleIndex": 10,
  "moduleName": "增信措施",
  "moduleKey": "credit_enhancement",
  "blocks": [
    {
      "blockKey": "creditEnhancementTitle",
      "label": "增信措施",
      "displayType": "sectionHeading"
    },
    {
      "blockKey": "creditEnhancementMeasureList",
      "label": "担保措施",
      "displayType": "measureList",
      "emptyText": "暂无增信措施",
      "items": [
        {
          "guaranteeMethod": "保证担保",
          "guaranteeTone": "guarantee",
          "customerName": "太和县中医院",
          "crdntlsType": "统一社会信用代码",
          "documentCode": "123412224859362015"
        },
        {
          "guaranteeMethod": "保证担保",
          "guaranteeTone": "guarantee",
          "customerName": "杨洪卫",
          "relationship": "法定代表人非实控人",
          "crdntlsType": "居民身份证",
          "documentCode": "522424197510101230"
        },
        {
          "guaranteeMethod": "抵押担保",
          "guaranteeTone": "mortgage",
          "customerName": "杨洪卫",
          "relationship": "法定代表人非实控人",
          "crdntlsType": "居民身份证",
          "documentCode": "522424197510101230",
          "attrs": [
            { "label": "抵押物类别", "value": "其他" },
            { "label": "抵质押物类型", "value": "动产" },
            { "label": "抵质押物分类", "value": "4.3.1车辆" }
          ],
          "collateral": {
            "label": "担保物",
            "showIndex": true,
            "columns": [
              { "key": "assetsName", "label": "担保物名称" },
              { "key": "locationVfbc", "label": "所在地" },
              { "key": "assetsNo1Vfbc", "label": "车牌号/不动产面积" },
              { "key": "assetsNo", "label": "机身号/不动产单元号" },
              { "key": "assetsNo2Vfbc", "label": "租赁物唯一识别码/抵质押证书编号" },
              { "key": "estimateValue", "label": "担保物估值(元)" },
              { "key": "currtype", "label": "币种" },
              { "key": "debtor", "label": "第三方质押债务人" },
              { "key": "isFirstOrder", "label": "是否第一顺位" },
              { "key": "assessMode", "label": "评估方式" },
              { "key": "compensationNumber", "label": "优先受偿权数额" },
              { "key": "valuationCycle", "label": "估值周期" }
            ],
            "rows": [
              {
                "assetsName": "1",
                "locationVfbc": "3",
                "assetsNo1Vfbc": "4",
                "assetsNo": "5",
                "assetsNo2Vfbc": "6",
                "estimateValue": "2.00",
                "currtype": "人民币",
                "debtor": "7",
                "isFirstOrder": "第一顺位",
                "assessMode": "内部评估",
                "compensationNumber": "0.00",
                "valuationCycle": "季度"
              }
            ]
          }
        }
      ]
    },
    {
      "blockKey": "guaranteePersonTitle",
      "label": "担保人信息",
      "displayType": "sectionHeading"
    },
    {
      "blockKey": "guaranteePerson_2202026978000",
      "label": "担保自然人 - 杨洪卫",
      "displayType": "guaranteePersonDetail",
      "childBlocks": [
        {
          "blockKey": "baseInfo",
          "label": "基本信息",
          "displayType": "group",
          "columns": 4,
          "children": [
            { "blockKey": "customerName", "label": "姓名", "displayType": "direct", "value": "杨洪卫" },
            { "blockKey": "crdntlsType", "label": "证件类型", "displayType": "direct", "value": "居民身份证" },
            { "blockKey": "documentCode", "label": "证件代码", "displayType": "direct", "value": "522424197510101230" },
            { "blockKey": "relationship", "label": "与承租人关系", "displayType": "direct", "value": "法定代表人非实控人" },
            { "blockKey": "relationshipDesc", "label": "与承租人关系说明", "displayType": "direct", "value": "—" },
            {
              "blockKey": "assetDesc",
              "label": "名下资产、市值与抵押情况",
              "displayType": "direct",
              "value": "阿达沙发上发大声道",
              "fullWidth": true
            }
          ]
        },
        {
          "blockKey": "judicialLitigationInfo",
          "label": "司法诉讼信息",
          "displayType": "litigationCards",
          "updateTime": "2025-12-18 10:38:31",
          "cards": [
            { "caseType": "被执行人", "caseNum": 6, "tone": "highRisk" },
            { "caseType": "民事案件", "caseNum": 8, "tone": "common" }
          ]
        }
      ]
    },
    {
      "blockKey": "guaranteeCompany_120160919000",
      "label": "担保企业 - 太和县中医院",
      "displayType": "guaranteeCompanyDetail",
      "childBlocks": [
        {
          "blockKey": "baseInfo",
          "label": "基本信息",
          "displayType": "group",
          "columns": 4,
          "children": [
            { "blockKey": "customerName", "label": "企业名称", "displayType": "direct", "value": "太和县中医院" }
          ]
        },
        {
          "blockKey": "shareholderList",
          "label": "股权结构",
          "displayType": "table",
          "showIndex": true,
          "rows": [
            { "shareholderName": "韩梅梅", "shareholderCapitalAmount": "23.00", "holdStockRatio": "55.0000" }
          ],
          "summary": {
            "index": "合计",
            "shareholderCapitalAmount": "23.00",
            "holdStockRatio": "55.0000"
          }
        }
      ]
    }
  ]
}
```
