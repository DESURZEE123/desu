# 工作记录追踪器

这是从 `app.html` 迁移出来的 Next.js + Supabase 版本，保留了原来的核心功能：

- 登录/注册
- 新增、编辑、删除工作记录
- 首页总收益
- 月度汇总
- 月详情按天分组
- 服务端 API：`/api/records`、`/api/records/[id]`

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

然后把 Supabase 项目的 URL 和 anon key 填到 `.env.local`。

## 数据库

打开 Supabase 项目的 SQL Editor，执行：

```sql
-- supabase/schema.sql
```

完整 SQL 在 `supabase/schema.sql`。

## Cloudflare 部署

```bash
npm run cf:build
npm run cf:preview
npm run cf:deploy
```

在 Cloudflare/Workers 环境变量里配置：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
