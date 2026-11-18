"""block 构建引擎：解释 spec.py 的规则数据类，产出与 GT 对齐的 block dict。

各模块 builder 只声明规则（Column/TableRule/FieldSpec/GroupRule），由这里的通用函数
解释执行——引擎不含任何模块专属逻辑，14 个模块共用。

通用 block 工厂：
  build_table_block     表格（数据行列表 + 列定义 + 合计）
  build_group_block     分组键值对（字段映射列表）
  direct / longtext / section_heading  简单 block
自定义 block（measureList/analysisList/labelPanel/litigationCards/detail/fs*）形态各异，
由各模块 builder 直接组装 dict（仍复用本模块的格式化与取值工具）。
"""

from __future__ import annotations

from typing import Any

from .fmt import EMPTY, format_value
from .spec import (
    Column,
    FieldSpec,
    GroupRule,
    TableRule,
)


def resolve_path(data: Any, dotted: str) -> Any:
    """按点路径从嵌套 dict/list 取值。

    支持 "a.b.c" 与 "list.0.field"（纯数字段视为下标）。中途缺失/None 返回 None，
    不抛错——脏数据不让整篇报告崩。
    """
    if not dotted:
        return data
    cur = data
    for part in dotted.split("."):
        if isinstance(cur, list):
            if not part.isdigit() or int(part) >= len(cur):
                return None
            cur = cur[int(part)]
        elif isinstance(cur, dict):
            cur = cur.get(part)
        else:
            return None
        if cur is None:
            return None
    return cur


def _build_row(raw: dict, columns: tuple[Column, ...]) -> dict[str, Any]:
    """按列定义把原始 row 映射成输出 row：只保留 columns 引用的 key（+ subKey）。

    其余入参字段（主键、customerNo、isWhite 等）一律丢弃——对齐提示词「不输出」清单。
    key 顺序：列定义顺序，subKey 紧跟其所属列（与 GT 一致，便于字节级 diff）。
    两级表头父列无 key，递归展开其 children 收集叶子列。
    行内详情栅格 `detail`（render 层结构附加物，非业务字段）原样保留，供表格展开行渲染。
    """
    out: dict[str, Any] = {}
    for col in columns:
        if col.children:
            out.update(_build_row(raw, col.children))
            continue
        out[col.key] = format_value(raw.get(col.key), col.fmt)
        if col.subKey:
            out[col.subKey] = format_value(raw.get(col.subKey), "trim")
    if "detail" in raw:
        out["detail"] = raw["detail"]
    return out


def _build_summary(rule: TableRule, slice_data: Any) -> dict[str, Any] | None:
    """合计行：index + summary_map 指定列（用各列 fmt 格式化）。无 summary_map 返回 None。"""
    if not rule.summary_map:
        return None
    summary: dict[str, Any] = {"index": rule.summary_index}
    col_fmt = {c.key: c.fmt for c in rule.columns}
    for out_key, src_path in rule.summary_map.items():
        summary[out_key] = format_value(resolve_path(slice_data, src_path),
                                        col_fmt.get(out_key, "text"))
    return summary


def build_table_block(rule: TableRule, slice_data: Any,
                      raw_rows: list | None = None) -> dict[str, Any]:
    """通用：按 TableRule 构建一个 table block。

    数据行来源二选一：
      - rule.rows_path 从 slice_data 取（常见）
      - raw_rows 直接传入（行数据不在固定路径、需 builder 预处理时）
    rows 为空仍输出 table block（rows=[]），render 端走 emptyText。
    """
    if raw_rows is None:
        raw_rows = resolve_path(slice_data, rule.rows_path)
    if not isinstance(raw_rows, list):
        raw_rows = []
    rows = [_build_row(r, rule.columns) for r in raw_rows if isinstance(r, dict)]
    value: dict[str, Any] = {
        "showIndex": rule.show_index,
        "columns": [c.to_spec() for c in rule.columns],
        "rows": rows,
    }
    summary = _build_summary(rule, slice_data)
    if summary is not None:
        value["summary"] = summary
    value["emptyText"] = rule.empty_text
    return {
        "blockKey": rule.block_key,
        "label": rule.label,
        "displayType": "table",
        "value": value,
    }


def build_group_block(rule: GroupRule, slice_data: Any) -> dict[str, Any]:
    """通用：按 GroupRule 构建一个 group block（子项 direct/person/longText）。

    每个 FieldSpec 从 src_path 取值（或用 const 覆盖）→ 按 fmt 格式化 → 子 block。
    """
    groups: list[dict[str, Any]] = []
    for f in rule.fields:
        if f.const is not None:
            raw = f.const
        else:
            raw = resolve_path(slice_data, f.src_path)
        value = format_value(raw, f.fmt)
        child: dict[str, Any] = {
            "blockKey": f.block_key or f.src_path.split(".")[-1],
            "label": f.label,
            "displayType": f.display,
            "value": value,
        }
        if f.full_width:
            child["fullWidth"] = True
        groups.append(child)
    block: dict[str, Any] = {
        "blockKey": rule.block_key,
        "displayType": "group",
        "value": {"columns": rule.columns, "groups": groups},
    }
    if rule.label is not None:
        block["label"] = rule.label
    return block


def direct(block_key: str, label: str, value: Any, fmt: str = "text") -> dict[str, Any]:
    """direct block（值已格式化好则 fmt 传 None）。"""
    return {
        "blockKey": block_key,
        "label": label,
        "displayType": "direct",
        "value": format_value(value, fmt) if fmt else (EMPTY if value is None else value),
    }


def person(block_key: str, label: str, value: Any) -> dict[str, Any]:
    return {
        "blockKey": block_key,
        "label": label,
        "displayType": "person",
        "value": format_value(value, "text"),
    }


def longtext(block_key: str, label: str, value: Any) -> dict[str, Any]:
    """longText block：原文透传，不做格式化（保留换行/Markdown）。空值由调用方决定是否输出。"""
    return {
        "blockKey": block_key,
        "label": label,
        "displayType": "longText",
        "value": value if value is not None else "",
    }


def section_heading(block_key: str, label: str) -> dict[str, Any]:
    """sectionHeading block：无 value，仅 label。"""
    return {
        "blockKey": block_key,
        "label": label,
        "displayType": "sectionHeading",
    }


def is_blank(value: Any) -> bool:
    """空值判断：None / 空串 / 仅空白 / "—"。builder 据此决定「有值才输出」的 block。"""
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip() or value.strip() == EMPTY
    if isinstance(value, (list, dict)):
        return not value
    return False
