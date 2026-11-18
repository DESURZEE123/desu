"""范式样板 B：函数式 builder（模块有循环 / 分支 / 透视 / 逐条嵌套时用）。

声明式 BLOCKS（见 example_builder.py）只能表达「平铺的固定 block 序列」。当模块需要：
  - 对一个列表逐条展开嵌套 block（担保人 / 关联企业 / 多报价）
  - 按运行时数据动态生成列（透视表的年/月列）
  - A/B 形态分支（不同形态用不同列集）
  - 把一个 dict 转成指标表、按组求和 / 求均值等计算

就改用本范式：写一个 build_blocks(s, ddr) 函数，返回 block 列表。
**但你依然不手搓 dict、不写 Column()/import**——每个 block 都是 ddr.* 一行 helper，
列定义同样用紧凑串 "key,label[,flag...]"（flag 词表见 example_builder.py 顶部）。

引擎按「有 build_blocks 就走函数、否则走 BLOCKS」自动识别，二者可只取其一。

下面是骨架，照你的 reference 改 SOURCE / MODULE_* / build_blocks 体即可。
"""

MODULE_INDEX = 0                      # 抄自 00_overview 顺序表
MODULE_KEY = "your_module_key"        # 抄自 reference「模块标识」
MODULE_TITLE = "你的模块标题"          # 抄自 reference「模块标识」
SOURCE = "yourRootKey"                # 主数据点路径；缺失则整模块不输出


def build_blocks(s, ddr):
    """s = SOURCE 取到的主数据；ddr = helper 命名空间（见 SKILL.md）。

    ddr 常用：
      ddr.get(path)          从客户全量 JSON 取（跨数据根时用，不受 SOURCE 限制）
      ddr.heading(k,label)   大区标题 block
      ddr.direct(k,label,v,fmt=)      单字段
      ddr.longtext(k,label,v)         长文本
      ddr.group(k,label,fields,columns=4,base=None)   键值区；fields 同声明式
      ddr.table(k,label,cols,rows,empty_text=,show_index=,summary=)   rows 是你算好的 list[dict]
      ddr.litigation(k,label,node)    司法诉讼卡片（node 是 judicialLitigationInfo 节点）
      ddr.measure(k,label,list)       担保措施卡片
      ddr.synopsis(k,list)            关联企业概要卡片
      ddr.detail(k,dt,childBlocks,label=,name=,code=)   嵌套详情容器
      ddr.money(v)/ddr.num(v)/ddr.text(v)/ddr.fmt(v,name)   取值格式化
      ddr.join(list,field=,sep="、")  列表拼接（取每项 field 或项本身）
    """
    blocks = []

    # —— 例 1：平铺块，和声明式一样简单 ——
    blocks.append(ddr.heading("title", "基本信息"))
    blocks.append(ddr.group("baseInfo", None, [
        "客户名称,baseInfo.customerName",
        "注册资本(万元),baseInfo.rgstrdCapital,money",
        "注册地址,baseInfo.rgstrdAddress,full",
    ], columns=4))

    # —— 例 2：把一个 dict 转成「指标→结果」表（rows 自己拼）——
    risk = s.get("environmentAndSocialRisk") or {}
    indicator_rows = [
        {"indicator": "拟承租人经营活动是否涉及业务排除清单", "result": ddr.text(risk.get("exclusionBusinessResult"))},
        {"indicator": "评估结论（高、中、低）", "result": ddr.text(risk.get("assessResult"))},
    ]
    blocks.append(ddr.table("env", "环境与社会风险评估",
                            ["indicator,指标", "result,结果"], indicator_rows,
                            show_index=False, empty_text="暂无评估信息"))

    # —— 例 3：对一个列表逐条展开嵌套详情（detail + childBlocks）——
    for item in s.get("associatedCompanyList") or []:
        no = item.get("customerNo")
        children = [
            ddr.group("baseInfo", "基本信息", [
                "企业名称,baseInfo.customerName",
                "与承租人关系,relationTypes",          # 见例 4，多值需 ddr.join
            ], base=item),
            ddr.longtext("mainBusiness", "主营业务", item.get("baseInfo", {}).get("mainBusiness")),
            ddr.litigation("judicialLitigationInfo", "司法诉讼信息", item.get("judicialLitigationInfo")),
        ]
        blocks.append(ddr.detail(
            f"company_{no}", "associateCompanyDetail", children,
            name=item.get("baseInfo", {}).get("customerName"),
            code=item.get("baseInfo", {}).get("crdntlsCode")))

    # —— 例 4：多值字段用 ddr.join 拼接；条件字段用 if 控制是否 append ——
    # relation = ddr.join(item.get("relationTypes"))   # ["其它","股东"] → "其它、股东"
    # if item.get("controllerIntroduction"):
    #     blocks.append(ddr.longtext("ctrl", "实控人介绍", item["controllerIntroduction"]))

    return blocks
