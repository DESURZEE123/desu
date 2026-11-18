"""render 引擎：block JSON → 模块 body HTML 片段，等价替代 render_* 节点的 LLM 调用。

严格实现 RENDER_SYSTEM + 旧 L2 §5.5.1 的 HTML 规格；class 名与 report.css 一一对齐
（CSS 里存在的 107 个 class 是权威清单，渲染器只用其中的，不自造）。

零 LLM、确定性。覆盖全部 16 种 displayType（empty 实测从不产出，故不实现）：
  direct/person · sectionHeading · longText · group · table（标准/叠行）
  measureList · analysisList（含 Markdown）· labelPanel · litigationCards
  associateCompanySynopsis · associateCompanyDetail · guaranteePersonDetail
  guaranteeCompanyDetail · fsSubjectHeader · financialStatementTable

递归：associateCompanyDetail / guarantee*Detail 的 childBlocks 复用 render_block 分发。
"""

from __future__ import annotations

import html
from typing import Any

from .fmt import EMPTY
from .markdown import markdown_to_html

# 叠行宽表触发阈值：逻辑列数 > STACKED_THRESHOLD 走叠行，否则标准单行表
STACKED_THRESHOLD = 8

# group columns → cell 宽度 class 后缀（RENDER_SYSTEM 宽度映射）
_GRID_WIDTH = {1: "100", 2: "50", 3: "33", 4: "25", 5: "20"}

# measureList guaranteeTone → tag class 后缀；缺省 default
_MEASURE_TONE = {"guarantee", "mortgage", "pledge"}

# associateCompanySynopsis guarantorTone 直接用作 tag class 后缀（guarantor/nonGuarantor）

# roleTag 角色 → tone（RENDER_SYSTEM）
_ROLE_TONE = {"承租人": "lessee", "担保人": "guarantor", "关联企业": "related"}


def esc(value: Any) -> str:
    """HTML 转义（< > & " ），防注入。所有写入 HTML 的动态文本都过这里。"""
    return html.escape("" if value is None else str(value), quote=True)


def _align_class(align: str | None) -> str:
    if align == "center":
        return "report-table__cell--align-center"
    if align == "right":
        return "report-table__cell--align-right"
    return ""


def _section_title(label: str) -> str:
    """表格/列表上方的圆点标题。"""
    return (
        '<div class="report-section-title">\n'
        '    <span class="report-section-title__dot"></span>\n'
        f'    <span class="report-section-title__text">{esc(label)}</span>\n'
        "  </div>"
    )


# ---- 基础 displayType ----


def render_direct(block: dict) -> str:
    label = esc(block.get("label"))
    value = esc(block.get("value"))
    return (
        '<div class="report-kv">\n'
        f'  <span class="report-kv__label">{label}：</span>\n'
        f'  <span class="report-kv__value">{value}</span>\n'
        "</div>"
    )


def render_section_heading(block: dict) -> str:
    label = esc(block.get("label"))
    return f'<div class="report-block">\n  <div class="report-section-heading">{label}</div>\n</div>'


def render_long_text(block: dict) -> str:
    label = esc(block.get("label"))
    value = esc(block.get("value"))
    return (
        '<div class="report-block report-longtext">\n'
        f'  <div class="report-longtext__label">{label}：</div>\n'
        f'  <div class="report-longtext__value">{value}</div>\n'
        "</div>"
    )


def render_group(block: dict) -> str:
    """分组键值对区域。value={columns, groups[]}，子项仅 direct/person/longText。"""
    value = block.get("value") or {}
    groups: list[dict] = value.get("groups") or []
    columns = int(value.get("columns") or 4)
    width = _GRID_WIDTH.get(columns, "25")
    label = block.get("label")

    parts: list[str] = ['<div class="report-block report-group">']
    if label:
        parts.append(
            '<div class="report-section-title">\n'
            '    <span class="report-section-title__dot"></span>\n'
            f'    <span class="report-section-title__text">{esc(label)}</span>\n'
            "  </div>"
        )
    parts.append('<div class="report-grid">')
    for child in groups:
        # 子项 fullWidth 或 longText 强制 w-100
        if child.get("fullWidth") or child.get("displayType") == "longText":
            cell_w = "100"
        else:
            cell_w = width
        parts.append(f'<div class="report-grid__cell report-grid__cell--w-{cell_w}">')
        parts.append(_render_inner_child(child))
        parts.append("</div>")
    parts.append("</div>")
    parts.append("</div>")
    return "\n  ".join(parts)


