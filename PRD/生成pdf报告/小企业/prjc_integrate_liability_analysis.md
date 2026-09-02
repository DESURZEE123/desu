# 刚性负债分析 · 功能整合

> 所属：报告自动生成 PDF 模块（prjc_integrate_report）  
> 模块索引：**11**  
> 上游：用户传入的尽调项目全量参数  
> 下游：prjc_style_render.md（L2 统一样式渲染）  
> **完整报告生成须经 L0（`prjc_integrate_report`）调度；本 Skill 仅输出结构化 JSON，不得单独作为最终 HTML 交付物。**

---

## 一、Skill Role（技能角色）

本 Skill 从用户传入参数中提取 `liabilityAnalysis`，按**小企业（`prjc-slb`）**页面字段范围映射中文展示名、标注 `displayType`，输出符合 prjc_style_render.md Schema 的结构化 JSON。

AI 在本层**仅负责字段提取、展示映射、金额/空值格式化与 displayType 标注**，不调用征信/中登接口、不筛选主体、不做 HTML 渲染。

页面为「更新时间 + 借款情况（企业借款 / 个人借款）+ 对外担保情况 + 负债说明」；PDF **按顺序全部展开**（无 Tab / 折叠 / 筛选交互）。宽表（列数 > 8）由 L2 自动叠行，L1 不拆表。

> 若 `liabilityAnalysis` 为 null / 缺失，整模块不输出。

---

## 二、模块标识

| 字段 | 值 |
| ---- | -- |
| `moduleIndex` | `11` |
| `moduleKey` | `liability_analysis` |
| `moduleName` | `刚性负债分析` |

---

## 三、数据来源

| 来源路径 | 说明 |
| -------- | ---- |
| `liabilityAnalysis` | 模块主数据对象 |
| `liabilityAnalysis.updateTime` | 征信、中登数据更新时间 |
| `liabilityAnalysis.loanSituation.companyLoanList[]` | 企业借款明细 |
| `liabilityAnalysis.loanSituation.companyLoanTotal` | 企业借款合计（借款金额 / 余额） |
| `liabilityAnalysis.loanSituation.personLoanList[]` | 个人借款明细 |
| `liabilityAnalysis.loanSituation.personLoanTotal` | 个人借款合计 |
| `liabilityAnalysis.externalGuaranteeSituationList[]` | 对外担保情况明细 |
| `liabilityAnalysis.amountTotal` | 对外担保余额合计 |
| `liabilityAnalysis.liabilityStatement` | 负债说明 |

**PDF 不提取 / 不输出：**

| 字段 | 原因 |
| ---- | ---- |
| `pkQueryRecord` / `queryStatusEnum` | 仅查询态匹配 |
| `loanBalance` | 页面主表不展示 |
| `associateLiabilityInfo` | 截图无对应块；空列表时无展示价值 |
| `personBorrowIndexList` / `companyBorrowIndexList` | 征信指标内部结构，页面主表不展示 |
| `loanSituation.personBorrowDetailList` | 个人借款明细子表，页面主表「个人借款」用汇总行 `personLoanList`，PDF 对齐主表 |
| `customerNo` / 各类主键 | 仅数据匹配 |

---

## 四、整合流程

```text
1. 若 liabilityAnalysis 为 null / 缺失：整模块不输出
2. 输出更新时间 direct（有 updateTime 时）
3. 输出「借款情况」分组标题
4. 组装企业借款 table（含 summary）
5. 组装个人借款 table（含 summary）
6. 组装对外担保情况 table（含 summary）
7. 组装负债说明 longText（有值时）
8. 输出 moduleIndex=11 的结构化 JSON → 交由 L2 渲染
```

---

## 五、输出规则

- `updateTime` 为空：不输出该 direct block
- 各表 `null` / `[]`：仍输出对应 `table` block，走 `emptyText`
- `liabilityStatement` 为空 / null：不输出负债说明 block
- 「筛选主体」「更新刚性负债数据」：页面操作，PDF **不输出**

---

## 六、blocks 组装顺序

| 顺序 | blockKey | label | displayType | 说明 |
| :--: | -------- | ----- | ----------- | ---- |
| 1 | `updateTime` | `征信、中登数据更新时间` | `direct` | 有值时 |
| 2 | `loanSituationTitle` | `借款情况` | `group`（仅标题，`children: []`） | 分隔标题 |
| 3 | `companyLoanList` | `企业借款` | `table` | 宽表，L2 叠行 |
| 4 | `personLoanList` | `个人借款` | `table` | 宽表，L2 叠行 |
| 5 | `externalGuaranteeSituationList` | `对外担保情况` | `table` | 宽表，L2 叠行 |
| 6 | `liabilityStatement` | `负债说明` | `longText` | 有值时 |

