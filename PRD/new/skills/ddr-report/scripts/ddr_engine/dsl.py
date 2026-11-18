"""builder 解释层：把各模块 builder 的声明式 BLOCKS / build_blocks 函数翻译成 block JSON。

两种写法（混合式，由 builder 自己选，引擎自动识别）：

1. 声明式 —— 模块平铺、无循环分支时，builder 只写数据，零 import 零函数：
       SOURCE = "liabilityAnalysis"
       BLOCKS = [{"t":"table","key":"...","label":"...","cols":[...]}, ...]

2. 函数式 —— 模块有透视/分组/形态分支/逐条嵌套时，builder 写 build_blocks(s, ddr)，
   但每个 block 仍是 ddr.* 一行 helper，不手搓 dict、不写 Column()/import：
       def build_blocks(s, ddr):
           return [ddr.heading("t","标题"), ddr.table("k","表",cols,rows=s["x"]), ...]

两种都最终产出 render.py 消费的 block JSON。render 引擎零改动。

列定义紧凑串语法（cols / fields 通用，避免每列一个 Column(...) 样板）：
    "key,label[,flag[,flag...]]"
  flag：money/num/trim/roles（fmt）· right/center（align，默认 left 不写）
        · stack（stackSpan）· merge（mergeSame）· sub:字段（subKey）
        · sublabel:文案（subLabel）· roleTag/highlight（cellType）
        · full（仅 group 字段，fullWidth）· person/longText（仅 group 字段，display）
  label 不要含英文逗号；确需含逗号的列改用 dict 形式（见 _parse_col）。
"""

from __future__ import annotations

from typing import Any

from .blocks import (
    build_group_block,
    build_table_block,
    direct,
    is_blank,
    longtext,
    resolve_path,
    section_heading,
)
from .fmt import as_money, as_num, as_roles, as_trim_text, as_text, format_value
from .spec import Column, FieldSpec, GroupRule, TableRule
from . import transforms

# fmt 名 → 直接取值函数（复杂模块算透视表值时用 ddr.money 等）
_FMT_FUNCS = {"money": as_money, "num": as_num, "roles": as_roles,
              "trim": as_trim_text, "text": as_text}

_ALIGN = {"left", "right", "center"}
_FMT_NAMES = set(_FMT_FUNCS)
_CELL_TYPES = {"roleTag", "highlight"}


def _parse_col(spec: str | dict) -> Column:
    """紧凑串或 dict → Column。"""
    if isinstance(spec, dict):
        # 两级表头父列：{label, children:[...]}，本身无 key，只承载子列
        if spec.get("children"):
            return Column(key="", label=spec.get("label", ""),
                          children=tuple(_parse_col(c) for c in spec["children"]))
        cell_type = spec.get("cellType")
        fmt = spec.get("fmt", "text")
        if cell_type == "roleTag" and fmt == "text":
            fmt = "raw"
        return Column(
            key=spec["key"], label=spec.get("label", spec["key"]),
            align=spec.get("align", "left"), fmt=fmt,
            stackSpan=bool(spec.get("stack") or spec.get("stackSpan")),
            mergeSame=bool(spec.get("merge") or spec.get("mergeSame")),
            subKey=spec.get("sub") or spec.get("subKey"),
            subLabel=spec.get("sublabel") or spec.get("subLabel"),
            cellType=cell_type,
        )
    parts = spec.split(",")
    key = parts[0].strip()
    label = parts[1].strip() if len(parts) > 1 else key
    align, fmt, stack, merge = "left", "text", False, False
    sub_key = sub_label = cell_type = None
    for flag in (p.strip() for p in parts[2:]):
        if not flag:
            continue
        if flag in _ALIGN:
            align = flag
        elif flag in _FMT_NAMES:
            fmt = flag
        elif flag == "stack":
            stack = True
        elif flag == "merge":
            merge = True
        elif flag.startswith("sub:"):
            sub_key = flag[4:]
        elif flag.startswith("sublabel:"):
            sub_label = flag[9:]
        elif flag in _CELL_TYPES:
            cell_type = flag
    # roleTag 列的值是数组，必须保留 list 才能渲染成多标签；未显式指定 fmt 时自动用 raw
    if cell_type == "roleTag" and fmt == "text":
        fmt = "raw"
    return Column(key=key, label=label, align=align, fmt=fmt, stackSpan=stack,
                  mergeSame=merge, subKey=sub_key, subLabel=sub_label, cellType=cell_type)