def _render_inner_child(child: dict) -> str:
    """group 子项渲染：仅 direct/person → report-kv；longText → report-longtext。"""
    dt = child.get("displayType")
    label = esc(child.get("label"))
    value = esc(child.get("value"))
    if dt == "longText":
        return (
            '<div class="report-longtext">\n'
            f'    <div class="report-longtext__label">{label}：</div>\n'
            f'    <div class="report-longtext__value">{value}</div>\n'
            "  </div>"
        )
    # direct / person
    return (
        '<div class="report-kv">\n'
        f'    <span class="report-kv__label">{label}：</span>\n'
        f'    <span class="report-kv__value">{value}</span>\n'
        "  </div>"
    )


# ---- table ----


def render_table(block: dict) -> str:
    value = block.get("value") or {}
    label = block.get("label") or ""
    columns: list[dict] = value.get("columns") or []
    rows: list[dict] = value.get("rows") or []
    empty_text = value.get("emptyText") or "暂无数据"

    if not rows:
        return (
            '<div class="report-block report-table-block">\n'
            f"  {_section_title(label)}\n"
            f'  <div class="report-table-empty">{esc(empty_text)}</div>\n'
            "</div>"
        )

    # 两级表头（columns[].children）：复杂表，如「开票系统中前五大客户」年度大列 × 子列
    if any(isinstance(c, dict) and c.get("children") for c in columns):
        return _render_two_level_table(label, columns, rows, value)

    if len(columns) > STACKED_THRESHOLD:
        return _render_stacked_table(label, columns, rows, value)
    return _render_standard_table(label, columns, rows, value)


def _cell_inline(value: Any) -> str:
    """普通单元格值：字符串直接转义；{value,cellType:highlight} 解包并加高亮 span。

    对齐 RENDER_SYSTEM：highlight 不替换展示值，只是额外包一层高亮 class。
    roleTag（string[]）渲染为多个 report-role-tag。
    """
    if isinstance(value, dict):
        inner = value.get("value")
        cell_type = value.get("cellType")
        if cell_type == "highlight":
            return f'<span class="report-table__cell--highlight">{esc(inner)}</span>'
        return esc(inner)
    if isinstance(value, list):
        # roleTag：每个角色一个 tag
        tags = "".join(
            f'<span class="report-role-tag report-role-tag--{_ROLE_TONE.get(str(v), "related")}">'
            f"{esc(v)}</span>"
            for v in value
        )
        return tags
    return esc(value)


def _cell_text(row: dict, col: dict) -> str:
    """取单元格展示文本，处理 subKey 副文案。

    subKey 有值时主值下方追加 report-table__entity-sub。副文案前缀（如「征信查询日期」）
    是模块特有规则，用列的 subLabel 还原；subKey 值为空/"—" 时不输出副行。
    """
    main = _cell_inline(row.get(col["key"], EMPTY))
    sub_key = col.get("subKey")
    if not sub_key:
        return main
    sub_val = row.get(sub_key)
    if sub_val is None or str(sub_val).strip() in ("", EMPTY):
        return main
    prefix = col.get("subLabel")
    inner = f"{esc(prefix)}: {esc(sub_val)}" if prefix else esc(sub_val)
    return f'{main}\n        <span class="report-table__entity-sub">（{inner}）</span>'


