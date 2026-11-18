# 生成 PDF 报告 · Tools

本目录存放 **可执行工具** 与 **Agent 生成方法**，与 `../小企业/` Skills 配合使用。

| 文件 | 作用 |
| ---- | ---- |
| [json-to-html.md](./json-to-html.md) | **JSON → HTML 生成方法（Playbook）**：并行出片段 → assemble → 可选 PDF |
| [assemble-html.py](./assemble-html.py) | 抽取 L2 样式 + 合并扩展 CSS + 按 moduleIndex 汇总完整 HTML |
| [report-style.supplements.css](./report-style.supplements.css) | L2 §4.2 尚未收录的扩展样式（labelPanel / 财报表 / 涉诉卡等） |
| [html-to-pdf.mjs](./html-to-pdf.mjs) | Playwright 将 HTML 打成横版 A4 PDF |

## 最短路径

```bash
# 1) Agent 按 json-to-html.md 生成 html/_fragments_*/0x_*.html
# 2) 汇总
python3 assemble-html.py \
  --json ../json数据/你的数据.json \
  --fragments ../html/_fragments_xxx \
  --output ../html/你的报告.html

# 3) 转 PDF（可选）
node html-to-pdf.mjs ../html/你的报告.html
```

业务字段与展示规则以 `../小企业/` 下 L0/L1/L2 文档为准；本目录不替代 Skills。
