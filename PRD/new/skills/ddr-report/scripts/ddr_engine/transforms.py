"""跨模块重复的复杂 transform：原始 input 节点 → render 直接消费的 block value。

为什么单独抽一层：司法诉讼卡片（litigationCards）在 lessee/related/credit 三模块共 4 处
出现，担保措施卡片（measureList）在 credit/implementation 两模块出现，关联企业概要卡片
出现 1 处。这些结构固定、规则相同（tone 映射、caseNum 过滤、条件 attrs/collateral），
若让每个 builder 各自手搓 dict，既费 token 又极易把规则抄漏。烤进引擎一次，
builder 用声明式 {"t":"litigation", ...} 一行即可，render.py 完全不用改。

每个函数产出的 dict 直接作为对应 displayType block 的 value。
"""

from __future__ import annotations

from typing import Any

from .fmt import as_money, as_text

# 担保方式 code → tone（credit_enhancement / implementation_plan「guaranteeTone 映射」表）
_TONE_BY_CODE = {1: "guarantee", 3: "mortgage", 5: "pledge"}
# 无 code 时按文案包含匹配（reference：有 desc 无 code 时按「保证/抵押/质押」）
_TONE_BY_TEXT = (("保证", "guarantee"), ("抵押", "mortgage"), ("质押", "pledge"))

# 担保物明细列（credit_enhancement §7.1.3 / implementation_plan §7.9.3 同一套 12 列）
_COLLATERAL_COLUMNS = (
    ("assetsName", "担保物名称", None),
    ("locationVfbc", "所在地", None),
    ("assetsNo1Vfbc", "车牌号/不动产面积", None),
    ("assetsNo", "机身号/不动产单元号", None),
    ("assetsNo2Vfbc", "租赁物唯一识别码/抵质押证书编号", None),
    ("estimateValue", "担保物估值(元)", "money"),
    ("currtype", "币种", None),
    ("debtor", "第三方质押债务人", None),
    ("isFirstOrder", "是否第一顺位", None),
    ("assessMode", "评估方式", None),
    ("compensationNumber", "优先受偿权数额", "money"),
    ("valuationCycle", "估值周期", None),
)


def _num(value: Any) -> float:
    """安全转数值：caseNum 可能是 int / str / None，脏值按 0（即过滤掉）。"""
    try:
        return float(str(value).replace(",", "").strip())
    except (TypeError, ValueError):
        return 0.0


def litigation_value(node: dict | None) -> dict:
    """司法诉讼信息节点 → litigationCards 的 value。

    规则（lessee_base_info §7.5 / related_enterprise §7.5 / credit_enhancement §7.5 一致）：
    cards 先 caseTypeHighRiskList（tone=highRisk）再 caseTypeCommonList（tone=common），
    过滤 caseNum<=0；updateTime 透传；无卡片时 render 走 emptyText。
    """
    node = node or {}
    cards: list[dict] = []
    for tone, key in (("highRisk", "caseTypeHighRiskList"), ("common", "caseTypeCommonList")):
        for case in node.get(key) or []:
            n = _num(case.get("caseNum"))
            if n > 0:
                cards.append({"caseType": as_text(case.get("caseType")),
                              "caseNum": int(n), "tone": tone})
    value: dict[str, Any] = {"cards": cards, "emptyText": "客户暂无司法诉讼数据"}
    update_time = node.get("updateTime")
    if update_time and str(update_time).strip():
        value["updateTime"] = as_text(update_time)
    return value


def _guarantee_tone(method: Any) -> tuple[str, str]:
    """guaranteeMethod 对象 / 字符串 → (展示文案, tone)。"""
    if isinstance(method, dict):
        desc = as_text(method.get("desc"))
        code = method.get("code")
        if code in _TONE_BY_CODE:
            return desc, _TONE_BY_CODE[code]
    else:
        desc = as_text(method)
    for kw, tone in _TONE_BY_TEXT:
        if kw in desc:
            return desc, tone
    return desc, "default"


def measure_items(measure_list: list | None) -> list[dict]:
    """担保措施列表 → measureList 的 items。

    规则（credit_enhancement §7.1 / implementation_plan §7.9 一致）：
    guaranteeMethod 取对象 desc；tone 按 code / 文案映射；relationship 空则不传
    （不渲染绿色关系 tag）；attrs 仅 mortgage/pledge 输出（保证担保不传）；
    collateral 仅 collateralList 非空时输出（复用 table schema，全列左对齐）。
    """
    items: list[dict] = []
    for m in measure_list or []:
        desc, tone = _guarantee_tone(m.get("guaranteeMethod"))
        item: dict[str, Any] = {
            "guaranteeMethod": desc,
            "guaranteeTone": tone,
            "customerName": as_text(m.get("customerName")),
            "crdntlsType": as_text(m.get("crdntlsType")),
            "documentCode": as_text(m.get("documentCode")),
        }
        rel = m.get("relationship")
        if rel and str(rel).strip():
            item["relationship"] = str(rel).strip()
        if tone in ("mortgage", "pledge"):
            item["attrs"] = [
                {"label": "抵押物类别", "value": as_text(m.get("collateralType"))},
                {"label": "抵质押物类型", "value": as_text(m.get("mortgageAndPledgeType"))},
                {"label": "抵质押物分类", "value": as_text(m.get("mortgageAndPledgeClass"))},
            ]
        coll = m.get("collateralList")
        if coll:
            columns = [{"key": key, "label": label, "align": "left"}
                       for key, label, _ in _COLLATERAL_COLUMNS]
            rows = [{key: (as_money(r.get(key)) if fmt == "money" else as_text(r.get(key)))
                     for key, _, fmt in _COLLATERAL_COLUMNS} for r in coll]
            item["collateral"] = {"label": "担保物", "showIndex": True,
                                  "columns": columns, "rows": rows, "emptyText": "暂无数据"}
        items.append(item)
    return items


def measure_value(measure_list: list | None, empty_text: str = "暂无增信措施") -> dict:
    """担保措施列表 → measureList 的 value。"""
    return {"items": measure_items(measure_list), "emptyText": empty_text}


def synopsis_items(synopsis_list: list | None) -> list[dict]:
    """关联企业概要列表 → associateCompanySynopsis 的 items。

    规则（related_enterprise §7.1）：isGuarantor=='是' → 担保人 / tone=guarantor（蓝），
    否则 非担保人 / tone=nonGuarantor（黄）。担保人标签仅概要卡片输出。
    """
    items: list[dict] = []
    for s in synopsis_list or []:
        is_g = str(s.get("isGuarantor")).strip() == "是"
        items.append({
            "guarantorTag": "担保人" if is_g else "非担保人",
            "guarantorTone": "guarantor" if is_g else "nonGuarantor",
            "customerName": as_text(s.get("customerName")),
            "crdntlsCode": as_text(s.get("crdntlsCode")),
        })
    return items
