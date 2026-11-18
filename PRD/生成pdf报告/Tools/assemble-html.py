#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""汇总小企业尽调报告 HTML 片段为完整可预览文档。

流程对齐 L0（prjc_integrate_report）：
  1. 从 小企业/prjc_style_render.md §4.2 抽取固定 <style>
  2. 合并 Tools/report-style.supplements.css（L1 扩展样式）
  3. 按 moduleIndex 拼接 fragments
  4. 写入 <title> = {headInfo.projectName}-尽调调查报告-{yyyyMMddHHmm}

用法:
  python3 assemble-html.py \\
    --json ../json数据/大于500w区域线回租.json \\
    --fragments ../html/_fragments_918 \\
    --output ../html/9.18大于500w区域线回租.html

  python3 assemble-html.py --json ... --fragments ... --output ... --style-only
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

TOOLS_DIR = Path(__file__).resolve().parent
ROOT_DIR = TOOLS_DIR.parent
SKILLS_DIR = ROOT_DIR / "小企业"
DEFAULT_SUPPLEMENTS = TOOLS_DIR / "report-style.supplements.css"
STYLE_MD = SKILLS_DIR / "prjc_style_render.md"

# moduleIndex 升序；跳过 4 知识图谱
FRAGMENT_ORDER = [
    ("01", "project_change"),
    ("02", "project_summary"),
    ("03", "cooperation_history"),
    ("05", "project_base_info"),
    ("06", "implementation_plan"),
    ("07", "lease_property"),
    ("08", "lessee_base_info"),
    ("09", "related_enterprise"),
    ("10", "credit_enhancement"),
    ("11", "revenue_analysis"),
    ("12", "liability_analysis"),
    ("13", "key_indicators"),
    ("14", "key_account_financials"),
    ("15", "analysis_results"),
]


def die(msg: str, code: int = 1) -> None:
    print(f"错误: {msg}", file=sys.stderr)
    raise SystemExit(code)


def extract_l2_style(style_md: Path) -> str:
    """从 prjc_style_render.md §4.2 抽取 <style>...</style> 内层 CSS。"""
    text = style_md.read_text(encoding="utf-8")
    m = re.search(
        r"### 4\.2[\s\S]*?```html\n<style>([\s\S]*?)</style>\n```",
        text,
    )
    if not m:
        # 兜底：文档中第一个完整 style 块
        m = re.search(r"<style>([\s\S]*?)</style>", text)
    if not m:
        die(f"未在 {style_md} 找到 §4.2 <style> 块")
    return m.group(1).strip()


def load_supplements(path: Path | None) -> str:
    if path is None or not path.exists():
        return ""
    return path.read_text(encoding="utf-8").strip()


def build_style_block(
    style_md: Path = STYLE_MD,
    supplements: Path | None = DEFAULT_SUPPLEMENTS,
) -> str:
    l2 = extract_l2_style(style_md)
    extra = load_supplements(supplements)
    parts = [l2]
    if extra:
        parts.append("\n  /* ===== Tools supplements (report-style.supplements.css) ===== */\n")
        # indent supplement rules lightly for readability inside <style>
        parts.append(extra)
    inner = "\n\n".join(parts).rstrip() + "\n"
    return f"<style>\n{inner}</style>"


def normalize_header(fragment: str) -> str:
    """统一模块顶栏：去掉多余 <span> 包裹。"""
    return re.sub(
        r'(<div class="report-module__header">)\s*<span>([^<]+)</span>\s*(</div>)',
        r"\1\2\3",
        fragment,
    )


def resolve_fragment(frag_dir: Path, index: str, module_key: str) -> Path | None:
    candidates = [
        frag_dir / f"{index}_{module_key}.html",
        frag_dir / f"{module_key}.html",
    ]
    for p in candidates:
        if p.exists():
            return p
    # 模糊：01_*.html
    matches = sorted(frag_dir.glob(f"{index}_*.html"))
    return matches[0] if matches else None


def collect_fragments(frag_dir: Path) -> tuple[list[str], list[str]]:
    """返回 (html_parts, skipped_keys)。"""
    parts: list[str] = []
    skipped: list[str] = []
    missing: list[str] = []

    for index, module_key in FRAGMENT_ORDER:
        path = resolve_fragment(frag_dir, index, module_key)
        if path is None:
            missing.append(f"{index}_{module_key}")
            continue
        content = path.read_text(encoding="utf-8").strip()
        if content == "<!-- SKIP -->" or not content:
            skipped.append(module_key)
            continue
        content = normalize_header(content)
        # 片段不应自带 style / html 壳
        if re.search(r"<(html|head|body)\b", content, re.I):
            die(f"片段含文档壳，请只输出 report-module: {path.name}")
        if "<style" in content.lower():
            die(f"片段含 <style>，样式应由 assemble 统一注入: {path.name}")
        parts.append(content)

    if missing:
        die(
            "缺少片段文件:\n  - "
            + "\n  - ".join(missing)
            + f"\n目录: {frag_dir}"
        )
    return parts, skipped