---

## 七、字段映射与 displayType 规则

### 7.1 更新时间（direct）

```json
{
  "blockKey": "updateTime",
  "label": "征信、中登数据更新时间",
  "displayType": "direct",
  "value": "2026-09-01 08:54:51"
}
```

- 取值：`liabilityAnalysis.updateTime`，`trim` 首尾空白后原样展示

### 7.2 借款情况标题（group）

```json
{
  "blockKey": "loanSituationTitle",
  "label": "借款情况",
  "displayType": "group",
  "columns": 1,
  "children": []
}
```

- L2 仅渲染蓝色圆点小节标题（同实施方案报价名称）

### 7.3 企业借款（table）

数据来源：`loanSituation.companyLoanList`  
**blockKey：** `companyLoanList`  
**label：** `企业借款`  
**showIndex：** `true`  
**emptyText：** `暂无企业借款数据`

| 顺序 | 列 label | key | 格式化 | 叠行列属性 |
| :--: | -------- | --- | ------ | ---------- |
| 1 | 借款主体 | `borrowingEntity` | 仅主体名称；征信日期走 `subKey` | `stackSpan` + `mergeSame`；`subKey: queryTime` |
| 2 | 主体角色 | `principalRole` | `principalRole[]` 用 `、` 拼接；空 → `—` | `stackSpan` + `mergeSame` |
| 3 | 租赁借款余额合计(元) | `leaseLoanTotal` | 金额 | `stackSpan` + `mergeSame` |
| 4 | 非租赁借款余额合计(元) | `nonLeaseLoanTotal` | 金额 | `stackSpan` + `mergeSame` |
| 5 | 业务类型 | `businessType` | 原样 | 配对叠放 |
| 6 | 机构编码 | `institutionalCode` | 原样 | 配对叠放 |
| 7 | 授信机构 | `creditInstitutional` | 原样 | 配对叠放 |
| 8 | 借款金额(元) | `loanAmount` | 金额 | 配对叠放 |
| 9 | 余额(元) | `balance` | 金额 | 配对叠放 |
| 10 | 起始日期 | `startDate` | 原样 | 配对叠放 |
| 11 | 截止日期 | `deadline` | 原样 | 配对叠放 |
| 12 | 担保方式 | `guaranteeMethod` | 原样 | 配对叠放 |
| 13 | 抵押类型 | `mortgageType` | 原样 | 配对叠放 |
| 14 | 五级分类 | `fiveLevel` | 原样（PDF 不做色标，文案透传） | 配对叠放 |
| 15 | 当前逾期月份 | `curOverdueMonth` | 原样 | 配对叠放 |
| 16 | 数据来源 | `querySource` | 原样 | 配对叠放 |
| 17 | 是否与征信重复 | `repeat` | 原样；空 → `—` | 配对叠放（与其他配对列同表，**不得**单独拆表） |

**借款主体展示：**

- `borrowingEntity` 字段只填主体名称（用于 `mergeSame` 比较）
- `queryTime` trim 后非空时由 L2 按 `subKey` 渲染为副行：`（征信查询日期: {queryTime}）`
- 同一主体多行：L1 每行仍写入相同的 `borrowingEntity` / `principalRole` / 租赁与非租赁合计；L2 按 `mergeSame` 合并单元格（`rowspan = 记录数 × 2`）
- 序号列**不合并**，每条借款明细各自编号

**列定义示例：**

```json
{ "key": "borrowingEntity", "label": "借款主体", "stackSpan": true, "mergeSame": true, "subKey": "queryTime" }
```

**不输出列：** `isWhite` / `loanOrigTypeName` / `customerNo` / 主键类字段

**summary**（取 `companyLoanTotal` + 主体级合计展示汇总）：

| summary key | 取值 |
| ----------- | ---- |
| `index` | `合计` |
| `leaseLoanTotal` | 按 `borrowingEntity` **去重取首行**的 `leaseLoanTotal` 求和后金额格式化（展示层汇总，对齐页面合计行） |
| `nonLeaseLoanTotal` | 同上，对 `nonLeaseLoanTotal` |
| `loanAmount` | `companyLoanTotal.loanAmount` 金额格式化 |
| `balance` | `companyLoanTotal.balance` 金额格式化 |
| 其余列 | `—` |

> 若某行 `repeat == 是`：业务侧合计会排除该行；PDF 以接口 `companyLoanTotal` 为准，**不**自行按 `repeat` 重算借款金额/余额合计。

