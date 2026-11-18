---
name: ddr-report
description: 小企业尽调报告生成。读取 input.json 尽调客户全量数据，为每个业务模块编写「声明式 / 函数式」builder（L1 取数+字段映射），由预置引擎 ddr_engine（L2）渲染成统一样式的 HTML 报告。当需要把尽调项目大 JSON 渲染成尽调调查报告 HTML/PDF 时使用。
---

# 尽调报告生成技能（代码生成路线）

把 `/app/work/input.json`（尽调客户全量数据，**很大，禁止整份读进上下文**）渲染成
`/app/work/report.html`（完整尽调调查报告）。每个业务模块 = 一个 builder 文件，
你只产出 builders，总装由预置脚本完成。

---

## 1. 职责边界（先记住这三条）

- **你只写 L1**：从 input 取本模块数据 → 映射成 block → 交给引擎。展示什么由你定。
- **L2 渲染是预置黑盒**：`ddr_engine/` 已实现全部样式，**禁止重写、禁止读源码去"搞懂"**。
  你只通过本文给出的「声明式 BLOCKS」或「`ddr.*` helper」调用它。
- **总装是预置脚本**：`build_report.py` 已写好（发现 builders → 渲染 → 排序 → 套壳 → 落盘），
  **你不写、不改、不复制它**。你只需在 builders 写完后运行它。

## 2. 绝对不要读的文件（省上下文、省时间）

读了也不会让你写得更好，纯浪费 token：

| 不要读 | 原因 |
| ---- | ---- |
| `scripts/ddr_engine/*.py`（render/dsl/blocks/spec/fmt/transforms/html_template/markdown） | 引擎内部实现，你只调用不重写。需要的 API 本文第 7、8 节已列全。 |
| `scripts/ddr_engine/report.css` | 固定样式，引擎自动注入。 |
| `scripts/build_report.py`、`scripts/check_html.py` | 预置脚本，照第 10 节运行即可，不必看内容。 |
| `reference/style_render.md` | L2 的完整 schema，**正常一个模块都用不到**（DSL 已封装）。仅当遇到 `ddr.*` 没覆盖的自定义块时才翻。 |

**该读的只有**：本文 + `reference/00_overview.md` + **你当前那个模块**的 `reference/<module>.md`。
绝不一次性读全部 reference。`input.json` 只许跑探针看结构（第 9 节），禁止整读。

## 3. reference 是规格权威，照抄即可，别停下来问

各模块 `reference/<module>.md` 就是该模块的完整规格。你只需从中抄四样：
**字段映射表、列定义、displayType、输出规则（缺失/空值怎么处理）**。

- **取数路径**以 `00_overview.md` 第三节「校正表」为准（优先级高于 reference 正文）。
- reference 偶有描述前端外观的措辞（「渲染效果」「前端控件不输出」等）——那是帮你判断**哪些字段不进 PDF**，
  照做即可，不必纠结网页长什么样。
- **遇到任何标注「暂定 / 以实际为准 / 见固定口径」的项：按文档给的口径直接实现，不要停下来提问、不要反复确认**。
  本技能要求自主跑通，所有这类点 reference 都已给出明确口径。

## 4. 模块是"发现"出来的，不是写死的

本技能不假设有多少模块。**有哪些模块 = `reference/` 下有哪些 `<module>.md`**
（`00_overview.md`、`style_render.md` 不是模块）。开工先：

```bash
ls /app/skills/ddr-report/reference/
```

每个模块的 **章节顺序（moduleIndex）、moduleKey、moduleName、取数根（SOURCE）** 都在
`reference/00_overview.md` 第二节的「章节顺序表」里——这是**权威表**，三个常量照抄它对应行。
未来增删模块只是增删 reference 文件，你的代码结构不变（一模块一 builder）。

## 5. 目录与产物