def build_title(json_path: Path | None, ts: str | None = None) -> str:
    stamp = ts or datetime.now().strftime("%Y%m%d%H%M")
    project_name = ""
    if json_path and json_path.exists():
        data = json.loads(json_path.read_text(encoding="utf-8"))
        project_name = ((data.get("headInfo") or {}).get("projectName") or "").strip()
    if project_name:
        return f"{project_name}-尽调调查报告-{stamp}"
    return f"尽调调查报告-{stamp}"


def assemble_document(
    *,
    style_block: str,
    fragments: list[str],
    title: str,
) -> str:
    body = "\n\n".join(fragments)
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
{style_block}
</head>
<body>
<div class="report-root">
{body}
</div>
</body>
</html>
"""


def sanity_check(html: str) -> list[str]:
    warnings: list[str] = []
    if "[object Object]" in html:
        warnings.append("发现 [object Object]：单元格可能未解包 cellType 对象")
    if re.search(r'\sstyle="', html):
        warnings.append("发现内联 style=，L2 禁止内联样式")
    if "<!-- SKIP -->" in html:
        warnings.append("文档中残留 <!-- SKIP -->")
    modules = re.findall(r'data-module-key="([^"]+)"', html)
    if len(modules) != len(set(modules)):
        warnings.append(f"data-module-key 重复: {modules}")
    return warnings


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="汇总小企业尽调报告 HTML 片段（L0 assemble）",
    )
    p.add_argument(
        "--json",
        type=Path,
        help="尽调全量 JSON（用于 title 的 headInfo.projectName）",
    )
    p.add_argument(
        "--fragments",
        type=Path,
        required=False,
        help="模块片段目录（含 01_*.html … 15_*.html）",
    )
    p.add_argument(
        "--output",
        "-o",
        type=Path,
        help="输出 HTML 路径",
    )
    p.add_argument(
        "--style-md",
        type=Path,
        default=STYLE_MD,
        help=f"L2 样式文档（默认: {STYLE_MD}）",
    )
    p.add_argument(
        "--supplements",
        type=Path,
        default=DEFAULT_SUPPLEMENTS,
        help=f"扩展 CSS（默认: {DEFAULT_SUPPLEMENTS}）",
    )
    p.add_argument(
        "--style-out",
        type=Path,
        help="仅写出合并后的 style.html（也可与 --output 同时用）",
    )
    p.add_argument(
        "--style-only",
        action="store_true",
        help="只生成样式，不拼装文档（需 --style-out）",
    )
    p.add_argument(
        "--timestamp",
        help="覆盖标题时间戳 yyyyMMddHHmm（默认当前时刻）",
    )
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    style_block = build_style_block(args.style_md, args.supplements)

    if args.style_out:
        args.style_out.parent.mkdir(parents=True, exist_ok=True)
        args.style_out.write_text(style_block + "\n", encoding="utf-8")
        print(f"已写入样式: {args.style_out} ({args.style_out.stat().st_size} bytes)")

    if args.style_only:
        if not args.style_out:
            die("--style-only 需要同时指定 --style-out")
        return

    if not args.fragments:
        die("请指定 --fragments 片段目录（或使用 --style-only）")
    if not args.output:
        die("请指定 --output / -o 输出路径")

    frag_dir = args.fragments.resolve()
    if not frag_dir.is_dir():
        die(f"片段目录不存在: {frag_dir}")

    fragments, skipped = collect_fragments(frag_dir)
    title = build_title(args.json.resolve() if args.json else None, args.timestamp)
    doc = assemble_document(style_block=style_block, fragments=fragments, title=title)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(doc, encoding="utf-8")

    warnings = sanity_check(doc)
    modules = re.findall(r'data-module-key="([^"]+)"', doc)
    print(f"已生成: {args.output}")
    print(f"  title   : {title}")
    print(f"  size    : {args.output.stat().st_size} bytes")
    print(f"  modules : {len(modules)} -> {', '.join(modules)}")
    if skipped:
        print(f"  skipped : {', '.join(skipped)}")
    for w in warnings:
        print(f"  警告    : {w}")


if __name__ == "__main__":
    main()