def _render_standard_table(label: str, columns: list[dict], rows: list[dict],
                           value: dict) -> str:
    """标准单行表（≤8 列）。支持 mergeSame rowspan + detail 展开行。"""
    show_index = bool(value.get("showIndex"))
    total_cols = len(columns) + (1 if show_index else 0)

    head: list[str] = ["<tr>"]
    if show_index:
        head.append("<th>序号</th>")
    for col in columns:
        ac = _align_class(col.get("align"))
        cls = f' class="{ac}"' if ac else ""
        head.append(f"<th{cls}>{esc(col['label'])}</th>")
    head.append("</tr>")

    # mergeSame 列的 run（标准表 rowspan = 连续行数）
    runs_by_key = {c["key"]: _merge_runs_map(rows, c["key"], multiply=1)
                   for c in columns if c.get("mergeSame")}

    body: list[str] = []
    for idx, row in enumerate(rows):
        body.append("<tr>")
        if show_index:
            body.append(f"<td>{idx + 1}</td>")
        for col in columns:
            key = col["key"]
            if col.get("mergeSame"):
                span = runs_by_key[key].get(idx, 1)
                if span == 0:
                    continue
            else:
                span = 1
            ac = _align_class(col.get("align"))
            attrs = []
            if ac:
                attrs.append(f'class="{ac}"')
            if span > 1:
                attrs.append(f'rowspan="{span}"')
            attr_str = (" " + " ".join(attrs)) if attrs else ""
            body.append(f"<td{attr_str}>{_cell_text(row, col)}</td>")
        body.append("</tr>")
        # detail 展开行
        detail = row.get("detail")
        if detail:
            body.append(_render_detail_row(detail, total_cols))

    summary = value.get("summary")
    if summary:
        body.append('<tr class="report-table__summary-row">')
        if show_index:
            body.append('<td class="report-table__cell--strong">'
                        f'{esc(summary.get("index", "合计 --"))}</td>')
        for col in columns:
            cell = summary.get(col["key"], EMPTY)
            body.append(f'<td class="report-table__cell--strong">{esc(cell)}</td>')
        body.append("</tr>")

    return (
        '<div class="report-block report-table-block">\n'
        f"  {_section_title(label)}\n"
        '  <table class="report-table">\n'
        f'    <thead>\n      {"".join(head)}\n    </thead>\n'
        f'    <tbody>\n      {chr(10).join(body)}\n    </tbody>\n'
        "  </table>\n"
        "</div>"
    )


def _render_two_level_table(label: str, columns: list[dict], rows: list[dict],
                            value: dict) -> str:
    """两级表头表：顶层列含 {label, children:[子列]}，如「开票系统中前五大客户」。

    表头 2 行：平铺列 rowspan=2；父列 colspan=len(children)，子列铺在第 2 行。
    数据行按「叶子列」顺序（平铺列 + 各父列子列，保持声明序）逐格输出；
    平铺列支持 mergeSame 跨行合并（主体名称/角色）。复用叠行表的表头样式类。
    """
    show_index = bool(value.get("showIndex"))

    # 叶子列顺序：(列定义, 是否顶层平铺列)；只有顶层平铺列参与 mergeSame
    body_cols: list[tuple[dict, bool]] = []
    for c in columns:
        if c.get("children"):
            body_cols.extend((ch, False) for ch in c["children"])
        else:
            body_cols.append((c, True))

    runs_by_key = {c["key"]: _merge_runs_map(rows, c["key"], multiply=1)
                   for c in columns if not c.get("children") and c.get("mergeSame")}

    # 表头第 1 行
    head_top: list[str] = ["<tr>"]
    if show_index:
        head_top.append('<th rowspan="2">序号</th>')
    for c in columns:
        if c.get("children"):
            head_top.append(f'<th colspan="{len(c["children"])}">{esc(c.get("label"))}</th>')
        else:
            ac = _align_class(c.get("align"))
            cls = f' class="{ac}"' if ac else ""
            head_top.append(f'<th rowspan="2"{cls}>{esc(c.get("label"))}</th>')
    head_top.append("</tr>")
    # 表头第 2 行：仅父列的子列
    head_bottom: list[str] = ["<tr>"]
    for c in columns:
        for ch in c.get("children") or []:
            ac = _align_class(ch.get("align"))
            cls = f' class="{ac}"' if ac else ""
            head_bottom.append(f"<th{cls}>{esc(ch.get('label'))}</th>")
    head_bottom.append("</tr>")

    body: list[str] = []
    for idx, row in enumerate(rows):
        cells: list[str] = ["<tr>"]
        if show_index:
            cells.append(f"<td>{idx + 1}</td>")
        for col, is_top in body_cols:
            key = col["key"]
            span = 1
            if is_top and col.get("mergeSame"):
                span = runs_by_key[key].get(idx, 1)
                if span == 0:
                    continue
            ac = _align_class(col.get("align"))
            attrs = []
            if ac:
                attrs.append(f'class="{ac}"')
            if span > 1:
                attrs.append(f'rowspan="{span}"')
            attr_str = (" " + " ".join(attrs)) if attrs else ""
            cells.append(f"<td{attr_str}>{_cell_text(row, col)}</td>")
        cells.append("</tr>")
        body.append("".join(cells))

    summary = value.get("summary")
    if summary:
        sum_cells = ['<tr class="report-table__summary-row">']
        if show_index:
            sum_cells.append('<td class="report-table__cell--strong">'
                             f'{esc(summary.get("index", "合计 --"))}</td>')
        for col, _ in body_cols:
            cell = summary.get(col["key"], EMPTY)
            sum_cells.append(f'<td class="report-table__cell--strong">{esc(cell)}</td>')
        sum_cells.append("</tr>")
        body.append("".join(sum_cells))

    return (
        '<div class="report-block report-table-block">\n'
        f"  {_section_title(label)}\n"
        '  <table class="report-table">\n'
        '    <thead>\n'
        f'      {"".join(head_top)}\n      {"".join(head_bottom)}\n'
        "    </thead>\n"
        f'    <tbody>\n      {chr(10).join(body)}\n    </tbody>\n'
        "  </table>\n"
        "</div>"
    )


