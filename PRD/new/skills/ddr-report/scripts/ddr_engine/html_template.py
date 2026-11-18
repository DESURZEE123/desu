"""报告 HTML 的确定性拼接层。

LLM（render_* 节点）只产出带 class 的「模块 HTML 片段」，不含样式与文档壳；
固定 CSS、<style>、文档级 <html>/<head>/<body> 与 <title> 全部由本模块用代码注入一次，
避免 14 次 LLM 各自生成 CSS 导致样式漂移，也省下大段重复 token。

对应旧 L0（prjc_integrate_report）职责：「在所有模块片段之前输出一次 <style> 块」。
"""

from __future__ import annotations

import datetime as dt
import html
from functools import lru_cache
from pathlib import Path

# 旧 L2 §4.2 固定样式表，作为包内数据文件随代码分发（不手抄、不入库到 LLM 提示词）。
_CSS_PATH = Path(__file__).with_name("report.css")

# 旧 SKILL.md 标题规则：时间格式 yyyyMMddHHmm（年月日时分，无秒）。
_TITLE_TIME_FMT = "%Y%m%d%H%M"
_TITLE_SUFFIX = "尽调调查报告"


@lru_cache(maxsize=1)
def load_css() -> str:
    """读取固定 CSS（进程内只读一次）。"""
    return _CSS_PATH.read_text(encoding="utf-8")


def wrap_module(title: str, module_key: str, body: str) -> str:
    """把一个模块的 body 片段包进确定性外壳（蓝色标题栏 + 内容容器）。

    标题文案由代码取自 ModuleSpec.desc，LLM 不参与，避免 14 次渲染标题漂移。
    对应旧 L2 §5.1 模块容器结构。
    """
    return (
        f'<div class="report-module" data-module-key="{html.escape(module_key)}">\n'
        f'  <div class="report-module__header">{html.escape(title)}</div>\n'
        f'  <div class="report-module__body">\n{body}\n  </div>\n'
        f"</div>"
    )


def build_title(project_name: str | None, now: dt.datetime | None = None) -> str:
    """页面标题：<项目名>-尽调调查报告-<yyyyMMddHHmm>；项目名缺失则省略前缀。"""
    stamp = (now or dt.datetime.now()).strftime(_TITLE_TIME_FMT)
    name = (project_name or "").strip()
    if name:
        return f"{name}-{_TITLE_SUFFIX}-{stamp}"
    return f"{_TITLE_SUFFIX}-{stamp}"


def wrap_document(title: str, fragments: list[str]) -> str:
    """把有序模块片段拼进文档壳，并注入一次固定 CSS。

    fragments 已按 module_index 排序，每项是一个 report-module 片段。
    """
    body = "\n".join(f for f in fragments if f)
    return (
        "<!DOCTYPE html>\n"
        '<html lang="zh-CN">\n'
        "<head>\n"
        '<meta charset="UTF-8">\n'
        f"<title>{html.escape(title)}</title>\n"
        "<style>\n"
        f"{load_css()}\n"
        "</style>\n"
        "</head>\n"
        "<body>\n"
        '<div class="report-root">\n'
        f"{body}\n"
        "</div>\n"
        "</body>\n"
        "</html>\n"
    )
