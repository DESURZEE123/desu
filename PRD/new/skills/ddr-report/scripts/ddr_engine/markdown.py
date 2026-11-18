"""Markdown → HTML 转换器（analysisList 的 conclusion 字段用）。

严格实现 RENDER_SYSTEM 的转换规则；安全约束：
  - 所有文本一律 HTML 转义（< > & " ），杜绝注入
  - 裸链接转义为纯文本，不生成 <a href>（防外链跳转 / javascript: 协议）
  - 不输出 script、事件属性、内联 style

块级用「逐行扫描」，行内格式（strong/em/code）在已转义的文本上做正则替换。
CSS 用后代选择器（.report-md h1 等），故输出语义化标签即可，无需额外 class。
"""

from __future__ import annotations

import html
import re


def _esc(text: str) -> str:
    return html.escape(text, quote=True)


# 行内格式：在已转义文本上替换。顺序敏感——先 code（保护内部不再被解析），
# 再 strong（** / __），最后 em（* / _）。用占位符避免 ** 被 * 规则二次命中。
_CODE_RE = re.compile(r"`([^`]+)`")
_STRONG_RE = re.compile(r"\*\*(.+?)\*\*|__(.+?)__")
_EM_RE = re.compile(r"(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|(?<!_)_(?!_)(.+?)(?!_)_(?!_)")


def _inline(text: str) -> str:
    """把一行已转义文本里的行内 Markdown 转成 HTML。"""
    # 先转义，保证后续插入的标签不会被二次转义
    out = _esc(text)
    # code：占位，内部不再解析 strong/em
    codes: list[str] = []

    def _code(m: re.Match) -> str:
        codes.append(f"<code>{m.group(1)}</code>")
        return f"\x00{len(codes) - 1}\x00"

    out = _CODE_RE.sub(_code, out)
    out = _STRONG_RE.sub(lambda m: f"<strong>{m.group(1) or m.group(2)}</strong>", out)
    out = _EM_RE.sub(lambda m: f"<em>{m.group(1) or m.group(2)}</em>", out)
    # 还原 code 占位
    out = re.sub(r"\x00(\d+)\x00", lambda m: codes[int(m.group(1))], out)
    return out


_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
_UL_RE = re.compile(r"^\s*[-*+]\s+(.*)$")
_OL_RE = re.compile(r"^\s*\d+[.)]\s+(.*)$")
_QUOTE_RE = re.compile(r"^\s*>\s?(.*)$")
_HR_RE = re.compile(r"^\s*([-*_])\s*(?:\1\s*){2,}$")
_TABLE_ROW_RE = re.compile(r"^\s*\|(.+)\|\s*$")
_TABLE_SEP_RE = re.compile(r"^\s*\|?[\s:|-]+\|[\s:|-]*$")


def _split_table_row(line: str) -> list[str]:
    """切分 | a | b | 一行表格为单元格列表。"""
    inner = line.strip().strip("|")
    return [c.strip() for c in inner.split("|")]


def _flush_table(buf: list[str], out: list[str]) -> None:
    """把缓冲的表格行渲染成 <table>。buf[0]=表头 buf[1]=分隔行 buf[2:]=数据。"""
    if len(buf) < 2:
        # 不是合法表格，按段落回退
        for line in buf:
            out.append(f"<p>{_inline(line)}</p>")
        return
    header = _split_table_row(buf[0])
    body_rows = [_split_table_row(r) for r in buf[2:]]
    thead = "".join(f"<th>{_inline(c)}</th>" for c in header)
    tbody = "".join(
        "<tr>" + "".join(f"<td>{_inline(c)}</td>" for c in row) + "</tr>"
        for row in body_rows
    )
    out.append(
        "<table><thead><tr>" + thead + "</tr></thead><tbody>" + tbody + "</tbody></table>"
    )


def markdown_to_html(md: str) -> str:
    """把 Markdown 文本转成 HTML 片段（用于 .report-md 内）。"""
    if not md:
        return ""
    lines = md.split("\n")
    out: list[str] = []
    i = 0
    n = len(lines)
    para: list[str] = []      # 段落缓冲
    list_stack: list[str] = []  # 当前打开的列表标签 ul/ol
    table_buf: list[str] = []  # 表格行缓冲
    fence: list[str] = []      # 围栏代码块缓冲
    in_fence = False

    def flush_para() -> None:
        if para:
            out.append(f"<p>{_inline(' '.join(para).strip())}</p>")
            para.clear()

    def close_lists(depth: int = 0) -> None:
        while len(list_stack) > depth:
            out.append(f"</{list_stack.pop()}>")

    def flush_table_buf() -> None:
        if table_buf:
            _flush_table(table_buf, out)
            table_buf.clear()

    while i < n:
        line = lines[i]

        # 围栏代码块 ```
        if line.strip().startswith("```"):
            if not in_fence:
                flush_para(); close_lists(); flush_table_buf()
                in_fence = True
            else:
                out.append(f"<pre><code>{_esc(chr(10).join(fence))}</code></pre>")
                fence.clear()
                in_fence = False
            i += 1
            continue
        if in_fence:
            fence.append(line)
            i += 1
            continue

        # 表格行（| 开头）
        if _TABLE_ROW_RE.match(line):
            flush_para(); close_lists()
            table_buf.append(line)
            i += 1
            continue
        else:
            flush_table_buf()

        # 空行：结束段落 / 列表
        if not line.strip():
            flush_para(); close_lists()
            i += 1
            continue

        # 水平线
        if _HR_RE.match(line):
            flush_para(); close_lists()
            out.append("<hr>")
            i += 1
            continue

        # 标题
        m = _HEADING_RE.match(line)
        if m:
            flush_para(); close_lists()
            level = len(m.group(1))
            out.append(f"<h{level}>{_inline(m.group(2).strip())}</h{level}>")
            i += 1
            continue

        # 引用
        m = _QUOTE_RE.match(line)
        if m:
            flush_para(); close_lists()
            quote_lines = [m.group(1)]
            j = i + 1
            while j < n:
                m2 = _QUOTE_RE.match(lines[j])
                if not m2:
                    break
                quote_lines.append(m2.group(1))
                j += 1
            out.append(f"<blockquote><p>{_inline(' '.join(quote_lines).strip())}</p></blockquote>")
            i = j
            continue

        # 有序列表
        m = _OL_RE.match(line)
        if m:
            flush_para()
            if not list_stack or list_stack[-1] != "ol":
                close_lists()
                out.append("<ol>")
                list_stack.append("ol")
            out.append(f"<li>{_inline(m.group(1).strip())}</li>")
            i += 1
            continue

        # 无序列表
        m = _UL_RE.match(line)
        if m:
            flush_para()
            if not list_stack or list_stack[-1] != "ul":
                close_lists()
                out.append("<ul>")
                list_stack.append("ul")
            out.append(f"<li>{_inline(m.group(1).strip())}</li>")
            i += 1
            continue

        # 普通段落文本
        close_lists()
        para.append(line.strip())
        i += 1

    # 收尾
    if in_fence and fence:
        out.append(f"<pre><code>{_esc(chr(10).join(fence))}</code></pre>")
    flush_para()
    close_lists()
    flush_table_buf()
    return "\n".join(out)
