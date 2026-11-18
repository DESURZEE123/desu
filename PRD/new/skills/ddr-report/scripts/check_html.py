#!/usr/bin/env python3
"""HTML 结构自检（离线、零 LLM、不依赖 GT）。

产出 report.html 后跑本脚本，客观判断「有没有写崩」：
  1. 标签平衡：每种标签 open 计数 == close 计数
  2. class 合法：HTML 里的 report-* class 必须来自「CSS 样式 ∪ 引擎 render 实际产出」
     的并集（两者都是随技能分发的静态文件，不自造样式钩子）
  3. 安全：不含 <script> / on*= 事件属性 / 内联 style=
  4. 非空：report-module 容器数 > 0，文档壳完整（DOCTYPE/html/head/body/title）

为什么 class 白名单要并上 render.py：引擎会产出一些**没有 CSS 规则的结构钩子**
（如 report-table-block）和**动态后缀类**（如 report-label-card--warning、
report-grid__cell--w-25），它们只出现在 render 源码里、不在 report.css。
只拿 CSS 当白名单会误报。故白名单 = CSS 类 ∪ render 源码里的 report-* 字面量，
动态后缀用「前缀匹配」放行（类名以某个以 - 结尾的白名单项开头即合法）。
不写死任何类名清单，引擎/CSS 变了自动跟随。

为什么无 GT 也能自检：一期没有黄金基准，但「结构正确性」可机械判定——
标签不平衡、自造 class、漏文档壳都是确定的 bug。数据语义对不对由 reference 规格保证。

用法：python check_html.py /app/work/report.html
退出码：全 PASS 返回 0，有 FAIL 返回 1。
"""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path

# 自闭合标签：不计入 open/close 平衡
_VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input",
         "link", "meta", "param", "source", "track", "wbr"}

_HERE = Path(__file__).resolve().parent
_CSS_PATH = _HERE / "ddr_engine" / "report.css"
_RENDER_PATH = _HERE / "ddr_engine" / "render.py"
_HTML_TEMPLATE_PATH = _HERE / "ddr_engine" / "html_template.py"


def _allowed_classes() -> set[str]:
    """合法 report-* class 白名单 = CSS 样式类 ∪ 引擎源码里的 report-* 字面量。

    数据驱动：读随技能分发的 report.css / render.py / html_template.py，不写死清单。
    """
    allowed: set[str] = set()
    if _CSS_PATH.exists():
        css = re.sub(r"/\*.*?\*/", "", _CSS_PATH.read_text(encoding="utf-8"), flags=re.DOTALL)
        allowed |= set(re.findall(r"\.(report-[a-zA-Z_][\w-]*)", css))
    for src_path in (_RENDER_PATH, _HTML_TEMPLATE_PATH):
        if src_path.exists():
            allowed |= set(re.findall(r"report-[a-zA-Z_][\w-]*", src_path.read_text(encoding="utf-8")))
    return allowed


def _is_legal(cls: str, allowed: set[str]) -> bool:
    """精确命中，或以某个「以 - 结尾」的白名单项为前缀（动态后缀类）即合法。"""
    if cls in allowed:
        return True
    return any(cls != base and cls.startswith(base) for base in allowed if base.endswith("-"))


class _Counter(HTMLParser):
    """统计标签开合 + 收集 class + 检测 script/内联 style/事件属性。"""

    def __init__(self) -> None:
        super().__init__()
        self.opened: dict[str, int] = {}
        self.closed: dict[str, int] = {}
        self.classes: set[str] = set()
        self.has_script = False
        self.inline_style = 0
        self.event_attr = 0
        self.module_count = 0

    def handle_starttag(self, tag: str, attrs: list) -> None:
        if tag in _VOID:
            return
        self.opened[tag] = self.opened.get(tag, 0) + 1
        d = dict(attrs)
        if tag == "script":
            self.has_script = True
        if "style" in d:
            self.inline_style += 1
        for k in d:
            if k.startswith("on"):
                self.event_attr += 1
        cls = d.get("class")
        if cls:
            for c in cls.split():
                self.classes.add(c)
                if c == "report-module":
                    self.module_count += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in _VOID:
            return
        self.closed[tag] = self.closed.get(tag, 0) + 1


def main() -> int:
    if len(sys.argv) < 2:
        print("用法: python check_html.py <report.html>")
        return 2
    path = Path(sys.argv[1])
    if not path.exists():
        print(f"[FAIL] 文件不存在: {path}")
        return 1

    html_str = path.read_text(encoding="utf-8")
    c = _Counter()
    c.feed(html_str)

    failures: list[str] = []

    # 1. 标签平衡
    unbalanced = {t: (c.opened.get(t, 0), c.closed.get(t, 0))
                  for t in set(c.opened) | set(c.closed)
                  if c.opened.get(t, 0) != c.closed.get(t, 0)}
    if unbalanced:
        failures.append(f"标签不平衡: {unbalanced}")

    # 2. class 白名单（只校验 report- 前缀的，其余如布局类不管）
    allowed = _allowed_classes()
    if allowed:
        illegal = {cl for cl in c.classes if cl.startswith("report-") and not _is_legal(cl, allowed)}
        if illegal:
            failures.append(f"非法 class（CSS 与引擎都无，疑似自造）: {sorted(illegal)}")

    # 3. 安全
    if c.has_script:
        failures.append("含 <script> 标签")
    if c.inline_style:
        failures.append(f"含内联 style= 属性 {c.inline_style} 处（规格禁止）")
    if c.event_attr:
        failures.append(f"含 on*= 事件属性 {c.event_attr} 处")

    # 4. 文档壳 + 非空
    for marker in ("<!DOCTYPE html>", "<html", "<head>", "<body>", "<title>", "</html>"):
        if marker.lower() not in html_str.lower():
            failures.append(f"文档壳缺失: {marker}")
    if c.module_count == 0:
        failures.append("没有任何 report-module 容器（报告为空）")

    print(f"自检 {path.name}  大小={len(html_str)} 字节  模块数={c.module_count}  "
          f"class 种类={len(c.classes)}")
    if failures:
        print(f"\n[FAIL] {len(failures)} 项未通过:")
        for f in failures:
            print(f"  ✗ {f}")
        return 1
    print("\n[PASS] 结构自检全通过（标签平衡 / class 合法 / 无脚本内联 / 文档壳完整）")
    return 0


if __name__ == "__main__":
    sys.exit(main())
