"""预置总装驱动（agent 不需要写、也不要改它）。

职责：发现 /app/work/builders/*.py → 逐个 build_from_spec → render → 按 MODULE_INDEX
排序拼接 → 套文档壳 → 写 /app/work/report.html。

为什么做成预置脚本：让 agent 只关心「每个模块怎么取数、怎么映射」（builders/），
总装、排序、文档壳、CSS 注入这些机械且易错的部分一次写死、永不漂移。
这也是上次 workbuddy 那个 2718 行单文件在 py3.11 上直接编译不过的根因规避点。
"""

from __future__ import annotations

import glob
import importlib.util
import json
import sys
from pathlib import Path

# 路径全部按本脚本自身位置推算，无需任何环境变量/参数：
#   本文件   = <APP_ROOT>/skills/ddr-report/scripts/build_report.py
#   引擎     = 同目录 ddr_engine/
#   工作区   = <APP_ROOT>/work/
# 沙箱里 APP_ROOT 是 /app；本地自测把技能拷进同样布局的临时目录即可，脚本不用改。
_HERE = Path(__file__).resolve().parent
_APP_ROOT = _HERE.parent.parent.parent
sys.path.insert(0, str(_HERE))
from ddr_engine import html_template  # noqa: E402
from ddr_engine.dsl import build_from_spec  # noqa: E402
from ddr_engine.render import render_blocks  # noqa: E402

WORK = _APP_ROOT / "work"
INPUT = WORK / "input.json"
BUILDERS = WORK / "builders"
OUTPUT = WORK / "report.html"


def _load_builders() -> list:
    """发现式加载：builders/ 下每个非下划线 .py 即一个模块，不写死模块名/数量。"""
    mods = []
    for path in sorted(glob.glob(str(BUILDERS / "*.py"))):
        name = Path(path).stem
        if name.startswith("_"):
            continue
        spec = importlib.util.spec_from_file_location(name, path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        mods.append(mod)
    return mods


def main() -> None:
    with open(INPUT, encoding="utf-8") as f:
        customer_info = json.load(f)

    skipped: list[str] = []
    fragments: list[tuple[int, str]] = []
    for mod in _load_builders():
        key = getattr(mod, "MODULE_KEY", mod.__name__)
        title = getattr(mod, "MODULE_TITLE", key)
        index = getattr(mod, "MODULE_INDEX", 10**9)
        blocks = build_from_spec(customer_info, mod)
        if not blocks:
            skipped.append(key)
            continue
        body = render_blocks(blocks)
        fragments.append((index, html_template.wrap_module(title, key, body)))

    frags = [html for _, html in sorted(fragments, key=lambda x: x[0])]
    title = html_template.build_title((customer_info.get("headInfo") or {}).get("projectName"))
    Path(OUTPUT).write_text(html_template.wrap_document(title, frags), encoding="utf-8")
    print(f"modules: {len(frags)}")
    if skipped:
        print(f"skipped: {', '.join(sorted(skipped))}")


if __name__ == "__main__":
    main()
