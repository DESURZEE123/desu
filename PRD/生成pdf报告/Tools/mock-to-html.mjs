#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_MOCK_PATH = path.join(ROOT, 'json数据', 'mock.json');
const STYLE_RENDER_PATH = path.join(ROOT, '小企业', 'prjc_style_render.md');
const DEFAULT_OUTPUT_PATH = path.join(ROOT, 'html', '小企业全量测试数据.html');

const cliArgs = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const MOCK_PATH = cliArgs[0] ? path.resolve(cliArgs[0]) : DEFAULT_MOCK_PATH;
const OUTPUT_PATH = cliArgs[1] ? path.resolve(cliArgs[1]) : DEFAULT_OUTPUT_PATH;

// ─── Helpers ───────────────────────────────────────────────────────────────

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export function dash(v) {
  return isEmpty(v) ? '—' : String(v).trim();
}

export function fmtAmount(v) {
  if (isEmpty(v)) return '—';
  const n = Number(String(v).replace(/,/g, ''));
  if (Number.isNaN(n)) return dash(v);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtPercent(v) {
  if (isEmpty(v)) return '—';
  const raw = String(v).trim().replace(/%/g, '');
  const n = Number(raw.replace(/,/g, ''));
  if (Number.isNaN(n)) return dash(v);
  return `${n.toFixed(4)}%`;
}

function trimStr(v) {
  return isEmpty(v) ? null : String(v).trim();
}

function joinRole(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '—';
  const parts = arr.map((x) => dash(x)).filter((x) => x !== '—');
  return parts.length ? parts.join('、') : '—';
}

function roleTone(role) {
  if (role === '承租人') return 'lessee';
  if (role === '担保人') return 'guarantor';
  if (role === '关联方') return 'related';
  return 'default';
}

function renderRoleTags(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return '—';
  return roles.map((r) => {
    const tone = roleTone(r);
    return `<span class="report-role-tag report-role-tag--${tone}">${escapeHtml(dash(r))}</span>`;
  }).join('');
}

function factoryTypeLabel(v) {
  if (isEmpty(v)) return '—';
  const map = { 0: '自有', 1: '租用', 2: '无厂房' };
  const n = Number(v);
  return map[n] ?? String(v);
}

function sumDecimal(values) {
  let total = 0;
  let has = false;
  for (const v of values) {
    if (isEmpty(v)) continue;
    const n = Number(String(v).replace(/,/g, ''));
    if (!Number.isNaN(n)) {
      total += n;
      has = true;
    }
  }
  return has ? total.toFixed(4).replace(/\.?0+$/, (m) => (m.includes('.') ? m.replace(/0+$/, '').replace(/\.$/, '') : m)) : '—';
}

function sumDecimal2(values) {
  let total = 0;
  let has = false;
  for (const v of values) {
    if (isEmpty(v)) continue;
    const n = Number(String(v).replace(/,/g, ''));
    if (!Number.isNaN(n)) {
      total += n;
      has = true;
    }
  }
  return has ? total.toFixed(2) : '—';
}

function avgDecimal(values) {
  let total = 0;
  let count = 0;
  for (const v of values) {
    if (isEmpty(v)) continue;
    const n = Number(String(v).replace(/,/g, ''));
    if (!Number.isNaN(n)) {
      total += n;
      count += 1;
    }
  }
  return count ? (total / count).toFixed(2) : '—';
}

function groupBySubject(items, key = 'subjectName') {
  const groups = [];
  const map = new Map();
  for (const item of items || []) {
    const k = `${item[key] ?? ''}::${item.customerNo ?? ''}`;
    if (!map.has(k)) {
      const g = { key: k, items: [] };
      map.set(k, g);
      groups.push(g);
    }
    map.get(k).items.push(item);
  }
  return groups;
}

function joinPaymentMethod(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '—';
  return arr.map((x) => dash(x)).filter((x) => x !== '—').join('/');
}

function extractDesc(obj) {
  if (isEmpty(obj)) return null;
  if (typeof obj === 'string') return obj.trim();
  return obj.desc ? String(obj.desc).trim() : null;
}

function mapGuaranteeTone(gm) {
  const code = gm && typeof gm === 'object' ? gm.code : null;
  const desc = extractDesc(gm) || '';
  if (code === 1 || desc.includes('保证')) return 'guarantee';
  if (code === 3 || desc.includes('抵押')) return 'mortgage';
  if (code === 5 || desc.includes('质押')) return 'pledge';
  return 'default';
}

function normalizeConclusion(v) {
  if (isEmpty(v)) return null;
  const s = String(v).trim();
  if (s === '{}' || s === '[]') return null;
  return s;
}

function gridWidthClass(columns) {
  const map = { 1: '100', 2: '50', 3: '33', 4: '25' };
  return `report-grid__cell--w-${map[columns] || '25'}`;
}

function alignClass(align) {
  if (align === 'center') return 'report-table__cell--align-center';
  if (align === 'right') return 'report-table__cell--align-right';
  return '';
}

function mergeCellValue(val) {
  if (Array.isArray(val)) return JSON.stringify(val);
  return val;
}

function isMergeEmpty(val) {
  if (Array.isArray(val)) return val.length === 0;
  return isEmpty(val) || val === '—';
}

// ─── CSS extraction ────────────────────────────────────────────────────────

const EXTRA_CSS = `
  .report-module__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .report-module__header-meta {
    font-size: 12px;
    font-weight: 400;
    color: #86909C;
    flex-shrink: 0;
    margin-left: 16px;
  }
  .report-label-panel {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
  }
  .report-label-card {
    flex: 1;
    border-radius: 4px;
    padding: 12px 16px;
    border: 1px solid #E5E6EB;
    box-sizing: border-box;
  }
  .report-label-card--warning {
    background: #FFF7E8;
    border-color: #FF7D00;
  }
  .report-label-card--negative {
    background: #FFECE8;
    border-color: #F53F3F;
  }
  .report-label-card__title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .report-label-card--warning .report-label-card__title { color: #FF7D00; }
  .report-label-card--negative .report-label-card__title { color: #F53F3F; }
  .report-label-card__list {
    margin: 0;
    padding-left: 1.2em;
    font-size: 14px;
    line-height: 22px;
    color: #1D2129;
  }
  .report-label-card__list li { margin-bottom: 4px; }
  .report-role-tag {
    display: inline-block;
    padding: 0 8px;
    border-radius: 2px;
    font-size: 12px;
    line-height: 20px;
    margin-right: 4px;
    margin-bottom: 2px;
  }
  .report-role-tag--lessee { background: #E8F3FF; color: #1677FF; }
  .report-role-tag--guarantor { background: #FFF7E8; color: #FF7D00; }
  .report-role-tag--related { background: #E8FFEA; color: #00B42A; }
  .report-role-tag--default { background: #F2F3F5; color: #86909C; }
  .report-table__cell--highlight { color: #FF7D00; font-weight: 600; }
  .report-litigation-section__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .report-litigation-section__header .report-section-title { margin-bottom: 0; }
  .report-litigation-section__meta {
    font-size: 12px;
    color: #86909C;
    flex-shrink: 0;
  }
  .report-litigation-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .report-litigation-card {
    position: relative;
    border-radius: 4px;
    padding: 20px 16px;
    min-height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  }
  .report-litigation-card__type {
    font-size: 14px;
    font-weight: 500;
    color: #FFFFFF;
    text-align: center;
    line-height: 22px;
  }
  .report-litigation-card__num {
    position: absolute;
    top: 8px;
    right: 12px;
    font-size: 18px;
    font-weight: 600;
    color: #FFFFFF;
    line-height: 1;
  }
  .report-litigation-card--highRisk {
    background: linear-gradient(135deg, #F98981 0%, #F53F3F 100%);
  }
  .report-litigation-card--common {
    background: linear-gradient(135deg, #6AA1FF 0%, #1677FF 100%);
  }
  .report-attachment-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #E5E6EB;
  }
  .report-attachment-section:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  .report-attachment-section__head {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-bottom: 12px;
    padding-left: 10px;
    border-left: 3px solid #1677FF;
  }
  .report-attachment-section__title {
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
    line-height: 22px;
  }
  .report-attachment-section__desc {
    font-size: 12px;
    color: #86909C;
    line-height: 20px;
  }
  .report-attachment-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .report-attachment-card {
    background: #F7F8FA;
    border: 1px solid #E5E6EB;
    border-radius: 4px;
    padding: 12px 14px;
    box-sizing: border-box;
    min-height: 72px;
  }
  .report-attachment-card__name {
    font-size: 13px;
    font-weight: 600;
    color: #1D2129;
    line-height: 20px;
    word-break: break-all;
    margin-bottom: 8px;
  }
  .report-attachment-card__meta {
    font-size: 12px;
    color: #86909C;
    line-height: 20px;
  }
  .report-fs-subject-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 16px 0 12px;
    padding: 10px 12px;
    background: #F2F3F5;
    border-radius: 4px;
  }
  .report-fs-subject-header__title {
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
  }
  .report-fs-subject-header__source {
    font-size: 12px;
    color: #86909C;
  }
  .report-fs-table-block {
    margin-bottom: 16px;
  }
  .report-fs-table-block__caption {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 8px;
  }
  .report-fs-table-block__title {
    font-size: 14px;
    font-weight: 600;
    color: #1D2129;
  }
  .report-fs-table-block__unit {
    font-size: 12px;
    color: #86909C;
  }
  .report-fs-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 12px;
  }
  .report-fs-table th,
  .report-fs-table td {
    border-bottom: 1px solid #E5E6EB;
    padding: 8px 10px;
    vertical-align: middle;
  }
  .report-fs-table thead th {
    background: #F2F3F5;
    font-weight: 600;
    color: #1D2129;
    text-align: left;
  }
  .report-fs-table thead th.report-fs-table__period {
    text-align: right;
  }
  .report-fs-table__period-label {
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }
  .report-fs-table__data-type {
    display: inline-block;
    padding: 0 6px;
    border-radius: 2px;
    background: #F53F3F;
    color: #FFFFFF;
    font-size: 11px;
    line-height: 18px;
    font-weight: 500;
  }
  .report-fs-table__account {
    color: #1D2129;
  }
  .report-fs-table__account--l3 {
    padding-left: 28px;
  }
  .report-fs-table__value {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: #1D2129;
  }
  .report-fs-table__row--l1 td {
    background: #FFECE8;
    font-weight: 600;
  }
  .report-fs-table__row--l2 td {
    background: #FFF7E8;
    font-weight: 600;
  }
  .report-fs-table__row--l3:nth-child(even) td {
    background: #FAFBFC;
  }

  .report-associate-synopsis {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }
  .report-associate-synopsis__card {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    padding: 12px 16px;
    background: #F7F9FC;
    border: 1px solid #E5E6EB;
    border-radius: 4px;
  }
  .report-associate-tag {
    display: inline-block;
    padding: 0 10px;
    height: 22px;
    line-height: 22px;
    font-size: 12px;
    font-weight: 500;
    color: #FFFFFF;
    transform: skewX(-12deg);
    flex-shrink: 0;
  }
  .report-associate-tag > span {
    display: inline-block;
    transform: skewX(12deg);
  }
  .report-associate-tag--guarantor { background: #1677FF; }
  .report-associate-tag--nonGuarantor { background: #F7BA1E; }
  .report-associate-synopsis__name {
    font-size: 14px;
    font-weight: 500;
    color: #1677FF;
  }
  .report-associate-synopsis__id {
    font-size: 14px;
    color: #4E5969;
  }
  .report-associate-detail,
  .report-guarantee-detail {
    margin-bottom: 20px;
    padding: 12px 16px 4px;
    border: 1px solid #E5E6EB;
    border-radius: 4px;
    background: #FFFFFF;
  }
  .report-associate-detail__header,
  .report-guarantee-detail__header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid #E5E6EB;
  }
  .report-associate-detail__title,
  .report-guarantee-detail__title {
    font-size: 14px;
    font-weight: 600;
    color: #1677FF;
    line-height: 22px;
  }
  .report-associate-detail__id {
    font-size: 13px;
    color: #86909C;
  }
`;

function extractBaseCss() {
  const content = fs.readFileSync(STYLE_RENDER_PATH, 'utf8');
  const match = content.match(/```html\s*\n<style>([\s\S]*?)<\/style>\s*\n```/);
  if (!match) throw new Error('Could not extract <style> from prjc_style_render.md §4.2');
  return `${match[1].trim()}\n${EXTRA_CSS}`;
}

// ─── Markdown renderer ─────────────────────────────────────────────────────

function renderInlineMd(text) {
  let s = escapeHtml(text);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/__(.+?)__/g, '<strong>$1</strong>');
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  s = s.replace(/_(.+?)_/g, '<em>$1</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

function isTableSep(line) {
  return /^\|?[\s\-:|]+\|?$/.test(line.trim()) && line.includes('-');
}

export function renderMarkdown(md) {
  if (isEmpty(md)) return '';
  const lines = String(md).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      i += 1;
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      out.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      const m = line.match(/^(#{1,6})\s+(.*)$/);
      const level = m[1].length;
      out.push(`<h${level}>${renderInlineMd(m[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      out.push('<hr>');
      i += 1;
      continue;
    }

    if (line.trim().startsWith('>')) {
      const q = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        q.push(lines[i].replace(/^>\s?/, ''));
        i += 1;
      }
      out.push(`<blockquote><p>${renderInlineMd(q.join(' '))}</p></blockquote>`);
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = parseTableRow(line);
      i += 2;
      const body = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        body.push(parseTableRow(lines[i]));
        i += 1;
      }
      out.push('<table><thead><tr>');
      header.forEach((h) => { out.push(`<th>${renderInlineMd(h)}</th>`); });
      out.push('</tr></thead><tbody>');
      body.forEach((row) => {
        out.push('<tr>');
        row.forEach((c) => { out.push(`<td>${renderInlineMd(c)}</td>`); });
        out.push('</tr>');
      });
      out.push('</tbody></table>');
      continue;
    }

    if (/^[-*]\s/.test(line.trim())) {
      out.push('<ul>');
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        out.push(`<li>${renderInlineMd(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>`);
        i += 1;
      }
      out.push('</ul>');
      continue;
    }

    if (/^\d+\.\s/.test(line.trim())) {
      out.push('<ol>');
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        out.push(`<li>${renderInlineMd(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`);
        i += 1;
      }
      out.push('</ol>');
      continue;
    }

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^#{1,6}\s/.test(lines[i]) && !/^[-*]\s/.test(lines[i].trim()) && !/^\d+\.\s/.test(lines[i].trim()) && !lines[i].trim().startsWith('>') && !(lines[i].includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1]))) {
      para.push(lines[i]);
      i += 1;
    }
    if (para.length) out.push(`<p>${renderInlineMd(para.join(' '))}</p>`);
  }

  return out.join('');
}

// ─── L1: module transforms ─────────────────────────────────────────────────

function transformProjectSummary(data) {
  const li = data.labelInfo;
  if (!li) return null;

  const riskItems = (li.riskLabel || []).filter((x) => !isEmpty(x));
  const negItems = (li.negativeList || []).filter((x) => !isEmpty(x));
  const hasLists = riskItems.length > 0 || negItems.length > 0;
  const labelDesc = trimStr(li.labelDesc);

  if (!hasLists && !labelDesc) return null;

  const blocks = [];
  const panels = [];
  if (riskItems.length) {
    panels.push({ blockKey: 'riskLabel', label: '警示清单', tone: 'warning', items: riskItems });
  }
  if (negItems.length) {
    panels.push({ blockKey: 'negativeList', label: '负面清单', tone: 'negative', items: negItems });
  }
  if (panels.length) {
    blocks.push({ blockKey: 'labelPanel', displayType: 'labelPanel', panels });
  }
  if (hasLists) {
    blocks.push({
      blockKey: 'labelDesc',
      label: '突破负面清单/警示清单说明',
      displayType: 'longText',
      value: dash(labelDesc),
    });
  }

  return {
    moduleIndex: 2,
    moduleName: '项目概要',
    moduleKey: 'project_summary',
    blocks,
  };
}

const LEASE_COLS = [
  { key: 'customerName', label: '客户名称' },
  { key: 'customerRoleEnum', label: '客户角色' },
  { key: 'leaseMethodFact', label: '租赁方式(实际)' },
  { key: 'contName', label: '合同名称' },
  { key: 'irr', label: '内部收益率(%)' },
  { key: 'cmprhnsvIrr', label: '综合收益率(%)' },
  { key: 'contCashPledge', label: '合同金额(元)', align: 'right' },
  { key: 'corpusBalancePledge', label: '剩余本金(元)', align: 'right' },
  { key: 'curOverdueAmount', label: '当前逾期金额(元)', align: 'right' },
  { key: 'leaseBeginDate', label: '合同起租日' },
  { key: 'contEndDate', label: '合同到期日' },
  { key: 'curOverdueDays', label: '当前逾期天数' },
  { key: 'historyOverdueDays', label: '历史最大逾期天数' },
  { key: 'historyOverdueTimes', label: '历史逾期次数' },
];

const GUARANTOR_COLS = [
  { key: 'customerName', label: '客户名称' },
  { key: 'customerRoleEnum', label: '客户角色' },
  { key: 'guaranteeMethod', label: '担保方式' },
  { key: 'contName', label: '合同名称' },
  { key: 'irr', label: '内部收益率(%)' },
  { key: 'cmprhnsvIrr', label: '综合收益率(%)' },
  { key: 'leaseMethodFact', label: '租赁方式(实际)' },
  { key: 'contCashPledge', label: '合同金额(元)', align: 'right' },
  { key: 'corpusBalancePledge', label: '剩余本金(元)', align: 'right' },
  { key: 'curOverdueAmount', label: '当前逾期金额(元)', align: 'right' },
  { key: 'leaseBeginDate', label: '合同起租日' },
  { key: 'contEndDate', label: '合同到期日' },
  { key: 'curOverdueDays', label: '当前逾期天数' },
  { key: 'historyOverdueDays', label: '历史最大逾期天数' },
  { key: 'historyOverdueTimes', label: '历史逾期次数' },
];

function mapCoopRow(row) {
  return {
    customerName: dash(row.customerName),
    customerRoleEnum: dash(row.customerRoleEnum),
    leaseMethodFact: dash(row.leaseMethodFact),
    contName: dash(row.contName),
    irr: dash(row.irr),
    cmprhnsvIrr: dash(row.cmprhnsvIrr),
    guaranteeMethod: dash(row.guaranteeMethod || row.guaranteeMethodList),
    contCashPledge: fmtAmount(row.contCashPledge),
    corpusBalancePledge: fmtAmount(row.corpusBalancePledge ?? row.riskExposure),
    curOverdueAmount: fmtAmount(row.curOverdueAmount),
    leaseBeginDate: dash(row.leaseBeginDate),
    contEndDate: dash(row.contEndDate),
    curOverdueDays: dash(row.curOverdueDays),
    historyOverdueDays: dash(row.historyOverdueDays),
    historyOverdueTimes: dash(row.historyOverdueTimes),
  };
}

function coopSummary(total) {
  return {
    index: '合计',
    contCashPledge: fmtAmount(total?.contCashPledge),
    corpusBalancePledge: fmtAmount(total?.corpusBalancePledge ?? total?.riskExposure),
    curOverdueAmount: fmtAmount(total?.curOverdueAmount),
  };
}

function transformCooperationHistory(data) {
  const m = data.commonCollaborationHistoryModel;
  if (!m) return null;

  const leaseRows = (m.leaseCollaborationHistoryList || []).map(mapCoopRow);
  const guarRows = (m.guarantorCollaborationHistories || []).map(mapCoopRow);
  const bothEmpty = leaseRows.length === 0 && guarRows.length === 0;
  const emptyText = bothEmpty ? '所有客户均无合作历史数据' : '暂无合作历史数据';

  const blocks = [
    {
      blockKey: 'leaseCollaborationHistoryList',
      label: '承租人、关联方、担保人作为承租人情况',
      displayType: 'table',
      showIndex: true,
      columns: LEASE_COLS,
      rows: leaseRows,
      summary: coopSummary(m.leaseAmountTotal),
      emptyText,
    },
    {
      blockKey: 'guarantorCollaborationHistories',
      label: '承租人、关联方、担保人作为担保人情况',
      displayType: 'table',
      showIndex: true,
      columns: GUARANTOR_COLS,
      rows: guarRows,
      summary: coopSummary(m.guarantorAmountTotal),
      emptyText,
    },
  ];

  if (!bothEmpty) {
    blocks.push({
      blockKey: 'cooperateHistoryDesc',
      label: '合作历史说明',
      displayType: 'longText',
      value: dash(trimStr(m.cooperateHistoryDesc)),
    });
  }

  return {
    moduleIndex: 3,
    moduleName: '合作历史',
    moduleKey: 'cooperation_history',
    blocks,
  };
}

function transformProjectBaseInfo(data) {
  const p = data.projectBaseInfo;
  if (!p) return null;

  const children = [
    { blockKey: 'customerName', label: '客户名称', displayType: 'direct', value: dash(p.customerName) },
    { blockKey: 'projectAmount', label: '项目金额(元)', displayType: 'direct', value: fmtAmount(p.projectAmount) },
    { blockKey: 'capitalUse', label: '资金用途', displayType: 'direct', value: dash(p.capitalUse) },
    { blockKey: 'leaseMethod', label: '租赁方式', displayType: 'direct', value: dash(p.leaseMethod) },
    { blockKey: 'managerName', label: '项目经理', displayType: 'direct', value: dash(p.managerName) },
    { blockKey: 'custHelpName', label: '项目协办人', displayType: 'direct', value: dash(p.custHelpName) },
    { blockKey: 'projectSource', label: '业务信息来源', displayType: 'direct', value: dash(p.projectSource) },
    { blockKey: 'projectType', label: '项目类型', displayType: 'direct', value: dash(p.projectType) },
    { blockKey: 'insuranceSituation', label: '投保情况', displayType: 'direct', value: dash(p.insuranceSituation) },
    { blockKey: 'leasebackReason', label: '售后回租原因', displayType: 'direct', value: dash(p.leasebackReason) },
  ];

  if (p.projectType === '老客租项目' && p.oldContInfoList) {
    const names = Array.isArray(p.oldContInfoList)
      ? p.oldContInfoList.map((x) => (typeof x === 'string' ? x : x?.contName)).filter(Boolean)
      : [];
    children.push({
      blockKey: 'oldContInfoList',
      label: '对应老合同',
      displayType: 'direct',
      value: names.length ? names.join('；') : '—',
    });
  }

  children.push(
    { blockKey: 'leaseInsurance', label: '租赁物保险', displayType: 'longText', value: dash(p.leaseInsurance) },
    { blockKey: 'leasebackExplain', label: '售后回租原因说明', displayType: 'longText', value: dash(p.leasebackExplain) },
  );

  const env = p.environmentAndSocialRisk || {};
  const envRows = [
    { indicator: '拟承租人经营活动是否涉及业务排除清单', result: dash(env.exclusionBusinessResult) },
    { indicator: '所属行业是否为国家产业政策、行业准入政策限制的行业', result: dash(env.policyRestrictResult) },
    { indicator: '是否取得主管部门颁发的特定行业的许可经营证明', result: dash(env.operateLicenseResult) },
    { indicator: '是否存在国家或省级主管部门认定的重大环境、安全生产违法违规行为', result: dash(env.offenceResult) },
    { indicator: '租赁物是否存在环境和社会风险隐患（易燃易爆物、危险化学品、有毒有害物等）', result: dash(env.hiddenRiskResult) },
    { indicator: '评估结论（高、中、低）', result: dash(env.assessResult) },
  ];

  const siteRows = (p.siteSituationList || []).map((s) => ({
    workerList: (s.workerList || []).map((w) => w.userName).filter(Boolean).join('、') || '—',
    signDate: dash(s.signDate),
    address: dash(s.address),
    context: dash(s.context),
  }));

  return {
    moduleIndex: 5,
    moduleName: '基本信息',
    moduleKey: 'project_base_info',
    blocks: [
      { blockKey: 'projectBaseInfo', displayType: 'group', columns: 4, children },
      {
        blockKey: 'environmentAndSocialRisk',
        label: '环境与社会风险评估',
        displayType: 'table',
        showIndex: false,
        columns: [{ key: 'indicator', label: '指标' }, { key: 'result', label: '结果' }],
        rows: envRows,
        emptyText: '暂无评估信息',
      },
      { blockKey: 'companyBaseInfo', label: '项目基本情况', displayType: 'longText', value: dash(p.companyBaseInfo) },
      {
        blockKey: 'siteSituationList',
        label: '现场尽调情况',
        displayType: 'table',
        showIndex: true,
        columns: [
          { key: 'workerList', label: '尽调人员' },
          { key: 'signDate', label: '尽调日期' },
          { key: 'address', label: '地点' },
          { key: 'context', label: '主要内容' },
        ],
        rows: siteRows,
        emptyText: '暂无现场尽调记录',
      },
    ],
  };
}

function buildCollateralTable(list) {
  if (!list?.length) return null;
  return {
    label: '担保物',
    showIndex: true,
    columns: [
      { key: 'assetsName', label: '担保物名称' },
      { key: 'locationVfbc', label: '所在地' },
      { key: 'assetsNo1Vfbc', label: '车牌号/不动产面积' },
      { key: 'assetsNo', label: '机身号/不动产单元号' },
      { key: 'assetsNo2Vfbc', label: '租赁物唯一识别码/抵质押证书编号' },
      { key: 'estimateValue', label: '担保物估值(元)', align: 'right' },
      { key: 'currtype', label: '币种' },
      { key: 'debtor', label: '第三方质押债务人' },
      { key: 'isFirstOrder', label: '是否第一顺位' },
      { key: 'assessMode', label: '评估方式' },
      { key: 'compensationNumber', label: '优先受偿权数额', align: 'right' },
      { key: 'valuationCycle', label: '估值周期' },
    ],
    rows: list.map((c) => ({
      assetsName: dash(c.assetsName),
      locationVfbc: dash(c.locationVfbc),
      assetsNo1Vfbc: dash(c.assetsNo1Vfbc),
      assetsNo: dash(c.assetsNo),
      assetsNo2Vfbc: dash(c.assetsNo2Vfbc),
      estimateValue: fmtAmount(c.estimateValue),
      currtype: dash(c.currtype),
      debtor: dash(c.debtor),
      isFirstOrder: dash(c.isFirstOrder),
      assessMode: dash(c.assessMode),
      compensationNumber: fmtAmount(c.compensationNumber),
      valuationCycle: dash(c.valuationCycle),
    })),
  };
}

function buildCreditEnhancementItems(list) {
  return (list || []).map((item) => {
    const gmDesc = extractDesc(item.guaranteeMethod) || '—';
    const tone = mapGuaranteeTone(item.guaranteeMethod);
    const out = {
      guaranteeMethod: gmDesc,
      guaranteeTone: tone,
      customerName: dash(item.customerName),
      crdntlsType: dash(item.crdntlsType),
      documentCode: dash(item.documentCode),
    };
    if (!isEmpty(item.relationship)) out.relationship = String(item.relationship).trim();
    if (tone === 'mortgage' || tone === 'pledge') {
      out.attrs = [
        { label: '抵押物类别', value: dash(item.collateralType) },
        { label: '抵质押物类型', value: dash(item.mortgageAndPledgeType) },
        { label: '抵质押物分类', value: dash(item.mortgageAndPledgeClass) },
      ];
      const collateral = buildCollateralTable(item.collateralList);
      if (collateral) out.collateral = collateral;
    }
    return out;
  });
}

function getCreditEnhancementForQuote(data, quotName) {
  const emb = data.embodiment;
  const common = data.commonCreditEnhancementMeasure;
  if (common?.creditEnhancementMeasureList) {
    const matched = common.creditEnhancementMeasureList.find((x) => x.quotName === quotName);
    if (matched?.creditEnhancementMeasureList?.length) {
      return buildCreditEnhancementItems(matched.creditEnhancementMeasureList);
    }
  }
  if (emb?.creditEnhancementMeasureInfo?.creditEnhancementMeasureList?.length) {
    return buildCreditEnhancementItems(emb.creditEnhancementMeasureInfo.creditEnhancementMeasureList);
  }
  if (data.creditEnhancementMeasure?.creditEnhancementMeasureList?.length) {
    const list = data.creditEnhancementMeasure.creditEnhancementMeasureList;
    const filtered = quotName ? list.filter((x) => !x.quotName || x.quotName === quotName) : list;
    return buildCreditEnhancementItems(filtered);
  }
  return [];
}

function transformImplementationPlan(data) {
  const emb = data.embodiment;
  if (!emb) return null;

  const blocks = [
    {
      blockKey: 'riskSummary',
      displayType: 'group',
      columns: 4,
      children: [
        { blockKey: 'riskExposure', label: '预测风险敞口(元)', displayType: 'direct', value: fmtAmount(emb.riskExposure) },
        { blockKey: 'rate', label: '预测风险敞口/设备原值(%)', displayType: 'direct', value: dash(emb.rate) },
        { blockKey: 'lesseeAggregateRiskExposure', label: '承租人累计风险敞口(元)', displayType: 'direct', value: fmtAmount(emb.lesseeAggregateRiskExposure) },
        { blockKey: 'aggregateRiskExposure', label: '承租人及关联方累计风险敞口(元)', displayType: 'direct', value: fmtAmount(emb.aggregateRiskExposure) },
      ],
    },
  ];

  const quotes = emb.advertisingInfoList || [];
  if (!quotes.length) {
    blocks.push({ blockKey: 'noQuote', displayType: 'empty', label: '报价方案', emptyText: '暂无关联报价' });
  }

  quotes.forEach((q, i) => {
    const quotName = dash(q.quotName);
    blocks.push({ blockKey: `quoteTitle_${i}`, label: quotName, displayType: 'group', columns: 1, children: [] });

    const downPay = q.downPaymentRent ?? q.downPaymentSetting?.downPayment;
    const babRate = q.babRate ?? q.referenceRate?.contIrrBanknote;

    blocks.push({
      blockKey: `loanInfo_${i}`,
      label: '投放信息',
      displayType: 'group',
      columns: 4,
      children: [
        { blockKey: 'advertisingAmount', label: '投放金额(元)', displayType: 'direct', value: fmtAmount(q.advertisingAmount) },
        { blockKey: 'totalRent', label: '租金总额(元)', displayType: 'direct', value: fmtAmount(q.totalRent) },
        { blockKey: 'downPaymentRent', label: '首付款金额(元)', displayType: 'direct', value: fmtAmount(downPay) },
        { blockKey: 'interestSubsidy', label: '贴息金额(元)', displayType: 'direct', value: fmtAmount(q.interestSubsidy) },
        { blockKey: 'marginRent', label: '保证金金额(元)', displayType: 'direct', value: fmtAmount(q.marginRent) },
        { blockKey: 'nominalPrice', label: '名义货价(元)', displayType: 'direct', value: fmtAmount(q.nominalPrice) },
        { blockKey: 'comprehensiveYield', label: '综合收益率(%)', displayType: 'direct', value: dash(q.comprehensiveYield) },
        { blockKey: 'internalYield', label: '内部收益率(%)', displayType: 'direct', value: dash(q.internalYield) },
        { blockKey: 'rentDistribution', label: '租金分配IRR(%)', displayType: 'direct', value: dash(q.rentDistribution) },
        { blockKey: 'quotationRate', label: '报价利率(%)', displayType: 'direct', value: dash(q.quotationRate) },
        { blockKey: 'leasingTerm', label: '租赁期限(月)', displayType: 'direct', value: dash(q.leasingTerm) },
        { blockKey: 'leaseMethod', label: '租赁方式', displayType: 'direct', value: dash(q.leaseMethod) },
        { blockKey: 'isStartLease', label: '是否起租调整', displayType: 'direct', value: dash(q.isStartLease) },
        { blockKey: 'paymentOrder', label: '先付后付标识', displayType: 'direct', value: dash(q.paymentOrder) },
        { blockKey: 'advertisingDate', label: '投放日期', displayType: 'direct', value: dash(q.advertisingDate) },
        { blockKey: 'babRate', label: '银票收益率(%)', displayType: 'direct', value: dash(babRate) },
        { blockKey: 'isAdjustingInterest', label: '是否调息', displayType: 'direct', value: dash(q.isAdjustingInterest) },
      ],
    });

    const payRows = (q.paymentTermList || []).map((pt) => {
      let paymentTerm = pt.paymentTerm;
      if (isEmpty(paymentTerm) && pt.paymentConditions?.length) {
        paymentTerm = pt.paymentConditions.map((c) => c.paramName).join('；');
      }
      return {
        number: dash(pt.number),
        paymentMethod: dash(pt.paymentMethod),
        ifInnerDeduct: dash(pt.ifInnerDeduct),
        plannedLaunchDate: dash(pt.plannedLaunchDate),
        amount: fmtAmount(pt.amount),
        paymentTerm: dash(paymentTerm),
        paymentRecipient: dash(pt.paymentRecipient),
      };
    });

    blocks.push({
      blockKey: `paymentTermList_${i}`,
      label: '付款条件及笔数',
      displayType: 'table',
      showIndex: true,
      columns: [
        { key: 'number', label: '期数展示' },
        { key: 'paymentMethod', label: '付款方式' },
        { key: 'ifInnerDeduct', label: '是否内扣' },
        { key: 'plannedLaunchDate', label: '计划投放日期' },
        { key: 'amount', label: '金额(元)', align: 'right' },
        { key: 'paymentTerm', label: '付款条件' },
        { key: 'paymentRecipient', label: '付款对象' },
      ],
      rows: payRows,
      emptyText: '暂无付款条件',
    });

    const rp = q.rentPlan || {};
    blocks.push({
      blockKey: `rentPlanSummary_${i}`,
      label: '租金计划表',
      displayType: 'group',
      columns: 3,
      children: [
        { blockKey: 'rentTotalAmount', label: '租金总额(元)', displayType: 'direct', value: fmtAmount(rp.rentTotalAmount) },
        { blockKey: 'principalTotalAmount', label: '本金总额(元)', displayType: 'direct', value: fmtAmount(rp.principalTotalAmount) },
        { blockKey: 'interestTotalAmount', label: '利息总额(元)', displayType: 'direct', value: fmtAmount(rp.interestTotalAmount) },
      ],
    });

    const rentDetail = (rp.rentPlanDetailList || []).map((r) => ({
      leaseTime: dash(r.leaseTime),
      eventCategory: dash(r.eventCategory),
      planDate: dash(r.planDate),
      rentAmount: fmtAmount(r.rentAmount),
      interestAmount: fmtAmount(r.interestAmount),
      principalAmount: fmtAmount(r.principalAmount),
    }));

    blocks.push({
      blockKey: `rentPlanDetail_${i}`,
      displayType: 'table',
      showIndex: false,
      columns: [
        { key: 'leaseTime', label: '期数' },
        { key: 'eventCategory', label: '事件类别' },
        { key: 'planDate', label: '计划收取日期' },
        { key: 'rentAmount', label: '租金(元)', align: 'right' },
        { key: 'interestAmount', label: '利息(元)', align: 'right' },
        { key: 'principalAmount', label: '本金(元)', align: 'right' },
      ],
      rows: rentDetail,
      emptyText: '暂无租金计划',
    });

    const depositRows = (q.depositPlan?.depositPlanDetailList || []).map((d) => ({
      leaseTime: dash(d.leaseTime),
      eventCategory: dash(d.eventName ?? d.eventCategory ?? d.type),
      planDate: dash(d.planDate),
      amount: fmtAmount(d.amount ?? d.leaseCash),
    }));

    blocks.push({
      blockKey: `depositPlan_${i}`,
      label: '保证金计划',
      displayType: 'table',
      showIndex: false,
      columns: [
        { key: 'leaseTime', label: '期数' },
        { key: 'eventCategory', label: '事件类别' },
        { key: 'planDate', label: '还款日期' },
        { key: 'amount', label: '应收金额(元)', align: 'right' },
      ],
      rows: depositRows,
      emptyText: '暂无保证金计划',
    });

    const otherRows = (q.otherPlan?.otherPlanDetailList || []).map((o) => ({
      leaseTime: dash(o.leaseTime),
      type: dash(o.type),
      planDate: dash(o.planDate),
      amount: fmtAmount(o.amount ?? o.leaseCash),
    }));

    blocks.push({
      blockKey: `otherPlan_${i}`,
      label: '其他收支计划',
      displayType: 'table',
      showIndex: false,
      columns: [
        { key: 'leaseTime', label: '期数' },
        { key: 'type', label: '还款类型' },
        { key: 'planDate', label: '还款日期' },
        { key: 'amount', label: '金额(元)', align: 'right' },
      ],
      rows: otherRows,
      emptyText: '暂无其他收支计划',
    });

    blocks.push({
      blockKey: `creditEnhancement_${i}`,
      label: '增信措施',
      displayType: 'measureList',
      emptyText: '暂无增信措施',
      items: getCreditEnhancementForQuote(data, q.quotName),
    });
  });

  return {
    moduleIndex: 6,
    moduleName: '实施方案',
    moduleKey: 'implementation_plan',
    blocks,
  };
}

function transformLeaseProperty(data) {
  const m = data.lshldModel;
  if (!m) return null;

  const blocks = [];

  blocks.push({
    blockKey: 'summary',
    displayType: 'group',
    columns: 4,
    children: [
      { blockKey: 'isInstallEquipment', label: '是否安装租赁物监控设备', displayType: 'direct', value: dash(m.isInstallEquipment) },
      { blockKey: 'installEquipmentDesc', label: '监控设备情况说明', displayType: 'direct', value: dash(m.installEquipmentDesc) },
      { blockKey: 'evalReportNo', label: '评估报告号', displayType: 'direct', value: dash(m.evalReportNo) },
      { blockKey: 'netWorthTotal', label: '净值合计(元)', displayType: 'direct', value: fmtAmount(m.netWorthTotal) },
      { blockKey: 'pricingResult', label: '定价结果(元)', displayType: 'direct', value: fmtAmount(m.pricingResult) },
      { blockKey: 'convertRatio', label: '公司要求折价比例(%)', displayType: 'direct', value: dash(m.convertRatio) },
      { blockKey: 'realityConvertRatio', label: '实际折价比例(%)', displayType: 'direct', value: dash(m.realityConvertRatio) },
      { blockKey: 'equipmentRatio', label: '通用设备占比(%)', displayType: 'direct', value: dash(m.equipmentRatio) },
    ],
  });

  const list = Array.isArray(m.lshldInfoList) ? m.lshldInfoList : [];
  blocks.push({
    blockKey: 'lshldInfoList',
    label: '租赁物信息',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'thingName', label: '租赁物名称', stackSpan: true },
      { key: 'thingType', label: '租赁物分类' },
      { key: 'brand', label: '品牌' },
      { key: 'model', label: '型号' },
      { key: 'thingNumber', label: '数量', align: 'right' },
      { key: 'isRefMain', label: '是否主租赁物' },
      { key: 'invoiceNo', label: '发票号' },
      { key: 'invoiceDate', label: '发票日期' },
      { key: 'depreciationYears', label: '折旧年限', align: 'right' },
      { key: 'originalValue', label: '原值(元)', align: 'right' },
      { key: 'netWorth', label: '净值(元)', align: 'right' },
      { key: 'useAddress', label: '使用地点' },
      { key: 'ownershipStatus', label: '租赁物权属状态' },
    ],
    rows: list.map((item) => ({
      thingName: dash(item.thingName),
      thingType: dash(item.thingType?.name ?? item.thingType),
      brand: dash(item.brand),
      model: dash(item.model),
      thingNumber: dash(item.thingNumber),
      isRefMain: dash(item.isRefMain),
      invoiceNo: dash(item.invoiceNo),
      invoiceDate: dash(item.invoiceDate),
      depreciationYears: dash(item.depreciationYears),
      originalValue: fmtAmount(item.originalValue),
      netWorth: fmtAmount(item.netWorth),
      useAddress: dash(item.useAddress),
      ownershipStatus: dash(item.ownershipStatus),
    })),
    summary: list.length
      ? {
          index: '合计',
          originalValue: fmtAmount(m.lshldPriceTotal),
          netWorth: fmtAmount(m.netWorthTotal),
        }
      : undefined,
    emptyText: '暂无租赁物数据',
  });

  if (!isEmpty(m.lshldOwnershipDesc)) {
    blocks.push({
      blockKey: 'lshldOwnershipDesc',
      label: '租赁物权属状态说明',
      displayType: 'longText',
      value: m.lshldOwnershipDesc,
    });
  }

  if (!isEmpty(m.breakPriceDesc)) {
    blocks.push({
      blockKey: 'breakPriceDesc',
      label: '是否突破作价及说明',
      displayType: 'longText',
      value: m.breakPriceDesc,
    });
  }

  return {
    moduleIndex: 7,
    moduleName: '租赁物信息',
    moduleKey: 'lease_property',
    blocks,
  };
}

function transformAnalysisResults(data) {
  const list = data.analysisResults;
  if (!Array.isArray(list) || list.length === 0) return null;

  const order = ['项目流水分析', '项目司法分析'];
  const groups = new Map();
  const extraOrder = [];

  list.forEach((item) => {
    const type = item.analysisType || '未知分析';
    if (!groups.has(type)) {
      groups.set(type, []);
      if (!order.includes(type)) extraOrder.push(type);
    }
    groups.get(type).push({
      customerName: isEmpty(item.customerName) ? null : String(item.customerName).trim(),
      conclusion: normalizeConclusion(item.analysisConclusion),
    });
  });

  const blockKeyMap = { 项目流水分析: 'cashflow_analysis', 项目司法分析: 'judicial_analysis' };
  const sortedTypes = [...order.filter((t) => groups.has(t)), ...extraOrder];

  const blocks = sortedTypes.map((type, idx) => ({
    blockKey: blockKeyMap[type] || `analysis_type_${idx}`,
    label: type,
    displayType: 'analysisList',
    emptyText: '暂无分析结果',
    items: groups.get(type),
  }));

  return {
    moduleIndex: 15,
    moduleName: 'AI分析结果',
    moduleKey: 'analysis_results',
    blocks,
  };
}

const COMPANY_LOAN_COLS = [
  { key: 'borrowingEntity', label: '借款主体', stackSpan: true, mergeSame: true, subKey: 'queryTime' },
  { key: 'principalRole', label: '主体角色', stackSpan: true, mergeSame: true },
  { key: 'leaseLoanTotal', label: '租赁借款余额合计(元)', stackSpan: true, mergeSame: true, align: 'right' },
  { key: 'nonLeaseLoanTotal', label: '非租赁借款余额合计(元)', stackSpan: true, mergeSame: true, align: 'right' },
  { key: 'businessType', label: '业务类型' },
  { key: 'institutionalCode', label: '机构编码' },
  { key: 'creditInstitutional', label: '授信机构' },
  { key: 'loanAmount', label: '借款金额(元)', align: 'right' },
  { key: 'balance', label: '余额(元)', align: 'right' },
  { key: 'startDate', label: '起始日期' },
  { key: 'deadline', label: '截止日期' },
  { key: 'guaranteeMethod', label: '担保方式' },
  { key: 'mortgageType', label: '抵押类型' },
  { key: 'fiveLevel', label: '五级分类' },
  { key: 'curOverdueMonth', label: '当前逾期月份' },
  { key: 'querySource', label: '数据来源' },
  { key: 'repeat', label: '是否与征信重复' },
];

function mapCompanyLoanRow(r) {
  return {
    borrowingEntity: dash(r.borrowingEntity),
    queryTime: trimStr(r.queryTime),
    principalRole: joinRole(r.principalRole),
    leaseLoanTotal: fmtAmount(r.leaseLoanTotal),
    nonLeaseLoanTotal: fmtAmount(r.nonLeaseLoanTotal),
    businessType: dash(r.businessType),
    institutionalCode: dash(r.institutionalCode),
    creditInstitutional: dash(r.creditInstitutional),
    loanAmount: fmtAmount(r.loanAmount),
    balance: fmtAmount(r.balance),
    startDate: dash(r.startDate),
    deadline: dash(r.deadline),
    guaranteeMethod: dash(r.guaranteeMethod),
    mortgageType: dash(r.mortgageType),
    fiveLevel: dash(r.fiveLevel),
    curOverdueMonth: dash(r.curOverdueMonth),
    querySource: dash(r.querySource),
    repeat: dash(r.repeat),
  };
}

function sumUniqueEntityTotals(rows, field) {
  const seen = new Set();
  let sum = 0;
  for (const r of rows) {
    const key = r.borrowingEntity;
    if (seen.has(key)) continue;
    seen.add(key);
    const n = Number(String(r[field]).replace(/,/g, ''));
    if (!Number.isNaN(n)) sum += n;
  }
  return sum ? fmtAmount(sum) : '—';
}

function transformLiabilityAnalysis(data) {
  const la = data.liabilityAnalysis;
  if (!la) return null;

  const ls = la.loanSituation || {};
  const companyRows = (ls.companyLoanList || []).map(mapCompanyLoanRow);
  const ct = ls.companyLoanTotal || {};

  const personRows = (ls.personLoanList || []).map((r) => ({
    borrowingEntity: dash(r.borrowingEntity),
    queryTime: trimStr(r.queryTime),
    businessCategory: dash(r.businessCategory),
    guaranteeMethod: dash(r.guaranteeMethod),
    accountNum: dash(r.accountNum),
    loanAmount: fmtAmount(r.loanAmount),
    balance: fmtAmount(r.balance),
    overdueMonths: dash(r.overdueMonths),
    overdueAccountNum: dash(r.overdueAccountNum),
    maxOverdueMonths: dash(r.maxOverdueMonths),
    maxOverdueAmount: fmtAmount(r.maxOverdueAmount),
    balanceDue: fmtAmount(r.balanceDue),
    queryTimes: dash(r.queryTimes),
    querySource: dash(r.querySource),
  }));

  const pt = ls.personLoanTotal || {};

  const extRows = (la.externalGuaranteeSituationList || []).map((r) => ({
    borrowingEntity: dash(r.borrowingEntity),
    queryTime: trimStr(r.queryTime),
    principalRole: joinRole(r.principalRole),
    guaranteedEntity: dash(r.guaranteedEntity),
    businessType: dash(r.businessType),
    balance: fmtAmount(r.balance),
    startDate: dash(r.startDate),
    deadline: dash(r.deadline),
    fiveLevel: dash(r.fiveLevel),
    curOverdueMonth: dash(r.curOverdueMonth),
    loanExists: dash(r.loanExists),
    querySource: dash(r.querySource),
  }));

  const blocks = [];
  const ut = trimStr(la.updateTime);
  if (ut) {
    blocks.push({ blockKey: 'updateTime', label: '征信、中登数据更新时间', displayType: 'direct', value: ut });
  }

  blocks.push(
    { blockKey: 'loanSituationTitle', label: '借款情况', displayType: 'group', columns: 1, children: [] },
    {
      blockKey: 'companyLoanList',
      label: '企业借款',
      displayType: 'table',
      showIndex: true,
      columns: COMPANY_LOAN_COLS,
      rows: companyRows,
      summary: {
        index: '合计',
        leaseLoanTotal: sumUniqueEntityTotals(companyRows, 'leaseLoanTotal'),
        nonLeaseLoanTotal: sumUniqueEntityTotals(companyRows, 'nonLeaseLoanTotal'),
        loanAmount: fmtAmount(ct.loanAmount),
        balance: fmtAmount(ct.balance),
      },
      emptyText: '暂无企业借款数据',
    },
    {
      blockKey: 'personLoanList',
      label: '个人借款',
      displayType: 'table',
      showIndex: true,
      columns: [
        { key: 'borrowingEntity', label: '借款主体', stackSpan: true, mergeSame: true, subKey: 'queryTime' },
        { key: 'businessCategory', label: '业务大类' },
        { key: 'guaranteeMethod', label: '担保方式' },
        { key: 'accountNum', label: '账户数量' },
        { key: 'loanAmount', label: '借款金额(元)', align: 'right' },
        { key: 'balance', label: '余额(元)', align: 'right' },
        { key: 'overdueMonths', label: '累计逾期月数' },
        { key: 'overdueAccountNum', label: '当前逾期账户数' },
        { key: 'maxOverdueMonths', label: '最长逾期月数' },
        { key: 'maxOverdueAmount', label: '最大逾期金额(元)', align: 'right' },
        { key: 'balanceDue', label: '近一个月到期金额(元)', align: 'right' },
        { key: 'queryTimes', label: '近三个月被其他机构查询贷款审批及担保资格的次数' },
        { key: 'querySource', label: '数据来源' },
      ],
      rows: personRows,
      summary: {
        index: '合计',
        loanAmount: fmtAmount(pt.loanAmount),
        balance: fmtAmount(pt.balance),
        maxOverdueAmount: fmtAmount(pt.maxOverdueAmount),
        balanceDue: fmtAmount(pt.balanceDue),
      },
      emptyText: '暂无个人借款数据',
    },
    {
      blockKey: 'externalGuaranteeSituationList',
      label: '对外担保情况',
      displayType: 'table',
      showIndex: true,
      columns: [
        { key: 'borrowingEntity', label: '担保主体', stackSpan: true, mergeSame: true, subKey: 'queryTime' },
        { key: 'principalRole', label: '主体角色', stackSpan: true, mergeSame: true },
        { key: 'guaranteedEntity', label: '被担保主体' },
        { key: 'businessType', label: '业务类型' },
        { key: 'balance', label: '余额(元)', align: 'right' },
        { key: 'startDate', label: '起始日期' },
        { key: 'deadline', label: '截止日期' },
        { key: 'fiveLevel', label: '五级分类' },
        { key: 'curOverdueMonth', label: '当前逾期月数' },
        { key: 'loanExists', label: '是否存在对应借款' },
        { key: 'querySource', label: '数据来源' },
      ],
      rows: extRows,
      summary: { index: '合计', balance: fmtAmount(la.amountTotal) },
      emptyText: '暂无对外担保数据',
    },
  );

  const stmt = trimStr(la.liabilityStatement);
  if (stmt) {
    blocks.push({ blockKey: 'liabilityStatement', label: '负债说明', displayType: 'longText', value: stmt });
  }

  return {
    moduleIndex: 12,
    moduleName: '刚性负债分析',
    moduleKey: 'liability_analysis',
    blocks,
  };
}

const FIN_INDICATOR_ROWS = [
  { category: '盈利能力', indicator: '销售毛利率(%)', field: 'grossProfitMargin' },
  { category: '盈利能力', indicator: 'ROA 资产净利率(%)', field: 'returnOnAssets' },
  { category: '盈利能力', indicator: 'ROE 净资产收益率(%)', field: 'returnOnEquity' },
  { category: '运营能力', indicator: '存货周转率', field: 'inventoryTurnover' },
  { category: '运营能力', indicator: '应收账款周转率', field: 'accountsReceivableTurnover' },
  { category: '运营能力', indicator: '总资产周转率', field: 'totalAssetTurnover' },
  { category: '偿债能力', indicator: '资产负债率(%)', field: 'debtToAssetRatio' },
  { category: '偿债能力', indicator: '速动比率', field: 'quickRatio' },
  { category: '偿债能力', indicator: '流动比率', field: 'currentRatio' },
  { category: '偿债能力', indicator: '借款依存度(%)', field: 'loanDependence' },
  { category: '偿债能力', indicator: '现金流动负债比率(%)', field: 'cashFlowToCurrentLiabilitiesRatio' },
  { category: '偿债能力', indicator: '销售现金比率(%)', field: 'cashSalesRatio' },
  { category: '偿债能力', indicator: '清算价值比率(%)', field: 'liquidationValueRatio' },
  { category: '发展能力', indicator: '营业增长率(%) [财报数据]', field: 'operatingRevenueGrowthRateFinancial' },
  { category: '发展能力', indicator: '资本积累率(%)', field: 'capitalAccumulationRate' },
  { category: '发展能力', indicator: '总资产增长率(%)', field: 'totalAssetGrowthRate' },
];

function transformKeyIndicators(data) {
  const ki = data.keyIndicators;
  if (!ki) return null;

  const children = [
    { blockKey: 'yoyRevenueGrowthRate', label: '近一年收入同期增长率(%)', displayType: 'direct', value: dash(ki.yoyRevenueGrowthRate) },
    { blockKey: 'generalProvisionRatio', label: '营授比(%)', displayType: 'direct', value: dash(ki.generalProvisionRatio) },
  ];

  (ki.elementList || []).forEach((el, i) => {
    children.push({
      blockKey: `element_${i}`,
      label: dash(el.equivalentName),
      displayType: 'direct',
      value: dash(el.equivalentValue),
    });
  });

  children.push(
    { blockKey: 'lesseeAndGuarantorsMortgageLiabilityRatio', label: '承租人及担保人抵押类负债占比(%)', displayType: 'direct', value: dash(ki.lesseeAndGuarantorsMortgageLiabilityRatio) },
    { blockKey: 'dailyAverageBalanceToIncomeRatio', label: '日均余额收入比(%)', displayType: 'direct', value: dash(ki.dailyAverageBalanceToIncomeRatio) },
    { blockKey: 'externalGuaranteeToIncomeRatio', label: '对外担保收入比(%)', displayType: 'direct', value: dash(ki.externalGuaranteeToIncomeRatio) },
    { blockKey: 'cashCoverageRatio', label: '现金覆盖比(%)', displayType: 'direct', value: dash(ki.cashCoverageRatio) },
  );

  const finList = ki.financialIndicatorList;
  const hasFin = ki.haveData !== false && Array.isArray(finList) && finList.length > 0;
  const yearCols = hasFin
    ? [...finList].sort((a, b) => String(a.year).localeCompare(String(b.year)))
    : [];

  const yearMap = {};
  yearCols.forEach((y) => {
    yearMap[y.year] = y;
  });

  const finColumns = [
    { key: 'category', label: '评估项目', mergeSame: true },
    { key: 'indicator', label: '财务指标' },
    ...yearCols.map((y) => ({
      key: `y_${y.year}`,
      label: y.dataType ? `${y.year} ${y.dataType}` : String(y.year),
    })),
  ];

  const finRows = hasFin
    ? FIN_INDICATOR_ROWS.map(({ category, indicator, field }) => {
        const row = { category, indicator };
        yearCols.forEach((y) => {
          row[`y_${y.year}`] = dash(yearMap[y.year]?.[field]);
        });
        return row;
      })
    : [];

  return {
    moduleIndex: 13,
    moduleName: '重点指标',
    moduleKey: 'key_indicators',
    blocks: [
      { blockKey: 'keyMetrics', displayType: 'group', columns: 3, children },
      {
        blockKey: 'financialIndicatorList',
        label: '承租人近3年主要财务指标',
        displayType: 'table',
        showIndex: false,
        columns: finColumns,
        rows: finRows,
        emptyText: '暂无财务指标数据',
      },
    ],
  };
}

function transformRevenueAnalysis(data) {
  const ra = data.revenueAnalysis;
  if (!ra) return null;

  const income = ra.incomeAnalysis || {};
  const asset = ra.assetSize || {};
  const sale = ra.proAndSaleSituation || {};
  const repay = income.repayAbilityAnalysis || {};

  const roleCol = { key: 'customerRole', label: '主体角色', cellType: 'roleTag' };
  const blocks = [];

  blocks.push({
    blockKey: 'subjectInfoList',
    label: '主体列表',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'subjectName', label: '主体名称' },
      roleCol,
    ],
    rows: (ra.subjectInfoList || []).map((s) => ({
      subjectName: dash(s.subjectName),
      customerRole: s.customerRole || [],
    })),
    emptyText: '暂无主体数据',
  });

  blocks.push({ blockKey: 'assetSizeTitle', label: '资产规模', displayType: 'group', columns: 1, children: [] });

  blocks.push({
    blockKey: 'factoryList',
    label: '厂房情况',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'subjectName', label: '主体名称', stackSpan: true },
      { ...roleCol, stackSpan: true },
      { key: 'factoryType', label: '厂房类型' },
      { key: 'factoryArea', label: '厂房面积(平方米)' },
      { key: 'factoryRent', label: '厂房年租金(万)' },
      { key: 'leaseEndDate', label: '租赁到期日' },
      { key: 'haveLoan', label: '当前是否有欠租' },
      { key: 'landArea', label: '土地面积(平方米)' },
      { key: 'landValue', label: '土地价值(万)' },
      { key: 'address', label: '所在位置' },
      { key: 'haveDocument', label: '是否有不动产权证' },
      { key: 'landMortgaged', label: '土地厂房是否抵押' },
    ],
    rows: (asset.factoryList || []).map((f) => ({
      subjectName: dash(f.subjectName),
      customerRole: f.customerRole || [],
      factoryType: factoryTypeLabel(f.factoryType),
      factoryArea: dash(f.factoryArea),
      factoryRent: dash(f.factoryRent),
      leaseEndDate: dash(f.leaseEndDate),
      haveLoan: dash(f.haveLoan),
      landArea: dash(f.landArea),
      landValue: dash(f.landValue),
      address: dash(f.address),
      haveDocument: dash(f.haveDocument),
      landMortgaged: dash(f.landMortgaged),
    })),
    emptyText: '暂无厂房数据',
  });

  if (!isEmpty(asset.factoryDesc)) {
    blocks.push({ blockKey: 'factoryDesc', label: '厂房情况说明', displayType: 'longText', value: asset.factoryDesc });
  }

  blocks.push({
    blockKey: 'mainEquipmentList',
    label: '主要设备情况',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'subjectName', label: '主体名称' },
      roleCol,
      { key: 'equipmentDesc', label: '数量、名称及品牌' },
      { key: 'originalValue', label: '原值(元)', align: 'right' },
    ],
    rows: (asset.mainEquipmentList || []).map((e) => ({
      subjectName: dash(e.subjectName),
      customerRole: e.customerRole || [],
      equipmentDesc: dash(e.equipmentDesc ?? e.equipmentName ?? e.nameBrand),
      originalValue: dash(e.originalValue ?? e.originalCost),
    })),
    emptyText: '暂无数据',
  });

  blocks.push({
    blockKey: 'ratioList',
    label: '设备稼动率情况',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'subjectName', label: '主体名称' },
      roleCol,
      { key: 'ratio', label: '当前设备稼动率(%)', align: 'right' },
    ],
    rows: (asset.ratioList || []).map((r) => ({
      subjectName: dash(r.subjectName),
      customerRole: r.customerRole || [],
      ratio: dash(r.ratio),
    })),
    emptyText: '暂无稼动率数据',
  });

  if (!isEmpty(asset.ratioDesc)) {
    blocks.push({ blockKey: 'ratioDesc', label: '稼动率说明', displayType: 'longText', value: asset.ratioDesc });
  }

  blocks.push({ blockKey: 'proAndSaleTitle', label: '生产销售情况分析', displayType: 'group', columns: 1, children: [] });

  const productRows = [];
  for (const group of groupBySubject(sale.mainProductList || [])) {
    const first = group.items[0];
    group.items.forEach((p) => {
      productRows.push({
        subjectName: dash(p.subjectName),
        customerRole: p.customerRole || [],
        productName: dash(p.productName),
        saleNoteAmount: dash(p.saleNoteAmount),
        ratio: dash(p.ratio),
        source: dash(p.source),
      });
    });
    productRows.push({
      subjectName: dash(first.subjectName),
      customerRole: first.customerRole || [],
      productName: '合计',
      saleNoteAmount: sumDecimal2(group.items.map((x) => x.saleNoteAmount)),
      ratio: sumDecimal(group.items.map((x) => x.ratio)),
      source: '—',
    });
  }

  blocks.push({
    blockKey: 'mainProductList',
    label: '近12个月主营产品',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'subjectName', label: '主体名称', mergeSame: true },
      { ...roleCol, mergeSame: true },
      { key: 'productName', label: '产品名称' },
      { key: 'saleNoteAmount', label: '开票销售额(万)', align: 'right' },
      { key: 'ratio', label: '占比(%)', align: 'right' },
      { key: 'source', label: '来源' },
    ],
    rows: productRows,
    emptyText: '暂无主营产品数据',
  });

  if (!isEmpty(sale.desc)) {
    blocks.push({
      blockKey: 'materialProcessDesc',
      label: '主要原材料、生产工艺流程、产品处于行业地位分析等说明',
      displayType: 'longText',
      value: sale.desc,
    });
  }

  const customerRows = [];
  for (const group of groupBySubject(sale.downstreamCustomerList || [])) {
    const first = group.items[0];
    group.items.forEach((c) => {
      customerRows.push({
        subjectName: dash(c.subjectName),
        customerRole: c.customerRole || [],
        customerName: dash(c.customerName),
        saleAmount: dash(c.saleAmount),
        ratio: dash(c.ratio),
        settlementCycle: dash(c.settlementCycle),
        paymentMethod: joinPaymentMethod(c.paymentMethod),
        cooperateDuration: dash(c.cooperateDuration),
        source: dash(c.source),
      });
    });
    customerRows.push({
      subjectName: dash(first.subjectName),
      customerRole: first.customerRole || [],
      customerName: '合计',
      saleAmount: sumDecimal2(group.items.map((x) => x.saleAmount)),
      ratio: sumDecimal(group.items.map((x) => x.ratio)),
      settlementCycle: '—',
      paymentMethod: '—',
      cooperateDuration: '—',
      source: '—',
    });
  }

  blocks.push({
    blockKey: 'downstreamCustomerList',
    label: '主要下游客户',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'subjectName', label: '主体名称', stackSpan: true, mergeSame: true },
      { ...roleCol, stackSpan: true, mergeSame: true },
      { key: 'customerName', label: '客户名称' },
      { key: 'saleAmount', label: '开票销售额(万)', align: 'right' },
      { key: 'ratio', label: '占比(%)', align: 'right' },
      { key: 'settlementCycle', label: '结算周期' },
      { key: 'paymentMethod', label: '结算方式' },
      { key: 'cooperateDuration', label: '合作时长(年)', align: 'right' },
      { key: 'source', label: '来源' },
    ],
    rows: customerRows,
    emptyText: '暂无下游客户数据',
  });

  if (!isEmpty(sale.downstreamCustomerDesc)) {
    blocks.push({
      blockKey: 'downstreamCustomerDesc',
      label: '下游客户司法诉讼情况概述',
      displayType: 'longText',
      value: sale.downstreamCustomerDesc,
    });
  }

  blocks.push({ blockKey: 'incomeAnalysisTitle', label: '收入分析', displayType: 'group', columns: 1, children: [] });

  if (!isEmpty(sale.productionAndSaleSituationDesc)) {
    blocks.push({
      blockKey: 'productionAndSaleSituationDesc',
      label: '生产销售情况说明',
      displayType: 'longText',
      value: sale.productionAndSaleSituationDesc,
    });
  }

  const oiaList = income.operatingIncomeAnalysis || [];
  const intervals = [];
  const intervalSeen = new Set();
  [...oiaList].sort((a, b) => (a.serialNumber ?? 0) - (b.serialNumber ?? 0)).forEach((item) => {
    if (!intervalSeen.has(item.timeInterval)) {
      intervalSeen.add(item.timeInterval);
      intervals.push(item.timeInterval);
    }
  });

  const oiaColumns = [
    { key: 'subjectName', label: '主体名称', mergeSame: true },
    { ...roleCol, mergeSame: true },
    { key: 'type', label: '类型' },
    ...intervals.map((t) => ({ key: `period_${t}`, label: t, align: 'right' })),
  ];

  const entityNos = [...new Set(oiaList.map((x) => x.customerNo))];
  const oiaRows = [];
  for (const no of entityNos) {
    const sample = oiaList.find((x) => x.customerNo === no);
    const byInterval = Object.fromEntries(
      oiaList.filter((x) => x.customerNo === no).map((x) => [x.timeInterval, x]),
    );
    const invoicingRow = {
      subjectName: dash(sample?.customerName),
      customerRole: sample?.customerRole || [],
      type: '开票收入(万)',
    };
    const nonInvoicingRow = {
      subjectName: dash(sample?.customerName),
      customerRole: sample?.customerRole || [],
      type: '不开票收入(万)',
    };
    intervals.forEach((t) => {
      invoicingRow[`period_${t}`] = dash(byInterval[t]?.invoicingRevenue);
      nonInvoicingRow[`period_${t}`] = dash(byInterval[t]?.nonInvoicingRevenue);
    });
    oiaRows.push(invoicingRow, nonInvoicingRow);
  }

  const totalByInterval = Object.fromEntries(
    (income.operatingIncomeAnalysisTotal || []).map((x) => [x.timeInterval, x]),
  );
  for (const label of [
    { name: '合计(万)', field: 'invoicingRevenue' },
    { name: '关联交易(万)', field: 'relatedTransaction' },
    { name: '剔除关联交易后合计(万)', field: 'excludeRelatedTransaction' },
  ]) {
    const row = { _summary: true, subjectName: label.name };
    intervals.forEach((t) => {
      row[`period_${t}`] = dash(totalByInterval[t]?.[label.field]);
    });
    oiaRows.push(row);
  }

  blocks.push({
    blockKey: 'operatingIncomeAnalysis',
    label: '营业收入分析',
    displayType: 'table',
    showIndex: false,
    columns: oiaColumns,
    rows: oiaRows,
    emptyText: '暂无营业收入分析数据',
  });

  if (!isEmpty(income.operatingIncomeDesc)) {
    blocks.push({
      blockKey: 'operatingIncomeDesc',
      label: '营业收入分析说明',
      displayType: 'longText',
      value: income.operatingIncomeDesc,
    });
  }

  if (!isEmpty(income.ratio)) {
    blocks.push({
      blockKey: 'verifiableRatio',
      label: '可验证回款比例(%)',
      displayType: 'direct',
      value: income.ratio,
    });
  }

  const verifyList = income.operatingIncomeVerificationList || [];
  const months = [];
  const monthSeen = new Set();
  [...verifyList].sort((a, b) => (a.serialNumber ?? 0) - (b.serialNumber ?? 0)).forEach((item) => {
    if (!monthSeen.has(item.timeInterval)) {
      monthSeen.add(item.timeInterval);
      months.push(item.timeInterval);
    }
  });

  const verifyTypes = [
    { label: '纳税申报收入(万)', field: 'taxDeclareIncome' },
    { label: '银行流水(万)(剔除关联交易)', field: 'bankStatement', altField: 'bankStatementFromJz' },
    { label: '银行承兑(万)(剔除关联交易)', field: 'bankAcceptance' },
    { label: '纳税申报采购(万)', field: 'taxableIncome' },
    { label: '电费(万)', field: 'electricityFee' },
    { label: '工资总额(万)', field: 'wage' },
  ];

  const verifyColumns = [
    { key: 'subjectName', label: '主体名称', stackSpan: true, mergeSame: true },
    { ...roleCol, stackSpan: true, mergeSame: true },
    { key: 'type', label: '类型', stackSpan: true },
    ...months.map((m) => ({ key: `month_${m}`, label: m, align: 'right' })),
    { key: 'total', label: '合计', align: 'right' },
    { key: 'average', label: '均值', align: 'right' },
  ];

  const verifyEntityNos = [...new Set(verifyList.map((x) => x.customerNo))];
  const verifyRows = [];
  for (const no of verifyEntityNos) {
    const sample = verifyList.find((x) => x.customerNo === no);
    const byMonth = Object.fromEntries(
      verifyList.filter((x) => x.customerNo === no).map((x) => [x.timeInterval, x]),
    );
    for (const vt of verifyTypes) {
      const row = {
        subjectName: dash(sample?.customerName),
        customerRole: sample?.customerRole || [],
        type: vt.label,
      };
      const monthVals = [];
      months.forEach((m) => {
        const rec = byMonth[m];
        let val = rec?.[vt.field];
        let highlight = false;
        if (vt.altField && !isEmpty(rec?.[vt.altField])) {
          if (String(rec[vt.altField]) !== String(rec?.[vt.field] ?? '')) {
            val = rec[vt.altField];
            highlight = true;
          }
        }
        row[`month_${m}`] = highlight ? { value: dash(val), highlight: true } : dash(val);
        if (!isEmpty(val)) monthVals.push(val);
      });
      row.total = sumDecimal2(monthVals);
      row.average = avgDecimal(monthVals);
      verifyRows.push(row);
    }
  }

  const flowTotalByMonth = Object.fromEntries(
    (income.operatingIncomeVerificationFlowTotalList || []).map((x) => [x.timeInterval, x]),
  );
  for (const label of [
    { name: '流水与承兑合计(万)(剔除关联交易)', field: 'totalFlow' },
    { name: '纳税申报收入关联交易(万)', field: 'relatedTransaction' },
    { name: '剔除关联交易后纳税申报收入合计(万)', field: 'excludeRelatedTransaction' },
  ]) {
    const row = { _summary: true, subjectName: label.name };
    const monthVals = [];
    months.forEach((m) => {
      const val = flowTotalByMonth[m]?.[label.field];
      row[`month_${m}`] = dash(val);
      if (!isEmpty(val)) monthVals.push(val);
    });
    row.total = sumDecimal2(monthVals);
    row.average = avgDecimal(monthVals);
    verifyRows.push(row);
  }

  blocks.push({
    blockKey: 'operatingIncomeVerification',
    label: '营业收入核验',
    displayType: 'table',
    showIndex: false,
    columns: verifyColumns,
    rows: verifyRows,
    emptyText: '暂无营业收入核验数据',
  });

  if (!isEmpty(income.operatingIncomeVerifyDesc)) {
    blocks.push({
      blockKey: 'operatingIncomeVerifyDesc',
      label: '营业收入核验说明',
      displayType: 'longText',
      value: income.operatingIncomeVerifyDesc,
    });
  }

  blocks.push({ blockKey: 'repayAbilityTitle', label: '还款能力分析', displayType: 'group', columns: 1, children: [] });

  blocks.push({
    blockKey: 'repayBaseInfoList',
    label: '基础信息',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'subjectName', label: '主体名称' },
      roleCol,
      { key: 'runningIncome', label: '流水收入(万)', align: 'right' },
      { key: 'invoicingRevenue', label: '开票收入(万)', align: 'right' },
      { key: 'dailyAverageBalance', label: '日均余额(万)', align: 'right' },
    ],
    rows: (repay.repayBaseInfoList || []).map((r) => ({
      subjectName: dash(r.subjectName),
      customerRole: r.customerRole || [],
      runningIncome: dash(r.runningIncome),
      invoicingRevenue: dash(r.invoicingRevenue),
      dailyAverageBalance: dash(r.dailyAverageBalance ?? r.dailyAverageBalanceFromJz),
    })),
    emptyText: '暂无基础信息',
  });

  blocks.push({
    blockKey: 'revenueExpenseDetails',
    label: '收支明细',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'subjectName', label: '主体名称', stackSpan: true },
      { ...roleCol, stackSpan: true },
      { key: 'rawMaterialCost', label: '原材料成本(万)', align: 'right' },
      { key: 'personnelSalary', label: '人员工资(万)', align: 'right' },
      { key: 'rentalExpenses', label: '租赁费用(如有)(万)', align: 'right' },
      { key: 'hydroelectricProperty', label: '水电物业(万)', align: 'right' },
      { key: 'outwardProcessing', label: '外发加工(如有)(万)', align: 'right' },
      { key: 'averageRepayment', label: '实际控制人月还款(万)', align: 'right' },
      { key: 'loanInterest', label: '银行贷款利息(万)', align: 'right' },
      { key: 'financingLeaseRent', label: '融资租赁租金(万)', align: 'right' },
      { key: 'otherCost', label: '其他费用(万)', align: 'right' },
      { key: 'amountTotal', label: '支出合计(万)', align: 'right' },
      { key: 'monthlyBalance', label: '月结余(万)', align: 'right' },
    ],
    rows: (repay.revenueExpenseDetails || []).map((r) => ({
      subjectName: dash(r.subjectName),
      customerRole: r.customerRole || [],
      rawMaterialCost: dash(r.rawMaterialCost),
      personnelSalary: dash(r.personnelSalary ?? r.personnelSalaryFromJz),
      rentalExpenses: dash(r.rentalExpenses ?? r.rentalExpensesFromJz),
      hydroelectricProperty: dash(r.hydroelectricProperty ?? r.hydroelectricPropertyFromJz),
      outwardProcessing: dash(r.outwardProcessing),
      averageRepayment: dash(r.averageRepayment),
      loanInterest: dash(r.loanInterest),
      financingLeaseRent: dash(r.financingLeaseRent),
      otherCost: dash(r.otherCost),
      amountTotal: dash(r.amountTotal),
      monthlyBalance: dash(r.monthlyBalance),
    })),
    emptyText: '暂无收支明细',
  });

  const indexByNo = new Map();
  const idxRaw = repay.repayAbilityIndex;
  if (Array.isArray(idxRaw)) idxRaw.forEach((x) => indexByNo.set(x.customerNo, x));
  else if (idxRaw) indexByNo.set(idxRaw.customerNo, idxRaw);

  const indexRows = (repay.repayBaseInfoList || []).map((s) => {
    const idx = indexByNo.get(s.customerNo);
    if (idx) {
      return {
        subjectName: dash(s.subjectName),
        customerRole: s.customerRole || [],
        maxRent: dash(idx.maxRent),
        rate: dash(idx.rate),
        averageDailyBalanceRatio: dash(idx.averageDailyBalanceRatio),
        averageDailyBalanceRate: dash(idx.averageDailyBalanceRate),
      };
    }
    const d = (repay.revenueExpenseDetails || []).find((x) => x.customerNo === s.customerNo);
    const maxRentW = d?.maxRent ? (Number(d.maxRent) / 10000).toFixed(2) : null;
    const maxRentN = maxRentW ? Number(maxRentW) : 0;
    const monthly = d?.monthlyBalance != null ? Number(d.monthlyBalance) : null;
    const daily = d?.dailyAverageBalance != null ? Number(d.dailyAverageBalance) : null;
    const running = s.runningIncome != null ? Number(s.runningIncome) : null;
    return {
      subjectName: dash(s.subjectName),
      customerRole: s.customerRole || [],
      maxRent: dash(maxRentW),
      rate: maxRentN && monthly != null ? ((monthly / maxRentN) * 100).toFixed(4) : '—',
      averageDailyBalanceRatio: maxRentN && daily != null ? ((daily / maxRentN) * 100).toFixed(4) : '—',
      averageDailyBalanceRate: running && daily != null ? ((daily / running) * 100).toFixed(4) : '—',
    };
  });

  blocks.push({
    blockKey: 'repayAbilityIndexList',
    label: '还款能力指标',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'subjectName', label: '主体名称' },
      roleCol,
      { key: 'maxRent', label: '最大一期租金(万)', align: 'right' },
      { key: 'rate', label: '月结余/最大一期租金(%)', align: 'right' },
      { key: 'averageDailyBalanceRatio', label: '日均余额/最大一期租金(%)', align: 'right' },
      { key: 'averageDailyBalanceRate', label: '日均余额/流水收入(%)', align: 'right' },
    ],
    rows: indexRows,
    emptyText: '暂无还款能力指标',
  });

  if (!isEmpty(income.businessDataAnalysisDesc)) {
    blocks.push({
      blockKey: 'businessDataAnalysisDesc',
      label: '经营数据分析说明',
      displayType: 'longText',
      value: income.businessDataAnalysisDesc,
    });
  }

  return {
    moduleIndex: 11,
    moduleName: '经营数据分析',
    moduleKey: 'revenue_analysis',
    blocks,
  };
}

function transformLesseeBaseInfo(data) {
  const info = data.lesseeBaseInfo?.companyPublicInfo;
  if (!info) return null;

  const base = info.baseInfo || {};
  const judicial = info.judicialLitigationInfo || {};
  const blocks = [];

  blocks.push({
    blockKey: 'baseInfo',
    label: '基本信息',
    displayType: 'group',
    columns: 4,
    children: [
      { blockKey: 'customerName', label: '企业名称', displayType: 'direct', value: dash(base.customerName) },
      { blockKey: 'crdntlsCode', label: '统一社会信用代码', displayType: 'direct', value: dash(base.crdntlsCode) },
      { blockKey: 'legalRepresentative', label: '法定代表人', displayType: 'direct', value: dash(base.legalRepresentativeCustomerName) },
      { blockKey: 'actControlsName', label: '实际控制人', displayType: 'direct', value: dash(base.actControlsName) },
      { blockKey: 'estblshDate', label: '成立时间', displayType: 'direct', value: dash(base.estblshDate) },
      { blockKey: 'rgstrdCapital', label: '注册资本(万元)', displayType: 'direct', value: fmtAmount(base.rgstrdCapital) },
      { blockKey: 'industrySortLittle', label: '行业小类', displayType: 'direct', value: dash(base.pkIndustrySortLittle?.name) },
      { blockKey: 'employeeNum', label: '从业人数', displayType: 'direct', value: dash(base.employeeNum) },
      { blockKey: 'rgstrdAddress', label: '注册地址', displayType: 'direct', value: dash(base.rgstrdAddress), fullWidth: true },
    ],
  });

  blocks.push({
    blockKey: 'industryLicenseList',
    label: '行业许可证',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'specCrdntlsName', label: '证件名称' },
      { key: 'specCrdntlsCode', label: '编号' },
      { key: 'expirationDate', label: '期限' },
    ],
    rows: (info.industryLicenseList || []).map((item) => ({
      specCrdntlsName: dash(item.specCrdntlsName),
      specCrdntlsCode: dash(item.specCrdntlsCode),
      expirationDate: dash(item.expirationDate),
    })),
    emptyText: '暂无行业许可证数据',
  });

  if (!isEmpty(base.mainBusiness)) {
    blocks.push({
      blockKey: 'mainBusiness',
      label: '主营业务',
      displayType: 'longText',
      value: base.mainBusiness,
    });
  }

  if (!isEmpty(base.companyEvolution)) {
    blocks.push({
      blockKey: 'companyEvolution',
      label: '公司沿革',
      displayType: 'longText',
      value: base.companyEvolution,
    });
  }

  const shareholderTotal = info.shareholderTotal || {};
  blocks.push({
    blockKey: 'shareholderList',
    label: '股权结构',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'shareholderName', label: '股东名称' },
      { key: 'shareholderCapitalAmount', label: '出资额(万元)', align: 'right' },
      { key: 'holdStockRatio', label: '占比(%)', align: 'right' },
    ],
    rows: (info.shareholderList || []).map((item) => ({
      shareholderName: dash(item.shareholderName),
      shareholderCapitalAmount: fmtAmount(item.shareholderCapitalAmount),
      holdStockRatio: dash(item.holdStockRatio),
    })),
    summary: (info.shareholderList || []).length
      ? {
          index: '合计',
          shareholderCapitalAmount: fmtAmount(shareholderTotal.shareholderCapitalAmount),
          holdStockRatio: dash(shareholderTotal.holdStockRatio),
        }
      : undefined,
    emptyText: '暂无股权结构数据',
  });

  if (!isEmpty(info.controllerIntroduction)) {
    blocks.push({
      blockKey: 'controllerIntroduction',
      label: '实控人及股东情况介绍',
      displayType: 'longText',
      value: info.controllerIntroduction,
    });
  }

  const litigationCards = [];
  for (const item of judicial.caseTypeHighRiskList || []) {
    const num = Number(item.caseNum);
    if (num > 0) {
      litigationCards.push({ caseType: dash(item.caseType), caseNum: num, tone: 'highRisk' });
    }
  }
  for (const item of judicial.caseTypeCommonList || []) {
    const num = Number(item.caseNum);
    if (num > 0) {
      litigationCards.push({ caseType: dash(item.caseType), caseNum: num, tone: 'common' });
    }
  }

  blocks.push({
    blockKey: 'judicialLitigationInfo',
    label: '司法诉讼信息',
    displayType: 'litigationCards',
    updateTime: dash(judicial.updateTime) !== '—' ? judicial.updateTime : null,
    cards: litigationCards,
    emptyText: '客户暂无司法诉讼数据',
  });

  if (!isEmpty(judicial.judicialLitigationInfoDesc)) {
    blocks.push({
      blockKey: 'judicialLitigationInfoDesc',
      label: '司法诉讼信息说明',
      displayType: 'longText',
      value: judicial.judicialLitigationInfoDesc,
    });
  }

  return {
    moduleIndex: 8,
    moduleName: '承租人基本信息',
    moduleKey: 'lessee_base_info',
    blocks,
  };
}

/** 小企业附件分区结构（L1 写死，不从入参读取） */
const ATTACHMENT_SECTION_DEFS = [
  {
    modelName: '基础材料',
    documentDir: ['营业执照', '自然人身份证明', '公司章程', '开户许可证', '开票资料'],
  },
  {
    modelName: '征信材料',
    documentDir: ['征信附件', '征信授权文件'],
  },
  {
    modelName: '资质材料',
    documentDir: ['厂房租赁合同', '不动产权证书', '水电费缴纳凭证', '特殊行业资质证明', '环评批复', '房产证'],
  },
  {
    modelName: '租赁物材料',
    documentDir: [
      '设备销售合同',
      '代理进口合同',
      '租赁物发票',
      '营业执照（供应商）',
      '身份证明（供应商法人代表）',
      '开户许可证（供应商）',
      '开票资料（供应商）',
    ],
  },
  {
    modelName: '财税报表',
    documentDir: ['财务报表', '纳税申报表'],
  },
  {
    modelName: '银行流水',
    documentDir: ['银行流水', '银行流水分析报告'],
  },
  {
    modelName: '补充材料',
    documentDir: [
      '政策文件',
      '突破定价申请材料',
      '访厂照片',
      '订单信息',
      '补充材料',
      '其它',
      '客户风险评估报告',
    ],
  },
  {
    modelName: '中登报送',
    documentDir: ['报送中登'],
  },
  {
    modelName: '尽调报告',
    documentDir: ['尽职调查报告'],
  },
];

/** 资产负债表固定行序 */
const BALANCE_SHEET_ROWS = [
  { accountName: '一、资产合计', key: 'totalAssets', rowLevel: 1 },
  { accountName: '1、流动资产合计', key: 'totalCurrentAssets', rowLevel: 2 },
  { accountName: '货币资金', key: 'monetaryFunds', rowLevel: 3 },
  { accountName: '短期投资', key: 'shortInvestments', rowLevel: 3 },
  { accountName: '应收票据', key: 'notesReceivable', rowLevel: 3 },
  { accountName: '应收账款', key: 'accountsReceivable', rowLevel: 3 },
  { accountName: '预付款项', key: 'prepayments', rowLevel: 3 },
  { accountName: '应收股利', key: 'dividentsReceivable', rowLevel: 3 },
  { accountName: '应收利息', key: 'interestReceivable', rowLevel: 3 },
  { accountName: '其他应收款', key: 'otherReceivables', rowLevel: 3 },
  { accountName: '存货', key: 'inventories', rowLevel: 3 },
  { accountName: '其他流动资产', key: 'otherCurrentAssets', rowLevel: 3 },
  { accountName: '2、非流动资产合计', key: 'totalNoncurrentAssets', rowLevel: 2 },
  { accountName: '长期债权投资', key: 'longDebtInvestments', rowLevel: 3 },
  { accountName: '长期股权投资', key: 'longEquityInvestments', rowLevel: 3 },
  { accountName: '固定资产原价', key: 'originalValueFixedAssets', rowLevel: 3 },
  { accountName: '减：累计折旧', key: 'accumulateDepreciation', rowLevel: 3 },
  { accountName: '固定资产账面价值', key: 'bookValueOfFixedAssets', rowLevel: 3 },
  { accountName: '在建工程', key: 'constructionProjects', rowLevel: 3 },
  { accountName: '生产性生物资产', key: 'producedBiologicalAssets', rowLevel: 3 },
  { accountName: '无形资产', key: 'intangibleAssets', rowLevel: 3 },
  { accountName: '长期待摊费用', key: 'longAmortisedExpenses', rowLevel: 3 },
  { accountName: '使用权资产', key: 'rightOfUseAsset', rowLevel: 3 },
  { accountName: '其他非流动资产', key: 'otherNoncurrentAssets', rowLevel: 3 },
  { accountName: '二、负债合计', key: 'totalLiabilities', rowLevel: 1 },
  { accountName: '1、流动负债合计', key: 'totalCurrentLiabilities', rowLevel: 2 },
  { accountName: '短期借款', key: 'shortLoans', rowLevel: 3 },
  { accountName: '应付票据', key: 'notesPayable', rowLevel: 3 },
  { accountName: '应付账款', key: 'accountsPayable', rowLevel: 3 },
  { accountName: '预收账款', key: 'accountsReceivedAdvance', rowLevel: 3 },
  { accountName: '应付职工薪酬', key: 'wagesPayable', rowLevel: 3 },
  { accountName: '应交税费', key: 'taxesPayable', rowLevel: 3 },
  { accountName: '应付利息', key: 'interestPayable', rowLevel: 3 },
  { accountName: '应付利润', key: 'profitPayable', rowLevel: 3 },
  { accountName: '其他应付款', key: 'otherPayables', rowLevel: 3 },
  { accountName: '其他流动负债', key: 'otherCurrentLiabilities', rowLevel: 3 },
  { accountName: '2、非流动负债合计', key: 'totalNoncurrentLiabilities', rowLevel: 2 },
  { accountName: '长期借款', key: 'longLoans', rowLevel: 3 },
  { accountName: '长期应付款', key: 'longPayables', rowLevel: 3 },
  { accountName: '递延收益', key: 'deferredIncome', rowLevel: 3 },
  { accountName: '租赁负债', key: 'leaseLiability', rowLevel: 3 },
  { accountName: '其他非流动负债', key: 'otherNoncurrentLiabilities', rowLevel: 3 },
  { accountName: '三、所有者权益(或股东权益)合计', key: 'totalOwnersEquity', rowLevel: 1 },
  { accountName: '实收资本(或股本)', key: 'paidInCapital', rowLevel: 3 },
  { accountName: '资本公积', key: 'capitalSurplus', rowLevel: 3 },
  { accountName: '盈余公积', key: 'surplusReserves', rowLevel: 3 },
  { accountName: '未分配利润', key: 'undistributedProfit', rowLevel: 3 },
];

/** 利润表固定行序 */
const PROFIT_SHEET_ROWS = [
  { accountName: '一、营业收入', key: 'revenueOperations', rowLevel: 1 },
  { accountName: '减：营业成本', key: 'costBusiness', rowLevel: 3 },
  { accountName: '营业税金及附加', key: 'mainBusinessTaxesSurcharges', rowLevel: 3 },
  { accountName: '销售费用', key: 'sellingExpenses', rowLevel: 3 },
  { accountName: '管理费用', key: 'administrativeExpenses', rowLevel: 3 },
  { accountName: '财务费用', key: 'financeCosts', rowLevel: 3 },
  { accountName: '二、营业利润', key: 'operatingProfit', rowLevel: 1 },
  { accountName: '加：营业外收入', key: 'nonoperatingIncome', rowLevel: 3 },
  { accountName: '减：营业外支出', key: 'nonoperatingExpenses', rowLevel: 3 },
  { accountName: '三、利润总额', key: 'totalProfit', rowLevel: 1 },
  { accountName: '减：所得税费用', key: 'incomeTaxExpense', rowLevel: 3 },
  { accountName: '四、净利润', key: 'netProfit', rowLevel: 1 },
];

function fmtFsAmount(v) {
  if (v === null || v === undefined || (typeof v === 'string' && v.trim() === '')) return '—';
  const n = Number(String(v).replace(/,/g, ''));
  if (Number.isNaN(n)) return dash(v);
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildFsTableBlock(blockKey, label, sheetList, rowDefs) {
  const list = Array.isArray(sheetList) ? sheetList : [];
  const periods = [];
  const byPeriod = {};
  for (const item of list) {
    if (!item?.period || byPeriod[item.period]) continue;
    byPeriod[item.period] = item;
    periods.push({ period: item.period, dataType: dash(item.dataType) });
  }

  const rows = rowDefs.map((def) => {
    const values = {};
    for (const p of periods) {
      values[p.period] = fmtFsAmount(byPeriod[p.period]?.[def.key]);
    }
    return {
      accountName: def.accountName,
      rowLevel: def.rowLevel,
      values,
    };
  });

  return {
    blockKey,
    label,
    displayType: 'financialStatementTable',
    unit: '单位：元',
    periods,
    rows: list.length ? rows : [],
    emptyText: '暂无数据',
  };
}

function transformKeyAccountFinancials(data) {
  const root = data.financialStatementsOfKeyAccounts;
  if (!root) return null;

  const list = Array.isArray(root.financialStatementsOfKeyAccountList)
    ? root.financialStatementsOfKeyAccountList
    : [];
  const blocks = [];

  for (const item of list) {
    const no = item.customerNo || item.creditCode || blocks.length;
    blocks.push({
      blockKey: `subject_${no}_header`,
      displayType: 'fsSubjectHeader',
      title: dash(item.sheetName),
      dataSource: dash(item.fsDataSourceType) !== '—' ? item.fsDataSourceType : null,
    });
    blocks.push(buildFsTableBlock(
      `subject_${no}_balanceSheet`,
      '资产负债表',
      item.balanceSheet,
      BALANCE_SHEET_ROWS,
    ));
    blocks.push(buildFsTableBlock(
      `subject_${no}_profitSheet`,
      '利润表',
      item.profitSheet,
      PROFIT_SHEET_ROWS,
    ));
  }

  if (!isEmpty(root.financialNotes)) {
    blocks.push({
      blockKey: 'financialNotes',
      label: '财务说明',
      displayType: 'longText',
      value: root.financialNotes,
    });
  }

  if (!blocks.length) {
    return {
      moduleIndex: 14,
      moduleName: '重点科目财务报表',
      moduleKey: 'key_account_financials',
      blocks: [{
        blockKey: 'empty',
        displayType: 'empty',
        label: '重点科目财务报表',
        emptyText: '暂无数据',
      }],
    };
  }

  return {
    moduleIndex: 14,
    moduleName: '重点科目财务报表',
    moduleKey: 'key_account_financials',
    blocks,
  };
}

function transformAttachments(data) {
  const list = Array.isArray(data.attachmentList) ? data.attachmentList : [];
  const sections = ATTACHMENT_SECTION_DEFS.map((def) => {
    const typeSet = new Set(def.documentDir);
    const files = list
      .filter((item) => typeSet.has(item?.documentDir?.name))
      .map((item) => ({
        fileName: dash(item.fileName),
        documentType: dash(item.documentDir?.name),
        uploadTime: dash(item.uploadTime),
      }));
    return {
      modelName: def.modelName,
      documentDirDesc: def.documentDir.join('，'),
      files,
    };
  });

  return {
    moduleIndex: 16,
    moduleName: '附件信息',
    moduleKey: 'attachments',
    blocks: [
      {
        blockKey: 'attachmentSections',
        displayType: 'attachmentSections',
        sections,
      },
    ],
  };
}


function transformProjectChange(data) {
  const pc = data.projectChange;
  if (pc == null) return null;

  return {
    moduleIndex: 1,
    moduleName: '项目变更信息',
    moduleKey: 'project_change',
    blocks: [
      {
        blockKey: 'changeReason',
        label: '审批变更原因',
        displayType: 'longText',
        value: dash(pc.changeReason),
      },
      {
        blockKey: 'changeType',
        label: '审批变更类型',
        displayType: 'direct',
        value: dash(pc.changeType),
      },
    ],
  };
}


function buildLitigationCardsFromInfo(judicial) {
  const j = judicial || {};
  const cards = [];
  for (const item of j.caseTypeHighRiskList || []) {
    const num = Number(item.caseNum);
    if (num > 0) cards.push({ caseType: dash(item.caseType), caseNum: num, tone: 'highRisk' });
  }
  for (const item of j.caseTypeCommonList || []) {
    const num = Number(item.caseNum);
    if (num > 0) cards.push({ caseType: dash(item.caseType), caseNum: num, tone: 'common' });
  }
  return {
    updateTime: !isEmpty(j.updateTime) ? String(j.updateTime).trim() : null,
    cards,
    desc: !isEmpty(j.judicialLitigationInfoDesc) ? String(j.judicialLitigationInfoDesc).trim() : null,
  };
}

function buildShareholderTableBlock(info, blockKey = 'shareholderList') {
  const list = info?.shareholderList || [];
  const total = info?.shareholderTotal || {};
  return {
    blockKey,
    label: '股权结构',
    displayType: 'table',
    showIndex: true,
    columns: [
      { key: 'shareholderName', label: '股东名称' },
      { key: 'shareholderCapitalAmount', label: '出资额(万元)', align: 'right' },
      { key: 'holdStockRatio', label: '占比(%)', align: 'right' },
    ],
    rows: list.map((item) => ({
      shareholderName: dash(item.shareholderName),
      shareholderCapitalAmount: fmtAmount(item.shareholderCapitalAmount),
      holdStockRatio: dash(item.holdStockRatio),
    })),
    summary: list.length
      ? {
          index: '合计',
          shareholderCapitalAmount: fmtAmount(total.shareholderCapitalAmount),
          holdStockRatio: dash(total.holdStockRatio),
        }
      : undefined,
    emptyText: '暂无股权结构数据',
  };
}

function transformRelatedEnterprise(data) {
  const ac = data.associateCompany || data.associatedCompanyModule;
  if (!ac) return null;

  const synopsisList = ac.associatedCompanySynopsisList || [];
  const detailList = ac.associatedCompanyList || [];
  const blocks = [];

  if (synopsisList.length === 0 && detailList.length === 0) {
    return {
      moduleIndex: 9,
      moduleName: '关联企业信息',
      moduleKey: 'related_enterprise',
      blocks: [{
        blockKey: 'associatedCompanySynopsisList',
        label: '关联企业',
        displayType: 'empty',
        emptyText: '暂无关联企业',
      }],
    };
  }

  const synopsisItems = synopsisList.map((item) => {
    const isG = item.isGuarantor === '是';
    return {
      guarantorTag: isG ? '担保人' : '非担保人',
      guarantorTone: isG ? 'guarantor' : 'nonGuarantor',
      customerName: dash(item.customerName),
      crdntlsCode: dash(item.crdntlsCode),
      customerNo: item.customerNo || null,
    };
  });

  blocks.push({
    blockKey: 'associatedCompanySynopsisList',
    displayType: 'associateCompanySynopsis',
    items: synopsisItems,
  });

  const detailByNo = new Map();
  for (const d of detailList) {
    const no = d.baseInfo?.customerNo || d.customerNo;
    if (no) detailByNo.set(String(no), d);
  }

  const ordered = synopsisList.length
    ? synopsisList.map((s) => ({ synopsis: s, detail: detailByNo.get(String(s.customerNo)) })).filter((x) => x.detail)
    : detailList.map((d) => ({ synopsis: null, detail: d }));

  for (const { synopsis, detail } of ordered) {
    const base = detail.baseInfo || {};
    const customerNo = base.customerNo || synopsis?.customerNo || 'unknown';
    const isG = (synopsis?.isGuarantor === '是') || false;
    const guarantorTag = synopsis
      ? (isG ? '担保人' : '非担保人')
      : '非担保人';
    const relation = Array.isArray(detail.relationTypes)
      ? detail.relationTypes.filter(Boolean).join('、')
      : (Array.isArray(synopsis?.relationTypes) ? synopsis.relationTypes.filter(Boolean).join('、') : '');

    const childBlocks = [];
    childBlocks.push({
      blockKey: 'baseInfo',
      label: '基本信息',
      displayType: 'group',
      columns: 4,
      children: [
        { blockKey: 'customerName', label: '企业名称', displayType: 'direct', value: dash(base.customerName) },
        { blockKey: 'crdntlsCode', label: '统一社会信用代码', displayType: 'direct', value: dash(base.crdntlsCode) },
        { blockKey: 'legalRepresentative', label: '法定代表人', displayType: 'direct', value: dash(base.legalRepresentativeCustomerName) },
        { blockKey: 'actControlsName', label: '实际控制人', displayType: 'direct', value: dash(base.actControlsName) },
        { blockKey: 'estblshDate', label: '成立时间', displayType: 'direct', value: dash(base.estblshDate) },
        { blockKey: 'rgstrdCapital', label: '注册资本(万元)', displayType: 'direct', value: fmtAmount(base.rgstrdCapital) },
        { blockKey: 'industrySortLittle', label: '行业小类', displayType: 'direct', value: dash(base.pkIndustrySortLittle?.name) },
        { blockKey: 'employeeNum', label: '从业人数', displayType: 'direct', value: dash(base.employeeNum) },
        { blockKey: 'rgstrdAddress', label: '注册地址', displayType: 'direct', value: dash(base.rgstrdAddress), fullWidth: true },
        { blockKey: 'relationTypes', label: '与承租人关系', displayType: 'direct', value: relation ? relation : '—' },
        { blockKey: 'otherDesc', label: '其他关系说明', displayType: 'direct', value: dash(detail.otherDesc ?? synopsis?.otherDesc), fullWidth: true },
      ],
    });

    if (!isEmpty(base.mainBusiness)) {
      childBlocks.push({
        blockKey: 'mainBusiness',
        label: '主营业务',
        displayType: 'longText',
        value: base.mainBusiness,
      });
    }

    childBlocks.push(buildShareholderTableBlock(detail));

    if (!isEmpty(detail.controllerIntroduction)) {
      childBlocks.push({
        blockKey: 'controllerIntroduction',
        label: '实控人及股东情况介绍',
        displayType: 'longText',
        value: detail.controllerIntroduction,
      });
    }

    const lit = buildLitigationCardsFromInfo(detail.judicialLitigationInfo);
    childBlocks.push({
      blockKey: 'judicialLitigationInfo',
      label: '司法诉讼信息',
      displayType: 'litigationCards',
      updateTime: lit.updateTime,
      cards: lit.cards,
      emptyText: '客户暂无司法诉讼数据',
    });
    if (lit.desc) {
      childBlocks.push({
        blockKey: 'judicialLitigationInfoDesc',
        label: '司法诉讼信息说明',
        displayType: 'longText',
        value: lit.desc,
      });
    }

    blocks.push({
      blockKey: `company_${customerNo}`,
      displayType: 'associateCompanyDetail',
      guarantorTag,
      guarantorTone: isG ? 'guarantor' : 'nonGuarantor',
      customerName: dash(base.customerName || synopsis?.customerName),
      crdntlsCode: dash(base.crdntlsCode || synopsis?.crdntlsCode),
      childBlocks,
    });
  }

  return {
    moduleIndex: 9,
    moduleName: '关联企业信息',
    moduleKey: 'related_enterprise',
    blocks,
  };
}

function transformCreditEnhancement(data) {
  const ce = data.creditEnhancementMeasure;
  if (!ce) return null;

  const measureList = ce.creditEnhancementMeasureInfo?.creditEnhancementMeasureList || [];
  const persons = ce.guaranteePersonList || [];
  const companies = ce.guaranteeCompanyList || [];
  const blocks = [];

  blocks.push({
    blockKey: 'creditEnhancementMeasureList',
    label: '担保措施',
    displayType: 'measureList',
    emptyText: '暂无增信措施',
    items: buildCreditEnhancementItems(measureList),
  });

  if (persons.length) {
    blocks.push({
      blockKey: 'guaranteePersonTitle',
      label: '担保人信息',
      displayType: 'group',
      columns: 1,
      children: [],
    });

    for (const person of persons) {
      const childBlocks = [];
      childBlocks.push({
        blockKey: 'baseInfo',
        label: '基本信息',
        displayType: 'group',
        columns: 4,
        children: [
          { blockKey: 'customerName', label: '姓名', displayType: 'direct', value: dash(person.customerName) },
          { blockKey: 'crdntlsType', label: '证件类型', displayType: 'direct', value: dash(person.crdntlsType) },
          { blockKey: 'documentCode', label: '证件代码', displayType: 'direct', value: dash(person.documentCode) },
          { blockKey: 'relationship', label: '与承租人关系', displayType: 'direct', value: dash(person.relationship) },
          { blockKey: 'relationshipDesc', label: '与承租人关系说明', displayType: 'direct', value: dash(person.relationshipDesc) },
          { blockKey: 'assetDesc', label: '名下资产、市值与抵押情况', displayType: 'direct', value: dash(person.assetDesc), fullWidth: true },
        ],
      });

      const lit = buildLitigationCardsFromInfo(person.judicialLitigationInfo);
      childBlocks.push({
        blockKey: 'judicialLitigationInfo',
        label: '司法诉讼信息',
        displayType: 'litigationCards',
        updateTime: lit.updateTime,
        cards: lit.cards,
        emptyText: '客户暂无司法诉讼数据',
      });
      if (lit.desc) {
        childBlocks.push({
          blockKey: 'judicialLitigationInfoDesc',
          label: '司法诉讼信息说明',
          displayType: 'longText',
          value: lit.desc,
        });
      }

      const no = person.customerNo || person.customerName || 'unknown';
      blocks.push({
        blockKey: `guaranteePerson_${no}`,
        label: `担保自然人 - ${dash(person.customerName)}`,
        displayType: 'guaranteePersonDetail',
        childBlocks,
      });
    }
  }

  for (const company of companies) {
    const info = company.companyPublicInfo || {};
    const base = info.baseInfo || {};
    const childBlocks = [];
    childBlocks.push({
      blockKey: 'baseInfo',
      label: '基本信息',
      displayType: 'group',
      columns: 4,
      children: [
        { blockKey: 'customerName', label: '企业名称', displayType: 'direct', value: dash(base.customerName) },
        { blockKey: 'crdntlsCode', label: '统一社会信用代码', displayType: 'direct', value: dash(base.crdntlsCode) },
        { blockKey: 'legalRepresentative', label: '法定代表人', displayType: 'direct', value: dash(base.legalRepresentativeCustomerName) },
        { blockKey: 'actControlsName', label: '实际控制人', displayType: 'direct', value: dash(base.actControlsName) },
        { blockKey: 'estblshDate', label: '成立时间', displayType: 'direct', value: dash(base.estblshDate) },
        { blockKey: 'rgstrdCapital', label: '注册资本(万元)', displayType: 'direct', value: fmtAmount(base.rgstrdCapital) },
        { blockKey: 'industrySortLittle', label: '行业小类', displayType: 'direct', value: dash(base.pkIndustrySortLittle?.name) },
        { blockKey: 'employeeNum', label: '从业人数', displayType: 'direct', value: dash(base.employeeNum) },
        { blockKey: 'rgstrdAddress', label: '注册地址', displayType: 'direct', value: dash(base.rgstrdAddress), fullWidth: true },
      ],
    });

    childBlocks.push(buildShareholderTableBlock(info));

    if (!isEmpty(info.controllerIntroduction)) {
      childBlocks.push({
        blockKey: 'controllerIntroduction',
        label: '实控人及股东情况介绍',
        displayType: 'longText',
        value: info.controllerIntroduction,
      });
    }

    const lit = buildLitigationCardsFromInfo(info.judicialLitigationInfo);
    childBlocks.push({
      blockKey: 'judicialLitigationInfo',
      label: '司法诉讼信息',
      displayType: 'litigationCards',
      updateTime: lit.updateTime,
      cards: lit.cards,
      emptyText: '客户暂无司法诉讼数据',
    });
    if (lit.desc) {
      childBlocks.push({
        blockKey: 'judicialLitigationInfoDesc',
        label: '司法诉讼信息说明',
        displayType: 'longText',
        value: lit.desc,
      });
    }

    const no = base.customerNo || base.customerName || 'unknown';
    blocks.push({
      blockKey: `guaranteeCompany_${no}`,
      label: `担保企业 - ${dash(base.customerName)}`,
      displayType: 'guaranteeCompanyDetail',
      childBlocks,
    });
  }

  return {
    moduleIndex: 10,
    moduleName: '增信措施',
    moduleKey: 'credit_enhancement',
    blocks,
  };
}

function transformAllModules(data) {
  return [
    transformProjectChange(data),
    transformProjectSummary(data),
    transformCooperationHistory(data),
    // knowledge_graph skipped (L1 待编写)
    transformProjectBaseInfo(data),
    transformImplementationPlan(data),
    transformLeaseProperty(data),
    transformLesseeBaseInfo(data),
    transformRelatedEnterprise(data),
    transformCreditEnhancement(data),
    transformRevenueAnalysis(data),
    transformLiabilityAnalysis(data),
    transformKeyIndicators(data),
    transformKeyAccountFinancials(data),
    transformAnalysisResults(data),
    transformAttachments(data),
  ]
    .filter(Boolean)
    .sort((a, b) => a.moduleIndex - b.moduleIndex);
}

// ─── L2: HTML renderer ─────────────────────────────────────────────────────

function renderSectionTitle(label) {
  if (!label) return '';
  return `<div class="report-section-title">
    <span class="report-section-title__dot"></span>
    <span class="report-section-title__text">${escapeHtml(label)}</span>
  </div>`;
}

function renderKv(label, value, isPerson = false) {
  void isPerson;
  return `<div class="report-kv">
    <span class="report-kv__label">${escapeHtml(label)}：</span>
    <span class="report-kv__value">${escapeHtml(value)}</span>
  </div>`;
}

function renderDirect(block) {
  return `<div class="report-block">${renderKv(block.label, dash(block.value))}</div>`;
}

function renderLongText(block, inGrid = false) {
  const inner = `<div class="report-longtext">
    <div class="report-longtext__label">${escapeHtml(block.label)}：</div>
    <div class="report-longtext__value">${escapeHtml(dash(block.value))}</div>
  </div>`;
  if (inGrid) return `<div class="report-grid__cell report-grid__cell--w-100">${inner}</div>`;
  return `<div class="report-block report-longtext-block">${inner}</div>`;
}

function renderGroup(block) {
  const w = gridWidthClass(block.columns || 4);
  const title = block.label ? renderSectionTitle(block.label) : '';
  const hasChildren = block.children?.length > 0;
  const grid = hasChildren
    ? `<div class="report-grid">${block.children.map((child) => {
        if (child.displayType === 'longText') return renderLongText(child, true);
        const val = child.displayType === 'person' ? dash(child.name) : dash(child.value);
        const cellW = child.fullWidth ? 'report-grid__cell--w-100' : w;
        return `<div class="report-grid__cell ${cellW}">${renderKv(child.label, val)}</div>`;
      }).join('')}</div>`
    : '';
  return `<div class="report-block report-group">${title}${grid}</div>`;
}

function renderLabelPanel(block) {
  const cards = (block.panels || []).map((panel) => {
    const toneClass = panel.tone === 'negative' ? 'report-label-card--negative' : 'report-label-card--warning';
    const items = panel.items.map((it) => `<li>${escapeHtml(it)}</li>`).join('');
    return `<div class="report-label-card ${toneClass}">
      <div class="report-label-card__title">${escapeHtml(panel.label)}</div>
      <ul class="report-label-card__list">${items}</ul>
    </div>`;
  }).join('');
  return `<div class="report-block"><div class="report-label-panel">${cards}</div></div>`;
}

function cellValue(row, col) {
  const v = dash(row[col.key]);
  if (col.subKey && !isEmpty(row[col.subKey])) {
    return `${escapeHtml(v)}<span class="report-table__entity-sub">（征信查询日期: ${escapeHtml(row[col.subKey])}）</span>`;
  }
  return escapeHtml(v);
}

function computeMergeMeta(rows, col, stacked) {
  const skip = new Array(rows.length).fill(false);
  const rowspan = new Array(rows.length).fill(stacked ? 2 : 1);
  let i = 0;
  while (i < rows.length) {
    if (rows[i]._summary) {
      i += 1;
      continue;
    }
    const val = rows[i][col.key];
    if (isMergeEmpty(val)) {
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < rows.length && !rows[j]._summary && mergeCellValue(rows[j][col.key]) === mergeCellValue(val) && !isMergeEmpty(rows[j][col.key])) {
      j += 1;
    }
    const count = j - i;
    rowspan[i] = stacked ? count * 2 : count;
    for (let k = i + 1; k < j; k++) skip[k] = true;
    i = j;
  }
  return { skip, rowspan };
}

function renderStandardTable(block) {
  const { columns, rows, showIndex, summary } = block;
  const mergeMeta = {};
  columns.forEach((col) => {
    if (col.mergeSame) mergeMeta[col.key] = computeMergeMeta(rows, col, false);
  });

  let body = rows.map((row, ri) => {
    if (row._summary) {
      let cells = `<td colspan="3" class="report-table__cell--strong">${escapeHtml(dash(row.subjectName))}</td>`;
      columns.slice(3).forEach((col) => {
        cells += `<td class="${alignClass(col.align)} report-table__cell--strong">${cellValue(row, col)}</td>`;
      });
      return `<tr class="report-table__summary-row">${cells}</tr>`;
    }
    let cells = '';
    if (showIndex) cells += `<td>${ri + 1}</td>`;
    columns.forEach((col) => {
      const meta = mergeMeta[col.key];
      if (meta?.skip[ri]) return;
      const rs = meta?.rowspan[ri];
      const rsAttr = rs > 1 ? ` rowspan="${rs}"` : '';
      const cls = alignClass(col.align);
      const strong = summary && col.key in (summary || {}) ? ' report-table__cell--strong' : '';
      cells += `<td class="${cls}${strong}"${rsAttr}>${cellValue(row, col)}</td>`;
    });
    return `<tr>${cells}</tr>`;
  }).join('');

  if (summary) {
    let sumCells = '';
    if (showIndex) {
      sumCells += `<td class="report-table__cell--strong">${escapeHtml(dash(summary.index ?? '合计 --'))}</td>`;
    }
    columns.forEach((col) => {
      const v = summary[col.key] !== undefined ? summary[col.key] : '—';
      const strong = summary[col.key] !== undefined ? ' report-table__cell--strong' : '';
      sumCells += `<td class="${alignClass(col.align)}${strong}">${escapeHtml(v)}</td>`;
    });
    body += `<tr class="report-table__summary-row">${sumCells}</tr>`;
  }

  const head = `<thead><tr>${showIndex ? '<th>序号</th>' : ''}${columns.map((c) => `<th class="${alignClass(c.align)}">${escapeHtml(c.label)}</th>`).join('')}</tr></thead>`;
  return `<table class="report-table">${head}<tbody>${body}</tbody></table>`;
}

function buildStackPairs(columns) {
  const spanCols = columns.filter((c) => c.stackSpan);
  const pairCols = columns.filter((c) => !c.stackSpan);
  const pairs = [];
  for (let i = 0; i < pairCols.length; i += 2) {
    pairs.push([pairCols[i], pairCols[i + 1] || null]);
  }
  return { spanCols, pairs };
}

function renderStackedTable(block) {
  const { columns, rows, showIndex, summary } = block;
  const { spanCols, pairs } = buildStackPairs(columns);
  const mergeMeta = {};
  spanCols.forEach((col) => {
    if (col.mergeSame) mergeMeta[col.key] = computeMergeMeta(rows, col, true);
  });

  const headTop = [];
  const headBottom = [];
  if (showIndex) headTop.push(`<th rowspan="2">序号</th>`);
  spanCols.forEach((c) => { headTop.push(`<th rowspan="2" class="${alignClass(c.align)}">${escapeHtml(c.label)}</th>`); });
  pairs.forEach(([top, bottom]) => {
    headTop.push(`<th><span class="report-table__stack-label">${escapeHtml(top.label)}</span></th>`);
    headBottom.push(`<th><span class="report-table__stack-label">${escapeHtml(bottom?.label ?? '—')}</span></th>`);
  });

  let body = '';
  rows.forEach((row, ri) => {
    if (row._summary) {
      const topCells = [];
      const bottomCells = [];
      if (showIndex) {
        topCells.push(`<td rowspan="2" class="report-table__index-cell report-table__cell--strong">—</td>`);
      }
      topCells.push(`<td rowspan="2" colspan="${spanCols.length}" class="report-table__cell--strong">${escapeHtml(dash(row.subjectName))}</td>`);
      pairs.forEach(([top, bottom]) => {
        topCells.push(`<td class="report-table__cell--strong"><span class="report-table__stack-value">${cellValue(row, top)}</span></td>`);
        bottomCells.push(`<td class="report-table__cell--strong"><span class="report-table__stack-value">${bottom ? cellValue(row, bottom) : '—'}</span></td>`);
      });
      body += `<tr class="report-table__summary-row--top report-table__data-row--top">${topCells.join('')}</tr>`;
      body += `<tr class="report-table__summary-row--bottom report-table__data-row--bottom">${bottomCells.join('')}</tr>`;
      return;
    }

    const topCells = [];
    const bottomCells = [];

    if (showIndex) {
      topCells.push(`<td rowspan="2" class="report-table__index-cell">${ri + 1}</td>`);
    }

    spanCols.forEach((col) => {
      const meta = mergeMeta[col.key];
      if (meta?.skip[ri]) return;
      const rs = meta?.rowspan[ri] ?? 2;
      const spanCls = col.stackSpan ? ' report-table__span-cell' : '';
      topCells.push(`<td rowspan="${rs}" class="${alignClass(col.align)}${spanCls}">${cellValue(row, col)}</td>`);
    });

    pairs.forEach(([top, bottom]) => {
      topCells.push(`<td><span class="report-table__stack-value">${cellValue(row, top)}</span></td>`);
      bottomCells.push(`<td><span class="report-table__stack-value">${bottom ? cellValue(row, bottom) : '—'}</span></td>`);
    });

    body += `<tr class="report-table__data-row--top">${topCells.join('')}</tr>`;
    body += `<tr class="report-table__data-row--bottom report-table__record-divider">${bottomCells.join('')}</tr>`;
  });

  if (summary) {
    const topSum = [];
    const bottomSum = [];
    if (showIndex) topSum.push(`<td rowspan="2" class="report-table__index-cell report-table__cell--strong">${escapeHtml(dash(summary.index ?? '合计'))}</td>`);
    spanCols.forEach((col) => {
      const v = summary[col.key] !== undefined ? summary[col.key] : '—';
      topSum.push(`<td rowspan="2" class="${alignClass(col.align)} report-table__cell--strong report-table__span-cell">${escapeHtml(v)}</td>`);
    });
    pairs.forEach(([top, bottom]) => {
      const tv = summary[top.key] !== undefined ? summary[top.key] : '—';
      topSum.push(`<td class="report-table__cell--strong"><span class="report-table__stack-value">${escapeHtml(tv)}</span></td>`);
      const bv = bottom && summary[bottom.key] !== undefined ? summary[bottom.key] : '—';
      bottomSum.push(`<td class="report-table__cell--strong"><span class="report-table__stack-value">${escapeHtml(bv)}</span></td>`);
    });
    body += `<tr class="report-table__summary-row--top report-table__data-row--top">${topSum.join('')}</tr>`;
    body += `<tr class="report-table__summary-row--bottom report-table__data-row--bottom">${bottomSum.join('')}</tr>`;
  }

  return `<table class="report-table report-table--stacked">
    <thead>
      <tr class="report-table__head-row--top">${headTop.join('')}</tr>
      <tr class="report-table__head-row--bottom">${headBottom.join('')}</tr>
    </thead>
    <tbody>${body}</tbody>
  </table>`;
}

function renderTableBlock(block, nested = false) {
  const title = block.label && !nested ? renderSectionTitle(block.label) : '';
  if (!block.rows?.length) {
    const empty = `<div class="report-table-empty">${escapeHtml(block.emptyText || '暂无数据')}</div>`;
    if (nested) return title + empty;
    return `<div class="report-block report-table-block">${title}${empty}</div>`;
  }
  const table = block.columns.length > 8
    ? renderStackedTable(block)
    : renderStandardTable(block);
  if (nested) return title + table;
  return `<div class="report-block report-table-block">${title}${table}</div>`;
}

function renderEmpty(block) {
  return `<div class="report-block report-empty">
    ${renderSectionTitle(block.label)}
    <div class="report-empty__placeholder">${escapeHtml(block.emptyText || '暂无数据')}</div>
  </div>`;
}

function renderMeasureList(block) {
  if (!block.items?.length) {
    return `<div class="report-block report-measure-list">
      ${renderSectionTitle(block.label)}
      <div class="report-table-empty">${escapeHtml(block.emptyText || '暂无增信措施')}</div>
    </div>`;
  }

  const cards = block.items.map((item) => {
    const tone = item.guaranteeTone || 'default';
    const idLine = !isEmpty(item.crdntlsType) || !isEmpty(item.documentCode)
      ? `<span class="report-measure-card__id">${escapeHtml(dash(item.crdntlsType))}：${escapeHtml(dash(item.documentCode))}</span>`
      : '<span class="report-measure-card__id">—</span>';
    const rel = item.relationship
      ? `<span class="report-measure-card__rel">${escapeHtml(item.relationship)}</span>`
      : '';
    const attrs = item.attrs?.length
      ? `<div class="report-measure-card__attrs">${item.attrs.map((a) =>
          `<div class="report-measure-card__attr">
            <span class="report-measure-card__attr-label">${escapeHtml(a.label)}：</span>
            <span class="report-measure-card__attr-value">${escapeHtml(a.value)}</span>
          </div>`).join('')}</div>`
      : '';
    const collateral = item.collateral
      ? `<div class="report-measure-card__collateral">
          <div class="report-measure-card__collateral-title">${escapeHtml(item.collateral.label || '担保物')}</div>
          ${renderTableBlock({ ...item.collateral, displayType: 'table' }, true)}
        </div>`
      : '';
    return `<div class="report-measure-card">
      <div class="report-measure-card__head">
        <span class="report-measure-card__tag report-measure-card__tag--${tone}">${escapeHtml(item.guaranteeMethod)}</span>
        <span class="report-measure-card__name">${escapeHtml(item.customerName)}</span>
        ${rel}
        ${idLine}
      </div>
      ${attrs}
      ${collateral}
    </div>`;
  }).join('');

  return `<div class="report-block report-measure-list">
    ${renderSectionTitle(block.label)}
    <div class="report-measure-list__items">${cards}</div>
  </div>`;
}

function renderAnalysisList(block) {
  if (!block.items?.length) {
    return `<div class="report-block report-analysis-list">
      ${renderSectionTitle(block.label)}
      <div class="report-table-empty">${escapeHtml(block.emptyText || '暂无分析结果')}</div>
    </div>`;
  }

  const items = block.items.map((item) => {
    const entity = item.customerName
      ? `<div class="report-analysis-item__entity">
          <span class="report-analysis-item__entity-dot"></span>
          <span class="report-analysis-item__entity-name">${escapeHtml(item.customerName)}</span>
        </div>`
      : '';
    const conclusion = item.conclusion
      ? `<div class="report-md">${renderMarkdown(item.conclusion)}</div>`
      : '<div class="report-analysis-item__empty">—</div>';
    return `<div class="report-analysis-item">${entity}<div class="report-analysis-item__conclusion">${conclusion}</div></div>`;
  }).join('');

  return `<div class="report-block report-analysis-list">
    ${renderSectionTitle(block.label)}
    <div class="report-analysis-list__items">${items}</div>
  </div>`;
}

function renderLitigationCards(block) {
  const meta = block.updateTime
    ? `<span class="report-litigation-section__meta">司法诉讼数据更新时间：${escapeHtml(block.updateTime)}</span>`
    : '';
  const titleRow = `<div class="report-litigation-section__header">
    ${renderSectionTitle(block.label)}
    ${meta}
  </div>`;

  if (!block.cards?.length) {
    return `<div class="report-block report-litigation-section">
      ${titleRow}
      <div class="report-table-empty">${escapeHtml(block.emptyText || '客户暂无司法诉讼数据')}</div>
    </div>`;
  }

  const cards = block.cards.map((item) => {
    const tone = item.tone === 'highRisk' ? 'highRisk' : 'common';
    return `<div class="report-litigation-card report-litigation-card--${tone}">
      <span class="report-litigation-card__num">${escapeHtml(String(item.caseNum))}</span>
      <span class="report-litigation-card__type">${escapeHtml(item.caseType)}</span>
    </div>`;
  }).join('');

  return `<div class="report-block report-litigation-section">${titleRow}<div class="report-litigation-grid">${cards}</div></div>`;
}

function renderAttachmentSections(block) {
  const sections = (block.sections || []).map((section) => {
    const files = (section.files || []).map((file) => `
      <div class="report-attachment-card">
        <div class="report-attachment-card__name">${escapeHtml(dash(file.fileName))}</div>
        <div class="report-attachment-card__meta">文件类型：${escapeHtml(dash(file.documentType))}</div>
        <div class="report-attachment-card__meta">上传时间：${escapeHtml(dash(file.uploadTime))}</div>
      </div>`).join('');
    const grid = files
      ? `<div class="report-attachment-grid">${files}</div>`
      : '';
    return `<div class="report-attachment-section">
      <div class="report-attachment-section__head">
        <span class="report-attachment-section__title">${escapeHtml(section.modelName)}</span>
        <span class="report-attachment-section__desc">${escapeHtml(section.documentDirDesc || '')}</span>
      </div>
      ${grid}
    </div>`;
  }).join('');

  return `<div class="report-block report-attachment-sections">${sections}</div>`;
}

function renderFsSubjectHeader(block) {
  const source = block.dataSource
    ? `<span class="report-fs-subject-header__source">数据来源：${escapeHtml(block.dataSource)}</span>`
    : '';
  return `<div class="report-block">
    <div class="report-fs-subject-header">
      <span class="report-fs-subject-header__title">${escapeHtml(dash(block.title))}</span>
      ${source}
    </div>
  </div>`;
}

function renderFinancialStatementTable(block) {
  const caption = `<div class="report-fs-table-block__caption">
    <span class="report-fs-table-block__title">${escapeHtml(block.label || '')}</span>
    <span class="report-fs-table-block__unit">${escapeHtml(block.unit || '单位：元')}</span>
  </div>`;

  if (!block.rows?.length || !block.periods?.length) {
    return `<div class="report-block report-fs-table-block">
      ${caption}
      <div class="report-table-empty">${escapeHtml(block.emptyText || '暂无数据')}</div>
    </div>`;
  }

  const head = `<thead><tr>
    <th>科目名称</th>
    ${block.periods.map((p) => `<th class="report-fs-table__period"><span class="report-fs-table__period-label">${escapeHtml(p.period)}${p.dataType && p.dataType !== '—' ? `<span class="report-fs-table__data-type">${escapeHtml(p.dataType)}</span>` : ''}</span></th>`).join('')}
  </tr></thead>`;

  const body = block.rows.map((row) => {
    const level = row.rowLevel === 1 || row.rowLevel === 2 ? row.rowLevel : 3;
    const accountCls = level === 3 ? 'report-fs-table__account report-fs-table__account--l3' : 'report-fs-table__account';
    const cells = block.periods.map((p) =>
      `<td class="report-fs-table__value">${escapeHtml(dash(row.values?.[p.period]))}</td>`
    ).join('');
    return `<tr class="report-fs-table__row--l${level}">
      <td class="${accountCls}">${escapeHtml(row.accountName)}</td>
      ${cells}
    </tr>`;
  }).join('');

  return `<div class="report-block report-fs-table-block">
    ${caption}
    <table class="report-fs-table">${head}<tbody>${body}</tbody></table>
  </div>`;
}


function renderAssociateCompanySynopsis(block) {
  const items = block.items || [];
  if (!items.length) {
    return `<div class="report-block report-table-empty">${escapeHtml(block.emptyText || '暂无关联企业')}</div>`;
  }
  const cards = items.map((item) => {
    const tone = item.guarantorTone === 'guarantor' ? 'guarantor' : 'nonGuarantor';
    return `<div class="report-associate-synopsis__card">
      <span class="report-associate-tag report-associate-tag--${tone}"><span>${escapeHtml(item.guarantorTag || '')}</span></span>
      <span class="report-associate-synopsis__name">${escapeHtml(dash(item.customerName))}</span>
      <span class="report-associate-synopsis__id">统一社会信用代码：${escapeHtml(dash(item.crdntlsCode))}</span>
    </div>`;
  }).join('');
  return `<div class="report-block report-associate-synopsis">${cards}</div>`;
}

function renderAssociateCompanyDetail(block) {
  const tone = block.guarantorTone === 'guarantor' ? 'guarantor' : 'nonGuarantor';
  const tag = block.guarantorTag
    ? `<span class="report-associate-tag report-associate-tag--${tone}"><span>${escapeHtml(block.guarantorTag)}</span></span>`
    : '';
  const header = `<div class="report-associate-detail__header">
    ${tag}
    <span class="report-associate-detail__title">${escapeHtml(dash(block.customerName))}</span>
    <span class="report-associate-detail__id">统一社会信用代码：${escapeHtml(dash(block.crdntlsCode))}</span>
  </div>`;
  const body = (block.childBlocks || []).map(renderBlock).join('');
  return `<div class="report-block report-associate-detail">${header}${body}</div>`;
}

function renderGuaranteeDetail(block) {
  const header = block.label
    ? `<div class="report-guarantee-detail__header"><span class="report-guarantee-detail__title">${escapeHtml(block.label)}</span></div>`
    : '';
  const body = (block.childBlocks || []).map(renderBlock).join('');
  return `<div class="report-block report-guarantee-detail">${header}${body}</div>`;
}

function renderBlock(block) {
  switch (block.displayType) {
    case 'direct':
      return renderDirect(block);
    case 'person':
      return renderDirect({ ...block, value: dash(block.name) });
    case 'longText':
      return renderLongText(block);
    case 'group':
      return renderGroup(block);
    case 'table':
      return renderTableBlock(block);
    case 'empty':
      return renderEmpty(block);
    case 'measureList':
      return renderMeasureList(block);
    case 'analysisList':
      return renderAnalysisList(block);
    case 'labelPanel':
      return renderLabelPanel(block);
    case 'litigationCards':
      return renderLitigationCards(block);
    case 'attachmentSections':
      return renderAttachmentSections(block);
    case 'fsSubjectHeader':
      return renderFsSubjectHeader(block);
    case 'financialStatementTable':
      return renderFinancialStatementTable(block);
    case 'associateCompanySynopsis':
      return renderAssociateCompanySynopsis(block);
    case 'associateCompanyDetail':
      return renderAssociateCompanyDetail(block);
    case 'guaranteePersonDetail':
    case 'guaranteeCompanyDetail':
      return renderGuaranteeDetail(block);
    default:
      return '';
  }
}

function renderModule(mod) {
  const meta = mod.updateTime
    ? `<span class="report-module__header-meta">数据更新时间 ${escapeHtml(mod.updateTime)}</span>`
    : '';
  const body = mod.blocks.map(renderBlock).join('');
  return `<div class="report-module" data-module-key="${escapeHtml(mod.moduleKey)}">
    <div class="report-module__header">
      <span>${escapeHtml(mod.moduleName)}</span>
      ${meta}
    </div>
    <div class="report-module__body">${body}</div>
  </div>`;
}

function renderReport(modules, css) {
  const mods = modules.map(renderModule).join('');
  return `<style>\n${css}\n</style>\n<div class="report-root">\n${mods}\n</div>\n`;
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  const raw = JSON.parse(fs.readFileSync(MOCK_PATH, 'utf8'));
  const expected = [
    'project_change',
    'project_summary',
    'cooperation_history',
    'project_base_info',
    'implementation_plan',
    'lease_property',
    'lessee_base_info',
    'related_enterprise',
    'credit_enhancement',
    'revenue_analysis',
    'liability_analysis',
    'key_indicators',
    'key_account_financials',
    'analysis_results',
    'attachments',
  ];
  const modules = transformAllModules(raw);
  const present = modules.map((m) => m.moduleKey);
  const skipped = expected.filter((k) => !present.includes(k));
  const css = extractBaseCss();
  const html = renderReport(modules, css);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, html, 'utf8');

  const lineCount = html.split('\n').length;
  console.log(`Generated: ${OUTPUT_PATH}`);
  console.log(`Modules (${modules.length}): ${present.join(', ')}`);
  if (skipped.length) console.log(`Skipped (missing data / L1): ${skipped.join(', ')}`);
  else console.log('Skipped (missing data / L1): none');
  console.log(`Lines: ${lineCount}`);
}

main();