def _render_detail_row(detail: dict, total_cols: int) -> str:
    """行内展开详情：全宽栅格，children 为 direct[]。"""
    children: list[dict] = detail.get("children") or []
    columns = int(detail.get("columns") or len(children) or 1)
    width = _GRID_WIDTH.get(columns, "25")
    cells = []
    for child in children:
        cells.append(f'<div class="report-grid__cell report-grid__cell--w-{width}">')
        cells.append(
            '<div class="report-kv">\n'
            f'            <span class="report-kv__label">{esc(child.get("label"))}：</span>\n'
            f'            <span class="report-kv__value">{esc(child.get("value"))}</span>\n'
            "          </div>"
        )
        cells.append("</div>")
    return (
        '<tr class="report-table__detail-row">\n'
        f'        <td colspan="{total_cols}">\n'
        '          <div class="report-table__detail">\n'
        f'            <div class="report-grid">\n              {"".join(cells)}\n            </div>\n'
        "          </div>\n"
        "        </td>\n"
        "      </tr>"
    )


def _merge_runs(rows: list[dict], key: str) -> list[tuple[int, int]]:
    """连续相同非空值 run：返回 [(起始行号, run 长度), ...]。空值各自成 run。"""
    runs: list[tuple[int, int]] = []
    i = 0
    n = len(rows)
    while i < n:
        val = rows[i].get(key)
        j = i
        if val not in (None, "", EMPTY):
            while j + 1 < n and rows[j + 1].get(key) == val:
                j += 1
        runs.append((i, j - i + 1))
        i = j + 1
    return runs


def _merge_runs_map(rows: list[dict], key: str, multiply: int) -> dict[int, int]:
    """run → {行号: rowspan}；run 首行为 length×multiply，其余为 0（不输出 td）。"""
    spans: dict[int, int] = {}
    for start, length in _merge_runs(rows, key):
        spans[start] = length * multiply
        for r in range(start + 1, start + length):
            spans[r] = 0
    return spans


