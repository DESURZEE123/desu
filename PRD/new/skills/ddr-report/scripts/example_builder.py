"""范式样板 A：声明式 builder（liability_analysis 刚性负债分析）。

这是「平铺型」模块的标准写法——模块只是把若干 block 按顺序排出来，没有循环/分支/透视。
此时 builder **零 import、零函数**，只声明四样数据：

    MODULE_*    模块标识（index/key/title）。index 抄自 00_overview 顺序表，
                key/title 抄自 reference 的「模块标识」表。
    SOURCE      本模块主数据在客户全量 JSON 里的点路径（缺失则整模块不输出）。
    BLOCKS      block 列表，每项一个 dict，"t" 决定类型。

引擎（ddr_engine/dsl.py）负责把 BLOCKS 翻译成 block JSON、再交 render 渲染。
你只填数据，不写任何 Python 逻辑。

BLOCKS 各类型字段见 SKILL.md「声明式块类型」。列定义用紧凑串：
    "key,label[,flag...]"   flag: money/num/trim/roles · right/center ·
                            stack · merge · sub:字段 · sublabel:文案 · roleTag/highlight
"""

MODULE_INDEX = 9
MODULE_KEY = "liability_analysis"
MODULE_TITLE = "刚性负债分析"
SOURCE = "liabilityAnalysis"

BLOCKS = [
    # 1. 数据更新时间：有值才输出（skipBlank）
    {"t": "direct", "key": "updateTime", "label": "征信、中登数据更新时间",
     "path": "updateTime", "fmt": "trim", "skipBlank": True},

    # 2. 借款情况大区标题
    {"t": "heading", "key": "loanSituationTitle", "label": "借款情况"},

    # 3. 企业借款（17 列宽表，前 4 列跨行固定 stackSpan+mergeSame）
    {"t": "table", "key": "companyLoanList", "label": "企业借款",
     "path": "loanSituation.companyLoanList", "showIndex": True,
     "emptyText": "暂无企业借款数据",
     "cols": [
         "borrowingEntity,借款主体,stack,merge,sub:queryTime,sublabel:征信查询日期",
         "principalRole,主体角色,roles,stack,merge",
         "leaseLoanTotal,租赁借款余额合计(元),money,right,stack,merge",
         "nonLeaseLoanTotal,非租赁借款余额合计(元),money,right,stack,merge",
         "businessType,业务类型",
         "institutionalCode,机构编码",
         "creditInstitutional,授信机构",
         "loanAmount,借款金额(元),money,right",
         "balance,余额(元),money,right",
         "startDate,起始日期",
         "deadline,截止日期",
         "guaranteeMethod,担保方式",
         "mortgageType,抵押类型",
         "fiveLevel,五级分类",
         "curOverdueMonth,当前逾期月份",
         "querySource,数据来源",
         "repeat,是否与征信重复",
     ],
     # 合计取自接口 total，不自行重算（cooperation_history 等模块同理）
     "summary": {"loanAmount": "loanSituation.companyLoanTotal.loanAmount",
                 "balance": "loanSituation.companyLoanTotal.balance"}},

    # 4. 个人借款（13 列；不输出 principalRole）
    {"t": "table", "key": "personLoanList", "label": "个人借款",
     "path": "loanSituation.personLoanList", "showIndex": True,
     "emptyText": "暂无个人借款数据",
     "cols": [
         "borrowingEntity,借款主体,stack,merge,sub:queryTime,sublabel:征信查询日期",
         "businessCategory,业务大类",
         "guaranteeMethod,担保方式",
         "accountNum,账户数量",
         "loanAmount,借款金额(元),money,right",
         "balance,余额(元),money,right",
         "overdueMonths,累计逾期月数",
         "overdueAccountNum,当前逾期账户数",
         "maxOverdueMonths,最长逾期月数",
         "maxOverdueAmount,最大逾期金额(元),money,right",
         "balanceDue,近一个月到期金额(元),money,right",
         "queryTimes,近三个月被其他机构查询贷款审批及担保资格的次数",
         "querySource,数据来源",
     ],
     "summary": {"loanAmount": "loanSituation.personLoanTotal.loanAmount",
                 "balance": "loanSituation.personLoanTotal.balance",
                 "maxOverdueAmount": "loanSituation.personLoanTotal.maxOverdueAmount",
                 "balanceDue": "loanSituation.personLoanTotal.balanceDue"}},

    # 5. 对外担保情况（11 列）
    {"t": "table", "key": "externalGuaranteeSituationList", "label": "对外担保情况",
     "path": "externalGuaranteeSituationList", "showIndex": True,
     "emptyText": "暂无对外担保数据",
     "cols": [
         "borrowingEntity,担保主体,stack,merge,sub:queryTime,sublabel:征信查询日期",
         "principalRole,主体角色,roles,stack,merge",
         "guaranteedEntity,被担保主体",
         "businessType,业务类型",
         "balance,余额(元),money,right",
         "startDate,起始日期",
         "deadline,截止日期",
         "fiveLevel,五级分类",
         "curOverdueMonth,当前逾期月数",
         "loanExists,是否存在对应借款",
         "querySource,数据来源",
     ],
     "summary": {"balance": "amountTotal"}},

    # 6. 负债说明：有值才输出
    {"t": "longText", "key": "liabilityStatement", "label": "负债说明",
     "path": "liabilityStatement", "skipBlank": True},
]