### 7.4 个人借款（table）

数据来源：`loanSituation.personLoanList`  
**blockKey：** `personLoanList`  
**label：** `个人借款`  
**showIndex：** `true`  
**emptyText：** `暂无个人借款数据`

| 顺序 | 列 label | key | 格式化 | 叠行列属性 |
| :--: | -------- | --- | ------ | ---------- |
| 1 | 借款主体 | `borrowingEntity` | 仅主体名称；日期走 `subKey` | `stackSpan` + `mergeSame`；`subKey: queryTime` |
| 2 | 业务大类 | `businessCategory` | 原样 | 配对叠放 |
| 3 | 担保方式 | `guaranteeMethod` | 原样 | 配对叠放 |
| 4 | 账户数量 | `accountNum` | 原样（数字转字符串） | 配对叠放 |
| 5 | 借款金额(元) | `loanAmount` | 金额 | 配对叠放 |
| 6 | 余额(元) | `balance` | 金额 | 配对叠放 |
| 7 | 累计逾期月数 | `overdueMonths` | 原样 | 配对叠放 |
| 8 | 当前逾期账户数 | `overdueAccountNum` | 原样 | 配对叠放 |
| 9 | 最长逾期月数 | `maxOverdueMonths` | 原样 | 配对叠放 |
| 10 | 最大逾期金额(元) | `maxOverdueAmount` | 金额 | 配对叠放 |
| 11 | 近一个月到期金额(元) | `balanceDue` | 金额（label 对齐页面截图） | 配对叠放 |
| 12 | 近三个月被其他机构查询贷款审批及担保资格的次数 | `queryTimes` | 原样 | 配对叠放 |
| 13 | 数据来源 | `querySource` | 原样 | 配对叠放 |

**不输出：** `isBadAccount` / `maxCreditAmount` / `isWhite` / `principalRole` / `customerNo`（个人表截图无主体角色列）

**summary**（取 `personLoanTotal`）：

| summary key | 取值 |
| ----------- | ---- |
| `index` | `合计` |
| `loanAmount` | `personLoanTotal.loanAmount` |
| `balance` | `personLoanTotal.balance` |
| `maxOverdueAmount` | `personLoanTotal.maxOverdueAmount`（有则填；页面合计行可空则填 `—` 亦可，**优先有值则展示**） |
| `balanceDue` | `personLoanTotal.balanceDue` |
| 其余列 | `—` |

> 页面合计行通常突出借款金额 / 余额 / 近一个月到期金额；`maxOverdueAmount` 有接口合计则一并填入 summary。

### 7.5 对外担保情况（table）

数据来源：`externalGuaranteeSituationList`  
**blockKey：** `externalGuaranteeSituationList`  
**label：** `对外担保情况`  
**showIndex：** `true`  
**emptyText：** `暂无对外担保数据`

| 顺序 | 列 label | key | 格式化 | 叠行列属性 |
| :--: | -------- | --- | ------ | ---------- |
| 1 | 担保主体 | `borrowingEntity` | 仅主体名称；日期走 `subKey` | `stackSpan` + `mergeSame`；`subKey: queryTime` |
| 2 | 主体角色 | `principalRole` | 数组 `、` 拼接 | `stackSpan` + `mergeSame` |
| 3 | 被担保主体 | `guaranteedEntity` | 原样；空串 → `—` | 配对叠放 |
| 4 | 业务类型 | `businessType` | 原样 | 配对叠放 |
| 5 | 余额(元) | `balance` | 金额 | 配对叠放 |
| 6 | 起始日期 | `startDate` | 原样 | 配对叠放 |
| 7 | 截止日期 | `deadline` | 原样 | 配对叠放 |
| 8 | 五级分类 | `fiveLevel` | 原样 | 配对叠放 |
| 9 | 当前逾期月数 | `curOverdueMonth` | 原样 | 配对叠放 |
| 10 | 是否存在对应借款 | `loanExists` | 原样（对齐业务 PRD；勿改成「对外借款」） | 配对叠放 |
| 11 | 数据来源 | `querySource` | 原样 | 配对叠放 |

**不输出：** `paymentAmount` / `customerNo` / 主键

**summary：**

| summary key | 取值 |
| ----------- | ---- |
| `index` | `合计` |
| `balance` | `amountTotal` 金额格式化 |
| 其余列 | `—` |

### 7.6 负债说明（longText）

数据来源：`liabilityAnalysis.liabilityStatement`

```json
{
  "blockKey": "liabilityStatement",
  "label": "负债说明",
  "displayType": "longText",
  "value": "负债说明1"
}
```