```
/app/work/input.json                  输入：客户全量大 JSON（已写盘，别 cat）
/app/work/builders/<module>.py        ★ 你为每个模块写的 builder（唯一产物）
/app/work/report.html                 最终报告（build_report.py 生成，你不手写）
/app/skills/ddr-report/
├── SKILL.md                          本文
├── reference/
│   ├── 00_overview.md                ★ 总控：章节顺序表 + 取数路径校正表 + <title> 规则
│   ├── style_render.md               L2 完整 schema（一般不读，见第 2 节）
│   └── <module>.md                   ★ 各模块 L1 规格（每次只读你负责的那个）
└── scripts/
    ├── ddr_engine/                   预置引擎（黑盒，不读不改）
    ├── build_report.py               预置总装驱动（不写不改，只运行）
    ├── check_html.py                 预置 HTML 自检（只运行）
    ├── example_builder.py            ★ 范式A：声明式 builder 成品（=liability_analysis）
    └── builder_template.py           ★ 范式B：函数式 builder 骨架
```

## 6. builder 契约（混合式：声明式优先）

每个 `/app/work/builders/<module>.py` 顶部必须有四个常量，值抄自 `00_overview.md` 顺序表：

```python
MODULE_INDEX = 9                  # 章节顺序，抄顺序表 moduleIndex
MODULE_KEY   = "liability_analysis"   # 抄 moduleKey
MODULE_TITLE = "刚性负债分析"          # 抄 moduleName
SOURCE       = "liabilityAnalysis"    # 本模块主数据在客户全量 JSON 里的点路径
```

`SOURCE` 解析为 `None` → 整模块不输出。引擎自动识别下面两种写法，**二选一**：

### 6.1 声明式（首选）—— 模块平铺、无循环分支时

**零 import、零函数**，只声明一个 `BLOCKS` 列表，每项一个 dict、`"t"` 决定类型。
适合"把若干 block 按顺序排出来"的模块。**直接照抄 `example_builder.py`**：

```python
SOURCE = "liabilityAnalysis"
BLOCKS = [
    {"t": "heading", "key": "loanSituationTitle", "label": "借款情况"},
    {"t": "table", "key": "companyLoanList", "label": "企业借款",
     "path": "loanSituation.companyLoanList", "emptyText": "暂无企业借款数据",
     "cols": ["borrowingEntity,借款主体,stack,merge,sub:queryTime,sublabel:征信查询日期",
              "loanAmount,借款金额(元),money,right", "balance,余额(元),money,right"],
     "summary": {"loanAmount": "loanSituation.companyLoanTotal.loanAmount"}},
    {"t": "longText", "key": "liabilityStatement", "label": "负债说明", "skipBlank": True},
]
```

### 6.2 函数式（补充）—— 有循环 / 分支 / 透视 / 逐条嵌套时

声明式表达不了时（逐条展开担保人、动态年月列、A/B 形态分支、按组求和），写一个
`build_blocks(s, ddr)`：`s` 是 SOURCE 取到的主数据，`ddr` 是 helper 命名空间。
**仍然不手搓 dict、不写 `Column()`、不 import 引擎**——每个 block 一行 `ddr.*`。
照抄 `builder_template.py` 骨架：

```python
SOURCE = "associatedCompanyModule"
def build_blocks(s, ddr):
    blocks = [ddr.synopsis("synopsis", s.get("associatedCompanySynopsisList"))]
    for c in s.get("associatedCompanyList") or []:
        no = c.get("customerNo")
        children = [
            ddr.group("baseInfo", "基本信息",
                      ["企业名称,baseInfo.customerName", "注册资本(万元),baseInfo.rgstrdCapital,money"],
                      base=c),
            ddr.litigation("lit", "司法诉讼信息", c.get("judicialLitigationInfo")),
        ]
        blocks.append(ddr.detail(f"company_{no}", "associateCompanyDetail", children,
                                 name=c.get("baseInfo", {}).get("customerName")))
    return blocks
```

> 跨数据根取值用 `ddr.get("projectBaseInfo.capitalUse")`（不受 SOURCE 限制）。

## 7. DSL 词汇表（声明式 BLOCKS 用；权威实现在引擎，本文即全部所需）

**块类型 `"t"`**：

| `t` | 必填 | 可选 | 产出 |
| --- | --- | --- | --- |
| `direct` | key,label | path(默认=key),fmt,skipBlank | 单字段 |
| `heading` | key,label | — | 大区标题（**不带 children**） |
| `longText` | key,label | path,skipBlank,emptyToDash | 长文本 |
| `table` | key,label,cols | path,showIndex(默认True),emptyText,summary | 表格 |
| `group` | key,fields | label,columns(默认4) | 键值区 |
| `litigation` | key,label | path | 司法诉讼卡片 |
| `measure` | key,label | path,emptyText | 担保措施卡片 |
| `synopsis` | key | path | 关联企业概要卡片（无 label） |
| `empty` | key | label,emptyText | 空表占位 |