def _parse_field(spec: str | dict) -> FieldSpec:
    """group 字段紧凑串或 dict → FieldSpec。

    紧凑串："label,path[,fmt[,flag]]"；flag：full / person / longText。
    dict 可带 const（已取好的值）或 path。
    """
    if isinstance(spec, dict):
        return FieldSpec(
            label=spec.get("label", ""), src_path=spec.get("path", ""),
            fmt=spec.get("fmt", "text"), block_key=spec.get("key", ""),
            full_width=bool(spec.get("full") or spec.get("fullWidth")),
            display=spec.get("display", "direct"), const=spec.get("const"),
        )
    parts = spec.split(",")
    label = parts[0].strip()
    path = parts[1].strip() if len(parts) > 1 else ""
    fmt = "text"
    full = False
    display = "direct"
    for flag in (p.strip() for p in parts[2:]):
        if not flag:
            continue
        if flag in _FMT_NAMES:
            fmt = flag
        elif flag == "full":
            full = True
        elif flag == "person":
            display = "person"
        elif flag == "longText":
            display, full = "longText", True
    return FieldSpec(label=label, src_path=path, fmt=fmt, full_width=full, display=display)


def _show_if_any(slice_data: Any, paths: list[str]) -> bool:
    """条件输出：paths 中任一非空才输出（cooperation_history 的说明字段用）。"""
    return any(not is_blank(resolve_path(slice_data, p)) for p in paths)


def _resolve_summary(summary: dict, cols: tuple[Column, ...], s: Any) -> dict:
    """合计行：值以 "=" 开头视为字面常量（如 "=合计"），否则按点路径从 s 取值。

    取出的值按对应列的 fmt 格式化；序号位固定 "合计"。
    """
    col_fmt = {c.key: c.fmt for c in cols}
    out: dict[str, Any] = {"index": "合计"}
    for out_key, src in summary.items():
        if isinstance(src, str) and src.startswith("="):
            out[out_key] = src[1:]
        else:
            out[out_key] = format_value(resolve_path(s, src), col_fmt.get(out_key, "text"))
    return out


# ---- 声明式块解释 ----


def _interp_block(b: dict, s: Any) -> list[dict]:
    """单个声明式块 → 0/1 个 block JSON（skipBlank/cond 不满足时返回 []）。"""
    t = b.get("t")
    key = b.get("key", "")
    label = b.get("label")
    path = b.get("path", key)
    value = resolve_path(s, path)

    if b.get("showIfAnyNonEmpty") and not _show_if_any(s, b["showIfAnyNonEmpty"]):
        return []
    if b.get("skipBlank") and is_blank(value):
        return []

    if t == "direct":
        return [direct(key, label, value, fmt=b.get("fmt", "text"))]
    if t == "heading":
        return [section_heading(key, label)]
    if t == "longText":
        v = value if not b.get("emptyToDash") else as_text(value)
        return [longtext(key, label, v)]
    if t == "table":
        cols = tuple(_parse_col(c) for c in b.get("cols", ()))
        rule = TableRule(block_key=key, label=label or "", empty_text=b.get("emptyText", "暂无数据"),
                         columns=cols, rows_path=path, show_index=b.get("showIndex", True))
        blk = build_table_block(rule, s)
        if b.get("summary"):
            blk["value"]["summary"] = _resolve_summary(b["summary"], cols, s)
        return [blk]
    if t == "group":
        fields = tuple(_parse_field(f) for f in b.get("fields", ()))
        rule = GroupRule(block_key=key, columns=b.get("columns", 4), fields=fields, label=label)
        return [build_group_block(rule, s)]
    if t == "litigation":
        return [{"blockKey": key, "label": label, "displayType": "litigationCards",
                 "value": transforms.litigation_value(value)}]
    if t == "measure":
        return [{"blockKey": key, "label": label, "displayType": "measureList",
                 "value": transforms.measure_value(value, b.get("emptyText", "暂无增信措施"))}]
    if t == "synopsis":
        return [{"blockKey": key, "displayType": "associateCompanySynopsis",
                 "value": {"items": transforms.synopsis_items(value)}}]
    if t == "empty":
        return [{"blockKey": key, "label": label, "displayType": "table",
                 "value": {"showIndex": False, "columns": [], "rows": [],
                           "emptyText": b.get("emptyText", "暂无数据")}}]
    raise ValueError(f"未知声明式块类型 t={t!r}（key={key}）")


def build_blocks_from_spec(blocks: list[dict], s: Any) -> list[dict]:
    """解释 BLOCKS 列表 → block JSON 列表。"""
    out: list[dict] = []
    for b in blocks:
        out.extend(_interp_block(b, s))
    return out


# ---- 复杂模块的 helper 命名空间 ----