---

## 八、空值与格式化规则

| 规则 | 说明 |
| ---- | ---- |
| 空值占位 | `null` / `""` / 仅空白 / 缺失 → `—` |
| 金额 | 千分位 + 2 位小数；入参为 number 或数字字符串均可（如 `4005800` → `4,005,800.00`） |
| 日期 / 枚举 / 文本 | 原样；`queryTime` 先 `trim` |
| 数组角色 | `principalRole` 非空元素用 `、` 连接；全空 → `—` |
| 五级分类 / 角色色标 | PDF **不做**彩色标签，仅输出中文文案（色标为页面交互增强） |

---

## 九、输出示例

```json
{
  "moduleIndex": 11,
  "moduleName": "刚性负债分析",
  "moduleKey": "liability_analysis",
  "blocks": [
    {
      "blockKey": "updateTime",
      "label": "征信、中登数据更新时间",
      "displayType": "direct",
      "value": "2026-09-01 08:54:51"
    },
    {
      "blockKey": "loanSituationTitle",
      "label": "借款情况",
      "displayType": "group",
      "columns": 1,
      "children": []
    },
    {
      "blockKey": "companyLoanList",
      "label": "企业借款",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "borrowingEntity", "label": "借款主体" },
        { "key": "principalRole", "label": "主体角色" },
        { "key": "leaseLoanTotal", "label": "租赁借款余额合计(元)" },
        { "key": "nonLeaseLoanTotal", "label": "非租赁借款余额合计(元)" },
        { "key": "businessType", "label": "业务类型" },
        { "key": "institutionalCode", "label": "机构编码" },
        { "key": "creditInstitutional", "label": "授信机构" },
        { "key": "loanAmount", "label": "借款金额(元)" },
        { "key": "balance", "label": "余额(元)" },
        { "key": "startDate", "label": "起始日期" },
        { "key": "deadline", "label": "截止日期" },
        { "key": "guaranteeMethod", "label": "担保方式" },
        { "key": "mortgageType", "label": "抵押类型" },
        { "key": "fiveLevel", "label": "五级分类" },
        { "key": "curOverdueMonth", "label": "当前逾期月份" },
        { "key": "querySource", "label": "数据来源" },
        { "key": "repeat", "label": "是否与征信重复" }
      ],
      "rows": [
        {
          "borrowingEntity": "连云港惟美数智家居科技有限公司（征信查询日期: 2024-08-27）",
          "principalRole": "承租人",
          "leaseLoanTotal": "4,005,800.00",
          "nonLeaseLoanTotal": "0.00",
          "businessType": "融资型租赁",
          "institutionalCode": "本机构",
          "creditInstitutional": "—",
          "loanAmount": "2,628,700.00",
          "balance": "2,249,200.00",
          "startDate": "2024-04-16",
          "deadline": "2027-03-16",
          "guaranteeMethod": "保证",
          "mortgageType": "—",
          "fiveLevel": "正常",
          "curOverdueMonth": "0",
          "querySource": "征信查询",
          "repeat": "—"
        }
      ],
      "summary": {
        "index": "合计",
        "leaseLoanTotal": "4,755,600.00",
        "nonLeaseLoanTotal": "32,119,100.00",
        "loanAmount": "38,426,900.00",
        "balance": "36,874,700.00"
      },
      "emptyText": "暂无企业借款数据"
    },
    {
      "blockKey": "personLoanList",
      "label": "个人借款",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "borrowingEntity", "label": "借款主体" },
        { "key": "businessCategory", "label": "业务大类" },
        { "key": "guaranteeMethod", "label": "担保方式" },
        { "key": "accountNum", "label": "账户数量" },
        { "key": "loanAmount", "label": "借款金额(元)" },
        { "key": "balance", "label": "余额(元)" },
        { "key": "overdueMonths", "label": "累计逾期月数" },
        { "key": "overdueAccountNum", "label": "当前逾期账户数" },
        { "key": "maxOverdueMonths", "label": "最长逾期月数" },
        { "key": "maxOverdueAmount", "label": "最大逾期金额(元)" },
        { "key": "balanceDue", "label": "近一个月到期金额(元)" },
        { "key": "queryTimes", "label": "近三个月被其他机构查询贷款审批及担保资格的次数" },
        { "key": "querySource", "label": "数据来源" }
      ],
      "rows": [
        {
          "borrowingEntity": "肖令权（征信查询日期: 2025-06-29）",
          "businessCategory": "被追偿",
          "guaranteeMethod": "—",
          "accountNum": "—",
          "loanAmount": "—",
          "balance": "—",
          "overdueMonths": "—",
          "overdueAccountNum": "—",
          "maxOverdueMonths": "—",
          "maxOverdueAmount": "—",
          "balanceDue": "—",
          "queryTimes": "0",
          "querySource": "征信查询"
        },
        {
          "borrowingEntity": "肖令权（征信查询日期: 2025-06-29）",
          "businessCategory": "贷款(非房贷)",
          "guaranteeMethod": "信用及保证",
          "accountNum": "9",
          "loanAmount": "144,900.00",
          "balance": "20,503.00",
          "overdueMonths": "0",
          "overdueAccountNum": "0",
          "maxOverdueMonths": "0",
          "maxOverdueAmount": "0.00",
          "balanceDue": "0.00",
          "queryTimes": "0",
          "querySource": "征信查询"
        },
        {
          "borrowingEntity": "肖令权（征信查询日期: 2025-06-29）",
          "businessCategory": "贷记卡",
          "guaranteeMethod": "信用及保证",
          "accountNum": "1",
          "loanAmount": "5,000.00",
          "balance": "3,428.00",
          "overdueMonths": "3",
          "overdueAccountNum": "0",
          "maxOverdueMonths": "1",
          "maxOverdueAmount": "714.00",
          "balanceDue": "579.00",
          "queryTimes": "0",
          "querySource": "征信查询"
        }
      ],
      "summary": {
        "index": "合计",
        "loanAmount": "149,900.00",
        "balance": "23,931.00",
        "maxOverdueAmount": "714.00",
        "balanceDue": "579.00"
      },
      "emptyText": "暂无个人借款数据"
    },
    {
      "blockKey": "externalGuaranteeSituationList",
      "label": "对外担保情况",
      "displayType": "table",
      "showIndex": true,
      "columns": [
        { "key": "borrowingEntity", "label": "担保主体" },
        { "key": "principalRole", "label": "主体角色" },
        { "key": "guaranteedEntity", "label": "被担保主体" },
        { "key": "businessType", "label": "业务类型" },
        { "key": "balance", "label": "余额(元)" },
        { "key": "startDate", "label": "起始日期" },
        { "key": "deadline", "label": "截止日期" },
        { "key": "fiveLevel", "label": "五级分类" },
        { "key": "curOverdueMonth", "label": "当前逾期月数" },
        { "key": "loanExists", "label": "是否存在对应借款" },
        { "key": "querySource", "label": "数据来源" }
      ],
      "rows": [
        {
          "borrowingEntity": "连云港惟美数智家居科技有限公司（征信查询日期: 2024-08-27）",
          "principalRole": "承租人",
          "guaranteedEntity": "—",
          "businessType": "—",
          "balance": "0.00",
          "startDate": "—",
          "deadline": "—",
          "fiveLevel": "—",
          "curOverdueMonth": "0",
          "loanExists": "否",
          "querySource": "征信查询"
        }
      ],
      "summary": {
        "index": "合计",
        "balance": "44,603,900.00"
      },
      "emptyText": "暂无对外担保数据"
    },
    {
      "blockKey": "liabilityStatement",
      "label": "负债说明",
      "displayType": "longText",
      "value": "负债说明1"
    }
  ]
}
```