**块级开关**：`skipBlank`（值空则不输出该块）· `showIfAnyNonEmpty:[路径...]`（任一非空才输出）·
`emptyToDash`（longText 空值转「—」而非不输出）。

**列定义紧凑串**（`cols` 内每项）：`"key,label[,flag...]"`

> ⚠️ table 列是 **key 在前、label 在后**；group 字段相反，见下。label 不要含英文逗号。

| flag | 作用 |
| --- | --- |
| `money` `num` `trim` `roles` | 格式化器（金额千分位 / 数字 / 去空白 / 角色数组）；默认 `text` |
| `right` `center` | 对齐（默认 left 不写） |
| `stack` | 宽表叠行时该列跨行固定（stackSpan） |
| `merge` | 同值纵向合并（mergeSame） |
| `sub:字段` `sublabel:文案` | 单元格副行（如主体名下挂"征信查询日期"） |
| `roleTag` `highlight` | 单元格扩展渲染（主体角色色标 / 银行流水差异高亮）；`roleTag` 自动保留数组 |

**group 字段紧凑串**（`fields` 内每项）：`"label,path[,fmt[,flag]]"` —— **label 在前、path 在后**，
path 相对 SOURCE。flag：`full`（整行）· `person`（人员卡）· `longText`（长文本，自动整行）。
也可用 dict：`{"label":..,"path":..}` 或 `{"label":..,"const":已算好的值}`。

**summary（合计行）**：dict `{输出列key: 来源}`。来源以 `=` 开头是字面常量（如 `"=合计"`），
否则是相对 SOURCE 的点路径，按该列 fmt 格式化。序号位自动填「合计」。**优先取接口给的 total 字段，
不要自己重算**（除非 reference 明确要求加总）。

## 8. `ddr.*` helper 速查（函数式 build_blocks 用）

```
取值/格式化   ddr.get(path[,base]) · ddr.blank(v) · ddr.money(v) · ddr.num(v) · ddr.text(v)
              ddr.fmt(v,name) · ddr.join(list,field=,sep="、")
产 block      ddr.heading(key,label) · ddr.direct(key,label,value,fmt=) · ddr.longtext(key,label,value)
              ddr.table(key,label,cols,rows,empty_text=,show_index=,summary=,base=,path=)
              ddr.group(key,label,fields,columns=4,base=None)
              ddr.litigation(key,label,node) · ddr.measure(key,label,list,empty_text=)
              ddr.synopsis(key,list) · ddr.detail(key,dt,childBlocks,label=,name=,code=)
```

`ddr.table` 的 `rows` 传你算好的 `list[dict]`；`ddr.group` 的 `base` 指定字段相对的子对象。
`cols`/`fields` 紧凑串语法与第 7 节完全一致。`if not ddr.blank(x):` 实现"有值才输出"。

## 9. 探查 input.json（理解字段，但别把数据读进上下文）

写 builder 前，用 SOURCE 探一下真实结构骨架（keys / 类型 / 列表长度 / 首条字段名），
**只 print 骨架，绝不 print 整个对象**：

```bash
cd /app/work && python -c "
import json
ci = json.load(open('/app/work/input.json', encoding='utf-8'))
s = ci.get('liabilityAnalysis') or {}
print(list(s.keys()))
print('companyLoanList len =', len(s.get('loanSituation',{}).get('companyLoanList') or []))
"
```

路径若与 reference 正文不符，以 `00_overview.md` 第三节校正表为准。

## 10. 运行与自检

builders 全部写完后（**不要自己写总装脚本**）：

```bash
cd /app/work
python /app/skills/ddr-report/scripts/build_report.py          # 发现 builders→渲染→排序→落盘
python /app/skills/ddr-report/scripts/check_html.py /app/work/report.html   # 必须全 PASS
```

`build_report.py` 会打印 `modules: N`（拼进报告的模块数）和 `skipped: ...`（SOURCE 缺失被跳过的）。
check_html 有 FAIL → 回到对应 builder 修 → 重跑，直到 PASS。

