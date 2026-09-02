# HTML 转 PDF 工具

将 `../html` 下的尽调报告 HTML（完整文档或 `style` + 片段）渲染为 PDF，供 `prjc_integrate_report` 流程末端使用。

## 环境要求

- Node.js 18+
- 首次使用需安装依赖与 Chromium

## 安装

```bash
cd PRD/生成pdf报告/Tools
npm install
npx playwright install chromium
```

## 使用

### 转换单个文件

```bash
npm run pdf -- ../html/小企业prjc-slb.html
```

指定输出路径：

```bash
node html-to-pdf.mjs ../html/小企业prjc-slb.html -o ../pdf/小企业.pdf
```

### 批量转换 html 目录

```bash
npm run pdf:all
```

输出默认写入 `../pdf/`。

### 从标准输入读取

```bash
cat ../html/小企业prjc-slb.html | node html-to-pdf.mjs --stdin -o ../pdf/小企业.pdf
```

## 行为说明

| 项 | 说明 |
| --- | --- |
| HTML 片段 | 自动包裹 `<!DOCTYPE html>` + `head` + `body`，与 `prjc_style_render` 约定一致 |
| 页面尺寸 | A4 横版（`landscape: true`）；加 `--portrait` 可切回竖版 |
| 背景色 | `printBackground: true`，保留模块标题底色等样式 |
| 边距 | 上下左右 12mm |
| 网络图片 | 默认 `load` 后即导出；内网图片不可达时不会阻塞。可用 `--network-idle` 等待全部资源 |
| 本地资源 | 以 HTML 文件所在目录为 `baseURL`，支持相对路径图片 |

## 目录结构

```text
PRD/生成pdf报告/
├── html/          # 输入 HTML
├── pdf/           # 默认输出 PDF（运行后生成）
└── Tools/         # 本工具
    ├── html-to-pdf.mjs
    ├── package.json
    └── README.md
```
