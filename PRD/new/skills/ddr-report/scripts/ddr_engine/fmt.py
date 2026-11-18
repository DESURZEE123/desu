"""值格式化引擎：把入参原始值变成展示字符串。

全局一份，不随模块数增长。规则取自旧 L2 §八「空值与格式化规则」+ trace 黄金基准实测：
  - 空值（None / "" / 仅空白 / 缺失）→ "—"
  - 金额：千分位 + 2 位小数，入参为 number 或数字字符串均可（4005800 → "4,005,800.00"）
  - 日期 / 枚举 / 文本：原样；queryTime 先 trim
  - 数组角色：principalRole 非空元素用「、」连接，全空 → "—"

设计为「具名格式化器表」：structure 规则表里每列写 fmt="money"，引擎按名查表调用。
新增格式化规则只在此加一个函数 + 注册一行，列规则表保持声明式。
"""

from __future__ import annotations

from collections.abc import Callable
from decimal import Decimal, InvalidOperation
from typing import Any

# 空值占位符（旧 L2 §八）：与 CSS / 渲染器统一使用同一常量，避免散落字面量
EMPTY = "—"


def _is_blank(value: Any) -> bool:
    """判断是否为空值：None / 非字符串的非数字 / 空串 / 仅空白。

    数字 0 不算空（金额 0 要正常显示 "0.00"），故 bool/数字直接放行。
    """
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip()
    return False


def as_text(value: Any) -> str:
    """文本：原样输出，空值 → "—"。"""
    if _is_blank(value):
        return EMPTY
    if isinstance(value, str):
        return value
    return str(value)


def as_trim_text(value: Any) -> str:
    """文本并 trim：queryTime 这类带尾随空格的字段用。空 → "—"。"""
    if _is_blank(value):
        return EMPTY
    return str(value).strip()


def as_money(value: Any) -> str:
    """金额：千分位 + 2 位小数。

    入参形态混杂（实测：leaseLoanTotal 是 int，loanAmount 是 "7000000.00" 字符串），
    统一走 Decimal 解析；解析失败（非数字字符串）退化为文本展示，不抛错——
    脏数据不应让整篇报告崩溃。
    """
    if _is_blank(value):
        return EMPTY
    try:
        dec = Decimal(str(value).strip().replace(",", ""))
    except (InvalidOperation, ValueError):
        return as_text(value)
    return f"{dec:,.2f}"


def as_roles(value: Any) -> str:
    """数组角色：principalRole 非空元素用「、」连接；全空 → "—"。

    实测同一主体可能是 ["担保人","关联方"]，要渲染成 "担保人、关联方"。
    """
    if not isinstance(value, (list, tuple)):
        return as_text(value)
    parts = [str(v).strip() for v in value if not _is_blank(v)]
    return "、".join(parts) if parts else EMPTY


def as_num(value: Any) -> Any:
    """数值：保留入参原始数值类型（int/float 原样输出，不做字符串化）。

    用于 GT 中输出为 JSON number 的整数列（如逾期天数 curOverdueDays: 0）。
    text/money 等格式化器一律返回 str，无法表达 number 叶子，故单列一个 num：
      - None / 空串 / 仅空白 → "—"
      - int / float（排除 bool）→ 原样返回
      - 其他（含数字字符串）→ 退化为文本展示
    """
    if _is_blank(value):
        return EMPTY
    if isinstance(value, bool):
        return as_text(value)
    if isinstance(value, (int, float)):
        return value
    return as_text(value)


def as_raw(value: Any) -> Any:
    """原样保留：不字符串化、不拼接，仅 None → "—"。

    roleTag 列（customerRole 等数组）必须保留 list，render 端才渲染成多个彩色标签
    （render._cell_inline 按 isinstance(value, list) 判定）。若走 text 会被 str() 成
    "['承租人']" 破坏结构，故单列一个 raw。
    """
    if value is None:
        return EMPTY
    return value


# 格式化器注册表：structure 规则表用 fmt 名引用，引擎按名查表。
# 列规则表里写 fmt="money" 即调用 as_money。新增规则在此加一行即可。
# 返回类型 Any：num/raw 会返回原始 int/float/list，其余返回 str。
FORMATTERS: dict[str, Callable[[Any], Any]] = {
    "text": as_text,
    "trim": as_trim_text,
    "money": as_money,
    "roles": as_roles,
    "num": as_num,
    "raw": as_raw,
}


def format_value(value: Any, fmt: str | None) -> Any:
    """按格式化器名变换值；fmt 为空则走文本。返回 str，或 num 的原始数值。"""
    fn = FORMATTERS.get(fmt or "text", as_text)
    return fn(value)