---

## 十、输出约束

1. 必须携带 `moduleIndex: 11`
2. 输出 JSON，**不包含 HTML 标签**
3. 字段名使用中文 `label`；英文字段名仅用于取值匹配
4. 空值统一填 `—`
5. `liabilityAnalysis` 缺失时：**整模块不输出**
6. `blocks` 顺序严格按第六节
7. 宽表完整输出全部列于**单个** table block；叠行由 L2 处理（`stackSpan` 跨行固定列 + 其余配对；**不**按 16 列拆表）
8. 不输出筛选、更新、新增删除等交互控件

---

## 十一、与 L2 协作约定

1. 本模块展示类型：`direct`、`group`（仅标题）、`table`（含 `summary` / `stackSpan` / `mergeSame` / `subKey`）、`longText`
2. 企业借款 / 个人借款 / 对外担保均为宽表，适用 `prjc_style_render.md` §5.5.1（单表叠行，物理列不封顶）
3. 借款主体 / 担保主体 / 主体角色 / 租赁与非租赁合计：`stackSpan + mergeSame`；征信日期用 `subKey: queryTime`
4. 五级分类、主体角色在 PDF 中为纯文本；若后续要做色标，由 L2 扩展 `cellType`，本 Skill 仍只传中文值
5. `loanSituationTitle` 的空 `children` group 只渲染小节标题