def _render_stacked_table(label: str, columns: list[dict], rows: list[dict],
                          value: dict) -> str:
    """叠行宽表（>8 列）：表头 2 行、每条数据 2 行，stackSpan 跨行、mergeSame 合并。

    物理列顺序：[序号?][各 stackSpan 列][配对列1上/下][配对列2上/下]...
    rowspan 规则（旧 L2 §5.5.1）：序号每条 rowspan=2 不合并；stackSpan 单条=2、
    mergeSame 则 run首行=run长×2、run内后续不输出；配对列不合并。
    """
    show_index = bool(value.get("showIndex"))
    stack_cols = [c for c in columns if c.get("stackSpan")]
    pair_cols = [c for c in columns if not c.get("stackSpan")]
    pairs: list[tuple[dict, dict | None]] = [
        (pair_cols[k], pair_cols[k + 1] if k + 1 < len(pair_cols) else None)
        for k in range(0, len(pair_cols), 2)
    ]

    runs_by_key = {c["key"]: _merge_runs_map(rows, c["key"], multiply=2)
                   for c in stack_cols if c.get("mergeSame")}

    # 表头
    head_top: list[str] = []
    head_bottom: list[str] = []
    if show_index:
        head_top.append('<th rowspan="2">序号</th>')
    for col in stack_cols:
        head_top.append(f'<th rowspan="2">{esc(col["label"])}</th>')
    for top_col, bottom_col in pairs:
        head_top.append('<th><span class="report-table__stack-label">'
                        f'{esc(top_col["label"])}</span></th>')
        bl = bottom_col["label"] if bottom_col else EMPTY
        head_bottom.append('<th><span class="report-table__stack-label">'
                           f'{esc(bl)}</span></th>')

    # 物理列数（detail 全宽 colspan 用）：序号? + stack 列 + 配对组数
    total_cols = (1 if show_index else 0) + len(stack_cols) + len(pairs)

    # 数据行
    body: list[str] = []
    for i, row in enumerate(rows):
        top_cells: list[str] = []
        if show_index:
            top_cells.append(f'<td rowspan="2" class="report-table__index-cell">{i + 1}</td>')
        for col in stack_cols:
            key = col["key"]
            if col.get("mergeSame"):
                span = runs_by_key[key].get(i, 2)
                if span == 0:
                    continue
            else:
                span = 2
            top_cells.append(f'<td rowspan="{span}" class="report-table__span-cell">'
                             f'{_cell_text(row, col)}</td>')
        for top_col, _ in pairs:
            top_cells.append('<td><span class="report-table__stack-value">'
                             f'{_cell_text(row, top_col)}</span></td>')
        body.append(f'<tr class="report-table__data-row--top">{"".join(top_cells)}</tr>')

        bottom_cells: list[str] = []
        for _, bottom_col in pairs:
            bv = _cell_text(row, bottom_col) if bottom_col else EMPTY
            bottom_cells.append('<td><span class="report-table__stack-value">'
                                f'{bv}</span></td>')
        divider = "" if i == len(rows) - 1 else " report-table__record-divider"
        body.append(f'<tr class="report-table__data-row--bottom{divider}">'
                    f'{"".join(bottom_cells)}</tr>')
        # 行内详情栅格：紧跟该记录的 top/bottom 两行之后（合计行无 detail）
        detail = row.get("detail")
        if detail:
            body.append(_render_detail_row(detail, total_cols))

    # 合计行（占 2 行）
    summary = value.get("summary")
    if summary:
        sum_top: list[str] = []
        sum_bottom: list[str] = []
        if show_index:
            sum_top.append(f'<td rowspan="2" class="report-table__span-cell">'
                           f'{esc(summary.get("index", "合计 --"))}</td>')
        for col in stack_cols:
            sum_top.append(f'<td rowspan="2" class="report-table__span-cell">'
                           f'{esc(summary.get(col["key"], EMPTY))}</td>')
        for top_col, bottom_col in pairs:
            sum_top.append('<td><span class="report-table__stack-value">'
                           f'{esc(summary.get(top_col["key"], EMPTY))}</span></td>')
            bv = esc(summary.get(bottom_col["key"], EMPTY)) if bottom_col else EMPTY
            sum_bottom.append('<td><span class="report-table__stack-value">'
                              f'{bv}</span></td>')
        body.append(f'<tr class="report-table__summary-row--top">{"".join(sum_top)}</tr>')
        body.append(f'<tr class="report-table__summary-row--bottom">{"".join(sum_bottom)}</tr>')

    return (
        '<div class="report-block report-table-block">\n'
        f"  {_section_title(label)}\n"
        '  <table class="report-table report-table--stacked">\n'
        '    <thead>\n'
        f'      <tr class="report-table__head-row--top">{"".join(head_top)}</tr>\n'
        f'      <tr class="report-table__head-row--bottom">{"".join(head_bottom)}</tr>\n'
        "    </thead>\n"
        f'    <tbody>\n      {chr(10).join(body)}\n    </tbody>\n'
        "  </table>\n"
        "</div>"
    )


