"""structure 规则的数据类定义（引擎/规则分离中的「规则 schema」）。

各模块 builder 用这些数据类声明自己的列定义 / 字段映射，引擎（blocks.py）解释执行。
改业务字段 = 改 builder 里的数据表，不碰引擎；将来要外置到配置/skill 也只搬数据表。

为什么用数据类而非散落 dict：类型可校验、IDE 可补全、to_spec() 统一产出与 GT 对齐的
JSON 结构，避免 14 个模块各写一遍 dict 字面量而字段名抄错。
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class Column:
    """表格列定义（table block 的 columns[] 元素）。

    key      入参 row 字段名，同时作为输出 row 的 key
    label    表头中文
    align    "left"（默认）/ "right" / "center"
    fmt      格式化器名，见 fmt.FORMATTERS（money/text/trim/roles）
    stackSpan 叠行宽表中单独占一物理列、rowspan="2"
    mergeSame 连续相同非空值做 rowspan 合并
    subKey   同单元格副文案字段名（如 queryTime）
    subLabel 副文案前缀（如「征信查询日期」），渲染「（征信查询日期: 值）」
    cellType 可选 "roleTag"（值为 string[]）/ "highlight"
    children 两级表头的子列（非空表示本列是「父列」，表头占 colspan，数据按子列展开）
    """

    key: str
    label: str
    align: str = "left"
    fmt: str = "text"
    stackSpan: bool = False
    mergeSame: bool = False
    subKey: str | None = None
    subLabel: str | None = None
    cellType: str | None = None
    children: tuple["Column", ...] = ()

    def to_spec(self) -> dict[str, Any]:
        """产出 columns[] 的 dict，与 GT 字段一致（align 始终输出，便于字节级 diff）。

        两级表头的父列只输出 label + children（不输出 key/align，父列不对应单一字段）。
        """
        if self.children:
            return {"label": self.label,
                    "children": [c.to_spec() for c in self.children]}
        spec: dict[str, Any] = {"key": self.key, "label": self.label, "align": self.align}
        if self.stackSpan:
            spec["stackSpan"] = True
        if self.mergeSame:
            spec["mergeSame"] = True
        if self.subKey:
            spec["subKey"] = self.subKey
        if self.cellType:
            spec["cellType"] = self.cellType
        return spec


@dataclass(frozen=True)
class TableRule:
    """一张表的规则：数据行来源 + 列定义 + 合计来源。

    rows_path   从模块切片取数据行的点路径，如 "loanSituation.companyLoanList"
    summary_map 合计行：输出列 key → 切片取值路径（合计以接口 total 为准，不自行重算）
    """

    block_key: str
    label: str
    empty_text: str
    columns: tuple[Column, ...]
    rows_path: str = ""
    show_index: bool = True
    summary_index: str = "合计"
    summary_map: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class FieldSpec:
    """group 内一个键值字段的映射：从 src_path 取值，按 fmt 格式化，输出为 direct/person。

    block_key  输出子 block 的 blockKey（缺省取 src_path 末段）
    label      展示中文标签
    src_path   切片里的取值点路径
    fmt        格式化器名
    full_width 子项是否占满整行（longText 或显式 fullWidth）
    display    "direct"（默认）/ "person" / "longText"
    """

    label: str
    src_path: str = ""
    fmt: str = "text"
    block_key: str = ""
    full_width: bool = False
    display: str = "direct"
    # 当值不从切片路径取、而是 builder 直接算好塞进来时用此字段覆盖（如比率计算）
    const: Any = None


@dataclass(frozen=True)
class GroupRule:
    """一个 group block 的规则：columns + 字段列表。"""

    block_key: str
    columns: int
    fields: tuple[FieldSpec, ...]
    label: str | None = None
