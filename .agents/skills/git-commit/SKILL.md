---
name: git-commit
description: |
  按 Conventional Commits 规范生成 commit 并提交。当用户说"提交代码"、"commit 一下"、"帮我提交"、"git commit"、"打个 commit"时触发。
  流程：先 git pull 同步远端 → 有冲突则停下让用户确认 → 分析改动 → 自动 stage → 生成符合 Conventional Commits 的 message → 提交 → 显示 status 确认。
  不适用于：创建 PR（用 gh pr create）、push 到远端（除非用户明确要求）、amend 已有 commit。
---

# git-commit：规范化提交流程

## 触发关键词
"提交"、"commit"、"打 commit"、"git commit"、"帮我提交一下"

## 工作流（严格按顺序执行）

### 步骤 1：拉取远端（git pull）

```bash
git pull
```

- 如果 pull 成功无冲突 → 继续步骤 2
- **如果有冲突**：
  - **立刻停下**，不要自动 merge，不要执行任何 `git checkout --`、`git reset --hard`、`git restore` 等破坏性命令
  - 列出冲突文件清单
  - 对每个冲突文件，展示冲突段落（`<<<<<<<` / `=======` / `>>>>>>>` 之间的内容）
  - 用一两句话分析：本地改动想做什么、远端改动想做什么、推荐的解决方向
  - **等待用户确认**解决方案后，再动手修改
  - 解决完冲突后 `git add` 冲突文件，然后继续步骤 2

### 步骤 2：分析改动

并行执行（一个消息里多个 Bash 调用）：
- `git status`（不要用 `-uall`）
- `git diff`（已暂存 + 未暂存）
- `git log --oneline -10`（参考本仓库 commit 风格）

读 diff 时关注：
- 改动的本质（新功能 / 修 bug / 重构 / 文档 / 配置 / 测试）
- 是否涉及多个独立逻辑（如果是，建议拆成多个 commit 并征求用户意见）
- 是否包含敏感文件（`.env`、`credentials.*`、密钥、token）→ 警告用户

### 步骤 3：stage 文件

- **按文件名 add**，不要用 `git add -A` 或 `git add .`（避免误加敏感文件 / 大型二进制）
- 如已有部分 staged 文件，确认是否一起提交

### 步骤 4：生成 commit message（Conventional Commits）

格式：
```
<type>(<scope>): <subject>

<body 可选>
```

**type** 必须是以下之一：

| type     | 用途                          |
|----------|-------------------------------|
| feat     | 新功能                        |
| fix      | 修 bug                        |
| docs     | 仅文档                        |
| style    | 格式（不影响代码逻辑）        |
| refactor | 重构（非新功能、非修 bug）    |
| perf     | 性能优化                      |
| test     | 测试相关                      |
| build    | 构建系统 / 依赖               |
| ci       | CI 配置                       |
| chore    | 杂项（不影响 src / test）     |
| revert   | 回退之前的 commit             |

**scope**（可选）：模块名 / 目录名 / 功能名，全小写，如 `feat(auth): ...`

**subject** 规则：
- 祈使语气、现在时（"add" 不是 "added"）
- 首字母小写
- 句末不加句号
- 控制在 72 字符内

**body**（可选，复杂改动才需要）：
- 与 subject 空一行
- 解释 **why**（动机、背景、权衡），而非 **what**（diff 已经说明了 what）
- 每行 ≤ 72 字符

用 HEREDOC 传入以保证格式：
```bash
git commit -m "$(cat <<'EOF'
feat(auth): support email-based login

EOF
)"
```

### 步骤 5：验证

执行 `git status` 确认 working tree clean、commit 成功。

## 重要约束

- **绝不带 Co-Authored-By 署名**（用户明确要求）
- **绝不 `--amend`** 已有 commit（除非用户明确要求）
- **绝不 `--no-verify`** 跳过 hook（除非用户明确要求）
- **绝不 `git push`**（除非用户明确要求）
- pre-commit hook 失败时：修问题 → 重新 add → 创建**新** commit，不要 amend
- 如果没有任何改动，告诉用户"无可提交内容"，不要创建空 commit

## 示例

### 单一改动
```
fix(login): handle empty password input

When the password field is empty, the form previously
submitted an empty string to the API instead of blocking
submission. Now we validate on the client side.
```

### 简单改动（无需 body）
```
docs: fix typo in README
```

### 多模块改动
```
refactor(api): extract request retry logic into shared util
```