# ---- measureList ----


def render_measure_list(block: dict) -> str:
    value = block.get("value") or {}
    label = block.get("label") or ""
    items: list[dict] = value.get("items") or []
    head = (
        '<div class="report-block report-measure-list">\n'
        f"  {_section_title(label)}\n"
    )
    if not items:
        return head + f'  <div class="report-table-empty">{esc(value.get("emptyText") or "暂无数据")}</div>\n</div>'

    cards: list[str] = []
    for item in items:
        tone = item.get("guaranteeTone")
        tone_cls = tone if tone in _MEASURE_TONE else "default"
        card = ['<div class="report-measure-card">', '  <div class="report-measure-card__head">']
        card.append(f'    <span class="report-measure-card__tag report-measure-card__tag--{tone_cls}">'
                    f'{esc(item.get("guaranteeMethod"))}</span>')
        card.append(f'    <span class="report-measure-card__name">{esc(item.get("customerName"))}</span>')
        if item.get("relationship"):
            card.append(f'    <span class="report-measure-card__rel">{esc(item.get("relationship"))}</span>')
        card.append(f'    <span class="report-measure-card__id">{esc(item.get("crdntlsType"))}：'
                    f'{esc(item.get("documentCode"))}</span>')
        card.append("  </div>")
        # attrs（仅抵押/质押有值）
        attrs = item.get("attrs")
        if attrs:
            card.append('  <div class="report-measure-card__attrs">')
            for a in attrs:
                card.append('    <div class="report-measure-card__attr">')
                card.append(f'      <span class="report-measure-card__attr-label">{esc(a.get("label"))}：</span>')
                card.append(f'      <span class="report-measure-card__attr-value">{esc(a.get("value"))}</span>')
                card.append("    </div>")
            card.append("  </div>")
        # collateral（担保物内表，左对齐）
        collateral = item.get("collateral")
        if collateral:
            card.append('  <div class="report-measure-card__collateral">')
            card.append('    <div class="report-measure-card__collateral-title">担保物</div>')
            card.append(_render_collateral_table(collateral))
            card.append("  </div>")
        card.append("</div>")
        cards.append("\n".join(card))

    return (
        head
        + '  <div class="report-measure-list__items">\n'
        + "\n".join(f"    {c}" for c in cards)
        + "\n  </div>\n</div>"
    )


def _render_collateral_table(collateral: dict) -> str:
    """担保物内表：按 table 规范，但表头与单元格统一左对齐。"""
    columns: list[dict] = collateral.get("columns") or []
    rows: list[dict] = collateral.get("rows") or []
    if not rows:
        return f'    <div class="report-table-empty">{esc(collateral.get("emptyText") or "暂无数据")}</div>'
    head = "".join(f"<th>{esc(c['label'])}</th>" for c in columns)
    body_rows = []
    for row in rows:
        tds = "".join(f"<td>{esc(row.get(c['key'], EMPTY))}</td>" for c in columns)
        body_rows.append(f"<tr>{tds}</tr>")
    return (
        '    <table class="report-table">\n'
        f'      <thead><tr>{head}</tr></thead>\n'
        f'      <tbody>{"".join(body_rows)}</tbody>\n'
        "    </table>"
    )


# ---- analysisList ----


def render_analysis_list(block: dict) -> str:
    value = block.get("value") or {}
    label = block.get("label") or ""
    items: list[dict] = value.get("items") or []
    head = (
        '<div class="report-block report-analysis-list">\n'
        f"  {_section_title(label)}\n"
    )
    if not items:
        return head + f'  <div class="report-table-empty">{esc(value.get("emptyText") or "暂无数据")}</div>\n</div>'

    out: list[str] = [head, '  <div class="report-analysis-list__items">']
    for item in items:
        out.append('    <div class="report-analysis-item">')
        name = item.get("customerName")
        if name:
            out.append('      <div class="report-analysis-item__entity">')
            out.append('        <span class="report-analysis-item__entity-dot"></span>')
            out.append(f'        <span class="report-analysis-item__entity-name">{esc(name)}</span>')
            out.append("      </div>")
        out.append('      <div class="report-analysis-item__conclusion">')
        conclusion = item.get("conclusion")
        if conclusion:
            out.append('        <div class="report-md">')
            out.append(markdown_to_html(conclusion))
            out.append("        </div>")
        else:
            out.append(f'        <div class="report-analysis-item__empty">{EMPTY}</div>')
        out.append("      </div>")
        out.append("    </div>")
    out.append("  </div>\n</div>")
    return "\n".join(out)


