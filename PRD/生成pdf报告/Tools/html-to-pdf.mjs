#!/usr/bin/env node

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_DIR = path.join(ROOT_DIR, 'html');
const PDF_DIR = path.join(ROOT_DIR, 'pdf');

const DEFAULT_PDF_OPTIONS = {
  format: 'A4',
  landscape: true,
  printBackground: true,
  margin: {
    top: '5.5mm',
    right: '5mm',
    bottom: '5mm',
    left: '5mm',
  },
};

function printHelp() {
  console.log(`用法:
  node html-to-pdf.mjs <input.html> [-o output.pdf]
  node html-to-pdf.mjs --all [-o output-dir]
  node html-to-pdf.mjs --stdin [-o output.pdf]

说明:
  将 HTML（完整文档或 style + 片段）渲染为 PDF。
  片段会自动包裹为完整 HTML 文档，与 prjc_style_render 约定一致。

选项:
  -o, --output   输出 PDF 路径或目录（默认: ../pdf/<文件名>.pdf）
  --all          转换 ../html 目录下全部 .html
  --stdin        从标准输入读取 HTML
  --portrait     竖版打印（默认横版）
  --network-idle 等待网络空闲（远程图片较多且网络稳定时使用）
  -h, --help     显示帮助

示例:
  npm run pdf -- ../html/小企业prjc-slb.html
  npm run pdf:all
  node html-to-pdf.mjs ../html/小企业prjc-slb.html -o ../pdf/小企业.pdf
`);
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    input: null,
    output: null,
    all: false,
    stdin: false,
    help: false,
    waitUntil: 'domcontentloaded',
    landscape: true,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '--all') {
      options.all = true;
    } else if (arg === '--stdin') {
      options.stdin = true;
    } else if (arg === '--network-idle') {
      options.waitUntil = 'networkidle';
    } else if (arg === '--portrait') {
      options.landscape = false;
    } else if (arg === '-o' || arg === '--output') {
      options.output = args[i + 1];
      i += 1;
    } else if (!arg.startsWith('-')) {
      options.input = arg;
    } else {
      throw new Error(`未知参数: ${arg}`);
    }
  }

  return options;
}

function isFullHtmlDocument(content) {
  const trimmed = content.trim();
  return /^<!doctype html>/i.test(trimmed) || /<html[\s>]/i.test(trimmed);
}

function wrapHtmlFragment(content) {
  if (isFullHtmlDocument(content)) {
    return content;
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>尽调报告</title>
</head>
<body>
${content.trim()}
</body>
</html>`;
}

function resolveInputPath(input) {
  const resolved = path.resolve(process.cwd(), input);
  if (!fs.existsSync(resolved)) {
    throw new Error(`输入文件不存在: ${resolved}`);
  }
  return resolved;
}

function resolveOutputPath(inputPath, output) {
  if (output) {
    return path.resolve(process.cwd(), output);
  }

  const baseName = path.basename(inputPath, path.extname(inputPath));
  return path.join(PDF_DIR, `${baseName}.pdf`);
}

function listHtmlFiles(dir) {
  if (!fs.existsSync(dir)) {
    throw new Error(`HTML 目录不存在: ${dir}`);
  }

  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.html'))
    .map((name) => path.join(dir, name))
    .sort();
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function renderPdf({ html, baseDir, outputPath, pdfOptions = {}, waitUntil = 'domcontentloaded' }) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(30_000);

  try {
    await page.route('**/*', async (route) => {
      const request = route.request();
      if (request.resourceType() === 'image') {
        await route.continue().catch(() => route.abort());
        return;
      }
      await route.continue();
    });

    await page.setContent(wrapHtmlFragment(html), {
      waitUntil,
      baseURL: `${pathToFileURL(path.resolve(baseDir)).href}/`,
    });

    await page.waitForTimeout(300);
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: outputPath,
      ...DEFAULT_PDF_OPTIONS,
      ...pdfOptions,
    });
  } finally {
    await browser.close();
  }
}

async function convertFile(inputPath, outputPath, waitUntil, landscape) {
  const html = fs.readFileSync(inputPath, 'utf8');
  await renderPdf({
    html,
    baseDir: path.dirname(inputPath),
    outputPath,
    waitUntil,
    pdfOptions: { landscape },
  });
  console.log(`已生成: ${outputPath}`);
}

async function convertAll(outputDir, waitUntil, landscape) {
  const files = listHtmlFiles(HTML_DIR);
  if (files.length === 0) {
    console.log(`未找到 HTML 文件: ${HTML_DIR}`);
    return;
  }

  const targetDir = outputDir ? path.resolve(process.cwd(), outputDir) : PDF_DIR;
  fs.mkdirSync(targetDir, { recursive: true });

  for (const inputPath of files) {
    const outputPath = path.join(
      targetDir,
      `${path.basename(inputPath, '.html')}.pdf`,
    );
    await convertFile(inputPath, outputPath, waitUntil, landscape);
  }
}

async function main() {
  const options = parseArgs(process.argv);

  if (options.help) {
    printHelp();
    return;
  }

  if (options.all) {
    await convertAll(options.output, options.waitUntil, options.landscape);
    return;
  }

  if (options.stdin) {
    const html = await readStdin();
    const outputPath = resolveOutputPath('stdin.html', options.output);
    await renderPdf({
      html,
      baseDir: process.cwd(),
      outputPath,
      waitUntil: options.waitUntil,
      pdfOptions: { landscape: options.landscape },
    });
    console.log(`已生成: ${outputPath}`);
    return;
  }

  if (!options.input) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const inputPath = resolveInputPath(options.input);
  const outputPath = resolveOutputPath(inputPath, options.output);
  await convertFile(inputPath, outputPath, options.waitUntil, options.landscape);
}

main().catch((error) => {
  console.error(`转换失败: ${error.message}`);
  process.exitCode = 1;
});