**单模块自检**（可选，fan-out 时子 agent 用它早失败，不碰别人的 builder、不总装）：
写 `/app/work/builders/_probe_<module>.py`（下划线开头，build_report 会自动忽略）：

```python
import sys, json, importlib.util
sys.path.insert(0, "/app/skills/ddr-report/scripts")
from ddr_engine.dsl import build_from_spec
spec = importlib.util.spec_from_file_location("m", "/app/work/builders/<module>.py")
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
ci = json.load(open("/app/work/input.json", encoding="utf-8"))
b = build_from_spec(ci, m)
print("blocks:", len(b) if b else None)   # 只打印数量，不把数据读进上下文
```

## 11. 作业流程（含并行 fan-out）

> 编排是**你（主 agent）**的职责。子 agent 之间互相隔离、看不到你的对话。

1. 读本文 + `reference/00_overview.md`（顺序表、校正表、title 规则）。`ls reference/` 得模块清单。
2. **先跑通 1 个模块验证范式**：`example_builder.py` 本身就是 `liability_analysis` 的成品，
   直接 `cp /app/skills/ddr-report/scripts/example_builder.py /app/work/builders/liability_analysis.py`，
   跑第 10 节两条命令，确认引擎链路 + check_html 全 PASS。范式错了此时只返工一个。
3. **并行 fan-out 其余模块**：在**一条消息里发多个 `task`**（`subagent_type="module-builder"`），
   一个子 agent 包一个模块。每个 `task` 的 `description` **必须自包含**（子 agent 看不到你的上下文），
   照这个模板写：
   > 为尽调报告的【<moduleName>】模块编写 builder。
   > 先 `read_file /app/skills/ddr-report/SKILL.md` 和 `reference/00_overview.md`，
   > 再读 `reference/<module>.md`（照抄字段映射/列定义/displayType/输出规则，遇到"暂定/见固定口径"直接实现别提问，见 SKILL.md 第 3 节）。
   > 用 SOURCE=`<取数根>`，产出 `/app/work/builders/<module>.py`，满足 SKILL.md 第 6 节 builder 契约
   > （声明式优先；复杂才用 build_blocks(s,ddr)）。**不要读 ddr_engine 源码、不要写 build_report.py、
   > 不要跑总装**。写完用 SKILL.md 第 10 节的 `_probe_<module>.py` 自检能产出 blocks 即可。
4. **fan-out 宽度**：一批 3–4 个 `task`，别一次全发（共享沙箱传输层并发过高易抖动）。
   某个子 agent 失败，只重发**那一个模块**，不要整批重来。
5. **fan-in 总装**：所有 builder 回来后，**由你（主 agent）**跑第 10 节的 build_report + check_html，
   修到全 PASS。`report.html` 只在这一步、只由你生成一次。

**为什么并行不会写冲突**：每个子 agent 只写自己的 `builders/<module>.py`，路径天然不重叠；
共享产物 `report.html` 只由主 agent 在 fan-in 后生成。引擎按文件隔离，无共享可变状态。

## 12. 运行约定（否则跑不起来）

- **Python 3.11**，禁用 3.12+ 语法。尤其 **f-string 表达式里不能有反斜杠**
  （`f'{(" class=\"" + x)}'` 会 SyntaxError）。要拼带引号的属性，先算到变量再插值：
  ```python
  cls = (' class="' + c + '"') if c else ''
  td = f'<td{cls}>{val}</td>'
  ```
- builder 文件**不需要任何 import**（声明式纯数据；函数式只用注入的 `s`/`ddr`）。

## 13. 质量红线

- **不加工数据**：缺失字段用引擎的 `—` 占位（fmt 自动处理），不计算、不补充、不筛选
  （reference 明确要求的合计/求和除外）。
- **金额千分位**：列加 `money` flag，别自己格式化。
- **行数零丢失**：表格 rows 必须全量映射，不许截断。
- **章节顺序**：靠每个 builder 的 `MODULE_INDEX`，build_report.py 自动升序拼接，你不用管。
- **标题**：`<title>` 由引擎按 `00_overview.md` 第四节自动生成，**任何 builder 都不要处理标题**。