# ---- labelPanel ----


def render_label_panel(block: dict) -> str:
    value = block.get("value") or {}
    panels: list[dict] = value.get("panels") or []
    out = ['<div class="report-block">', '  <div class="report-label-panel">']
    for panel in panels:
        tone = panel.get("tone") if panel.get("tone") in ("warning", "negative") else "warning"
        out.append(f'    <div class="report-label-card report-label-card--{tone}">')
        out.append(f'      <div class="report-label-card__title">{esc(panel.get("label"))}</div>')
        out.append('      <ul class="report-label-card__list">')
        for item in panel.get("items") or []:
            out.append(f"        <li>{esc(item)}</li>")
        out.append("      </ul>")
        out.append("    </div>")
    out.append("  </div>")
    out.append("</div>")
    return "\n".join(out)


# ---- litigationCards ----


def render_litigation_cards(block: dict) -> str:
    value = block.get("value") or {}
    label = block.get("label") or ""
    cards: list[dict] = value.get("cards") or []
    head = '<div class="report-block">\n' + f"  {_section_title(label)}\n"
    if not cards:
        return head + f'  <div class="report-table-empty">{esc(value.get("emptyText") or "暂无数据")}</div>\n</div>'

    out = [head]
    if value.get("updateTime"):
        out.append(f'  <div class="report-litigation__update-time">{esc(value.get("updateTime"))}</div>')
    out.append('  <div class="report-litigation__cards">')
    # 先 highRisk 后 common（GT 已排好序，这里保持稳定，按原顺序）
    for card in cards:
        tone = card.get("tone") if card.get("tone") in ("highRisk", "common") else "common"
        out.append(f'    <div class="report-litigation-card report-litigation-card--{tone}">')
        out.append(f'      <span class="report-litigation-card__num">{esc(card.get("caseNum"))}</span>')
        out.append(f'      <span class="report-litigation-card__type">{esc(card.get("caseType"))}</span>')
        out.append("    </div>")
    out.append("  </div>")
    out.append("</div>")
    return "\n".join(out)


# ---- associateCompanySynopsis ----


def render_synopsis(block: dict) -> str:
    value = block.get("value") or {}
    label = block.get("label") or ""
    items: list[dict] = value.get("items") or []
    out = ['<div class="report-block">\n' + f"  {_section_title(label)}",
           '  <div class="report-synopsis__items">']
    for item in items:
        tone = item.get("guarantorTone") if item.get("guarantorTone") in ("guarantor", "nonGuarantor") else "nonGuarantor"
        out.append('    <div class="report-synopsis-card">')
        out.append(f'      <div class="report-synopsis-card__tag report-synopsis-card__tag--{tone}">')
        out.append(f'        <span>{esc(item.get("guarantorTag"))}</span>')
        out.append("      </div>")
        out.append(f'      <div class="report-synopsis-card__name">{esc(item.get("customerName"))}</div>')
        out.append(f'      <div class="report-synopsis-card__id">{esc(item.get("crdntlsCode"))}</div>')
        out.append("    </div>")
    out.append("  </div>")
    out.append("</div>")
    return "\n".join(out)


# ---- detail 类（associateCompanyDetail / guarantee*Detail）：childBlocks 递归 ----


def render_detail(block: dict) -> str:
    """详情容器：header 取 customerName+crdntlsCode（关联企业）或 block.label（担保）。

    childBlocks 按各自 displayType 递归渲染（复用 render_block 分发）。
    """
    value = block.get("value") or {}
    out = ['<div class="report-block report-detail">', '  <div class="report-detail__header">']
    name = value.get("customerName") or block.get("label")
    if name:
        out.append(f'    <span class="report-detail__name">{esc(name)}</span>')
    code = value.get("crdntlsCode")
    if code:
        out.append(f'    <span class="report-detail__id">{esc(code)}</span>')
    out.append("  </div>")
    out.append('  <div class="report-detail__body">')
    for child in value.get("childBlocks") or []:
        out.append(render_block(child))
    out.append("  </div>")
    out.append("</div>")
    return "\n".join(out)