class Ddr:
    """注入给 build_blocks(s, ddr) 的 helper 集合。

    复杂模块（透视表 / 分组 / 形态分支 / 逐条嵌套）用它一行产出一个 block，
    不手搓 dict、不写 Column()、不 import 引擎。root 持有客户全量数据，
    跨多个数据根的模块用 ddr.get(path) 从全量取（不必受 SOURCE 单根限制）。
    """

    def __init__(self, root: Any):
        self._root = root

    # 取值与格式化
    def get(self, path: str, base: Any = None) -> Any:
        return resolve_path(self._root if base is None else base, path)

    def blank(self, v: Any) -> bool:
        """空值判断：None / 空串 / 仅空白 / 「—」 / 空 list/dict 均为 True。

        函数式 builder 做「有值才输出」判断用：if not ddr.blank(x): blocks.append(...)。
        """
        return is_blank(v)

    def money(self, v: Any) -> str:
        return as_money(v)

    def num(self, v: Any) -> Any:
        return as_num(v)

    def text(self, v: Any) -> str:
        return as_text(v)

    def fmt(self, v: Any, name: str) -> Any:
        return format_value(v, name)

    def join(self, items: Any, field: str | None = None, sep: str = "、") -> str:
        """列表拼接：field 给定则取每项该字段，否则取项本身；过滤空值。"""
        if not isinstance(items, (list, tuple)):
            return as_text(items)
        vals = [(it.get(field) if field and isinstance(it, dict) else it) for it in items]
        parts = [str(v).strip() for v in vals if not is_blank(v)]
        return sep.join(parts) if parts else "—"

    # block helper
    def direct(self, key: str, label: str, value: Any, fmt: str = "text") -> dict:
        return direct(key, label, value, fmt=fmt)

    def heading(self, key: str, label: str) -> dict:
        return section_heading(key, label)

    def longtext(self, key: str, label: str, value: Any) -> dict:
        return longtext(key, label, value)

    def table(self, key: str, label: str, cols: list, rows: list | None,
              empty_text: str = "暂无数据", show_index: bool = True,
              summary: dict | None = None, base: Any = None, path: str = "") -> dict:
        """表格。rows 直接传（已加工好的 list[dict]），或给 path 从 base 取。

        summary 为已算好的合计行 dict（不含 index，引擎补 "合计"）；按 cols 的 fmt 格式化。
        """
        if rows is None:
            rows = resolve_path(self._root if base is None else base, path)
        if not isinstance(rows, list):
            rows = []
        columns = tuple(_parse_col(c) for c in cols)
        rule = TableRule(block_key=key, label=label, empty_text=empty_text,
                         columns=columns, show_index=show_index)
        blk = build_table_block(rule, None, raw_rows=rows)
        if summary:
            blk["value"]["summary"] = {"index": "合计", **summary}
        return blk

    def group(self, key: str, label: str | None, fields: list, columns: int = 4,
              base: Any = None) -> dict:
        """分组键值区。fields 紧凑串（path 相对 base）或 dict（可带 const 已取值）。"""
        specs = tuple(_parse_field(f) for f in fields)
        rule = GroupRule(block_key=key, columns=columns, fields=specs, label=label)
        return build_group_block(rule, self._root if base is None else base)

    def litigation(self, key: str, label: str, node: Any) -> dict:
        return {"blockKey": key, "label": label, "displayType": "litigationCards",
                "value": transforms.litigation_value(node)}

    def measure(self, key: str, label: str, measure_list: Any,
                empty_text: str = "暂无增信措施") -> dict:
        return {"blockKey": key, "label": label, "displayType": "measureList",
                "value": transforms.measure_value(measure_list, empty_text)}

    def synopsis(self, key: str, synopsis_list: Any) -> dict:
        return {"blockKey": key, "displayType": "associateCompanySynopsis",
                "value": {"items": transforms.synopsis_items(synopsis_list)}}

    def detail(self, key: str, dt: str, child_blocks: list[dict],
               label: str | None = None, name: Any = None, code: Any = None) -> dict:
        """嵌套详情容器（associateCompanyDetail / guarantee*Detail）。"""
        value: dict[str, Any] = {"childBlocks": [c for c in child_blocks if c]}
        if name is not None:
            value["customerName"] = as_text(name)
        if code is not None:
            value["crdntlsCode"] = as_text(code)
        blk: dict[str, Any] = {"blockKey": key, "displayType": dt, "value": value}
        if label is not None:
            blk["label"] = label
        return blk


# ---- 统一入口 ----


def build_from_spec(customer_info: dict, module: Any) -> list[dict] | None:
    """驱动入口：给定客户全量数据 + 一个 builder 模块，产出该模块 block JSON 列表。

    返回 None 表示整模块不输出（SOURCE 主数据缺失，或 build/BLOCKS 产出为空）。
    """
    source = getattr(module, "SOURCE", None)
    s = resolve_path(customer_info, source) if source else customer_info
    if s is None:
        return None

    builder = getattr(module, "build_blocks", None)
    if callable(builder):
        blocks = builder(s, Ddr(customer_info))
    else:
        blocks = build_blocks_from_spec(getattr(module, "BLOCKS", []), s)
    return blocks or None
