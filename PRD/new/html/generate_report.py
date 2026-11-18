#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将 input.json 渲染为小企业尽调报告 HTML。
样式与结构按 prjc_style_render.md §4.2 / 5.x 规范。
"""
import json
import html as html_mod
import re
from datetime import datetime
from pathlib import Path

INPUT = '/Users/wangyiyang/Documents/code/workSpace/desu/PRD/new/json/input.json'
OUT_DIR = Path('/Users/wangyiyang/Documents/code/workSpace/desu/PRD/new/html')


# ============ 工具函数 ============
def esc(s):
    """HTML 转义"""
    if s is None:
        return ''
    return html_mod.escape(str(s), quote=True)


def fmt_amount(v):
    """金额千分位 + 2 位小数"""
    if v is None or v == '':
        return '—'
    if isinstance(v, str):
        s = v.strip()
        if s == '' or s == '—':
            return '—'
        try:
            f = float(s.replace(',', ''))
        except ValueError:
            return esc(s)
        return f"{f:,.2f}"
    try:
        return f"{float(v):,.2f}"
    except (ValueError, TypeError):
        return esc(str(v))


def show(v, fmt=None):
    """统一空值占位"""
    if v is None:
        return '—'
    if isinstance(v, str):
        s = v.strip()
        if s == '':
            return '—'
        if fmt == 'amount':
            return fmt_amount(s)
        return esc(s)
    if fmt == 'amount':
        return fmt_amount(v)
    return esc(str(v))


def join_names(worker_list, sep='、'):
    if not worker_list:
        return '—'
    names = [w.get('userName', '') for w in worker_list if w.get('userName')]
    return esc(sep.join(names)) if names else '—'


def md_to_html(md):
    """非常简单的 Markdown -> HTML，支持标题/列表/粗体/斜体/段落/换行"""
    if not md:
        return ''
    md = md.strip()
    if md == '{}':
        return ''
    lines = md.split('\n')
    out = []
    in_ul = False
    in_ol = False
    in_blockquote = False
    in_code = False

    def close_lists():
        nonlocal in_ul, in_ol
        if in_ul:
            out.append('</ul>')
            in_ul = False
        if in_ol:
            out.append('</ol>')
            in_ol = False

    def inline(text):
        # **bold**
        text = re.sub(r'\*\*([^*]+)\*\*', r'<strong>\1</strong>', text)
        # __bold__
        text = re.sub(r'__([^_]+)__', r'<strong>\1</strong>', text)
        # *italic*
        text = re.sub(r'\*([^*]+)\*', r'<em>\1</em>', text)
        # _italic_
        text = re.sub(r'_([^_]+)_', r'<em>\1</em>', text)
        # `code`
        text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)
        return text

    for raw in lines:
        line = raw.rstrip()
        if not line.strip():
            close_lists()
            if in_blockquote:
                out.append('</blockquote>')
                in_blockquote = False
            continue

        # 标题
        m = re.match(r'^(#{1,6})\s+(.+)$', line)
        if m:
            close_lists()
            level = len(m.group(1))
            out.append(f'<h{level}>{inline(esc(m.group(2)))}</h{level}>')
            continue

        # 列表
        m = re.match(r'^[-*]\s+(.+)$', line)
        if m:
            if not in_ul:
                close_lists()
                out.append('<ul>')
                in_ul = True
            out.append(f'<li>{inline(esc(m.group(1)))}</li>')
            continue

        m = re.match(r'^\d+\.\s+(.+)$', line)
        if m:
            if not in_ol:
                close_lists()
                out.append('<ol>')
                in_ol = True
            out.append(f'<li>{inline(esc(m.group(1)))}</li>')
            continue

        # 引用
        if line.startswith('>'):
            close_lists()
            if not in_blockquote:
                out.append('<blockquote>')
                in_blockquote = True
            out.append(f'<p>{inline(esc(line[1:].strip()))}</p>')
            continue

        # 分隔线
        if re.match(r'^---+$', line):
            close_lists()
            out.append('<hr/>')
            continue

        # 普通段落
        close_lists()
        if in_blockquote:
            out.append('</blockquote>')
            in_blockquote = False
        out.append(f'<p>{inline(esc(line))}</p>')

    close_lists()
    if in_blockquote:
        out.append('</blockquote>')
    return '\n'.join(out)


# ============ HTML 片段生成器 ============
CSS = '''
<style>
  .report-root { font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #1D2129; }
  .report-module { margin-bottom: 24px; }
  .report-module__header { background: #E8F3FF; padding: 10px 16px; font-size: 16px; font-weight: 600; color: #1D2129; border-radius: 4px 4px 0 0; }
  .report-module__body { padding: 16px; border: 1px solid #E5E6EB; border-top: none; border-radius: 0 0 4px 4px; }
  .report-block { margin-bottom: 20px; }
  .report-section-title { display: flex; align-items: center; margin-bottom: 12px; }
  .report-section-title__dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #1677FF; margin-right: 8px; }
  .report-section-title__text { font-size: 14px; font-weight: 600; color: #1677FF; }
  .report-section-heading { display: flex; align-items: center; margin-bottom: 12px; padding-left: 10px; border-left: 3px solid #1677FF; font-size: 14px; font-weight: 600; color: #1D2129; line-height: 22px; }
  .report-kv { display: flex; font-size: 14px; line-height: 22px; }
  .report-kv__label { color: #86909C; white-space: nowrap; flex-shrink: 0; }
  .report-kv__value { color: #1D2129; font-weight: 500; word-break: break-all; }
  .report-longtext { margin-bottom: 16px; }
  .report-longtext__label { color: #86909C; font-size: 14px; margin-bottom: 8px; }
  .report-longtext__value { color: #1D2129; font-size: 14px; line-height: 22px; white-space: pre-wrap; word-break: break-all; }
  .report-grid { display: flex; flex-wrap: wrap; }
  .report-grid__cell { padding-right: 16px; box-sizing: border-box; margin-bottom: 12px; }
  .report-grid__cell--w-25 { width: 25%; }
  .report-grid__cell--w-33 { width: 33.33%; }
  .report-grid__cell--w-50 { width: 50%; }
  .report-grid__cell--w-20 { width: 20%; }
  .report-grid__cell--w-100 { width: 100%; }
  .report-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .report-table thead tr { background: #F7F8FA; }
  .report-table th, .report-table td { padding: 10px 12px; border: 1px solid #E5E6EB; color: #1D2129; word-break: break-all; }
  .report-table th { text-align: left; font-weight: 600; }
  .report-table__summary-row { background: #FAFBFC; }
  .report-table__cell--strong { font-weight: 600; }
  .report-table__cell--align-center { text-align: center; }
  .report-table__cell--align-right { text-align: right; }
  .report-table__cell--highlight { color: #FF7D00; font-weight: 600; }
  .report-table__img { max-width: 120px; max-height: 120px; display: block; }
  .report-table-empty { padding: 24px; text-align: center; color: #86909C; font-size: 14px; border: 1px dashed #E5E6EB; border-radius: 4px; }
  .report-table__detail-row > td { padding: 0; background: #F7F8FA; border-bottom: 1px solid #E5E6EB; }
  .report-table__detail { padding: 12px 16px; background: #F7F8FA; }
  .report-table__detail .report-grid { margin: 0; }
  .report-table__detail .report-grid__cell { margin-bottom: 8px; }
  .report-table--stacked thead tr { background: #F7F8FA; }
  .report-table--stacked .report-table__head-row--top th,
  .report-table--stacked .report-table__head-row--bottom th { background: #F7F8FA; font-weight: 600; color: #1D2129; font-size: 14px; padding: 10px 12px; text-align: left; vertical-align: middle; }
  .report-table--stacked .report-table__head-row--bottom th { border-top: none; }
  .report-table--stacked .report-table__stack-label { display: block; font-weight: 600; color: #1D2129; line-height: 20px; }
  .report-table--stacked .report-table__stack-value { display: block; color: #1D2129; line-height: 20px; word-break: break-all; }
  .report-table--stacked .report-table__data-row--top td { border-bottom: none; vertical-align: bottom; }
  .report-table--stacked .report-table__data-row--bottom td { vertical-align: top; }
  .report-table--stacked .report-table__record-divider td { border-bottom: 2px solid #E5E6EB; }
  .report-table--stacked .report-table__summary-row--top td { border-bottom: none; background: #FAFBFC; }
  .report-table--stacked .report-table__summary-row--bottom td { background: #FAFBFC; }
  .report-table--stacked .report-table__index-cell { vertical-align: middle; text-align: center; }
  .report-table td[rowspan]:not(.report-table__index-cell) { vertical-align: middle; text-align: center; }
  .report-table--stacked .report-table__span-cell { vertical-align: middle !important; text-align: center; }
  .report-table__entity-sub { display: block; color: #86909C; font-size: 12px; line-height: 18px; font-weight: 400; text-align: center; }
  .report-table--stacked + .report-table--stacked { margin-top: 16px; }
  .report-empty__placeholder { padding: 24px; text-align: center; color: #86909C; font-size: 14px; border: 1px dashed #E5E6EB; border-radius: 4px; }
  .report-measure-list__items { display: flex; flex-direction: column; gap: 12px; }
  .report-measure-card { background: #F7F9FC; border: 1px solid #E5E6EB; border-radius: 4px; padding: 12px 16px; }
  .report-measure-card__head { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; line-height: 22px; }
  .report-measure-card__tag { display: inline-block; padding: 0 8px; height: 22px; line-height: 22px; border-radius: 2px; font-size: 12px; font-weight: 500; color: #FFFFFF; flex-shrink: 0; }
  .report-measure-card__tag--guarantee { background: #FF7D00; }
  .report-measure-card__tag--mortgage { background: #3491FA; }
  .report-measure-card__tag--pledge { background: #FF9A2E; }
  .report-measure-card__tag--default { background: #86909C; }
  .report-measure-card__name { font-size: 14px; font-weight: 500; color: #1677FF; }
  .report-measure-card__rel { display: inline-block; padding: 0 6px; height: 20px; line-height: 18px; border: 1px solid #00B42A; border-radius: 2px; background: #E8FFEA; color: #00B42A; font-size: 12px; flex-shrink: 0; }
  .report-measure-card__id { font-size: 14px; color: #4E5969; }
  .report-measure-card__attrs { display: flex; flex-wrap: wrap; margin-top: 10px; gap: 8px 24px; }
  .report-measure-card__attr { display: flex; font-size: 14px; line-height: 22px; }
  .report-measure-card__attr-label { color: #86909C; white-space: nowrap; }
  .report-measure-card__attr-value { color: #1D2129; font-weight: 500; }
  .report-measure-card__collateral { margin-top: 12px; }
  .report-measure-card__collateral-title { display: flex; align-items: center; font-size: 14px; font-weight: 600; color: #1D2129; margin-bottom: 8px; }
  .report-measure-card__collateral-title::before { content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #1D2129; margin-right: 8px; }
  .report-measure-card__collateral .report-table th,
  .report-measure-card__collateral .report-table td { text-align: left; }
  .report-analysis-list__items { display: flex; flex-direction: column; gap: 16px; }
  .report-analysis-item__entity { display: flex; align-items: center; margin-bottom: 8px; }
  .report-analysis-item__entity-dot { display: inline-block; width: 8px; height: 8px; background: #1677FF; margin-right: 8px; flex-shrink: 0; }
  .report-analysis-item__entity-name { font-size: 14px; font-weight: 600; color: #1677FF; line-height: 22px; }
  .report-analysis-item__conclusion { background: #F7F8FA; border: 1px solid #E5E6EB; border-radius: 4px; padding: 12px 16px; }
  .report-analysis-item__empty { color: #86909C; font-size: 14px; line-height: 22px; }
  .report-md { color: #1D2129; font-size: 14px; line-height: 22px; word-break: break-all; }
  .report-md > *:first-child { margin-top: 0; }
  .report-md > *:last-child { margin-bottom: 0; }
  .report-md h1, .report-md h2, .report-md h3, .report-md h4, .report-md h5, .report-md h6 { color: #1D2129; font-weight: 600; margin: 12px 0 8px; line-height: 24px; }
  .report-md h1 { font-size: 16px; }
  .report-md h2 { font-size: 15px; }
  .report-md h3 { font-size: 14px; }
  .report-md h4, .report-md h5, .report-md h6 { font-size: 14px; }
  .report-md p { margin: 0 0 8px; }
  .report-md ul, .report-md ol { margin: 0 0 8px; padding-left: 1.5em; }
  .report-md li { margin-bottom: 4px; }
  .report-md li > ul, .report-md li > ol { margin-top: 4px; margin-bottom: 0; }
  .report-md strong { font-weight: 600; }
  .report-md em { font-style: italic; }
  .report-md blockquote { margin: 8px 0; padding: 8px 12px; border-left: 3px solid #E5E6EB; color: #4E5969; background: #FAFBFC; }
  .report-md hr { border: none; border-top: 1px solid #E5E6EB; margin: 12px 0; }
  .report-md code { font-family: Menlo, Consolas, monospace; font-size: 12px; background: #F2F3F5; padding: 1px 4px; border-radius: 2px; }
  .report-md pre { background: #F7F8FA; border: 1px solid #E5E6EB; border-radius: 4px; padding: 10px 12px; overflow-x: auto; margin: 8px 0; }
  .report-md pre code { background: none; padding: 0; }
  .report-md table { width: 100%; border-collapse: collapse; font-size: 14px; margin: 8px 0 12px; }
  .report-md th, .report-md td { padding: 8px 10px; border: 1px solid #E5E6EB; color: #1D2129; word-break: break-all; text-align: left; }
  .report-md th { background: #F7F8FA; font-weight: 600; }

  /* ===== 扩展：labelPanel（项目概要双卡） ===== */
  .report-label-panel { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
  .report-label-card { flex: 1; min-width: 280px; border-radius: 4px; padding: 12px 16px; border: 1px solid #E5E6EB; }
  .report-label-card--warning { background: #FFF7E8; border-color: #FFD591; }
  .report-label-card--negative { background: #FFECE8; border-color: #FDCDCB; }
  .report-label-card__title { font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #1D2129; }
  .report-label-card__list { margin: 0; padding-left: 1.5em; font-size: 14px; line-height: 22px; color: #1D2129; }
  .report-label-card__list li { margin-bottom: 4px; }

  /* ===== 扩展：司法诉讼卡片 ===== */
  .report-litigation-cards { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
  .report-litigation-card { min-width: 180px; max-width: 240px; padding: 12px 16px; border-radius: 6px; color: #fff; position: relative; }
  .report-litigation-card--highRisk { background: linear-gradient(135deg, #F53F3F, #F76560); }
  .report-litigation-card--common { background: linear-gradient(135deg, #1677FF, #3491FA); }
  .report-litigation-card__num { position: absolute; top: 8px; right: 12px; font-size: 18px; font-weight: 700; }
  .report-litigation-card__type { font-size: 14px; font-weight: 500; margin-top: 12px; text-align: center; }
  .report-litigation-update { font-size: 12px; color: #86909C; margin-bottom: 8px; text-align: right; }

  /* ===== 扩展：关联企业概要卡片 ===== */
  .report-synopsis-list { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
  .report-synopsis-card { background: #F7F9FC; border: 1px solid #E5E6EB; border-radius: 4px; padding: 12px 16px; min-width: 240px; position: relative; }
  .report-synopsis-card__tag { display: inline-block; padding: 2px 8px; font-size: 12px; color: #fff; transform: skewX(-10deg); margin-bottom: 6px; }
  .report-synopsis-card__tag--guarantor { background: #3491FA; }
  .report-synopsis-card__tag--nonGuarantor { background: #FFB84D; }
  .report-synopsis-card__name { font-size: 14px; font-weight: 600; color: #1D2129; margin-bottom: 4px; }
  .report-synopsis-card__id { font-size: 12px; color: #86909C; }

  /* ===== 扩展：关联企业详情标题 ===== */
  .report-related-detail { margin-bottom: 16px; }
  .report-related-detail__header { background: #F0F6FF; padding: 8px 12px; font-size: 14px; font-weight: 600; color: #1677FF; border-left: 3px solid #1677FF; margin-bottom: 12px; }
  .report-related-detail__body { padding-left: 12px; }

  /* ===== 扩展：担保人/担保企业详情标题 ===== */
  .report-detail-title { font-size: 14px; font-weight: 600; color: #1677FF; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 1px solid #E5E6EB; }

  /* ===== 扩展：附件分区 ===== */
  .report-attachment-section { margin-bottom: 20px; }
  .report-attachment-section__title { border-left: 3px solid #1677FF; padding-left: 10px; font-size: 14px; font-weight: 600; color: #1D2129; }
  .report-attachment-section__subtitle { font-size: 12px; color: #86909C; padding-left: 13px; margin-top: 2px; border-bottom: 1px solid #E5E6EB; padding-bottom: 6px; margin-bottom: 12px; }
  .report-attachment-files { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .report-attachment-file { background: #F7F9FC; border: 1px solid #E5E6EB; border-radius: 4px; padding: 8px 12px; }
  .report-attachment-file__name { font-size: 13px; color: #1D2129; font-weight: 500; margin-bottom: 4px; word-break: break-all; }
  .report-attachment-file__meta { font-size: 12px; color: #86909C; }

  /* ===== 扩展：财务报表主体标题 ===== */
  .report-fs-subject { margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #E5E6EB; }
  .report-fs-subject__title { font-size: 14px; font-weight: 600; color: #1D2129; }
  .report-fs-subject__source { font-size: 12px; color: #86909C; margin-top: 2px; }
  .report-fs-table-wrap { margin-bottom: 16px; }
  .report-fs-table__label { font-size: 14px; font-weight: 600; color: #1D2129; margin-bottom: 4px; }
  .report-fs-table__unit { font-size: 12px; color: #86909C; margin-bottom: 6px; }
  .report-fs-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .report-fs-table th, .report-fs-table td { padding: 6px 10px; border: 1px solid #E5E6EB; color: #1D2129; }
  .report-fs-table th { background: #F7F8FA; font-weight: 600; text-align: left; }
  .report-fs-table td.report-fs-amount { text-align: right; }
  .report-fs-rowlevel-1 { background: #FFECE8; font-weight: 600; }
  .report-fs-rowlevel-2 { background: #FFF7E8; font-weight: 600; }
  .report-fs-rowlevel-3 { }
  .report-fs-rowlevel-3 td:first-child { padding-left: 24px; }
  .report-fs-period-tag { display: inline-block; padding: 1px 6px; background: #FFECE8; color: #F53F3F; font-size: 11px; border-radius: 2px; margin-left: 4px; }
</style>
'''


def section_title(label):
    if not label:
        return ''
    return f'''<div class="report-section-title">
  <span class="report-section-title__dot"></span>
  <span class="report-section-title__text">{esc(label)}</span>
</div>'''


def section_heading(label):
    if not label:
        return ''
    return f'<div class="report-block"><div class="report-section-heading">{esc(label)}</div></div>'


def render_kv(label, value, full_width=False):
    return f'''<div class="report-kv">
  <span class="report-kv__label">{esc(label)}：</span>
  <span class="report-kv__value">{value}</span>
</div>'''


def render_longtext(label, value):
    if label:
        label_html = f'<div class="report-longtext__label">{esc(label)}：</div>'
    else:
        label_html = ''
    return f'''<div class="report-block report-longtext">
  {label_html}
  <div class="report-longtext__value">{value}</div>
</div>'''


def render_group(label, children, columns=4):
    """children: list of (label, value_html, full_width) 或 dict"""
    title_html = section_title(label) if label else ''
    col_class = {4: 'report-grid__cell--w-25', 3: 'report-grid__cell--w-33',
                 2: 'report-grid__cell--w-50', 1: 'report-grid__cell--w-100',
                 5: 'report-grid__cell--w-20'}.get(columns, 'report-grid__cell--w-25')
    cells = []
    for child in children:
        # child: (label, value, full_width)
        c_label, c_value, c_full = child
        cell_cls = 'report-grid__cell report-grid__cell--w-100' if c_full else f'report-grid__cell {col_class}'
        # longText 渲染方式
        if '\n' in str(c_value) or (isinstance(c_value, str) and len(c_value) > 60):
            content = f'''<div class="report-longtext">
  <div class="report-longtext__label">{esc(c_label)}：</div>
  <div class="report-longtext__value">{c_value}</div>
</div>'''
        else:
            content = render_kv(c_label, c_value)
        cells.append(f'<div class="{cell_cls}">{content}</div>')
    return f'''<div class="report-block report-group">
  {title_html}
  <div class="report-grid">
    {''.join(cells)}
  </div>
</div>'''


def align_class(align):
    if align == 'center':
        return ' report-table__cell--align-center'
    if align == 'right':
        return ' report-table__cell--align-right'
    return ''


def render_cell_value(v, highlight=False):
    if v is None or (isinstance(v, str) and v.strip() == ''):
        return '—'
    if isinstance(v, dict):
        # 高亮单元格 {value, cellType: 'highlight'}
        if v.get('cellType') == 'highlight' or v.get('highlight'):
            val = v.get('value', '')
            return f'<span class="report-table__cell--highlight">{esc(val)}</span>'
        val = v.get('value', '')
        return esc(str(val)) if val not in (None, '') else '—'
    s = str(v)
    if s.strip() == '':
        return '—'
    if highlight:
        return f'<span class="report-table__cell--highlight">{esc(s)}</span>'
    return esc(s)


def render_table(label, columns, rows, show_index=False, summary=None, empty_text='暂无数据'):
    """标准单行表 (columns <= 8)"""
    title_html = section_title(label) if label else ''
    if not rows:
        return f'''<div class="report-block report-table-block">
  {title_html}
  <div class="report-table-empty">{esc(empty_text)}</div>
</div>'''

    # 处理 mergeSame（标准单行表）
    merge_cols_idx = [i for i, c in enumerate(columns) if c.get('mergeSame')]
    merge_rowspan = {}  # (col_idx, row_idx) -> rowspan or 'skip'
    for col_idx in merge_cols_idx:
        col_key = columns[col_idx]['key']
        i = 0
        while i < len(rows):
            val_i = rows[i].get(col_key)
            if isinstance(val_i, dict):
                val_i = val_i.get('value')
            if val_i in (None, '', '—'):
                i += 1
                continue
            j = i + 1
            while j < len(rows):
                val_j = rows[j].get(col_key)
                if isinstance(val_j, dict):
                    val_j = val_j.get('value')
                if val_j == val_i and val_j not in (None, '', '—'):
                    j += 1
                else:
                    break
            n = j - i
            merge_rowspan[(col_idx, i)] = n
            for k in range(i + 1, j):
                merge_rowspan[(col_idx, k)] = 'skip'
            i = j

    thead_cells = []
    if show_index:
        thead_cells.append('<th>序号</th>')
    for c in columns:
        cls = align_class(c.get('align'))
        thead_cells.append(f'<th class="{cls.strip()}">{esc(c.get("label", ""))}</th>' if cls else f'<th>{esc(c.get("label", ""))}</th>')

    body_rows = []
    for r_idx, row in enumerate(rows):
        tds = []
        if show_index:
            tds.append(f'<td>{r_idx + 1}</td>')
        for c_idx, c in enumerate(columns):
            # 跳过被 merge 的单元格
            if (c_idx, r_idx) in merge_rowspan and merge_rowspan[(c_idx, r_idx)] == 'skip':
                continue
            key = c.get('key')
            val = row.get(key)
            cls = align_class(c.get('align'))
            rowspan_attr = ''
            if (c_idx, r_idx) in merge_rowspan and merge_rowspan[(c_idx, r_idx)] != 'skip':
                n = merge_rowspan[(c_idx, r_idx)]
                if n > 1:
                    rowspan_attr = f' rowspan="{n}"'
            cell_html = render_cell_value(val)
            tds.append(f'<td{rowspan_attr}{(" class=\"" + cls.strip() + "\"") if cls else ""}>{cell_html}</td>')
        body_rows.append('<tr>' + ''.join(tds) + '</tr>')

        # 行内详情 detail
        detail = row.get('detail')
        if detail:
            detail_children = detail.get('children', [])
            d_cols = detail.get('columns', 5)
            col_cls = {4: 'report-grid__cell--w-25', 3: 'report-grid__cell--w-33',
                       2: 'report-grid__cell--w-50', 5: 'report-grid__cell--w-20',
                       1: 'report-grid__cell--w-100'}.get(d_cols, 'report-grid__cell--w-20')
            cells_html = []
            for ch in detail_children:
                ch_label = ch.get('label', '')
                ch_value = ch.get('value', '—')
                ch_full = ch.get('fullWidth', False)
                cls = 'report-grid__cell report-grid__cell--w-100' if ch_full else f'report-grid__cell {col_cls}'
                kv = f'''<div class="report-kv">
  <span class="report-kv__label">{esc(ch_label)}：</span>
  <span class="report-kv__value">{esc(str(ch_value)) if ch_value not in (None, '') else '—'}</span>
</div>'''
                cells_html.append(f'<div class="{cls}">{kv}</div>')
            colspan = len(columns) + (1 if show_index else 0)
            detail_html = f'''<tr class="report-table__detail-row">
  <td colspan="{colspan}">
    <div class="report-table__detail">
      <div class="report-grid">{''.join(cells_html)}</div>
    </div>
  </td>
</tr>'''
            body_rows.append(detail_html)

    # summary
    if summary:
        s_tds = []
        if show_index:
            s_tds.append(f'<td class="report-table__cell--strong">{esc(summary.get("index", "合计"))}</td>')
        for c in columns:
            key = c.get('key')
            s_val = summary.get(key, '—')
            cls = align_class(c.get('align'))
            strong = ' report-table__cell--strong' if s_val not in ('—', None, '') else ''
            combined_cls = (cls + strong).strip()
            cls_attr = f' class="{combined_cls}"' if combined_cls else ''
            s_tds.append(f'<td{cls_attr}>{render_cell_value(s_val)}</td>')
        body_rows.append('<tr class="report-table__summary-row">' + ''.join(s_tds) + '</tr>')

    return f'''<div class="report-block report-table-block">
  {title_html}
  <table class="report-table">
    <thead><tr>{''.join(thead_cells)}</tr></thead>
    <tbody>{''.join(body_rows)}</tbody>
  </table>
</div>'''


def render_measure_list(label, items, empty_text='暂无增信措施'):
    title_html = section_title(label) if label else ''
    if not items:
        return f'''<div class="report-block report-measure-list">
  {title_html}
  <div class="report-table-empty">{esc(empty_text)}</div>
</div>'''
    cards = []
    for item in items:
        tone = item.get('guaranteeTone', 'default')
        method = show(item.get('guaranteeMethod'))
        name = show(item.get('customerName'))
        rel = item.get('relationship')
        rel_html = f'<span class="report-measure-card__rel">{esc(rel)}</span>' if rel else ''
        cr_type = item.get('crdntlsType', '')
        doc_code = item.get('documentCode', '')
        if cr_type and doc_code:
            id_html = f'<span class="report-measure-card__id">{esc(cr_type)}：{esc(doc_code)}</span>'
        elif cr_type or doc_code:
            id_html = f'<span class="report-measure-card__id">{esc(cr_type or doc_code)}</span>'
        else:
            id_html = '<span class="report-measure-card__id">—</span>'

        head = f'''<div class="report-measure-card__head">
  <span class="report-measure-card__tag report-measure-card__tag--{esc(tone)}">{method}</span>
  <span class="report-measure-card__name">{name}</span>
  {rel_html}
  {id_html}
</div>'''

        # attrs
        attrs_html = ''
        attrs = item.get('attrs') or []
        if attrs:
            attr_items = []
            for a in attrs:
                attr_items.append(f'''<div class="report-measure-card__attr">
  <span class="report-measure-card__attr-label">{esc(a.get('label', ''))}：</span>
  <span class="report-measure-card__attr-value">{show(a.get('value'))}</span>
</div>''')
            attrs_html = f'<div class="report-measure-card__attrs">{"".join(attr_items)}</div>'

        # collateral
        collateral_html = ''
        collateral = item.get('collateral')
        if collateral:
            col_cols = collateral.get('columns', [])
            col_rows = collateral.get('rows', [])
            col_label = collateral.get('label', '担保物')
            show_idx = collateral.get('showIndex', False)
            col_thead = []
            if show_idx:
                col_thead.append('<th>序号</th>')
            for c in col_cols:
                col_thead.append(f'<th>{esc(c.get("label", ""))}</th>')
            col_body = []
            for r_i, r in enumerate(col_rows):
                tds = []
                if show_idx:
                    tds.append(f'<td>{r_i + 1}</td>')
                for c in col_cols:
                    tds.append(f'<td>{render_cell_value(r.get(c.get("key")))}</td>')
                col_body.append('<tr>' + ''.join(tds) + '</tr>')
            collateral_html = f'''<div class="report-measure-card__collateral">
  <div class="report-measure-card__collateral-title">{esc(col_label)}</div>
  <table class="report-table">
    <thead><tr>{''.join(col_thead)}</tr></thead>
    <tbody>{''.join(col_body)}</tbody>
  </table>
</div>'''

        cards.append(f'<div class="report-measure-card">{head}{attrs_html}{collateral_html}</div>')

    return f'''<div class="report-block report-measure-list">
  {title_html}
  <div class="report-measure-list__items">{''.join(cards)}</div>
</div>'''


def render_analysis_list(label, items, empty_text='暂无分析结果'):
    title_html = section_title(label) if label else ''
    if not items:
        return f'''<div class="report-block report-analysis-list">
  {title_html}
  <div class="report-table-empty">{esc(empty_text)}</div>
</div>'''
    items_html = []
    for item in items:
        name = item.get('customerName')
        entity_html = ''
        if name:
            entity_html = f'''<div class="report-analysis-item__entity">
  <span class="report-analysis-item__entity-dot"></span>
  <span class="report-analysis-item__entity-name">{esc(name)}</span>
</div>'''
        conclusion = item.get('conclusion')
        if conclusion:
            md_html = md_to_html(conclusion)
            content_html = f'<div class="report-md">{md_html}</div>'
        else:
            content_html = '<div class="report-analysis-item__empty">—</div>'
        items_html.append(f'''<div class="report-analysis-item">
  {entity_html}
  <div class="report-analysis-item__conclusion">{content_html}</div>
</div>''')
    return f'''<div class="report-block report-analysis-list">
  {title_html}
  <div class="report-analysis-list__items">{''.join(items_html)}</div>
</div>'''


def render_label_panel(panels):
    if not panels:
        return ''
    cards = []
    for p in panels:
        tone = p.get('tone', 'warning')
        label = p.get('label', '')
        items = p.get('items', []) or []
        lis = ''.join(f'<li>{esc(it)}</li>' for it in items if it and str(it).strip())
        cards.append(f'''<div class="report-label-card report-label-card--{esc(tone)}">
  <div class="report-label-card__title">{esc(label)}</div>
  <ul class="report-label-card__list">{lis}</ul>
</div>''')
    return f'<div class="report-block"><div class="report-label-panel">{"".join(cards)}</div></div>'


def render_litigation_cards(cards, update_time=None, empty_text='客户暂无司法诉讼数据', label=None):
    title_html = section_title(label) if label else ''
    update_html = f'<div class="report-litigation-update">司法诉讼数据更新时间：{esc(update_time)}</div>' if update_time else ''
    valid_cards = [c for c in (cards or []) if c.get('caseNum') and int(c.get('caseNum', 0)) > 0]
    if not valid_cards:
        body = f'<div class="report-table-empty">{esc(empty_text)}</div>'
    else:
        cs = []
        for c in valid_cards:
            tone = c.get('tone', 'common')
            cs.append(f'''<div class="report-litigation-card report-litigation-card--{esc(tone)}">
  <div class="report-litigation-card__num">{esc(str(c.get('caseNum', 0)))}</div>
  <div class="report-litigation-card__type">{esc(c.get('caseType', ''))}</div>
</div>''')
        body = f'<div class="report-litigation-cards">{"".join(cs)}</div>'
    return f'<div class="report-block">{title_html}{update_html}{body}</div>'


def render_synopsis(items):
    if not items:
        return '<div class="report-block"><div class="report-table-empty">暂无关联企业</div></div>'
    cards = []
    for it in items:
        tag = it.get('guarantorTag', '')
        tone = it.get('guarantorTone', 'nonGuarantor')
        name = show(it.get('customerName'))
        code = show(it.get('crdntlsCode'))
        cards.append(f'''<div class="report-synopsis-card">
  <div class="report-synopsis-card__tag report-synopsis-card__tag--{esc(tone)}">{esc(tag)}</div>
  <div class="report-synopsis-card__name">{name}</div>
  <div class="report-synopsis-card__id">{code}</div>
</div>''')
    return f'<div class="report-block"><div class="report-synopsis-list">{"".join(cards)}</div></div>'


def render_attachment_sections(sections):
    out = []
    for sec in sections:
        title = sec.get('modelName', '')
        sub = sec.get('documentDirDesc', '')
        files = sec.get('files', []) or []
        file_cards = []
        for f in files:
            file_cards.append(f'''<div class="report-attachment-file">
  <div class="report-attachment-file__name">{esc(f.get('fileName', ''))}</div>
  <div class="report-attachment-file__meta">{esc(f.get('documentType', ''))} · {esc(f.get('uploadTime', ''))}</div>
</div>''')
        files_html = f'<div class="report-attachment-files">{"".join(file_cards)}</div>' if file_cards else ''
        out.append(f'''<div class="report-attachment-section">
  <div class="report-attachment-section__title">{esc(title)}</div>
  <div class="report-attachment-section__subtitle">{esc(sub)}</div>
  {files_html}
</div>''')
    return '<div class="report-block">' + ''.join(out) + '</div>'


def module_wrapper(module_name, module_key, body_html):
    return f'''<div class="report-module" data-module-key="{esc(module_key)}">
  <div class="report-module__header">{esc(module_name)}</div>
  <div class="report-module__body">
{body_html}
  </div>
</div>'''


# =============================================================
# 各模块渲染逻辑（L1 + L2 合并，因 input.json 是原始接口数据，不是结构化 L1 输出）
# =============================================================

def module_project_change(data):
    pc = data.get('projectChange')
    if not pc:
        return ''
    ct = (pc.get('changeType') or '').strip()
    if ct not in ('审批变更', '审批修改'):
        return ''
    body = []
    body.append(render_longtext('审批变更原因', show(pc.get('changeReason'))))
    body.append(f'<div class="report-block">{render_kv("审批变更类型", show(ct))}</div>')
    return module_wrapper('项目变更信息', 'project_change', '\n'.join(body))


def module_project_summary(data):
    li = data.get('labelInfo')
    if not li:
        return ''
    risk = [s for s in (li.get('riskLabel') or []) if s and str(s).strip()]
    neg = [s for s in (li.get('negativeList') or []) if s and str(s).strip()]
    desc = (li.get('labelDesc') or '').strip()
    if not risk and not neg and not desc:
        return ''
    body = []
    panels = []
    if risk:
        panels.append({'label': '警示清单', 'tone': 'warning', 'items': risk})
    if neg:
        panels.append({'label': '负面清单', 'tone': 'negative', 'items': neg})
    if panels:
        body.append(render_label_panel(panels))
    if panels and desc:
        body.append(render_longtext('突破负面清单/警示清单说明', esc(desc)))
    return module_wrapper('项目概要', 'project_summary', '\n'.join(body))


def module_cooperation_history(data):
    cm = data.get('commonCollaborationHistoryModel')
    if not cm:
        return ''
    lease_list = cm.get('leaseCollaborationHistoryList') or []
    guar_list = cm.get('guarantorCollaborationHistories') or []
    lease_total = cm.get('leaseAmountTotal') or {}
    guar_total = cm.get('guarantorAmountTotal') or {}
    desc = cm.get('cooperateHistoryDesc')

    body = []

    # 表 1：承租人情况
    cols1 = [
        {'key': 'customerName', 'label': '客户名称'},
        {'key': 'customerRole', 'label': '客户角色'},
        {'key': 'leaseMethodFact', 'label': '租赁方式(实际)'},
        {'key': 'contName', 'label': '合同名称'},
        {'key': 'irr', 'label': '内部收益率(%)'},
        {'key': 'cmprhnsvIrr', 'label': '综合收益率(%)'},
        {'key': 'contCashPledge', 'label': '合同金额(元)'},
        {'key': 'corpusBalancePledge', 'label': '剩余本金(元)'},
        {'key': 'curOverdueAmount', 'label': '当前逾期金额(元)'},
        {'key': 'leaseBeginDate', 'label': '合同起租日'},
        {'key': 'contEndDate', 'label': '合同到期日'},
        {'key': 'curOverdueDays', 'label': '当前逾期天数'},
        {'key': 'historyOverdueDays', 'label': '历史最大逾期天数'},
        {'key': 'historyOverdueTimes', 'label': '历史逾期期数'},
    ]
    rows1 = []
    for it in lease_list:
        rows1.append({
            'customerName': show(it.get('customerName')),
            'customerRole': show(it.get('customerRole')),
            'leaseMethodFact': show(it.get('leaseMethodFact')),
            'contName': show(it.get('contName')),
            'irr': show(it.get('irr')),
            'cmprhnsvIrr': show(it.get('cmprhnsvIrr')),
            'contCashPledge': fmt_amount(it.get('contCashPledge')),
            'corpusBalancePledge': fmt_amount(it.get('corpusBalancePledge')),
            'curOverdueAmount': fmt_amount(it.get('curOverdueAmount')),
            'leaseBeginDate': show(it.get('leaseBeginDate')),
            'contEndDate': show(it.get('contEndDate')),
            'curOverdueDays': show(it.get('curOverdueDays')),
            'historyOverdueDays': show(it.get('historyOverdueDays')),
            'historyOverdueTimes': show(it.get('historyOverdueTimes')),
        })
    summary1 = {
        'index': '合计',
        'contCashPledge': fmt_amount(lease_total.get('contCashPledge')),
        'corpusBalancePledge': fmt_amount(lease_total.get('riskExposure')),
        'curOverdueAmount': fmt_amount(lease_total.get('curOverdueAmount')),
    }
    empty1 = '暂无合作历史数据' if (lease_list or guar_list) else '所有客户均无合作历史数据'
    body.append(render_table('承租人、关联方、担保人作为承租人情况',
                             cols1, rows1, show_index=True, summary=summary1, empty_text=empty1))

    # 表 2：担保人情况
    cols2 = [
        {'key': 'customerName', 'label': '客户名称'},
        {'key': 'customerRole', 'label': '客户角色'},
        {'key': 'guaranteeMethod', 'label': '担保方式'},
        {'key': 'contName', 'label': '合同名称'},
        {'key': 'irr', 'label': '内部收益率(%)'},
        {'key': 'cmprhnsvIrr', 'label': '综合收益率(%)'},
        {'key': 'leaseMethodFact', 'label': '租赁方式(实际)'},
        {'key': 'contCashPledge', 'label': '合同金额(元)'},
        {'key': 'corpusBalancePledge', 'label': '剩余本金(元)'},
        {'key': 'curOverdueAmount', 'label': '当前逾期金额(元)'},
        {'key': 'leaseBeginDate', 'label': '合同起租日'},
        {'key': 'contEndDate', 'label': '合同到期日'},
        {'key': 'curOverdueDays', 'label': '当前逾期天数'},
        {'key': 'historyOverdueDays', 'label': '历史最大逾期天数'},
        {'key': 'historyOverdueTimes', 'label': '历史逾期期数'},
    ]
    rows2 = []
    for it in guar_list:
        rows2.append({
            'customerName': show(it.get('customerName')),
            'customerRole': show(it.get('customerRole')),
            'guaranteeMethod': show(it.get('guaranteeMethod')),
            'contName': show(it.get('contName')),
            'irr': show(it.get('irr')),
            'cmprhnsvIrr': show(it.get('cmprhnsvIrr')),
            'leaseMethodFact': show(it.get('leaseMethodFact')),
            'contCashPledge': fmt_amount(it.get('contCashPledge')),
            'corpusBalancePledge': fmt_amount(it.get('corpusBalancePledge')),
            'curOverdueAmount': fmt_amount(it.get('curOverdueAmount')),
            'leaseBeginDate': show(it.get('leaseBeginDate')),
            'contEndDate': show(it.get('contEndDate')),
            'curOverdueDays': show(it.get('curOverdueDays')),
            'historyOverdueDays': show(it.get('historyOverdueDays')),
            'historyOverdueTimes': show(it.get('historyOverdueTimes')),
        })
    summary2 = {
        'index': '合计',
        'contCashPledge': fmt_amount(guar_total.get('contCashPledge')),
        'corpusBalancePledge': fmt_amount(guar_total.get('riskExposure')),
        'curOverdueAmount': fmt_amount(guar_total.get('curOverdueAmount')),
    }
    body.append(render_table('承租人、关联方、担保人作为担保人情况',
                             cols2, rows2, show_index=True, summary=summary2, empty_text=empty1))

    # 合作历史说明
    if lease_list or guar_list:
        body.append(render_longtext('合作历史说明', show(desc)))
    return module_wrapper('合作历史', 'cooperation_history', '\n'.join(body))


def module_project_base_info(data):
    pbi = data.get('projectBaseInfo')
    if not pbi:
        return ''
    body = []

    # 首屏 group
    children = []
    children.append(('客户名称', show(pbi.get('customerName')), False))
    children.append(('项目金额(元)', fmt_amount(pbi.get('projectAmount')), False))
    children.append(('项目类型', show(pbi.get('projectType')), False))
    if (pbi.get('projectType') or '') == '老客租项目':
        old_conts = pbi.get('oldContInfoList') or []
        old_names = [c.get('oldContName', '') for c in old_conts if c.get('oldContName')]
        children.append(('对应老合同', esc('；'.join(old_names)) if old_names else '—', False))
    children.append(('业务信息来源', show(pbi.get('projectSource')), False))
    children.append(('租赁方式', show(pbi.get('leaseMethod')), False))
    children.append(('资金用途', show(pbi.get('capitalUse')), False))
    children.append(('售后回租(新设备)原因', show(pbi.get('leasebackReason')), False))
    children.append(('售后回租(新设备)原因说明', show(pbi.get('leasebackExplain')), True))
    children.append(('投保情况', show(pbi.get('insuranceSituation')), False))
    children.append(('项目经理', show(pbi.get('managerName')), False))
    children.append(('项目协办人', show(pbi.get('custHelpName')), False))
    settle = pbi.get('settleBeLeaseContList') or []
    settle_names = [c.get('contName', '') if isinstance(c, dict) else str(c) for c in settle]
    children.append(('起租前结清合同', esc('；'.join([s for s in settle_names if s])) if settle_names else '—', False))
    children.append(('租赁物保险', show(pbi.get('leaseInsurance')), True))

    # 自定义 group 渲染（不传 label，无圆点标题）
    col_class = 'report-grid__cell--w-25'
    cells_html = []
    for c_label, c_value, c_full in children:
        cell_cls = 'report-grid__cell report-grid__cell--w-100' if c_full else f'report-grid__cell {col_class}'
        if c_full:
            content = f'''<div class="report-longtext">
  <div class="report-longtext__label">{esc(c_label)}：</div>
  <div class="report-longtext__value">{c_value}</div>
</div>'''
        else:
            content = render_kv(c_label, c_value)
        cells_html.append(f'<div class="{cell_cls}">{content}</div>')
    body.append(f'''<div class="report-block report-group">
  <div class="report-grid">{''.join(cells_html)}</div>
</div>''')

    # 环境与社会风险评估
    env = pbi.get('environmentAndSocialRisk')
    if env:
        env_rows = [
            {'indicator': '拟承租人经营活动是否涉及业务排除清单', 'result': show(env.get('exclusionBusinessResult'))},
            {'indicator': '所属行业是否为国家产业政策、行业准入政策限制的行业', 'result': show(env.get('policyRestrictResult'))},
            {'indicator': '是否取得主管部门颁发的特定行业的许可经营证明', 'result': show(env.get('operateLicenseResult'))},
            {'indicator': '是否存在国家或省级主管部门认定的重大环境、安全生产违法违规行为', 'result': show(env.get('offenceResult'))},
            {'indicator': '租赁物是否存在环境和社会风险隐患（易燃易爆物、危险化学品、有毒有害物等）', 'result': show(env.get('hiddenRiskResult'))},
            {'indicator': '评估结论（高、中、低）', 'result': show(env.get('assessResult'))},
        ]
        body.append(render_table('环境与社会风险评估',
                                 [{'key': 'indicator', 'label': '指标'}, {'key': 'result', 'label': '结果'}],
                                 env_rows, show_index=False, empty_text='暂无评估信息'))

    # 现场尽调情况
    site_list = pbi.get('siteSituationList') or []
    site_rows = []
    for s in site_list:
        site_rows.append({
            'workerList': join_names(s.get('workerList')),
            'signDate': show(s.get('signDate')),
            'address': show(s.get('address')),
            'context': show(s.get('context')),
        })
    body.append(render_table('现场尽调情况',
                             [{'key': 'workerList', 'label': '尽调人员'},
                              {'key': 'signDate', 'label': '尽调日期'},
                              {'key': 'address', 'label': '地点'},
                              {'key': 'context', 'label': '主要内容'}],
                             site_rows, show_index=True, empty_text='暂无现场尽调记录'))

    # 项目基本情况
    if pbi.get('companyBaseInfo'):
        body.append(render_longtext('项目基本情况', esc(pbi.get('companyBaseInfo'))))

    return module_wrapper('项目基本信息', 'project_base_info', '\n'.join(body))


def module_implementation_plan(data):
    emb = data.get('embodiment')
    if not emb:
        return ''
    body = []

    # 风险敞口汇总
    risk_children = [
        ('预测风险敞口(元)', fmt_amount(emb.get('riskExposure')), False),
        ('预测风险敞口/设备原值(%)', show(emb.get('rate')), False),
        ('承租人累计风险敞口(元)', fmt_amount(emb.get('lesseeAggregateRiskExposure')), False),
        ('承租人及关联方累计风险敞口(元)', fmt_amount(emb.get('aggregateRiskExposure')), False),
    ]
    cells = []
    for c_label, c_value, c_full in risk_children:
        cells.append(f'<div class="report-grid__cell report-grid__cell--w-25">{render_kv(c_label, c_value)}</div>')
    body.append(f'<div class="report-block report-group"><div class="report-grid">{"".join(cells)}</div></div>')

    adv_list = emb.get('advertisingInfoList') or []
    if not adv_list:
        body.append('<div class="report-block"><div class="report-empty__placeholder">暂无关联报价</div></div>')
        return module_wrapper('实施方案', 'implementation_plan', '\n'.join(body))

    for i, adv in enumerate(adv_list):
        quot_name = adv.get('quotName') or '—'
        # 报价名 sectionHeading
        body.append(section_heading(quot_name))

        # 投放信息 group
        ref_rate = adv.get('referenceRate') or {}
        loan_children = [
            ('投放金额(元)', fmt_amount(adv.get('advertisingAmount')), False),
            ('租金总额(元)', fmt_amount(adv.get('totalRent')), False),
            ('首付款金额(元)', fmt_amount(adv.get('downPaymentRent')), False),
            ('贴息金额(元)', fmt_amount(adv.get('interestSubsidy')), False),
            ('保证金金额(元)', fmt_amount(adv.get('marginRent')), False),
            ('名义货价(元)', fmt_amount(adv.get('nominalPrice')), False),
            ('综合收益率(%)', show(adv.get('comprehensiveYield')), False),
            ('内部收益率(%)', show(adv.get('internalYield')), False),
            ('租金分配IRR(%)', show(adv.get('rentDistribution')), False),
            ('报价利率(%)', show(adv.get('quotationRate')), False),
            ('租赁期限(月)', show(adv.get('leasingTerm')), False),
            ('租赁方式', show(adv.get('leaseMethod')), False),
            ('是否起租调整', show(adv.get('isStartLease')), False),
            ('先付后付标识', show(adv.get('paymentOrder')), False),
            ('投放日期', show(adv.get('advertisingDate')), False),
            ('银票收益率(%)', show(ref_rate.get('contIrrBanknote')), False),
            ('是否调息', show(adv.get('isAdjustingInterest')), False),
        ]
        loan_cells = []
        for c_label, c_value, c_full in loan_children:
            loan_cells.append(f'<div class="report-grid__cell report-grid__cell--w-25">{render_kv(c_label, c_value)}</div>')
        body.append(f'''<div class="report-block report-group">
  {section_title('投放信息')}
  <div class="report-grid">{''.join(loan_cells)}</div>
</div>''')

        # 付款条件及笔数
        pt_cols = [
            {'key': 'number', 'label': '期数展示'},
            {'key': 'paymentMethod', 'label': '付款方式'},
            {'key': 'ifInnerDeduct', 'label': '是否内扣'},
            {'key': 'plannedLaunchDate', 'label': '计划投放日期'},
            {'key': 'amount', 'label': '金额(元)', 'align': 'right'},
            {'key': 'paymentTerm', 'label': '付款条件'},
            {'key': 'paymentRecipient', 'label': '付款对象'},
        ]
        pt_rows = []
        for p in (adv.get('paymentTermList') or []):
            pt_rows.append({
                'number': show(p.get('number')),
                'paymentMethod': show(p.get('paymentMethod')),
                'ifInnerDeduct': show(p.get('ifInnerDeduct')),
                'plannedLaunchDate': show(p.get('plannedLaunchDate')),
                'amount': fmt_amount(p.get('amount')),
                'paymentTerm': show(p.get('paymentTerm')),
                'paymentRecipient': show(p.get('paymentRecipient')),
            })
        body.append(render_table('付款条件及笔数', pt_cols, pt_rows, show_index=True, empty_text='暂无付款条件'))

        # 租金计划表汇总
        rent_plan = adv.get('rentPlan') or {}
        rent_summary_children = [
            ('租金总额(元)', fmt_amount(rent_plan.get('rentTotalAmount')), False),
            ('本金总额(元)', fmt_amount(rent_plan.get('principalTotalAmount')), False),
            ('利息总额(元)', fmt_amount(rent_plan.get('interestTotalAmount')), False),
        ]
        rent_cells = []
        for c_label, c_value, _ in rent_summary_children:
            rent_cells.append(f'<div class="report-grid__cell report-grid__cell--w-33">{render_kv(c_label, c_value)}</div>')
        body.append(f'''<div class="report-block report-group">
  {section_title('租金计划表')}
  <div class="report-grid">{''.join(rent_cells)}</div>
</div>''')

        # 租金计划表明细
        rent_cols = [
            {'key': 'leaseTime', 'label': '期数'},
            {'key': 'eventCategory', 'label': '事件类别'},
            {'key': 'planDate', 'label': '计划收取日期'},
            {'key': 'rentAmount', 'label': '租金(元)', 'align': 'right'},
            {'key': 'interestAmount', 'label': '利息(元)', 'align': 'right'},
            {'key': 'principalAmount', 'label': '本金(元)', 'align': 'right'},
        ]
        rent_rows = []
        for r in (rent_plan.get('rentPlanDetailList') or []):
            rent_rows.append({
                'leaseTime': show(r.get('leaseTime')),
                'eventCategory': show(r.get('eventCategory')),
                'planDate': show(r.get('planDate')),
                'rentAmount': fmt_amount(r.get('rentAmount')),
                'interestAmount': fmt_amount(r.get('interestAmount')),
                'principalAmount': fmt_amount(r.get('principalAmount')),
            })
        body.append(render_table(None, rent_cols, rent_rows, show_index=False, empty_text='暂无租金计划'))

        # 保证金计划
        deposit_plan = adv.get('depositPlan') or {}
        dep_cols = [
            {'key': 'leaseTime', 'label': '期数'},
            {'key': 'eventCategory', 'label': '事件类别'},
            {'key': 'planDate', 'label': '还款日期'},
            {'key': 'amount', 'label': '应收金额(元)', 'align': 'right'},
        ]
        dep_rows = []
        for d in (deposit_plan.get('depositPlanDetailList') or []):
            dep_rows.append({
                'leaseTime': show(d.get('leaseTime')),
                'eventCategory': show(d.get('eventName') or d.get('eventCategory')),
                'planDate': show(d.get('planDate')),
                'amount': fmt_amount(d.get('amount')),
            })
        body.append(render_table('保证金计划', dep_cols, dep_rows, show_index=False, empty_text='暂无保证金计划'))

        # 其他收支计划
        other_plan = adv.get('otherPlan') or {}
        op_cols = [
            {'key': 'leaseTime', 'label': '期数'},
            {'key': 'type', 'label': '还款类型'},
            {'key': 'planDate', 'label': '还款日期'},
            {'key': 'amount', 'label': '金额(元)', 'align': 'right'},
        ]
        op_rows = []
        for o in (other_plan.get('otherPlanDetailList') or []):
            op_rows.append({
                'leaseTime': show(o.get('leaseTime')),
                'type': show(o.get('type')),
                'planDate': show(o.get('planDate')),
                'amount': fmt_amount(o.get('amount') or o.get('leaseCash')),
            })
        body.append(render_table('其他收支计划', op_cols, op_rows, show_index=False, empty_text='暂无其他收支计划'))

        # 增信措施（取报价内嵌 -> 顶层）
        ce_list = None
        if adv.get('creditEnhancementMeasureInfo'):
            ce_list = adv['creditEnhancementMeasureInfo'].get('creditEnhancementMeasureList')
        if not ce_list:
            top_ce = data.get('creditEnhancementMeasure', {}).get('creditEnhancementMeasureInfo', {})
            ce_list = top_ce.get('creditEnhancementMeasureList') or []
        body.append(render_credit_enhance_measure_list('增信措施', ce_list))

    return module_wrapper('实施方案', 'implementation_plan', '\n'.join(body))


def map_guarantee_tone(gm):
    """guaranteeMethod -> tone"""
    if not gm:
        return 'default'
    desc = gm if isinstance(gm, str) else (gm.get('desc') or '')
    code = gm.get('code') if isinstance(gm, dict) else None
    if code == 1 or code == '1':
        return 'guarantee'
    if code == 3 or code == '3':
        return 'mortgage'
    if code == 5 or code == '5':
        return 'pledge'
    if '保证' in desc:
        return 'guarantee'
    if '抵押' in desc:
        return 'mortgage'
    if '质押' in desc:
        return 'pledge'
    return 'default'


def render_credit_enhance_measure_list(label, ce_list):
    items = []
    for it in (ce_list or []):
        gm = it.get('guaranteeMethod')
        gm_desc = gm if isinstance(gm, str) else (gm.get('desc') if isinstance(gm, dict) else None)
        tone = map_guarantee_tone(gm)
        item = {
            'guaranteeMethod': gm_desc or '—',
            'guaranteeTone': tone,
            'customerName': it.get('customerName'),
            'relationship': it.get('relationship'),
            'crdntlsType': it.get('crdntlsType'),
            'documentCode': it.get('documentCode'),
        }
        if tone in ('mortgage', 'pledge'):
            item['attrs'] = [
                {'label': '抵押物类别', 'value': show(it.get('collateralType'))},
                {'label': '抵质押物类型', 'value': show(it.get('mortgageAndPledgeType'))},
                {'label': '抵质押物分类', 'value': show(it.get('mortgageAndPledgeClass'))},
            ]
            collateral_list = it.get('collateralList') or []
            if collateral_list:
                cols = [
                    {'key': 'assetsName', 'label': '担保物名称'},
                    {'key': 'locationVfbc', 'label': '所在地'},
                    {'key': 'assetsNo1Vfbc', 'label': '车牌号/不动产面积'},
                    {'key': 'assetsNo', 'label': '机身号/不动产单元号'},
                    {'key': 'assetsNo2Vfbc', 'label': '租赁物唯一识别码/抵质押证书编号'},
                    {'key': 'estimateValue', 'label': '担保物估值(元)'},
                    {'key': 'currtype', 'label': '币种'},
                    {'key': 'debtor', 'label': '第三方质押债务人'},
                    {'key': 'isFirstOrder', 'label': '是否第一顺位'},
                    {'key': 'assessMode', 'label': '评估方式'},
                    {'key': 'compensationNumber', 'label': '优先受偿权数额'},
                    {'key': 'valuationCycle', 'label': '估值周期'},
                ]
                rows = []
                for c in collateral_list:
                    rows.append({
                        'assetsName': show(c.get('assetsName')),
                        'locationVfbc': show(c.get('locationVfbc')),
                        'assetsNo1Vfbc': show(c.get('assetsNo1Vfbc')),
                        'assetsNo': show(c.get('assetsNo')),
                        'assetsNo2Vfbc': show(c.get('assetsNo2Vfbc')),
                        'estimateValue': fmt_amount(c.get('estimateValue')),
                        'currtype': show(c.get('currtype')),
                        'debtor': show(c.get('debtor')),
                        'isFirstOrder': show(c.get('isFirstOrder')),
                        'assessMode': show(c.get('assessMode')),
                        'compensationNumber': fmt_amount(c.get('compensationNumber')),
                        'valuationCycle': show(c.get('valuationCycle')),
                    })
                item['collateral'] = {'label': '担保物', 'showIndex': True, 'columns': cols, 'rows': rows}
        items.append(item)
    return render_measure_list(label, items, empty_text='暂无增信措施')


def module_lease_property(data):
    lm = data.get('lshldModel')
    pbi = data.get('projectBaseInfo') or {}
    if not lm:
        return ''
    lease_method = pbi.get('leaseMethod', '')
    capital_use = pbi.get('capitalUse', '')
    is_pure_back = (lease_method == '回租' and capital_use == '补充流动资金')

    body = []

    # 顶部汇总
    summary_children = [
        ('是否安装租赁物监控设备', show(lm.get('isInstallEquipment')), False),
        ('监控设备情况说明', show(lm.get('installEquipmentDesc')), False),
    ]
    if is_pure_back:
        summary_children += [
            ('评估报告号', show(lm.get('evalReportNo')), False),
            ('净值合计(元)', fmt_amount(lm.get('netWorthTotal')), False),
            ('定价结果(元)', fmt_amount(lm.get('pricingResult')), False),
            ('公司要求折价比例(%)', show(lm.get('convertRatio')), False),
            ('实际折价比例(%)', show(lm.get('realityConvertRatio')), False),
            ('通用设备占比(%)', show(lm.get('equipmentRatio')), False),
        ]
    cells = []
    for c_label, c_value, _ in summary_children:
        cells.append(f'<div class="report-grid__cell report-grid__cell--w-25">{render_kv(c_label, c_value)}</div>')
    body.append(f'<div class="report-block report-group"><div class="report-grid">{"".join(cells)}</div></div>')

    # 明细表（按形态分支）
    if is_pure_back:
        cols = [
            {'key': 'thingName', 'label': '租赁物名称'},
            {'key': 'thingType', 'label': '租赁物分类'},
            {'key': 'brand', 'label': '品牌'},
            {'key': 'model', 'label': '型号'},
            {'key': 'thingNumber', 'label': '数量'},
            {'key': 'isRefMain', 'label': '是否主租赁物'},
            {'key': 'invoiceNo', 'label': '发票号'},
            {'key': 'invoiceDate', 'label': '发票日期'},
            {'key': 'depreciationYears', 'label': '折旧年限', 'align': 'right'},
            {'key': 'originalValue', 'label': '原值(元)', 'align': 'right'},
            {'key': 'netWorth', 'label': '净值(元)', 'align': 'right'},
            {'key': 'useAddress', 'label': '使用地点'},
            {'key': 'ownershipStatus', 'label': '租赁物权属状态'},
        ]
    else:
        cols = [
            {'key': 'thingName', 'label': '租赁物名称'},
            {'key': 'brand', 'label': '品牌'},
            {'key': 'model', 'label': '型号'},
            {'key': 'thingNumber', 'label': '数量'},
            {'key': 'consumerName', 'label': '供应商名称'},
            {'key': 'isRefMain', 'label': '是否主租赁物'},
            {'key': 'isNew', 'label': '新旧标识'},
            {'key': 'useAddress', 'label': '使用地点'},
            {'key': 'ownershipStatus', 'label': '租赁物权属状态'},
        ]

    rows = []
    for it in (lm.get('lshldInfoList') or []):
        thing_type = it.get('thingType') or {}
        tt_name = thing_type.get('name') if isinstance(thing_type, dict) else str(thing_type)
        base = {
            'thingName': show(it.get('thingName')),
            'thingType': show(tt_name),
            'brand': show(it.get('brand')),
            'model': show(it.get('model')),
            'thingNumber': show(it.get('thingNumber')),
            'isRefMain': show(it.get('isRefMain')),
            'invoiceNo': show(it.get('invoiceNo')),
            'invoiceDate': show(it.get('invoiceDate')),
            'depreciationYears': show(it.get('depreciationYears')),
            'originalValue': fmt_amount(it.get('originalValue')),
            'netWorth': fmt_amount(it.get('netWorth')),
            'useAddress': show(it.get('useAddress')),
            'ownershipStatus': show(it.get('ownershipStatus')),
            'consumerName': show(it.get('consumerName')),
            'isNew': show(it.get('isNew')),
        }
        # detail
        if is_pure_back:
            detail_children = [
                {'label': '租赁物名称', 'value': show(it.get('thingName'))},
                {'label': '品牌', 'value': show(it.get('brand'))},
                {'label': '型号', 'value': show(it.get('model'))},
                {'label': '中登唯一识别码', 'value': show(it.get('zdNo'))},
                {'label': '数量', 'value': show(it.get('thingNumber'))},
                {'label': '是否主租赁物', 'value': show(it.get('isRefMain'))},
                {'label': '租赁物分类', 'value': show(tt_name)},
                {'label': '使用地点', 'value': show(it.get('useAddress'))},
                {'label': '发票号', 'value': show(it.get('invoiceNo'))},
                {'label': '发票日期', 'value': show(it.get('invoiceDate'))},
                {'label': '原值(元)', 'value': fmt_amount(it.get('originalValue'))},
                {'label': '实际折旧月数', 'value': show(it.get('depreciationMonths'))},
                {'label': '折旧年限', 'value': show(it.get('depreciationYears'))},
                {'label': '累计折旧(元)', 'value': fmt_amount(it.get('accumulatedDepreciation'))},
                {'label': '净值(元)', 'value': fmt_amount(it.get('netWorth'))},
                {'label': '租赁物权属状态', 'value': show(it.get('ownershipStatus'))},
                {'label': '保险计算基准金额(元)', 'value': fmt_amount(it.get('insureBaseAmt'))},
                {'label': '租赁物评估方式', 'value': show(it.get('leaseAssetAssessMethod'))},
                {'label': '租赁物评估日期', 'value': show(it.get('leaseAssetAssessDate'))},
                {'label': '资产评估机构名称', 'value': show(it.get('assetAssessOrgName'))},
            ]
        else:
            detail_children = [
                {'label': '租赁物名称', 'value': show(it.get('thingName'))},
                {'label': '品牌', 'value': show(it.get('brand'))},
                {'label': '型号', 'value': show(it.get('model'))},
                {'label': '数量', 'value': show(it.get('thingNumber'))},
                {'label': '供应商名称', 'value': show(it.get('consumerName'))},
                {'label': '是否主租赁物', 'value': show(it.get('isRefMain'))},
                {'label': '租赁物分类', 'value': show(tt_name)},
                {'label': '使用地点', 'value': show(it.get('useAddress'))},
                {'label': '交货地点', 'value': show(it.get('deliveryAddress'))},
                {'label': '新旧标识', 'value': show(it.get('isNew'))},
                {'label': '原值(元)', 'value': fmt_amount(it.get('originalValue'))},
                {'label': '净值(元)', 'value': fmt_amount(it.get('netWorth'))},
                {'label': '租赁物权属状态', 'value': show(it.get('ownershipStatus'))},
                {'label': '保险计算基准金额(元)', 'value': fmt_amount(it.get('insureBaseAmt'))},
                {'label': '租赁物评估方式', 'value': show(it.get('leaseAssetAssessMethod'))},
                {'label': '租赁物评估日期', 'value': show(it.get('leaseAssetAssessDate'))},
                {'label': '资产评估机构名称', 'value': show(it.get('assetAssessOrgName'))},
            ]
        base['detail'] = {'columns': 5, 'children': detail_children}
        rows.append(base)

    summary = {
        'index': '合计',
        'originalValue': fmt_amount(lm.get('lshldPriceTotal')),
        'netWorth': fmt_amount(lm.get('netWorthTotal')),
    }
    body.append(render_table('租赁物信息', cols, rows, show_index=True, summary=summary, empty_text='暂无租赁物数据'))

    # 供应商信息（仅直租/直转回）
    if not is_pure_back:
        sup_cols = [
            {'key': 'providerName', 'label': '供应商名称'},
            {'key': 'accountNo', 'label': '银行账号'},
            {'key': 'invoiceWay', 'label': '收票方式'},
            {'key': 'invoiceDays', 'label': '收票天数'},
        ]
        sup_rows = []
        for s in (lm.get('supplierInfoList') or []):
            sup_rows.append({
                'providerName': show(s.get('providerName')),
                'accountNo': show(s.get('accountNo')),
                'invoiceWay': show(s.get('invoiceWay')),
                'invoiceDays': show(s.get('invoiceDays')),
            })
        body.append(render_table('供应商信息', sup_cols, sup_rows, show_index=True, empty_text='暂无数据'))

    # 权属说明 / 突破作价说明
    if lm.get('lshldOwnershipDesc'):
        body.append(render_longtext('租赁物权属状态说明', esc(lm['lshldOwnershipDesc'])))
    if lm.get('breakPriceDesc'):
        body.append(render_longtext('是否突破作价及说明', esc(lm['breakPriceDesc'])))

    return module_wrapper('租赁物信息', 'lease_property', '\n'.join(body))


def module_lessee_base_info(data):
    lbi = data.get('lesseeBaseInfo') or {}
    cpi = lbi.get('companyPublicInfo')
    if not cpi:
        return ''
    body = []

    # 基本信息大区
    body.append(section_heading('基本信息'))
    base = cpi.get('baseInfo') or {}
    industry = base.get('pkIndustrySortLittle') or {}
    base_children = [
        ('企业名称', show(base.get('customerName')), False),
        ('统一社会信用代码', show(base.get('crdntlsCode')), False),
        ('法定代表人', show(base.get('legalRepresentativeCustomerName')), False),
        ('实际控制人', show(base.get('actControlsName')), False),
        ('成立时间', show(base.get('estblshDate')), False),
        ('注册资本(万元)', fmt_amount(base.get('rgstrdCapital')), False),
        ('行业小类', show(industry.get('name') if isinstance(industry, dict) else industry), False),
        ('从业人数', show(base.get('employeeNum')), False),
        ('注册地址', show(base.get('rgstrdAddress')), True),
    ]
    cells = []
    for c_label, c_value, c_full in base_children:
        cell_cls = 'report-grid__cell report-grid__cell--w-100' if c_full else 'report-grid__cell report-grid__cell--w-25'
        cells.append(f'<div class="{cell_cls}">{render_kv(c_label, c_value)}</div>')
    body.append(f'<div class="report-block report-group"><div class="report-grid">{"".join(cells)}</div></div>')

    # 行业许可证
    lic_cols = [
        {'key': 'specCrdntlsName', 'label': '证件名称'},
        {'key': 'specCrdntlsCode', 'label': '编号'},
        {'key': 'expirationDate', 'label': '期限'},
    ]
    lic_rows = []
    for it in (cpi.get('industryLicenseList') or []):
        lic_rows.append({
            'specCrdntlsName': show(it.get('specCrdntlsName')),
            'specCrdntlsCode': show(it.get('specCrdntlsCode')),
            'expirationDate': show(it.get('expirationDate')),
        })
    body.append(render_table('行业许可证', lic_cols, lic_rows, show_index=True, empty_text='暂无行业许可证数据'))

    # 主营业务 / 公司沿革
    if base.get('mainBusiness'):
        body.append(render_longtext('主营业务', esc(base['mainBusiness'])))
    if base.get('companyEvolution'):
        body.append(render_longtext('公司沿革', esc(base['companyEvolution'])))

    # 股权结构
    sh_cols = [
        {'key': 'shareholderName', 'label': '股东名称'},
        {'key': 'shareholderCapitalAmount', 'label': '出资额(万元)'},
        {'key': 'holdStockRatio', 'label': '占比(%)'},
    ]
    sh_rows = []
    for s in (cpi.get('shareholderList') or []):
        sh_rows.append({
            'shareholderName': show(s.get('shareholderName')),
            'shareholderCapitalAmount': fmt_amount(s.get('shareholderCapitalAmount')),
            'holdStockRatio': show(s.get('holdStockRatio')),
        })
    sh_total = cpi.get('shareholderTotal') or {}
    sh_summary = None
    if sh_total:
        sh_summary = {
            'index': '合计',
            'shareholderCapitalAmount': fmt_amount(sh_total.get('shareholderCapitalAmount')),
            'holdStockRatio': show(sh_total.get('holdStockRatio')),
        }
    body.append(render_table('股权结构', sh_cols, sh_rows, show_index=True, summary=sh_summary, empty_text='暂无股权结构数据'))

    # 实控人介绍
    if cpi.get('controllerIntroduction'):
        body.append(render_longtext('实控人及股东情况介绍', esc(cpi['controllerIntroduction'])))

    # 司法诉讼信息
    body.append(section_heading('司法诉讼信息'))
    jli = cpi.get('judicialLitigationInfo') or {}
    cards = []
    for c in (jli.get('caseTypeHighRiskList') or []):
        cards.append({'caseType': c.get('caseType'), 'caseNum': c.get('caseNum'), 'tone': 'highRisk'})
    for c in (jli.get('caseTypeCommonList') or []):
        cards.append({'caseType': c.get('caseType'), 'caseNum': c.get('caseNum'), 'tone': 'common'})
    body.append(render_litigation_cards(cards, update_time=jli.get('updateTime')))

    if jli.get('judicialLitigationInfoDesc'):
        body.append(render_longtext('司法诉讼信息说明', esc(jli['judicialLitigationInfoDesc'])))

    return module_wrapper('承租人基本信息', 'lessee_base_info', '\n'.join(body))


def module_related_enterprise(data):
    acm = data.get('associatedCompanyModule') or {}
    syn_list = acm.get('associatedCompanySynopsisList') or []
    detail_list = acm.get('associatedCompanyList') or []
    if not syn_list and not detail_list:
        return ''
    body = []

    # 概要卡片
    syn_items = []
    for s in syn_list:
        syn_items.append({
            'guarantorTag': '担保人' if s.get('isGuarantor') == '是' else '非担保人',
            'guarantorTone': 'guarantor' if s.get('isGuarantor') == '是' else 'nonGuarantor',
            'customerName': s.get('customerName'),
            'crdntlsCode': s.get('crdntlsCode'),
        })
    body.append(render_synopsis(syn_items))

    # 详情卡片（按 customerNo 匹配）
    detail_map = {d.get('customerNo'): d for d in detail_list if d.get('customerNo')}
    for s in syn_list:
        cno = s.get('customerNo')
        if not cno or cno not in detail_map:
            continue
        d = detail_map[cno]
        name = d.get('baseInfo', {}).get('customerName') or s.get('customerName') or '—'
        code = d.get('baseInfo', {}).get('crdntlsCode') or s.get('crdntlsCode') or ''
        detail_body = []

        # 基本信息
        base = d.get('baseInfo') or {}
        industry = base.get('pkIndustrySortLittle') or {}
        rel_types = d.get('relationTypes') or []
        rel_str = '、'.join([r for r in rel_types if r]) if rel_types else '—'
        base_children = [
            ('企业名称', show(base.get('customerName')), False),
            ('统一社会信用代码', show(base.get('crdntlsCode')), False),
            ('法定代表人', show(base.get('legalRepresentativeCustomerName')), False),
            ('实际控制人', show(base.get('actControlsName')), False),
            ('成立时间', show(base.get('estblshDate')), False),
            ('注册资本(万元)', fmt_amount(base.get('rgstrdCapital')), False),
            ('行业小类', show(industry.get('name') if isinstance(industry, dict) else industry), False),
            ('从业人数', show(base.get('employeeNum')), False),
            ('注册地址', show(base.get('rgstrdAddress')), True),
            ('与承租人关系', esc(rel_str), False),
            ('其他关系说明', show(d.get('otherDesc')), True),
        ]
        cells = []
        for c_label, c_value, c_full in base_children:
            cell_cls = 'report-grid__cell report-grid__cell--w-100' if c_full else 'report-grid__cell report-grid__cell--w-25'
            cells.append(f'<div class="{cell_cls}">{render_kv(c_label, c_value)}</div>')
        detail_body.append(f'''<div class="report-block report-group">
  {section_title('基本信息')}
  <div class="report-grid">{''.join(cells)}</div>
</div>''')

        # 主营业务
        if base.get('mainBusiness'):
            detail_body.append(render_longtext('主营业务', esc(base['mainBusiness'])))

        # 股权结构
        sh_cols = [
            {'key': 'shareholderName', 'label': '股东名称'},
            {'key': 'shareholderCapitalAmount', 'label': '出资额(万元)'},
            {'key': 'holdStockRatio', 'label': '占比(%)'},
        ]
        sh_rows = []
        for sh in (d.get('shareholderList') or []):
            sh_rows.append({
                'shareholderName': show(sh.get('shareholderName')),
                'shareholderCapitalAmount': fmt_amount(sh.get('shareholderCapitalAmount')),
                'holdStockRatio': show(sh.get('holdStockRatio')),
            })
        sh_total = d.get('shareholderTotal') or {}
        sh_summary = None
        if sh_total:
            sh_summary = {
                'index': '合计',
                'shareholderCapitalAmount': fmt_amount(sh_total.get('shareholderCapitalAmount')),
                'holdStockRatio': show(sh_total.get('holdStockRatio')),
            }
        detail_body.append(render_table('股权结构', sh_cols, sh_rows, show_index=True, summary=sh_summary, empty_text='暂无股权结构数据'))

        # 实控人介绍
        if d.get('controllerIntroduction'):
            detail_body.append(render_longtext('实控人及股东情况介绍', esc(d['controllerIntroduction'])))

        # 司法诉讼
        jli = d.get('judicialLitigationInfo') or {}
        cards = []
        for c in (jli.get('caseTypeHighRiskList') or []):
            cards.append({'caseType': c.get('caseType'), 'caseNum': c.get('caseNum'), 'tone': 'highRisk'})
        for c in (jli.get('caseTypeCommonList') or []):
            cards.append({'caseType': c.get('caseType'), 'caseNum': c.get('caseNum'), 'tone': 'common'})
        detail_body.append(render_litigation_cards(cards, update_time=jli.get('updateTime'), label='司法诉讼信息'))

        if jli.get('judicialLitigationInfoDesc'):
            detail_body.append(render_longtext('司法诉讼信息说明', esc(jli['judicialLitigationInfoDesc'])))

        body.append(f'''<div class="report-related-detail">
  <div class="report-related-detail__header">{esc(name)}{'　' + esc(code) if code else ''}</div>
  <div class="report-related-detail__body">{''.join(detail_body)}</div>
</div>''')

    return module_wrapper('关联企业信息', 'related_enterprise', '\n'.join(body))


def module_credit_enhancement(data):
    cem = data.get('creditEnhancementMeasure')
    if not cem:
        return ''
    body = []

    # 增信措施大区标题
    body.append(section_heading('增信措施'))

    # 担保措施卡片
    ce_list = (cem.get('creditEnhancementMeasureInfo') or {}).get('creditEnhancementMeasureList') or []
    body.append(render_credit_enhance_measure_list('担保措施', ce_list))

    # 担保自然人
    person_list = cem.get('guaranteePersonList') or []
    if person_list:
        body.append(section_heading('担保人信息'))
        for p in person_list:
            p_body = []
            base_children = [
                ('姓名', show(p.get('customerName')), False),
                ('证件类型', show(p.get('crdntlsType')), False),
                ('证件代码', show(p.get('documentCode')), False),
                ('与承租人关系', show(p.get('relationship')), False),
                ('与承租人关系说明', show(p.get('relationshipDesc')), False),
                ('名下资产、市值与抵押情况', show(p.get('assetDesc')), True),
            ]
            cells = []
            for c_label, c_value, c_full in base_children:
                cell_cls = 'report-grid__cell report-grid__cell--w-100' if c_full else 'report-grid__cell report-grid__cell--w-25'
                cells.append(f'<div class="{cell_cls}">{render_kv(c_label, c_value)}</div>')
            p_body.append(f'''<div class="report-block report-group">
  {section_title('基本信息')}
  <div class="report-grid">{''.join(cells)}</div>
</div>''')

            jli = p.get('judicialLitigationInfo') or {}
            cards = []
            for c in (jli.get('caseTypeHighRiskList') or []):
                cards.append({'caseType': c.get('caseType'), 'caseNum': c.get('caseNum'), 'tone': 'highRisk'})
            for c in (jli.get('caseTypeCommonList') or []):
                cards.append({'caseType': c.get('caseType'), 'caseNum': c.get('caseNum'), 'tone': 'common'})
            p_body.append(render_litigation_cards(cards, update_time=jli.get('updateTime'), label='司法诉讼信息'))
            if jli.get('judicialLitigationInfoDesc'):
                p_body.append(render_longtext('司法诉讼信息说明', esc(jli['judicialLitigationInfoDesc'])))

            pname = show(p.get('customerName'))
            body.append(f'''<div class="report-related-detail">
  <div class="report-detail-title">担保自然人 - {pname}</div>
  <div class="report-related-detail__body">{''.join(p_body)}</div>
</div>''')

    # 担保企业
    company_list = cem.get('guaranteeCompanyList') or []
    for c in company_list:
        cpi = c.get('companyPublicInfo') or {}
        base = cpi.get('baseInfo') or {}
        c_body = []
        industry = base.get('pkIndustrySortLittle') or {}
        base_children = [
            ('企业名称', show(base.get('customerName')), False),
            ('统一社会信用代码', show(base.get('crdntlsCode')), False),
            ('法定代表人', show(base.get('legalRepresentativeCustomerName')), False),
            ('实际控制人', show(base.get('actControlsName')), False),
            ('成立时间', show(base.get('estblshDate')), False),
            ('注册资本(万元)', fmt_amount(base.get('rgstrdCapital')), False),
            ('行业小类', show(industry.get('name') if isinstance(industry, dict) else industry), False),
            ('从业人数', show(base.get('employeeNum')), False),
            ('注册地址', show(base.get('rgstrdAddress')), True),
        ]
        cells = []
        for c_label, c_value, c_full in base_children:
            cell_cls = 'report-grid__cell report-grid__cell--w-100' if c_full else 'report-grid__cell report-grid__cell--w-25'
            cells.append(f'<div class="{cell_cls}">{render_kv(c_label, c_value)}</div>')
        c_body.append(f'''<div class="report-block report-group">
  {section_title('基本信息')}
  <div class="report-grid">{''.join(cells)}</div>
</div>''')

        # 股权结构
        sh_cols = [
            {'key': 'shareholderName', 'label': '股东名称'},
            {'key': 'shareholderCapitalAmount', 'label': '出资额(万元)'},
            {'key': 'holdStockRatio', 'label': '占比(%)'},
        ]
        sh_rows = []
        for sh in (cpi.get('shareholderList') or []):
            sh_rows.append({
                'shareholderName': show(sh.get('shareholderName')),
                'shareholderCapitalAmount': fmt_amount(sh.get('shareholderCapitalAmount')),
                'holdStockRatio': show(sh.get('holdStockRatio')),
            })
        sh_total = cpi.get('shareholderTotal') or {}
        sh_summary = None
        if sh_total:
            sh_summary = {
                'index': '合计',
                'shareholderCapitalAmount': fmt_amount(sh_total.get('shareholderCapitalAmount')),
                'holdStockRatio': show(sh_total.get('holdStockRatio')),
            }
        c_body.append(render_table('股权结构', sh_cols, sh_rows, show_index=True, summary=sh_summary, empty_text='暂无股权结构数据'))

        if cpi.get('controllerIntroduction'):
            c_body.append(render_longtext('实控人及股东情况介绍', esc(cpi['controllerIntroduction'])))

        jli = cpi.get('judicialLitigationInfo') or {}
        cards = []
        for cc in (jli.get('caseTypeHighRiskList') or []):
            cards.append({'caseType': cc.get('caseType'), 'caseNum': cc.get('caseNum'), 'tone': 'highRisk'})
        for cc in (jli.get('caseTypeCommonList') or []):
            cards.append({'caseType': cc.get('caseType'), 'caseNum': cc.get('caseNum'), 'tone': 'common'})
        c_body.append(render_litigation_cards(cards, update_time=jli.get('updateTime'), label='司法诉讼信息'))
        if jli.get('judicialLitigationInfoDesc'):
            c_body.append(render_longtext('司法诉讼信息说明', esc(jli['judicialLitigationInfoDesc'])))

        cname = show(base.get('customerName'))
        body.append(f'''<div class="report-related-detail">
  <div class="report-detail-title">担保企业 - {cname}</div>
  <div class="report-related-detail__body">{''.join(c_body)}</div>
</div>''')

    return module_wrapper('增信措施', 'credit_enhancement', '\n'.join(body))


def module_revenue_analysis(data):
    ra = data.get('revenueAnalysis')
    if not ra:
        return ''
    body = []

    # 主体列表
    sub_cols = [
        {'key': 'subjectName', 'label': '主体名称'},
        {'key': 'customerRole', 'label': '主体角色'},
    ]
    sub_rows = []
    for s in (ra.get('subjectInfoList') or []):
        role = s.get('customerRole')
        if isinstance(role, list):
            role_str = '、'.join([r for r in role if r]) or '—'
        else:
            role_str = str(role) if role else '—'
        sub_rows.append({'subjectName': show(s.get('subjectName')), 'customerRole': esc(role_str)})
    body.append(render_table('主体列表', sub_cols, sub_rows, show_index=True, empty_text='暂无主体数据'))

    # 资产规模
    body.append(section_heading('资产规模'))
    asset = ra.get('assetSize') or {}

    fac_cols = [
        {'key': 'subjectName', 'label': '主体名称'},
        {'key': 'customerRole', 'label': '主体角色'},
        {'key': 'factoryType', 'label': '厂房类型'},
        {'key': 'factoryArea', 'label': '厂房面积(平方米)'},
        {'key': 'factoryRent', 'label': '厂房年租金(万)'},
        {'key': 'leaseEndDate', 'label': '租赁到期日'},
        {'key': 'haveLoan', 'label': '当前是否有欠租'},
        {'key': 'landArea', 'label': '土地面积(平方米)'},
        {'key': 'landValue', 'label': '土地价值(万)'},
        {'key': 'address', 'label': '所在位置'},
        {'key': 'haveDocument', 'label': '是否有不动产权证'},
        {'key': 'landMortgaged', 'label': '土地厂房是否抵押'},
    ]
    factory_type_map = {'0': '自有', '1': '租用', '2': '无厂房'}
    fac_rows = []
    for f in (asset.get('factoryList') or []):
        ft = f.get('factoryType')
        ft_str = factory_type_map.get(str(ft), str(ft) if ft is not None else '—')
        role = f.get('customerRole')
        if isinstance(role, list):
            role_str = '、'.join([r for r in role if r]) or '—'
        else:
            role_str = str(role) if role else '—'
        fac_rows.append({
            'subjectName': show(f.get('subjectName')),
            'customerRole': esc(role_str),
            'factoryType': esc(ft_str),
            'factoryArea': show(f.get('factoryArea')),
            'factoryRent': show(f.get('factoryRent')),
            'leaseEndDate': show(f.get('leaseEndDate')),
            'haveLoan': show(f.get('haveLoan')),
            'landArea': show(f.get('landArea')),
            'landValue': show(f.get('landValue')),
            'address': show(f.get('address')),
            'haveDocument': show(f.get('haveDocument')),
            'landMortgaged': show(f.get('landMortgaged')),
        })
    body.append(render_table('厂房情况', fac_cols, fac_rows, show_index=True, empty_text='暂无厂房数据'))

    if asset.get('factoryDesc'):
        body.append(render_longtext('厂房情况说明', esc(asset['factoryDesc'])))

    eq_cols = [
        {'key': 'subjectName', 'label': '主体名称'},
        {'key': 'customerRole', 'label': '主体角色'},
        {'key': 'content', 'label': '数量、名称及品牌'},
        {'key': 'originalValue', 'label': '原值(元)'},
    ]
    eq_rows = []
    for e in (asset.get('mainEquipmentList') or []):
        role = e.get('customerRole')
        if isinstance(role, list):
            role_str = '、'.join([r for r in role if r]) or '—'
        else:
            role_str = str(role) if role else '—'
        eq_rows.append({
            'subjectName': show(e.get('subjectName')),
            'customerRole': esc(role_str),
            'content': show(e.get('content')),
            'originalValue': fmt_amount(e.get('originalValue')),
        })
    body.append(render_table('主要设备情况', eq_cols, eq_rows, show_index=True, empty_text='暂无数据'))

    ratio_cols = [
        {'key': 'subjectName', 'label': '主体名称'},
        {'key': 'customerRole', 'label': '主体角色'},
        {'key': 'ratio', 'label': '当前设备稼动率(%)'},
    ]
    ratio_rows = []
    for r in (asset.get('ratioList') or []):
        role = r.get('customerRole')
        if isinstance(role, list):
            role_str = '、'.join([x for x in role if x]) or '—'
        else:
            role_str = str(role) if role else '—'
        ratio_rows.append({
            'subjectName': show(r.get('subjectName')),
            'customerRole': esc(role_str),
            'ratio': show(r.get('ratio')),
        })
    body.append(render_table('设备稼动率情况', ratio_cols, ratio_rows, show_index=True, empty_text='暂无数据'))

    if asset.get('ratioDesc'):
        body.append(render_longtext('稼动率说明', esc(asset['ratioDesc'])))

    # 生产销售情况分析
    body.append(section_heading('生产销售情况分析'))
    ps = ra.get('proAndSaleSituation') or {}

    mp_cols = [
        {'key': 'subjectName', 'label': '主体名称', 'mergeSame': True},
        {'key': 'customerRole', 'label': '主体角色', 'mergeSame': True},
        {'key': 'productName', 'label': '产品名称'},
        {'key': 'saleNoteAmount', 'label': '开票销售额(万)'},
        {'key': 'ratio', 'label': '占比(%)'},
        {'key': 'source', 'label': '来源'},
    ]
    mp_rows = []
    mp_groups = {}
    for p in (ps.get('mainProductList') or []):
        key = (p.get('customerNo'), p.get('subjectName'))
        mp_groups.setdefault(key, []).append(p)
    for (cno, sname), items in mp_groups.items():
        sum_sale = 0.0
        sum_ratio = 0.0
        first = items[0] if items else {}
        role = first.get('customerRole')
        if isinstance(role, list):
            role_str = '、'.join([x for x in role if x]) or '—'
        else:
            role_str = str(role) if role else '—'
        for p in items:
            sv = p.get('saleNoteAmount')
            rv = p.get('ratio')
            try:
                sum_sale += float(sv) if sv not in (None, '', '—') else 0
            except (ValueError, TypeError):
                pass
            try:
                sum_ratio += float(rv) if rv not in (None, '', '—') else 0
            except (ValueError, TypeError):
                pass
            mp_rows.append({
                'subjectName': show(sname),
                'customerRole': esc(role_str),
                'productName': show(p.get('productName')),
                'saleNoteAmount': show(sv),
                'ratio': show(rv),
                'source': show(p.get('source')),
            })
        # 合计行
        mp_rows.append({
            'subjectName': show(sname),
            'customerRole': esc(role_str),
            'productName': '合计',
            'saleNoteAmount': f'{sum_sale:g}' if sum_sale else '—',
            'ratio': f'{sum_ratio:.4f}' if sum_ratio else '—',
            'source': '—',
        })
    body.append(render_table('近12个月主营产品', mp_cols, mp_rows, show_index=True, empty_text='暂无主营产品数据'))

    if ps.get('desc'):
        body.append(render_longtext('主要原材料、生产工艺流程、产品处于行业地位分析等说明', esc(ps['desc'])))

    dc_cols = [
        {'key': 'subjectName', 'label': '主体名称', 'mergeSame': True},
        {'key': 'customerRole', 'label': '主体角色', 'mergeSame': True},
        {'key': 'customerName', 'label': '客户名称'},
        {'key': 'saleAmount', 'label': '开票销售额(万)'},
        {'key': 'ratio', 'label': '占比(%)'},
        {'key': 'settlementCycle', 'label': '结算周期'},
        {'key': 'paymentMethod', 'label': '结算方式'},
        {'key': 'cooperateDuration', 'label': '合作时长(年)'},
        {'key': 'source', 'label': '来源'},
    ]
    dc_rows = []
    dc_groups = {}
    for c in (ps.get('downstreamCustomerList') or []):
        key = (c.get('customerNo'), c.get('subjectName'))
        dc_groups.setdefault(key, []).append(c)
    for (cno, sname), items in dc_groups.items():
        sum_sale = 0.0
        sum_ratio = 0.0
        first = items[0] if items else {}
        role = first.get('customerRole')
        if isinstance(role, list):
            role_str = '、'.join([x for x in role if x]) or '—'
        else:
            role_str = str(role) if role else '—'
        for c in items:
            sv = c.get('saleAmount')
            rv = c.get('ratio')
            try:
                sum_sale += float(sv) if sv not in (None, '', '—') else 0
            except (ValueError, TypeError):
                pass
            try:
                sum_ratio += float(rv) if rv not in (None, '', '—') else 0
            except (ValueError, TypeError):
                pass
            pm = c.get('paymentMethod')
            if isinstance(pm, list):
                pm_str = '/'.join([x for x in pm if x]) or '—'
            else:
                pm_str = str(pm) if pm else '—'
            dc_rows.append({
                'subjectName': show(sname),
                'customerRole': esc(role_str),
                'customerName': show(c.get('customerName')),
                'saleAmount': show(sv),
                'ratio': show(rv),
                'settlementCycle': show(c.get('settlementCycle')),
                'paymentMethod': esc(pm_str),
                'cooperateDuration': show(c.get('cooperateDuration')),
                'source': show(c.get('source')),
            })
        dc_rows.append({
            'subjectName': show(sname),
            'customerRole': esc(role_str),
            'customerName': '合计',
            'saleAmount': f'{sum_sale:g}' if sum_sale else '—',
            'ratio': f'{sum_ratio:.4f}' if sum_ratio else '—',
            'settlementCycle': '—',
            'paymentMethod': '—',
            'cooperateDuration': '—',
            'source': '—',
        })
    body.append(render_table('主要下游客户', dc_cols, dc_rows, show_index=True, empty_text='暂无下游客户数据'))

    if ps.get('downstreamCustomerDesc'):
        body.append(render_longtext('下游客户司法诉讼情况概述', esc(ps['downstreamCustomerDesc'])))
    if ps.get('productionAndSaleSituationDesc'):
        body.append(render_longtext('生产销售情况说明', esc(ps['productionAndSaleSituationDesc'])))

    # 收入分析
    body.append(section_heading('收入分析'))
    ia = ra.get('incomeAnalysis') or {}

    # 营业收入分析（透视）
    oia = ia.get('operatingIncomeAnalysis') or []
    oia_total = ia.get('operatingIncomeAnalysisTotal') or []
    if oia:
        # 提取 timeInterval 列
        intervals = []
        seen = set()
        for it in sorted(oia, key=lambda x: (x.get('serialNumber') or 0)):
            ti = it.get('timeInterval')
            if ti and ti not in seen:
                seen.add(ti)
                intervals.append(ti)
        # 按主体分组
        subj_map = {}
        subj_order = []
        for it in oia:
            cno = it.get('customerNo')
            if cno not in subj_map:
                subj_map[cno] = []
                subj_order.append(cno)
            subj_map[cno].append(it)

        oia_cols = [
            {'key': 'subjectName', 'label': '主体名称', 'mergeSame': True},
            {'key': 'customerRole', 'label': '主体角色', 'mergeSame': True},
            {'key': 'type', 'label': '类型'},
        ] + [{'key': f'iv_{i}', 'label': ti} for i, ti in enumerate(intervals)]

        oia_rows = []
        for cno in subj_order:
            items = subj_map[cno]
            first = items[0]
            sname = first.get('customerName') or first.get('subjectName')
            role = first.get('customerRole')
            if isinstance(role, list):
                role_str = '、'.join([x for x in role if x]) or '—'
            else:
                role_str = str(role) if role else '—'
            inv_map = {it.get('timeInterval'): it.get('invoicingRevenue') for it in items}
            non_inv_map = {it.get('timeInterval'): it.get('nonInvoicingRevenue') for it in items}
            inv_row = {'subjectName': show(sname), 'customerRole': esc(role_str), 'type': '开票收入(万)'}
            non_inv_row = {'subjectName': show(sname), 'customerRole': esc(role_str), 'type': '不开票收入(万)'}
            for i, ti in enumerate(intervals):
                inv_row[f'iv_{i}'] = show(inv_map.get(ti))
                non_inv_row[f'iv_{i}'] = show(non_inv_map.get(ti))
            oia_rows.append(inv_row)
            oia_rows.append(non_inv_row)
        # 汇总 3 行
        if oia_total:
            sum_by_label = [
                ('合计(万)', 'invoicingRevenue'),
                ('关联交易(万)', 'relatedTransaction'),
                ('剔除关联交易后合计(万)', 'excludeRelatedTransaction'),
            ]
            total_map = {t.get('timeInterval'): t for t in oia_total}
            for label, key in sum_by_label:
                row = {'subjectName': label, 'customerRole': '—', 'type': '—'}
                for i, ti in enumerate(intervals):
                    row[f'iv_{i}'] = show((total_map.get(ti) or {}).get(key))
                oia_rows.append(row)

        body.append(render_table('营业收入分析', oia_cols, oia_rows, show_index=False, empty_text='暂无营业收入分析数据'))
    else:
        body.append(render_table('营业收入分析', [], [], show_index=False, empty_text='暂无营业收入分析数据'))

    if ia.get('operatingIncomeDesc'):
        body.append(render_longtext('营业收入分析说明', esc(ia['operatingIncomeDesc'])))

    # 可验证回款比例
    if ia.get('ratio') is not None:
        body.append(f'<div class="report-block">{render_kv("可验证回款比例(%)", show(ia.get("ratio")))}</div>')

    # 营业收入核验
    oiv = ia.get('operatingIncomeVerificationList') or []
    oiv_total = ia.get('operatingIncomeVerificationFlowTotalList') or []
    if oiv:
        intervals = []
        seen = set()
        for it in sorted(oiv, key=lambda x: (x.get('serialNumber') or 0)):
            ti = it.get('timeInterval')
            if ti and ti not in seen:
                seen.add(ti)
                intervals.append(ti)

        subj_map = {}
        subj_order = []
        for it in oiv:
            cno = it.get('customerNo')
            if cno not in subj_map:
                subj_map[cno] = []
                subj_order.append(cno)
            subj_map[cno].append(it)

        oiv_cols = [
            {'key': 'subjectName', 'label': '主体名称', 'mergeSame': True},
            {'key': 'customerRole', 'label': '主体角色', 'mergeSame': True},
            {'key': 'type', 'label': '类型'},
        ] + [{'key': f'iv_{i}', 'label': ti} for i, ti in enumerate(intervals)] + [
            {'key': 'total', 'label': '合计'},
            {'key': 'avg', 'label': '均值'},
        ]

        type_defs = [
            ('纳税申报收入(万)', 'taxableIncome'),
            ('银行流水(万)(剔除关联交易)', 'bankStatement'),
            ('银行承兑(万)(剔除关联交易)', 'bankAcceptance'),
            ('纳税申报采购(万)', 'taxDeclareIncome'),
            ('电费(万)', 'electricityFee'),
            ('工资总额(万)', 'wage'),
        ]

        oiv_rows = []
        for cno in subj_order:
            items = subj_map[cno]
            first = items[0]
            sname = first.get('customerName') or first.get('subjectName')
            role = first.get('customerRole')
            if isinstance(role, list):
                role_str = '、'.join([x for x in role if x]) or '—'
            else:
                role_str = str(role) if role else '—'
            for type_label, key in type_defs:
                row = {'subjectName': show(sname), 'customerRole': esc(role_str), 'type': type_label}
                values = []
                for i, ti in enumerate(intervals):
                    rec = next((it for it in items if it.get('timeInterval') == ti), None)
                    v = rec.get(key) if rec else None
                    # 高亮：银行流水 vs bankStatementFromJz
                    if key == 'bankStatement' and rec:
                        jz = rec.get('bankStatementFromJz')
                        if jz not in (None, '') and jz != v:
                            row[f'iv_{i}'] = {'value': show(v), 'cellType': 'highlight'}
                        else:
                            row[f'iv_{i}'] = show(v)
                    else:
                        row[f'iv_{i}'] = show(v)
                    try:
                        if v not in (None, '', '—'):
                            values.append(float(v))
                    except (ValueError, TypeError):
                        pass
                if values:
                    row['total'] = f'{sum(values):.2f}'
                    row['avg'] = f'{sum(values) / len(values):.2f}'
                else:
                    row['total'] = '—'
                    row['avg'] = '—'
                oiv_rows.append(row)

        # 汇总 3 行
        if oiv_total:
            total_map = {t.get('timeInterval'): t for t in oiv_total}
            sum_by_label = [
                ('流水与承兑合计(万)(剔除关联交易)', 'totalFlow'),
                ('纳税申报收入关联交易(万)', 'relatedTransaction'),
                ('剔除关联交易后纳税申报收入合计(万)', 'excludeRelatedTransaction'),
            ]
            for label, key in sum_by_label:
                row = {'subjectName': label, 'customerRole': '—', 'type': '—'}
                values = []
                for i, ti in enumerate(intervals):
                    v = (total_map.get(ti) or {}).get(key)
                    row[f'iv_{i}'] = show(v)
                    try:
                        if v not in (None, '', '—'):
                            values.append(float(v))
                    except (ValueError, TypeError):
                        pass
                row['total'] = f'{sum(values):.2f}' if values else '—'
                row['avg'] = '—'
                oiv_rows.append(row)

        body.append(render_table('营业收入核验', oiv_cols, oiv_rows, show_index=False, empty_text='暂无营业收入核验数据'))
    else:
        body.append(render_table('营业收入核验', [], [], show_index=False, empty_text='暂无营业收入核验数据'))

    if ia.get('operatingIncomeVerifyDesc'):
        body.append(render_longtext('营业收入核验说明', esc(ia['operatingIncomeVerifyDesc'])))

    # 还款能力分析
    body.append(section_heading('还款能力分析'))
    ra2 = ia.get('repayAbilityAnalysis') or {}

    base_cols = [
        {'key': 'subjectName', 'label': '主体名称'},
        {'key': 'customerRole', 'label': '主体角色'},
        {'key': 'runningIncome', 'label': '流水收入(万)'},
        {'key': 'invoicingRevenue', 'label': '开票收入(万)'},
        {'key': 'dailyAverageBalance', 'label': '日均余额(万)'},
    ]
    base_rows = []
    for r in (ra2.get('repayBaseInfoList') or []):
        role = r.get('customerRole')
        if isinstance(role, list):
            role_str = '、'.join([x for x in role if x]) or '—'
        else:
            role_str = str(role) if role else '—'
        base_rows.append({
            'subjectName': show(r.get('subjectName')),
            'customerRole': esc(role_str),
            'runningIncome': show(r.get('runningIncome')),
            'invoicingRevenue': show(r.get('invoicingRevenue')),
            'dailyAverageBalance': show(r.get('dailyAverageBalance') or r.get('dailyAverageBalanceFromJz')),
        })
    body.append(render_table('基础信息', base_cols, base_rows, show_index=True, empty_text='暂无数据'))

    exp_cols = [
        {'key': 'subjectName', 'label': '主体名称'},
        {'key': 'customerRole', 'label': '主体角色'},
        {'key': 'rawMaterialCost', 'label': '原材料成本(万)'},
        {'key': 'personnelSalary', 'label': '人员工资(万)'},
        {'key': 'rentalExpenses', 'label': '租赁费用(如有)(万)'},
        {'key': 'hydroelectricProperty', 'label': '水电物业(万)'},
        {'key': 'outwardProcessing', 'label': '外发加工(如有)(万)'},
        {'key': 'averageRepayment', 'label': '实际控制人月还款(万)'},
        {'key': 'loanInterest', 'label': '银行贷款利息(万)'},
        {'key': 'financingLeaseRent', 'label': '融资租赁租金(万)'},
        {'key': 'otherCost', 'label': '其他费用(万)'},
        {'key': 'amountTotal', 'label': '支出合计(万)'},
        {'key': 'monthlyBalance', 'label': '月结余(万)'},
    ]
    exp_rows = []
    for r in (ra2.get('revenueExpenseDetails') or []):
        role = r.get('customerRole')
        if isinstance(role, list):
            role_str = '、'.join([x for x in role if x]) or '—'
        else:
            role_str = str(role) if role else '—'
        exp_rows.append({
            'subjectName': show(r.get('subjectName')),
            'customerRole': esc(role_str),
            'rawMaterialCost': show(r.get('rawMaterialCost')),
            'personnelSalary': show(r.get('personnelSalary')),
            'rentalExpenses': show(r.get('rentalExpenses')),
            'hydroelectricProperty': show(r.get('hydroelectricProperty')),
            'outwardProcessing': show(r.get('outwardProcessing')),
            'averageRepayment': show(r.get('averageRepayment')),
            'loanInterest': show(r.get('loanInterest')),
            'financingLeaseRent': show(r.get('financingLeaseRent')),
            'otherCost': show(r.get('otherCost')),
            'amountTotal': show(r.get('amountTotal')),
            'monthlyBalance': show(r.get('monthlyBalance')),
        })
    body.append(render_table('收支明细', exp_cols, exp_rows, show_index=True, empty_text='暂无数据'))

    idx_cols = [
        {'key': 'subjectName', 'label': '主体名称'},
        {'key': 'customerRole', 'label': '主体角色'},
        {'key': 'maxRent', 'label': '最大一期租金(万)'},
        {'key': 'rate', 'label': '月结余/最大一期租金(%)'},
        {'key': 'averageDailyBalanceRatio', 'label': '日均余额/最大一期租金(%)'},
        {'key': 'averageDailyBalanceRate', 'label': '日均余额/流水收入(%)'},
    ]
    idx_rows = []
    idx_list = ra2.get('repayAbilityIndex')
    if isinstance(idx_list, dict):
        idx_list = [idx_list]
    for r in (idx_list or []):
        role = r.get('customerRole')
        if isinstance(role, list):
            role_str = '、'.join([x for x in role if x]) or '—'
        else:
            role_str = str(role) if role else '—'
        idx_rows.append({
            'subjectName': show(r.get('subjectName')),
            'customerRole': esc(role_str),
            'maxRent': show(r.get('maxRent')),
            'rate': show(r.get('rate')),
            'averageDailyBalanceRatio': show(r.get('averageDailyBalanceRatio')),
            'averageDailyBalanceRate': show(r.get('averageDailyBalanceRate')),
        })
    body.append(render_table('还款能力指标', idx_cols, idx_rows, show_index=True, empty_text='暂无数据'))

    if ia.get('businessDataAnalysisDesc'):
        body.append(render_longtext('经营数据分析说明', esc(ia['businessDataAnalysisDesc'])))

    return module_wrapper('经营数据分析', 'revenue_analysis', '\n'.join(body))


def module_liability_analysis(data):
    la = data.get('liabilityAnalysis')
    if not la:
        return ''
    body = []

    if la.get('updateTime'):
        body.append(f'<div class="report-block">{render_kv("征信、中登数据更新时间", show(la["updateTime"]))}</div>')

    body.append(section_heading('借款情况'))
    ls = la.get('loanSituation') or {}

    # 企业借款
    def join_role(role):
        if isinstance(role, list):
            return '、'.join([r for r in role if r]) or '—'
        return str(role) if role else '—'

    cl_cols = [
        {'key': 'borrowingEntity', 'label': '借款主体'},
        {'key': 'principalRole', 'label': '主体角色'},
        {'key': 'leaseLoanTotal', 'label': '租赁借款余额合计(元)'},
        {'key': 'nonLeaseLoanTotal', 'label': '非租赁借款余额合计(元)'},
        {'key': 'businessType', 'label': '业务类型'},
        {'key': 'institutionalCode', 'label': '机构编码'},
        {'key': 'creditInstitutional', 'label': '授信机构'},
        {'key': 'loanAmount', 'label': '借款金额(元)'},
        {'key': 'balance', 'label': '余额(元)'},
        {'key': 'startDate', 'label': '起始日期'},
        {'key': 'deadline', 'label': '截止日期'},
        {'key': 'guaranteeMethod', 'label': '担保方式'},
        {'key': 'mortgageType', 'label': '抵押类型'},
        {'key': 'fiveLevel', 'label': '五级分类'},
        {'key': 'curOverdueMonth', 'label': '当前逾期月份'},
        {'key': 'querySource', 'label': '数据来源'},
        {'key': 'repeat', 'label': '是否与征信重复'},
    ]
    cl_rows = []
    for it in (ls.get('companyLoanList') or []):
        qt = (it.get('queryTime') or '').strip()
        entity = it.get('borrowingEntity') or ''
        if qt:
            entity = f"{entity}（征信查询日期: {qt}）"
        cl_rows.append({
            'borrowingEntity': esc(entity),
            'principalRole': esc(join_role(it.get('principalRole'))),
            'leaseLoanTotal': fmt_amount(it.get('leaseLoanTotal')),
            'nonLeaseLoanTotal': fmt_amount(it.get('nonLeaseLoanTotal')),
            'businessType': show(it.get('businessType')),
            'institutionalCode': show(it.get('institutionalCode')),
            'creditInstitutional': show(it.get('creditInstitutional')),
            'loanAmount': fmt_amount(it.get('loanAmount')),
            'balance': fmt_amount(it.get('balance')),
            'startDate': show(it.get('startDate')),
            'deadline': show(it.get('deadline')),
            'guaranteeMethod': show(it.get('guaranteeMethod')),
            'mortgageType': show(it.get('mortgageType')),
            'fiveLevel': show(it.get('fiveLevel')),
            'curOverdueMonth': show(it.get('curOverdueMonth')),
            'querySource': show(it.get('querySource')),
            'repeat': show(it.get('repeat')),
        })
    cl_total = ls.get('companyLoanTotal') or {}
    cl_summary = {
        'index': '合计',
        'loanAmount': fmt_amount(cl_total.get('loanAmount')),
        'balance': fmt_amount(cl_total.get('balance')),
    }
    body.append(render_table('企业借款', cl_cols, cl_rows, show_index=True, summary=cl_summary, empty_text='暂无企业借款数据'))

    # 个人借款
    pl_cols = [
        {'key': 'borrowingEntity', 'label': '借款主体'},
        {'key': 'businessCategory', 'label': '业务大类'},
        {'key': 'guaranteeMethod', 'label': '担保方式'},
        {'key': 'accountNum', 'label': '账户数量'},
        {'key': 'loanAmount', 'label': '借款金额(元)'},
        {'key': 'balance', 'label': '余额(元)'},
        {'key': 'overdueMonths', 'label': '累计逾期月数'},
        {'key': 'overdueAccountNum', 'label': '当前逾期账户数'},
        {'key': 'maxOverdueMonths', 'label': '最长逾期月数'},
        {'key': 'maxOverdueAmount', 'label': '最大逾期金额(元)'},
        {'key': 'balanceDue', 'label': '近一个月到期金额(元)'},
        {'key': 'queryTimes', 'label': '近三个月被其他机构查询贷款审批及担保资格的次数'},
        {'key': 'querySource', 'label': '数据来源'},
    ]
    pl_rows = []
    for it in (ls.get('personLoanList') or []):
        qt = (it.get('queryTime') or '').strip()
        entity = it.get('borrowingEntity') or ''
        if qt:
            entity = f"{entity}（征信查询日期: {qt}）"
        pl_rows.append({
            'borrowingEntity': esc(entity),
            'businessCategory': show(it.get('businessCategory')),
            'guaranteeMethod': show(it.get('guaranteeMethod')),
            'accountNum': show(it.get('accountNum')),
            'loanAmount': fmt_amount(it.get('loanAmount')),
            'balance': fmt_amount(it.get('balance')),
            'overdueMonths': show(it.get('overdueMonths')),
            'overdueAccountNum': show(it.get('overdueAccountNum')),
            'maxOverdueMonths': show(it.get('maxOverdueMonths')),
            'maxOverdueAmount': fmt_amount(it.get('maxOverdueAmount')),
            'balanceDue': fmt_amount(it.get('balanceDue')),
            'queryTimes': show(it.get('queryTimes')),
            'querySource': show(it.get('querySource')),
        })
    pl_total = ls.get('personLoanTotal') or {}
    pl_summary = {
        'index': '合计',
        'loanAmount': fmt_amount(pl_total.get('loanAmount')),
        'balance': fmt_amount(pl_total.get('balance')),
        'maxOverdueAmount': fmt_amount(pl_total.get('maxOverdueAmount')),
        'balanceDue': fmt_amount(pl_total.get('balanceDue')),
    }
    body.append(render_table('个人借款', pl_cols, pl_rows, show_index=True, summary=pl_summary, empty_text='暂无个人借款数据'))

    # 对外担保
    eg_cols = [
        {'key': 'borrowingEntity', 'label': '担保主体'},
        {'key': 'principalRole', 'label': '主体角色'},
        {'key': 'guaranteedEntity', 'label': '被担保主体'},
        {'key': 'businessType', 'label': '业务类型'},
        {'key': 'balance', 'label': '余额(元)'},
        {'key': 'startDate', 'label': '起始日期'},
        {'key': 'deadline', 'label': '截止日期'},
        {'key': 'fiveLevel', 'label': '五级分类'},
        {'key': 'curOverdueMonth', 'label': '当前逾期月数'},
        {'key': 'loanExists', 'label': '是否存在对应借款'},
        {'key': 'querySource', 'label': '数据来源'},
    ]
    eg_rows = []
    for it in (la.get('externalGuaranteeSituationList') or []):
        qt = (it.get('queryTime') or '').strip()
        entity = it.get('borrowingEntity') or ''
        if qt:
            entity = f"{entity}（征信查询日期: {qt}）"
        eg_rows.append({
            'borrowingEntity': esc(entity),
            'principalRole': esc(join_role(it.get('principalRole'))),
            'guaranteedEntity': show(it.get('guaranteedEntity')),
            'businessType': show(it.get('businessType')),
            'balance': fmt_amount(it.get('balance')),
            'startDate': show(it.get('startDate')),
            'deadline': show(it.get('deadline')),
            'fiveLevel': show(it.get('fiveLevel')),
            'curOverdueMonth': show(it.get('curOverdueMonth')),
            'loanExists': show(it.get('loanExists')),
            'querySource': show(it.get('querySource')),
        })
    eg_summary = {'index': '合计', 'balance': fmt_amount(la.get('amountTotal'))}
    body.append(render_table('对外担保情况', eg_cols, eg_rows, show_index=True, summary=eg_summary, empty_text='暂无对外担保数据'))

    if la.get('liabilityStatement'):
        body.append(render_longtext('负债说明', esc(la['liabilityStatement'])))

    return module_wrapper('刚性负债分析', 'liability_analysis', '\n'.join(body))


def module_key_indicators(data):
    ki = data.get('keyIndicators')
    if not ki:
        return ''
    body = []

    # 顶部指标
    children = []
    children.append(('近一年收入同期增长率(%)', show(ki.get('yoyRevenueGrowthRate')), False))
    children.append(('营授比(%)', show(ki.get('generalProvisionRatio')), False))
    for i, el in enumerate(ki.get('elementList') or []):
        children.append((el.get('equivalentName', ''), show(el.get('equivalentValue')), False))
    children.append(('承租人及担保人抵押类负债占比(%)', show(ki.get('lesseeAndGuarantorsMortgageLiabilityRatio')), False))
    children.append(('日均余额收入比(%)', show(ki.get('dailyAverageBalanceToIncomeRatio')), False))
    children.append(('对外担保收入比(%)', show(ki.get('externalGuaranteeToIncomeRatio')), False))
    children.append(('现金覆盖比(%)', show(ki.get('cashCoverageRatio')), False))

    cells = []
    for c_label, c_value, _ in children:
        cells.append(f'<div class="report-grid__cell report-grid__cell--w-33">{render_kv(c_label, c_value)}</div>')
    body.append(f'<div class="report-block report-group"><div class="report-grid">{"".join(cells)}</div></div>')

    # 财务指标表
    fi_list = ki.get('financialIndicatorList') or []
    have_data = ki.get('haveData')
    if have_data is False or not fi_list:
        body.append(render_table('承租人近3年主要财务指标', [], [], show_index=False, empty_text='暂无财务指标数据'))
    else:
        # 动态年份列
        year_keys = []
        for it in fi_list:
            y = it.get('year')
            dt = it.get('dataType') or ''
            if y:
                label = f"{y} {dt}".strip()
                year_keys.append((y, label))
        # 16 行固定指标
        indicator_defs = [
            ('盈利能力', '销售毛利率(%)', 'grossProfitMargin'),
            ('盈利能力', 'ROA 资产净利率(%)', 'returnOnAssets'),
            ('盈利能力', 'ROE 净资产收益率(%)', 'returnOnEquity'),
            ('运营能力', '存货周转率', 'inventoryTurnover'),
            ('运营能力', '应收账款周转率', 'accountsReceivableTurnover'),
            ('运营能力', '总资产周转率', 'totalAssetTurnover'),
            ('偿债能力', '资产负债率(%)', 'debtToAssetRatio'),
            ('偿债能力', '速动比率', 'quickRatio'),
            ('偿债能力', '流动比率', 'currentRatio'),
            ('偿债能力', '借款依存度(%)', 'loanDependence'),
            ('偿债能力', '现金流动负债比率(%)', 'cashFlowToCurrentLiabilitiesRatio'),
            ('偿债能力', '销售现金比率(%)', 'cashSalesRatio'),
            ('偿债能力', '清算价值比率(%)', 'liquidationValueRatio'),
            ('发展能力', '营业增长率(%) [财报数据]', 'operatingRevenueGrowthRateFinancial'),
            ('发展能力', '资本积累率(%)', 'capitalAccumulationRate'),
            ('发展能力', '总资产增长率(%)', 'totalAssetGrowthRate'),
        ]
        fi_cols = [
            {'key': 'category', 'label': '评估项目', 'mergeSame': True},
            {'key': 'indicator', 'label': '财务指标'},
        ] + [{'key': f'y_{y}', 'label': label} for y, label in year_keys]

        fi_rows = []
        for cat, ind, key in indicator_defs:
            row = {'category': cat, 'indicator': ind}
            for y, _ in year_keys:
                # 在该年份对象里取 key
                year_obj = next((it for it in fi_list if it.get('year') == y), None)
                row[f'y_{y}'] = show((year_obj or {}).get(key))
            fi_rows.append(row)

        body.append(render_table('承租人近3年主要财务指标', fi_cols, fi_rows, show_index=False, empty_text='暂无财务指标数据'))

    return module_wrapper('重点指标', 'key_indicators', '\n'.join(body))


def module_key_account_financials(data):
    fs = data.get('financialStatementsOfKeyAccounts')
    if not fs:
        return ''
    body = []

    balance_defs = [
        ('一、资产合计', 'totalAssets', 1),
        ('1、流动资产合计', 'totalCurrentAssets', 2),
        ('货币资金', 'monetaryFunds', 3),
        ('短期投资', 'shortInvestments', 3),
        ('应收票据', 'notesReceivable', 3),
        ('应收账款', 'accountsReceivable', 3),
        ('预付款项', 'prepayments', 3),
        ('应收股利', 'dividentsReceivable', 3),
        ('应收利息', 'interestReceivable', 3),
        ('其他应收款', 'otherReceivables', 3),
        ('存货', 'inventories', 3),
        ('其他流动资产', 'otherCurrentAssets', 3),
        ('2、非流动资产合计', 'totalNoncurrentAssets', 2),
        ('长期债权投资', 'longDebtInvestments', 3),
        ('长期股权投资', 'longEquityInvestments', 3),
        ('固定资产原价', 'originalValueFixedAssets', 3),
        ('减：累计折旧', 'accumulateDepreciation', 3),
        ('固定资产账面价值', 'bookValueOfFixedAssets', 3),
        ('在建工程', 'constructionProjects', 3),
        ('生产性生物资产', 'producedBiologicalAssets', 3),
        ('无形资产', 'intangibleAssets', 3),
        ('长期待摊费用', 'longAmortisedExpenses', 3),
        ('使用权资产', 'rightOfUseAsset', 3),
        ('其他非流动资产', 'otherNoncurrentAssets', 3),
        ('二、负债合计', 'totalLiabilities', 1),
        ('1、流动负债合计', 'totalCurrentLiabilities', 2),
        ('短期借款', 'shortLoans', 3),
        ('应付票据', 'notesPayable', 3),
        ('应付账款', 'accountsPayable', 3),
        ('预收账款', 'accountsReceivedAdvance', 3),
        ('应付职工薪酬', 'wagesPayable', 3),
        ('应交税费', 'taxesPayable', 3),
        ('应付利息', 'interestPayable', 3),
        ('应付利润', 'profitPayable', 3),
        ('其他应付款', 'otherPayables', 3),
        ('其他流动负债', 'otherCurrentLiabilities', 3),
        ('2、非流动负债合计', 'totalNoncurrentLiabilities', 2),
        ('长期借款', 'longLoans', 3),
        ('长期应付款', 'longPayables', 3),
        ('递延收益', 'deferredIncome', 3),
        ('租赁负债', 'leaseLiability', 3),
        ('其他非流动负债', 'otherNoncurrentLiabilities', 3),
        ('三、所有者权益(或股东权益)合计', 'totalOwnersEquity', 1),
        ('实收资本(或股本)', 'paidInCapital', 3),
        ('资本公积', 'capitalSurplus', 3),
        ('盈余公积', 'surplusReserves', 3),
        ('未分配利润', 'undistributedProfit', 3),
    ]
    profit_defs = [
        ('一、营业收入', 'revenueOperations', 1),
        ('减：营业成本', 'costBusiness', 3),
        ('营业税金及附加', 'mainBusinessTaxesSurcharges', 3),
        ('销售费用', 'sellingExpenses', 3),
        ('管理费用', 'administrativeExpenses', 3),
        ('财务费用', 'financeCosts', 3),
        ('二、营业利润', 'operatingProfit', 1),
        ('加：营业外收入', 'nonoperatingIncome', 3),
        ('减：营业外支出', 'nonoperatingExpenses', 3),
        ('三、利润总额', 'totalProfit', 1),
        ('减：所得税费用', 'incomeTaxExpense', 3),
        ('四、净利润', 'netProfit', 1),
    ]

    for subj in (fs.get('financialStatementsOfKeyAccountList') or []):
        sheet_name = subj.get('sheetName', '')
        source = subj.get('fsDataSourceType', '')
        body.append(f'''<div class="report-block report-fs-subject">
  <div class="report-fs-subject__title">{esc(sheet_name)}</div>
  <div class="report-fs-subject__source">数据来源：{esc(source)}</div>
</div>''')

        def render_fs_table(label, sheet_data, defs):
            if not sheet_data:
                return f'''<div class="report-block report-fs-table-wrap">
  <div class="report-fs-table__label">{esc(label)}</div>
  <div class="report-fs-table__unit">单位：元</div>
  <div class="report-table-empty">暂无数据</div>
</div>'''
            # 期间列
            periods = []
            seen = set()
            for item in sheet_data:
                p = item.get('period')
                dt = item.get('dataType') or ''
                if p and p not in seen:
                    seen.add(p)
                    periods.append({'period': p, 'dataType': dt})
            # 期间 -> 数据对象
            period_map = {item.get('period'): item for item in sheet_data}

            head_cells = ['<th>科目</th>']
            for p in periods:
                tag = f'<span class="report-fs-period-tag">{esc(p["dataType"])}</span>' if p['dataType'] else ''
                head_cells.append(f'<th>{esc(p["period"])}{tag}</th>')

            rows_html = []
            for name, key, level in defs:
                tds = [f'<td>{esc(name)}</td>']
                for p in periods:
                    obj = period_map.get(p['period']) or {}
                    val = obj.get(key)
                    tds.append(f'<td class="report-fs-amount">{fmt_amount(val)}</td>')
                rows_html.append(f'<tr class="report-fs-rowlevel-{level}">{"".join(tds)}</tr>')

            return f'''<div class="report-block report-fs-table-wrap">
  <div class="report-fs-table__label">{esc(label)}</div>
  <div class="report-fs-table__unit">单位：元</div>
  <table class="report-fs-table">
    <thead><tr>{''.join(head_cells)}</tr></thead>
    <tbody>{''.join(rows_html)}</tbody>
  </table>
</div>'''

        body.append(render_fs_table('资产负债表', subj.get('balanceSheet') or [], balance_defs))
        body.append(render_fs_table('利润表', subj.get('profitSheet') or [], profit_defs))

    if fs.get('financialNotes'):
        body.append(render_longtext('财务说明', esc(fs['financialNotes'])))

    return module_wrapper('重点科目财务报表', 'key_account_financials', '\n'.join(body))


def module_analysis_results(data):
    ar = data.get('analysisResults') or []
    if not ar:
        return ''
    # 按 analysisType 分组，保持顺序
    groups = {}
    group_order = []
    for it in ar:
        t = it.get('analysisType') or '其他分析'
        if t not in groups:
            groups[t] = []
            group_order.append(t)
        groups[t].append(it)

    # 固定顺序：项目流水分析 -> 项目司法分析 -> 其他
    def sort_key(t):
        if t == '项目流水分析':
            return 0
        if t == '项目司法分析':
            return 1
        return 2
    group_order.sort(key=sort_key)

    body = []
    block_key_map = {'项目流水分析': 'cashflow_analysis', '项目司法分析': 'judicial_analysis'}
    for i, t in enumerate(group_order):
        items = []
        for it in groups[t]:
            concl = it.get('analysisConclusion')
            if concl is not None:
                concl = str(concl).strip()
                if concl == '' or concl == '{}':
                    concl = None
            items.append({
                'customerName': it.get('customerName'),
                'conclusion': concl,
            })
        bk = block_key_map.get(t, f'analysis_type_{i}')
        body.append(render_analysis_list(t, items, empty_text='暂无分析结果'))

    return module_wrapper('AI分析结果', 'analysis_results', '\n'.join(body))


def module_attachments(data):
    attach_list = data.get('attachmentList') or []
    SECTION_DEFS = [
        ('基础材料', ['营业执照', '自然人身份证明', '公司章程', '开户许可证', '开票资料']),
        ('征信材料', ['征信附件', '征信授权文件']),
        ('资质材料', ['厂房租赁合同', '不动产权证书', '水电费缴纳凭证', '特殊行业资质证明', '环评批复', '房产证']),
        ('租赁物材料', ['设备销售合同', '代理进口合同', '租赁物发票', '营业执照（供应商）', '身份证明（供应商法人代表）', '开户许可证（供应商）', '开票资料（供应商）']),
        ('财税报表', ['财务报表', '纳税申报表']),
        ('银行流水', ['银行流水', '银行流水分析报告']),
        ('补充材料', ['政策文件', '突破定价申请材料', '访厂照片', '订单信息', '补充材料', '其它', '客户风险评估报告']),
        ('中登报送', ['报送中登']),
        ('尽调报告', ['尽职调查报告']),
    ]
    sections = []
    for model_name, doc_types in SECTION_DEFS:
        files = []
        for a in attach_list:
            dd = a.get('documentDir') or {}
            dd_name = dd.get('name') if isinstance(dd, dict) else str(dd)
            if dd_name in doc_types:
                files.append({
                    'fileName': a.get('fileName', ''),
                    'documentType': dd_name,
                    'uploadTime': a.get('uploadTime', ''),
                })
        sections.append({
            'modelName': model_name,
            'documentDirDesc': '，'.join(doc_types),
            'files': files,
        })
    return module_wrapper('附件信息', 'attachments', render_attachment_sections(sections))


# =============================================================
def main():
    with open(INPUT, 'r', encoding='utf-8') as f:
        data = json.load(f)

    modules_html = []
    for fn in [
        module_project_change,
        module_project_summary,
        module_cooperation_history,
        module_project_base_info,
        module_implementation_plan,
        module_lease_property,
        module_lessee_base_info,
        module_related_enterprise,
        module_credit_enhancement,
        module_revenue_analysis,
        module_liability_analysis,
        module_key_indicators,
        module_key_account_financials,
        module_analysis_results,
        module_attachments,
    ]:
        try:
            h = fn(data)
            if h:
                modules_html.append(h)
        except Exception as e:
            import traceback
            print(f"[ERROR] {fn.__name__}: {e}")
            traceback.print_exc()

    project_name = (data.get('headInfo') or {}).get('projectName') or ''
    ts = datetime.now().strftime('%Y%m%d%H%M')
    if project_name:
        title = f"{project_name}-尽调调查报告-{ts}"
    else:
        title = f"尽调调查报告-{ts}"

    html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(title)}</title>
</head>
<body>
{CSS}
<div class="report-root">
{''.join(modules_html)}
</div>
</body>
</html>'''

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r'[\\/:*?"<>|]', '_', title)
    out_path = OUT_DIR / f'{safe_name}.html'
    out_path.write_text(html, encoding='utf-8')
    print(f"[OK] 输出: {out_path}")
    print(f"[OK] 大小: {out_path.stat().st_size} bytes")


if __name__ == '__main__':
    main()