# ---- fsSubjectHeader / financialStatementTable ----


def render_fs_header(block: dict) -> str:
    value = block.get("value") or {}
    title = esc(value.get("title"))
    # 规格：render 端加「数据来源：」前缀。GT 里 LLM 违规把前缀提前加进了 dataSource，
    # 这里以规格为准——若 dataSource 已自带前缀则不重复加（兼容两种上游产物）。
    source = str(value.get("dataSource") or "").strip()
    if source.startswith("数据来源"):
        source_text = source
    else:
        source_text = f"数据来源：{source}" if source else ""
    out = ['<div class="report-block report-fs-header">',
           f'  <div class="report-fs-header__title">{title}</div>']
    if source_text:
        out.append(f'  <div class="report-fs-header__source">{esc(source_text)}</div>')
    out.append("</div>")
    return "\n".join(out)


def render_fs_table(block: dict) -> str:
    value = block.get("value") or {}
    label = block.get("label") or ""
    periods: list[dict] = value.get("periods") or []
    rows: list[dict] = value.get("rows") or []

    if not rows:
        return ('<div class="report-block">\n' + f"  {_section_title(label)}\n"
                + f'  <div class="report-table-empty">{esc(value.get("emptyText") or "暂无数据")}</div>\n</div>')

    head = ["<tr>", "<th>科目</th>"]
    for p in periods:
        head.append(f'<th>{esc(p.get("period"))}'
                    f'<span class="report-fs-table__datatype">{esc(p.get("dataType"))}</span></th>')
    head.append("</tr>")

    body: list[str] = []
    for row in rows:
        level = row.get("rowLevel", 3)
        cls = {1: "report-fs-table__row--lv1", 2: "report-fs-table__row--lv2"}.get(level, "report-fs-table__row--lv3")
        cells = [f'<td>{esc(row.get("accountName"))}</td>']
        values = row.get("values") or {}
        for p in periods:
            cells.append(f'<td>{esc(values.get(p.get("period"), EMPTY))}</td>')
        body.append(f'<tr class="{cls}">{"".join(cells)}</tr>')

    unit = value.get("unit")
    unit_html = f'  <div class="report-fs-table__unit">{esc(unit)}</div>\n' if unit else ""
    return (
        '<div class="report-block">\n'
        f"  {_section_title(label)}\n"
        '  <table class="report-table report-fs-table">\n'
        f'    <thead>\n      {"".join(head)}\n    </thead>\n'
        f'    <tbody>\n      {chr(10).join(body)}\n    </tbody>\n'
        "  </table>\n"
        f"{unit_html}"
        "</div>"
    )


# ---- 分发表 ----

_RENDERERS = {
    "direct": render_direct,
    "person": render_direct,
    "sectionHeading": render_section_heading,
    "longText": render_long_text,
    "group": render_group,
    "table": render_table,
    "measureList": render_measure_list,
    "analysisList": render_analysis_list,
    "labelPanel": render_label_panel,
    "litigationCards": render_litigation_cards,
    "associateCompanySynopsis": render_synopsis,
    "associateCompanyDetail": render_detail,
    "guaranteePersonDetail": render_detail,
    "guaranteeCompanyDetail": render_detail,
    "fsSubjectHeader": render_fs_header,
    "financialStatementTable": render_fs_table,
}


def render_block(block: dict) -> str:
    """按 displayType 分发渲染单个 block（供顶层与 childBlocks 递归共用）。"""
    renderer = _RENDERERS.get(block.get("displayType"))
    if renderer is None:
        return ""
    return renderer(block)


def render_blocks(blocks: list[dict]) -> str:
    """渲染整个模块的 block 数组 → body HTML 片段（不含模块外壳）。"""
    return "\n".join(p for p in (render_block(b) for b in blocks) if p)
